# Fashion Store E-commerce System

Hệ thống thương mại điện tử thời trang với React, Node.js, Prisma, và AI Chatbot.

## 🚀 Quick Start

### Yêu cầu
- Node.js 18+
- MySQL/MariaDB
- (Optional) Ollama với model gemini-3-flash-preview:cloud cho AI chatbot và tích hợp tính năng

### Cài đặt

1. **Clone và cài đặt dependencies:**
```bash
# Backend
cd backend
npm install
npx prisma generate

# Frontend
cd ../frontend
npm install
```

2. **Cấu hình environment:**
```bash
# Copy file .env.example
cp backend/.env.example backend/.env
# Chỉnh sửa DATABASE_URL và JWT_SECRET
```

3. **Import database:**
```bash
mysql -u root -p fashion_store < fashion_store.sql
```

4. **Chạy ứng dụng:**
```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend  
cd frontend
npm run dev
```

5. **Truy cập:**
- Frontend: http://localhost:5173
- Backend API: http://localhost:4000

## 🐳 Docker Deployment

```bash
# Chạy toàn bộ stack
docker-compose up -d

# Xem logs
docker-compose logs -f
```

## 📁 Project Structure

```text
ShopFeshen/
├── backend/
│   ├── src/
│   │   ├── controllers/    # Xử lý các yêu cầu API (Request Handlers)
│   │   ├── middlewares/    # Xác thực, Kiểm tra dữ liệu, Xử lý lỗi
│   │   ├── routes/         # Định tuyến API Express
│   │   ├── services/       # Logic nghiệp vụ cốt lõi (AI, Ollama, Sản phẩm)
│   │   ├── utils/          # Các hàm tiện ích hỗ trợ (Logger, DeepDiff, Hash)
│   │   ├── validators/     # Lược đồ cấu trúc dữ liệu Zod (Zod Data Schemas)
│   │   └── server.ts       # Điểm bắt đầu của ứng dụng (Entry Point)
│   └── prisma/
│       └── schema.prisma   # Mô hình & cấu trúc cơ sở dữ liệu
├── frontend/
│   ├── src/
│   │   ├── components/     # Các Component UI dùng chung (Admin, Common, Shop)
│   │   ├── contexts/       # React Context Providers (Auth, Cart, Theme, Socket)
│   │   ├── hooks/          # Các Custom Hooks của React
│   │   ├── pages/          # Các trang (Page Components)
│   │   ├── services/       # API Client (Axios) và các Endpoints
│   │   ├── types/          # Định nghĩa kiểu dữ liệu TypeScript
│   │   └── utils/          # Các hàm hỗ trợ cho Frontend
│   └── index.html          # File HTML gốc (Template)
├── public/                 # Các file tĩnh (Tài nguyên) & Hình ảnh tải lên
└── docker-compose.yml      # File cấu hình triển khai Docker Compose
```

## ✨ Features

### 🛍️ Giao diện cửa hàng (Elegant UI)
- **Thiết kế hiện đại:** Bố cục thanh lịch mang phong cách Paris, lưới danh mục Bento Box, sử dụng phông chữ Playfair Display.
- **Trang chủ:** Banner chính nổi bật, các khu vực Flash Sale được chọn lọc và các sản phẩm mới về.
- **Trang mua sắm:** Các chức năng lọc nâng cao, tìm kiếm, sắp xếp và phân trang.
- **Chi tiết sản phẩm:** Thư viện hình ảnh, lựa chọn biến thể và gợi ý các sản phẩm liên quan.
- **Đánh giá & Xếp hạng:** Đánh giá từ người dùng với huy hiệu "Đã Mua Hàng" và chức năng tải ảnh lên.
- **Giỏ hàng & Thanh toán:** Kiểm tra hàng tồn kho theo thời gian thực và hỗ trợ đa phương thức thanh toán.
- **Tài khoản người dùng:** Xác thực JWT, quản lý hồ sơ cá nhân và xem lại lịch sử đơn hàng chi tiết.
- **Các trang Thông tin:** Giao diện Về Chúng Tôi (About Us) và Liên Hệ (Contact Us) được thiết kế lại với tích hợp API động.

