import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { errorResponse } from '@/lib/api/response'

/**
 * POST /api/v1/ai/chat
 * 
 * BFF route for Río AI Chat. Proxies the SSE stream from Mastra (running on Railway)
 * back to the client using Vercel AI SDK compatible `0:"message"` text formatting.
 * 
 * Flow:
 * 1. Authenticate user via Supabase Server Client.
 * 2. Extract tenant ID.
 * 3. Forward the request to the Railway Mastra endpoint.
 * 4. Transform the Mastra SSE stream format -> Vercel AI SDK stream format.
 */
export async function POST(req: NextRequest) {
    try {
        // 1. Authenticate and extract tenant
        const supabase = await createServerClient()
        const { data: { user }, error: authError } = await supabase.auth.getUser()

        if (authError || !user) {
            return NextResponse.json(
                { success: false, error: { message: 'Unauthorized', code: 'UNAUTHORIZED' } },
                { status: 401 }
            )
        }

        // We assume the user metadata holds the tenant_id or we get it from the request body if they belong to multiple
        // For this spike, we'll try to extract from the request or fallback to parsing from user app_metadata 
        const body = await req.json().catch(() => ({}))
        const tenantId = body.tenantId || user.app_metadata?.tenant_id

        if (!tenantId) {
            return NextResponse.json(
                { success: false, error: { message: 'Tenant ID required', code: 'BAD_REQUEST' } },
                { status: 400 }
            )
        }

        const messages = body.messages || []

        // 2. Forward to Railway
        const railwayUrl = process.env.RIO_RAILWAY_URL || 'http://localhost:3001' // Default to local mastra dev server

        const response = await fetch(`${railwayUrl}/chat`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                // We'll pass the tenantId and userId to the Mastra agent securely via headers or body
                'x-tenant-id': tenantId,
                'x-user-id': user.id
            },
            body: JSON.stringify({ messages })
        })

        if (!response.ok || !response.body) {
            throw new Error(`Railway agent returned ${response.status}`)
        }

        // 3. Transform Stream for Vercel AI SDK
        // Mastra returns `data: {"token":"..."}` (as seen in our mock in index.ts)
        // Vercel AI SDK `DefaultChatTransport` expects SSE chunks matching `uiMessageChunkSchema`
        // e.g., `data: {"type":"text-delta","delta":"..."}`

        let buffer = ''
        let hasStarted = false
        const msgId = 'msg-' + Date.now().toString()

        const transformStream = new TransformStream({
            transform(chunk, controller) {
                const text = new TextDecoder().decode(chunk)
                buffer += text

                const lines = buffer.split('\n')
                buffer = lines.pop() || '' // Keep the last incomplete line in the buffer

                for (const line of lines) {
                    if (line.trim() === '') continue
                    if (line.startsWith('data: ')) {
                        const dataStr = line.slice(6)
                        if (dataStr === '[DONE]') {
                            controller.enqueue(new TextEncoder().encode(`data: [DONE]\n\n`))
                            continue
                        }

                        try {
                            const data = JSON.parse(dataStr)
                            if (data.token) {
                                if (!hasStarted) {
                                    hasStarted = true
                                    const startData = {
                                        type: 'text-start',
                                        id: msgId
                                    }
                                    controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify(startData)}\n\n`))
                                }

                                // Vercel AI format for uiMessageChunkSchema
                                const chunkData = {
                                    type: 'text-delta',
                                    id: msgId,
                                    delta: data.token
                                }
                                controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify(chunkData)}\n\n`))
                            }
                        } catch (e) {
                            console.error('Failed to parse Mastra chunk', dataStr)
                        }
                    }
                }
            },
            flush(controller) {
                if (buffer.trim() !== '') {
                    // process any remaining buffer
                    if (buffer.startsWith('data: ')) {
                        const dataStr = buffer.slice(6)
                        if (dataStr !== '[DONE]') {
                            try {
                                const data = JSON.parse(dataStr)
                                if (data.token) {
                                    if (!hasStarted) {
                                        hasStarted = true
                                        const startData = {
                                            type: 'text-start',
                                            id: msgId
                                        }
                                        controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify(startData)}\n\n`))
                                    }
                                    const chunkData = {
                                        type: 'text-delta',
                                        id: msgId,
                                        delta: data.token
                                    }
                                    controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify(chunkData)}\n\n`))
                                }
                            } catch (e) {
                                // ignore
                            }
                        }
                    }
                }
            }
        })

        const stream = response.body.pipeThrough(transformStream)

        // 4. Return SSE stream
        return new NextResponse(stream, {
            headers: {
                'Content-Type': 'text/event-stream',
                'Cache-Control': 'no-cache',
                'Connection': 'keep-alive',
            },
        })

    } catch (error) {
        console.error('[API/v1/ai/chat] Error:', error)
        if (error instanceof Error) {
            return errorResponse(error)
        }
        return errorResponse(new Error('An unexpected error occurred streaming the response'))
    }
}
