import os
import json
from dotenv import load_dotenv
from supabase import create_client

load_dotenv('.env.local')

DEV_URL = os.environ.get("NEXT_PUBLIC_SUPABASE_URL")
DEV_ANON_KEY = os.environ.get("NEXT_PUBLIC_SUPABASE_ANON_KEY")

if not DEV_URL or not DEV_ANON_KEY:
    print("Missing PUBLIC Keys")
    exit(1)

# Use Anon Key to simulate Client
supabase = create_client(DEV_URL, DEV_ANON_KEY)

EMAIL = "michaelpjedamski+testresident@gmail.com"
PASSWORD = "dev_password_123"
TENANT_SLUG = "ecovilla-san-mateo" # Assuming this is the text in screenshot

print(f"--- Debugging Login Flow (Client Simulation) ---")

# 1. Login
print(f"\n[1] Attempting Login for {EMAIL}...")
try:
    auth = supabase.auth.sign_in_with_password({"email": EMAIL, "password": PASSWORD})
    user = auth.user
    print(f"  Login Success! UID: {user.id}")
    
    # Client is now authenticated
    # supabase.postgrest.auth(auth.session.access_token) # Python SDK handles this automatically if using same client instance? 
    # Actually supabase-py client maintains session? Yes.
except Exception as e:
    print(f"  Login Failed: {e}")
    exit(1)

# 2. Fetch Tenant by Slug (Public access?)
print(f"\n[2] Fetching Tenant '{TENANT_SLUG}'...")
t_resp = supabase.table("tenants").select("id, name").eq("slug", TENANT_SLUG).execute()
if not t_resp.data:
    print("  Tenant query returned NO data. (Check RLS on public.tenants?)")
    exit(1)

tenant = t_resp.data[0]
print(f"  Tenant Found: ID={tenant['id']}, Name={tenant['name']}")

# 3. Simulate The User Query (The one failing in UI)
print(f"\n[3] Querying public.users for self (RLS Check)...")

# Ensure we have a session
session = auth.session
if not session:
    print("  NO SESSION! Auth failed to persist.")
    exit(1)

print(f"  Token: {session.access_token[:10]}...")

# Explicitly set auth for postgrest just in case (older versions issue?)
supabase.postgrest.auth(session.access_token)

try:
    # Remove maybe_single to avoid NoneType return issue if any
    u_resp = supabase.table("users").select("role, tenant_id").eq("id", user.id).execute()
    
    if u_resp:
        user_data = u_resp.data
        if user_data:
            print(f"  Query 1 (Role Check) Success: {user_data}")
        else:
            print(f"  Query 1 (Role Check) Returned EMPTY LIST. [{u_resp.data}]")
            print("  -> RLS IS BLOCKING READ.")
    else:
         print("  Query 1 execute() returned None!")

    # 4. Simulate Resident Query
    print(f"\n[4] Querying Resident Match...")
    r_resp = supabase.table("users").select("id, is_tenant_admin, tenant_id") \
        .eq("id", user.id) \
        .eq("role", "resident") \
        .eq("tenant_id", tenant['id']) \
        .execute()
    
    if r_resp and r_resp.data:
         print(f"  Query 2 (Resident Access) Success: Access Granted. {r_resp.data}")
    else:
         print(f"  Query 2 (Resident Access) Returned EMPTY/NULL.")
except Exception as e:
    print(f"  Query Failed with Exception: {e}")

