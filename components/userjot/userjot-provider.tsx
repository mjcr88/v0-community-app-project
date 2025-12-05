"use client"

import React, { useEffect, createContext, useContext } from "react"

// Extend window type for UserJot
declare global {
    interface Window {
        $ujq: any[]
        uj: any
    }
}

interface UserJotProviderProps {
    children: React.ReactNode
    projectId: string
    user?: {
        id: string
        email?: string
        firstName?: string
        lastName?: string
        avatar?: string | null
    }
}

interface UserJotContextValue {
    openWidget: () => void
}

const UserJotContext = createContext<UserJotContextValue>({
    openWidget: () => { },
})

export const useUserJot = () => useContext(UserJotContext)

export function UserJotProvider({ children, projectId, user }: UserJotProviderProps) {
    useEffect(() => {
        // Initialize UserJot queue and proxy
        window.$ujq = window.$ujq || []
        window.uj = window.uj || new Proxy({}, {
            get: (_, p) => (...a: any[]) => window.$ujq.push([p, ...a])
        })

        // Load UserJot SDK script
        if (!document.querySelector('script[src*="userjot.com/sdk"]')) {
            const script = document.createElement('script')
            script.src = 'https://cdn.userjot.com/sdk/v2/uj.js'
            script.type = 'module'
            script.async = true
            document.head.appendChild(script)
        }

        // Initialize UserJot widget with custom trigger
        window.uj.init(projectId, {
            widget: true,
            position: 'right',
            theme: 'auto',
            trigger: 'custom'  // Hide default button, use our custom button
        })

        // Note: User identification removed to avoid crypto.subtle errors in development
        // It will work in production with HTTPS
    }, [projectId, user])

    const openWidget = () => {
        if (window.uj?.showWidget) {
            window.uj.showWidget()
        } else {
            console.warn('[UserJot] showWidget method not available yet')
        }
    }

    return (
        <UserJotContext.Provider value={{ openWidget }}>
            {children}
        </UserJotContext.Provider>
    )
}
