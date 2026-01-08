# Hướng Dẫn Deployment lên VPS

## Yêu Cầu Trước Khi Deploy

- VPS đã cài Docker và Docker Compose
- Domain đã trỏ về VPS
- SSH access vào VPS

## Bước 1: Setup File .env.production trên VPS

**QUAN TRỌNG**: File `.env.production` **KHÔNG** được commit vào Git. Bạn phải tạo thủ công trên VPS.

### SSH vào VPS:

```bash
ssh root@your-vps-ip
cd /path/to/ttn-web
```

### Tạo .env.production từ template:

```bash
cp .env.example .env.production
nano .env.production
```

### Điền tất cả credentials thật:

- `JWT_SECRET`: Generate bằng `openssl rand -base64 32`
- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`: Từ Google Cloud Console
- `GOOGLE_SERVICE_ACCOUNT_EMAIL`, `GOOGLE_PRIVATE_KEY`: Service Account JSON
- `AI_API_KEY`: Gemini API key
- `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID`: Telegram Bot
- `MINIO_PUBLIC_URL`: `https://timviec.vieclamhr.com/ttn-bucket`
- `NEXT_PUBLIC_API_ENDPOINT`: `/api`
- `NEXT_PUBLIC_APP_URL`: `https://timviec.vieclamhr.com`
- `NEXT_PUBLIC_GOOGLE_CLIENT_ID`: Google Client ID (same as GOOGLE_CLIENT_ID)
- `ALLOWED_ORIGINS`: `https://timviec.vieclamhr.com,https://vieclamhr.com`
- `INTERNAL_API_URL`: `http://backend:4000`

### Verify file tồn tại:

```bash
ls -la .env.production
```

## Bước 2: Clone Repository (lần đầu)

```bash
git clone https://github.com/your-repo/ttn-web.git
cd ttn-web
```

## Bước 3: Deploy

```bash
# Pull latest code (không pull .env vì nó ignored)
git pull origin main

# Build images
docker-compose -f docker-compose.prod.yaml build

# Start services
docker-compose -f docker-compose.prod.yaml up -d
```

## Bước 4: Verify Deployment

### Check containers:

```bash
docker ps
```

Phải thấy:

- `ttn-postgres-prod`
- `ttn-minio-prod`
- `ttn-backend-prod`
- `ttn-web-prod`
- `ttn-nginx-prod`

### Check logs:

```bash
docker logs ttn-backend-prod
docker logs ttn-web-prod
```

### Health check:

```bash
curl http://localhost:4000/health  # Backend
curl http://localhost:3000         # Frontend
curl https://timviec.vieclamhr.com # Qua Nginx
```

## Troubleshooting

### Backend không start:

```bash
docker logs ttn-backend-prod
# Kiểm tra DATABASE_URL, MINIO_ENDPOINT
```

### Frontend lỗi API:

- Kiểm tra `NEXT_PUBLIC_API_ENDPOINT` trong build args
- Kiểm tra `INTERNAL_API_URL` cho SSR

### MinIO không accessible:

- Kiểm tra `MINIO_PUBLIC_URL` đúng domain
- Verify Nginx reverse proxy config

## Update Deployment

```bash
git pull origin main
docker-compose -f docker-compose.prod.yaml build
docker-compose -f docker-compose.prod.yaml up -d
```

## Rollback

```bash
git checkout <previous-commit>
docker-compose -f docker-compose.prod.yaml build
docker-compose -f docker-compose.prod.yaml up -d
```

## Lưu Ý Bảo Mật

> [!CAUTION]
>
> - **KHÔNG BAO GIỜ** commit file `.env.production` vào Git
> - Thay đổi tất cả secrets trước khi deploy production
> - Backup file `.env.production` ở nơi an toàn (password manager)
> - Revoke credentials cũ nếu đã bị lộ trong Git history
