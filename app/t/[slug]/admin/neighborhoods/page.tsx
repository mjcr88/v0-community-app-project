import { createServerClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Plus, Pencil, AlertCircle } from "lucide-react"

export default async function NeighborhoodsPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const supabase = await createServerClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect(`/t/${slug}/login`)
  }

  const { data: tenant } = await supabase.from("tenants").select("*").eq("slug", slug).single()

  if (!tenant) {
    redirect("/backoffice/login")
  }

  // Fetch neighborhoods with lot count
  const { data: neighborhoods } = await supabase
    .from("neighborhoods")
    .select(`
      *,
      lots:lots(count)
    `)
    .eq("tenant_id", tenant.id)
    .order("created_at", { ascending: false })

  const neighborhoodCount = neighborhoods?.length || 0
  const canCreateMore = neighborhoodCount < tenant.max_neighborhoods

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Neighborhoods</h2>
          <p className="text-muted-foreground">
            Manage neighborhoods in your community ({neighborhoodCount} / {tenant.max_neighborhoods})
          </p>
        </div>
        <Button asChild disabled={!canCreateMore}>
          <Link href={`/t/${slug}/admin/neighborhoods/create`}>
            <Plus className="mr-2 h-4 w-4" />
            Create Neighborhood
          </Link>
        </Button>
      </div>

      {!canCreateMore && (
        <Alert variant="default" className="border-amber-200 bg-amber-50 text-amber-900">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="text-sm">
            Neighborhood limit reached. Contact your administrator to increase the limit.
          </AlertDescription>
        </Alert>
      )}

      {neighborhoods && neighborhoods.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>All Neighborhoods</CardTitle>
            <CardDescription>View and manage all neighborhoods in your community</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Lots</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {neighborhoods.map((neighborhood) => (
                  <TableRow key={neighborhood.id}>
                    <TableCell className="font-medium">{neighborhood.name}</TableCell>
                    <TableCell className="max-w-md truncate">{neighborhood.description || "—"}</TableCell>
                    <TableCell>{neighborhood.lots?.[0]?.count || 0}</TableCell>
                    <TableCell>{new Date(neighborhood.created_at).toLocaleDateString()}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/t/${slug}/admin/neighborhoods/${neighborhood.id}/edit`}>
                          <Pencil className="h-4 w-4" />
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>No Neighborhoods Yet</CardTitle>
            <CardDescription>Get started by creating your first neighborhood</CardDescription>
          </CardHeader>
        </Card>
      )}
    </div>
  )
}
