import { createClient } from "@/lib/supabase/server"
import { redirect, notFound } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  MapPin,
  Calendar,
  Phone,
  Mail,
  Globe,
  Languages,
  Lightbulb,
  Wrench,
  Users,
  ArrowLeft,
  CheckCircle2,
} from "lucide-react"
import Link from "next/link"

export default async function PublicProfilePage({
  params,
}: {
  params: Promise<{ slug: string; id: string }>
}) {
  const { slug, id } = await params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect(`/t/${slug}/login`)
  }

  // Get current resident's tenant
  const { data: currentResident } = await supabase
    .from("residents")
    .select("id, tenant_id")
    .eq("auth_user_id", user.id)
    .single()

  if (!currentResident) {
    redirect(`/t/${slug}/login`)
  }

  // Get the profile resident with all details
  const { data: resident } = await supabase
    .from("residents")
    .select(
      `
      *,
      lots (
        lot_number,
        neighborhoods (
          name
        )
      ),
      family_units (
        name
      ),
      resident_interests (
        interests (
          id,
          name
        )
      ),
      resident_skills (
        skill_name,
        open_to_requests
      ),
      resident_privacy_settings (
        show_email,
        show_phone,
        show_birthday,
        show_birth_country,
        show_current_country,
        show_languages,
        show_preferred_language,
        show_journey_stage,
        show_estimated_move_in_date,
        show_profile_picture,
        show_neighborhood,
        show_family,
        show_interests,
        show_skills,
        show_open_to_requests
      )
    `,
    )
    .eq("id", id)
    .eq("tenant_id", currentResident.tenant_id)
    .single()

  if (!resident) {
    notFound()
  }

  const privacySettings = resident.resident_privacy_settings?.[0] || {}
  const initials = [resident.first_name, resident.last_name]
    .filter(Boolean)
    .map((n) => n![0])
    .join("")
    .toUpperCase()
  const displayName = `${resident.first_name || ""} ${resident.last_name || ""}`.trim()

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/t/${slug}/dashboard/neighbours`}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h2 className="text-3xl font-bold tracking-tight">{displayName}</h2>
          <p className="text-muted-foreground">Resident Profile</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Profile Card */}
        <Card className="lg:col-span-1">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center text-center space-y-4">
              <Avatar className="h-32 w-32">
                <AvatarImage
                  src={
                    privacySettings.show_profile_picture !== false
                      ? resident.profile_picture_url || undefined
                      : undefined
                  }
                  alt={displayName}
                />
                <AvatarFallback className="text-3xl">{initials || "?"}</AvatarFallback>
              </Avatar>

              <div className="space-y-1 w-full">
                <h3 className="text-2xl font-bold">{displayName}</h3>

                {privacySettings.show_neighborhood !== false && resident.lots?.neighborhoods?.name && (
                  <div className="flex items-center justify-center gap-2 text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    <span>
                      {resident.lots.neighborhoods.name} - Lot #{resident.lots.lot_number}
                    </span>
                  </div>
                )}

                {privacySettings.show_journey_stage !== false && resident.journey_stage && (
                  <Badge variant="secondary" className="capitalize mt-2">
                    {resident.journey_stage}
                  </Badge>
                )}
              </div>

              {privacySettings.show_estimated_move_in_date !== false && resident.estimated_move_in_date && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span>Moving {new Date(resident.estimated_move_in_date).toLocaleDateString()}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Details Cards */}
        <div className="lg:col-span-2 space-y-6">
          {/* Contact Information */}
          {(privacySettings.show_email !== false || privacySettings.show_phone !== false) && (
            <Card>
              <CardHeader>
                <CardTitle>Contact Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {privacySettings.show_email !== false && resident.email && (
                  <div className="flex items-center gap-3">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <a href={`mailto:${resident.email}`} className="text-sm hover:underline">
                      {resident.email}
                    </a>
                  </div>
                )}
                {privacySettings.show_phone !== false && resident.phone && (
                  <div className="flex items-center gap-3">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <a href={`tel:${resident.phone}`} className="text-sm hover:underline">
                      {resident.phone}
                    </a>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Personal Information */}
          {(privacySettings.show_birth_country !== false ||
            privacySettings.show_current_country !== false ||
            privacySettings.show_birthday !== false) && (
            <Card>
              <CardHeader>
                <CardTitle>Personal Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {privacySettings.show_birthday !== false && resident.birthday && (
                  <div className="flex items-center gap-3">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">Birthday: {new Date(resident.birthday).toLocaleDateString()}</span>
                  </div>
                )}
                {privacySettings.show_birth_country !== false && resident.birth_country && (
                  <div className="flex items-center gap-3">
                    <Globe className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">From: {resident.birth_country}</span>
                  </div>
                )}
                {privacySettings.show_current_country !== false && resident.current_country && (
                  <div className="flex items-center gap-3">
                    <Globe className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">Currently in: {resident.current_country}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Languages */}
          {privacySettings.show_languages !== false && resident.languages && resident.languages.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Languages className="h-5 w-5" />
                  Languages
                </CardTitle>
                {privacySettings.show_preferred_language !== false && resident.preferred_language && (
                  <CardDescription>Preferred: {resident.preferred_language}</CardDescription>
                )}
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {resident.languages.map((language: string) => (
                    <Badge key={language} variant="secondary">
                      {language}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Family */}
          {privacySettings.show_family !== false && resident.family_units && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Family
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm">{resident.family_units.name}</p>
              </CardContent>
            </Card>
          )}

          {/* Interests */}
          {privacySettings.show_interests !== false &&
            resident.resident_interests &&
            resident.resident_interests.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Lightbulb className="h-5 w-5" />
                    Interests
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {resident.resident_interests.map((ri: any) => (
                      <Badge key={ri.interests.id} variant="outline">
                        {ri.interests.name}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

          {/* Skills */}
          {privacySettings.show_skills !== false && resident.resident_skills && resident.resident_skills.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Wrench className="h-5 w-5" />
                  Skills
                </CardTitle>
                {privacySettings.show_open_to_requests !== false && (
                  <CardDescription>
                    {resident.resident_skills.some((s: any) => s.open_to_requests)
                      ? "Open to help requests for some skills"
                      : "Not currently accepting help requests"}
                  </CardDescription>
                )}
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {resident.resident_skills.map((skill: any, index: number) => (
                    <div key={index} className="flex items-center justify-between">
                      <span className="text-sm font-medium">{skill.skill_name}</span>
                      {privacySettings.show_open_to_requests !== false && skill.open_to_requests && (
                        <Badge variant="secondary" className="gap-1">
                          <CheckCircle2 className="h-3 w-3" />
                          Available to help
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
