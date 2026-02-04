import os
from dotenv import load_dotenv
from supabase import create_client

load_dotenv('.env.local')
DEV_URL = os.environ.get("NEXT_PUBLIC_SUPABASE_URL")
DEV_KEY = os.environ.get("DEV_SUPABASE_SERVICE_ROLE_KEY")

supabase = create_client(DEV_URL, DEV_KEY)
CORRECT_UID = "a3b26d3a-955d-4c63-87f8-51bc98c3f970"
WRONG_UID = "5e676d05-882a-4675-91bf-7206e5ce4376" # The one just created
EMAIL = "michaelpjedamski+testresident@gmail.com"
PASSWORD = "dev_password_123"

print(f"--- Re-Fixing Auth Mismatch ---")

# 1. Delete Wrong User
try:
    print(f"Deleting mismatched user {WRONG_UID}...")
    supabase.auth.admin.delete_user(WRONG_UID)
    print("  Deleted.")
except Exception as e:
    print(f"  Error deleting wrong user: {e}")

print(f"Creating user {CORRECT_UID}...")
try:
    # Use 'id' not 'uid'
    user = supabase.auth.admin.create_user({
        "id": CORRECT_UID,
        "email": EMAIL,
        "password": PASSWORD,
        "email_confirm": True
    })
    print("Success!")
except Exception as e:
    print(f"Failed: {e}")
