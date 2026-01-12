"use client"

import * as React from "react"
import { Check, Plus, Loader2, Users, Lock, MoreHorizontal } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
    CommandSeparator,
} from "@/components/ui/command"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { EmojiPicker } from "@/components/ui/emoji-picker"
import { cn } from "@/lib/utils"

import {
    addNeighborToList,
    removeNeighborFromList,
    getListsForNeighbor,
    createNeighborList,
    type NeighborList
} from "@/app/actions/neighbor-lists"
import { useRouter } from "next/navigation"

interface AddToListDropdownProps {
    neighborId: string
    tenantId: string
    lists: NeighborList[]
    trigger?: React.ReactNode
    variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link"
}

export function AddToListDropdown({ neighborId, tenantId, lists, trigger, variant = "ghost" }: AddToListDropdownProps) {
    const router = useRouter()
    const [open, setOpen] = React.useState(false)
    const [loading, setLoading] = React.useState(false)
    const [selectedListIds, setSelectedListIds] = React.useState<string[]>([])

    // Create List State
    const [isCreating, setIsCreating] = React.useState(false)
    const [newListName, setNewListName] = React.useState("")
    const [newListEmoji, setNewListEmoji] = React.useState("📝")
    const [newListShared, setNewListShared] = React.useState(false)
    const [creatingLoader, setCreatingLoader] = React.useState(false)

    // Fetch memberships when opening
    React.useEffect(() => {
        if (open) {
            setLoading(true)
            getListsForNeighbor(neighborId)
                .then((res) => {
                    if (res.success && res.data) {
                        setSelectedListIds(res.data)
                    } else {
                        toast.error("Failed to load list memberships")
                    }
                })
                .finally(() => setLoading(false))
        } else {
            // Reset creation state on close
            setIsCreating(false)
        }
    }, [open, neighborId])

    const handleToggleList = async (listId: string) => {
        const isSelected = selectedListIds.includes(listId)

        // Optimistic update
        setSelectedListIds(prev =>
            isSelected ? prev.filter(id => id !== listId) : [...prev, listId]
        )

        try {
            let res
            if (isSelected) {
                res = await removeNeighborFromList(listId, neighborId)
            } else {
                res = await addNeighborToList(listId, neighborId)
            }

            if (!res.success) {
                throw new Error(res.error)
            }

            router.refresh()
        } catch (error) {
            toast.error("Failed to update list")
            // Revert on error
            setSelectedListIds(prev =>
                isSelected ? [...prev, listId] : prev.filter(id => id !== listId)
            )
        }
    }

    const handleCreateList = async () => {
        if (!newListName.trim()) return

        setCreatingLoader(true)
        try {
            // 1. Create List
            const createRes = await createNeighborList(tenantId, {
                name: newListName,
                emoji: newListEmoji,
                is_shared: newListShared,
                // description is optional, skip for quick add
            })

            if (!createRes.success || !createRes.data) {
                throw new Error(createRes.error)
            }

            const newList = createRes.data

            // 2. Add neighbor to new list
            const addRes = await addNeighborToList(newList.id, neighborId)
            if (!addRes.success) {
                toast.warning("List created but failed to add neighbor")
            } else {
                toast.success("List created and neighbor added")
                setSelectedListIds(prev => [...prev, newList.id])
            }

            // 3. Reset and refresh
            setNewListName("")
            setNewListEmoji("📝")
            setNewListShared(false)
            setIsCreating(false)
            router.refresh()

        } catch (error) {
            console.error(error)
            toast.error("Failed to create list")
        } finally {
            setCreatingLoader(false)
        }
    }

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                {trigger || (
                    <Button variant={variant} size="icon" className="h-8 w-8 hover:bg-muted text-muted-foreground">
                        <Plus className="h-4 w-4" />
                    </Button>
                )}
            </PopoverTrigger>
            <PopoverContent className="p-0 w-[280px]" align="end">
                {!isCreating ? (
                    <Command>
                        <CommandInput placeholder="Search lists..." className="h-9" />
                        <CommandList>
                            <CommandEmpty>No lists found.</CommandEmpty>
                            <CommandGroup heading="Your Lists">
                                {loading ? (
                                    <div className="flex items-center justify-center p-4">
                                        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                                    </div>
                                ) : (
                                    lists.map((list) => {
                                        const isSelected = selectedListIds.includes(list.id)
                                        return (
                                            <CommandItem
                                                key={list.id}
                                                onSelect={() => handleToggleList(list.id)}
                                                className="flex items-center justify-between"
                                            >
                                                <div className="flex items-center gap-2 truncate">
                                                    <span className="text-lg">{list.emoji}</span>
                                                    <span className="truncate">{list.name}</span>
                                                    {list.is_shared && (
                                                        <Users className="h-3 w-3 text-muted-foreground ml-1 shrink-0" />
                                                    )}
                                                </div>
                                                {isSelected && <Check className="h-4 w-4 ml-2 text-primary" />}
                                            </CommandItem>
                                        )
                                    })
                                )}
                            </CommandGroup>
                            <CommandSeparator />
                            <CommandGroup>
                                <CommandItem onSelect={() => setIsCreating(true)} className="text-primary cursor-pointer">
                                    <Plus className="mr-2 h-4 w-4" />
                                    Create new list
                                </CommandItem>
                            </CommandGroup>
                        </CommandList>
                    </Command>
                ) : (
                    <div className="p-3 space-y-3">
                        <div className="flex items-center justify-between">
                            <h4 className="font-medium text-sm">Create New List</h4>
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 px-2 text-xs"
                                onClick={() => setIsCreating(false)}
                            >
                                Cancel
                            </Button>
                        </div>

                        <div className="space-y-3">
                            <div className="flex gap-2">
                                <EmojiPicker
                                    selectedEmoji={newListEmoji}
                                    onEmojiSelect={setNewListEmoji}
                                />
                                <Input
                                    value={newListName}
                                    onChange={(e) => setNewListName(e.target.value)}
                                    placeholder="List Name"
                                    className="h-10"
                                    autoFocus
                                />
                            </div>

                            <div className="flex items-center justify-between space-x-2">
                                <Label htmlFor="shared-mode" className="text-xs flex flex-col gap-0.5">
                                    <span>Share with family</span>
                                    <span className="font-normal text-muted-foreground">Visible to your household</span>
                                </Label>
                                <Switch
                                    id="shared-mode"
                                    checked={newListShared}
                                    onCheckedChange={setNewListShared}
                                />
                            </div>

                            <Button
                                onClick={handleCreateList}
                                disabled={!newListName.trim() || creatingLoader}
                                className="w-full"
                                size="sm"
                            >
                                {creatingLoader && <Loader2 className="mr-2 h-3 w-3 animate-spin" />}
                                Create & Add
                            </Button>
                        </div>
                    </div>
                )}
            </PopoverContent>
        </Popover>
    )
}
