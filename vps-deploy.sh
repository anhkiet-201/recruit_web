#!/bin/bash

# Script triển khai tự động trên VPS (Docker Pull & Run)
# Sử dụng: ./vps-deploy.sh

DOMAIN="timviec.vieclamhr.com"
EMAIL="admin@timviec.vieclamhr.com"

# --- Phát hiện lệnh Docker Compose ---
if command -v docker-compose &> /dev/null; then
    COMPOSE_CMD="docker-compose"
elif docker compose version &> /dev/null; then
    COMPOSE_CMD="docker compose"
else
    echo "LỖI: Không tìm thấy 'docker-compose' hoặc 'docker compose'. Vui lòng cài đặt Docker."
    exit 1
fi
echo "-> Sử dụng lệnh: $COMPOSE_CMD"

# --- Kiểm tra .env.production tồn tại ---
if [ ! -f .env.production ]; then
    echo "❌ LỖI: File .env.production không tồn tại!"
    echo ""
    echo "Bạn cần tạo file .env.production trước khi deploy:"
    echo "  1. cp .env.example .env.production"
    echo "  2. nano .env.production  # Điền tất cả credentials thật"
    echo ""
    echo "Xem hướng dẫn chi tiết tại DEPLOYMENT.md"
    exit 1
fi
echo "✅ File .env.production đã tồn tại"

echo "--- BẮT ĐẦU TRIỂN KHAI TRÊN VPS ---"

# 0. Nginx Configuration
echo "0. Updating Nginx configuration..."
mkdir -p nginx
# Remove if it's a directory (often caused by Docker volume mounting)
if [ -d "nginx/default.conf" ]; then
    rm -rf nginx/default.conf
fi

cat > nginx/default.conf <<EOF
server {
    listen 80;
    server_name timviec.vieclamhr.com;

    # Certbot challenge handler
    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }

    # Redirect to HTTPS
    location / {
        return 301 https://\$host\$request_uri;
    }
}

# HTTPS Server Block
server {
    listen 443 ssl;
    server_name timviec.vieclamhr.com;

    ssl_certificate /etc/letsencrypt/live/timviec.vieclamhr.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/timviec.vieclamhr.com/privkey.pem;

    # Recommended SSL settings
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    # Size limits
    client_max_body_size 20M;

    location / {
        proxy_pass http://web:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }

    location /api/ {
        proxy_pass http://backend:4000/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }

    location /ttn-bucket/ {
        proxy_pass http://minio:9000;
        proxy_set_header Host \$http_host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        
        # MinIO recommendations
        proxy_http_version 1.1;
        proxy_set_header Connection "";
        chunked_transfer_encoding off;
    }
}
EOF

# 1. Pull images mới nhất
echo "1. Pulling Docker images..."
$COMPOSE_CMD -f docker-compose.prod.yaml pull

# 2. Tạo chứng chỉ SSL giả (Self-signed)
echo "2. Kiểm tra/Tạo chứng chỉ SSL tạm thời..."
CERT_DIR="./certbot/conf/live/$DOMAIN"

if [ ! -f "$CERT_DIR/fullchain.pem" ]; then
    echo "   -> Chưa có chứng chỉ. Đang tạo chứng chỉ tự ký (Self-signed)..."
    mkdir -p "$CERT_DIR"
    openssl req -x509 -nodes -newkey rsa:2048 \
      -keyout "$CERT_DIR/privkey.pem" \
      -out "$CERT_DIR/fullchain.pem" \
      -days 365 \
      -subj "/C=VN/ST=Hanoi/L=Hanoi/O=MyOrg/OU=MyUnit/CN=$DOMAIN"
else
    echo "   -> Đã có chứng chỉ. Bỏ qua bước tạo."
fi

# 3. Khởi động Containers
echo "3. Khởi động Containers..."
$COMPOSE_CMD -f docker-compose.prod.yaml up -d

# 4. Hỏi người dùng có muốn lấy chứng chỉ thật ngay không
echo ""
echo "----------------------------------------------------"
read -p "Bạn có muốn chạy Certbot để lấy SSL THẬT ngay bây giờ không? (y/n): " RUN_CERTBOT

if [[ "$RUN_CERTBOT" == "y" || "$RUN_CERTBOT" == "Y" ]]; then
    echo "4. Đang lấy chứng chỉ SSL thật từ Let's Encrypt..."
    
    # Xóa chứng chỉ giả cũ
    rm -rf "./certbot/conf/live/$DOMAIN"
    rm -rf "./certbot/conf/archive/$DOMAIN"
    rm -rf "./certbot/conf/renewal/$DOMAIN.conf"
    
    # Chạy Certbot
    $COMPOSE_CMD -f docker-compose.prod.yaml run --rm certbot certonly --webroot --webroot-path /var/www/certbot \
        -d $DOMAIN \
        --email $EMAIL \
        --agree-tos \
        --no-eff-email \
        --force-renewal

    echo "5. Restarting Nginx..."
    $COMPOSE_CMD -f docker-compose.prod.yaml restart nginx
    
    echo "--- HOÀN TẤT SSL THẬT! ---"
else
    echo "5. Restarting Nginx to sync configurations..."
    $COMPOSE_CMD -f docker-compose.prod.yaml restart nginx
    echo "Đã bỏ qua bước lấy SSL thật. Web đang chạy với chứng chỉ hiện tại."
fi

# 5. Cài đặt tự động gia hạn (Cron Job)
echo ""
echo "5. Thiết lập tự động gia hạn SSL (Cron Job)..."
chmod +x ./renew_cert.sh
SCRIPT_PATH="$(pwd)/renew_cert.sh"
CRON_JOB="0 3 * * * $SCRIPT_PATH"

if crontab -l 2>/dev/null | grep -Fq "$SCRIPT_PATH"; then
    echo "   -> Cron job đã tồn tại."
else
    (crontab -l 2>/dev/null; echo "$CRON_JOB") | crontab -
    echo "   -> Đã thêm Cron job: Chạy gia hạn vào 03:00 sáng hàng ngày."
fi

echo ""
echo "--- TRIỂN KHAI HOÀN TẤT ---"
echo "Website của bạn đang chạy tại: https://$DOMAIN"