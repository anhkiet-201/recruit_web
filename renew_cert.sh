#!/bin/bash

# Thiết lập PATH
export PATH=$PATH:/usr/local/bin:/usr/bin:/bin

# Di chuyển vào thư mục chứa script
cd "$(dirname "$0")"

LOG_FILE="ssl_renew.log"

# --- Phát hiện lệnh Docker Compose ---
if command -v docker-compose &> /dev/null; then
    COMPOSE_CMD="docker-compose"
elif docker compose version &> /dev/null; then
    COMPOSE_CMD="docker compose"
else
    echo "LỖI: Không tìm thấy docker-compose" >> $LOG_FILE
    exit 1
fi

echo "----------------------------------------------------" >> $LOG_FILE
echo "--- Bắt đầu kiểm tra gia hạn SSL: $(date) ---" >> $LOG_FILE
echo "Using command: $COMPOSE_CMD" >> $LOG_FILE

# 1. Chạy lệnh renew của certbot
$COMPOSE_CMD -f docker-compose.prod.yaml run --rm certbot renew >> $LOG_FILE 2>&1

# 2. Reload Nginx
$COMPOSE_CMD -f docker-compose.prod.yaml exec -T nginx nginx -s reload >> $LOG_FILE 2>&1

echo "--- Hoàn tất ---" >> $LOG_FILE
