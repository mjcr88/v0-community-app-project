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
}

export function CreateResidentForm({ slug, lots }: { slug: string; lots: Lot[] }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState(1)
  const [selectedLotId, setSelectedLotId] = useState("")
  const [existingResidents, setExistingResidents] = useState<ExistingResident[]>([])
  const [assignmentChoice, setAssignmentChoice] = useState<"add_to_family" | "reassign" | "">("")
  const [creationType, setCreationType] = useState<"single" | "family" | "">("")
  const [entityType, setEntityType] = useState<"person" | "pet" | "">("")

  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
  })

  const [familyData, setFamilyData] = useState({
    family_name: "",
    members: [{ first_name: "", last_name: "", email: "", phone: "" }],
    pets: [{ name: "", species: "", breed: "" }],
    primary_contact_index: 0,
  })

  const [petData, setPetData] = useState({
    name: "",
    species: "",
    breed: "",
  })

  useEffect(() => {
    const checkExistingResidents = async () => {
      if (!selectedLotId) return

      const supabase = createBrowserClient()
      const { data } = await supabase
        .from("residents")
        .select("id, first_name, last_name, family_unit_id")
        .eq("lot_id", selectedLotId)

      if (data && data.length > 0) {
        setExistingResidents(data)
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
      setStep(3) // Skip to creation type
    }
  }

  const handleAssignmentChoice = () => {
    if (!assignmentChoice) return
    setStep(3)
  }

  const handleCreationTypeChoice = () => {
    if (!creationType) return

    if (creationType === "single") {
      setStep(4) // Go to entity type selection
    } else {
      setStep(5) // Go to family form
    }
  }

  const handleEntityTypeChoice = () => {
    if (!entityType) return
    setStep(5) // Go to form
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const supabase = createBrowserClient()

    try {
      const { data: tenant } = await supabase.from("tenants").select("id").eq("slug", slug).single()

      if (!tenant) throw new Error("Tenant not found")

      if (assignmentChoice === "reassign" && existingResidents.length > 0) {
        const { error: updateError } = await supabase
          .from("residents")
          .update({ lot_id: null })
          .in(
            "id",
            existingResidents.map((r) => r.id),
          )

        if (updateError) throw updateError
      }

      if (creationType === "family") {
        const { data: familyUnit, error: familyError } = await supabase
          .from("family_units")
          .insert({
            name: familyData.family_name,
            tenant_id: tenant.id,
          })
          .select()
          .single()

        if (familyError) throw familyError

        const membersToInsert = familyData.members
          .filter((m) => m.first_name && m.last_name)
          .map((member) => ({
            lot_id: selectedLotId,
            first_name: member.first_name,
            last_name: member.last_name,
            email: member.email || null,
            phone: member.phone || null,
            family_unit_id: familyUnit.id,
            tenant_id: tenant.id, // Added tenant_id to family members
          }))

        if (membersToInsert.length > 0) {
          const { data: insertedResidents, error: membersError } = await supabase
            .from("residents")
            .insert(membersToInsert)
            .select()

          if (membersError) throw membersError

          if (insertedResidents && insertedResidents.length > 0) {
            const primaryContactId = insertedResidents[familyData.primary_contact_index]?.id || insertedResidents[0].id

            await supabase.from("family_units").update({ primary_contact_id: primaryContactId }).eq("id", familyUnit.id)
          }
        }

        const petsToInsert = familyData.pets
          .filter((p) => p.name && p.species)
          .map((pet) => ({
            lot_id: selectedLotId,
            name: pet.name,
            species: pet.species,
            breed: pet.breed || null,
            family_unit_id: familyUnit.id,
            tenant_id: tenant.id, // Added tenant_id to pets
          }))

        if (petsToInsert.length > 0) {
          const { error: petsError } = await supabase.from("pets").insert(petsToInsert)
          if (petsError) throw petsError
        }
      } else if (entityType === "pet") {
        const family_unit_id =
          assignmentChoice === "add_to_family" && existingResidents[0]?.family_unit_id
            ? existingResidents[0].family_unit_id
            : null

        const { error } = await supabase.from("pets").insert({
          lot_id: selectedLotId,
          name: petData.name,
          species: petData.species,
          breed: petData.breed || null,
          family_unit_id,
          tenant_id: tenant.id, // Added tenant_id to single pet
        })

        if (error) throw error
      } else {
        const family_unit_id =
          assignmentChoice === "add_to_family" && existingResidents[0]?.family_unit_id
            ? existingResidents[0].family_unit_id
            : null

        const { error } = await supabase.from("residents").insert({
          lot_id: selectedLotId,
          first_name: formData.first_name,
          last_name: formData.last_name,
          email: formData.email || null,
          phone: formData.phone || null,
          family_unit_id,
          tenant_id: tenant.id, // Added tenant_id to single resident
        })

        if (error) throw error
      }

      setLoading(false)
      window.location.href = `/t/${slug}/admin/residents`
    } catch (error) {
      console.error("Error creating:", error)
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
    setFamilyData({
      ...familyData,
      members: familyData.members.filter((_, i) => i !== index),
    })
  }

  const addPet = () => {
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

      {step === 3 && (
        <Card>
          <CardHeader>
            <CardTitle>Step {existingResidents.length > 0 ? "3" : "2"}: Creation Type</CardTitle>
            <CardDescription>Choose what you want to create</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <RadioGroup value={creationType} onValueChange={(v) => setCreationType(v as "single" | "family")}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="single" id="single" />
                <Label htmlFor="single">Single Resident or Pet</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="family" id="family" />
                <Label htmlFor="family">Family Unit (Multiple Residents + Pets)</Label>
              </div>
            </RadioGroup>

            <div className="flex gap-2 justify-between">
              <Button variant="outline" onClick={() => setStep(existingResidents.length > 0 ? 2 : 1)}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={() => router.push(`/t/${slug}/admin/residents`)}>
                  Cancel
                </Button>
                <Button onClick={handleCreationTypeChoice} disabled={!creationType}>
                  Continue
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {step === 4 && creationType === "single" && (
        <Card>
          <CardHeader>
            <CardTitle>Step {existingResidents.length > 0 ? "4" : "3"}: Entity Type</CardTitle>
            <CardDescription>Choose between person or pet</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <RadioGroup value={entityType} onValueChange={(v) => setEntityType(v as "person" | "pet")}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="person" id="person" />
                <Label htmlFor="person">Person</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="pet" id="pet" />
                <Label htmlFor="pet">Pet</Label>
              </div>
            </RadioGroup>

            <div className="flex gap-2 justify-between">
              <Button variant="outline" onClick={() => setStep(3)}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={() => router.push(`/t/${slug}/admin/residents`)}>
                  Cancel
                </Button>
                <Button onClick={handleEntityTypeChoice} disabled={!entityType}>
                  Continue
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {step === 5 && (
        <form onSubmit={handleSubmit} className="space-y-6">
          {creationType === "family" ? (
            <>
              <Card>
                <CardHeader>
                  <CardTitle>Family Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="family_name">
                      Family Name <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="family_name"
                      placeholder="e.g., Smith Family"
                      value={familyData.family_name}
                      onChange={(e) => setFamilyData({ ...familyData, family_name: e.target.value })}
                      required
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Family Members</CardTitle>
                    <Button type="button" size="sm" onClick={addFamilyMember}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Member
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {familyData.members.length > 1 && (
                    <div className="space-y-2 p-4 bg-muted rounded-lg">
                      <Label>Primary Contact *</Label>
                      <RadioGroup
                        value={familyData.primary_contact_index.toString()}
                        onValueChange={(v) =>
                          setFamilyData({ ...familyData, primary_contact_index: Number.parseInt(v) })
                        }
                      >
                        {familyData.members.map((member, index) => (
                          <div key={index} className="flex items-center space-x-2">
                            <RadioGroupItem value={index.toString()} id={`primary-${index}`} />
                            <Label htmlFor={`primary-${index}`} className="font-normal">
                              {member.first_name && member.last_name
                                ? `${member.first_name} ${member.last_name}`
                                : `Member ${index + 1}`}
                            </Label>
                          </div>
                        ))}
                      </RadioGroup>
                    </div>
                  )}

                  {familyData.members.map((member, index) => (
                    <div key={index} className="space-y-4 p-4 border rounded-lg relative">
                      {familyData.members.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute top-2 right-2"
                          onClick={() => removeFamilyMember(index)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>First Name *</Label>
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
                          <Label>Last Name *</Label>
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
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Pets (Optional)</CardTitle>
                    <Button type="button" size="sm" onClick={addPet}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Pet
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {familyData.pets.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No pets added yet. Click "Add Pet" to add one.</p>
                  ) : (
                    familyData.pets.map((pet, index) => (
                      <div key={index} className="space-y-4 p-4 border rounded-lg relative">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute top-2 right-2"
                          onClick={() => removePet(index)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                        <div className="grid grid-cols-3 gap-4">
                          <div className="space-y-2">
                            <Label>Name</Label>
                            <Input
                              value={pet.name}
                              onChange={(e) => {
                                const newPets = [...familyData.pets]
                                newPets[index].name = e.target.value
                                setFamilyData({ ...familyData, pets: newPets })
                              }}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Species</Label>
                            <Input
                              value={pet.species}
                              placeholder="e.g., Dog, Cat"
                              onChange={(e) => {
                                const newPets = [...familyData.pets]
                                newPets[index].species = e.target.value
                                setFamilyData({ ...familyData, pets: newPets })
                              }}
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
                  )}
                </CardContent>
              </Card>
            </>
          ) : entityType === "pet" ? (
            <Card>
              <CardHeader>
                <CardTitle>Pet Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="pet_name">
                      Name <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="pet_name"
                      value={petData.name}
                      onChange={(e) => setPetData({ ...petData, name: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="pet_species">
                      Species <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="pet_species"
                      placeholder="e.g., Dog, Cat"
                      value={petData.species}
                      onChange={(e) => setPetData({ ...petData, species: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="pet_breed">Breed</Label>
                    <Input
                      id="pet_breed"
                      value={petData.breed}
                      onChange={(e) => setPetData({ ...petData, breed: e.target.value })}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Resident Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="first_name">
                      First Name <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="first_name"
                      value={formData.first_name}
                      onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="last_name">
                      Last Name <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="last_name"
                      value={formData.last_name}
                      onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="flex gap-2 justify-between">
            <Button type="button" variant="outline" onClick={() => setStep(creationType === "single" ? 4 : 3)}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={() => router.push(`/t/${slug}/admin/residents`)}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading
                  ? "Creating..."
                  : creationType === "family"
                    ? "Create Family"
                    : `Create ${entityType === "pet" ? "Pet" : "Resident"}`}
              </Button>
            </div>
          </div>
        </form>
      )}
    </div>
  )
}
