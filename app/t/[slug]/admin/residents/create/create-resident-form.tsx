"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { createBrowserClient } from "@/lib/supabase/client"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, Plus, Trash2, ArrowLeft } from "lucide-react"

type Lot = {
  id: string
  lot_number: string
  neighborhoods: {
    id: string
    name: string
  }
}

type ExistingResident = {
  id: string
  first_name: string
  last_name: string
  family_unit_id: string | null
  family_units?: {
    id: string
    name: string
  }
}

export function CreateResidentForm({ slug, lots }: { slug: string; lots: Lot[] }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState(1)
  const [selectedLotId, setSelectedLotId] = useState("")
  const [existingResidents, setExistingResidents] = useState<ExistingResident[]>([])
  const [assignmentChoice, setAssignmentChoice] = useState<"add_to_family" | "reassign" | "">("")

  const [needsNewFamilyUnit, setNeedsNewFamilyUnit] = useState(false)
  const [newFamilyUnitName, setNewFamilyUnitName] = useState("")
  const [primaryContactChoice, setPrimaryContactChoice] = useState<"existing" | "new">("existing")

  const [familyData, setFamilyData] = useState({
    family_name: "",
    members: [{ first_name: "", last_name: "", email: "", phone: "" }],
    pets: [{ name: "", species: "", breed: "" }],
    primary_contact_index: 0,
  })

  useEffect(() => {
    const checkExistingResidents = async () => {
      if (!selectedLotId) return

      const supabase = createBrowserClient()
      const { data } = await supabase
        .from("users")
        .select("id, first_name, last_name, family_unit_id, family_units(id, name)")
        .eq("lot_id", selectedLotId)
        .eq("role", "resident")

      if (data && data.length > 0) {
        setExistingResidents(data)

        const existingFamilyUnit = data.find((r: any) => r.family_unit_id && r.family_unit_id !== "" && r.family_units)
        if (existingFamilyUnit?.family_units) {
          setNewFamilyUnitName(existingFamilyUnit.family_units.name)
          setNeedsNewFamilyUnit(false)
        } else {
          setNeedsNewFamilyUnit(true)
        }
      } else {
        setExistingResidents([])
      }
    }

    checkExistingResidents()
  }, [selectedLotId])

  const handleLotSelection = () => {
    if (!selectedLotId) return

    if (existingResidents.length > 0) {
      setStep(2) // Go to assignment choice
    } else {
      setStep(3) // Straight to unified creation form associated with new lot
    }
  }

  const handleAssignmentChoice = () => {
    if (!assignmentChoice) return

    if (assignmentChoice === "add_to_family") {
      const hasExistingFamilyUnit = existingResidents.some(
        (r: any) => r.family_unit_id && r.family_unit_id !== "" && r.family_units,
      )
      if (!hasExistingFamilyUnit) {
        setNeedsNewFamilyUnit(true)
        setStep(2.5) // New intermediate step to name the family unit
        return
      }
      // If family unit exists, we just need to collect member info in Step 3
    }

    // If reassign, we also go to Step 3 to collect new resident info
    setStep(3)
  }

  const handleFamilyUnitSetup = () => {
    if (!newFamilyUnitName) return
    setStep(3)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const supabase = createBrowserClient()

    try {
      const { data: tenant } = await supabase.from("tenants").select("id").eq("slug", slug).single()
      if (!tenant) throw new Error("Tenant not found")

      // Logic for Reassigning Lot (clearing previous residents)
      if (assignmentChoice === "reassign" && existingResidents.length > 0) {
        const { error: updateError } = await supabase
          .from("users")
          .update({ lot_id: null })
          .in(
            "id",
            existingResidents.map((r) => r.id),
          )
        if (updateError) throw updateError
      }

      // Logic A: Adding to an EXISTING family unit (or one we just defined in step 2.5) on this lot
      if (assignmentChoice === "add_to_family") {
        let targetFamilyUnitId = existingResidents.find(r => r.family_unit_id)?.family_unit_id;

        // If we created a name in step 2.5 because it didn't exist
        if (needsNewFamilyUnit && !targetFamilyUnitId) {
          const { data: familyUnit, error: familyError } = await supabase
            .from("family_units")
            .insert({
              name: newFamilyUnitName,
              tenant_id: tenant.id,
            })
            .select()
            .single()

          if (familyError) throw familyError
          targetFamilyUnitId = familyUnit.id;

          // Link existing residents to this new family unit
          const { error: updateExistingError } = await supabase
            .from("users")
            .update({ family_unit_id: familyUnit.id })
            .in("id", existingResidents.map((r) => r.id))

          if (updateExistingError) throw updateExistingError

          // Set primary contact
          const primaryContactId = primaryContactChoice === "existing" ? existingResidents[0].id : null // If 'new', we set it after creating new user
          if (primaryContactId) {
            await supabase.from("family_units").update({ primary_contact_id: primaryContactId }).eq("id", familyUnit.id)
          }
        }

        if (!targetFamilyUnitId) throw new Error("Target family unit ID could not be determined.");

        // Insert New Members
        const membersToInsert = familyData.members
          .filter((m) => m.first_name && m.last_name)
          .map((member) => ({
            lot_id: selectedLotId,
            first_name: member.first_name,
            last_name: member.last_name,
            email: member.email || null,
            phone: member.phone || null,
            family_unit_id: targetFamilyUnitId,
            tenant_id: tenant.id,
            role: "resident" as const,
          }))

        if (membersToInsert.length > 0) {
          const { data: insertedResidents, error: membersError } = await supabase
            .from("users")
            .insert(membersToInsert)
            .select()
          if (membersError) throw membersError

          // If primary contact was set to "new", update family unit now if we just inserted them
          if (needsNewFamilyUnit && primaryContactChoice === "new" && insertedResidents?.length > 0) {
            await supabase.from("family_units").update({ primary_contact_id: insertedResidents[0].id }).eq("id", targetFamilyUnitId)
          }
        }

        // Insert Pets
        const petsToInsert = familyData.pets
          .filter((p) => p.name && p.species)
          .map((pet) => ({
            lot_id: selectedLotId,
            name: pet.name,
            species: pet.species,
            breed: pet.breed || null,
            family_unit_id: targetFamilyUnitId,
          }))

        if (petsToInsert.length > 0) {
          const { error: petsError } = await supabase.from("pets").insert(petsToInsert)
          if (petsError) throw petsError
        }

      } else {
        // Logic B: Creating a NEW Household (Standard Flow)
        // Check if we have multiple members or pets -> requires family unit name
        const isMulti = familyData.members.length > 1 || familyData.pets.length > 0;
        let finalFamilyName = familyData.family_name;

        if (!finalFamilyName) {
          if (isMulti) throw new Error("Family name is required for households with multiple members or pets.");
          // Auto-generate for single person
          finalFamilyName = `The ${familyData.members[0].last_name} Family`;
        }

        const { data: familyUnit, error: familyError } = await supabase
          .from("family_units")
          .insert({
            name: finalFamilyName,
            tenant_id: tenant.id,
          })
          .select()
          .single()

        if (familyError) throw familyError

        // Insert Members
        const membersToInsert = familyData.members
          .filter((m) => m.first_name && m.last_name)
          .map((member) => ({
            lot_id: selectedLotId,
            first_name: member.first_name,
            last_name: member.last_name,
            email: member.email || null,
            phone: member.phone || null,
            family_unit_id: familyUnit.id,
            tenant_id: tenant.id,
            role: "resident" as const,
          }))

        let insertedUsersIds: string[] = [];

        if (membersToInsert.length > 0) {
          const { data: insertedResidents, error: membersError } = await supabase
            .from("users")
            .insert(membersToInsert)
            .select()
          if (membersError) throw membersError
          if (insertedResidents) insertedUsersIds = insertedResidents.map(u => u.id);
        }

        // Set Primary Contact
        if (insertedUsersIds.length > 0) {
          const primaryId = insertedUsersIds[familyData.primary_contact_index] || insertedUsersIds[0];
          await supabase.from("family_units").update({ primary_contact_id: primaryId }).eq("id", familyUnit.id)
        }

        // Insert Pets
        const petsToInsert = familyData.pets
          .filter((p) => p.name && p.species)
          .map((pet) => ({
            lot_id: selectedLotId,
            name: pet.name,
            species: pet.species,
            breed: pet.breed || null,
            family_unit_id: familyUnit.id,
          }))

        if (petsToInsert.length > 0) {
          const { error: petsError } = await supabase.from("pets").insert(petsToInsert)
          if (petsError) throw petsError
        }
      }

      setLoading(false)
      window.location.href = `/t/${slug}/admin/residents`
    } catch (error: any) {
      console.error("Error creating:", error.message)
      setLoading(false)
    }
  }

  const addFamilyMember = () => {
    setFamilyData({
      ...familyData,
      members: [...familyData.members, { first_name: "", last_name: "", email: "", phone: "" }],
    })
  }

  const removeFamilyMember = (index: number) => {
    if (familyData.members.length === 1) return; // Prevent removing the last member
    setFamilyData({
      ...familyData,
      members: familyData.members.filter((_, i) => i !== index),
      // Adjust primary contact index if necessary
      primary_contact_index: familyData.primary_contact_index === index ? 0 : (familyData.primary_contact_index > index ? familyData.primary_contact_index - 1 : familyData.primary_contact_index)
    })
  }

  const addPet = () => {
    // If we're adding the first pet, and we previously had 1 member (which is default), we might need to enforce family name logic essentially but the UI handles showing the field.
    setFamilyData({
      ...familyData,
      pets: [...familyData.pets, { name: "", species: "", breed: "" }],
    })
  }

  const removePet = (index: number) => {
    setFamilyData({
      ...familyData,
      pets: familyData.pets.filter((_, i) => i !== index),
    })
  }

  const selectedLot = lots.find((l) => l.id === selectedLotId)

  return (
    <div className="space-y-6">
      {step === 1 && (
        <Card>
          <CardHeader>
            <CardTitle>Step 1: Select Lot</CardTitle>
            <CardDescription>Choose which lot to assign</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="lot_id">
                Lot <span className="text-destructive">*</span>
              </Label>
              <Select value={selectedLotId} onValueChange={setSelectedLotId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a lot" />
                </SelectTrigger>
                <SelectContent>
                  {lots.map((lot) => (
                    <SelectItem key={lot.id} value={lot.id}>
                      {lot.lot_number} - {lot.neighborhoods.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button onClick={handleLotSelection} disabled={!selectedLotId}>
              Continue
            </Button>
          </CardContent>
        </Card>
      )}

      {step === 2 && existingResidents.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Step 2: Lot Assignment</CardTitle>
            <CardDescription>
              Lot {selectedLot?.lot_number} already has {existingResidents.length} resident(s)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Existing residents: {existingResidents.map((r) => `${r.first_name} ${r.last_name}`).join(", ")}
              </AlertDescription>
            </Alert>

            <RadioGroup
              value={assignmentChoice}
              onValueChange={(v) => setAssignmentChoice(v as "add_to_family" | "reassign")}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="add_to_family" id="add_to_family" />
                <Label htmlFor="add_to_family">Add to family unit in lot {selectedLot?.lot_number}</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="reassign" id="reassign" />
                <Label htmlFor="reassign">Re-assign lot (remove existing residents)</Label>
              </div>
            </RadioGroup>

            <div className="flex gap-2 justify-between">
              <Button variant="outline" onClick={() => setStep(1)}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={() => router.push(`/t/${slug}/admin/residents`)}>
                  Cancel
                </Button>
                <Button onClick={handleAssignmentChoice} disabled={!assignmentChoice}>
                  Continue
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {step === 2.5 && needsNewFamilyUnit && (
        <Card>
          <CardHeader>
            <CardTitle>Create Family Unit</CardTitle>
            <CardDescription>
              No family unit exists for this lot yet. Create one to group these residents together.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="family_unit_name">
                Family Unit Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="family_unit_name"
                placeholder="e.g., Smith Family"
                value={newFamilyUnitName}
                onChange={(e) => setNewFamilyUnitName(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Primary Contact</Label>
              <RadioGroup
                value={primaryContactChoice}
                onValueChange={(v) => setPrimaryContactChoice(v as "existing" | "new")}
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="existing" id="existing_contact" />
                  <Label htmlFor="existing_contact">
                    Existing resident: {existingResidents[0]?.first_name} {existingResidents[0]?.last_name}
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="new" id="new_contact" />
                  <Label htmlFor="new_contact">New resident (to be created)</Label>
                </div>
              </RadioGroup>
            </div>

            <div className="flex gap-2 justify-between">
              <Button variant="outline" onClick={() => setStep(2)}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={() => router.push(`/t/${slug}/admin/residents`)}>
                  Cancel
                </Button>
                <Button onClick={handleFamilyUnitSetup} disabled={!newFamilyUnitName}>
                  Continue
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {step === 3 && (
        <form onSubmit={handleSubmit} className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Resident Information</CardTitle>
                <div className="flex gap-2">
                  <Button type="button" size="sm" variant="outline" onClick={addPet}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Pet
                  </Button>
                  <Button type="button" size="sm" onClick={addFamilyMember}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Person
                  </Button>
                </div>
              </div>
              <CardDescription>
                Add one or more residents to this lot. They will be grouped into a single household.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Family Name Field - Conditional */}
              {(familyData.members.length > 1 || familyData.pets.length > 0) && (
                <div className="space-y-2 p-4 bg-muted/50 rounded-lg border">
                  <Label htmlFor="family_name">
                    Household / Family Name <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="family_name"
                    placeholder="e.g., Smith Family"
                    value={familyData.family_name}
                    onChange={(e) => setFamilyData({ ...familyData, family_name: e.target.value })}
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    Required when adding multiple members or pets.
                  </p>
                </div>
              )}

              {/* Members List */}
              <div className="space-y-4">
                {familyData.members.map((member, index) => (
                  <div key={index} className="space-y-4 p-4 border rounded-lg relative bg-card">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-sm font-medium text-muted-foreground">Person {index + 1}</h4>
                      {familyData.members.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 text-muted-foreground hover:text-destructive"
                          onClick={() => removeFamilyMember(index)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>First Name <span className="text-destructive">*</span></Label>
                        <Input
                          value={member.first_name}
                          onChange={(e) => {
                            const newMembers = [...familyData.members]
                            newMembers[index].first_name = e.target.value
                            setFamilyData({ ...familyData, members: newMembers })
                          }}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Last Name <span className="text-destructive">*</span></Label>
                        <Input
                          value={member.last_name}
                          onChange={(e) => {
                            const newMembers = [...familyData.members]
                            newMembers[index].last_name = e.target.value
                            setFamilyData({ ...familyData, members: newMembers })
                          }}
                          required
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Email</Label>
                        <Input
                          type="email"
                          value={member.email}
                          onChange={(e) => {
                            const newMembers = [...familyData.members]
                            newMembers[index].email = e.target.value
                            setFamilyData({ ...familyData, members: newMembers })
                          }}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Phone</Label>
                        <Input
                          type="tel"
                          value={member.phone}
                          onChange={(e) => {
                            const newMembers = [...familyData.members]
                            newMembers[index].phone = e.target.value
                            setFamilyData({ ...familyData, members: newMembers })
                          }}
                        />
                      </div>
                    </div>

                    {/* Primary Contact Selection if multiple */}
                    {familyData.members.length > 1 && (
                      <div className="flex items-center space-x-2 mt-2">
                        <RadioGroup
                          value={familyData.primary_contact_index.toString()}
                          onValueChange={(v) =>
                            setFamilyData({ ...familyData, primary_contact_index: Number.parseInt(v) })
                          }
                        >
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value={index.toString()} id={`primary-${index}`} />
                            <Label htmlFor={`primary-${index}`} className="text-xs font-normal">Set as Primary Contact</Label>
                          </div>
                        </RadioGroup>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Pets List */}
              {familyData.pets.length > 0 && (
                <div className="space-y-4 pt-4 border-t">
                  <h3 className="text-lg font-medium">Pets</h3>
                  {familyData.pets.map((pet, index) => (
                    <div key={index} className="space-y-4 p-4 border rounded-lg relative bg-card">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute top-2 right-2 h-6 w-6 text-muted-foreground hover:text-destructive"
                        onClick={() => removePet(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                      <div className="grid grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <Label>Name <span className="text-destructive">*</span></Label>
                          <Input
                            value={pet.name}
                            onChange={(e) => {
                              const newPets = [...familyData.pets]
                              newPets[index].name = e.target.value
                              setFamilyData({ ...familyData, pets: newPets })
                            }}
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Species <span className="text-destructive">*</span></Label>
                          <Input
                            placeholder="e.g., Dog"
                            value={pet.species}
                            onChange={(e) => {
                              const newPets = [...familyData.pets]
                              newPets[index].species = e.target.value
                              setFamilyData({ ...familyData, pets: newPets })
                            }}
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Breed</Label>
                          <Input
                            value={pet.breed}
                            onChange={(e) => {
                              const newPets = [...familyData.pets]
                              newPets[index].breed = e.target.value
                              setFamilyData({ ...familyData, pets: newPets })
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  ))
                  }
                </div>
              )}

              <div className="flex gap-2 justify-between pt-4">
                <Button variant="outline" type="button" onClick={() => setStep(existingResidents.length > 0 ? 2 : 1)}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>
                <div className="flex gap-2">
                  <Button type="button" variant="outline" onClick={() => router.push(`/t/${slug}/admin/residents`)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={loading}>
                    {loading ? "Creating..." : "Create Household"}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </form>
      )}
    </div>
  )
}
