import { createServerClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { CategoryForm } from "../category-form"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default async function CreateCategoryPage({
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
    redirect(`/t/${slug}/dashboard`)
  }

  return (
    <div className="space-y-6">
      <div>
        <Button variant="ghost" size="sm" asChild className="mb-4">
          <Link href={`/t/${slug}/admin/events/categories`}>← Back to Categories</Link>
        </Button>
        <h1 className="text-2xl font-bold">Create Event Category</h1>
        <p className="text-muted-foreground">Add a new category for organizing community events</p>
      </div>

      <CategoryForm tenantId={tenant.id} tenantSlug={slug} />
    </div>
  )
}
