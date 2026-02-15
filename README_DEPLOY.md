# Hướng dẫn triển khai ShopFeshen (Localhost với Docker)

Tài liệu này hướng dẫn cách chạy toàn bộ ứng dụng ShopFeshen (Backend, Frontend, Database, Redis) trên máy local sử dụng Docker Compose.

## 1. Yêu cầu

- Đã cài đặt [Docker Desktop](https://www.docker.com/products/docker-desktop/) và Docker Compose.
- Đảm bảo các cổng sau đang trống: `4000`, `8081` (MySQL), `8082` (Web), `6379` (Redis).
  - *Lưu ý: MySQL chạy cổng 8081 để tránh xung đột nếu máy bạn đang chạy MySQL local ở cổng 3306 hoặc 8080.*

## 2. Cấu hình

File cấu hình chính nằm tại `docker-compose.yml` và `backend/.env`.
Hệ thống đã được thiết lập sẵn để chạy ngay.

**Các thông tin quan trọng:**
- **Web App:** http://localhost:5173
- **API:** http://localhost:4000
- **Database:** `localhost:8081` (User: `root`, Pass: `hoang`, DB: `fashion_store`)
- **Redis:** `localhost:6379`

## 3. Chạy ứng dụng

Mở Terminal tại thư mục gốc của dự án (`ShopFeshen/`) và chạy lệnh sau:

```bash
docker-compose up --build -d
```

- `--build`: Build lại image mới nhất từ code.
- `-d`: Chạy ngầm (detach mode).

Để xem logs (nếu cần debug):
```bash
docker-compose logs -f
```

Để dừng ứng dụng:
```bash
docker-compose down
```

## 4. Khởi tạo dữ liệu (Lần đầu chạy)

Khi chạy lần đầu, Database sẽ rỗng. Backend sẽ tự động đẩy schema (tables) lên DB khi khởi động (nhờ lệnh `prisma db push` trong CMD).

Nếu bạn muốn import dữ liệu mẫu (như danh mục, sản phẩm), có thể dùng script `seed` hoặc file SQL import thủ công vào DB qua trình quản lý DB (DBeaver, MySQL Workbench) kết nối vào cổng `8081`.

## 5. Lưu ý về Frontend

Frontend được build tĩnh và phục vụ bởi Nginx. Nếu bạn sửa code frontend, bạn cần chạy lại `docker-compose up --build` để áp dụng thay đổi.
Nginx đã được cấu hình proxy để gọi API backend nội bộ.
