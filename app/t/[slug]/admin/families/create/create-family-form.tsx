"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Trash2 } from "lucide-react"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Checkbox } from "@/components/ui/checkbox"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { createFamilyUnit } from "@/app/actions/families"

type Lot = {
  id: string
  lot_number: string
  neighborhoods: { name: string } | null
}

type Resident = {
  id: string
  first_name: string
  last_name: string
  email: string | null
  phone: string | null
  lots: {
    lot_number: string
    neighborhoods: { name: string } | null
  } | null
}

type FamilyMember = {
  id: string
  first_name: string
  last_name: string
  email: string
  phone: string
}

type Pet = {
  id: string
  name: string
  species: string
  breed: string
}

export default function CreateFamilyForm({
  slug,
  tenantId,
  lots,
  existingResidents,
}: {
  slug: string
  tenantId: string
  lots: Lot[]
  existingResidents: Resident[]
}) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [familyName, setFamilyName] = useState("")

  const [creationMode, setCreationMode] = useState<"existing" | "new">("existing")
  const [selectedResidentIds, setSelectedResidentIds] = useState<string[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedLotId, setSelectedLotId] = useState<string>("")

  const [members, setMembers] = useState<FamilyMember[]>([
    { id: crypto.randomUUID(), first_name: "", last_name: "", email: "", phone: "" },
  ])
  const [pets, setPets] = useState<Pet[]>([])
  const [primaryContactIndex, setPrimaryContactIndex] = useState(0)

  const addMember = () => {
    setMembers([...members, { id: crypto.randomUUID(), first_name: "", last_name: "", email: "", phone: "" }])
  }

  const removeMember = (id: string) => {
    if (members.length > 1) {
      setMembers(members.filter((m) => m.id !== id))
    }
  }

  const updateMember = (id: string, field: keyof FamilyMember, value: string) => {
    setMembers(members.map((m) => (m.id === id ? { ...m, [field]: value } : m)))
  }

  const addPet = () => {
    setPets([...pets, { id: crypto.randomUUID(), name: "", species: "", breed: "" }])
  }

  const removePet = (id: string) => {
    setPets(pets.filter((p) => p.id !== id))
  }

  const updatePet = (id: string, field: keyof Pet, value: string) => {
    setPets(pets.map((p) => (p.id === id ? { ...p, [field]: value } : p)))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const result = await createFamilyUnit(slug, tenantId, {
        familyName,
        mode: creationMode,
        selectedResidentIds: creationMode === "existing" ? selectedResidentIds : undefined,
        selectedLotId: creationMode === "new" ? selectedLotId : undefined,
        members: creationMode === "new" ? members : undefined,
        pets: creationMode === "new" && pets.length > 0 ? pets : undefined,
        primaryContactIndex: creationMode === "new" ? primaryContactIndex : undefined,
      })

      if (!result.success) {
        alert(result.error || "Failed to create family unit")
        return
      }

      router.push(`/t/${slug}/admin/families`)
      router.refresh()
    } catch (error) {
      console.error("Error creating family:", error)
      alert("Failed to create family unit")
    } finally {
      setLoading(false)
    }
  }

  const toggleResidentSelection = (residentId: string) => {
    setSelectedResidentIds((prev) =>
      prev.includes(residentId) ? prev.filter((id) => id !== residentId) : [...prev, residentId],
    )
  }

  const filteredResidents = existingResidents.filter((resident) => {
    const fullName = `${resident.first_name} ${resident.last_name}`.toLowerCase()
    const lotNumber = resident.lots?.lot_number?.toLowerCase() || ""
    const query = searchQuery.toLowerCase()
    return fullName.includes(query) || lotNumber.includes(query)
  })

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Family Details</CardTitle>
          <CardDescription>Enter the family name</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="family-name">Family Name</Label>
            <Input
              id="family-name"
              value={familyName}
              onChange={(e) => setFamilyName(e.target.value)}
              placeholder="e.g., Smith Family"
              required
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Creation Mode</CardTitle>
          <CardDescription>Select existing residents or create new family members</CardDescription>
        </CardHeader>
        <CardContent>
          <RadioGroup value={creationMode} onValueChange={(value: any) => setCreationMode(value)}>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="existing" id="existing" />
              <Label htmlFor="existing">Select from existing residents</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="new" id="new" />
              <Label htmlFor="new">Create new family members</Label>
            </div>
          </RadioGroup>
        </CardContent>
      </Card>

      {creationMode === "existing" ? (
        <Card>
          <CardHeader>
            <CardTitle>Select Residents</CardTitle>
            <CardDescription>Choose existing residents to add to this family unit</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="search">Search Residents</Label>
              <Input
                id="search"
                placeholder="Search by name or lot number..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12"></TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Lot</TableHead>
                    <TableHead>Neighborhood</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredResidents.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-muted-foreground">
                        No residents found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredResidents.map((resident) => (
                      <TableRow key={resident.id}>
                        <TableCell>
                          <Checkbox
                            id={resident.id}
                            checked={selectedResidentIds.includes(resident.id)}
                            onCheckedChange={() => toggleResidentSelection(resident.id)}
                          />
                        </TableCell>
                        <TableCell>
                          {resident.first_name} {resident.last_name}
                        </TableCell>
                        <TableCell>{resident.lots?.lot_number || "—"}</TableCell>
                        <TableCell>{resident.lots?.neighborhoods?.name || "—"}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Lot Assignment</CardTitle>
              <CardDescription>Select the lot where this family will reside</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label htmlFor="lot">
                  Lot <span className="text-destructive">*</span>
                </Label>
                <Select value={selectedLotId} onValueChange={setSelectedLotId} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a lot" />
                  </SelectTrigger>
                  <SelectContent>
                    {lots.map((lot) => (
                      <SelectItem key={lot.id} value={lot.id}>
                        {lot.lot_number} - {lot.neighborhoods?.name || "No neighborhood"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Family Members</CardTitle>
                  <CardDescription>Add residents to this family unit</CardDescription>
                </div>
                <Button type="button" onClick={addMember} size="sm">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Member
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {members.map((member, index) => (
                <div key={member.id} className="space-y-4 rounded-lg border p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium">Member {index + 1}</h4>
                      {members.length > 1 && (
                        <Select
                          value={primaryContactIndex === index ? "primary" : "member"}
                          onValueChange={(value) => {
                            if (value === "primary") setPrimaryContactIndex(index)
                          }}
                        >
                          <SelectTrigger className="w-[140px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="primary">Primary Contact</SelectItem>
                            <SelectItem value="member">Member</SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                      {members.length === 1 && <span className="text-sm text-muted-foreground">(Primary Contact)</span>}
                    </div>
                    {members.length > 1 && (
                      <Button type="button" variant="ghost" size="icon" onClick={() => removeMember(member.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label>First Name</Label>
                      <Input
                        value={member.first_name}
                        onChange={(e) => updateMember(member.id, "first_name", e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Last Name</Label>
                      <Input
                        value={member.last_name}
                        onChange={(e) => updateMember(member.id, "last_name", e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Email</Label>
                      <Input
                        type="email"
                        value={member.email}
                        onChange={(e) => updateMember(member.id, "email", e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Phone</Label>
                      <Input
                        type="tel"
                        value={member.phone}
                        onChange={(e) => updateMember(member.id, "phone", e.target.value)}
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
                <div>
                  <CardTitle>Pets (Optional)</CardTitle>
                  <CardDescription>Add pets to this family unit</CardDescription>
                </div>
                <Button type="button" onClick={addPet} size="sm">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Pet
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {pets.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">No pets added yet</p>
              ) : (
                pets.map((pet, index) => (
                  <div key={pet.id} className="space-y-4 rounded-lg border p-4">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium">Pet {index + 1}</h4>
                      <Button type="button" variant="ghost" size="icon" onClick={() => removePet(pet.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>

                    <div className="grid gap-4 md:grid-cols-3">
                      <div className="space-y-2">
                        <Label>Name</Label>
                        <Input value={pet.name} onChange={(e) => updatePet(pet.id, "name", e.target.value)} required />
                      </div>
                      <div className="space-y-2">
                        <Label>Species</Label>
                        <Input
                          value={pet.species}
                          onChange={(e) => updatePet(pet.id, "species", e.target.value)}
                          placeholder="e.g., Dog, Cat"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Breed</Label>
                        <Input value={pet.breed} onChange={(e) => updatePet(pet.id, "breed", e.target.value)} />
                      </div>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </>
      )}

      <div className="flex gap-4 justify-end">
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Cancel
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? "Creating..." : "Create Family Unit"}
        </Button>
      </div>
    </form>
  )
}
