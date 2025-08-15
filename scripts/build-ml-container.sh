#!/usr/bin/env bash
set -e

echo "Building ML engine container..."
docker build -t flowcraft/ml-engine:latest ./docker/ml-engine
echo "✅ Built flowcraft/ml-engine:latest"
