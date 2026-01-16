'use client'

import { usePathname, useSearchParams } from 'next/navigation'
import { useEffect, Suspense } from 'react'
import { initPostHog, posthog } from '@/lib/posthog'

/**
 * Component to track page views in the App Router
 * Wrapped in Suspense because useSearchParams can cause hydration issues
 */
function PostHogPageView() {
    const pathname = usePathname()
    const searchParams = useSearchParams()

    useEffect(() => {
        if (pathname) {
            let url = window.origin + pathname
            if (searchParams?.toString()) {
                url += `?${searchParams.toString()}`
            }
            posthog.capture('$pageview', { $current_url: url })
        }
    }, [pathname, searchParams])

    return null
}

/**
 * PostHog Provider
 * 
 * Initializes PostHog and tracks page views automatically.
 * Wrap your app with this provider in the root layout.
 */
export function PostHogProvider({ children }: { children: React.ReactNode }) {
    useEffect(() => {
        initPostHog()
    }, [])

    return (
        <>
            <Suspense fallback={null}>
                <PostHogPageView />
            </Suspense>
            {children}
        </>
    )
}
