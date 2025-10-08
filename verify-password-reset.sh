#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "=========================================="
echo "Password Reset Route Verification"
echo "=========================================="
echo ""

# Test local server
echo -e "${YELLOW}Testing local server (http://localhost:3500)...${NC}"
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST http://localhost:3500/api/password-reset/request \
  -H "Content-Type: application/json" \
  -d '{"contactInfo":"test@example.com"}')

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | head -n-1)

if [ "$HTTP_CODE" -eq 201 ] || [ "$HTTP_CODE" -eq 200 ]; then
    echo -e "${GREEN}✅ Local server: SUCCESS (HTTP $HTTP_CODE)${NC}"
    echo "Response: $BODY"
else
    echo -e "${RED}❌ Local server: FAILED (HTTP $HTTP_CODE)${NC}"
    echo "Response: $BODY"
    
    if [ "$HTTP_CODE" -eq 405 ]; then
        echo -e "${YELLOW}⚠️  Route not found. Please restart your server.${NC}"
    fi
fi

echo ""
echo "=========================================="

# Test production server
echo -e "${YELLOW}Testing production server (https://www.mafqoudat.com)...${NC}"
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST https://www.mafqoudat.com/api/password-reset/request \
  -H "Content-Type: application/json" \
  -d '{"contactInfo":"test@example.com"}')

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | head -n-1)

if [ "$HTTP_CODE" -eq 201 ] || [ "$HTTP_CODE" -eq 200 ]; then
    echo -e "${GREEN}✅ Production server: SUCCESS (HTTP $HTTP_CODE)${NC}"
    echo "Response: $BODY"
else
    echo -e "${RED}❌ Production server: FAILED (HTTP $HTTP_CODE)${NC}"
    echo "Response: $BODY"
    
    if [ "$HTTP_CODE" -eq 405 ]; then
        echo -e "${YELLOW}⚠️  Route not found. Please deploy your changes to production.${NC}"
    fi
fi

echo ""
echo "=========================================="
echo "Verification complete!"
echo "=========================================="

