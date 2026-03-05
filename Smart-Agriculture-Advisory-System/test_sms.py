import requests
import json

API_BASE = "http://localhost:8000"

# Test message endpoint
print("Testing SMS message endpoint...\n")

message_data = {
    "farmer_id": 1,
    "advisory_id": 1,
    "channel": "sms",
    "content": "🌾 FARM ALERT: Heavy rain expected. Delay irrigation by 3 days."
}

print(f"POST /api/feedback/message")
print(f"Payload: {json.dumps(message_data, indent=2)}\n")

try:
    resp = requests.post(f"{API_BASE}/api/feedback/message", json=message_data)
    print(f"Status: {resp.status_code}")
    print(f"Response: {resp.text}\n")
    
    if resp.status_code == 200:
        data = resp.json()
        print(f"✓ Message created successfully!")
        print(f"  ID: {data.get('id')}")
        print(f"  Status: {data.get('status')}")
        print(f"  Provider Message ID: {data.get('provider_message_id')}")
    else:
        print(f"✗ Error: {resp.status_code}")
        print(f"  {resp.text}")
except Exception as e:
    print(f"✗ Exception: {e}")
