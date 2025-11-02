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

const RELATIONSHIP_TYPES = [
  { value: "spouse", label: "Spouse" },
  { value: "partner", label: "Partner" },
  { value: "father", label: "Father" },
  { value: "mother", label: "Mother" },
  { value: "son", label: "Son" },
  { value: "daughter", label: "Daughter" },
  { value: "sibling", label: "Sibling" },
  { value: "other", label: "Other" },
]

export function EditFamilyForm({
  slug,
  family,
  residents,
  pets,
  existingRelationships,
}: {
  slug: string
  family: Family
  residents: Resident[]
  pets: Pet[]
  existingRelationships: any[]
}) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [familyName, setFamilyName] = useState(family.name)
  const [primaryContactId, setPrimaryContactId] = useState(family.primary_contact_id || "")

  const [relationships, setRelationships] = useState<Record<string, Record<string, string>>>(
    existingRelationships.reduce((acc, rel) => {
      if (!acc[rel.user_id]) acc[rel.user_id] = {}
      acc[rel.user_id][rel.related_user_id] = rel.relationship_type
      return acc
    }, {}),
  )

  const handleRelationshipChange = (userId: string, relatedUserId: string, relationshipType: string) => {
    setRelationships((prev) => ({
      ...prev,
      [userId]: {
        ...prev[userId],
        [relatedUserId]: relationshipType,
      },
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const supabase = createBrowserClient()

    const validPrimaryContact = primaryContactId && residents.some((r) => r.id === primaryContactId)

    const { error } = await supabase
      .from("family_units")
      .update({
        name: familyName,
        primary_contact_id: validPrimaryContact ? primaryContactId : null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", family.id)

    if (error) {
      console.error("Error updating family:", error)
      setLoading(false)
      return
    }

    for (const userId of Object.keys(relationships)) {
      for (const [relatedUserId, relationshipType] of Object.entries(relationships[userId])) {
        if (relationshipType) {
          await supabase.from("family_relationships").upsert(
            {
              user_id: userId,
              related_user_id: relatedUserId,
              relationship_type: relationshipType,
              tenant_id: family.tenant_id,
            },
            {
              onConflict: "user_id,related_user_id",
            },
          )
        }
      }
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

          {residents.length > 1 && (
            <div className="space-y-4">
              <Label className="text-base">Family Relationships</Label>
              <p className="text-sm text-muted-foreground">Define how family members are related to each other</p>
              {residents.map((resident, idx) => (
                <div key={resident.id} className="space-y-3">
                  {residents
                    .filter((_, i) => i !== idx)
                    .map((relatedResident) => (
                      <div key={`${resident.id}-${relatedResident.id}`} className="flex items-center gap-3">
                        <div className="flex-1 text-sm">
                          <span className="font-medium">{resident.first_name}</span>
                          <span className="text-muted-foreground"> is </span>
                        </div>
                        <div className="w-40">
                          <Select
                            value={relationships[resident.id]?.[relatedResident.id] || ""}
                            onValueChange={(value) => handleRelationshipChange(resident.id, relatedResident.id, value)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Relationship" />
                            </SelectTrigger>
                            <SelectContent>
                              {RELATIONSHIP_TYPES.map((type) => (
                                <SelectItem key={type.value} value={type.value}>
                                  {type.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="flex-1 text-sm">
                          <span className="text-muted-foreground"> of </span>
                          <span className="font-medium">{relatedResident.first_name}</span>
                        </div>
                      </div>
                    ))}
                </div>
              ))}
            </div>
          )}

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
