import requests
import json

BASE_URL = "http://127.0.0.1:5000/api/v1"

print("=== LOGIN ===")
response = requests.post(f"{BASE_URL}/auth/login", 
    json={"username": "admin", "password": "Admin@123"})
token = response.json()['access_token']
print(f"✅ Token: {token[:30]}...")

print("\n=== PROFILE ===")
headers = {"Authorization": f"Bearer {token}"}
response = requests.get(f"{BASE_URL}/auth/profile", headers=headers)
print(json.dumps(response.json(), indent=2))

print("\n=== STATS ===")
response = requests.get(f"{BASE_URL}/admin/stats", headers=headers)
print(json.dumps(response.json(), indent=2))

print("\n=== JOBS ===")
response = requests.get(f"{BASE_URL}/jobs")
jobs = response.json()['jobs']
for job in jobs:
    print(f"- {job['title']} at {job['company']}")
