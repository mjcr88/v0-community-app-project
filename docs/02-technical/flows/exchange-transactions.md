# Exchange Transaction Lifecycle & Logic

> **Context**: Use this document as the source of truth for the Asset Exchange flow.
> **Key Files**: `app/actions/exchange-transactions.ts`, `app/actions/exchange-listings.ts`

## 1. State Machine

The exchange flow moves through 5 distinct statuses.

| Status | Description | Valid Next States |
| :--- | :--- | :--- |
| **`requested`** | Initial state. Borrower asked for item. | `confirmed`, `rejected` |
| **`confirmed`** | Lender approved. Quantity is reserved. | `picked_up`, `rejected` (cancel) |
| **`rejected`** | Terminal state. Request denied or cancelled. | (None) |
| **`picked_up`** | Item is with borrower. Active loan. | `completed` |
| **`completed`** | Terminal state. Item returned or service done. | (None) |

## 2. Notification Triggers

Notifications are the primary drivers of the UX, guiding users to the next step.

| Step | Action | Status Change | Notification Generated | Target | Action Button |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **1** | **Request** | `null` → `requested` | `exchange_request` | **Lender** | "Approve" / "Reject" |
| **2** | **Approve** | `requested` → `confirmed` | `exchange_confirmed` | **Borrower** | "Confirm Pickup" |
| **3** | **Reject** | `requested` → `rejected` | `exchange_rejected` | **Borrower** | (None) |
| **4** | **Cancel** | `confirmed` → `rejected` | `exchange_cancelled` | **Other Party** | (None) |
| **5a** | **Pickup** | `confirmed` → `picked_up` | `exchange_picked_up` | **Other Party** | (None) |
| **5b** | **Pickup** | (Lender triggers) | **`exchange_picked_up`** | **Lender** | "Mark Returned" |
| **6** | **Return** | `picked_up` → `completed` | `exchange_completed` | **Borrower** | (None) |

> **Critical Logic**: Step 5b generates a self-notification for the Lender. This ensures the "Active Loan" stays at the top of their list so they can easily find the "Mark Returned" button later.

## 3. Inventory Logic

*   **On Confirm**: `available_quantity` is **decremented**.
*   **On Reject/Cancel**: No inventory change (unless was confirmed, then restored).
*   **On Complete**: `available_quantity` is **restored** (incremented).

## 4. Edge Cases

*   **Services/Food**: Category logic checks if `requiresReturn` is false. If so, `picked_up` action immediately moves to `completed` and restores quantity (if applicable).
*   **Rejections**: Can include a `rejection_reason` which is displayed to the borrower.
*   **Cancellations**: Both parties can cancel, but only *before* pickup. After pickup, the flow must proceed to return/complete.
