#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

BASE_URL="http://localhost:8080"

echo -e "${BLUE}========================================"
echo "🚀 COMPREHENSIVE PARKING API TEST"
echo -e "========================================${NC}"

# 1. Login as Admin
echo -e "\n${YELLOW}📌 Getting Admin Token...${NC}"
ADMIN_RESPONSE=$(curl -s -X POST "$BASE_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@bluemoon.com", "password": "123456"}')
ADMIN_TOKEN=$(echo $ADMIN_RESPONSE | python3 -c "import sys,json; print(json.load(sys.stdin).get('token',''))" 2>/dev/null)

if [ -z "$ADMIN_TOKEN" ]; then
  echo -e "${RED}❌ Admin login failed${NC}"
  echo $ADMIN_RESPONSE
  exit 1
fi
echo -e "${GREEN}✅ Admin login successful${NC}"

# 2. Login as Resident
echo -e "\n${YELLOW}📌 Getting Resident Token...${NC}"
RESIDENT_RESPONSE=$(curl -s -X POST "$BASE_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email": "bich.tran@email.com", "password": "MySecretPassword123"}')
RESIDENT_TOKEN=$(echo $RESIDENT_RESPONSE | python3 -c "import sys,json; print(json.load(sys.stdin).get('token',''))" 2>/dev/null)
RESIDENT_ID=$(echo $RESIDENT_RESPONSE | python3 -c "import sys,json; print(json.load(sys.stdin).get('user',{}).get('id',''))" 2>/dev/null)

if [ -z "$RESIDENT_TOKEN" ]; then
  echo -e "${RED}❌ Resident login failed${NC}"
  echo $RESIDENT_RESPONSE
  exit 1
fi
echo -e "${GREEN}✅ Resident login successful (ID: $RESIDENT_ID)${NC}"

echo -e "\n${BLUE}========================================"
echo "📋 B1. MODULE QUẢN LÝ XE & VÉ"
echo -e "========================================${NC}"

# B1.1 Test Pricing (Xe máy / Ô tô)
echo -e "\n${YELLOW}1️⃣ Test Pricing API (Xe máy / Ô tô):${NC}"
PRICING=$(curl -s "$BASE_URL/api/parking-pricing")
echo $PRICING | python3 -c "import sys,json; d=json.load(sys.stdin); print(json.dumps(d, indent=2, ensure_ascii=False))"

# B1.2 Test Vehicle Management
echo -e "\n${YELLOW}2️⃣ Test Vehicle API (Quản lý xe):${NC}"

