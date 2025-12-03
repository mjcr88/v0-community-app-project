"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { X } from "lucide-react"
import { VisuallyHidden } from "@radix-ui/react-visually-hidden"

export type RioFeedbackVariant = "success" | "error" | "warning"

export interface RioFeedbackModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    variant: RioFeedbackVariant
    title: string
    description: string
    image: string // Path to the Rio image
    action?: {
        label: string
        onClick: () => void
    }
    autoDismiss?: boolean
    dismissDuration?: number
}

export function RioFeedbackModal({
    open,
    onOpenChange,
    variant,
    title,
    description,
    image,
    action,
    autoDismiss = true,
    dismissDuration = 4000,
}: RioFeedbackModalProps) {
    // Handle auto-dismiss
    useEffect(() => {
        if (open && autoDismiss) {
            const timer = setTimeout(() => {
                onOpenChange(false)
            }, dismissDuration)
            return () => clearTimeout(timer)
        }
    }, [open, autoDismiss, dismissDuration, onOpenChange])

    // Determine colors based on variant
    const getVariantStyles = () => {
        switch (variant) {
            case "success":
                return "bg-[#06092F]/5 border-[#06092F]/10 text-[#06092F]" // Fresh Growth inspired
            case "error":
                return "bg-[#B45B2D]/5 border-[#B45B2D]/10 text-[#B45B2D]" // Clay inspired
            case "warning":
                return "bg-[#143D37]/5 border-[#143D37]/10 text-[#143D37]" // Sunrise/Forest inspired
            default:
                return "bg-background"
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent showCloseButton={false} className="sm:max-w-md p-0 overflow-hidden border-none shadow-xl bg-white/95 backdrop-blur-sm">
                <VisuallyHidden>
                    <DialogTitle>{title}</DialogTitle>
                </VisuallyHidden>

                <div className="relative flex flex-col items-center justify-center p-8 text-center space-y-6">
                    {/* Close Button */}
                    <button
                        onClick={() => onOpenChange(false)}
                        className="absolute right-4 top-4 p-2 rounded-full hover:bg-black/5 transition-colors"
                    >
                        <X className="h-4 w-4 text-muted-foreground" />
                        <span className="sr-only">Close</span>
                    </button>

                    {/* Rio Image */}
                    <div className="relative w-48 h-48 animate-in zoom-in-50 duration-500 ease-out">
                        <Image
                            src={image}
                            alt="Rio Feedback"
                            fill
                            className="object-contain"
                            priority
                        />
                    </div>

                    {/* Content */}
                    <div className="space-y-2 max-w-xs mx-auto animate-in slide-in-from-bottom-4 duration-500 delay-100 fill-mode-backwards">
                        <h2 className={cn("text-2xl font-bold tracking-tight",
                            variant === 'error' ? "text-destructive" : "text-foreground"
                        )}>
                            {title}
                        </h2>
                        <p className="text-muted-foreground font-medium text-base leading-relaxed">
                            {description}
                        </p>
                    </div>

                    {/* Optional Action */}
                    {action && (
                        <div className="pt-2 animate-in slide-in-from-bottom-4 duration-500 delay-200 fill-mode-backwards">
                            <Button
                                onClick={() => {
                                    action.onClick()
                                    onOpenChange(false)
                                }}
                                className={cn(
                                    "min-w-[120px] font-semibold shadow-md transition-transform active:scale-95",
                                    variant === 'success' && "bg-[#06092F] hover:bg-[#06092F]/90 text-white",
                                    variant === 'error' && "bg-[#B45B2D] hover:bg-[#B45B2D]/90 text-white"
                                )}
                            >
                                {action.label}
                            </Button>
                        </div>
                    )}
                </div>

                {/* Progress Bar for Auto Dismiss */}
                {autoDismiss && (
                    <div className="absolute bottom-0 left-0 h-1 bg-muted w-full">
                        <div
                            className={cn(
                                "h-full transition-all ease-linear w-full",
                                variant === 'success' && "bg-[#06092F]",
                                variant === 'error' && "bg-[#B45B2D]",
                                variant === 'warning' && "bg-[#143D37]"
                            )}
                            style={{
                                animation: `shrink ${dismissDuration}ms linear forwards`
                            }}
                        />
                        <style jsx>{`
              @keyframes shrink {
                from { width: 100%; }
                to { width: 0%; }
              }
            `}</style>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    )
}
