import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { NeighboursTable } from "./neighbours-table"

export default async function NeighboursPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect(`/t/${slug}/login`)
  }

  const { data: currentResident } = await supabase
    .from("users")
    .select("id, tenant_id, role")
    .eq("id", user.id)
    .eq("role", "resident")
    .single()

  if (!currentResident) {
    redirect(`/t/${slug}/login`)
  }

  console.log("[v0] Current resident:", currentResident)

  const { data: currentResidentFull } = await supabase
    .from("users")
    .select("id, tenant_id, role, family_unit_id")
    .eq("id", user.id)
    .single()

  // Get all residents in the same tenant with their privacy settings
  const { data: residents, error: residentsError } = await supabase
    .from("users")
    .select(
      `
      id,
      first_name,
      last_name,
      email,
      phone,
      profile_picture_url,
      journey_stage,
      estimated_move_in_date,
      birth_country,
      current_country,
      languages,
      preferred_language,
      birthday,
      family_unit_id,
      lots (
        id,
        lot_number,
        neighborhoods (
          name
        )
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
        show_family_relationships,
        show_interests,
        show_skills,
        show_open_to_requests
      )
    `,
    )
    .eq("tenant_id", currentResident.tenant_id)
    .eq("role", "resident")
    .eq("onboarding_completed", true)
    .order("first_name")

  console.log("[v0] Residents query result:", {
    count: residents?.length || 0,
    error: residentsError,
    sampleResident: residents?.[0]
      ? {
          id: residents[0].id,
          name: `${residents[0].first_name} ${residents[0].last_name}`,
          lot: residents[0].lots,
          neighborhood: residents[0].lots?.neighborhoods,
        }
      : null,
  })

  // Get all interests for filtering
  const { data: allInterests } = await supabase
    .from("interests")
    .select("*")
    .eq("tenant_id", currentResident.tenant_id)
    .order("name")

  // Get all neighborhoods for filtering
  const { data: neighborhoods } = await supabase
    .from("neighborhoods")
    .select("*")
    .eq("tenant_id", currentResident.tenant_id)
    .order("name")

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Neighbours</h2>
        <p className="text-muted-foreground">Connect with other residents in your community</p>
      </div>

      <NeighboursTable
        residents={residents || []}
        allInterests={allInterests || []}
        neighborhoods={neighborhoods || []}
        tenantSlug={slug}
        currentUserFamilyId={currentResidentFull?.family_unit_id || null}
      />
    </div>
  )
}
