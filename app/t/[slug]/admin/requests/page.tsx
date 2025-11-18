import { createServerClient } from "@/lib/supabase/server"
import { redirect } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { Plus, ClipboardList } from 'lucide-react'
import Link from "next/link"
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

  // Fetch all requests
  const requests = await getAllRequests(tenant.id)

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

      {!requests || requests.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center">
          <ClipboardList className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No requests yet</h3>
          <p className="text-sm text-muted-foreground mb-4">Residents haven't submitted any requests</p>
        </div>
      ) : (
        <AdminRequestsTable requests={requests} slug={slug} tenantId={tenant.id} />
      )}
    </div>
  )
}
