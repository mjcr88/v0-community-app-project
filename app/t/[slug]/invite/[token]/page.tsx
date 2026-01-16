import { redirect } from "next/navigation"
import { createServerClient } from "@/lib/supabase/server"
import NextImage from "next/image"
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

  // Check if already logged in - redirect based on role
  const {
    data: { user },
  } = await supabase.auth.getUser()

  console.log("[v0] Current user:", user?.id || "none")

  if (user) {
    // Check user role to determine redirect destination
    const { data: userData } = await supabase
      .from("users")
      .select("role, is_tenant_admin")
      .eq("id", user.id)
      .single()

    if (userData?.role === "super_admin" || userData?.is_tenant_admin) {
      redirect(`/t/${slug}/admin/dashboard`)
    } else {
      redirect(`/t/${slug}/dashboard`)
    }
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
    <div className="min-h-screen flex">
      {/* Left side - Rio Image */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-forest-50 to-sky-50 items-center justify-center p-12">
        <div className="max-w-md text-center">
          <img
            src="/rio/parrot.png"
            alt="Rio - Your Community Guide"
            className="w-80 h-auto mx-auto mb-8"
          />
          <h2 className="text-2xl font-bold text-forest-800 mb-4">
            Welcome to {tenant.name}!
          </h2>
          <p className="text-forest-600">
            Set up your password to join your community and connect with your neighbors.
          </p>
        </div>
      </div>

      {/* Right side - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center bg-background p-4 sm:p-8">
        <SignupForm tenant={tenant} resident={resident} token={token} />
      </div>
    </div>
  )
}
