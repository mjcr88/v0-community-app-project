"use client"

import { useState } from "react"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { MoreHorizontal, Search, MapPin, Users, Video, Wifi, Edit, Trash } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { updateLocation, deleteLocation } from "@/app/actions/locations"
import { toast } from "sonner"
import { Location } from "@/types/locations"
import { EditLocationDialog } from "@/components/map/EditLocationDialog"

interface AdminFacilitiesTableProps {
    facilities: Location[]
    slug: string
}

export function AdminFacilitiesTable({ facilities: initialFacilities, slug }: AdminFacilitiesTableProps) {
    const router = useRouter()
    const [facilities, setFacilities] = useState(initialFacilities)
    const [searchQuery, setSearchQuery] = useState("")

    // Edit Dialog State
    const [isEditOpen, setIsEditOpen] = useState(false)
    const [editingFacility, setEditingFacility] = useState<Location | null>(null)

    const handleEditClick = (facility: Location) => {
        setEditingFacility(facility)
        setIsEditOpen(true)
    }

    const handleSaveEdit = async (data: any) => {
        if (!editingFacility || !editingFacility.tenant_id) return

        try {
            const updatedLocation = await updateLocation(editingFacility.id, {
                ...data,
                tenant_id: editingFacility.tenant_id,
            }, `/t/${slug}/admin/facilities`)

            // Update local state
            setFacilities(prev => prev.map(f => f.id === editingFacility.id ? { ...f, ...data } : f))
            toast.success("Facility details updated")
            setIsEditOpen(false)
        } catch (error) {
            console.error("Error updating facility:", error)
            toast.error("Failed to update facility")
        }
    }

    const handleDeleteFromDialog = async (id: string) => {
        // Re-use existing delete logic but close dialog
        if (!editingFacility || !editingFacility.tenant_id) return
        try {
            await deleteLocation(id, editingFacility.tenant_id, `/t/${slug}/admin/facilities`)
            setFacilities(prev => prev.filter(f => f.id !== id))
            toast.success("Facility deleted")
            setIsEditOpen(false)
        } catch (error) {
            toast.error("Failed to delete facility")
            console.error(error)
        }
    }

    const filteredFacilities = facilities.filter((facility) =>
        facility.name.toLowerCase().includes(searchQuery.toLowerCase())
    )

    const handleToggleReservable = async (id: string, currentValue: boolean) => {
        // Optimistic update
        setFacilities(prev => prev.map(f => f.id === id ? { ...f, is_reservable: !currentValue } : f))

        try {
            // We need tenant_id and type which are required by updateLocation type definition
            // We can find them in the current facility object
            const facility = facilities.find(f => f.id === id)
            if (!facility || !facility.tenant_id) return

            await updateLocation(id, {
                tenant_id: facility.tenant_id,
                name: facility.name,
                type: facility.type as "facility" | "lot" | "walking_path" | "neighborhood",
                is_reservable: !currentValue
            }, `/t/${slug}/admin/facilities`)

            toast.success(currentValue ? "Facility marked as non-reservable" : "Facility available for reservation")
        } catch (error) {
            // Revert on error
            setFacilities(prev => prev.map(f => f.id === id ? { ...f, is_reservable: currentValue } : f))
            toast.error("Failed to update status")
            console.error(error)
        }
    }

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this facility?")) return

        try {
            const facility = facilities.find(f => f.id === id)
            if (!facility || !facility.tenant_id) return

            await deleteLocation(id, facility.tenant_id, `/t/${slug}/admin/facilities`)
            setFacilities(prev => prev.filter(f => f.id !== id))
            toast.success("Facility deleted")
        } catch (error) {
            toast.error("Failed to delete facility")
            console.error(error)
        }
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-2">
                <div className="relative flex-1">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search facilities..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-8"
                    />
                </div>
            </div>

            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Capacity</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Reservable</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredFacilities.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="h-24 text-center">
                                    No facilities found.
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredFacilities.map((facility) => (
                                <TableRow key={facility.id}>
                                    <TableCell className="font-medium">
                                        <div className="flex items-center gap-2">
                                            {facility.photos && facility.photos.length > 0 ? (
                                                <img src={facility.photos[0]} alt={facility.name} className="w-8 h-8 rounded object-cover" />
                                            ) : (
                                                <div className="w-8 h-8 rounded bg-muted flex items-center justify-center">
                                                    <WarehouseIcon className="w-4 h-4 text-muted-foreground" />
                                                </div>
                                            )}
                                            <div className="flex flex-col">
                                                <span>{facility.name}</span>
                                                <span className="text-xs text-muted-foreground">{facility.facility_type}</span>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell>{facility.capacity ? `${facility.capacity} ppl` : "-"}</TableCell>
                                    <TableCell>
                                        <Badge variant="outline" className={
                                            facility.status === 'Open' ? 'bg-green-50 text-green-700' :
                                                facility.status === 'Closed' ? 'bg-red-50 text-red-700' : 'bg-gray-50'
                                        }>
                                            {facility.status || 'Unknown'}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            <Switch
                                                checked={facility.is_reservable || false}
                                                onCheckedChange={() => handleToggleReservable(facility.id, facility.is_reservable || false)}
                                            />
                                            <span className="text-sm text-muted-foreground">
                                                {facility.is_reservable ? "Yes" : "No"}
                                            </span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" className="h-8 w-8 p-0">
                                                    <span className="sr-only">Open menu</span>
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                <DropdownMenuItem onClick={() => handleEditClick(facility)}>
                                                    <Edit className="mr-2 h-4 w-4" />
                                                    Edit Details
                                                </DropdownMenuItem>
                                                <DropdownMenuItem asChild>
                                                    <Link href={`/t/${slug}/admin/facilities/${facility.id}/reservations`}>
                                                        <Users className="mr-2 h-4 w-4" />
                                                        View Reservations
                                                    </Link>
                                                </DropdownMenuItem>
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem className="text-red-600" onClick={() => handleDelete(facility.id)}>
                                                    <Trash className="mr-2 h-4 w-4" />
                                                    Delete
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            <EditLocationDialog
                open={isEditOpen}
                onOpenChange={setIsEditOpen}
                mode="edit"
                locationType="facility"
                locationId={editingFacility?.id}
                geometry={null}
                initialData={editingFacility}
                lots={[]}
                onSave={handleSaveEdit}
                onCancel={() => setIsEditOpen(false)}
                onDelete={handleDeleteFromDialog}
            />
        </div>
    )
}

function WarehouseIcon({ className }: { className?: string }) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={className}
        >
            <path d="M22 8.35V20a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V8.35A2 2 0 0 1 3.26 6.5l8-3.2a2 2 0 0 1 1.48 0l8 3.2A2 2 0 0 1 22 8.35Z" />
            <path d="M6 18h12" />
            <path d="M6 14h12" />
            <rect width="12" height="12" x="6" y="10" />
        </svg>
    )
}
