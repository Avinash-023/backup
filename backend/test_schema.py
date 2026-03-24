import os
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(__file__), '..', '.env'))

supabase_url = os.environ.get("VITE_SUPABASE_URL")
supabase_key = os.environ.get("VITE_SUPABASE_PUBLISHABLE_KEY")

supabase: Client = create_client(supabase_url, supabase_key)

def check_schema():
    try:
        # Just grab ONE row and print keys, this tells us columns.
        res = supabase.table('students').select('*').limit(1).execute()
        if res.data:
            print("Columns in students table:", list(res.data[0].keys()))
        else:
            print("Table empty, trying to insert a dummy to see if it allows email...")
            try:
                supabase.table('students').insert({
                    "roll_no": "TEST_DB_ROLL",
                    "name": "Dummy",
                    "email": "dummy@dummy.com",
                    "department_id": None
                }).execute()
                print("Insert with email succeeded! The column exists.")
                # cleanup
                supabase.table('students').delete().eq("roll_no", "TEST_DB_ROLL").execute()
            except Exception as e:
                print(f"Insert with email failed: {e}")
                
    except Exception as e:
        print(f"Error checking schema: {e}")

if __name__ == '__main__':
    check_schema()
