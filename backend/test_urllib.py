import json
import urllib.request
import urllib.error

BASE_URL = "http://127.0.0.1:5000/api/v1"

print("=== LOGIN ===")
login_data = json.dumps({"username": "admin", "password": "Admin@123"}).encode('utf-8')
req = urllib.request.Request(f"{BASE_URL}/auth/login", data=login_data, 
    headers={"Content-Type": "application/json"})
try:
    response = urllib.request.urlopen(req)
    token = json.loads(response.read().decode('utf-8'))['access_token']
    print(f"✅ Token: {token[:30]}...")
    
    print("\n=== PROFILE ===")
    req = urllib.request.Request(f"{BASE_URL}/auth/profile", 
        headers={"Authorization": f"Bearer {token}"})
    response = urllib.request.urlopen(req)
    profile = json.loads(response.read().decode('utf-8'))
    print(json.dumps(profile, indent=2))
    
    print("\n=== STATS ===")
    req = urllib.request.Request(f"{BASE_URL}/admin/stats", 
        headers={"Authorization": f"Bearer {token}"})
    response = urllib.request.urlopen(req)
    stats = json.loads(response.read().decode('utf-8'))
    print(json.dumps(stats, indent=2))
except Exception as e:
    print(f"❌ Error: {e}")
    if hasattr(e, 'read'):
        print(f"Response: {e.read().decode('utf-8')}")

print("\n=== JOBS ===")
req = urllib.request.Request(f"{BASE_URL}/jobs")
response = urllib.request.urlopen(req)
jobs = json.loads(response.read().decode('utf-8'))['jobs']
for job in jobs:
    print(f"- {job['title']} at {job['company']}")
