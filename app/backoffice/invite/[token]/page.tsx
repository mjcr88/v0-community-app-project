import { redirect } from "next/navigation"
import { createServerClient } from "@/lib/supabase/server"
import { TenantAdminSignupForm } from "./tenant-admin-signup-form"
import { createClient } from "@supabase/supabase-js"

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

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY_DEV

  if (!supabaseUrl || !supabaseServiceKey) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-primary/5 to-secondary/5 p-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600">Server Error</h1>
          <p className="mt-2 text-muted-foreground">Server configuration error. Please contact support.</p>
        </div>
      </div>
    )
  }

  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })

  const { data: userInvite, error: userError } = await supabaseAdmin
    .from("users")
    .select("id, email, name, role, tenant_id, invite_token")
    .eq("invite_token", token)
    .eq("role", "tenant_admin")
    .maybeSingle()

  console.log("[v0] Tenant admin invite validation:", { userInvite, userError, token })

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

  const { data: tenant } = await supabaseAdmin
    .from("tenants")
    .select("id, name, slug")
    .eq("id", userInvite.tenant_id)
    .single()

  const userInviteWithTenant = {
    ...userInvite,
    tenants: tenant,
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-primary/5 to-secondary/5 p-4">
      <TenantAdminSignupForm userInvite={userInviteWithTenant} token={token} />
    </div>
  )
}
