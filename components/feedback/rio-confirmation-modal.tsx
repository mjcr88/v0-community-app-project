"use client"

import Image from "next/image"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { X } from "lucide-react"
import { VisuallyHidden } from "@radix-ui/react-visually-hidden"

export interface RioConfirmationModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    title: string
    description: React.ReactNode
    image: string
    confirmText?: string
    cancelText?: string
    onConfirm: () => void
    isDestructive?: boolean
    isLoading?: boolean
}

export function RioConfirmationModal({
    open,
    onOpenChange,
    title,
    description,
    image,
    confirmText = "Confirm",
    cancelText = "Cancel",
    onConfirm,
    isDestructive = false,
    isLoading = false,
}: RioConfirmationModalProps) {
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
                        disabled={isLoading}
                    >
                        <X className="h-4 w-4 text-muted-foreground" />
                        <span className="sr-only">Close</span>
                    </button>

                    {/* Rio Image */}
                    <div className="relative w-48 h-48 animate-in zoom-in-50 duration-500 ease-out">
                        <Image
                            src={image}
                            alt="Rio Confirmation"
                            fill
                            className="object-contain"
                            priority
                        />
                    </div>

                    {/* Content */}
                    <div className="space-y-2 max-w-xs mx-auto animate-in slide-in-from-bottom-4 duration-500 delay-100 fill-mode-backwards">
                        <h2 className={cn("text-2xl font-bold tracking-tight",
                            isDestructive ? "text-destructive" : "text-foreground"
                        )}>
                            {title}
                        </h2>
                        <div className="text-muted-foreground font-medium text-base leading-relaxed">
                            {description}
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3 pt-2 animate-in slide-in-from-bottom-4 duration-500 delay-200 fill-mode-backwards w-full justify-center">
                        <Button
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            disabled={isLoading}
                            className="min-w-[100px]"
                        >
                            {cancelText}
                        </Button>
                        <Button
                            onClick={onConfirm}
                            disabled={isLoading}
                            variant={isDestructive ? "destructive" : "default"}
                            className={cn(
                                "min-w-[100px] font-semibold shadow-md transition-transform active:scale-95",
                                isDestructive && "bg-[#B45B2D] hover:bg-[#B45B2D]/90 text-white"
                            )}
                        >
                            {isLoading ? "Processing..." : confirmText}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
