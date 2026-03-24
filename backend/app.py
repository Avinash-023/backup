import os
from flask import Flask, jsonify, request
from flask_cors import CORS
from dotenv import load_dotenv
from supabase import create_client, Client

# Load environment variables from the parent directory's .env file
load_dotenv(os.path.join(os.path.dirname(__file__), '..', '.env'))

from routes import api_bp

app = Flask(__name__)
CORS(app) # Enable CORS for all routes

app.register_blueprint(api_bp, url_prefix='/api')

# Initialize Supabase client
supabase_url = os.environ.get("VITE_SUPABASE_URL")
supabase_key = os.environ.get("VITE_SUPABASE_PUBLISHABLE_KEY")

if not supabase_url or not supabase_key:
    # Raise a runtime error or handle it securely - assuming provided via .env
    print("Warning: Supabase credentials not found in environment.")

try:
    supabase: Client = create_client(supabase_url, supabase_key)
except Exception as e:
    supabase: Client = None
    print(f"Error initializing Supabase client: {e}")

@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({"status": "healthy", "service": "exam-hall-planner-backend"})

if __name__ == '__main__':
    app.run(debug=True, port=5000)
