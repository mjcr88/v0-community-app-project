"use client"

import React, { useState, useRef, useEffect } from "react"
import { formatDistanceToNow } from "date-fns"
import { motion, AnimatePresence } from "framer-motion"
import { Send, User, Shield, MessageCircle } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import type { Comment } from "@/lib/data/resident-requests"
import { addRequestComment } from "@/app/actions/resident-requests"
import { toast } from "sonner"

interface RequestCommentsProps {
    requestId: string
    tenantId: string
    tenantSlug: string
    initialComments: Comment[]
    currentUserId: string
    isAdmin?: boolean
}

export function RequestComments({
    requestId,
    tenantId,
    tenantSlug,
    initialComments = [],
    currentUserId,
    isAdmin = false,
}: RequestCommentsProps) {
    const [comments, setComments] = useState<Comment[]>(initialComments)
    const [newComment, setNewComment] = useState("")
    const [isSubmitting, setIsSubmitting] = useState(false)
    const scrollRef = useRef<HTMLDivElement>(null)

    // Auto-scroll to bottom when new comments arrive
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollIntoView({ behavior: "smooth" })
        }
    }, [comments])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!newComment.trim() || isSubmitting) return

        setIsSubmitting(true)
        try {
            const result = await addRequestComment(requestId, tenantId, tenantSlug, newComment)

            if (result.success && result.comment) {
                setComments((prev) => [...prev, result.comment as Comment])
                setNewComment("")
                toast.success("Comment added")
            } else {
                toast.error(result.error || "Failed to add comment")
            }
        } catch (error) {
            toast.error("An unexpected error occurred")
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <Card className="flex flex-col min-h-[300px] max-h-[600px] border shadow-sm mt-4">
            <CardHeader className="px-4 py-3 border-b bg-muted/20 shrink-0">
                <CardTitle className="flex items-center gap-2 text-base font-semibold">
                    <MessageCircle className="w-4 h-4 text-primary" />
                    Conversation Thread
                </CardTitle>
            </CardHeader>

            <CardContent className="flex-1 p-0 overflow-hidden bg-muted/5">
                <ScrollArea className="h-full">
                    <div className="flex flex-col gap-4 p-4">
                        {comments.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground text-center">
                                <MessageCircle className="w-10 h-10 mb-3 text-muted/60" />
                                <p className="text-foreground font-medium">No messages yet</p>
                                <p className="text-sm">Start the conversation below.</p>
                            </div>
                        ) : (
                            <AnimatePresence initial={false}>
                                {comments.map((comment, index) => {
                                    const isMe = comment.author_id === currentUserId
                                    const isAuthorStaff = !isMe && comment.author?.id !== currentUserId && isAdmin

                                    return (
                                        <motion.div
                                            key={comment.id}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className={`flex gap-3 ${isMe ? "flex-row-reverse" : "flex-row"}`}
                                        >
                                            <Avatar className="w-8 h-8 border shadow-sm shrink-0">
                                                <AvatarImage src={comment.author?.profile_picture_url || ""} />
                                                <AvatarFallback>
                                                    <User className="w-4 h-4" />
                                                </AvatarFallback>
                                            </Avatar>

                                            <div className={`flex flex-col max-w-[80%] ${isMe ? "items-end" : "items-start"}`}>
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="text-xs font-semibold">
                                                        {isMe ? "You" : `${comment.author?.first_name} ${comment.author?.last_name}`}
                                                    </span>
                                                    {isAuthorStaff && (
                                                        <Badge variant="secondary" className="px-1 py-0 text-[10px] uppercase tracking-wider">
                                                            Staff
                                                        </Badge>
                                                    )}
                                                    <span className="text-[10px] text-muted-foreground">
                                                        {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                                                    </span>
                                                </div>

                                                <div
                                                    className={`rounded-2xl px-4 py-2 text-sm shadow-sm ${isMe
                                                        ? "bg-primary text-primary-foreground rounded-tr-none"
                                                        : "bg-muted text-foreground rounded-tl-none"
                                                        }`}
                                                >
                                                    {comment.content}
                                                </div>
                                            </div>
                                        </motion.div>
                                    )
                                })}
                            </AnimatePresence>
                        )}
                        <div ref={scrollRef} />
                    </div>
                </ScrollArea>
            </CardContent>

            <CardFooter className="p-3 border-t bg-background mt-auto">
                <form onSubmit={handleSubmit} className="flex flex-col w-full gap-2">
                    <div className="relative">
                        <Textarea
                            placeholder="Write a message..."
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            className="resize-none min-h-[80px] pr-12 focus-visible:ring-primary/20 transition-all border-muted"
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault()
                                    handleSubmit(e)
                                }
                            }}
                        />
                        <Button
                            size="icon"
                            type="submit"
                            disabled={isSubmitting || !newComment.trim()}
                            className="absolute right-2 bottom-2 rounded-full h-8 w-8 transition-transform active:scale-95"
                        >
                            <Send className="w-4 h-4" />
                        </Button>
                    </div>
                    <p className="text-[10px] text-muted-foreground px-1">
                        Press Enter to send, Shift + Enter for new line.
                    </p>
                </form>
            </CardFooter>
        </Card>
    )
}
