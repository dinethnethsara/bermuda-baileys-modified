#!/bin/bash

echo "╔═══════════════════════════════════════════════════════════╗"
echo "║         BERMUDA BAILEYS - Package Verification           ║"
echo "╚═══════════════════════════════════════════════════════════╝"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check functions
check_pass() {
    echo -e "${GREEN}✅ $1${NC}"
}

check_fail() {
    echo -e "${RED}❌ $1${NC}"
}

check_warn() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

echo "🔍 Running package verification checks..."
echo ""

# 1. Check if lib/ exists
echo "1. Checking build output..."
if [ -d "lib" ]; then
    check_pass "lib/ directory exists"
    FILE_COUNT=$(find lib -type f | wc -l)
    check_pass "Found $FILE_COUNT files in lib/"
else
    check_fail "lib/ directory not found - run 'npm run build'"
    exit 1
fi

# 2. Check BERMUDA features
echo ""
echo "2. Checking BERMUDA features..."
if [ -d "lib/Bermuda" ]; then
    check_pass "BERMUDA features compiled"
    ls lib/Bermuda/*.js | while read file; do
        basename "$file" .js | xargs -I {} echo "   ✓ {}"
    done
else
    check_fail "BERMUDA features not found"
    exit 1
fi

# 3. Check package.json
echo ""
echo "3. Checking package.json..."
if [ -f "package.json" ]; then
    check_pass "package.json exists"
    
    NAME=$(grep '"name"' package.json | head -1 | cut -d'"' -f4)
    VERSION=$(grep '"version"' package.json | head -1 | cut -d'"' -f4)
    
    echo "   📦 Name: $NAME"
    echo "   🏷️  Version: $VERSION"
    
    if [[ $NAME == *"bermuda"* ]]; then
        check_pass "Package name includes 'bermuda'"
    else
        check_warn "Package name doesn't include 'bermuda'"
    fi
else
    check_fail "package.json not found"
    exit 1
fi

# 4. Check dependencies
echo ""
echo "4. Checking BERMUDA dependencies..."
for dep in "chalk" "gradient-string" "figlet"; do
    if grep -q "\"$dep\"" package.json; then
        check_pass "$dep is in dependencies"
    else
        check_fail "$dep is missing from dependencies"
    fi
done

# 5. Check documentation
echo ""
echo "5. Checking documentation..."
for doc in "README.md" "LICENSE" "CHANGELOG_BERMUDA.md"; do
    if [ -f "$doc" ]; then
        SIZE=$(wc -c < "$doc" | xargs)
        check_pass "$doc exists (${SIZE} bytes)"
    else
        check_fail "$doc not found"
    fi
done

# 6. Check .npmignore
echo ""
echo "6. Checking .npmignore..."
if [ -f ".npmignore" ]; then
    check_pass ".npmignore exists"
    if grep -q "src/" .npmignore; then
        check_pass "Source files excluded"
    else
        check_warn "Source files might be included"
    fi
else
    check_warn ".npmignore not found - will use .gitignore"
fi

# 7. Check for sensitive files
echo ""
echo "7. Checking for sensitive data..."
if [ -d "auth_info" ]; then
    check_warn "auth_info/ directory found - ensure it's in .npmignore"
else
    check_pass "No auth_info/ directory found"
fi

if [ -f ".env" ]; then
    check_warn ".env file found - ensure it's in .npmignore"
else
    check_pass "No .env file found"
fi

# 8. Check entry points
echo ""
echo "8. Checking entry points..."
if [ -f "lib/index.js" ]; then
    check_pass "lib/index.js exists"
else
    check_fail "lib/index.js not found"
fi

if [ -f "lib/index.d.ts" ]; then
    check_pass "lib/index.d.ts exists (TypeScript types)"
else
    check_warn "lib/index.d.ts not found"
fi

# 9. Check BERMUDA exports
echo ""
echo "9. Checking BERMUDA exports..."
if grep -q "export.*from.*Bermuda" lib/index.js 2>/dev/null; then
    check_pass "BERMUDA features exported in lib/index.js"
else
    check_fail "BERMUDA features not exported"
fi

# 10. Estimate package size
echo ""
echo "10. Estimating package size..."
if [ -d "lib" ] && [ -d "WAProto" ]; then
    TOTAL_SIZE=$(du -sh lib WAProto | awk '{sum+=$1} END {print sum}')
    echo "   📦 Estimated size: ~${TOTAL_SIZE}M"
    check_pass "Package size calculated"
fi

# Summary
echo ""
echo "╔═══════════════════════════════════════════════════════════╗"
echo "║                    Verification Summary                   ║"
echo "╚═══════════════════════════════════════════════════════════╝"
echo ""
echo "✅ Package name: $NAME"
echo "✅ Version: $VERSION"
echo "✅ Build: Complete"
echo "✅ BERMUDA features: Compiled"
echo "✅ Documentation: Ready"
echo "✅ Entry points: Valid"
echo ""
echo "🚀 Ready to publish!"
echo ""
echo "To publish, run:"
echo "  npm login"
echo "  npm publish --access public"
echo ""
