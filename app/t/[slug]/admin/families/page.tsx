import { createServerClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Plus, HeartHandshake } from "lucide-react"
import Link from "next/link"

export default async function FamiliesPage({
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

  const { data: families } = await supabase
    .from("family_units")
    .select(`
      *,
      primary_contact:primary_contact_id (
        id,
        first_name,
        last_name,
        lot_id,
        lots:lot_id (
          id,
          lot_number,
          neighborhoods:neighborhood_id (
            id,
            name
          )
        )
      )
    `)
    .eq("tenant_id", tenant.id)
    .order("created_at", { ascending: false })

  // Get resident and pet counts for each family
  const familiesWithCounts = await Promise.all(
    (families || []).map(async (family) => {
      const { count: residentCount } = await supabase
        .from("users")
        .select("*", { count: "exact", head: true })
        .eq("family_unit_id", family.id)
        .eq("role", "resident")

      const { count: petCount } = await supabase
        .from("pets")
        .select("*", { count: "exact", head: true })
        .eq("family_unit_id", family.id)

      return {
        ...family,
        residentCount: residentCount || 0,
        petCount: petCount || 0,
      }
    }),
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Family Units</h2>
          <p className="text-muted-foreground">Manage family units in your community</p>
        </div>
        <Button asChild>
          <Link href={`/t/${slug}/admin/families/create`}>
            <Plus className="mr-2 h-4 w-4" />
            Create Family Unit
          </Link>
        </Button>
      </div>

      {familiesWithCounts.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center">
          <HeartHandshake className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No family units yet</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Family units are created automatically when adding multiple residents to a lot
          </p>
        </div>
      ) : (
        <div className="rounded-md border">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="h-12 px-4 text-left align-middle font-medium">Family Name</th>
                <th className="h-12 px-4 text-left align-middle font-medium">Primary Contact</th>
                <th className="h-12 px-4 text-left align-middle font-medium">Lot</th>
                <th className="h-12 px-4 text-left align-middle font-medium">Members</th>
                <th className="h-12 px-4 text-left align-middle font-medium">Pets</th>
                <th className="h-12 px-4 text-right align-middle font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {familiesWithCounts.map((family) => (
                <tr key={family.id} className="border-b">
                  <td className="p-4 align-middle font-medium">{family.name}</td>
                  <td className="p-4 align-middle">
                    {family.primary_contact ? (
                      <span>
                        {family.primary_contact.first_name} {family.primary_contact.last_name}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">No primary contact</span>
                    )}
                  </td>
                  <td className="p-4 align-middle">
                    {family.primary_contact?.lots ? (
                      <span>
                        {family.primary_contact.lots.lot_number} • {family.primary_contact.lots.neighborhoods?.name}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">No lot assigned</span>
                    )}
                  </td>
                  <td className="p-4 align-middle">{family.residentCount}</td>
                  <td className="p-4 align-middle">{family.petCount}</td>
                  <td className="p-4 align-middle text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/t/${slug}/admin/families/${family.id}/edit`}>Edit</Link>
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
