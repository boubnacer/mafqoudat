#!/bin/bash

# Deployment Verification Checklist for Password Reset Feature

echo "=================================================="
echo "Password Reset Feature - Deployment Verification"
echo "=================================================="
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "Step 1: Checking if new files exist locally..."
echo ""

# Check if new files exist locally
files=(
  "server/models/PasswordResetRequest.js"
  "server/controllers/passwordResetController.js"
  "server/routes/passwordResetRoutes.js"
)

all_exist=true
for file in "${files[@]}"; do
  if [ -f "$file" ]; then
    echo -e "${GREEN}✅${NC} $file exists"
  else
    echo -e "${RED}❌${NC} $file MISSING"
    all_exist=false
  fi
done

echo ""

if [ "$all_exist" = true ]; then
  echo -e "${GREEN}✅ All required files exist locally${NC}"
else
  echo -e "${RED}❌ Some files are missing!${NC}"
  exit 1
fi

echo ""
echo "Step 2: Checking Git status..."
echo ""

# Check if files are committed
git status --short

if [ $? -eq 0 ]; then
  uncommitted=$(git status --short | wc -l)
  if [ $uncommitted -eq 0 ]; then
    echo -e "${GREEN}✅ All changes are committed${NC}"
  else
    echo -e "${YELLOW}⚠️  You have uncommitted changes:${NC}"
    git status --short
    echo ""
    echo "Run: git add . && git commit -m 'Add password reset feature' && git push"
  fi
else
  echo -e "${YELLOW}⚠️  Not a git repository or git not available${NC}"
fi

echo ""
echo "Step 3: Testing production endpoint..."
echo ""

# Test production
response=$(curl -s -w "\n%{http_code}" -X POST https://www.mafqoudat.com/api/password-reset/request \
  -H "Content-Type: application/json" \
  -d '{"contactInfo":"test@example.com"}' 2>&1)

http_code=$(echo "$response" | tail -n1)

if [ "$http_code" = "201" ] || [ "$http_code" = "200" ]; then
  echo -e "${GREEN}✅ Production endpoint is working! (HTTP $http_code)${NC}"
  echo "Response: $(echo "$response" | head -n-1)"
else
  echo -e "${RED}❌ Production endpoint failed (HTTP $http_code)${NC}"
  
  if [ "$http_code" = "405" ]; then
    echo ""
    echo -e "${YELLOW}This means the route is not loaded on your production server.${NC}"
    echo ""
    echo "Required actions:"
    echo "1. Verify files are on production server"
    echo "2. Restart the production server"
    echo ""
    echo "Commands to run on your production server:"
    echo "  # Check if files exist"
    echo "  ls -la server/models/PasswordResetRequest.js"
    echo "  ls -la server/controllers/passwordResetController.js"
    echo "  ls -la server/routes/passwordResetRoutes.js"
    echo ""
    echo "  # Check server.js has the route"
    echo "  grep 'password-reset' server/server.js"
    echo ""
    echo "  # Restart the server (choose one):"
    echo "  pm2 restart all"
    echo "  railway restart"
    echo "  systemctl restart mafqoudat"
  fi
fi

echo ""
echo "=================================================="
echo "Verification Complete"
echo "=================================================="

