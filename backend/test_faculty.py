import os
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(__file__), '..', '.env'))

supabase_url = os.environ.get("VITE_SUPABASE_URL")
supabase_key = os.environ.get("VITE_SUPABASE_PUBLISHABLE_KEY")

supabase: Client = create_client(supabase_url, supabase_key)

def create_faculty():
    email = "faculty@example.com"
    print("Signing up dummy faculty...")
    try:
        supabase.auth.sign_up({
            "email": email,
            "password": "Faculty@2026"
        })
    except Exception as e:
        print(f"Auth issue: {e}")
        
    print("Checking if faculty exists in table...")
    res = supabase.table('faculty').select('*').eq('email', email).execute()
    if not res.data:
        print("Inserting into faculty table...")
        supabase.table('faculty').insert({
            "name": "Dr. Dummy Faculty",
            "email": email,
            "department_id": None
        }).execute()
        print("Done!")
    else:
        print("Faculty already exists.")

if __name__ == '__main__':
    create_faculty()
