#!/bin/bash

echo "🚀 Deploying ML Service..."

# 1. Run tests
echo "📋 Running tests..."
pytest tests/ -v

if [ $? -ne 0 ]; then
    echo "❌ Tests failed!"
    exit 1
fi

# 2. Build Docker image
echo "🐳 Building Docker image..."
docker build -t ml-service:latest ./backend/ml_service

# 3. Push to Registry
echo "📤 Pushing to registry..."
docker tag ml-service:latest your-registry/ml-service:latest
docker push your-registry/ml-service:latest

# 4. Deploy to Render
echo "🌐 Deploying to Render..."
# Render auto-deploys from GitHub

echo "✅ Deployment complete!"
