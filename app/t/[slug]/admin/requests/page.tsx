import { createServerClient } from "@/lib/supabase/server"
import { redirect } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { Plus, ClipboardList } from 'lucide-react'
import Link from "next/link"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AdminRequestsTable } from "./admin-requests-table"
import { getAllRequests } from "@/app/actions/resident-requests"

export default async function AdminRequestsPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
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

  const { data: userData } = await supabase
    .from("users")
    .select("role, is_tenant_admin")
    .eq("id", user.id)
    .eq("tenant_id", tenant.id)
    .single()

  if (!userData || (!['tenant_admin', 'super_admin'].includes(userData.role) && !userData.is_tenant_admin)) {
    redirect(`/t/${slug}/dashboard`)
  }

  // Fetch all requests
  const requests = await getAllRequests(tenant.id)

  const activeRequests = requests.filter(r => r.status === 'pending' || r.status === 'in_progress')
  const resolvedRequests = requests.filter(r => r.status === 'resolved' || r.status === 'rejected')

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Resident Requests</h2>
          <p className="text-muted-foreground">Manage all requests from residents</p>
        </div>
        <Button asChild>
          <Link href={`/t/${slug}/dashboard/requests`}>
            <Plus className="mr-2 h-4 w-4" />
            Create Request
          </Link>
        </Button>
      </div>

      <Tabs defaultValue="active" className="space-y-6">
        <TabsList>
          <TabsTrigger value="active">
            Active
            {activeRequests.length > 0 && (
              <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-primary text-primary-foreground">
                {activeRequests.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="resolved">
            Resolved
            {resolvedRequests.length > 0 && (
              <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-muted text-muted-foreground">
                {resolvedRequests.length}
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="space-y-4">
          {activeRequests.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center">
              <ClipboardList className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No active requests</h3>
              <p className="text-sm text-muted-foreground mb-4">All requests have been resolved</p>
            </div>
          ) : (
            <AdminRequestsTable 
              requests={activeRequests} 
              slug={slug} 
              tenantId={tenant.id}
            />
          )}
        </TabsContent>

        <TabsContent value="resolved" className="space-y-4">
          {resolvedRequests.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center">
              <ClipboardList className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No resolved requests</h3>
              <p className="text-sm text-muted-foreground mb-4">Resolved requests will appear here</p>
            </div>
          ) : (
            <AdminRequestsTable 
              requests={resolvedRequests} 
              slug={slug} 
              tenantId={tenant.id}
            />
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
