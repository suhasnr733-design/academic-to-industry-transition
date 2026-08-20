#!/bin/bash

# scripts/deploy_pipeline.sh
# Production deployment automation script for Data Pipeline

set -e # Exit immediately if any command fails

echo "=================================================="
echo "STARTING DATA PIPELINE PRODUCTION DEPLOYMENT"
echo "=================================================="

# Step 1: Run full test suite
echo "[1/4] Running automated test suite..."
python -m pytest tests/ data_pipeline/tests/ -v

if [ $? -ne 0 ]; then
    echo "[ERROR] Automated tests failed! Aborting deployment."
    exit 1
fi
echo "[SUCCESS] All tests passed cleanly."

# Step 2: Build Docker Image
IMAGE_NAME="data-pipeline"
IMAGE_TAG="latest"
FULL_IMAGE_NAME="${IMAGE_NAME}:${IMAGE_TAG}"

echo "[2/4] Building Docker image (${FULL_IMAGE_NAME})..."
if [ -f "Dockerfile.pipeline" ]; then
    docker build -f Dockerfile.pipeline -t "${FULL_IMAGE_NAME}" .
else
    docker build -t "${FULL_IMAGE_NAME}" .
fi
echo "[SUCCESS] Docker image built successfully."

# Step 3: Tag Image for Registry if REGISTRY environment variable is set
if [ -n "$REGISTRY" ]; then
    REGISTRY_TAG="${REGISTRY}/${FULL_IMAGE_NAME}"
    echo "[3/4] Tagging Docker image for registry: ${REGISTRY_TAG}..."
    docker tag "${FULL_IMAGE_NAME}" "${REGISTRY_TAG}"
    echo "[SUCCESS] Tagged image as ${REGISTRY_TAG}"
else
    echo "[3/4] REGISTRY environment variable not set. Skipping remote tag."
fi

# Step 4: Final deployment status
echo "[4/4] Pipeline deployment readiness check completed."
echo "=================================================="
echo "DEPLOYMENT COMPLETED SUCCESSFULLY"
echo "=================================================="
