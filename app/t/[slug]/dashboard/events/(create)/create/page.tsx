import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { EventForm } from "./event-form"

export default async function CreateEventPage({ params }: { params: Promise<{ slug: string }> }) {
  console.log("[v0] CreateEventPage - Component invoked")
  const { slug } = await params
  console.log("[v0] CreateEventPage - slug:", slug)

  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  console.log("[v0] CreateEventPage - user:", user?.id)

  if (!user) {
    console.log("[v0] CreateEventPage - No user, redirecting to login")
    redirect(`/t/${slug}/login`)
  }

  const { data: resident } = await supabase
    .from("users")
    .select("id, tenant_id")
    .eq("id", user.id)
    .eq("role", "resident")
    .single()

  console.log("[v0] CreateEventPage - resident:", resident)

  if (!resident) {
    console.log("[v0] CreateEventPage - No resident, redirecting to login")
    redirect(`/t/${slug}/login`)
  }

  // Fetch event categories for this tenant
  const { data: categories } = await supabase
    .from("event_categories")
    .select("*")
    .eq("tenant_id", resident.tenant_id)
    .order("name")

  console.log("[v0] CreateEventPage - categories count:", categories?.length)
  console.log("[v0] CreateEventPage - Rendering form")

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Create Event</h2>
        <p className="text-muted-foreground">Share an event with your community</p>
      </div>

      <EventForm tenantSlug={slug} tenantId={resident.tenant_id} categories={categories || []} />
    </div>
  )
}
