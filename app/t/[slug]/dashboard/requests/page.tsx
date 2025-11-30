import { redirect } from 'next/navigation'
import { createServerClient } from "@/lib/supabase/server"
import { Button } from "@/components/ui/button"
import { Plus } from 'lucide-react'
import Link from "next/link"
import { getMyRequests, getCommunityRequests } from "@/app/actions/resident-requests"
import { RequestsPageClient } from "@/components/requests/requests-page-client"
import { CreateRequestModalWrapper } from "@/components/requests/create-request-modal-wrapper"

interface RequestsPageProps {
  params: Promise<{ slug: string }>
}

export default async function RequestsPage({ params }: RequestsPageProps) {
  const { slug } = await params

  const supabase = await createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect(`/t/${slug}/login`)
  }

  const { data: tenant } = await supabase
    .from("tenants")
    .select("id, name")
    .eq("slug", slug)
    .single()

  if (!tenant) {
    redirect("/")
  }

  // Fetch all relevant requests (both my requests and community requests)
  // We'll merge them for the client side to filter/sort
  const [myRequests, communityRequests] = await Promise.all([
    getMyRequests(tenant.id),
    getCommunityRequests(tenant.id),
  ])

  // Merge and deduplicate (in case my request is also a community request)
  const allRequestsMap = new Map()

  myRequests.forEach(req => allRequestsMap.set(req.id, req))
  communityRequests.forEach(req => allRequestsMap.set(req.id, req))

  const allRequests = Array.from(allRequestsMap.values())

  // Sort by created_at desc
  allRequests.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto space-y-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <h1 className="text-3xl font-bold tracking-tight">Requests & Forms</h1>
              <p className="text-muted-foreground text-lg">
                Submit requests and track community issues
              </p>
            </div>

            <CreateRequestModalWrapper tenantSlug={slug} tenantId={tenant.id} />
          </div>

          <RequestsPageClient requests={allRequests} tenantSlug={slug} />
        </div>
      </div>
    </div>
  )
}
