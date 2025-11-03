import { createServerClient } from "@/lib/supabase/server"
import { CommunityBoundaryEditor } from "@/components/map/community-boundary-editor"

export default async function CommunityBoundaryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const supabase = await createServerClient()

  const { data: tenant } = await supabase.from("tenants").select("*").eq("slug", slug).single()

  if (!tenant) {
    return <div>Tenant not found</div>
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Community Boundary</h1>
        <p className="text-muted-foreground">
          Draw the boundary of your community. This will be displayed on all maps to focus attention on your community
          area.
        </p>
      </div>

      <CommunityBoundaryEditor
        tenantId={tenant.id}
        initialBoundary={tenant.map_boundary_coordinates as { lat: number; lng: number }[] | null}
        mapCenter={tenant.map_center_coordinates as { lat: number; lng: number }}
        mapZoom={tenant.map_default_zoom || 15}
      />
    </div>
  )
}
