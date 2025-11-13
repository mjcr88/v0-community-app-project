import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { EventForm } from "./event-form"

export default async function CreateEventPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ locationId?: string }>
}) {
  const { slug } = await params
  const { locationId } = await searchParams
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect(`/t/${slug}/login`)
  }

  const { data: resident } = await supabase
    .from("users")
    .select("id, tenant_id")
    .eq("id", user.id)
    .eq("role", "resident")
    .single()

  if (!resident) {
    redirect(`/t/${slug}/login`)
  }

  // Fetch event categories
  const { data: categories } = await supabase
    .from("event_categories")
    .select("id, name, icon")
    .eq("tenant_id", resident.tenant_id)
    .order("name")

  let initialLocation = null
  if (locationId) {
    const { data: location } = await supabase
      .from("locations")
      .select("id, name, type, coordinates")
      .eq("id", locationId)
      .eq("tenant_id", resident.tenant_id)
      .single()

    initialLocation = location
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Create Event</h2>
        <p className="text-muted-foreground">Share an event with your community</p>
      </div>

      <EventForm
        tenantSlug={slug}
        tenantId={resident.tenant_id}
        categories={categories || []}
        initialLocation={initialLocation}
      />
    </div>
  )
}
