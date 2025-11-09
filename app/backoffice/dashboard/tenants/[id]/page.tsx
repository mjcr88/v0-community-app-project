import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { Pencil } from "lucide-react"

export default async function ViewTenantPage({ params }: { params: Promise<{ id: string }> }) {
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
  const { data: tenant, error: tenantError } = await supabase
    .from("tenants")
    .select(
      `
      *,
      tenant_admin:users!tenants_tenant_admin_id_fkey(id, name, email)
    `,
    )
    .eq("id", id)
    .single()

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

        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-foreground">{tenant.name}</h1>
            <p className="text-muted-foreground mt-1">Tenant details and configuration</p>
          </div>
          <Link href={`/backoffice/dashboard/tenants/${tenant.id}/edit`}>
            <Button>
              <Pencil className="h-4 w-4 mr-2" />
              Edit Tenant
            </Button>
          </Link>
        </div>

        <div className="mb-6">
          <div className="border-b border-border">
            <nav className="flex gap-4">
              <Link
                href={`/backoffice/dashboard/tenants/${tenant.id}`}
                className="border-b-2 border-primary px-4 py-2 text-sm font-medium text-primary"
              >
                Details
              </Link>
              <Link
                href={`/backoffice/dashboard/tenants/${tenant.id}/features`}
                className="border-b-2 border-transparent px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground"
              >
                Features
              </Link>
            </nav>
          </div>
        </div>

        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
              <CardDescription>Core tenant details</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Tenant Name</p>
                  <p className="text-lg font-medium">{tenant.name}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Slug</p>
                  <p className="text-lg font-mono">{tenant.slug}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Max Neighborhoods</p>
                  <p className="text-lg font-medium">{tenant.max_neighborhoods}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Created</p>
                  <p className="text-lg">{new Date(tenant.created_at).toLocaleDateString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Tenant Administrator</CardTitle>
              <CardDescription>User responsible for managing this tenant</CardDescription>
            </CardHeader>
            <CardContent>
              {tenant.tenant_admin ? (
                <div className="grid gap-3">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Name</p>
                    <p className="text-lg">{tenant.tenant_admin.name || "Not set"}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Email</p>
                    <p className="text-lg">{tenant.tenant_admin.email}</p>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <p>No tenant administrator assigned</p>
                  <Link href={`/backoffice/dashboard/tenants/${tenant.id}/edit`}>
                    <Button variant="outline" className="mt-4 bg-transparent">
                      Assign Administrator
                    </Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
