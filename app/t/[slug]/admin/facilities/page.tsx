import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Plus, Warehouse } from "lucide-react"
import Link from "next/link"
import { AdminFacilitiesTable } from "./admin-facilities-table"

export default async function AdminFacilitiesPage({
    params,
}: {
    params: Promise<{ slug: string }>
}) {
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

    // Fetch all facilities for the tenant
    const { data: facilities, error } = await supabase
        .from("locations")
        .select("*")
        .eq("tenant_id", tenant.id)
        .eq("type", "facility")
        .order("name")

    if (error) {
        console.error("[v0] Error fetching facilities:", error)
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Facilities</h2>
                    <p className="text-muted-foreground">Manage community facilities and reservations</p>
                </div>
                <div className="flex gap-2">
                    {/* Reusing existing location creation flow for now, pointing to generic create? 
               Or maybe we need a specific facility creation page?
               The plan says "Admin can create facility from this page" - usually implies a button.
               Existing location creation is likely /admin/map/locations/create or similar.
               Let's point to map/locations/create?type=facility if that works, or just map/locations/create for now.
           */}
                    <Button asChild>
                        <Link href={`/t/${slug}/admin/map/locations/create?type=facility`}>
                            <Plus className="mr-2 h-4 w-4" />
                            Add Facility
                        </Link>
                    </Button>
                </div>
            </div>

            {!facilities || facilities.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center">
                    <Warehouse className="h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No facilities yet</h3>
                    <p className="text-sm text-muted-foreground mb-4">Get started by adding your first facility</p>
                    <Button asChild>
                        <Link href={`/t/${slug}/admin/map/locations/create?type=facility`}>
                            <Plus className="mr-2 h-4 w-4" />
                            Add Facility
                        </Link>
                    </Button>
                </div>
            ) : (
                <AdminFacilitiesTable facilities={facilities} slug={slug} />
            )}
        </div>
    )
}
