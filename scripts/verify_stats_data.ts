
import { createClient } from "@supabase/supabase-js"
import dotenv from "dotenv"

dotenv.config({ path: ".env.local" })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function verifyStats() {
    console.log("Verifying Stats Data...")

    // 1. Get a test user (Resident)
    const { data: users, error: userError } = await supabase
        .from("users")
        .select("id, tenant_id, role, first_name")
        .eq("role", "resident")
        .limit(1)

    if (userError || !users?.length) {
        console.error("Error fetching user:", userError)
        return
    }

    const user = users[0]
    console.log(`Testing for User: ${user.first_name} (${user.id})`)
    console.log(`Tenant ID: ${user.tenant_id}`)

    const tenantId = user.tenant_id
    const userId = user.id
    const now = new Date().toISOString()

    // 1. Neighborhoods
    const { count: neighborhoods } = await supabase
        .from("neighborhoods")
        .select("id", { count: "exact", head: true })
        .eq("tenant_id", tenantId)
    console.log(`1. Neighborhoods: ${neighborhoods}`)

    // 2. Neighbors
    const { count: neighbors } = await supabase
        .from("users")
        .select("id", { count: "exact", head: true })
        .eq("tenant_id", tenantId)
        .eq("role", "resident")
    console.log(`2. Neighbors: ${neighbors}`)

    // 3. Upcoming Events
    const { count: events } = await supabase
        .from("events")
        .select("id", { count: "exact", head: true })
        .eq("tenant_id", tenantId)
        .gte("end_time", now)
    console.log(`3. Upcoming Events: ${events}`)

    // 4. Current Announcements
    const { count: announcements } = await supabase
        .from("announcements")
        .select("id", { count: "exact", head: true })
        .eq("tenant_id", tenantId)
        .eq("status", "published")
    console.log(`4. Current Announcements: ${announcements}`)

    // 5. Active Check-ins
    const { count: checkins } = await supabase
        .from("check_ins")
        .select("id", { count: "exact", head: true })
        .eq("tenant_id", tenantId)
        .eq("status", "active")
    console.log(`5. Active Check-ins: ${checkins}`)

    // 6. Active Requests
    const { count: requests } = await supabase
        .from("maintenance_requests")
        .select("id", { count: "exact", head: true })
        .eq("tenant_id", tenantId)
        .in("status", ["pending", "in_progress"])
    console.log(`6. Active Requests: ${requests}`)

    // 7. Available Listings
    const { count: listings } = await supabase
        .from("exchange_listings")
        .select("id", { count: "exact", head: true })
        .eq("tenant_id", tenantId)
        .eq("status", "available")
    console.log(`7. Available Listings: ${listings}`)

    // 8. My RSVPs
    const { count: rsvps } = await supabase
        .from("event_rsvps")
        .select("event_id", { count: "exact", head: true })
        .eq("user_id", userId)
        .in("status", ["going", "maybe"])
    console.log(`8. My RSVPs: ${rsvps}`)

    // 9. My Saved Events
    const { count: saved } = await supabase
        .from("saved_events")
        .select("event_id", { count: "exact", head: true })
        .eq("user_id", userId)
    console.log(`9. My Saved Events: ${saved}`)

    // 10. My Active Listings
    const { count: myListings } = await supabase
        .from("exchange_listings")
        .select("id", { count: "exact", head: true })
        .eq("tenant_id", tenantId)
        .eq("user_id", userId)
        .eq("status", "available")
    console.log(`10. My Active Listings: ${myListings}`)

    // 11. My Active Transactions
    const { count: myTx } = await supabase
        .from("exchange_transactions")
        .select("id", { count: "exact", head: true })
        .eq("tenant_id", tenantId)
        .or(`borrower_id.eq.${userId},seller_id.eq.${userId}`)
        .in("status", ["requested", "approved", "scheduled", "picked_up", "confirmed"])
    console.log(`11. My Active Transactions: ${myTx}`)

    // 12. My Active Requests
    const { count: myRequests } = await supabase
        .from("maintenance_requests")
        .select("id", { count: "exact", head: true })
        .eq("tenant_id", tenantId)
        .eq("user_id", userId)
        .in("status", ["pending", "in_progress"])
    console.log(`12. My Active Requests: ${myRequests}`)
}

verifyStats()
