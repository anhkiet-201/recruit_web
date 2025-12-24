#!/bin/bash
set -e

echo "--- BẮT ĐẦU CÀI ĐẶT DOCKER & DOCKER COMPOSE (Ubuntu 22.04) ---"

# 1. Gỡ cài đặt các phiên bản cũ (nếu có)
echo "1. Cleaning up old versions..."
sudo apt-get remove -y docker docker-engine docker.io containerd runc || true

# 2. Cập nhật và cài đặt các gói cần thiết
echo "2. Installing dependencies..."
sudo apt-get update
sudo apt-get install -y \
    ca-certificates \
    curl \
    gnupg \
    lsb-release

# 3. Thêm GPG key chính thức của Docker
echo "3. Adding Docker's GPG key..."
sudo mkdir -p /etc/apt/keyrings
if [ -f /etc/apt/keyrings/docker.gpg ]; then
    sudo rm /etc/apt/keyrings/docker.gpg
fi
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
sudo chmod a+r /etc/apt/keyrings/docker.gpg

# 4. Thiết lập repository
echo "4. Setting up Docker repository..."
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# 5. Cài đặt Docker Engine
echo "5. Installing Docker Engine..."
sudo apt-get update
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin

# 6. Kiểm tra cài đặt
echo ""
echo "--- KIỂM TRA PHIÊN BẢN ---"
docker --version
docker compose version

echo ""
echo "--- CÀI ĐẶT HOÀN TẤT! ---"
echo "Bạn có thể cần đăng xuất và đăng nhập lại (hoặc chạy 'newgrp docker') nếu muốn dùng docker mà không cần sudo (sau khi add user vào group docker)."
