"use client"

import { useState, useEffect } from "react"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/library/dialog"
import { Button } from "@/components/library/button"
import { Badge } from "@/components/library/badge"
import { cn } from "@/lib/utils"
import { AVAILABLE_STATS } from "@/lib/dashboard/stats-config"
import { Check } from "lucide-react"

export interface EditStatModalProps {
    isOpen: boolean
    onClose: () => void
    onSave: (config: string[]) => void
    currentConfig: string[]
}

export function EditStatModal({
    isOpen,
    onClose,
    onSave,
    currentConfig,
}: EditStatModalProps) {
    const [selected, setSelected] = useState<string[]>(currentConfig)

    useEffect(() => {
        if (isOpen) {
            setSelected(currentConfig)
        }
    }, [isOpen, currentConfig])

    const handleToggle = (statId: string) => {
        if (selected.includes(statId)) {
            setSelected(selected.filter(id => id !== statId))
        } else {
            if (selected.length < 4) {
                setSelected([...selected, statId])
            }
        }
    }

    const handleSave = () => {
        if (selected.length === 4) {
            onSave(selected)
        }
    }

    const sortedStats = [...AVAILABLE_STATS].sort((a, b) => {
        const aSelected = selected.includes(a.id)
        const bSelected = selected.includes(b.id)
        if (aSelected && !bSelected) return -1
        if (!aSelected && bSelected) return 1
        return a.label.localeCompare(b.label)
    })

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[600px] max-w-[95vw] h-[85vh] sm:max-h-[80vh] flex flex-col">
                <DialogHeader className="flex-shrink-0">
                    <DialogTitle>Customize Your Stats</DialogTitle>
                    <DialogDescription>
                        Choose exactly 4 stats to display on your dashboard. Selected: {selected.length}/4
                    </DialogDescription>
                </DialogHeader>

                {/* Scrollable area with visual indicators */}
                <div className="flex-1 overflow-y-auto py-4 -mx-6 px-6 relative">
                    <div className="grid gap-3 pb-4">
                        {sortedStats.map((stat) => {
                            const isSelected = selected.includes(stat.id)
                            return (
                                <button
                                    key={stat.id}
                                    onClick={() => handleToggle(stat.id)}
                                    disabled={!isSelected && selected.length >= 4}
                                    className={cn(
                                        "flex items-center justify-between p-4 rounded-lg border-2 transition-all text-left min-h-[72px]",
                                        isSelected
                                            ? "border-primary bg-primary/5"
                                            : "border-border hover:border-primary/50 hover:bg-accent",
                                        !isSelected && selected.length >= 4 && "opacity-50 cursor-not-allowed"
                                    )}
                                >
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="font-medium">{stat.label}</span>
                                            <Badge variant="outline" className="text-xs">
                                                {stat.icon} {stat.scope}
                                            </Badge>
                                        </div>
                                        <p className="text-sm text-muted-foreground">{stat.description}</p>
                                    </div>
                                    {isSelected && (
                                        <Check className="h-5 w-5 text-primary ml-2 flex-shrink-0" />
                                    )}
                                </button>
                            )
                        })}
                    </div>

                    {/* Bottom gradient fade indicator */}
                    <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-background to-transparent" />
                </div>

                <DialogFooter className="flex-shrink-0">
                    <Button variant="outline" onClick={onClose}>
                        Cancel
                    </Button>
                    <Button onClick={handleSave} disabled={selected.length !== 4}>
                        Save Changes {selected.length !== 4 && `(${selected.length}/4)`}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
