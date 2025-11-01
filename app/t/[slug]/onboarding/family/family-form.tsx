"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { createClient } from "@/lib/supabase/client"
import { OnboardingProgress } from "@/components/onboarding-progress"
import { Users, Plus, X, PawPrint } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Combobox } from "@/components/ui/combobox"

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

const ONBOARDING_STEPS = [
  { path: "welcome", title: "Welcome" },
  { path: "journey", title: "Journey" },
  { path: "profile", title: "Profile" },
  { path: "interests", title: "Interests" },
  { path: "skills", title: "Skills" },
  { path: "family", title: "Family" },
  { path: "complete", title: "Complete" },
]

interface FamilyFormProps {
  tenant: any
  resident: any
  familyUnit: any
  familyMembers: any[]
  existingRelationships: any[]
  pets: any[]
  lotResidents: any[]
  isSuperAdmin: boolean
}

export function FamilyForm({
  tenant,
  resident,
  familyUnit,
  familyMembers,
  existingRelationships,
  pets: initialPets,
  lotResidents,
  isSuperAdmin,
}: FamilyFormProps) {
  const router = useRouter()
  const [relationships, setRelationships] = useState<Record<string, string>>(
    existingRelationships.reduce(
      (acc, rel) => ({
        ...acc,
        [rel.related_user_id]: rel.relationship_type,
      }),
      {},
    ),
  )
  const [pets, setPets] = useState(initialPets)
  const [newPet, setNewPet] = useState({ name: "", species: "", breed: "" })
  const [showAddPet, setShowAddPet] = useState(false)
  const [selectedResident, setSelectedResident] = useState<string>("")
  const [isSaving, setIsSaving] = useState(false)

  const hasPetsFeature = tenant.features?.pets

  const handleRelationshipChange = (userId: string, relationshipType: string) => {
    setRelationships((prev) => ({
      ...prev,
      [userId]: relationshipType,
    }))
  }

  const handleAddPet = () => {
    if (newPet.name && newPet.species) {
      setPets([...pets, { ...newPet, id: `temp-${Date.now()}` }])
      setNewPet({ name: "", species: "", breed: "" })
      setShowAddPet(false)
    }
  }

  const handleRemovePet = (petId: string) => {
    setPets(pets.filter((p) => p.id !== petId))
  }

  const handleAddFamilyMember = () => {
    if (selectedResident) {
      const residentToAdd = lotResidents.find((r) => r.id === selectedResident)
      if (residentToAdd) {
        familyMembers.push(residentToAdd)
        setSelectedResident("")
      }
    }
  }

  const handleContinue = async () => {
    if (isSuperAdmin) {
      router.push(`/t/${tenant.slug}/onboarding/complete`)
      return
    }

    setIsSaving(true)
    const supabase = createClient()

    try {
      // Save relationships
      for (const [relatedUserId, relationshipType] of Object.entries(relationships)) {
        if (relationshipType) {
          const { error } = await supabase.from("family_relationships").upsert(
            {
              user_id: resident.id,
              related_user_id: relatedUserId,
              relationship_type: relationshipType,
              tenant_id: tenant.id,
            },
            {
              onConflict: "user_id,related_user_id",
            },
          )

          if (error) {
            console.error("[v0] Error saving relationship:", error)
          }
        }
      }

      // Save new pets (only those with temp IDs)
      if (hasPetsFeature && familyUnit) {
        const newPets = pets.filter((p) => p.id.startsWith("temp-"))
        for (const pet of newPets) {
          const { error } = await supabase.from("pets").insert({
            name: pet.name,
            species: pet.species,
            breed: pet.breed || null,
            family_unit_id: familyUnit.id,
            lot_id: resident.lot_id,
          })

          if (error) {
            console.error("[v0] Error saving pet:", error)
          }
        }
      }

      console.log("[v0] Family data saved successfully")
      router.push(`/t/${tenant.slug}/onboarding/complete`)
    } catch (error) {
      console.error("[v0] Error saving family data:", error)
    } finally {
      setIsSaving(false)
    }
  }

  const handleBack = () => {
    router.push(`/t/${tenant.slug}/onboarding/skills`)
  }

  return (
    <div className="space-y-6">
      <OnboardingProgress currentStep={6} totalSteps={7} steps={ONBOARDING_STEPS} tenantSlug={tenant.slug} />

      <div className="space-y-2 text-center">
        <div className="flex items-center justify-center gap-2">
          <Users className="h-5 w-5 text-primary" />
          <h2 className="text-2xl font-bold">Map Your Family</h2>
        </div>
        <p className="text-muted-foreground">
          {familyUnit
            ? "Define your relationships with family members"
            : "No family unit has been created yet. Your administrator can set this up for you."}
        </p>
      </div>

      <div className="space-y-4">
        {!familyUnit && lotResidents.length === 0 && (
          <Card>
            <CardContent className="p-8 text-center">
              <Users className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-semibold">No family members yet</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                No other residents found in your lot. Your administrator can add family members.
              </p>
            </CardContent>
          </Card>
        )}

        {familyUnit && familyMembers.length > 0 && (
          <div className="space-y-3">
            <Label>Family Members</Label>
            {familyMembers.map((member) => (
              <Card key={member.id}>
                <CardContent className="flex items-center gap-4 p-4">
                  <Avatar>
                    <AvatarImage src={member.profile_picture_url || "/placeholder.svg"} />
                    <AvatarFallback>
                      {member.first_name?.[0]}
                      {member.last_name?.[0]}
                    </AvatarFallback>
                  </Avatar>
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
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {lotResidents.length > 0 && (
          <div className="space-y-3">
            <Label>Add Family Member</Label>
            <div className="flex gap-2">
              <div className="flex-1">
                <Combobox
                  options={lotResidents.map((r) => ({
                    value: r.id,
                    label: `${r.first_name} ${r.last_name} (${r.email})`,
                  }))}
                  value={selectedResident}
                  onValueChange={setSelectedResident}
                  placeholder="Search residents..."
                  emptyText="No residents found"
                />
              </div>
              <Button onClick={handleAddFamilyMember} disabled={!selectedResident}>
                <Plus className="h-4 w-4 mr-2" />
                Add
              </Button>
            </div>
          </div>
        )}

        {hasPetsFeature && familyUnit && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="flex items-center gap-2">
                <PawPrint className="h-4 w-4" />
                Pets
              </Label>
              {!showAddPet && (
                <Button variant="outline" size="sm" onClick={() => setShowAddPet(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Pet
                </Button>
              )}
            </div>

            {pets.map((pet) => (
              <Card key={pet.id}>
                <CardContent className="flex items-center justify-between p-4">
                  <div>
                    <p className="font-medium">{pet.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {pet.species}
                      {pet.breed && ` • ${pet.breed}`}
                    </p>
                  </div>
                  {pet.id.startsWith("temp-") && (
                    <Button variant="ghost" size="sm" onClick={() => handleRemovePet(pet.id)}>
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))}

            {showAddPet && (
              <Card>
                <CardContent className="space-y-4 p-4">
                  <div className="space-y-2">
                    <Label htmlFor="pet-name">Pet Name</Label>
                    <Input
                      id="pet-name"
                      value={newPet.name}
                      onChange={(e) => setNewPet({ ...newPet, name: e.target.value })}
                      placeholder="e.g., Max"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="pet-species">Species</Label>
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
                    <Button onClick={handleAddPet} disabled={!newPet.name || !newPet.species}>
                      Add Pet
                    </Button>
                    <Button variant="outline" onClick={() => setShowAddPet(false)}>
                      Cancel
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>

      <div className="flex justify-between gap-3 pt-4">
        <Button variant="outline" onClick={handleBack}>
          Back
        </Button>
        <Button onClick={handleContinue} disabled={isSaving}>
          {isSaving ? "Saving..." : "Continue"}
        </Button>
      </div>
    </div>
  )
}
