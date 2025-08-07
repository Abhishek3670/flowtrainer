#!/bin/bash

# Exit immediately if a command exits with a non-zero status
set -e

# Variables
COMPOSE_FILE="docker-compose.yml"
PROJECT_NAME="flowcraft"

echo "Starting deployment process for $PROJECT_NAME..."

# Build/update images
echo "Building Docker images..."
docker-compose -p $PROJECT_NAME -f $COMPOSE_FILE build

# Bring up the containers in detached mode, recreate if needed
echo "Starting containers with Docker Compose..."
docker-compose -p $PROJECT_NAME -f $COMPOSE_FILE up -d --remove-orphans --force-recreate

# Optional: prune unused images to save space (uncomment if desired)
# echo "Pruning unused Docker images..."
# docker image prune -f

echo "Deployment completed successfully."

# Show running containers for confirmation
docker-compose -p $PROJECT_NAME -f $COMPOSE_FILE ps
