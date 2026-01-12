"use client"

import * as React from "react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { ScrollArea } from "@/components/ui/scroll-area"

interface EmojiPickerProps {
    onEmojiSelect: (emoji: string) => void
    selectedEmoji?: string
    className?: string
    trigger?: React.ReactNode
}

// Curated list of popular emojis for neighbor lists
const EMOJIS = [
    // People & Faces
    "😊", "👋", "👨‍👩‍👧‍👦", "🌟", "🤝", "🏡", "🏠", "🏘️", "🎈", "🎉",
    "🐶", "🐱", "🐾", "🐕", "🐈", "🏊", "🚴", "🏃", "🚶", "🧘",
    "🤠", "🥳", "😎", "🤓", "🧐", "👻", "👽", "🤖", "💩", "🦄",
    // Objects & Activities
    "📚", "🎮", "⚽", "🏀", "🎾", "⛳", "🎨", "🎭", "🎼", "🎵",
    "🚗", "✈️", "🗺️", "🏖️", "🏕️", "🔥", "🍔", "🍕", "🍺", "🍷",
    "☕", "🍰", "🍎", "🥦", "🥕", "🔧", "🔨", "🧹", "🗑️", "📦",
    "📷", "📹", "📞", "🔌", "🔋", "💻", "🖥️", "🖱️", "⌨️", "📱",
    "🛍️", "🛒", "🎁", "🎈", "🎏", "🎀", "🎊", "🎎", "🎐", "🎌",
    // Symbols
    "❤️", "💙", "💚", "💛", "💜", "🧡", "🖤", "🤍", "💯", "✅",
    "⭐", "🔥", "⚠️", "🚫", "ℹ️", "📝", "📞", "📧", "💼", "📎",
    "🕐", "🕑", "🕒", "🕓", "🕔", "🕕", "🕖", "🕗", "🕘", "🕙",
]

export function EmojiPicker({ onEmojiSelect, selectedEmoji, className, trigger }: EmojiPickerProps) {
    const [open, setOpen] = React.useState(false)

    const handleSelect = (emoji: string) => {
        onEmojiSelect(emoji)
        setOpen(false)
    }

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                {trigger || (
                    <Button
                        variant="outline"
                        className={cn("h-10 w-10 p-0 text-xl", className)}
                    >
                        {selectedEmoji || "😀"}
                    </Button>
                )}
            </PopoverTrigger>
            <PopoverContent className="w-[280px] p-2" align="start">
                <ScrollArea className="h-[200px]">
                    <div className="grid grid-cols-6 gap-1">
                        {EMOJIS.map((emoji) => (
                            <Button
                                key={emoji}
                                variant="ghost"
                                className={cn(
                                    "h-9 w-9 p-0 text-xl hover:bg-muted",
                                    selectedEmoji === emoji && "bg-muted"
                                )}
                                onClick={() => handleSelect(emoji)}
                            >
                                {emoji}
                            </Button>
                        ))}
                    </div>
                </ScrollArea>
            </PopoverContent>
        </Popover>
    )
}
