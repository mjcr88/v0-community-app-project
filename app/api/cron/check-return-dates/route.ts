import { NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"
import { createNotification } from "@/app/actions/notifications"
import { generateNotificationTitle, generateNotificationMessage } from "@/lib/notification-utils"

/**
 * Cron job to check for upcoming and overdue return dates
 * Runs daily via Vercel Cron
 * 
 * Sends:
 * - Reminder notifications 2 days before return date (to borrower)
 * - Overdue notifications when return date has passed (to both borrower and lender)
 */
export async function GET(request: Request) {
  try {
    // Verify cron secret for security (optional in development)
    const authHeader = request.headers.get("authorization")
    const cronSecret = process.env.CRON_SECRET
    
    // Only enforce cron secret if it's configured
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const supabase = await createServerClient()
    
    // Get all active transactions with return dates
    const { data: transactions, error } = await supabase
      .from("exchange_transactions")
      .select(`
        id,
        tenant_id,
        borrower_id,
        lender_id,
        expected_return_date,
        listing_id,
        exchange_listings!inner(
          id,
          title
        )
      `)
      .eq("status", "picked_up")
      .not("expected_return_date", "is", null)

    if (error) {
      console.error("[v0] Error fetching transactions for return check:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (!transactions || transactions.length === 0) {
      return NextResponse.json({ 
        message: "No active transactions to check",
        processed: 0 
      })
    }

    const now = new Date()
    const twoDaysFromNow = new Date(now)
    twoDaysFromNow.setDate(twoDaysFromNow.getDate() + 2)

    let remindersSent = 0
    let overdueNotificationsSent = 0

    // Get tenant slugs for action URLs
    const tenantIds = [...new Set(transactions.map(t => t.tenant_id))]
    const { data: tenants } = await supabase
      .from("tenants")
      .select("id, slug")
      .in("id", tenantIds)
    
    const tenantSlugMap = new Map(tenants?.map(t => [t.id, t.slug]) || [])

    for (const transaction of transactions) {
      const returnDate = new Date(transaction.expected_return_date!)
      const tenantSlug = tenantSlugMap.get(transaction.tenant_id)
      
      if (!tenantSlug) continue

      const listing = transaction.exchange_listings as any
      const listingTitle = listing?.title || "Item"

      // Check if reminder should be sent (2 days before, haven't sent yet)
      if (returnDate <= twoDaysFromNow && returnDate > now) {
        // Check if reminder already sent
        const { data: existingReminder } = await supabase
          .from("notifications")
          .select("id")
          .eq("exchange_transaction_id", transaction.id)
          .eq("type", "exchange_reminder")
          .eq("recipient_id", transaction.borrower_id)
          .maybeSingle()

        if (!existingReminder) {
          // Send reminder to borrower
          await createNotification({
            tenant_id: transaction.tenant_id,
            recipient_id: transaction.borrower_id,
            type: "exchange_reminder",
            title: generateNotificationTitle("exchange_reminder", { listingTitle }),
            message: generateNotificationMessage("exchange_reminder", {
              returnDate: transaction.expected_return_date!,
            }),
            exchange_transaction_id: transaction.id,
            exchange_listing_id: transaction.listing_id,
            action_url: `/t/${tenantSlug}/dashboard?tab=transactions`,
          })

          remindersSent++
        }
      }

      // Check if overdue notification should be sent (past due date, haven't notified yet)
      if (returnDate < now) {
        // Check if overdue notification already sent to borrower
        const { data: existingBorrowerOverdue } = await supabase
          .from("notifications")
          .select("id")
          .eq("exchange_transaction_id", transaction.id)
          .eq("type", "exchange_overdue")
          .eq("recipient_id", transaction.borrower_id)
          .maybeSingle()

        if (!existingBorrowerOverdue) {
          // Send overdue notification to borrower
          await createNotification({
            tenant_id: transaction.tenant_id,
            recipient_id: transaction.borrower_id,
            type: "exchange_overdue",
            title: generateNotificationTitle("exchange_overdue", { listingTitle }),
            message: generateNotificationMessage("exchange_overdue", {
              returnDate: transaction.expected_return_date!,
            }),
            exchange_transaction_id: transaction.id,
            exchange_listing_id: transaction.listing_id,
            action_url: `/t/${tenantSlug}/dashboard?tab=transactions`,
          })

          overdueNotificationsSent++
        }

        // Check if overdue notification already sent to lender
        const { data: existingLenderOverdue } = await supabase
          .from("notifications")
          .select("id")
          .eq("exchange_transaction_id", transaction.id)
          .eq("type", "exchange_overdue")
          .eq("recipient_id", transaction.lender_id)
          .maybeSingle()

        if (!existingLenderOverdue) {
          // Send overdue notification to lender
          await createNotification({
            tenant_id: transaction.tenant_id,
            recipient_id: transaction.lender_id,
            type: "exchange_overdue",
            title: generateNotificationTitle("exchange_overdue", { listingTitle }),
            message: `${listingTitle} is now overdue. Expected return: ${new Date(transaction.expected_return_date!).toLocaleDateString()}`,
            exchange_transaction_id: transaction.id,
            exchange_listing_id: transaction.listing_id,
            action_url: `/t/${tenantSlug}/dashboard?tab=transactions`,
          })

          overdueNotificationsSent++
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: "Return dates checked successfully",
      processed: transactions.length,
      remindersSent,
      overdueNotificationsSent,
    })
  } catch (error) {
    console.error("[v0] Unexpected error in check-return-dates cron:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
