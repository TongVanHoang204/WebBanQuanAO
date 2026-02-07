# Hướng dẫn Triển khai (Deployment Guide)

Tài liệu này hướng dẫn cách build và deploy ứng dụng ShopFeshen (Frontend + Backend).

## 1. Chuẩn bị Môi trường

Yêu cầu:
- Node.js >= 18
- MySQL (Database)
- Host/VPS (Ubuntu) hoặc PaaS (Vercel, Render)

---

## 2. Cấu hình Biến môi trường (.env)

### Backend (.env)
Tạo file `backend/.env` dựa trên `backend/.env.example`:

```env
PORT=4000
DATABASE_URL="mysql://user:password@host:3306/db_name"
JWT_SECRET="your_jwt_secret_key"
FRONTEND_URL="https://your-frontend-domain.com"
CORS_ALLOWED_ORIGINS="https://your-frontend-domain.com,http://localhost:5173"

# VNPay Config (Thanh toán)
VNP_TMN_CODE="your_tmn_code"
VNP_HASH_SECRET="your_hash_secret"
VNP_RETURN_URL="https://your-frontend-domain.com/payment/vnpay-return"
```

### Frontend (.env)
Tạo file `frontend/.env` (hoặc cấu hình trên Vercel):

```env
VITE_API_URL="https://your-backend-domain.com/api"
```

---

## 3. Cách Build & Chạy (Thủ công / VPS)

### Backend
1. Cài đặt dependencies:
   ```bash
   cd backend
   npm install
   ```
2. Build TypeScript:
   ```bash
   npm run build
   ```
3. Cập nhật Database (Prisma):
   ```bash
   npx prisma migrate deploy
   npx prisma generate
   ```
4. Chạy server:
   ```bash
   npm start
   ```
   (Khuyến nghị dùng PM2: `pm2 start dist/server.js --name "shop-backend"`)

### Frontend
1. Cài đặt dependencies:
   ```bash
   cd frontend
   npm install
   ```
2. Build static files:
   ```bash
   npm run build
   ```
3. Serve thư mục `dist`:
   - Dùng Nginx (khuyến nghị)
   - Hoặc `serve -s dist`

---

## 4. Triển khai lên Cloud (Miễn phí / Giá rẻ)

### Frontend (Vercel / Netlify)
1. Push code lên GitHub.
2. Kết nối Vercel với repo GitHub.
3. Cấu hình:
   - Framework Preset: **Vite**
   - Root Directory: `frontend`
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - **Environment Variables**: Thêm `VITE_API_URL` trỏ về Backend.

### Backend (Render / Railway)
1. Kết nối Render/Railway với repo GitHub.
2. Root Directory: `backend`
3. Build Command: `npm install && npm run build`
4. Start Command: `npm start`
5. **Environment Variables**: Thêm `DATABASE_URL`, `JWT_SECRET`, `FRONTEND_URL`, `CORS_ALLOWED_ORIGINS`, `VNP_...`.
6. **Security**: Nếu từng commit `.env`, hãy rotate ngay các khóa quan trọng (`DATABASE_URL`, `JWT_SECRET`, OAuth, SMTP, RapidAPI).

### Database (MySQL)
- Sử dụng **Railway**, **PlanetScale**, hoặc **Aiven** để tạo MySQL Database miễn phí/giá rẻ.
- Lấy connection string và dán vào `DATABASE_URL`.

---

## 5. Cấu hình Nginx (Nếu dùng VPS)

Ví dụ cấu hình Nginx để serve Frontend và proxy Backend:

```nginx
server {
    listen 80;
    server_name your-domain.com;

    # Frontend
    location / {
        root /var/www/shop-feshen/frontend/dist;
        try_files $uri $uri/ /index.html;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:4000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```
