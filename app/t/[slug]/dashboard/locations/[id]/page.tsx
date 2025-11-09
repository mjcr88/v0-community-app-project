"use client"

import { createClient } from "@/lib/supabase/server"
import { redirect, notFound } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { MapPin, Users, ArrowLeft, Home, MapIcon, Calendar } from "lucide-react"
import Link from "next/link"

export default async function LocationDetailsPage({ params }: { params: { slug: string; id: string } }) {
  const { slug, id } = params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect(`/t/${slug}/login`)
  }

  const { data: currentUser } = await supabase.from("users").select("id, tenant_id, role").eq("id", user.id).single()

  if (!currentUser) {
    redirect(`/t/${slug}/login`)
  }

  // Fetch location with all related data
  const { data: location } = await supabase
    .from("locations")
    .select(
      `
      *,
      neighborhoods (
        id,
        name
      ),
      lots (
        id,
        lot_number,
        users (
          id,
          first_name,
          last_name,
          profile_picture_url,
          family_unit_id,
          family_units (
            id,
            name,
            profile_picture_url
          )
        )
      )
    `,
    )
    .eq("id", id)
    .eq("tenant_id", currentUser.tenant_id)
    .single()

  if (!location) {
    notFound()
  }

  // Fetch pets if this is a lot with residents
  let pets: any[] = []
  if (location.lots?.users && location.lots.users.length > 0) {
    const familyUnit = location.lots.users.find((user: any) => user.family_units)?.family_units

    if (familyUnit) {
      const { data: petsData } = await supabase
        .from("pets")
        .select("id, name, species, breed, profile_picture_url")
        .eq("family_unit_id", familyUnit.id)

      if (petsData) {
        pets = petsData
      }
    }
  }

  const isAdmin = currentUser.role === "tenant_admin" || currentUser.role === "super_admin"

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      facility: "Facility",
      lot: "Lot",
      walking_path: "Walking Path",
      neighborhood: "Neighborhood",
    }
    return labels[type] || type
  }

  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      facility: "bg-orange-100 text-orange-800 border-orange-200",
      lot: "bg-blue-100 text-blue-800 border-blue-200",
      walking_path: "bg-sky-100 text-sky-800 border-sky-200",
      neighborhood: "bg-purple-100 text-purple-800 border-purple-200",
    }
    return colors[type] || "bg-gray-100 text-gray-800 border-gray-200"
  }

  const getStatusBadge = (status: string) => {
    const config: Record<string, { label: string; color: string }> = {
      Open: { label: "Open", color: "bg-green-100 text-green-800 border-green-200" },
      Closed: { label: "Closed", color: "bg-red-100 text-red-800 border-red-200" },
      Maintenance: { label: "Maintenance", color: "bg-yellow-100 text-yellow-800 border-yellow-200" },
      "Coming Soon": { label: "Coming Soon", color: "bg-blue-100 text-blue-800 border-blue-200" },
      "Temporarily Unavailable": {
        label: "Temporarily Unavailable",
        color: "bg-orange-100 text-orange-800 border-orange-200",
      },
    }
    return config[status] || config.Open
  }

  const getDifficultyBadge = (difficulty: string) => {
    const config: Record<string, { label: string; color: string }> = {
      Easy: { label: "Easy", color: "bg-green-100 text-green-800 border-green-200" },
      Moderate: { label: "Moderate", color: "bg-blue-100 text-blue-800 border-blue-200" },
      Difficult: { label: "Difficult", color: "bg-orange-100 text-orange-800 border-orange-200" },
      Expert: { label: "Expert", color: "bg-red-100 text-red-800 border-red-200" },
    }
    return config[difficulty] || config.Easy
  }

  const statusConfig = location.status ? getStatusBadge(location.status) : null
  const difficultyConfig = location.path_difficulty ? getDifficultyBadge(location.path_difficulty) : null
  const familyUnit = location.lots?.users?.find((user: any) => user.family_units)?.family_units
  const residents = location.lots?.users || []

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href={`/t/${slug}/dashboard/community-map`}>
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
              {location.icon && <span className="text-3xl">{location.icon}</span>}
              {location.name}
            </h1>
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              <Badge variant="outline" className={getTypeColor(location.type)}>
                {getTypeLabel(location.type)}
              </Badge>
              {location.facility_type && (
                <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">
                  {location.facility_type}
                </Badge>
              )}
              {statusConfig && (
                <Badge variant="outline" className={statusConfig.color}>
                  {statusConfig.label}
                </Badge>
              )}
            </div>
          </div>
        </div>

        <div className="flex gap-2">
          {isAdmin && (
            <Button variant="outline" asChild>
              <Link href={`/t/${slug}/admin/map/locations/create?editLocationId=${location.id}`}>Edit</Link>
            </Button>
          )}
          <Button variant="outline" asChild>
            <Link href={`/t/${slug}/dashboard/map?highlightLocation=${location.id}`}>
              <MapIcon className="h-4 w-4 mr-2" />
              View on Map
            </Link>
          </Button>
        </div>
      </div>

      {/* Hero Image */}
      {location.photos && location.photos.length > 0 && (
        <div className="relative w-full rounded-xl overflow-hidden border bg-muted aspect-[2/1]">
          <img
            src={location.photos[0] || "/placeholder.svg"}
            alt={location.name}
            className="w-full h-full object-cover"
          />
        </div>
      )}

      {/* Description */}
      {location.description && (
        <Card>
          <CardHeader>
            <CardTitle>Description</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">{location.description}</p>
          </CardContent>
        </Card>
      )}

      {/* Facility Details */}
      {location.type === "facility" &&
        (location.capacity ||
          location.max_occupancy ||
          location.hours ||
          location.amenities?.length ||
          location.parking_spaces !== null ||
          location.accessibility_features ||
          location.rules) && (
          <Card>
            <CardHeader>
              <CardTitle>Facility Details</CardTitle>
              <CardDescription>Information about this facility</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {(location.capacity || location.max_occupancy) && (
                <div>
                  <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Capacity & Occupancy
                  </h4>
                  <div className="text-sm text-muted-foreground space-y-1">
                    {location.capacity && <div>Capacity: {location.capacity} people</div>}
                    {location.max_occupancy && <div>Max Occupancy: {location.max_occupancy} people</div>}
                  </div>
                </div>
              )}

              {location.hours && (
                <div>
                  <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Operating Hours
                  </h4>
                  <div className="text-sm text-muted-foreground whitespace-pre-line">{location.hours}</div>
                </div>
              )}

              {location.amenities && location.amenities.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold mb-3">Amenities ({location.amenities.length})</h4>
                  <div className="flex flex-wrap gap-2">
                    {location.amenities.map((amenity) => (
                      <Badge key={amenity} variant="secondary">
                        {amenity}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {location.parking_spaces !== null && location.parking_spaces !== undefined && (
                <div>
                  <h4 className="text-sm font-semibold mb-2">Parking</h4>
                  <div className="text-sm text-muted-foreground">
                    {location.parking_spaces > 0
                      ? `${location.parking_spaces} parking spaces available`
                      : "No parking available"}
                  </div>
                </div>
              )}

              {location.accessibility_features && (
                <div>
                  <h4 className="text-sm font-semibold mb-2">Accessibility Features</h4>
                  <div className="text-sm text-muted-foreground">
                    {location.accessibility_features.split(" | ").map((feature, idx) => (
                      <div key={idx} className="flex items-start gap-2">
                        <span className="text-primary mt-1">•</span>
                        <span>{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {location.rules && (
                <div>
                  <h4 className="text-sm font-semibold mb-3">Rules & Guidelines</h4>
                  <div
                    className="prose prose-sm max-w-none text-sm text-muted-foreground"
                    dangerouslySetInnerHTML={{ __html: location.rules }}
                  />
                </div>
              )}
            </CardContent>
          </Card>
        )}

      {/* Walking Path Details */}
      {location.type === "walking_path" &&
        (location.path_difficulty || location.path_surface || location.path_length || location.elevation_gain) && (
          <Card>
            <CardHeader>
              <CardTitle>Trail Details</CardTitle>
              <CardDescription>Information about this walking path</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {difficultyConfig && (
                <div>
                  <h4 className="text-sm font-semibold mb-2">Difficulty Level</h4>
                  <Badge variant="outline" className={difficultyConfig.color}>
                    {difficultyConfig.label}
                  </Badge>
                </div>
              )}

              {location.path_surface && (
                <div>
                  <h4 className="text-sm font-semibold mb-2">Surface Type</h4>
                  <div className="text-sm text-muted-foreground capitalize">{location.path_surface}</div>
                </div>
              )}

              {location.path_length && (
                <div>
                  <h4 className="text-sm font-semibold mb-2">Path Length</h4>
                  <div className="text-sm text-muted-foreground">{location.path_length}</div>
                </div>
              )}

              {location.elevation_gain && (
                <div>
                  <h4 className="text-sm font-semibold mb-2">Elevation Gain</h4>
                  <div className="text-sm text-muted-foreground">{location.elevation_gain}</div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

      {/* Location Information */}
      {(location.neighborhoods || location.lots) && (
        <Card>
          <CardHeader>
            <CardTitle>Location Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {location.neighborhoods && (
              <div className="flex items-center gap-3 p-3 bg-purple-50 border border-purple-200 rounded-lg">
                <MapPin className="h-5 w-5 text-purple-600" />
                <div>
                  <p className="text-sm text-purple-700 font-medium">Neighborhood</p>
                  <p className="text-base text-purple-900 font-semibold">{location.neighborhoods.name}</p>
                </div>
              </div>
            )}

            {location.lots && (
              <div className="flex items-center gap-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <Home className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="text-sm text-blue-700 font-medium">Lot</p>
                  <p className="text-base text-blue-900 font-semibold">Lot #{location.lots.lot_number}</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Residents */}
      {residents.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Residents ({residents.length})
            </CardTitle>
            {familyUnit && <CardDescription>{familyUnit.name}</CardDescription>}
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {familyUnit && (
                <Link
                  href={`/t/${slug}/dashboard/families/${familyUnit.id}`}
                  className="flex items-center gap-3 p-4 bg-amber-50 border border-amber-200 rounded-lg hover:bg-amber-100 transition-colors"
                >
                  <Avatar className="h-14 w-14">
                    <AvatarImage src={familyUnit.profile_picture_url || undefined} alt={familyUnit.name} />
                    <AvatarFallback className="bg-amber-200 text-amber-900 font-semibold">
                      {familyUnit.name
                        ?.split(" ")
                        .map((n) => n[0])
                        .join("")
                        .substring(0, 2)
                        .toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="text-base font-semibold text-amber-900">{familyUnit.name}</p>
                    <p className="text-sm text-amber-700">
                      {residents.length} member{residents.length !== 1 ? "s" : ""}
                    </p>
                    <p className="text-sm text-amber-600 mt-1">View family profile →</p>
                  </div>
                </Link>
              )}

              <div className="grid gap-3 sm:grid-cols-2">
                {residents.map((resident: any) => (
                  <Link
                    key={resident.id}
                    href={`/t/${slug}/dashboard/neighbours/${resident.id}`}
                    className="flex items-center gap-3 p-3 border rounded-lg hover:bg-accent transition-colors"
                  >
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={resident.profile_picture_url || undefined} alt={resident.first_name} />
                      <AvatarFallback className="bg-primary/10 text-primary">
                        {resident.first_name?.[0]}
                        {resident.last_name?.[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">
                        {resident.first_name} {resident.last_name}
                      </p>
                      <p className="text-sm text-muted-foreground">View profile →</p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Pets */}
      {pets.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Family Pets ({pets.length})</CardTitle>
            <CardDescription>Beloved members of the family</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {pets.map((pet: any) => {
                const petInitials = pet.name
                  .split(" ")
                  .map((word: string) => word[0])
                  .join("")
                  .toUpperCase()
                  .slice(0, 2)

                return (
                  <div key={pet.id} className="flex items-center gap-3 p-3 border rounded-lg">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={pet.profile_picture_url || "/placeholder.svg"} alt={pet.name} />
                      <AvatarFallback className="bg-pink-100 text-pink-700">{petInitials}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold truncate">{pet.name}</p>
                      <p className="text-sm text-muted-foreground truncate">
                        {pet.species}
                        {pet.breed && ` • ${pet.breed}`}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Photo Gallery */}
      {location.photos && location.photos.length > 1 && (
        <Card>
          <CardHeader>
            <CardTitle>Photo Gallery</CardTitle>
            <CardDescription>{location.photos.length} photos</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {location.photos.map((photo, index) => (
                <div
                  key={photo}
                  className="aspect-square rounded-lg overflow-hidden border bg-muted cursor-pointer group"
                  onClick={() => window.open(photo, "_blank")}
                >
                  <img
                    src={photo || "/placeholder.svg"}
                    alt={`${location.name} - Photo ${index + 1}`}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
