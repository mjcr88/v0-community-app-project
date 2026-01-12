"use client"

import * as React from "react"
import { Users, Trash2, X, Search, Check, Loader2, Save } from "lucide-react"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
    DialogClose,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { EmojiPicker } from "@/components/ui/emoji-picker"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

import {
    updateNeighborList,
    deleteNeighborList,
    addNeighborToList,
    removeNeighborFromList,
    getNeighborListMembers,
    type NeighborList
} from "@/app/actions/neighbor-lists"

interface ListDetailModalProps {
    list: NeighborList
    open: boolean
    onOpenChange: (open: boolean) => void
    allResidents: any[]
}

export function ListDetailModal({ list, open, onOpenChange, allResidents }: ListDetailModalProps) {
    const router = useRouter()

    // Initialize members with the preview members from the list prop to avoid "0 members" flash
    // The list.members from getNeighborLists only contains the first 5, but it's better than nothing while loading
    const [members, setMembers] = React.useState<any[]>(list.members || [])
    const [loading, setLoading] = React.useState(false)
    const [isEditing, setIsEditing] = React.useState(false)

    // Edit State
    const [name, setName] = React.useState(list.name)
    const [emoji, setEmoji] = React.useState(list.emoji)
    const [description, setDescription] = React.useState(list.description || "")
    const [isShared, setIsShared] = React.useState(list.is_shared)

    // Search State
    const [searchOpen, setSearchOpen] = React.useState(false)

    // Fetch full members on open
    React.useEffect(() => {
        if (open) {
            setLoading(true)

            // Sync local state with prop
            setName(list.name)
            setEmoji(list.emoji)
            setDescription(list.description || "")
            setIsShared(list.is_shared)
            setIsEditing(false)

            // Use preview members initially if we have them
            if (list.members && list.members.length > 0) {
                setMembers(list.members)
            }

            getNeighborListMembers(list.id)
                .then(res => {
                    if (res.success && res.data) {
                        setMembers(res.data)
                    } else {
                        // If user has no access or error, toast might be annoying if it's just RLS, but showing error is safer
                        console.error("Failed to load members:", res.error)
                    }
                })
                .catch(err => console.error(err))
                .finally(() => setLoading(false))
        }
    }, [open, list])

    const handleUpdate = async () => {
        try {
            const res = await updateNeighborList(list.id, {
                name,
                emoji,
                description,
                is_shared: isShared
            })

            if (res.success) {
                toast.success("List updated")
                setIsEditing(false)
                router.refresh()
            } else {
                throw new Error(res.error)
            }
        } catch (error) {
            toast.error("Failed to update list")
        }
    }

    const handleDelete = async () => {
        try {
            const res = await deleteNeighborList(list.id)
            if (res.success) {
                toast.success("List deleted")
                onOpenChange(false)
                router.refresh()
            } else {
                throw new Error(res.error)
            }
        } catch (error) {
            toast.error("Failed to delete list")
        }
    }

    const handleAddMember = async (residentId: string) => {
        // Check if already member
        if (members.some(m => m.id === residentId)) {
            toast.info("Already in list")
            setSearchOpen(false)
            return
        }

        try {
            const res = await addNeighborToList(list.id, residentId)
            if (res.success) {
                toast.success("Member added")
                // Optimistic add (fetch full details from allResidents locally)
                const resident = allResidents.find(r => r.id === residentId)
                if (resident) {
                    setMembers(prev => [{ ...resident, added_at: new Date().toISOString() }, ...prev])
                }
                setSearchOpen(false)
                router.refresh()
            } else {
                throw new Error(res.error)
            }
        } catch (error) {
            toast.error("Failed to add member")
        }
    }

    const handleRemoveMember = async (residentId: string) => {
        try {
            const res = await removeNeighborFromList(list.id, residentId)
            if (res.success) {
                toast.success("Member removed")
                setMembers(prev => prev.filter(m => m.id !== residentId))
                router.refresh()
            } else {
                throw new Error(res.error)
            }
        } catch (error) {
            toast.error("Failed to remove member")
        }
    }

    // Filter out existing members from search
    const availableResidents = allResidents.filter(
        r => !members.some(m => m.id === r.id)
    )

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent showCloseButton={false} className="max-w-md max-h-[90vh] flex flex-col p-0 gap-0">
                <DialogHeader className="p-6 pb-2">
                    <DialogTitle className="sr-only">List Details</DialogTitle>
                    <div className="flex items-center justify-between">
                        {/* Header Content */}
                        {!isEditing ? (
                            <div className="flex items-start gap-4 w-full">
                                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-2xl">
                                    {emoji}
                                </div>
                                <div className="flex-1 space-y-1">
                                    <div className="flex items-center justify-between">
                                        <h3 className="font-semibold text-lg">{name}</h3>
                                        <Button variant="ghost" size="sm" onClick={() => setIsEditing(true)}>Edit</Button>
                                    </div>
                                    {isShared && (
                                        <Badge variant="secondary" className="text-xs">Shared with family</Badge>
                                    )}
                                    {description && (
                                        <p className="text-sm text-muted-foreground line-clamp-2">{description}</p>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <div className="w-full space-y-4">
                                <div className="flex items-center gap-2">
                                    <EmojiPicker selectedEmoji={emoji} onEmojiSelect={setEmoji} />
                                    <Input value={name} onChange={e => setName(e.target.value)} placeholder="List Name" className="flex-1" />
                                </div>
                                <Textarea
                                    value={description}
                                    onChange={e => setDescription(e.target.value)}
                                    placeholder="Description"
                                    className="h-20 max-h-[100px]"
                                />
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-2">
                                        <Label htmlFor="edit-shared">Share with family</Label>
                                        <Switch id="edit-shared" checked={isShared} onCheckedChange={setIsShared} />
                                    </div>
                                    <div className="flex gap-2">
                                        <Button variant="ghost" size="sm" onClick={() => setIsEditing(false)}>Cancel</Button>
                                        <Button size="sm" onClick={handleUpdate}>Save</Button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </DialogHeader>

                <Separator className="my-2" />

                {/* Member Search */}
                <div className="px-6 py-2">
                    <Command className="border rounded-md shadow-sm overflow-visible">
                        <CommandInput
                            placeholder="Add new member..."
                            onFocus={() => setSearchOpen(true)}
                            onBlur={() => setTimeout(() => setSearchOpen(false), 200)} // Delay to allow click
                        />
                        {searchOpen && (
                            <div className="absolute top-10 left-0 right-0 bg-popover z-50 border rounded-md shadow-lg max-h-[300px] overflow-auto">
                                <CommandList>
                                    <CommandEmpty>No neighbors found.</CommandEmpty>
                                    <CommandGroup heading="Neighbors">
                                        {availableResidents.slice(0, 10).map((resident) => (
                                            <CommandItem
                                                key={resident.id}
                                                onSelect={() => handleAddMember(resident.id)}
                                                className="flex items-center gap-2 cursor-pointer"
                                            >
                                                <Avatar className="h-6 w-6">
                                                    <AvatarImage src={resident.profile_picture_url || undefined} />
                                                    <AvatarFallback>{resident.first_name[0]}{resident.last_name[0]}</AvatarFallback>
                                                </Avatar>
                                                <span>{resident.first_name} {resident.last_name}</span>
                                            </CommandItem>
                                        ))}
                                    </CommandGroup>
                                </CommandList>
                            </div>
                        )}
                    </Command>
                </div>

                {/* Members List */}
                <ScrollArea className="flex-1 px-6 min-h-[300px]">
                    <div className="space-y-4 pb-6">
                        <h4 className="text-sm font-medium text-muted-foreground mb-2">
                            Members ({members.length})
                        </h4>

                        {/* We don't show loader solely to avoid flicker if we have cached members, 
                            instead we show what we have and maybe a small spinner if needed, 
                            but refreshing 'members' state handles it naturally. */}

                        {members.length === 0 ? (
                            <div className="text-center py-12 text-muted-foreground text-sm flex flex-col items-center">
                                <div className="bg-muted/50 p-3 rounded-full mb-3">
                                    <Users className="h-6 w-6 text-muted-foreground/50" />
                                </div>
                                <p>No members yet.</p>
                                <p className="text-xs mt-1">Search above to add neighbors.</p>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {members.map((member) => (
                                    <div key={member.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 group transition-colors">
                                        <div className="flex items-center gap-3">
                                            <Avatar className="h-8 w-8 border bg-background">
                                                <AvatarImage src={member.profile_picture_url || ""} />
                                                <AvatarFallback className="text-[10px]">{member.first_name[0]}{member.last_name[0]}</AvatarFallback>
                                            </Avatar>
                                            <div>
                                                <p className="text-sm font-medium leading-none">{member.first_name} {member.last_name}</p>
                                                {member.lot_id && (
                                                    <p className="text-xs text-muted-foreground mt-1">Lot Resident</p>
                                                )}
                                            </div>
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => handleRemoveMember(member.id)}
                                            className="opacity-0 group-hover:opacity-100 h-8 w-8 text-muted-foreground hover:text-destructive transition-opacity"
                                        >
                                            <X className="h-4 w-4" />
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </ScrollArea>

                {/* Footer */}
                <DialogFooter className="p-6 border-t mt-auto sm:justify-between flex gap-2">
                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-destructive px-2">
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete List
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                <AlertDialogDescription>
                                    This will permanently delete the list "{list.name}". Neighbors will not be notified, but they will be removed from this list.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>

                    <DialogClose asChild>
                        <Button variant="secondary">Close</Button>
                    </DialogClose>
                </DialogFooter>

            </DialogContent>
        </Dialog>
    )
}
