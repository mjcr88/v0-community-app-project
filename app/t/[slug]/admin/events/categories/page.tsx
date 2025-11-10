import { createServerClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Plus } from "lucide-react"
import { CategoriesTable } from "./categories-table"

export default async function EventCategoriesPage({
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

  // Get tenant info
  const { data: tenant } = await supabase.from("tenants").select("*").eq("slug", slug).single()

  if (!tenant) {
    redirect(`/t/${slug}/dashboard`)
  }

  // Fetch event categories
  const { data: categories, error } = await supabase
    .from("event_categories")
    .select("*")
    .eq("tenant_id", tenant.id)
    .order("name")

  if (error) {
    console.error("[v0] Error fetching event categories:", error)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Event Categories</h1>
          <p className="text-muted-foreground">Manage categories that residents can use to organize events</p>
        </div>
        <Button asChild>
          <Link href={`/t/${slug}/admin/events/categories/create`}>
            <Plus className="h-4 w-4 mr-2" />
            Create Category
          </Link>
        </Button>
      </div>

      <CategoriesTable categories={categories || []} tenantSlug={slug} />
    </div>
  )
}
