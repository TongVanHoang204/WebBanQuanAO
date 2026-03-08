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

Truy cập: http://localhost:3000

## 📁 Project Structure

```
ShopFeshen/
├── backend/
│   ├── src/
│   │   ├── controllers/    # API controllers
│   │   ├── middlewares/    # Auth, error handlers
│   │   ├── routes/         # Express routes
│   │   ├── validators/     # Zod schemas
│   │   └── server.ts       # Entry point
│   └── prisma/
│       └── schema.prisma   # Database schema
├── frontend/
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── contexts/       # Auth, Cart providers
│   │   ├── hooks/          # Custom hooks
│   │   ├── pages/          # Page components
│   │   └── services/       # API client
│   └── index.html
└── docker-compose.yml
```

## ✨ Features

### Storefront
- 🏠 Home page với hero banner, flash sales, new arrivals
- 🛍️ Shop page với filters, search, sort, pagination
- 📦 Product detail với image gallery, variant selector
- 🛒 Cart với stock validation
- 💳 Checkout với nhiều phương thức thanh toán
- 👤 User authentication (JWT)
- 📋 Order history

### AI Chatbot
- 🤖 RAG-based product recommendations
- 💬 Floating chat widget
- 🔍 Product search trong context

### Admin (APIs ready)
- CRUD sản phẩm với variants
- Quản lý đơn hàng
- Dashboard stats

## 🔧 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/auth/register | Đăng ký |
| POST | /api/auth/login | Đăng nhập |
| GET | /api/products | Lấy danh sách sản phẩm |
| GET | /api/products/:slug | Chi tiết sản phẩm |
| GET | /api/categories | Danh mục |
| GET | /api/cart | Giỏ hàng |
| POST | /api/cart/add | Thêm vào giỏ |
| POST | /api/orders/checkout | Đặt hàng |
| POST | /api/chat | AI chatbot |

## 🛠️ Tech Stack

- **Frontend:** React 18, TypeScript, Tailwind CSS, Vite
- **Backend:** Node.js, Express, TypeScript, Prisma
- **Database:** MySQL/MariaDB
- **AI:** Ollama (llama3/mistral)
- **Deploy:** Docker, Nginx

## 📝 License

MIT License
