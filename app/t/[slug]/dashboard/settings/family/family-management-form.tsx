"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2, Plus, Trash2, Users, PawPrint } from "lucide-react"
import { createClient } from "@/lib/supabase/client"

interface FamilyManagementFormProps {
  resident: any
  familyUnit: any
  familyMembers: any[]
  relationships: any[]
  pets: any[]
  lotResidents: any[]
  petsEnabled: boolean
  tenantSlug: string
}

const RELATIONSHIP_TYPES = [
  { value: "spouse", label: "Spouse" },
  { value: "partner", label: "Partner" },
  { value: "father", label: "Father" },
  { value: "mother", label: "Mother" },
  { value: "sibling", label: "Sibling" },
  { value: "child", label: "Child" },
  { value: "other", label: "Other" },
]

export function FamilyManagementForm({
  resident,
  familyUnit,
  familyMembers: initialFamilyMembers,
  relationships: initialRelationships,
  pets: initialPets,
  lotResidents,
  petsEnabled,
  tenantSlug,
}: FamilyManagementFormProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [familyMembers, setFamilyMembers] = useState(initialFamilyMembers)
  const [relationships, setRelationships] = useState<Record<string, string>>(
    initialRelationships.reduce((acc, rel) => ({ ...acc, [rel.related_user_id]: rel.relationship_type }), {}),
  )
  const [pets, setPets] = useState(initialPets)
  const [newPet, setNewPet] = useState({ name: "", species: "", breed: "" })
  const [showAddPet, setShowAddPet] = useState(false)
  const [showAddFamily, setShowAddFamily] = useState(false)
  const [selectedResident, setSelectedResident] = useState<string>("")

  const handleRelationshipChange = async (relatedUserId: string, relationshipType: string) => {
    setRelationships({ ...relationships, [relatedUserId]: relationshipType })

    const supabase = createClient()

    // Check if relationship exists
    const existing = initialRelationships.find((r) => r.related_user_id === relatedUserId)

    if (existing) {
      // Update existing relationship
      const { error } = await supabase
        .from("family_relationships")
        .update({ relationship_type: relationshipType })
        .eq("id", existing.id)

      if (error) {
        console.error("[v0] Error updating relationship:", error)
      }
    } else {
      // Create new relationship
      const { error } = await supabase.from("family_relationships").insert({
        user_id: resident.id,
        related_user_id: relatedUserId,
        relationship_type: relationshipType,
        tenant_id: resident.tenant_id,
      })

      if (error) {
        console.error("[v0] Error creating relationship:", error)
      }
    }

    router.refresh()
  }

  const handleAddPet = async () => {
    if (!newPet.name || !newPet.species) return

    setIsLoading(true)
    const supabase = createClient()

    try {
      const { data, error } = await supabase
        .from("pets")
        .insert({
          name: newPet.name,
          species: newPet.species,
          breed: newPet.breed || null,
          family_unit_id: resident.family_unit_id,
          lot_id: resident.lot_id,
        })
        .select()
        .single()

      if (error) throw error

      setPets([...pets, data])
      setNewPet({ name: "", species: "", breed: "" })
      setShowAddPet(false)
      router.refresh()
    } catch (error) {
      console.error("[v0] Error adding pet:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeletePet = async (petId: string) => {
    setIsLoading(true)
    const supabase = createClient()

    try {
      const { error } = await supabase.from("pets").delete().eq("id", petId)

      if (error) throw error

      setPets(pets.filter((p) => p.id !== petId))
      router.refresh()
    } catch (error) {
      console.error("[v0] Error deleting pet:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddFamilyMember = async () => {
    if (!selectedResident) return

    setIsLoading(true)
    const supabase = createClient()

    try {
      // Update the selected resident's family_unit_id
      const { error } = await supabase
        .from("users")
        .update({ family_unit_id: resident.family_unit_id })
        .eq("id", selectedResident)

      if (error) throw error

      setShowAddFamily(false)
      setSelectedResident("")
      router.refresh()
    } catch (error) {
      console.error("[v0] Error adding family member:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const availableLotResidents = lotResidents.filter((r) => !familyMembers.some((fm) => fm.id === r.id))

  return (
    <div className="space-y-6">
      {/* Family Members Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Family Members
              </CardTitle>
              <CardDescription>
                {familyUnit
                  ? `Manage your family relationships in ${familyUnit.name}`
                  : "No family unit assigned yet. Contact your administrator to set up your family."}
              </CardDescription>
            </div>
            {familyUnit && availableLotResidents.length > 0 && !showAddFamily && (
              <Button variant="default" size="sm" onClick={() => setShowAddFamily(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Add Family Member
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {showAddFamily && (
            <div className="mb-4 space-y-3 rounded-lg border p-4">
              <div className="space-y-2">
                <Label htmlFor="resident-select">Select Resident</Label>
                <Select value={selectedResident} onValueChange={setSelectedResident}>
                  <SelectTrigger id="resident-select">
                    <SelectValue placeholder="Choose a resident from your lot" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableLotResidents.map((r) => (
                      <SelectItem key={r.id} value={r.id}>
                        {r.first_name} {r.last_name} ({r.email})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-2">
                <Button onClick={handleAddFamilyMember} disabled={isLoading || !selectedResident}>
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Add to Family
                </Button>
                <Button variant="outline" onClick={() => setShowAddFamily(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          )}

          {familyMembers.length === 0 ? (
            <div className="rounded-lg border border-dashed p-8 text-center">
              <Users className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-semibold">No family members yet</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                {availableLotResidents.length > 0
                  ? "Add family members from your household to define relationships"
                  : "No other residents found in your lot"}
              </p>
              {familyUnit && availableLotResidents.length > 0 && (
                <Button variant="default" size="sm" className="mt-4" onClick={() => setShowAddFamily(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Family Member
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {familyMembers.map((member) => (
                <div key={member.id} className="flex items-center justify-between gap-4 rounded-lg border p-4">
                  <div className="flex-1">
                    <p className="font-medium">
                      {member.first_name} {member.last_name}
                    </p>
                    <p className="text-sm text-muted-foreground">{member.email}</p>
                  </div>
                  <div className="w-48">
                    <Select
                      value={relationships[member.id] || ""}
                      onValueChange={(value) => handleRelationshipChange(member.id, value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select relationship" />
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
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pets Section */}
      {petsEnabled && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <PawPrint className="h-5 w-5" />
                  Pets
                </CardTitle>
                <CardDescription>Manage your family pets</CardDescription>
              </div>
              {pets.length > 0 && !showAddPet && (
                <Button variant="default" size="sm" onClick={() => setShowAddPet(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Pet
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {pets.length === 0 && !showAddPet ? (
              <div className="rounded-lg border border-dashed p-8 text-center">
                <PawPrint className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-4 text-lg font-semibold">No pets yet</h3>
                <p className="mt-2 text-sm text-muted-foreground">Add your family pets to your profile</p>
                <Button variant="default" size="sm" className="mt-4" onClick={() => setShowAddPet(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Pet
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {pets.map((pet) => (
                  <div key={pet.id} className="flex items-center justify-between rounded-lg border p-3">
                    <div>
                      <p className="font-medium">{pet.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {pet.species}
                        {pet.breed && ` • ${pet.breed}`}
                      </p>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => handleDeletePet(pet.id)} disabled={isLoading}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}

            {showAddPet && (
              <div className="space-y-3 rounded-lg border p-4">
                <div className="space-y-2">
                  <Label htmlFor="pet-name">Pet Name *</Label>
                  <Input
                    id="pet-name"
                    value={newPet.name}
                    onChange={(e) => setNewPet({ ...newPet, name: e.target.value })}
                    placeholder="e.g., Max"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pet-species">Species *</Label>
                  <Input
                    id="pet-species"
                    value={newPet.species}
                    onChange={(e) => setNewPet({ ...newPet, species: e.target.value })}
                    placeholder="e.g., Dog, Cat"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pet-breed">Breed (Optional)</Label>
                  <Input
                    id="pet-breed"
                    value={newPet.breed}
                    onChange={(e) => setNewPet({ ...newPet, breed: e.target.value })}
                    placeholder="e.g., Golden Retriever"
                  />
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleAddPet} disabled={isLoading || !newPet.name || !newPet.species}>
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Add Pet
                  </Button>
                  <Button variant="outline" onClick={() => setShowAddPet(false)}>
                    Cancel
                  </Button>
                </div>
              </div>
            )}

            {!showAddPet && pets.length > 0 && (
              <Button variant="default" size="sm" onClick={() => setShowAddPet(true)} className="w-full">
                <Plus className="mr-2 h-4 w-4" />
                Add Pet
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
