import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { FamilyForm } from "./family-form"

export default async function FamilyPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect(`/t/${slug}/login`)
  }

  // Check if user is super admin (testing mode)
  const { data: superAdminCheck } = await supabase.from("users").select("role").eq("id", user.id).single()

  const isSuperAdmin = superAdminCheck?.role === "super_admin"

  // Fetch tenant
  const { data: tenant } = await supabase.from("tenants").select("id, name, slug, features").eq("slug", slug).single()

  if (!tenant) {
    redirect("/")
  }

  // Fetch resident data
  let resident
  let familyUnit = null
  let familyMembers: any[] = []
  let existingRelationships: any[] = []
  let pets: any[] = []

  if (isSuperAdmin) {
    resident = { id: "test-resident-id", family_unit_id: null }
  } else {
    const { data: residentData } = await supabase
      .from("users")
      .select("id, family_unit_id, lot_id")
      .eq("id", user.id)
      .eq("tenant_id", tenant.id)
      .eq("role", "resident")
      .single()

    resident = residentData

    if (resident?.family_unit_id) {
      // Fetch family unit info
      const { data: familyUnitData } = await supabase
        .from("family_units")
        .select("id, name, primary_contact_id")
        .eq("id", resident.family_unit_id)
        .single()

      familyUnit = familyUnitData

      // Fetch other family members
      const { data: membersData } = await supabase
        .from("users")
        .select("id, first_name, last_name, email, profile_picture_url")
        .eq("family_unit_id", resident.family_unit_id)
        .neq("id", resident.id)

      familyMembers = membersData || []

      // Fetch existing relationships
      const { data: relationshipsData } = await supabase
        .from("family_relationships")
        .select("id, related_user_id, relationship_type")
        .eq("user_id", resident.id)

      existingRelationships = relationshipsData || []

      // Fetch pets
      const { data: petsData } = await supabase
        .from("pets")
        .select("id, name, species, breed")
        .eq("family_unit_id", resident.family_unit_id)

      pets = petsData || []
    }
  }

  if (!resident) {
    redirect(`/t/${slug}/onboarding/welcome`)
  }

  // Fetch all residents in the same lot (for adding family members)
  let lotResidents: any[] = []
  if (resident.lot_id) {
    const { data: lotResidentsData } = await supabase
      .from("users")
      .select("id, first_name, last_name, email")
      .eq("lot_id", resident.lot_id)
      .neq("id", resident.id)

    lotResidents = lotResidentsData || []
  }

  return (
    <FamilyForm
      tenant={tenant}
      resident={resident}
      familyUnit={familyUnit}
      familyMembers={familyMembers}
      existingRelationships={existingRelationships}
      pets={pets}
      lotResidents={lotResidents}
      isSuperAdmin={isSuperAdmin}
    />
  )
}
