#!/bin/bash

# Dừng script nếu có lỗi
set -e

USERNAME="aki201"
BACKEND_IMAGE="$USERNAME/ttn-backend:latest"
WEB_IMAGE="$USERNAME/ttn-web:latest"

echo "--- BẮT ĐẦU QUÁ TRÌNH BUILD & PUSH (AMD64) ---"

# 1. Login Docker Hub (nếu chưa login)
echo "1. Kiểm tra đăng nhập Docker Hub..."
if ! docker info | grep -q "Username"; then
    echo "Vui lòng đăng nhập Docker Hub:"
    docker login
fi

# 2. Tạo builder (nếu chưa có) để hỗ trợ multi-platform
if ! docker buildx ls | grep -q "mybuilder"; then
    echo "Tạo Docker builder mới..."
    docker buildx create --name mybuilder --use
    docker buildx inspect --bootstrap
else
    docker buildx use mybuilder
fi

# 3. Build & Push Backend
# Load .env variables
if [ -f .env ]; then
  # Use set -a to export variables from .env automatically
  set -a
  source .env
  set +a
fi

# Copy .env to backend for build (so prisma generate can read it "in code")
if [ -f .env ]; then
  cp .env backend/.env
fi

echo "2. Building & Pushing Backend ($BACKEND_IMAGE)..."
# Use ROOT context (.) to allow copying prompts
docker buildx build --platform linux/amd64 -f ./backend/Dockerfile.prod -t $BACKEND_IMAGE . --push

# Cleanup .env in backend
if [ -f backend/.env ]; then
  rm backend/.env
fi

# 4. Build & Push Web (Frontend)
echo "3. Building & Pushing Frontend ($WEB_IMAGE)..."

# Ensure we have the latest backend/ prompts copied (if needed by context) - handled by Dockerfile.prod context logic

# Inject variables. PRIORITIZE .env.production if pushing for PROD
if [ -f .env.production ]; then
    echo "   -> Loaded .env.production for Frontend Build"
    set -a
    source .env.production
    set +a
elif [ -f .env ]; then
    echo "   -> Loaded .env for Frontend Build"
    set -a
    source .env
    set +a
fi

docker buildx build --platform linux/amd64 \
  -f ./frontend/Dockerfile.prod \
  --build-arg NEXT_PUBLIC_API_ENDPOINT=$NEXT_PUBLIC_API_ENDPOINT \
  --build-arg NEXT_PUBLIC_APP_URL=$NEXT_PUBLIC_APP_URL \
  --build-arg NEXT_PUBLIC_GOOGLE_CLIENT_ID=$NEXT_PUBLIC_GOOGLE_CLIENT_ID \
  -t $WEB_IMAGE ./frontend --push

echo "4. Copy files to VPS..."
scp ./vps-deploy.sh .env docker-compose.prod.yaml root@103.90.225.222:~/

echo "5. Deploy on VPS..."
ssh root@103.90.225.222 "./vps-deploy.sh & n"

echo "--- HOÀN TẤT! ---"
echo "Bây giờ bạn có thể dùng lệnh 'docker pull' trên VPS."
