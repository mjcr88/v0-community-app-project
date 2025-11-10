import { createClient } from "@/lib/supabase/server"
import { redirect, notFound } from "next/navigation"
import { EventEditForm } from "./event-edit-form"
import { getEventCategories } from "@/app/actions/event-categories"

export default async function EditEventPage({
  params,
}: {
  params: Promise<{ slug: string; eventId: string }>
}) {
  const { slug, eventId } = await params
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

  // Fetch the event
  const { data: event } = await supabase
    .from("events")
    .select("*")
    .eq("id", eventId)
    .eq("tenant_id", resident.tenant_id)
    .eq("created_by", user.id) // Only creator can edit
    .single()

  if (!event) {
    notFound()
  }

  // Fetch categories
  const categories = await getEventCategories(resident.tenant_id)

  return (
    <div className="max-w-4xl mx-auto space-y-6 p-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Edit Event</h1>
        <p className="text-muted-foreground">Update your event details</p>
      </div>

      <EventEditForm tenantSlug={slug} tenantId={resident.tenant_id} event={event} categories={categories} />
    </div>
  )
}
