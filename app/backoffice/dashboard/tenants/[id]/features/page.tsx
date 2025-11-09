import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import TenantFeaturesForm from "./tenant-features-form"

export default async function TenantFeaturesPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  // Check authentication
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    redirect("/backoffice/login")
  }

  // Verify super admin role
  const { data: userData, error: userError } = await supabase.from("users").select("role").eq("id", user.id).single()

  if (userError || userData?.role !== "super_admin") {
    redirect("/backoffice/login")
  }

  // Fetch tenant details
  const { data: tenant, error: tenantError } = await supabase.from("tenants").select("*").eq("id", id).single()

  if (tenantError || !tenant) {
    redirect("/backoffice/dashboard")
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-secondary/5">
      <div className="container mx-auto p-6 max-w-4xl">
        <div className="mb-6">
          <Link href="/backoffice/dashboard">
            <Button variant="ghost" size="sm">
              ← Back to Dashboard
            </Button>
          </Link>
        </div>

        <div className="mb-6">
          <h1 className="text-3xl font-bold text-foreground">{tenant.name}</h1>
          <p className="text-muted-foreground mt-1">Manage feature availability for this tenant</p>
        </div>

        <div className="mb-6">
          <div className="border-b border-border">
            <nav className="flex gap-4">
              <Link
                href={`/backoffice/dashboard/tenants/${tenant.id}`}
                className="border-b-2 border-transparent px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground"
              >
                Details
              </Link>
              <Link
                href={`/backoffice/dashboard/tenants/${tenant.id}/features`}
                className="border-b-2 border-primary px-4 py-2 text-sm font-medium text-primary"
              >
                Features
              </Link>
            </nav>
          </div>
        </div>

        <TenantFeaturesForm tenant={tenant} />
      </div>
    </div>
  )
}
