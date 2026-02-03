import os
from dotenv import load_dotenv
from supabase import create_client

load_dotenv('.env.local')

DEV_URL = os.environ.get("NEXT_PUBLIC_SUPABASE_URL")
DEV_KEY = os.environ.get("DEV_SUPABASE_SERVICE_ROLE_KEY")

if not DEV_KEY:
    print("Missing DEV_SUPABASE_SERVICE_ROLE_KEY")
    exit(1)

supabase = create_client(DEV_URL, DEV_KEY)

EMAIL = "michaelpjedamski+testresident@gmail.com"

print(f"--- Debugging Access for {EMAIL} ---")

# 1. Fetch User from public.users (Service Role avoids RLS)
print("\n[1] Check public.users data (Service Role Check):")
try:
    response = supabase.table("users").select("*").eq("email", EMAIL).execute()
    data = response.data
    if data:
        user = data[0]
        print(f"  Found user: {user.get('id')}")
        print(f"  Role: {user.get('role')}")
        print(f"  Tenant ID: {user.get('tenant_id')}")
        
        # Check Tenant Info
        t_resp = supabase.table("tenants").select("slug, name").eq("id", user.get('tenant_id')).execute()
        if t_resp.data:
            print(f"  Tenant: {t_resp.data[0]}")
        else:
            print("  Tenant not found!")
    else:
        print("  User NOT found in public.users!")
except Exception as e:
    print(f"  Error: {e}")

# 2. Check Policies
print("\n[2] Check RLS Policies on 'public.users':")
# This requires SQL execution, which we can't do easily via client unless we use rpc or have a helper.
# But we can infer from the behavior.
# If [1] is correct, then RLS is likely the issue.

