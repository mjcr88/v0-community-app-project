import { createClient } from "@/lib/supabase/server"
import { AdminReservationsTable } from "./AdminReservationsTable"

interface AdminReservationsPageProps {
    params: Promise<{ slug: string }>
}

export default async function AdminReservationsPage({ params }: AdminReservationsPageProps) {
    const { slug } = await params
    const supabase = await createClient()

    // Get tenant ID
    const { data: tenant } = await supabase.from("tenants").select("id").eq("slug", slug).single()

    if (!tenant) {
        return <div>Tenant not found</div>
    }

    // Fetch all reservations for this tenant
    const { data: reservations } = await supabase
        .from("reservations")
        .select(`
            id,
            title,
            start_time,
            end_time,
            status,
            user_id,
            user:users!user_id (
                first_name,
                last_name,
                email,
                profile_picture_url
            ),
            location:locations (
                name
            )
        `)
        .eq("tenant_id", tenant.id)
        .order("start_time", { ascending: false }) // Newest/Future first? Or newest created? Let's do start_time desc to show upcoming and recent.

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold tracking-tight">Reservations</h2>
                <p className="text-muted-foreground">
                    Manage and view all facility reservations.
                </p>
            </div>

            <AdminReservationsTable
                reservations={reservations || []}
                tenantSlug={slug}
            />
        </div>
    )
}
