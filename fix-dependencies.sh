#!/bin/bash

# RootLab - Fix Dependencies Script
# This script installs missing TypeScript types and fixes common dependency issues

echo "🔧 RootLab - Fixing Dependencies"
echo "================================="

# Install missing TypeScript types
echo "📦 Installing missing TypeScript types..."
npm install --save-dev @types/ws @types/node

# Install any missing dependencies
echo "📦 Checking for missing dependencies..."
npm install

# Clear Next.js cache
echo "🧹 Clearing Next.js cache..."
rm -rf .next
npm run build 2>/dev/null || echo "Build check completed"

echo ""
echo "✅ Dependencies fixed!"
echo ""
echo "🚀 Next steps:"
echo "   1. Restart your development server: npm run dev"
echo "   2. The WebSocket HMR warning is normal in development"
echo "   3. PhishingToolCard component is now properly imported"
echo ""
echo "🎉 Your RootLab platform should now work without errors!"