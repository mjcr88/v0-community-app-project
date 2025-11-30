"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Loader2, Plus, Trash2, Users, PawPrint, Home, Upload, AlertCircle } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useToast } from "@/hooks/use-toast"
import { PhotoManager } from "@/components/photo-manager"
import { EditableProfileBanner } from "@/components/profile/editable-profile-banner"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface FamilyManagementFormProps {
  resident: any
  familyUnit: any
  familyMembers: any[]
  relationships: any[]
  pets: any[]
  lotResidents: any[]
  petsEnabled: boolean
  tenantSlug: string
  isPrimaryContact: boolean
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
  isPrimaryContact,
}: FamilyManagementFormProps) {
  const router = useRouter()
  const { toast } = useToast()
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
  const [familyProfile, setFamilyProfile] = useState({
    name: familyUnit?.name || "",
    description: familyUnit?.description || "",
    photos: familyUnit?.photos || [],
    heroPhoto: familyUnit?.hero_photo || familyUnit?.profile_picture_url || null,
    bannerImage: familyUnit?.banner_image_url || null,
  })

  useEffect(() => {
    setFamilyMembers(initialFamilyMembers)
    setRelationships(
      initialRelationships.reduce((acc, rel) => ({ ...acc, [rel.related_user_id]: rel.relationship_type }), {}),
    )
    setPets(initialPets)
    setFamilyProfile({
      name: familyUnit?.name || "",
      description: familyUnit?.description || "",
      photos: familyUnit?.photos || [],
      heroPhoto: familyUnit?.hero_photo || familyUnit?.profile_picture_url || null,
      bannerImage: familyUnit?.banner_image_url || null,
    })
  }, [initialFamilyMembers, initialRelationships, initialPets, familyUnit])

  const handleBannerChange = async (url: string | null) => {
    setFamilyProfile(prev => ({ ...prev, bannerImage: url }))
    const supabase = createClient()
    const { error } = await supabase
      .from("family_units")
      .update({ banner_image_url: url })
      .eq("id", familyUnit.id)

    if (error) {
      console.error("Error updating banner:", error)
      toast({
        title: "Error",
        description: "Failed to update banner image",
        variant: "destructive",
      })
    } else {
      router.refresh()
    }
  }

  const handleProfilePhotoChange = async (url: string | null) => {
    setFamilyProfile(prev => ({ ...prev, heroPhoto: url }))
    const supabase = createClient()
    const { error } = await supabase
      .from("family_units")
      .update({
        hero_photo: url,
        profile_picture_url: url
      })
      .eq("id", familyUnit.id)

    if (error) {
      console.error("Error updating profile photo:", error)
      toast({
        title: "Error",
        description: "Failed to update profile photo",
        variant: "destructive",
      })
    } else {
      router.refresh()
    }
  }

  const handleRelationshipChange = async (relatedUserId: string, relationshipType: string) => {
    setRelationships({ ...relationships, [relatedUserId]: relationshipType })

    const supabase = createClient()

    const existing = initialRelationships.find((r) => r.related_user_id === relatedUserId)

    if (existing) {
      const { error } = await supabase
        .from("family_relationships")
        .update({ relationship_type: relationshipType })
        .eq("id", existing.id)

      if (error) {
        console.error("[v0] Error updating relationship:", error)
      }
    } else {
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

  const handleFamilyPhotosChange = async (photos: string[]) => {
    setFamilyProfile({ ...familyProfile, photos })

    const supabase = createClient()
    try {
      const updateData: any = {
        photos: photos,
      }

      if (familyProfile.heroPhoto && !photos.includes(familyProfile.heroPhoto)) {
        updateData.hero_photo = photos[0] || null
        updateData.profile_picture_url = photos[0] || null
        setFamilyProfile({ ...familyProfile, photos, heroPhoto: photos[0] || null })
      }

      const { error } = await supabase.from("family_units").update(updateData).eq("id", familyUnit.id)

      if (error) throw error

      toast({
        title: "Success",
        description: "Family photos updated successfully",
      })
      router.refresh()
    } catch (error) {
      console.error("[v0] Error saving family photos:", error)
      toast({
        title: "Save failed",
        description: "Failed to save photos. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleFamilyHeroPhotoChange = async (heroPhoto: string | null) => {
    setFamilyProfile({ ...familyProfile, heroPhoto })

    const supabase = createClient()
    try {
      const { error } = await supabase
        .from("family_units")
        .update({
          hero_photo: heroPhoto,
          profile_picture_url: heroPhoto,
        })
        .eq("id", familyUnit.id)

      if (error) throw error

      router.refresh()
    } catch (error) {
      console.error("[v0] Error saving hero photo:", error)
      toast({
        title: "Save failed",
        description: "Failed to save hero photo. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handlePetPhotosChange = async (petId: string, photos: string[]) => {
    const pet = pets.find((p) => p.id === petId)
    const currentHeroPhoto = pet?.hero_photo || pet?.profile_picture_url || null

    // Immediately update local state for responsive UI
    setPets(
      pets.map((p) =>
        p.id === petId
          ? {
            ...p,
            photos,
          }
          : p,
      ),
    )

    const supabase = createClient()
    try {
      const updateData: any = {
        photos: photos,
      }

      // If hero photo was deleted, set first photo as new hero
      if (currentHeroPhoto && !photos.includes(currentHeroPhoto)) {
        updateData.hero_photo = photos[0] || null
        updateData.profile_picture_url = photos[0] || null

        // Update local state with new hero photo
        setPets(
          pets.map((p) =>
            p.id === petId
              ? {
                ...p,
                photos,
                hero_photo: photos[0] || null,
                profile_picture_url: photos[0] || null,
              }
              : p,
          ),
        )
      }

      const { error } = await supabase.from("pets").update(updateData).eq("id", petId)

      if (error) throw error

      toast({
        title: "Success",
        description: "Pet photos updated successfully",
      })
      router.refresh()
    } catch (error) {
      console.error("[v0] Error saving pet photos:", error)
      toast({
        title: "Save failed",
        description: "Failed to save photos. Please try again.",
        variant: "destructive",
      })

      // Revert state on error
      setPets(
        pets.map((p) =>
          p.id === petId
            ? {
              ...p,
              photos: pet?.photos || [],
            }
            : p,
        ),
      )
    }
  }

  const handlePetHeroPhotoChange = async (petId: string, heroPhoto: string | null) => {
    const pet = pets.find((p) => p.id === petId)

    // Immediately update local state for responsive UI
    setPets(
      pets.map((p) =>
        p.id === petId
          ? {
            ...p,
            hero_photo: heroPhoto,
            profile_picture_url: heroPhoto,
          }
          : p,
      ),
    )

    const supabase = createClient()
    try {
      const { error } = await supabase
        .from("pets")
        .update({
          hero_photo: heroPhoto,
          profile_picture_url: heroPhoto,
        })
        .eq("id", petId)

      if (error) throw error

      toast({
        description: "Pet hero photo updated",
      })
      router.refresh()
    } catch (error) {
      console.error("[v0] Error saving pet hero photo:", error)
      toast({
        title: "Save failed",
        description: "Failed to save hero photo. Please try again.",
        variant: "destructive",
      })

      // Revert state on error
      setPets(
        pets.map((p) =>
          p.id === petId
            ? {
              ...p,
              hero_photo: pet?.hero_photo,
              profile_picture_url: pet?.profile_picture_url,
            }
            : p,
        ),
      )
    }
  }

  const availableLotResidents = lotResidents.filter((r) => !familyMembers.some((fm) => fm.id === r.id))

  const familyInitials =
    familyUnit?.name
      .split(" ")
      .map((word: string) => word[0])
      .join("")
      .toUpperCase()
      .slice(0, 2) || "?"

  const handleUpdateFamilyDescription = async () => {
    setIsLoading(true)
    const supabase = createClient()

    try {
      const { error } = await supabase
        .from("family_units")
        .update({ description: familyProfile.description })
        .eq("id", familyUnit.id)

      if (error) throw error

      router.refresh()
    } catch (error) {
      console.error("[v0] Error updating family description:", error)
      toast({
        title: "Save failed",
        description: "Failed to update description. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  if (!familyUnit) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          No family unit assigned yet. Contact your administrator to set up your family.
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="space-y-6">
      <EditableProfileBanner
        bannerUrl={familyProfile.bannerImage}
        profileUrl={familyProfile.heroPhoto}
        initials={familyInitials}
        onBannerChange={handleBannerChange}
        onProfilePhotoChange={handleProfilePhotoChange}
      />

      <div className="grid gap-6 lg:grid-cols-2">
        {/* LEFT COLUMN: Family Profile */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Home className="h-5 w-5" />
                Family Profile
              </CardTitle>
              <CardDescription>Manage your family's public profile</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="family-name">Family Name</Label>
                <Input id="family-name" value={familyProfile.name} disabled className="bg-muted" />
                <p className="text-xs text-muted-foreground">Contact your administrator to change the family name</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="family-description">Family Description</Label>
                <Textarea
                  id="family-description"
                  placeholder="Tell your neighbours about your family..."
                  value={familyProfile.description}
                  onChange={(e) => setFamilyProfile({ ...familyProfile, description: e.target.value })}
                  rows={4}
                />
                <Button
                  type="button"
                  onClick={handleUpdateFamilyDescription}
                  disabled={isLoading}
                  size="sm"
                  className="mt-2"
                >
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Save Description
                </Button>
              </div>

              <div className="space-y-2">
                <Label>Family Photos</Label>
                <PhotoManager
                  photos={familyProfile.photos}
                  heroPhoto={familyProfile.heroPhoto}
                  onPhotosChange={handleFamilyPhotosChange}
                  onHeroPhotoChange={(url) => handleProfilePhotoChange(url)}
                  maxPhotos={10}
                  entityType="family"
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* RIGHT COLUMN: Members & Pets */}
        <div className="space-y-6">
          {/* Family Members */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Family Members
                  </CardTitle>
                  <CardDescription>
                    Manage relationships
                  </CardDescription>
                </div>
                {availableLotResidents.length > 0 && !showAddFamily && (
                  <Button variant="outline" size="sm" onClick={() => setShowAddFamily(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Member
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {showAddFamily && (
                <div className="mb-4 space-y-3 rounded-lg border p-4 bg-muted/50">
                  <div className="space-y-2">
                    <Label htmlFor="resident-select">Select Resident</Label>
                    <Select value={selectedResident} onValueChange={setSelectedResident}>
                      <SelectTrigger id="resident-select">
                        <SelectValue placeholder="Choose a resident" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableLotResidents.map((r) => (
                          <SelectItem key={r.id} value={r.id}>
                            {r.first_name} {r.last_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={handleAddFamilyMember} disabled={isLoading || !selectedResident} size="sm">
                      {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Add
                    </Button>
                    <Button variant="ghost" onClick={() => setShowAddFamily(false)} size="sm">
                      Cancel
                    </Button>
                  </div>
                </div>
              )}

              {familyMembers.length === 0 ? (
                <div className="text-center py-6 text-muted-foreground">
                  <p>No other family members added.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {familyMembers.map((member) => (
                    <div key={member.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-lg border p-3">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={member.profile_picture_url} />
                          <AvatarFallback>{member.first_name[0]}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-sm">
                            {member.first_name} {member.last_name}
                          </p>
                          <p className="text-xs text-muted-foreground">{member.email}</p>
                        </div>
                      </div>
                      <div className="w-full sm:w-40">
                        <Select
                          value={relationships[member.id] || ""}
                          onValueChange={(value) => handleRelationshipChange(member.id, value)}
                        >
                          <SelectTrigger className="h-8 text-xs">
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
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Pets */}
          {petsEnabled && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <PawPrint className="h-5 w-5" />
                      Pets
                    </CardTitle>
                    <CardDescription>Manage family pets</CardDescription>
                  </div>
                  {!showAddPet && (
                    <Button variant="outline" size="sm" onClick={() => setShowAddPet(true)}>
                      <Plus className="mr-2 h-4 w-4" />
                      Add Pet
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {showAddPet && (
                  <div className="mb-4 space-y-4 rounded-lg border p-4 bg-muted/50">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="pet-name">Name</Label>
                        <Input
                          id="pet-name"
                          value={newPet.name}
                          onChange={(e) => setNewPet({ ...newPet, name: e.target.value })}
                          placeholder="Pet's name"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="pet-species">Species</Label>
                        <Select
                          value={newPet.species}
                          onValueChange={(value) => setNewPet({ ...newPet, species: value })}
                        >
                          <SelectTrigger id="pet-species">
                            <SelectValue placeholder="Select species" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Dog">Dog</SelectItem>
                            <SelectItem value="Cat">Cat</SelectItem>
                            <SelectItem value="Bird">Bird</SelectItem>
                            <SelectItem value="Other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2 sm:col-span-2">
                        <Label htmlFor="pet-breed">Breed (Optional)</Label>
                        <Input
                          id="pet-breed"
                          value={newPet.breed}
                          onChange={(e) => setNewPet({ ...newPet, breed: e.target.value })}
                          placeholder="e.g. Golden Retriever"
                        />
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={handleAddPet} disabled={isLoading || !newPet.name || !newPet.species} size="sm">
                        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Add Pet
                      </Button>
                      <Button variant="ghost" onClick={() => setShowAddPet(false)} size="sm">
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}

                {pets.length === 0 && !showAddPet ? (
                  <div className="text-center py-6 text-muted-foreground">
                    <p>No pets added yet.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {pets.map((pet) => {
                      const petInitials = pet.name.slice(0, 2).toUpperCase()
                      const petHeroPhoto = pet.hero_photo || pet.profile_picture_url || null
                      const petPhotos = Array.isArray(pet.photos) ? pet.photos : []

                      return (
                        <Card key={pet.id} className="overflow-hidden">
                          <CardContent className="p-0">
                            <div className="flex items-center justify-between p-4 bg-muted/30">
                              <div className="flex items-center gap-3">
                                <Avatar className="h-12 w-12 border-2 border-background">
                                  <AvatarImage src={petHeroPhoto || "/placeholder.svg"} />
                                  <AvatarFallback>{petInitials}</AvatarFallback>
                                </Avatar>
                                <div>
                                  <p className="font-semibold">{pet.name}</p>
                                  <p className="text-xs text-muted-foreground">
                                    {pet.species} {pet.breed && `• ${pet.breed}`}
                                  </p>
                                </div>
                              </div>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDeletePet(pet.id)}
                                className="text-muted-foreground hover:text-destructive"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                            <div className="p-4 pt-0">
                              <div className="mt-4">
                                <Label className="text-xs mb-2 block text-muted-foreground">Photos</Label>
                                <PhotoManager
                                  photos={petPhotos}
                                  heroPhoto={petHeroPhoto}
                                  onPhotosChange={(photos) => handlePetPhotosChange(pet.id, photos)}
                                  onHeroPhotoChange={(heroPhoto) => handlePetHeroPhotoChange(pet.id, heroPhoto)}
                                  maxPhotos={5}
                                  entityType="pet"
                                />
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      )
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
