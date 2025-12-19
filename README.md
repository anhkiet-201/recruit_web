# RecruitWeb - Modern Recruitment Platform

RecruitWeb là một nền tảng tuyển dụng hiện đại, được thiết kế với trải nghiệm người dùng cao cấp (Premium UI/UX) và kiến trúc hệ thống mạnh mẽ. Dự án cung cấp giải pháp toàn diện cho cả Nhà tuyển dụng và Ứng viên.

## 🚀 Công nghệ sử dụng

### Frontend
- **Framework**: Next.js 15+ (App Router)
- **Styling**: Tailwind CSS (Modern "Premium Soft" design system)
- **Icons**: Lucide React
- **State Management**: React Context API
- **Performance**: Server-side Pagination, Image Optimization, Lazy Loading

### Backend
- **Framework**: NestJS (Node.js)
- **Database**: PostgreSQL with Prisma ORM
- **Storage**: MinIO (S3 Compatible Object Storage)
- **Automation**: NestJS Schedule (Cron Jobs)
- **Features**: JWT Authentication, Excel (XLSX) Processing, Multer for file uploads

### Infrastructure
- **Docker**: Container hóa Database (Postgres) và Storage (MinIO)
- **Environment**: Cấu hình tách biệt cho Development và Production

## ✨ Tính năng chính

### Dành cho Ứng viên
- **Trang chủ hiện đại**: Tìm kiếm việc làm thông minh với bộ lọc loại nhân lực (Phổ thông, Chuyên gia...).
- **Gợi ý thông minh**: Autocomplete cho tên công việc, kỹ năng và địa điểm.
- **Hồ sơ chuyên nghiệp**: Dashboard cá nhân quản lý thông tin học vấn, kỹ năng và CV.
- **Ứng tuyển mượt mà**: Popup ứng tuyển thông minh, tự động điền thông tin và đồng bộ hồ sơ.
- **Theo dõi trạng thái**: Xem lịch sử ứng tuyển và trạng thái hồ sơ theo thời gian thực.

### Dành cho Nhà tuyển dụng (Admin)
- **Bảng điều khiển (Admin Dashboard)**: Thống kê trực quan số lượng việc làm, hồ sơ và người dùng.
- **Quản lý Việc làm**: 
  - Tạo mới, chỉnh sửa và xóa tin tuyển dụng.
  - Thao tác hàng loạt (Bulk Actions): Đóng/Mở tin, xóa hàng loạt.
  - Nhập liệu nhanh: Import hàng trăm công việc từ file Excel.
  - Theo dõi lượt xem thực tế của từng tin tuyển dụng.
- **Quản lý Hồ sơ**: Hệ thống lọc ứng viên chuyên sâu, xem CV trực tuyến và cập nhật trạng thái hồ sơ.
- **Quản lý Người dùng**: Phân quyền (Admin/Candidate) và quản lý tài khoản hệ thống.

### Tối ưu hóa hệ thống
- **Tự động hóa**: Cron Job tự động đóng các Job hết hạn và chuyển hồ sơ sang trạng thái History.
- **Dọn dẹp Storage**: Tự động xóa file cũ trên Cloud khi người dùng cập nhật hoặc xóa ảnh/CV.
- **Performance**: Phân trang hoàn toàn ở Backend để xử lý dữ liệu lớn.

## 🛠 Hướng dẫn cài đặt

### 1. Chuẩn bị môi trường
- Cài đặt Node.js (v20+)
- Cài đặt Docker và Docker Compose

### 2. Khởi chạy Infrastructure (Database & Storage)
```bash
docker compose up -d
```

### 3. Cấu hình Backend
```bash
cd backend
npm install
npx prisma db push
npm run start:dev
```

### 4. Khởi chạy Frontend
```bash
cd frontend
npm install
npm run dev
```

## ⚙️ Cấu hình môi trường (.env)

Dự án yêu cầu các file `.env` tại thư mục `backend/` và `frontend/` để hoạt động chính xác.

### Backend (`backend/.env`)
```env
# Database Configuration (PostgreSQL)
DATABASE_URL="postgresql://user:password@localhost:5432/ttn_db"

# Security
JWT_SECRET="your-super-secret-key"

# Object Storage (MinIO / S3)
MINIO_ENDPOINT="localhost"
MINIO_PORT=9000
MINIO_ACCESS_KEY="minioadmin"
MINIO_SECRET_KEY="minioadmin"
MINIO_BUCKET="ttn-bucket"
MINIO_USE_SSL="false"

# Public URL for File Access (Optional - Use for CDN/S3)
MINIO_PUBLIC_URL=""
```

### Frontend (`frontend/.env`)
```env
# URL của Backend API
NEXT_PUBLIC_API_URL="http://localhost:4001"
```

## 🎨 Ngôn ngữ thiết kế: Premium Soft
Dự án áp dụng ngôn ngữ thiết kế nhất quán cho toàn bộ hệ thống:
- **Bo góc cực đại**: `rounded-[2.5rem]` tạo sự mềm mại.
- **Đổ bóng đa lớp**: `shadow-xl` tạo chiều sâu sang trọng.
- **Glassmorphism**: Hiệu ứng kính mờ `backdrop-blur-xl` trên thanh điều hướng và các bộ lọc.
- **Interactive UI**: Hiệu ứng phản hồi vật lý (`active:scale-95`) và chuyển động mượt mà.

---
Phát triển bởi Aki dev.
