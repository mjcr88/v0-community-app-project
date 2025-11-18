"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Pencil, Trash2, ArrowUpDown } from 'lucide-react'
import Link from "next/link"
import { createBrowserClient } from "@/lib/supabase/client"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"

type Resident = {
  id: string
  first_name: string
  last_name: string
  email: string | null
  phone: string | null
  created_at: string
  invited_at: string | null
  onboarding_completed: boolean
  lots: {
    id: string
    lot_number: string
    neighborhoods: {
      id: string
      name: string
    }
  } | null
  family_units: {
    id: string
    name: string
  } | null
}

type Pet = {
  id: string
  name: string
  species: string
  breed: string | null
  created_at: string
  lots: {
    id: string
    lot_number: string
    neighborhoods: {
      id: string
      name: string
    }
  } | null
  family_units: {
    id: string
    name: string
  } | null
}

type CombinedEntity = {
  id: string
  type: "resident" | "pet"
  name: string
  lot: string
  neighborhood: string
  family: string | null
  email?: string | null
  phone?: string | null
  species?: string
  created_at: string
  status?: "created" | "invited" | "active"
  complaints?: { active: number; total: number }
}

export function ResidentsTable({
  residents,
  pets,
  slug,
  familyUnits,
  residentComplaints,
  petComplaints,
}: {
  residents: Resident[]
  pets: Pet[]
  slug: string
  familyUnits: { id: string; primary_contact_id: string | null }[]
  residentComplaints: Map<string, { active: number; total: number }>
  petComplaints: Map<string, { active: number; total: number }>
}) {
  const [showPets, setShowPets] = useState(true)
  const [showOnlyWithComplaints, setShowOnlyWithComplaints] = useState(false)
  const [sortedEntities, setSortedEntities] = useState<CombinedEntity[]>([])
  const [sortField, setSortField] = useState<string | null>(null)
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc")
  const [selectedEntities, setSelectedEntities] = useState<string[]>([])
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteDialogEntity, setDeleteDialogEntity] = useState<CombinedEntity | null>(null)
  const [searchQuery, setSearchQuery] = useState("")

  const getResidentStatus = (resident: Resident): "created" | "invited" | "active" => {
    if (resident.onboarding_completed) return "active"
    if (resident.invited_at) return "invited"
    return "created"
  }

  const combinedEntities: CombinedEntity[] = [
    ...residents.map((r) => ({
      id: r.id,
      type: "resident" as const,
      name: `${r.first_name} ${r.last_name}`,
      lot: r.lots?.lot_number || "—",
      neighborhood: r.lots?.neighborhoods?.name || "—",
      family: r.family_units?.name || null,
      email: r.email,
      phone: r.phone,
      created_at: r.created_at,
      status: getResidentStatus(r),
      complaints: residentComplaints.get(r.id) || { active: 0, total: 0 },
    })),
    ...pets.map((p) => ({
      id: p.id,
      type: "pet" as const,
      name: p.name,
      lot: p.lots?.lot_number || "—",
      neighborhood: p.lots?.neighborhoods?.name || "—",
      family: p.family_units?.name || null,
      species: p.species,
      created_at: p.created_at,
      complaints: petComplaints.get(p.id) || { active: 0, total: 0 },
    })),
  ]

  let filteredEntities = showPets ? combinedEntities : combinedEntities.filter((e) => e.type === "resident")

  if (showOnlyWithComplaints) {
    filteredEntities = filteredEntities.filter((e) => e.complaints && e.complaints.total > 0)
  }

  if (searchQuery) {
    filteredEntities = filteredEntities.filter((e) =>
      e.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.lot.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.neighborhood.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (e.family && e.family.toLowerCase().includes(searchQuery.toLowerCase()))
    )
  }

  useEffect(() => {
    setSortedEntities(filteredEntities)
    setSelectedEntities([])
  }, [showPets, showOnlyWithComplaints, searchQuery, residents.length, pets.length])

  const handleSort = (field: string) => {
    const direction = sortField === field && sortDirection === "asc" ? "desc" : "asc"
    setSortField(field)
    setSortDirection(direction)

    const sorted = [...filteredEntities].sort((a, b) => {
      if (field === "complaints") {
        const aVal = a.complaints?.total || 0
        const bVal = b.complaints?.total || 0
        return direction === "asc" ? aVal - bVal : bVal - aVal
      }

      let aVal: any = a[field as keyof CombinedEntity]
      let bVal: any = b[field as keyof CombinedEntity]

      if (typeof aVal === "string") aVal = aVal.toLowerCase()
      if (typeof bVal === "string") bVal = bVal.toLowerCase()

      if (aVal < bVal) return direction === "asc" ? -1 : 1
      if (aVal > bVal) return direction === "asc" ? 1 : -1
      return 0
    })

    setSortedEntities(sorted)
  }

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedEntities(sortedEntities.map((e) => e.id))
    } else {
      setSelectedEntities([])
    }
  }

  const handleSelectEntity = (entityId: string, checked: boolean) => {
    if (checked) {
      setSelectedEntities([...selectedEntities, entityId])
    } else {
      setSelectedEntities(selectedEntities.filter((id) => id !== entityId))
    }
  }

  const handleBulkDelete = async () => {
    setIsDeleting(true)
    const supabase = createBrowserClient()

    const residentsToDelete = selectedEntities.filter((id) =>
      sortedEntities.find((e) => e.id === id && e.type === "resident"),
    )
    const petsToDelete = selectedEntities.filter((id) => sortedEntities.find((e) => e.id === id && e.type === "pet"))

    if (residentsToDelete.length > 0) {
      const { error } = await supabase.from("users").delete().in("id", residentsToDelete)
      if (error) {
        console.error("[v0] Error deleting residents:", error)
        alert(`Failed to delete residents: ${error.message}`)
        setIsDeleting(false)
        return
      }
    }

    if (petsToDelete.length > 0) {
      const { error } = await supabase.from("pets").delete().in("id", petsToDelete)
      if (error) {
        console.error("[v0] Error deleting pets:", error)
        alert(`Failed to delete pets: ${error.message}`)
        setIsDeleting(false)
        return
      }
    }

    setShowDeleteDialog(false)
    setIsDeleting(false)
    setSelectedEntities([])
    window.location.reload()
  }

  const handleIndividualDelete = async () => {
    if (!deleteDialogEntity) return

    setIsDeleting(true)
    const supabase = createBrowserClient()

    const tableName = deleteDialogEntity.type === "resident" ? "users" : "pets"
    const { error } = await supabase.from(tableName).delete().eq("id", deleteDialogEntity.id)

    if (error) {
      console.error(`[v0] Error deleting ${deleteDialogEntity.type}:`, error)
      alert(`Failed to delete ${deleteDialogEntity.type}: ${error.message}`)
      setIsDeleting(false)
      return
    }

    setDeleteDialogEntity(null)
    setIsDeleting(false)
    window.location.reload()
  }

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  const isPrimaryContact = (residentId: string) => {
    return familyUnits.some((fu) => fu.primary_contact_id === residentId)
  }

  const renderStatusBadge = (status: "created" | "invited" | "active") => {
    const variants = {
      created: { label: "Created", variant: "secondary" as const },
      invited: { label: "Invited", variant: "outline" as const },
      active: { label: "Active", variant: "default" as const },
    }
    const { label, variant } = variants[status]
    return <Badge variant={variant}>{label}</Badge>
  }

  return (
    <>
      <div className="space-y-4">
        <div className="flex items-center gap-4 flex-wrap">
          <Input
            placeholder="Search by name, lot, neighborhood..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="max-w-sm"
          />

          <div className="flex items-center space-x-2">
            <Switch id="show-pets" checked={showPets} onCheckedChange={setShowPets} />
            <Label htmlFor="show-pets">Show Pets</Label>
          </div>

          <div className="flex items-center space-x-2">
            <Switch id="show-complaints" checked={showOnlyWithComplaints} onCheckedChange={setShowOnlyWithComplaints} />
            <Label htmlFor="show-complaints">Only With Complaints</Label>
          </div>

          {selectedEntities.length > 0 && (
            <Button variant="destructive" size="sm" onClick={() => setShowDeleteDialog(true)}>
              <Trash2 className="mr-2 h-4 w-4" />
              Delete {selectedEntities.length} {selectedEntities.length > 1 ? "Items" : "Item"}
            </Button>
          )}
        </div>

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <Checkbox
                    checked={selectedEntities.length === sortedEntities.length && sortedEntities.length > 0}
                    onCheckedChange={handleSelectAll}
                  />
                </TableHead>
                <TableHead>
                  <Button variant="ghost" size="sm" onClick={() => handleSort("name")} className="-ml-3">
                    Name
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                  </Button>
                </TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>
                  <Button variant="ghost" size="sm" onClick={() => handleSort("lot")} className="-ml-3">
                    Lot
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                  </Button>
                </TableHead>
                <TableHead>
                  <Button variant="ghost" size="sm" onClick={() => handleSort("neighborhood")} className="-ml-3">
                    Neighborhood
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                  </Button>
                </TableHead>
                <TableHead>
                  <Button variant="ghost" size="sm" onClick={() => handleSort("family")} className="-ml-3">
                    Family Unit
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                  </Button>
                </TableHead>
                <TableHead>
                  <Button variant="ghost" size="sm" onClick={() => handleSort("complaints")} className="-ml-3">
                    Complaints
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                  </Button>
                </TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedEntities.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center text-muted-foreground">
                    No {showPets ? "residents or pets" : "residents"} found
                  </TableCell>
                </TableRow>
              ) : (
                sortedEntities.map((entity) => (
                  <TableRow key={entity.id}>
                    <TableCell>
                      <Checkbox
                        checked={selectedEntities.includes(entity.id)}
                        onCheckedChange={(checked) => handleSelectEntity(entity.id, checked as boolean)}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="text-xs">{getInitials(entity.name)}</AvatarFallback>
                        </Avatar>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{entity.name}</span>
                          {entity.type === "resident" && isPrimaryContact(entity.id) && (
                            <span className="inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                              Primary
                            </span>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="capitalize text-muted-foreground">{entity.type}</span>
                    </TableCell>
                    <TableCell>
                      {entity.type === "resident" && entity.status ? renderStatusBadge(entity.status) : "—"}
                    </TableCell>
                    <TableCell>{entity.lot}</TableCell>
                    <TableCell>{entity.neighborhood}</TableCell>
                    <TableCell className="text-muted-foreground">{entity.family || "—"}</TableCell>
                    <TableCell>
                      {entity.complaints && entity.complaints.total > 0 ? (
                        <Link
                          href={`/t/${slug}/admin/requests?type=complaint&tagged=${entity.type === "resident" ? "resident" : "pet"}&id=${entity.id}`}
                          className="text-sm hover:underline"
                        >
                          {entity.complaints.active > 0 ? (
                            <span className="font-medium text-destructive">
                              {entity.complaints.active} active / {entity.complaints.total} total
                            </span>
                          ) : (
                            <span className="text-muted-foreground">
                              {entity.complaints.total} total
                            </span>
                          )}
                        </Link>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="icon" asChild>
                          <Link
                            href={`/t/${slug}/admin/${entity.type === "resident" ? "residents" : "pets"}/${entity.id}/edit`}
                          >
                            <Pencil className="h-4 w-4" />
                          </Link>
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => setDeleteDialogEntity(entity)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete {selectedEntities.length} item
              {selectedEntities.length > 1 ? "s" : ""}. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBulkDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!deleteDialogEntity} onOpenChange={(open) => !open && setDeleteDialogEntity(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {deleteDialogEntity?.type}?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete {deleteDialogEntity?.name}. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleIndividualDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