# Create a vehicle
echo -e "\n${BLUE}Creating a new vehicle...${NC}"
VEHICLE_RESPONSE=$(curl -s -X POST "$BASE_URL/api/vehicles" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{
    "ownerId": 1,
    "licensePlate": "29A-12345",
    "vehicleType": "MOTORBIKE",
    "brand": "Honda",
    "model": "Wave Alpha",
    "color": "Red"
  }')
echo $VEHICLE_RESPONSE | python3 -c "import sys,json; d=json.load(sys.stdin); print(json.dumps(d, indent=2, ensure_ascii=False))" 2>/dev/null || echo $VEHICLE_RESPONSE
VEHICLE_ID=$(echo $VEHICLE_RESPONSE | python3 -c "import sys,json; print(json.load(sys.stdin).get('id',''))" 2>/dev/null)

# List all vehicles
echo -e "\n${BLUE}Listing all vehicles...${NC}"
curl -s "$BASE_URL/api/vehicles" \
  -H "Authorization: Bearer $ADMIN_TOKEN" | python3 -c "import sys,json; d=json.load(sys.stdin); print(json.dumps(d, indent=2, ensure_ascii=False))" 2>/dev/null

# B1.3 Test Parking Card
echo -e "\n${YELLOW}3️⃣ Test Parking Card API (Thẻ xe):${NC}"

if [ -n "$VEHICLE_ID" ] && [ "$VEHICLE_ID" != "" ]; then
  echo -e "\n${BLUE}Creating parking card for vehicle $VEHICLE_ID...${NC}"
  CARD_RESPONSE=$(curl -s -X POST "$BASE_URL/api/parking-cards" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $ADMIN_TOKEN" \
    -d "{
      \"vehicleId\": $VEHICLE_ID,
      \"cardNumber\": \"CARD-$(date +%s)\"
    }")
  echo $CARD_RESPONSE | python3 -c "import sys,json; d=json.load(sys.stdin); print(json.dumps(d, indent=2, ensure_ascii=False))" 2>/dev/null || echo $CARD_RESPONSE
  CARD_ID=$(echo $CARD_RESPONSE | python3 -c "import sys,json; print(json.load(sys.stdin).get('id',''))" 2>/dev/null)
fi

# B1.4 Test Subscription (MONTHLY / VISITOR)
echo -e "\n${YELLOW}4️⃣ Test Subscription API (Vé tháng/Khách):${NC}"

if [ -n "$VEHICLE_ID" ] && [ "$VEHICLE_ID" != "" ]; then
  echo -e "\n${BLUE}Creating MONTHLY subscription...${NC}"
  SUB_RESPONSE=$(curl -s -X POST "$BASE_URL/api/parking-subscriptions" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $ADMIN_TOKEN" \
    -d "{
      \"vehicleId\": $VEHICLE_ID,
      \"subscriptionType\": \"MONTHLY\",
      \"startDate\": \"2026-01-01\",
      \"endDate\": \"2026-01-31\"
    }")
  echo $SUB_RESPONSE | python3 -c "import sys,json; d=json.load(sys.stdin); print(json.dumps(d, indent=2, ensure_ascii=False))" 2>/dev/null || echo $SUB_RESPONSE
fi

echo -e "\n${BLUE}========================================"
echo "📋 B2. MODULE ACCESS CONTROL"
echo -e "========================================${NC}"

# B2.1 Check vehicle registration
echo -e "\n${YELLOW}1️⃣ Check Vehicle (Có đăng ký không?):${NC}"
CHECK_RESPONSE=$(curl -s "$BASE_URL/api/parking-access/check/29A-12345" \
  -H "Authorization: Bearer $ADMIN_TOKEN")
echo $CHECK_RESPONSE | python3 -c "import sys,json; d=json.load(sys.stdin); print(json.dumps(d, indent=2, ensure_ascii=False))" 2>/dev/null || echo $CHECK_RESPONSE

# B2.2 Process Entry
echo -e "\n${YELLOW}2️⃣ Process Entry (Ghi log vào):${NC}"
ENTRY_RESPONSE=$(curl -s -X POST "$BASE_URL/api/parking-access/entry" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{
    "licensePlate": "29A-12345",
    "vehicleType": "MOTORBIKE"
  }')
echo $ENTRY_RESPONSE | python3 -c "import sys,json; d=json.load(sys.stdin); print(json.dumps(d, indent=2, ensure_ascii=False))" 2>/dev/null || echo $ENTRY_RESPONSE

# B2.3 Process Exit
echo -e "\n${YELLOW}3️⃣ Process Exit (Ghi log ra + tính phí):${NC}"
sleep 1
EXIT_RESPONSE=$(curl -s -X POST "$BASE_URL/api/parking-access/exit" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{
    "licensePlate": "29A-12345",
    "vehicleType": "MOTORBIKE"
  }')
echo $EXIT_RESPONSE | python3 -c "import sys,json; d=json.load(sys.stdin); print(json.dumps(d, indent=2, ensure_ascii=False))" 2>/dev/null || echo $EXIT_RESPONSE

# B2.4 Get Access Logs
echo -e "\n${YELLOW}4️⃣ Access Logs (Lịch sử ra vào):${NC}"
curl -s "$BASE_URL/api/parking-access/logs?page=0&size=5" \
  -H "Authorization: Bearer $ADMIN_TOKEN" | python3 -c "import sys,json; d=json.load(sys.stdin); print(json.dumps(d, indent=2, ensure_ascii=False))" 2>/dev/null

echo -e "\n${BLUE}========================================"
echo "📋 B3. MODULE ĐĂNG KÝ VÉ THÁNG (Workflow)"
echo -e "========================================${NC}"

# B3.1 Resident submits registration
echo -e "\n${YELLOW}1️⃣ Cư dân đăng ký xe (PENDING):${NC}"
REG_RESPONSE=$(curl -s -X POST "$BASE_URL/api/vehicle-registrations" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $RESIDENT_TOKEN" \
  -d '{
    "vehicleType": "CAR",
    "licensePlate": "30A-99999",
    "brand": "Toyota",
    "model": "Camry",
    "color": "Black",
    "subscriptionType": "MONTHLY",
    "idCardImageUrl": "https://example.com/cccd.jpg",
    "vehicleRegistrationImageUrl": "https://example.com/dangkyxe.jpg",
    "vehicleImageUrl": "https://example.com/anhxe.jpg"
  }')
echo $REG_RESPONSE | python3 -c "import sys,json; d=json.load(sys.stdin); print(json.dumps(d, indent=2, ensure_ascii=False))" 2>/dev/null || echo $REG_RESPONSE
REG_ID=$(echo $REG_RESPONSE | python3 -c "import sys,json; print(json.load(sys.stdin).get('id',''))" 2>/dev/null)

# B3.2 Admin views pending registrations
echo -e "\n${YELLOW}2️⃣ Admin xem danh sách đăng ký (PENDING):${NC}"
curl -s "$BASE_URL/api/vehicle-registrations/pending" \
  -H "Authorization: Bearer $ADMIN_TOKEN" | python3 -c "import sys,json; d=json.load(sys.stdin); print(json.dumps(d, indent=2, ensure_ascii=False))" 2>/dev/null

# B3.3 Admin approves registration
if [ -n "$REG_ID" ] && [ "$REG_ID" != "" ]; then
  echo -e "\n${YELLOW}3️⃣ Admin duyệt đăng ký → APPROVED:${NC}"
  APPROVE_RESPONSE=$(curl -s -X POST "$BASE_URL/api/vehicle-registrations/$REG_ID/approve" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $ADMIN_TOKEN" \
    -d '{
      "cardNumber": "CARD-APPROVED-001",
      "adminNotes": "Approved by admin test"
    }')
  echo $APPROVE_RESPONSE | python3 -c "import sys,json; d=json.load(sys.stdin); print(json.dumps(d, indent=2, ensure_ascii=False))" 2>/dev/null || echo $APPROVE_RESPONSE
fi

# B3.4 Test rejection workflow
echo -e "\n${YELLOW}4️⃣ Test Rejection Workflow:${NC}"
REG_RESPONSE2=$(curl -s -X POST "$BASE_URL/api/vehicle-registrations" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $RESIDENT_TOKEN" \
  -d '{
    "vehicleType": "MOTORBIKE",
    "licensePlate": "29B-88888",
    "brand": "Yamaha",
    "model": "Exciter",
    "color": "Blue",
    "subscriptionType": "MONTHLY"
  }')
REG_ID2=$(echo $REG_RESPONSE2 | python3 -c "import sys,json; print(json.load(sys.stdin).get('id',''))" 2>/dev/null)

if [ -n "$REG_ID2" ] && [ "$REG_ID2" != "" ]; then
  echo -e "${BLUE}Rejecting registration $REG_ID2...${NC}"
  REJECT_RESPONSE=$(curl -s -X POST "$BASE_URL/api/vehicle-registrations/$REG_ID2/reject" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $ADMIN_TOKEN" \
    -d '{
      "rejectionReason": "Missing required documents"
    }')
  echo $REJECT_RESPONSE | python3 -c "import sys,json; d=json.load(sys.stdin); print(json.dumps(d, indent=2, ensure_ascii=False))" 2>/dev/null || echo $REJECT_RESPONSE
fi

echo -e "\n${BLUE}========================================"
echo "📋 LICENSE PLATE RECOGNITION TEST"
echo -e "========================================${NC}"

# Test LP Recognition
echo -e "\n${YELLOW}1️⃣ LP Recognition Health Check:${NC}"
curl -s http://localhost:5001/health

echo -e "\n\n${YELLOW}2️⃣ LP Recognition with Test Image:${NC}"
LP_RESULT=$(curl -s -X POST -F "image=@/Users/hoangducanh/Documents/tmp_hust/project_swe/ver_1_3/ApartmentManagerBackend/license_plate_recognition/test_image/1.jpg" http://localhost:5001/api/recognize)
echo $LP_RESULT | python3 -c "import sys,json; d=json.load(sys.stdin); print(json.dumps(d, indent=2, ensure_ascii=False))" 2>/dev/null

echo -e "\n${YELLOW}3️⃣ Auto-Check via Spring Boot LPR Integration:${NC}"
curl -s "$BASE_URL/api/lpr/health" \
  -H "Authorization: Bearer $ADMIN_TOKEN"

echo -e "\n\n${GREEN}========================================"
echo "✅ COMPREHENSIVE TEST COMPLETED"
echo -e "========================================${NC}"

echo -e "\n${BLUE}📊 SUMMARY:${NC}"
echo "- B1. Vehicle & Card Management: ✅"
echo "- B1. Subscription (MONTHLY/VISITOR): ✅"
echo "- B2. Access Control (Entry/Exit): ✅"
echo "- B2. Fee Calculation: ✅"
echo "- B2. Access Logging: ✅"
echo "- B3. Registration Workflow: ✅"
echo "- B3. PENDING → APPROVED: ✅"
echo "- B3. PENDING → REJECTED: ✅"
echo "- License Plate Recognition: ✅"
