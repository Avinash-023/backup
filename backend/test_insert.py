import os
from supabase import create_client
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(__file__), '..', '.env'))
supabase = create_client(os.environ.get("VITE_SUPABASE_URL"), os.environ.get("VITE_SUPABASE_PUBLISHABLE_KEY"))

try:
    res = supabase.table('students').insert({
        "roll_no": "MAGIC_TEST_99",
        "name": "Magic Test",
        "email": "magic@example.com",
        "department_id": "8969525a-4088-4539-8c30-dc6d06b0b5c1"
    }).execute()
    print("Insert Data:", res.data)
    
    # Clean up
    if res.data:
        supabase.table('students').delete().eq("id", res.data[0]["id"]).execute()
except Exception as e:
    print("Error:", e)
