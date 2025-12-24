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
echo "2. Building & Pushing Backend ($BACKEND_IMAGE)..."
docker buildx build --platform linux/amd64 -f ./backend/Dockerfile.prod -t $BACKEND_IMAGE ./backend --push

# 4. Build & Push Web (Frontend)
echo "3. Building & Pushing Frontend ($WEB_IMAGE)..."
# Lưu ý: Frontend cần biến môi trường NEXT_PUBLIC_API_URL khi build
docker buildx build --platform linux/amd64 \
  -f ./frontend/Dockerfile.prod \
  --build-arg NEXT_PUBLIC_API_URL=/api \
  -t $WEB_IMAGE ./frontend --push

echo "--- HOÀN TẤT! ---"
echo "Bây giờ bạn có thể dùng lệnh 'docker pull' trên VPS."
