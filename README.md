# TTN-Hr - Nền tảng Tuyển dụng Thông minh thế hệ mới

TTN-Hr là một nền tảng tuyển dụng hiện đại, được thiết kế với trải nghiệm người dùng cao cấp (Premium UI/UX) và tích hợp sâu rộng Trí tuệ nhân tạo (AI) để mang lại hiệu quả vượt trội cho cả Nhà tuyển dụng và Ứng viên.

## 🚀 Công nghệ sử dụng

### Frontend

- **Framework**: Next.js 15+ (App Router)
- **Styling**: Tailwind CSS với hệ thống thiết kế **"Premium Soft"** (Glassmorphism, bo góc cực đại, đổ bóng đa lớp).
- **Icons**: Lucide React

### Backend

- **Framework**: NestJS (Node.js)
- **Database**: PostgreSQL với **pgvector** (Vector Database) & Prisma ORM.
- **Storage**: MinIO (S3 Compatible).
- **AI**: Google Gemini (Hỗ trợ mô hình Embedding và Chat), tích hợp **Abstraction Layer** để dễ dàng mở rộng sang OpenAI.
- **Automation**: NestJS Schedule (Cron Jobs).

## ✨ Tính năng nổi bật

### 🧠 Trí tuệ nhân tạo (AI-Powered)

- **Tìm kiếm Ngữ nghĩa (Semantic Search)**: Tìm kiếm công việc bằng ngôn ngữ tự nhiên (ví dụ: "công việc về dữ liệu").
- **AI Reranking**: AI tự động kiểm duyệt và xếp hạng lại kết quả tìm kiếm để đảm bảo độ chính xác cao nhất.
- **Trợ lý Chatbot AI Thông minh**:
  - **Thấu hiểu ngữ nghĩa sâu**: Sử dụng `system.md` và `user_context.md` để hiểu sâu về kỹ năng và kinh nghiệm người dùng.
  - **Tự động Tìm kiếm (RAG)**: AI chủ động sử dụng công cụ tìm kiếm khi phát hiện nhu cầu của người dùng, sau đó phân tích kết quả trả về từ Database để tư vấn chính xác.
  - **Vòng lặp phản hồi (Feedback Loop)**: Cơ chế "Hidden Event" giúp AI tự động tóm tắt kết quả tìm kiếm thực tế ngay sau khi điều hướng người dùng.
  - **Cá nhân hóa theo CV**: So khớp Vector Embedding của người dùng với Database Job để đưa ra nhận định về trình độ chuyên môn.
- **Phân tích CV tự động**: Tự động đọc và bóc tách thông tin từ file CV (PDF) để điền vào hồ sơ người dùng.
- **Vector hóa dữ liệu**: Mọi công việc, hồ sơ người dùng và lịch sử tìm kiếm đều được chuyển thành Vector để AI có thể hiểu sâu về ngữ nghĩa.

### 👤 Dành cho Ứng viên

- **Giao diện "Premium Soft"**: Trải nghiệm tìm việc mượt mà, sang trọng.
- **Gợi ý thông minh**: Autocomplete cho Tên công việc, Kỹ năng và Địa điểm.
- **Dashboard toàn năng**: Quản lý thông tin cá nhân, học vấn, kỹ năng và tải lên CV/Avatar.
- **Ứng tuyển 1 chạm**: Popup ứng tuyển tự động điền thông tin và hỗ trợ tải CV linh hoạt.

### 🏢 Dành cho Nhà tuyển dụng (Admin)

- **Bảng điều khiển trực quan**: Thống kê số liệu hệ thống theo thời gian thực.
- **Quản lý đa năng**: Thao tác hàng loạt (Bulk Actions), bộ lọc chuyên sâu và quản lý chi tiết (Jobs, Applications, Users).
- **Tự động hóa tuyển dụng**:
  - Import hàng trăm công việc từ file Excel.
  - Tự động đóng các Job hết hạn và lưu trữ hồ sơ.
- **Dọn dẹp thông minh**: Tự động xóa file trên Cloud khi dữ liệu thay đổi, tối ưu dung lượng.

## 🛠 Hướng dẫn cài đặt

### 1. Chuẩn bị môi trường

- Cài đặt Node.js (v20+)
- Cài đặt Docker và Docker Compose

### 2. Cấu hình môi trường (`.env`)

Tạo file `.env` trong thư mục `backend/` và `frontend/`.

#### `backend/.env`

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/ttn_db"

# Security
JWT_SECRET="your-super-secret-key"

# AI Configuration (Quan trọng)
AI_API_KEY="your-gemini-api-key-here"
AI_EMBEDDING_MODEL="text-embedding-004"
AI_CHAT_MODEL="gemini-1.5-flash"

# Object Storage (MinIO)
MINIO_ENDPOINT="localhost"
MINIO_PORT=9000
MINIO_ACCESS_KEY="minioadmin"
MINIO_SECRET_KEY="minioadmin"
MINIO_BUCKET="ttn-bucket"
MINIO_USE_SSL="false"
MINIO_PUBLIC_URL=""
```

#### `frontend/.env`

```env
NEXT_PUBLIC_API_URL="http://localhost:4001"
```

### 3. Khởi chạy hệ thống

```bash
# Bật Database và Storage
docker compose up -d

# Cài đặt và chạy Backend
cd backend
npm install
npx prisma db push
npm run start:dev

# Mở terminal mới, cài đặt và chạy Frontend
cd frontend
npm install
npm run dev
```

Sau đó, truy cập `http://localhost:3000` để bắt đầu.

---

Phát triển bởi đội ngũ kỹ thuật TTN-Hr.
