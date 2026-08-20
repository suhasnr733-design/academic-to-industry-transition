#!/bin/bash

echo "🚀 FINAL DEPLOYMENT - ML SYSTEM"

# 1. Run all tests
echo "📋 Running all tests..."
pytest backend/tests/ -v

if [ $? -ne 0 ]; then
    echo "❌ Tests failed!"
    exit 1
fi

# 2. Build Docker images
echo "🐳 Building Docker images..."
docker build -t ml-service:final ./backend/ml_service

# 3. Tag and push
echo "📤 Tagging and pushing..."
docker tag ml-service:final your-registry/ml-service:final
docker push your-registry/ml-service:final

# 4. Deploy to Render
echo "🌐 Deploying to Render..."
# Render auto-deploys from GitHub

# 5. Verify deployment
echo "🔍 Verifying deployment..."
curl -s https://ml-service.onrender.com/health

echo "✅ FINAL DEPLOYMENT COMPLETE!"