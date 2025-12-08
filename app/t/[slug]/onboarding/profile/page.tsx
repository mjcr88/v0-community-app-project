import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { ProfileWizardWrapper } from "@/components/onboarding/profile-wizard-wrapper"

export default async function ProfileSetupPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const supabase = await createClient()

  // Auth check
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    redirect(`/t/${slug}/login`)
  }

  // 1. Fetch basic user data (Step 1 & 3 & 4)
  const { data: userData, error: userError } = await supabase
    .from("users")
    .select(`
      *,
      user_interests(interest_id),
      user_skills(skill_id, open_to_requests),
      about,
      birthday,
      birth_country,
      current_country,
      languages,
      preferred_language,
      phone,
      journey_stage,
      estimated_move_in_date,
      estimated_construction_start_date,
      estimated_construction_end_date
    `)
    .eq("id", user.id)
    .single()

  if (userError) {
    console.error("Error fetching user data:", userError)
  }


  // 2. Fetch family details if user belongs to a family unit (Step 2)
  let familyMembers: any[] = []
  let pets: any[] = []
  let relationships: Record<string, string> = {}
  let familyName = ""

  if (userData?.family_unit_id) {
    const { getFamilyById } = await import("@/lib/data/families")
    const familyUnit = await getFamilyById(userData.family_unit_id, {
      enrichWithMembers: true,
      enrichWithPets: true
    })

    if (familyUnit) {
      familyName = familyUnit.name
      // Map to expected format, excluding current user
      familyMembers = (familyUnit.members || [])
        .filter((member: any) => member.id !== user.id)
        .map((member: any) => ({
          id: member.id,
          name: `${member.first_name || ""} ${member.last_name || ""}`.trim(),
          avatarUrl: member.profile_picture_url
        }))

      pets = (familyUnit.pets || []).map((pet: any) => ({
        id: pet.id,
        name: pet.name,
        species: pet.species,
        breed: pet.breed || null, // breed might be missing in some types
        avatarUrl: pet.profile_picture_url
      }))
    }

    // Fetch existing relationships
    const { data: relationshipsData } = await supabase
      .from("family_relationships")
      .select("related_user_id, relationship_type")
      .eq("user_id", user.id)

    if (relationshipsData) {
      relationships = relationshipsData.reduce((acc, rel) => ({
        ...acc,
        [rel.related_user_id]: rel.relationship_type
      }), {})
    }
  }

  // Fetch available interests and skills for steps 3 & 4
  const { data: allInterests } = await supabase
    .from("interests")
    .select("id, name")
    .order("name")

  const { data: allSkills } = await supabase
    .from("skills")
    .select("id, name, description")
    .order("name")

  // Prepare initial data for the wizard (Rebuild Trigger)
  const initialData = {
    userId: user.id,
    tenantId: userData?.tenant_id,
    familyUnitId: userData?.family_unit_id,
    familyName,
    lotId: userData?.lot_id,
    firstName: userData?.first_name,
    lastName: userData?.last_name,
    avatarUrl: userData?.profile_picture_url,
    about: userData?.about,
    birthday: userData?.birthday,
    birthCountry: userData?.birth_country,
    currentCountry: userData?.current_country,
    languages: userData?.languages,
    preferredLanguage: userData?.preferred_language,
    email: userData?.email,
    phone: userData?.phone,
    journeyStage: userData?.journey_stage,
    estimatedMoveInDate: userData?.estimated_move_in_date,
    constructionStartDate: userData?.estimated_construction_start_date,
    constructionEndDate: userData?.estimated_construction_end_date,
    tenantSlug: slug,
    familyMembers,
    pets,
    relationships,
    interests: userData?.user_interests?.map((i: any) => i.interest_id) || [],
    skills: userData?.user_skills?.map((s: any) => s.skill_id) || []
  }

  return (
    <div className="h-full">
      <ProfileWizardWrapper
        userId={user.id}
        tenantSlug={slug}
        initialData={initialData}
        availableInterests={allInterests || []}
        availableSkills={allSkills || []}
      />
    </div>
  )
}
