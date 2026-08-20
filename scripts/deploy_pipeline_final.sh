#!/bin/bash
# scripts/deploy_pipeline_final.sh
# Final Production Data Pipeline Deployment Automation Script

set -e  # Exit immediately if any command fails

echo "=========================================================="
echo "🚀 Starting Data Pipeline Production Deployment Automation"
echo "=========================================================="

# 1. Run Final System Integration Tests
echo "[1/4] Running system integration tests..."
python -m pytest tests/integration/test_final_pipeline.py -v
if [ $? -ne 0 ]; then
    echo "❌ ERROR: System integration tests failed! Aborting deployment."
    exit 1
fi
echo "✅ Integration tests passed successfully."

# 2. Build Docker Container Image
IMAGE_NAME="data-pipeline"
TAG="latest"
FULL_IMAGE_NAME="${IMAGE_NAME}:${TAG}"

echo "[2/4] Building Docker container image: ${FULL_IMAGE_NAME}..."
if [ -f "Dockerfile.pipeline" ]; then
    docker build -f Dockerfile.pipeline -t "${FULL_IMAGE_NAME}" .
else
    docker build -t "${FULL_IMAGE_NAME}" .
fi
echo "✅ Docker build complete."

# 3. Optional Remote Registry Tagging & Push
if [ -n "$REGISTRY" ]; then
    REGISTRY_TAG="${REGISTRY}/${FULL_IMAGE_NAME}"
    echo "[3/4] Tagging Docker image for registry: ${REGISTRY_TAG}..."
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
    HTTP_STATUS=$(curl -o /dev/null -s -w "%{http_code}" "${DEPLOYMENT_VERIFICATION_URL}/api/v1/pipeline/status")
    if [ "$HTTP_STATUS" -eq 200 ]; then
        echo "✅ Deployment health check passed (HTTP 200)."
    else
        echo "⚠️ WARNING: Deployment health check returned HTTP ${HTTP_STATUS}."
    fi
else
    echo "[4/4] DEPLOYMENT_VERIFICATION_URL environment variable not set. Skipping verification."
fi

echo "=========================================================="
echo "🎉 Data Pipeline Deployment Automation Finished!"
echo "=========================================================="
