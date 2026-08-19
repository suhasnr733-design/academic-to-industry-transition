#!/bin/bash

echo "🚀 FINAL DEPLOYMENT - BACKEND API"

# 1. Run all tests
echo "📋 Running all tests..."
pytest backend/tests/ -v

if [ $? -ne 0 ]; then
    echo "❌ Tests failed!"
    exit 1
fi

# 2. Build Docker image
echo "🐳 Building Docker image..."
docker build -t backend-api:final .

# 3. Tag and push
echo "📤 Tagging and pushing..."
docker tag backend-api:final your-registry/backend-api:final
docker push your-registry/backend-api:final

# 4. Deploy to Render
echo "🌐 Deploying to Render..."

# 5. Verify deployment
echo "🔍 Verifying deployment..."
curl -s https://your-project.onrender.com/api/v1/health

echo "✅ FINAL DEPLOYMENT COMPLETE!"