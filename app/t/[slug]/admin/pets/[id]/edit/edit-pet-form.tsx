"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { createBrowserClient } from "@/lib/supabase/client"
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
import { Trash2 } from "lucide-react"

type Pet = {
  id: string
  name: string
  species: string
  breed: string | null
  lot_id: string
  family_unit_id: string | null
  lots: {
    lot_number: string
    neighborhoods: { name: string }
  }
  family_units: {
    name: string
  } | null
}

type Lot = {
  id: string
  lot_number: string
  neighborhoods: { name: string } | null
}

type FamilyUnit = {
  id: string
  name: string
}

export default function EditPetForm({
  pet,
  lots,
  familyUnits,
  slug,
}: {
  pet: Pet
  lots: Lot[]
  familyUnits: FamilyUnit[]
  slug: string
}) {
  const router = useRouter()
  const supabase = createBrowserClient()
  const [loading, setLoading] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: pet.name,
    species: pet.species,
    breed: pet.breed || "",
    lot_id: pet.lot_id,
    family_unit_id: pet.family_unit_id || "",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const { error } = await supabase
        .from("pets")
        .update({
          name: formData.name,
          species: formData.species,
          breed: formData.breed || null,
          lot_id: formData.lot_id,
          family_unit_id: formData.family_unit_id || null,
        })
        .eq("id", pet.id)

      if (error) throw error

      router.push(`/t/${slug}/admin/residents`)
      router.refresh()
    } catch (error) {
      console.error("Error updating pet:", error)
      alert("Failed to update pet")
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    setDeleteLoading(true)

    try {
      const { error } = await supabase.from("pets").delete().eq("id", pet.id)

      if (error) throw error

      window.location.href = `/t/${slug}/admin/residents`
    } catch (error) {
      console.error("Error deleting pet:", error)
      alert("Failed to delete pet")
      setDeleteLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Edit Pet</h2>
          <p className="text-muted-foreground">Update pet information</p>
        </div>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive" disabled={deleteLoading}>
              <Trash2 className="mr-2 h-4 w-4" />
              {deleteLoading ? "Deleting..." : "Delete Pet"}
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently delete this pet. This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Pet Information</CardTitle>
            <CardDescription>Update the pet's details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="species">Species</Label>
                <Input
                  id="species"
                  value={formData.species}
                  onChange={(e) => setFormData({ ...formData, species: e.target.value })}
                  placeholder="e.g., Dog, Cat"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="breed">Breed</Label>
                <Input
                  id="breed"
                  value={formData.breed}
                  onChange={(e) => setFormData({ ...formData, breed: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lot">Lot</Label>
                <Select value={formData.lot_id} onValueChange={(value) => setFormData({ ...formData, lot_id: value })}>
                  <SelectTrigger id="lot">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {lots.map((lot) => (
                      <SelectItem key={lot.id} value={lot.id}>
                        {lot.lot_number} - {lot.neighborhoods?.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="family">Family Unit (Optional)</Label>
                <Select
                  value={formData.family_unit_id}
                  onValueChange={(value) => setFormData({ ...formData, family_unit_id: value })}
                >
                  <SelectTrigger id="family">
                    <SelectValue placeholder="No family unit" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No family unit</SelectItem>
                    {familyUnits.map((family) => (
                      <SelectItem key={family.id} value={family.id}>
                        {family.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-4">
          <Button type="submit" disabled={loading}>
            {loading ? "Saving..." : "Save Changes"}
          </Button>
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Cancel
          </Button>
        </div>
      </form>
    </div>
  )
}
