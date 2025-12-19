import React from 'react'
import { AppRouterContext } from 'next/dist/shared/lib/app-router-context.shared-runtime'
import { RioFeedbackProvider } from '@/components/feedback/rio-feedback-provider'

export const MockNextNavigation = (Story: React.ComponentType) => {
    const mockedRouter = {
        back: () => { },
        forward: () => { },
        push: () => { },
        replace: () => { },
        refresh: () => { },
        prefetch: () => { },
        hmrRefresh: () => { },
    }

    return (
        <AppRouterContext.Provider value={mockedRouter as any}>
            <Story />
        </AppRouterContext.Provider>
    )
}

export const WithRioFeedback = (Story: React.ComponentType) => {
    return (
        <RioFeedbackProvider>
            <Story />
        </RioFeedbackProvider>
    )
}
