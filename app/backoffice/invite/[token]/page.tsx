import { redirect } from "next/navigation"
import { createServerClient } from "@/lib/supabase/server"
import { TenantAdminSignupForm } from "./tenant-admin-signup-form"

export default async function BackofficeInvitePage({
  params,
}: {
  params: Promise<{ token: string }>
}) {
  const { token } = await params
  const supabase = await createServerClient()

  // Check if already logged in
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (user) {
    redirect("/backoffice/dashboard")
  }

  // Validate invite token
  const { data: userInvite, error: userError } = await supabase
    .from("users")
    .select("id, email, name, role, tenant_id, invite_token, tenants(id, name, slug)")
    .eq("invite_token", token)
    .maybeSingle()

  if (userError || !userInvite || !userInvite.invite_token) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-primary/5 to-secondary/5 p-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600">Invalid Invite</h1>
          <p className="mt-2 text-muted-foreground">This invite link is invalid or has expired.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-primary/5 to-secondary/5 p-4">
      <TenantAdminSignupForm userInvite={userInvite} token={token} />
    </div>
  )
}
