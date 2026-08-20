#!/bin/bash
echo "🚀 FINAL DEPLOYMENT - FRONTEND"

# 1. Run tests
echo "📋 Running E2E tests..."
npm run test:e2e
if [ $? -ne 0 ]; then
  echo "❌ Tests failed!"
  exit 1
fi

# 2. Build
echo "🏗️ Building..."
npm run build
if [ $? -ne 0 ]; then
  echo "❌ Build failed!"
  exit 1
fi

# 3. Deploy to Vercel
echo "🌐 Deploying to Vercel..."
vercel deploy --prod
if [ $? -ne 0 ]; then
  echo "❌ Deployment failed!"
  exit 1
fi

# 4. Verify deployment
echo "🔍 Verifying deployment..."
curl -s -o /dev/null -w '%{http_code}' https://academic-to-industry-transition.vercel.app
echo "✅ FINAL DEPLOYMENT COMPLETE!"
