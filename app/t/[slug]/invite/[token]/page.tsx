import { redirect } from "next/navigation"
import { createServerClient } from "@/lib/supabase/server"
import { SignupForm } from "./signup-form"

export default async function InvitePage({
  params,
}: {
  params: Promise<{ slug: string; token: string }>
}) {
  const { slug, token } = await params
  const supabase = await createServerClient()

  // Check if tenant exists
  const { data: tenant, error: tenantError } = await supabase
    .from("tenants")
    .select("id, name, slug")
    .eq("slug", slug)
    .maybeSingle()

  if (tenantError || !tenant) {
    redirect("/backoffice/login")
  }

  // Check if already logged in
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (user) {
    redirect(`/t/${slug}/admin/dashboard`)
  }

  // Validate invite token
  const { data: resident, error: residentError } = await supabase
    .from("residents")
    .select("id, email, first_name, last_name, invite_token, auth_user_id")
    .eq("invite_token", token)
    .maybeSingle()

  if (residentError || !resident || !resident.invite_token) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-forest-50 to-sky-50 p-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600">Invalid Invite</h1>
          <p className="mt-2 text-muted-foreground">This invite link is invalid or has expired.</p>
        </div>
      </div>
    )
  }

  // Check if already signed up
  if (resident.auth_user_id) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-forest-50 to-sky-50 p-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Already Registered</h1>
          <p className="mt-2 text-muted-foreground">
            This invite has already been used. Please{" "}
            <a href={`/t/${slug}/login`} className="text-primary underline">
              sign in
            </a>
            .
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-forest-50 to-sky-50 p-4">
      <SignupForm tenant={tenant} resident={resident} token={token} />
    </div>
  )
}
