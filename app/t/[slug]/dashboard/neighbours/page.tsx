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

  // Get current resident's tenant
  const { data: currentResident } = await supabase
    .from("users")
    .select(
      `
      id,
      tenant_id,
      lots!inner (
        neighborhoods!inner (
          tenant_id
        )
      )
    `,
    )
    .eq("auth_user_id", user.id)
    .eq("role", "resident")
    .single()

  if (!currentResident) {
    redirect(`/t/${slug}/login`)
  }

  // Get all residents in the same tenant with their privacy settings
  const { data: residents } = await supabase
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
      lots (
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
        show_interests,
        show_skills,
        show_open_to_requests
      )
    `,
    )
    .eq("tenant_id", currentResident.tenant_id)
    .eq("role", "resident")
    .eq("onboarding_completed", true)
    .neq("id", currentResident.id)
    .order("first_name")

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
      />
    </div>
  )
}
