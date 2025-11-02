import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { ProfileForm } from "./profile-form"

export default async function ProfilePage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect(`/t/${slug}/login`)
  }

  const { data: superAdmin } = await supabase.from("users").select("role").eq("id", user.id).maybeSingle()

  const isSuperAdmin = superAdmin?.role === "super_admin"

  // Get tenant info
  const { data: tenant } = await supabase.from("tenants").select("*").eq("slug", slug).single()

  if (!tenant) {
    redirect(`/t/${slug}/login`)
  }

  if (isSuperAdmin) {
    // Mock resident data for super admin testing
    const mockResident = {
      id: "test-resident-id",
      first_name: "Test",
      last_name: "Admin",
      email: user.email || "admin@test.com",
      phone: null,
      bio: null,
      profile_picture_url: null,
    }

    return (
      <ProfileForm
        tenant={{
          id: tenant.id,
          name: tenant.name,
          slug: tenant.slug,
        }}
        resident={mockResident}
        isSuperAdmin={true}
      />
    )
  }

  // For regular users, get their resident record
  const { data: resident } = await supabase.from("users").select("*").eq("id", user.id).eq("role", "resident").single()

  if (!resident) {
    redirect(`/t/${slug}/login`)
  }

  return (
    <ProfileForm
      tenant={{
        id: tenant.id,
        name: tenant.name,
        slug: tenant.slug,
      }}
      resident={resident}
      isSuperAdmin={false}
    />
  )
}
