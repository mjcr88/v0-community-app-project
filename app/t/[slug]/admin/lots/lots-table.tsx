"use client"

import { useState, useMemo } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Checkbox } from "@/components/ui/checkbox"
import { Plus, Pencil, ArrowUpDown, Trash2 } from "lucide-react"
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
import { createBrowserClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"

type SortField = "lot_number" | "neighborhood" | "residents" | "created_at"
type SortDirection = "asc" | "desc"

type Lot = {
  id: string
  lot_number: string
  address: string | null
  created_at: string
  neighborhoods: {
    id: string
    name: string
    tenant_id: string
  } | null
  users: Array<{
    id: string
    first_name: string
    last_name: string
  }>
}

export function LotsTable({ slug, initialLots }: { slug: string; initialLots: Lot[] }) {
  const router = useRouter()
  const [sortField, setSortField] = useState<SortField>("created_at")
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc")
  const [selectedLots, setSelectedLots] = useState<Set<string>>(new Set())
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortDirection("asc")
    }
  }

  const toggleLotSelection = (lotId: string) => {
    const newSelected = new Set(selectedLots)
    if (newSelected.has(lotId)) {
      newSelected.delete(lotId)
    } else {
      newSelected.add(lotId)
    }
    setSelectedLots(newSelected)
  }

  const toggleSelectAll = () => {
    if (selectedLots.size === sortedLots.length) {
      setSelectedLots(new Set())
    } else {
      setSelectedLots(new Set(sortedLots.map((lot) => lot.id)))
    }
  }

  const handleBulkDelete = async () => {
    setIsDeleting(true)
    const supabase = createBrowserClient()

    const { error } = await supabase.from("lots").delete().in("id", Array.from(selectedLots))

    if (error) {
      console.error("Error deleting lots:", error)
      alert("Failed to delete lots. Please try again.")
      setIsDeleting(false)
      return
    }

    setShowDeleteDialog(false)
    setSelectedLots(new Set())
    setIsDeleting(false)
    router.refresh()
  }

  const sortedLots = useMemo(() => {
    return [...initialLots].sort((a, b) => {
      let aValue: any
      let bValue: any

      if (sortField === "neighborhood") {
        aValue = a.neighborhoods?.name || ""
        bValue = b.neighborhoods?.name || ""
      } else if (sortField === "lot_number") {
        aValue = a.lot_number
        bValue = b.lot_number
      } else if (sortField === "residents") {
        aValue = a.users?.length || 0
        bValue = b.users?.length || 0
      } else {
        aValue = new Date(a.created_at).getTime()
        bValue = new Date(b.created_at).getTime()
      }

      if (sortDirection === "asc") {
        return aValue > bValue ? 1 : -1
      } else {
        return aValue < bValue ? 1 : -1
      }
    })
  }, [initialLots, sortField, sortDirection])

  const lotCount = initialLots.length

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Lots</h2>
          <p className="text-muted-foreground">Manage lots in your community ({lotCount} total)</p>
        </div>
        <div className="flex gap-2">
          {selectedLots.size > 0 && (
            <Button variant="destructive" onClick={() => setShowDeleteDialog(true)}>
              <Trash2 className="mr-2 h-4 w-4" />
              Delete {selectedLots.size} {selectedLots.size === 1 ? "Lot" : "Lots"}
            </Button>
          )}
          <Button asChild>
            <Link href={`/t/${slug}/admin/lots/create`}>
              <Plus className="mr-2 h-4 w-4" />
              Create Lot
            </Link>
          </Button>
        </div>
      </div>

      {sortedLots.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>All Lots</CardTitle>
            <CardDescription>Click column headers to sort</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox
                      checked={selectedLots.size === sortedLots.length && sortedLots.length > 0}
                      onCheckedChange={toggleSelectAll}
                      aria-label="Select all lots"
                    />
                  </TableHead>
                  <TableHead>
                    <Button
                      variant="ghost"
                      onClick={() => handleSort("lot_number")}
                      className="h-auto p-0 font-semibold hover:bg-transparent"
                    >
                      Lot Number
                      <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button
                      variant="ghost"
                      onClick={() => handleSort("neighborhood")}
                      className="h-auto p-0 font-semibold hover:bg-transparent"
                    >
                      Neighborhood
                      <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button
                      variant="ghost"
                      onClick={() => handleSort("residents")}
                      className="h-auto p-0 font-semibold hover:bg-transparent"
                    >
                      Residents
                      <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button
                      variant="ghost"
                      onClick={() => handleSort("created_at")}
                      className="h-auto p-0 font-semibold hover:bg-transparent"
                    >
                      Created
                      <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                  </TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedLots.map((lot) => (
                  <TableRow key={lot.id}>
                    <TableCell>
                      <Checkbox
                        checked={selectedLots.has(lot.id)}
                        onCheckedChange={() => toggleLotSelection(lot.id)}
                        aria-label={`Select lot ${lot.lot_number}`}
                      />
                    </TableCell>
                    <TableCell className="font-medium">{lot.lot_number}</TableCell>
                    <TableCell>{lot.neighborhoods?.name || "—"}</TableCell>
                    <TableCell>
                      {lot.users && lot.users.length > 0 ? (
                        <div className="flex flex-col gap-1">
                          <span className="font-medium">
                            {lot.users.length} resident{lot.users.length !== 1 ? "s" : ""}
                          </span>
                          <span className="text-sm text-muted-foreground">
                            {lot.users.map((u) => `${u.first_name} ${u.last_name}`).join(", ")}
                          </span>
                        </div>
                      ) : (
                        "—"
                      )}
                    </TableCell>
                    <TableCell>{new Date(lot.created_at).toLocaleDateString()}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/t/${slug}/admin/lots/${lot.id}/edit`}>
                          <Pencil className="h-4 w-4" />
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>No Lots Yet</CardTitle>
            <CardDescription>Get started by creating your first lot</CardDescription>
          </CardHeader>
        </Card>
      )}

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Delete {selectedLots.size} {selectedLots.size === 1 ? "Lot" : "Lots"}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the selected{" "}
              {selectedLots.size === 1 ? "lot" : "lots"}.
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
    </div>
  )
}
