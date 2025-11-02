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

  const validFamilyUnitId = resident.family_unit_id && resident.family_unit_id !== "" ? resident.family_unit_id : null

  // Get family unit if exists
  let familyUnit = null
  let familyMembers: any[] = []
  let relationships: any[] = []
  let pets: any[] = []

  if (validFamilyUnitId) {
    const { data: familyUnitData } = await supabase
      .from("family_units")
      .select("*")
      .eq("id", validFamilyUnitId)
      .maybeSingle()

    familyUnit = familyUnitData

    // Get family members (other users in the same family unit)
    const { data: familyMembersData } = await supabase
      .from("users")
      .select("*")
      .eq("family_unit_id", validFamilyUnitId)
      .neq("id", resident.id)
      .order("first_name")

    familyMembers = familyMembersData || []

    // Get existing relationships
    const { data: relationshipsData } = await supabase
      .from("family_relationships")
      .select("*")
      .eq("user_id", resident.id)

    relationships = relationshipsData || []

    // Get pets if feature is enabled
    if (tenant?.features?.pets) {
      const { data: petsData } = await supabase
        .from("pets")
        .select("*")
        .eq("family_unit_id", validFamilyUnitId)
        .order("name")
      pets = petsData || []
    }
  }

  // Get all residents in the same lot for adding family members
  const validLotId = resident.lot_id && resident.lot_id !== "" ? resident.lot_id : null
  let lotResidents: any[] = []

  if (validLotId) {
    console.log(
      "[v0] Family settings - Querying for lot residents with lot_id:",
      validLotId,
      "excluding user:",
      resident.id,
    )

    const { data: lotResidentsData, error: lotResidentsError } = await supabase
      .from("users")
      .select("*")
      .eq("lot_id", validLotId)
      .eq("role", "resident")
      .neq("id", resident.id)
      .order("first_name")

    console.log("[v0] Family settings - Lot residents query result:", {
      lotResidentsData,
      lotResidentsError,
      lot_id: validLotId,
      count: lotResidentsData?.length || 0,
    })

    lotResidents = lotResidentsData || []
  }

  return (
    <>
      <SettingsTabs tenantSlug={slug} />
      <FamilyManagementForm
        resident={resident}
        familyUnit={familyUnit}
        familyMembers={familyMembers}
        relationships={relationships}
        pets={pets}
        lotResidents={lotResidents}
        petsEnabled={tenant?.features?.pets || false}
        tenantSlug={slug}
      />
    </>
  )
}
