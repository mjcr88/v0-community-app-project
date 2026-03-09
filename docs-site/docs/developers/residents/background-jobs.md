# Neighbor Directory: Background Processes

The Neighbor Directory (Resident Directory) primarily relies on synchronous logic within Server Actions to maintain data consistency. There are currently no long-running cron jobs specific to this module, but background-like behaviors are achieved through coordinated actions.

## Synchronous "Background" Logic

Certain operations trigger downstream effects that appear as background processes but are executed as part of the primary request flow.

### Notification Triggers
When a resident is updated or added to a family, the following system-generated notifications are created synchronously:
- **Family Invitations**: When an admin or head of household adds a member, a notification is sent to the recipient.
- **Profile Updates**: Certain critical changes (e.g., lot moves) trigger automated alerts via the `notifications` table.

### Member Count Synchronization
The member count displayed on listings and lists is maintained via:
- **Server Action Logic**: Incremented/decremented during the `addMember` or `removeMember` transactions.
- **Database Triggers (Fallback)**: Native SQL triggers on the `neighbor_list_members` table ensure `member_count` in `neighbor_lists` remains accurate even if a direct database edit occurs.

## Planned Dependencies

While not currently cron-driven, the following features are positioned for background job integration:

| Feature | Logic | Trigger Type |
| :--- | :--- | :--- |
| **Invitation Expiry** | Auto-archiving of unaccepted directory invitations after 30 days. | Planned Cron (Vercel) |
| **Data Integrity Check** | Weekly validation of resident lot assignments against the master lot list. | Planned Cron (Edge Function) |

## Related Background Jobs

Several shared background processes impact the Resident Directory indirectly:

### Exchange Return Dates
Located in `app/api/cron/check-return-dates/route.ts`.
This job monitors items borrowed between neighbors and sends automated return reminders. While part of the "Exchange" module, it relies heavily on the `Neighbor Directory` for routing notifications to the correct residents.
