#!/bin/bash

echo "🚀 Deploying ML System..."

# 1. Run tests
echo "📋 Running tests..."
pytest tests/test_final_ml_system.py -v

if [ $? -ne 0 ]; then
    echo "❌ Tests failed!"
    exit 1
fi

# 2. Build Docker image
echo "🐳 Building Docker image..."
docker build -t ml-service:latest ./backend/ml_service

# 3. Push to registry
echo "📤 Pushing to registry..."
docker tag ml-service:latest your-registry/ml-service:latest
docker push your-registry/ml-service:latest

# 4. Deploy
echo "🌐 Deploying to Render..."
# Render auto-deploys from GitHub

# 5. Verify deployment
echo "🔍 Verifying deployment..."
curl -s https://ml-service.onrender.com/health

echo "✅ Deployment complete!"
