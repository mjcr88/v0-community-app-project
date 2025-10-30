"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
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
import { createBrowserClient } from "@/lib/supabase/client"
import { Trash2 } from "lucide-react"

type Family = {
  id: string
  name: string
  primary_contact_id: string | null
  primary_contact?: {
    id: string
    first_name: string
    last_name: string
  } | null
}

type Resident = {
  id: string
  first_name: string
  last_name: string
}

type Pet = {
  id: string
  name: string
  species: string
}

export function EditFamilyForm({
  slug,
  family,
  residents,
  pets,
}: {
  slug: string
  family: Family
  residents: Resident[]
  pets: Pet[]
}) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [familyName, setFamilyName] = useState(family.name)
  const [primaryContactId, setPrimaryContactId] = useState(family.primary_contact_id || "")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const supabase = createBrowserClient()

    const { error } = await supabase
      .from("family_units")
      .update({
        name: familyName,
        primary_contact_id: primaryContactId || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", family.id)

    if (error) {
      console.error("Error updating family:", error)
      setLoading(false)
      return
    }

    setLoading(false)
    router.push(`/t/${slug}/admin/families`)
    router.refresh()
  }

  const handleDelete = async () => {
    setDeleteLoading(true)
    const supabase = createBrowserClient()

    const { error } = await supabase.from("family_units").delete().eq("id", family.id)

    if (error) {
      console.error("Error deleting family:", error)
      setDeleteLoading(false)
      return
    }

    window.location.href = `/t/${slug}/admin/families`
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Family Information</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="family-name">Family Name</Label>
            <Input id="family-name" value={familyName} onChange={(e) => setFamilyName(e.target.value)} required />
          </div>

          <div className="space-y-2">
            <Label htmlFor="primary-contact">Primary Contact</Label>
            <Select value={primaryContactId} onValueChange={setPrimaryContactId}>
              <SelectTrigger id="primary-contact">
                <SelectValue placeholder="Select primary contact" />
              </SelectTrigger>
              <SelectContent>
                {residents.map((resident) => (
                  <SelectItem key={resident.id} value={resident.id}>
                    {resident.first_name} {resident.last_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Members ({residents.length})</Label>
            <ul className="text-sm text-muted-foreground">
              {residents.map((resident) => (
                <li key={resident.id}>
                  {resident.first_name} {resident.last_name}
                </li>
              ))}
            </ul>
          </div>

          {pets.length > 0 && (
            <div className="space-y-2">
              <Label>Pets ({pets.length})</Label>
              <ul className="text-sm text-muted-foreground">
                {pets.map((pet) => (
                  <li key={pet.id}>
                    {pet.name} ({pet.species})
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="flex justify-between">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button type="button" variant="destructive" disabled={deleteLoading}>
                  <Trash2 className="mr-2 h-4 w-4" />
                  {deleteLoading ? "Deleting..." : "Delete Family"}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will permanently delete this family unit. Residents and pets will not be deleted, but they will
                    no longer be part of this family.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDelete}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={() => router.push(`/t/${slug}/admin/families`)}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
