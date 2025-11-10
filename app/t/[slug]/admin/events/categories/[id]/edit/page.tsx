import { createServerClient } from "@/lib/supabase/server"
import { redirect, notFound } from "next/navigation"
import { CategoryForm } from "../../category-form"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default async function EditCategoryPage({
  params,
}: {
  params: Promise<{ slug: string; id: string }>
}) {
  const { slug, id } = await params
  const supabase = await createServerClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect(`/t/${slug}/login`)
  }

  const { data: tenant } = await supabase.from("tenants").select("*").eq("slug", slug).single()

  if (!tenant) {
    redirect(`/t/${slug}/dashboard`)
  }

  const { data: category, error } = await supabase
    .from("event_categories")
    .select("*")
    .eq("id", id)
    .eq("tenant_id", tenant.id)
    .single()

  if (error || !category) {
    notFound()
  }

  return (
    <div className="space-y-6">
      <div>
        <Button variant="ghost" size="sm" asChild className="mb-4">
          <Link href={`/t/${slug}/admin/events/categories`}>← Back to Categories</Link>
        </Button>
        <h1 className="text-2xl font-bold">Edit Event Category</h1>
        <p className="text-muted-foreground">Update the category information</p>
      </div>

      <CategoryForm tenantId={tenant.id} tenantSlug={slug} category={category} />
    </div>
  )
}
