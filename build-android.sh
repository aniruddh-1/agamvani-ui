#!/bin/bash

# Agamvani Android APK Build Script
# This script builds the Android APK for Agamvani Radio app

set -e  # Exit on error

echo "🚀 Starting Agamvani Android build process..."
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ Error: package.json not found. Please run this script from the project root.${NC}"
    exit 1
fi

# Step 1: Clean previous build
echo -e "${YELLOW}📦 Step 1: Cleaning previous builds...${NC}"
rm -rf dist/
rm -rf android/app/build/
echo -e "${GREEN}✅ Clean complete${NC}"
echo ""

# Step 2: Install dependencies (if needed)
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}📥 Step 2: Installing dependencies...${NC}"
    npm install --legacy-peer-deps
    echo -e "${GREEN}✅ Dependencies installed${NC}"
    echo ""
else
    echo -e "${GREEN}✅ Step 2: Dependencies already installed${NC}"
    echo ""
fi

# Step 3: Build web app
echo -e "${YELLOW}🔨 Step 3: Building web application...${NC}"
npm run build
echo -e "${GREEN}✅ Web build complete${NC}"
echo ""

# Step 4: Sync to Android
echo -e "${YELLOW}🔄 Step 4: Syncing to Android project...${NC}"
npx cap sync android
echo -e "${GREEN}✅ Sync complete${NC}"
echo ""

# Step 5: Check for keystore
echo -e "${YELLOW}🔑 Step 5: Checking signing configuration...${NC}"
if [ -f "android/key.properties" ]; then
    echo -e "${GREEN}✅ Release keystore found - building signed release APK${NC}"
    BUILD_TYPE="release"
else
    echo -e "${YELLOW}⚠️  No key.properties found - building debug APK${NC}"
    echo -e "${YELLOW}   For production builds, create android/key.properties from key.properties.template${NC}"
    BUILD_TYPE="debug"
fi
echo ""

# Step 6: Build APK
echo -e "${YELLOW}🏗️  Step 6: Building Android APK...${NC}"
cd android

if [ "$BUILD_TYPE" = "release" ]; then
    ./gradlew assembleRelease
    APK_PATH="app/build/outputs/apk/release/app-release.apk"
else
    ./gradlew assembleDebug
    APK_PATH="app/build/outputs/apk/debug/app-debug.apk"
fi

cd ..
echo -e "${GREEN}✅ APK build complete${NC}"
echo ""

# Step 7: Show results
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${GREEN}🎉 Build successful!${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📱 APK Location:"
echo "   android/$APK_PATH"
echo ""

# Get APK file size
if [ -f "android/$APK_PATH" ]; then
    APK_SIZE=$(du -h "android/$APK_PATH" | cut -f1)
    echo "📊 APK Size: $APK_SIZE"
    echo ""
fi

# Show installation instructions
echo "📲 Installation Instructions:"
echo ""
if [ "$BUILD_TYPE" = "release" ]; then
    echo "   Release APK (Signed):"
    echo "   - Transfer to Android device"
    echo "   - Enable 'Install from Unknown Sources'"
    echo "   - Open and install the APK"
else
    echo "   Debug APK (Development):"
    echo "   - Connect Android device via USB"
    echo "   - Enable USB debugging"
    echo "   - Run: adb install android/$APK_PATH"
fi
echo ""


echo ""
echo "📦 Copying APK to project root..."
cp android/app/build/outputs/apk/debug/app-debug.apk agamvani-production.apk

echo ""
echo -e "${GREEN}✨ Done! Ready to install on Android device.${NC}"
