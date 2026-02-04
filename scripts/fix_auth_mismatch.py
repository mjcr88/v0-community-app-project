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
CORRECT_UID = "a3b26d3a-955d-4c63-87f8-51bc98c3f970"
WRONG_UID = "82097da2-d8cb-4c7b-bcca-9cf5bf2406cb"
PASSWORD = "dev_password_123"

print(f"--- Fixing Auth Mismatch for {EMAIL} ---")

# 1. Delete Wrong User
try:
    print(f"Deleting mismatched user {WRONG_UID}...")
    supabase.auth.admin.delete_user(WRONG_UID)
    print("  Deleted.")
except Exception as e:
    print(f"  Error deleting wrong user (maybe already gone): {e}")

# 2. Check if Correct User exists
try:
    u = supabase.auth.admin.get_user_by_id(CORRECT_UID)
    if u and u.user:
        print(f"User {CORRECT_UID} already exists? {u.user.email}")
        # Update email if needed?
    else:
        print(f"User {CORRECT_UID} not found (as expected). Creating...")
        params = {
            "uid": CORRECT_UID,
            "email": EMAIL,
            "password": PASSWORD,
            "email_confirm": True
        }
        user = supabase.auth.admin.create_user(params)
        print(f"  Created user {CORRECT_UID} successfully.")
except Exception as e:
    print(f"  Error creating correct user: {e}")

# 3. Verify public.users still exists (in case of cascade?)
print("Verifying public.users integrity...")
res = supabase.table("users").select("id").eq("id", CORRECT_UID).execute()
if res.data:
    print(f"  public.users row {CORRECT_UID} EXISTS. Integrity Restored.")
else:
    print(f"  WARNING: public.users row {CORRECT_UID} VANISHED! (Did something cascade delete?)")
