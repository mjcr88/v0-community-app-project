import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { SettingsTabs } from "@/components/settings-tabs"
import { FamilyManagementForm } from "./family-management-form"

export default async function FamilySettingsPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect(`/t/${slug}/login`)
  }

  const { data: resident } = await supabase
    .from("users")
    .select("*")
    .eq("id", user.id)
    .eq("role", "resident")
    .maybeSingle()

  if (!resident) {
    redirect(`/t/${slug}/login`)
  }

  // Get tenant to check if pets feature is enabled
  const { data: tenant } = await supabase.from("tenants").select("*").eq("id", resident.tenant_id).single()

  // Get family unit if exists
  const { data: familyUnit } = await supabase
    .from("family_units")
    .select("*")
    .eq("id", resident.family_unit_id || "")
    .maybeSingle()

  // Get family members (other users in the same family unit)
  const { data: familyMembers } = await supabase
    .from("users")
    .select("*")
    .eq("family_unit_id", resident.family_unit_id || "")
    .neq("id", resident.id)
    .order("first_name")

  // Get existing relationships
  const { data: relationships } = await supabase.from("family_relationships").select("*").eq("user_id", resident.id)

  // Get pets if feature is enabled
  let pets = []
  if (tenant?.features?.pets && resident.family_unit_id) {
    const { data: petsData } = await supabase
      .from("pets")
      .select("*")
      .eq("family_unit_id", resident.family_unit_id)
      .order("name")
    pets = petsData || []
  }

  // Get all residents in the same lot for adding family members
  const { data: lotResidents } = await supabase
    .from("users")
    .select("*")
    .eq("lot_id", resident.lot_id || "")
    .eq("role", "resident")
    .neq("id", resident.id)
    .order("first_name")

  return (
    <>
      <SettingsTabs tenantSlug={slug} />
      <FamilyManagementForm
        resident={resident}
        familyUnit={familyUnit}
        familyMembers={familyMembers || []}
        relationships={relationships || []}
        pets={pets}
        lotResidents={lotResidents || []}
        petsEnabled={tenant?.features?.pets || false}
        tenantSlug={slug}
      />
    </>
  )
}
