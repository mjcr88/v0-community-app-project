"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { useState, useEffect } from "react"
import { Loader2, GripVertical } from "lucide-react"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { SortableList, SortableListItem, Item } from "@/components/library/sortable-list"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { ChevronUp, ChevronDown } from "lucide-react"
import { DashboardAnalytics } from "@/lib/analytics"

export interface AvailableStat {
    id: string
    label: string
    scope: string // This is the default/inherent scope description
}

interface EditStatModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    currentStats: string[] // Ordered IDs
    availableStats: AvailableStat[]
    currentScope: "tenant" | "neighborhood"
    onSave: (selectedStats: string[], scope: "tenant" | "neighborhood") => Promise<void>
}

export function EditStatModal({ open, onOpenChange, currentStats, availableStats, currentScope, onSave }: EditStatModalProps) {
    const [scope, setScope] = useState<"tenant" | "neighborhood">(currentScope)
    const [items, setItems] = useState<Item[]>([])
    const [isSaving, setIsSaving] = useState(false)

    useEffect(() => {
        if (open) {
            setScope(currentScope)

            // Map available stats to SortableList items
            // First, put currentStats in order
            const orderedStats: Item[] = []
            const remainingStats: Item[] = []

            // Create a map for quick lookup
            const statMap = new Map(availableStats.map(s => [s.id, s]))

            // Add existing stats in order
            currentStats.forEach((id, index) => {
                const stat = statMap.get(id)
                if (stat) {
                    orderedStats.push({
                        id: index, // SortableList uses number IDs, we'll need to map back
                        text: stat.label,
                        checked: false, // We don't use checked for deletion here, maybe for something else?
                        description: stat.id // Store the real ID in description for now
                    })
                    statMap.delete(id)
                }
            })

            // Add remaining stats
            Array.from(statMap.values()).forEach((stat, index) => {
                remainingStats.push({
                    id: orderedStats.length + index,
                    text: stat.label,
                    checked: false,
                    description: stat.id
                })
            })

            setItems([...orderedStats, ...remainingStats])
        }
    }, [open, currentStats, availableStats, currentScope])

    const handleSave = async () => {
        setIsSaving(true)
        try {
            // Extract real IDs from items
            const selectedIds = items.map(item => item.description)

            // Check if order changed (simple comparison)
            const isReordered = JSON.stringify(selectedIds) !== JSON.stringify(currentStats)
            if (isReordered) {
                DashboardAnalytics.statsReordered(selectedIds)
            }

            await onSave(selectedIds, scope)
            onOpenChange(false)
        } catch (error) {
            console.error("Failed to save stats:", error)
        } finally {
            setIsSaving(false)
        }
    }

    const moveItem = (index: number, direction: 'up' | 'down') => {
        if (direction === 'up' && index === 0) return
        if (direction === 'down' && index === items.length - 1) return

        const newItems = [...items]
        const targetIndex = direction === 'up' ? index - 1 : index + 1

        // Swap
        const temp = newItems[index]
        newItems[index] = newItems[targetIndex]
        newItems[targetIndex] = temp

        setItems(newItems)
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px] h-[80vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle>Customize Dashboard Stats</DialogTitle>
                    <DialogDescription>
                        Choose your scope and reorder stats. The top 4 will be displayed.
                    </DialogDescription>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto py-4 space-y-6">
                    {/* Scope Toggle */}
                    <div className="flex flex-col gap-2">
                        <label className="text-sm font-medium">Data Scope</label>
                        <Tabs value={scope} onValueChange={(v) => setScope(v as "tenant" | "neighborhood")} className="w-full">
                            <TabsList className="grid w-full grid-cols-2 bg-muted p-1 h-auto">
                                <TabsTrigger value="tenant" className="data-[state=active]:bg-background data-[state=active]:shadow-sm py-2">Community Wide</TabsTrigger>
                                <TabsTrigger value="neighborhood" className="data-[state=active]:bg-background data-[state=active]:shadow-sm py-2">My Neighborhood</TabsTrigger>
                            </TabsList>
                        </Tabs>
                        <p className="text-xs text-muted-foreground">
                            {scope === "tenant"
                                ? "Stats will show data from the entire community."
                                : "Stats will be filtered to show only data from your neighborhood."}
                        </p>
                    </div>

                    {/* Sortable List */}
                    <div className="flex flex-col gap-2">
                        <div className="flex items-center justify-between">
                            <label className="text-sm font-medium">Prioritize Stats</label>
                            <span className="text-xs text-muted-foreground">Drag to reorder</span>
                        </div>

                        <div className="bg-muted/30 rounded-lg p-1">
                            <SortableList
                                items={items}
                                setItems={setItems}
                                onCompleteItem={() => { }} // Not using delete
                                renderItem={(item, order) => (
                                    <SortableListItem
                                        key={item.id}
                                        item={item}
                                        order={order}
                                        onCompleteItem={() => { }}
                                        onRemoveItem={() => { }}
                                        handleDrag={() => { }} // Handled internally by SortableListItem's drag listener
                                        className="mb-2"
                                        renderExtra={(item) => {
                                            const isActive = order < 4
                                            return (
                                                <div
                                                    className={cn(
                                                        "flex items-center gap-3 p-3 w-full rounded-lg border bg-card transition-all",
                                                        isActive ? "shadow-sm ring-1 ring-black/5" : "opacity-50 grayscale"
                                                    )}
                                                >
                                                    <div className="p-1 rounded bg-muted/50">
                                                        <GripVertical className="h-4 w-4 text-muted-foreground" />
                                                    </div>

                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-2">
                                                            <span className="font-medium truncate">{item.text}</span>
                                                            {isActive && (
                                                                <Badge variant="secondary" className="h-5 px-1.5 text-[10px]">
                                                                    Shown
                                                                </Badge>
                                                            )}
                                                        </div>
                                                    </div>

                                                    <div className="flex flex-col gap-0.5">
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-5 w-5 hover:bg-muted"
                                                            onClick={(e) => {
                                                                e.stopPropagation()
                                                                moveItem(order, 'up')
                                                            }}
                                                            disabled={order === 0}
                                                        >
                                                            <ChevronUp className="h-3 w-3" />
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-5 w-5 hover:bg-muted"
                                                            onClick={(e) => {
                                                                e.stopPropagation()
                                                                moveItem(order, 'down')
                                                            }}
                                                            disabled={order === items.length - 1}
                                                        >
                                                            <ChevronDown className="h-3 w-3" />
                                                        </Button>
                                                    </div>
                                                </div>
                                            )
                                        }}
                                    />
                                )}
                            />
                        </div>
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSaving}>
                        Cancel
                    </Button>
                    <Button onClick={handleSave} disabled={isSaving}>
                        {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Save Changes
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
