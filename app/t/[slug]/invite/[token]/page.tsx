import { redirect } from "next/navigation"
import { createServerClient } from "@/lib/supabase/server"
import { SignupForm } from "./signup-form"
import { validateInviteToken } from "./validate-invite-action"

export default async function InvitePage({
  params,
}: {
  params: Promise<{ slug: string; token: string }>
}) {
  const { slug, token } = await params
  const supabase = await createServerClient()

  console.log("[v0] Invite page accessed with token:", token)

  // Check if tenant exists
  const { data: tenant, error: tenantError } = await supabase
    .from("tenants")
    .select("id, name, slug, features")
    .eq("slug", slug)
    .maybeSingle()

  console.log("[v0] Tenant lookup result:", { tenant, tenantError })

  if (tenantError || !tenant) {
    redirect("/backoffice/login")
  }

  // Check if already logged in
  const {
    data: { user },
  } = await supabase.auth.getUser()

  console.log("[v0] Current user:", user?.id || "none")

  if (user) {
    redirect(`/t/${slug}/admin/dashboard`)
  }

  const validationResult = await validateInviteToken(token, tenant.id)

  console.log("[v0] Validation result:", validationResult)

  if (!validationResult.success || !validationResult.resident) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-forest-50 to-sky-50 p-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600">Invalid Invite</h1>
          <p className="mt-2 text-muted-foreground">This invite link is invalid or has expired.</p>
          <p className="mt-4 text-sm text-muted-foreground">Debug: {validationResult.error || "No error message"}</p>
        </div>
      </div>
    )
  }

  const resident = validationResult.resident

  // The resident will create their auth account during signup

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-forest-50 to-sky-50 p-4">
      <SignupForm tenant={tenant} resident={resident} token={token} />
    </div>
  )
}
