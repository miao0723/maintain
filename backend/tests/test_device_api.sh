#!/bin/bash

BASE_URL="http://localhost:8000/api"
TOKEN="YOUR_ADMIN_TOKEN"  # Replace with actual token from login

echo "=== Testing Device Management API ==="

# 1. List categories
echo -e "\n1. Get categories:"
curl -s -X GET "$BASE_URL/devices/categories" \
  -H "Authorization: Bearer $TOKEN" | jq '.'

# 2. Create category
echo -e "\n2. Create category:"
curl -s -X POST "$BASE_URL/devices/categories" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"泵类","icon":"pump"}' | jq '.'

# 3. Create device
echo -e "\n3. Create device:"
curl -s -X POST "$BASE_URL/devices" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "device_code":"DEV001",
    "device_name":"离心泵",
    "model":"IS50-32-125",
    "category_id":1,
    "department_id":1,
    "location":"车间A区",
    "purchase_date":"2024-01-15",
    "warranty_date":"2026-01-15",
    "status":1
  }' | jq '.'

# 4. List devices
echo -e "\n4. List devices:"
curl -s -X GET "$BASE_URL/devices?page=1&limit=10" \
  -H "Authorization: Bearer $TOKEN" | jq '.'

# 5. Get device detail
echo -e "\n5. Get device detail:"
curl -s -X GET "$BASE_URL/devices/1" \
  -H "Authorization: Bearer $TOKEN" | jq '.'

# 6. Update device
echo -e "\n6. Update device:"
curl -s -X PUT "$BASE_URL/devices/1" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"location":"车间B区"}' | jq '.'

# 7. Get device history
echo -e "\n7. Get device history:"
curl -s -X GET "$BASE_URL/devices/1/history" \
  -H "Authorization: Bearer $TOKEN" | jq '.'

# 8. Test validation - duplicate device_code
echo -e "\n8. Test validation (duplicate code):"
curl -s -X POST "$BASE_URL/devices" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "device_code":"DEV001",
    "device_name":"Duplicate Device",
    "category_id":1,
    "department_id":1
  }' | jq '.'

# 9. Test validation - warranty before purchase
echo -e "\n9. Test validation (warranty date):"
curl -s -X POST "$BASE_URL/devices" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "device_code":"DEV002",
    "device_name":"Test Device",
    "category_id":1,
    "department_id":1,
    "purchase_date":"2026-01-01",
    "warranty_date":"2025-01-01"
  }' | jq '.'

echo -e "\n=== Tests Complete ==="
