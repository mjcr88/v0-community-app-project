import posthog from 'posthog-js'

let isInitialized = false

export const initPostHog = () => {
    if (typeof window === 'undefined') return
    if (isInitialized) return
    if (!process.env.NEXT_PUBLIC_POSTHOG_KEY) {
        console.warn('[PostHog] API key not found. Analytics disabled.')
        return
    }

    posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY, {
        api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com',
        capture_pageview: false, // We handle manually for App Router
        capture_pageleave: true,
        persistence: 'localStorage',
        loaded: (posthog) => {
            if (process.env.NODE_ENV === 'development') {
                // Uncomment to debug in dev:
                // posthog.debug()
            }
        },
    })

    isInitialized = true
}

export { posthog }
