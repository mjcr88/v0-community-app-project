import os
import time
from dotenv import load_dotenv
from supabase import create_client, Client

# Load environment variables
load_dotenv('.env.local')

# Configuration
PROD_URL = "https://csatxwfaliwlwzrkvyju.supabase.co"
PROD_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
DEV_URL = os.environ.get("NEXT_PUBLIC_SUPABASE_URL")
DEV_KEY = os.environ.get("DEV_SUPABASE_SERVICE_ROLE_KEY")

DEFAULT_PASSWORD = "dev_password_123"

if not PROD_KEY or not DEV_KEY:
    print("Error: Missing Service Role Keys in .env.local")
    exit(1)

def get_clients():
    prod = create_client(PROD_URL, PROD_KEY)
    dev = create_client(DEV_URL, DEV_KEY)
    return prod, dev

def sync_table(prod, dev, table_name, constraint=None, batch_size=1000):
    print(f"Syncing table: {table_name}...")
    try:
        # Fetch data
        response = prod.table(table_name).select("*").execute()
        data = response.data
        
        if not data:
            print(f"  No data in {table_name}.")
            return

        print(f"  Found {len(data)} rows.")
        
        # Insert/Upsert
        # We handle batches to avoid payload limits
        for i in range(0, len(data), batch_size):
            batch = data[i:i+batch_size]
            try:
                # Upsert is safer
                dev.table(table_name).upsert(batch).execute()
                print(f"  Synced batch {i}-{i+len(batch)}")
            except Exception as e:
                print(f"  Error syncing batch in {table_name}: {e}")
                # Try row by row if batch fails?
                for row in batch:
                    try:
                        dev.table(table_name).upsert(row).execute()
                    except Exception as inner_e:
                        print(f"    Failed row {row.get('id')}: {inner_e}")

    except Exception as e:
        print(f"Failed to sync table {table_name}: {e}")

def sync_auth_users(prod, dev):
    print("Syncing Auth Users...")
    try:
        # List users from Prod (pagination needed if > 50)
        # For now, simplistic approach
        users = prod.auth.admin.list_users() 
        # Note: supbase-py list_users might returns a UserResponse object
        
        for user in users:
            uid = user.id
            email = user.email
            meta = user.user_metadata
            
            # Check if exists in Dev
            try:
                dev.auth.admin.get_user_by_id(uid)
                # Exists, maybe update? Skipping for now.
                # print(f"  User {email} exists.")
            except:
                # Doesn't exist, create
                try:
                    dev.auth.admin.create_user({
                        "uid": uid,
                        "email": email,
                        "password": DEFAULT_PASSWORD,
                        "email_confirm": True,
                        "user_metadata": meta
                    })
                    print(f"  Created user {email} ({uid})")
                except Exception as create_e:
                    print(f"  Failed to create user {email}: {create_e}")
                    
    except Exception as e:
        print(f"Error syncing auth users: {e}")

def main():
    print("Starting Data Sync...")
    prod, dev = get_clients()

    # 1. Tenants (Root dependency)
    sync_table(prod, dev, "tenants")
    
    # 2. Neighborhoods
    sync_table(prod, dev, "neighborhoods")

    # 3. Lots
    sync_table(prod, dev, "lots")
    
    # 4. Auth Users (Critical for public.users FK)
    sync_auth_users(prod, dev)

    # 5. Family Units (First pass - ignoring owner/contact if circular, or just upserting)
    # If public.users FKs to family_units, we need family_units first.
    # But family_units FKs to users (primary_contact_id).
    # Strategy: Insert family_units, but maybe set primary_contact_id to NULL if it fails?
    # Or rely on deferred? No.
    # We will try to sync family_units. If primary_contact_id violates partial FK (because user not yet in public.users), 
    # we might need to NULL it strictly.
    # Actually, let's try syncing `family_units` but manually stripping `primary_contact_id`?
    # Or:
    # 1. Sync Users (with internal fks null?)
    # 2. Sync Family Units
    # 3. Update Users
    # 4. Update Family Units
    
    # Let's try simple order first. If family_units depends on public.users for a non-nullable column, we are stuck.
    # Checked schema: family_units.primary_contact_id is references public.users(id).
    # public.users.family_unit_id references public.family_units(id).
    # Both sets are nullable/updates?
    # users.family_unit_id is nullable (ON DELETE SET NULL).
    # family_units.primary_contact_id is nullable (ON DELETE SET NULL).
    
    # So:
    # 1. Insert Family Units (set primary_contact_id = NULL temporarily/via code? or just hope they exist?)
    #    User isn't in public.users yet. So primary_contact_id WILL fail if not null.
    #    Let's handle this carefully.
    
    print("Syncing Family Units...")
    try:
        fu_resp = prod.table("family_units").select("*").execute()
        fus = fu_resp.data
        if fus:
            # First pass: Insert without primary_contact_id
            fus_clean = []
            for fu in fus:
                fu_copy = fu.copy()
                fu_copy['primary_contact_id'] = None # Remove ref to avoid error
                fus_clean.append(fu_copy)
            
            dev.table("family_units").upsert(fus_clean).execute()
            print("  Synced Family Units (First Pass - No Contacts)")
    except Exception as e:
        print(f"  Error in FU clean pass: {e}")

    # 6. Public Users
    sync_table(prod, dev, "users")
    
    # 7. Update Family Units (Restore primary_contact_id)
    print("Updating Family Units Contacts...")
    try:
        # Re-fetch or reuse
        fu_resp = prod.table("family_units").select("*").execute()
        fus = fu_resp.data
        if fus:
            # Only update those with contacts
            for fu in fus:
                if fu.get('primary_contact_id'):
                    dev.table("family_units").update({'primary_contact_id': fu['primary_contact_id']}).eq('id', fu['id']).execute()
            print("  Updated Family Units Contacts.")
    except Exception as e:
        print(f"  Error updating FU contacts: {e}")

    print("Data Sync Complete.")

    # 8. Core Resources (Locations must be before Events)
    sync_table(prod, dev, "locations")
    
    # 9. Content / Features
    sync_table(prod, dev, "announcements")
    sync_table(prod, dev, "announcement_reads")
    
    sync_table(prod, dev, "event_categories")
    sync_table(prod, dev, "events")
    sync_table(prod, dev, "event_rsvps")
    sync_table(prod, dev, "event_invites")
    
    sync_table(prod, dev, "check_ins")
    sync_table(prod, dev, "check_in_rsvps")
    
    sync_table(prod, dev, "exchange_listings") # "Posts"
    sync_table(prod, dev, "exchange_transactions")
    
    sync_table(prod, dev, "resident_requests")
    sync_table(prod, dev, "notifications")
    
    # 10. User Meta
    sync_table(prod, dev, "user_privacy_settings")
    sync_table(prod, dev, "pets")
    
    print("Full Context Sync Complete.")

if __name__ == "__main__":
    main()
