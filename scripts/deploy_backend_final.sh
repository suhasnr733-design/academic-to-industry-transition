#!/bin/bash

echo "🚀 Deploying Backend API..."

# 1. Run tests
echo "📋 Running tests..."
pytest tests/test_final_backend.py -v

if [ $? -ne 0 ]; then
    echo "❌ Tests failed!"
    exit 1
fi

# 2. Build Docker image
echo "🐳 Building Docker image..."
docker build -t backend-api:latest .

# 3. Push to registry
echo "📤 Pushing to registry..."
docker tag backend-api:latest your-registry/backend-api:latest
docker push your-registry/backend-api:latest

# 4. Deploy to Render
echo "🌐 Deploying to Render..."
# Render auto-deploys from GitHub

# 5. Verify deployment
echo "🔍 Verifying deployment..."
curl -s https://your-project.onrender.com/api/v1/health

echo "✅ Deployment complete!"