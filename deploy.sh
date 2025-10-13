#!/usr/bin/env bash
set -e

TARGET_DIR="/home/dso504/project-dso"
REPO_URL="https://dso504:${GH_PAT}@github.com/qznr/project-dso.git"

echo ">>> Checking and pulling/cloning code on remote..."
mkdir -p "${TARGET_DIR}"
cd "${TARGET_DIR}"

if [ -d .git ]; then
  echo ">>> Repository exists, pulling latest changes..."
  git config remote.origin.url "${REPO_URL}"
  git pull origin main
else
  echo ">>> Cloning repository from scratch..."
  git clone "${REPO_URL}" .
fi

echo ">>> Rebuilding and starting containers..."
docker compose pull
docker compose up -d --build

echo ">>> Cleaning up unused images..."
docker system prune -f

echo "✅ Deployment complete!"
