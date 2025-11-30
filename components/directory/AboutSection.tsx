"use client"

import { Card, CardContent } from "@/components/ui/card"

interface AboutSectionProps {
    content: string
    showPrivate?: boolean
}

// Convert URLs to clickable links
function linkify(text: string): React.ReactNode {
    const urlRegex = /(https?:\/\/[^\s]+)/g
    const parts = text.split(urlRegex)

    return parts.map((part, index) => {
        if (part.match(urlRegex)) {
            return (
                <a
                    key={index}
                    href={part}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                >
                    {part}
                </a>
            )
        }
        return part
    })
}

export function AboutSection({ content, showPrivate = false }: AboutSectionProps) {
    if (showPrivate || !content) {
        return null
    }

    return (
        <div className="text-sm whitespace-pre-wrap leading-relaxed">
            {linkify(content)}
        </div>
    )
}
