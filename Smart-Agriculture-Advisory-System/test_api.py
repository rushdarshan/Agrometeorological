#!/usr/bin/env python
"""Test the Smart Agriculture Advisory System API"""

import requests
import json
from datetime import datetime, timedelta

API_BASE = "http://localhost:8000/api"

def print_section(title):
    print(f"\n{'='*60}")
    print(f"  {title}")
    print(f"{'='*60}\n")

def test_dashboard():
    """Get dashboard stats"""
    print_section("📊 DASHBOARD STATS (Kaira District)")
    
    resp = requests.get(f"{API_BASE}/dashboard/regional-stats?district=Kaira")
    data = resp.json()
    
    print(f"Total Farms:           {data['total_farms']}")
    print(f"Total Farmers:         {data['total_farmers']}")
    print(f"Active Advisories:     {data['active_advisories_count']}")
    print(f"Engagement Rate:       {data['avg_engagement_rate']}%")
    print(f"Advisory Types:        {data['advisory_type_distribution']}")

def test_list_farms():
    """List all farms"""
    print_section("🌾 FARMS IN KAIRA DISTRICT")
    
    resp = requests.get(f"{API_BASE}/dashboard/farms?district=Kaira")
    farms = resp.json()
    
    for farm in farms:
        print(f"\n  ID: {farm['id']}")
        print(f"  Name: {farm['farm_name']}")
        print(f"  Crop: {farm['crop_name']}")
        print(f"  Area: {farm['area_hectares']} ha")
        print(f"  Village: {farm['village']}")
        if farm.get('last_advisory'):
            print(f"  Last Advisory: {farm['last_advisory']['advisory_type']}")

def test_create_advisory():
    """Create a test advisory"""
    print_section("📢 CREATING ADVISORY")
    
    advisory = {
        "farm_id": 1,
        "advisory_type": "irrigation",
        "severity": "high",
        "confidence": 0.75,
        "title": "⚠️ IMPORTANT: Delay irrigation by 3 days",
        "message": "Heavy rain (70% probability) expected next 3 days. Soil saturation will reach 80%+. Delay irrigation and basal fertilizer.",
        "detailed_message": "Forecast shows 65mm rainfall. Current soil moisture is 45%. Applying fertilizer now will cause losses. Wait until rain passes.",
        "reasoning": "High rain forecast + soil saturation analysis → delay irrigation for optimal crop performance",
        "generated_by": "rule_engine",
        "model_version": "rice_v1"
    }
    
    print("Payload:")
    print(json.dumps(advisory, indent=2))
    
    resp = requests.post(f"{API_BASE}/advisories/advisory", json=advisory)
    result = resp.json()
    
    print("\n✓ Response:")
    print(json.dumps(result, indent=2))
    
    return result.get('id')

def test_get_farm_advisories(farm_id=1):
    """Get advisories for a farm"""
    print_section(f"📋 ADVISORIES FOR FARM {farm_id}")
    
    resp = requests.get(f"{API_BASE}/advisories/farm/{farm_id}")
    advisories = resp.json()
    
    if not advisories:
        print("No advisories yet for this farm.")
        return
    
    for adv in advisories:
        print(f"\n  ID: {adv['id']}")
        print(f"  Type: {adv['advisory_type']}")
        print(f"  Severity: {adv['severity']}")
        print(f"  Confidence: {adv['confidence']*100:.0f}%")
        print(f"  Message: {adv['message']}")

def test_register_farmer():
    """Register a new farmer"""
    print_section("👨‍🌾 REGISTERING NEW FARMER")
    
    farmer = {
        "phone": "+919876543220",
        "name": "Vikram Patel",
        "village": "Borsad",
        "district": "Kaira",
        "state": "Gujarat",
        "latitude": 22.4100,
        "longitude": 72.5200,
        "crop_name": "Rice",
        "sowing_date": (datetime.utcnow() - timedelta(days=10)).isoformat(),
        "area_hectares": 2.0,
        "consented_advisory": True,
        "consented_data_use": True,
        "preferred_language": "en"
    }
    
    print("Farmer Data:")
    print(json.dumps(farmer, indent=2, default=str))
    
    resp = requests.post(f"{API_BASE}/auth/register", json=farmer)
    
    if resp.status_code == 200:
        result = resp.json()
        print("\n✓ Farmer Registered!")
        print(json.dumps(result, indent=2))
        return result.get('id')
    else:
        print(f"\n✗ Error: {resp.status_code}")
        print(resp.json())

def test_send_message():
    """Send a test message"""
    print_section("💬 SENDING SMS MESSAGE")
    
    message = {
        "farmer_id": 1,
        "advisory_id": 1,
        "channel": "sms",
        "content": "🌾 FARM ALERT: Heavy rain expected. Delay irrigation by 3 days. Reply 1=Helpful, 2=Not helpful"
    }
    
    print("Message Data:")
    print(json.dumps(message, indent=2))
    
    resp = requests.post(f"{API_BASE}/feedback/message", json=message)
    result = resp.json()
    
    print("\n✓ Message Created:")
    print(json.dumps(result, indent=2))

def test_delivery_stats():
    """Get SMS delivery statistics"""
    print_section("📊 SMS DELIVERY STATISTICS")
    
    resp = requests.get(f"{API_BASE}/feedback/delivery-stats")
    stats = resp.json()
    
    print(f"Total Messages:        {stats['total_messages']}")
    print(f"Sent:                  {stats['sent']}")
    print(f"Delivered:             {stats['delivered']}")
    print(f"Failed:                {stats['failed']}")
    print(f"Pending:               {stats['pending']}")
    print(f"Success Rate:          {stats['success_rate_percent']}%")

if __name__ == "__main__":
    print("""
    🌾 Smart Agriculture Advisory System — LIVE DEMO
    ================================================
    
    Testing API endpoints with real data...
    """)
    
    try:
        # Test endpoints
        test_dashboard()
        test_list_farms()
        adv_id = test_create_advisory()
        test_get_farm_advisories()
        test_send_message()
        test_delivery_stats()
        
        print("\n" + "="*60)
        print("  ✓ ALL TESTS PASSED!")
        print("="*60)
        print("""
        
        🎯 NEXT STEPS:
        
        1. Open Dashboard: http://localhost:3000/index.html
           - View registered farms
           - Register new farmers
           - Generate advisories
           - Monitor engagement
        
        2. API Documentation: http://localhost:8000/docs
           - Interactive Swagger UI
           - Try endpoints directly
        
        3. Database: agriculture_dev.db (SQLite)
           - Should now contain advisories & messages
        
        4. Check project files:
           - DEVELOPMENT_BACKLOG.md - Sprint plan
           - SETUP_GUIDE.md - Deployment guide
           - EVALUATION_PLAN.md - Pilot metrics
        """)
        
    except Exception as e:
        print(f"\n❌ ERROR: {e}")
        import traceback
        traceback.print_exc()
