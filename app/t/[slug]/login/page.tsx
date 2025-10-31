import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { TenantLoginForm } from "./login-form"

export default async function TenantLoginPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const supabase = await createClient()

  // Check if tenant exists
  const { data: tenant, error } = await supabase.from("tenants").select("id, name, slug").eq("slug", slug).maybeSingle()

  if (error || !tenant) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-forest-50 to-sky-50 p-4">
        <div className="w-full max-w-md space-y-4 rounded-lg border bg-white p-8 shadow-lg">
          <div className="space-y-2 text-center">
            <h1 className="text-2xl font-bold text-red-600">Community Not Found</h1>
            <p className="text-muted-foreground">The community "{slug}" does not exist or is not available.</p>
            {error && <p className="text-sm text-red-500">Error: {error.message}</p>}
          </div>
        </div>
      </div>
    )
  }

  // Check if already logged in
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (user) {
    const { data: userData } = await supabase
      .from("users")
      .select("role, is_admin, onboarding_completed")
      .eq("id", user.id)
      .single()

    if (userData?.role === "super_admin" || userData?.is_admin) {
      redirect(`/t/${slug}/admin/dashboard`)
    } else if (userData?.onboarding_completed) {
      redirect(`/t/${slug}/dashboard`)
    } else {
      redirect(`/t/${slug}/onboarding`)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-forest-50 to-sky-50 p-4">
      <TenantLoginForm tenant={tenant} />
    </div>
  )
}
