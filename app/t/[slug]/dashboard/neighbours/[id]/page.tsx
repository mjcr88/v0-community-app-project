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
import { filterPrivateData } from "@/lib/privacy-utils"

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

  // Get current resident's tenant and family
  const { data: currentResident } = await supabase
    .from("users")
    .select("id, tenant_id, family_unit_id")
    .eq("id", user.id)
    .eq("role", "resident")
    .single()

  if (!currentResident) {
    redirect(`/t/${slug}/login`)
  }

  const { data: resident } = await supabase
    .from("users")
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
      user_interests (
        interests (
          id,
          name
        )
      ),
      user_skills (
        skills (
          id,
          name
        ),
        open_to_requests
      ),
      user_privacy_settings (
        show_profile_picture,
        show_phone,
        show_birthday,
        show_birth_country,
        show_current_country,
        show_languages,
        show_journey_stage,
        show_estimated_move_in_date,
        show_interests,
        show_skills
      )
    `,
    )
    .eq("id", id)
    .eq("tenant_id", currentResident.tenant_id)
    .eq("role", "resident")
    .single()

  if (!resident) {
    notFound()
  }

  const isFamily = resident.family_unit_id === currentResident.family_unit_id
  const privacySettings = resident.user_privacy_settings?.[0] || {}
  const filteredResident = filterPrivateData(resident, privacySettings, isFamily)

  const initials = [filteredResident.first_name, filteredResident.last_name]
    .filter(Boolean)
    .map((n) => n![0])
    .join("")
    .toUpperCase()
  const displayName = `${filteredResident.first_name || ""} ${filteredResident.last_name || ""}`.trim()

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
                <AvatarImage src={filteredResident.profile_picture_url || undefined} alt={displayName} />
                <AvatarFallback className="text-3xl">{initials || "?"}</AvatarFallback>
              </Avatar>

              <div className="space-y-1 w-full">
                <h3 className="text-2xl font-bold">{displayName}</h3>

                {resident.lots?.neighborhoods?.name && (
                  <div className="flex items-center justify-center gap-2 text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    <span>
                      {resident.lots.neighborhoods.name} - Lot #{resident.lots.lot_number}
                    </span>
                  </div>
                )}

                {filteredResident.journey_stage && (
                  <Badge variant="secondary" className="capitalize mt-2">
                    {filteredResident.journey_stage}
                  </Badge>
                )}
              </div>

              {filteredResident.estimated_move_in_date && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span>Moving {new Date(filteredResident.estimated_move_in_date).toLocaleDateString()}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Details Cards */}
        <div className="lg:col-span-2 space-y-6">
          {(filteredResident.email || filteredResident.phone) && (
            <Card>
              <CardHeader>
                <CardTitle>Contact Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {filteredResident.email && (
                  <div className="flex items-center gap-3">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <a href={`mailto:${filteredResident.email}`} className="text-sm hover:underline">
                      {filteredResident.email}
                    </a>
                  </div>
                )}
                {filteredResident.phone && (
                  <div className="flex items-center gap-3">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <a href={`tel:${filteredResident.phone}`} className="text-sm hover:underline">
                      {filteredResident.phone}
                    </a>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {(filteredResident.birth_country || filteredResident.current_country || filteredResident.birthday) && (
            <Card>
              <CardHeader>
                <CardTitle>Personal Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {filteredResident.birthday && (
                  <div className="flex items-center gap-3">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">
                      Birthday: {new Date(filteredResident.birthday).toLocaleDateString()}
                    </span>
                  </div>
                )}
                {filteredResident.birth_country && (
                  <div className="flex items-center gap-3">
                    <Globe className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">From: {filteredResident.birth_country}</span>
                  </div>
                )}
                {filteredResident.current_country && (
                  <div className="flex items-center gap-3">
                    <Globe className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">Currently in: {filteredResident.current_country}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {filteredResident.languages && filteredResident.languages.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Languages className="h-5 w-5" />
                  Languages
                </CardTitle>
                {filteredResident.preferred_language && (
                  <CardDescription>Preferred: {filteredResident.preferred_language}</CardDescription>
                )}
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {filteredResident.languages.map((language: string) => (
                    <Badge key={language} variant="secondary">
                      {language}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {resident.family_units && (
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

          {filteredResident.user_interests && filteredResident.user_interests.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lightbulb className="h-5 w-5" />
                  Interests
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {filteredResident.user_interests.map((ui: any) => (
                    <Badge key={ui.interests.id} variant="outline">
                      {ui.interests.name}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {filteredResident.user_skills && filteredResident.user_skills.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Wrench className="h-5 w-5" />
                  Skills
                </CardTitle>
                <CardDescription>
                  {filteredResident.user_skills.some((s: any) => s.open_to_requests)
                    ? "Open to help requests for some skills"
                    : "Not currently accepting help requests"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {filteredResident.user_skills.map((skill: any, index: number) => (
                    <div key={index} className="flex items-center justify-between">
                      <span className="text-sm font-medium">{skill.skills.name}</span>
                      {skill.open_to_requests && (
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
