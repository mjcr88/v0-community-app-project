import { createServerClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import Link from "next/link"
import { InterestsTable } from "./interests-table"
import { Lightbulb } from "lucide-react"

export default async function InterestsPage({
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

  const { data: interests } = await supabase.from("interests").select("*").eq("tenant_id", tenant.id).order("name")

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Interests</h2>
          <p className="text-muted-foreground">Manage community interests for residents to select</p>
        </div>
        <Button asChild>
          <Link href={`/t/${slug}/admin/interests/create`}>
            <Plus className="mr-2 h-4 w-4" />
            Create Interest
          </Link>
        </Button>
      </div>

      {!interests || interests.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center">
          <Lightbulb className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No interests yet</h3>
          <p className="text-sm text-muted-foreground mb-4">Get started by creating your first interest</p>
        </div>
      ) : (
        <InterestsTable interests={interests} slug={slug} />
      )}
    </div>
  )
}