### 🤖 Tích hợp Trí tuệ Nhân tạo (AI) & Cá nhân hóa
- **Tìm kiếm bằng hình ảnh (Visual Search):** Tải hình ảnh lên để tìm các sản phẩm có giao diện tương tự. 
  - *Áp dụng AI:* Được hỗ trợ bởi các mô hình thị giác Ollama để trích xuất các thuộc tính thời trang có cấu trúc.
  - *Thuật toán dự phòng:* Khi AI ngoại tuyến, hệ thống chuyển sang sử dụng phương pháp đối chiếu kép - Băm hình khối (Perceptual Hashing - pHash) và Biểu đồ Phân bổ Màu (Color Histograms) thông qua `sharp` để tìm các sản phẩm trùng khớp về bố cục và màu sắc.
- **Nhà tạo mẫu ảo (RAG Chatbot):** Bot trò chuyện tự động nhận biết ngữ cảnh, am hiểu kho hàng của cửa hàng và cung cấp các lời khuyên thời trang được cá nhân hóa.
- **Trang chủ Cá nhân hóa:** Gợi ý sản phẩm phù hợp dựa trên lịch sử duyệt web và mua hàng của người dùng.

### 💼 Bảng điều khiển Quản trị viên (Admin Dashboard)
- **Phân tích dữ liệu Nâng cao:** Cung cấp biểu đồ toàn diện, biểu đồ tròn và máy đo theo dõi theo doanh số bán hàng, doanh thu và các chỉ số khách hàng.
- **Quản lý Sản phẩm:** Đầy đủ các hoạt động CRUD cho sản phẩm, các biến thể và bộ sưu tập hình ảnh.
- **Quản lý Đơn hàng:** Theo dõi và cập nhật trạng thái đơn hàng.
- **Nhật ký Hệ thống (System Logs):** Trình ghi nhật ký tùy chỉnh sở hữu Trình xem chênh lệch JSON Nâng cao (Advanced JSON Diff Viewer) và khả năng xóa hàng loạt.
- **Cài đặt chung:** Bật/Tắt Chế độ Bảo trì (Maintenance Mode) và quản lý các thiết lập chung của cửa hàng.

## 🔧 Các Endpoints API Chính

| Method | Endpoint | Mô tả chi tiết |
|--------|----------|-------------|
| POST | `/api/auth/register` | Đăng ký người dùng |
| POST | `/api/auth/login` | Đăng nhập người dùng |
| GET | `/api/products` | Danh sách sản phẩm phân trang |
| GET | `/api/products/:slug` | Xem chi tiết sản phẩm |
| POST | `/api/ai/visual-search` | Tìm kiếm đồ dựa vào ảnh|
| POST | `/api/chat` | Tương tác hệ thống tư vấn thời trang AI ảo |
| GET | `/api/cart` | Lấy dữ liệu giỏ hàng người dùng |
| POST | `/api/orders/checkout` | Xử lý thanh toán mua hàng |

## 🛠️ Tech Stack (Ngăn xếp Công nghệ)

- **Frontend:** React 18, TypeScript, Tailwind CSS, Vite, React Router, Lucide Icons
- **Backend:** Node.js, Express, TypeScript, Prisma ORM
- **Database:** MySQL / MariaDB
- **AI / ML:** Ollama (gemini-3-flash-preview:cloud / Mistral) phân tích hình ảnh và NLP
- **Xử lý Ảnh:** `sharp` (dành cho thuật toán tìm kiếm dự phòng và tương tác hình ảnh)
- **Triển khai (Deployment):** Docker, Docker Compose, Nginx

## 📝 License

MIT License
