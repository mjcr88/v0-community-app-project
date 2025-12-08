import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { LotsTable } from "./lots-table"

type SortField = "lot_number" | "neighborhood" | "created_at"
type SortDirection = "asc" | "desc"

export default async function LotsPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const supabase = await createClient()

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

  const { data: lots } = await supabase
    .from("lots")
    .select(`
      *,
      neighborhoods:neighborhood_id (
        id,
        name,
        tenant_id
      ),
      users!users_lot_id_fkey (
        id,
        first_name,
        last_name
      )
    `)
    .eq("neighborhoods.tenant_id", tenant.id)
    .order("created_at", { ascending: false })

  return <LotsTable slug={slug} initialLots={lots || []} />
}
