import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import Link from "next/link"
import { Pencil, Eye, LogIn } from "lucide-react"

export default async function BackofficeDashboardPage() {
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

  // Fetch all tenants
  const { data: tenants, error: tenantsError } = await supabase
    .from("tenants")
    .select("*")
    .order("created_at", { ascending: false })

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div>
            <CardTitle>Tenants</CardTitle>
            <CardDescription>Manage community tenants</CardDescription>
          </div>
          <Link href="/backoffice/dashboard/create-tenant">
            <Button>Create Tenant</Button>
          </Link>
        </CardHeader>
        <CardContent>
          {tenantsError ? (
            <div className="text-sm text-destructive bg-destructive/10 p-4 rounded-md">
              Error loading tenants: {tenantsError.message}
            </div>
          ) : tenants && tenants.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Slug</TableHead>
                  <TableHead>Max Neighborhoods</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tenants.map((tenant) => (
                  <TableRow key={tenant.id}>
                    <TableCell className="font-medium">{tenant.name}</TableCell>
                    <TableCell className="font-mono text-sm">{tenant.slug}</TableCell>
                    <TableCell>{tenant.max_neighborhoods}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(tenant.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link href={`/t/${tenant.slug}/login`}>
                          <Button variant="ghost" size="sm" title="Go to tenant login">
                            <LogIn className="h-4 w-4" />
                          </Button>
                        </Link>
                        <Link href={`/backoffice/dashboard/tenants/${tenant.id}`}>
                          <Button variant="ghost" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </Link>
                        <Link href={`/backoffice/dashboard/tenants/${tenant.id}/edit`}>
                          <Button variant="ghost" size="sm">
                            <Pencil className="h-4 w-4" />
                          </Button>
                        </Link>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <p className="text-lg mb-2">No tenants yet</p>
              <p className="text-sm">Create your first tenant to get started</p>
            </div>
          )}
        </CardContent>
      </Card>
    </>
  )
}
