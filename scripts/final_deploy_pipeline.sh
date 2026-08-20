#!/bin/bash
# scripts/final_deploy_pipeline.sh
# Final Production Data Pipeline Deployment Script (Weeks 29–32)

set -e  # Exit immediately if any command fails

echo "=========================================================="
echo "🚀 Starting Final Data Pipeline Production Deployment"
echo "=========================================================="

# 1. Run Complete System & End-to-End Integration Tests
echo "[1/4] Running complete integration test suite..."
python -m pytest tests/ -v
if [ $? -ne 0 ]; then
    echo "❌ ERROR: System integration tests failed! Aborting deployment."
    exit 1
fi
echo "✅ Integration test suite passed successfully."

# 2. Build Docker Container Image
IMAGE_NAME="data-pipeline"
TAG="final"
FULL_IMAGE_NAME="${IMAGE_NAME}:${TAG}"

echo "[2/4] Building Docker container image: ${FULL_IMAGE_NAME}..."
if [ -f "Dockerfile.pipeline" ]; then
    docker build -f Dockerfile.pipeline -t "${FULL_IMAGE_NAME}" .
elif [ -f "Dockerfile" ]; then
    docker build -t "${FULL_IMAGE_NAME}" .
else
    echo "⚠️ Dockerfile not found in current directory. Skipping Docker build."
fi
echo "✅ Image build phase complete."

# 3. Optional Remote Registry Tagging & Push
if [ -n "$REGISTRY" ]; then
    REGISTRY_TAG="${REGISTRY}/${FULL_IMAGE_NAME}"
    echo "[3/4] Tagging Docker image for remote registry: ${REGISTRY_TAG}..."
    docker tag "${FULL_IMAGE_NAME}" "${REGISTRY_TAG}"
    
    echo "Pushing Docker image to registry..."
    docker push "${REGISTRY_TAG}"
    echo "✅ Image successfully pushed to ${REGISTRY_TAG}"
else
    echo "[3/4] REGISTRY environment variable not set. Skipping remote tag and push."
fi

# 4. Optional Health Verification Endpoint Check
if [ -n "$DEPLOYMENT_VERIFICATION_URL" ]; then
    echo "[4/4] Verifying deployment endpoint health at ${DEPLOYMENT_VERIFICATION_URL}..."
    HTTP_STATUS=$(curl -o /dev/null -s -w "%{http_code}" "${DEPLOYMENT_VERIFICATION_URL}/api/v1/pipeline/health")
    if [ "$HTTP_STATUS" -eq 200 ]; then
        echo "✅ Production health check endpoint passed (HTTP 200)."
    else
        echo "⚠️ WARNING: Health check endpoint returned HTTP ${HTTP_STATUS}."
    fi
else
    echo "[4/4] DEPLOYMENT_VERIFICATION_URL environment variable not set. Skipping verification."
fi

echo "=========================================================="
echo "🎉 Final Data Pipeline Deployment Automation Finished!"
echo "=========================================================="
