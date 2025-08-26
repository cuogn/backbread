# 🚀 Hướng dẫn Setup Dự án Bánh Mì Sơn

## 📋 Tổng quan dự án

Dự án bao gồm:
- **Frontend**: Next.js với TypeScript, Tailwind CSS
- **Backend**: Node.js, Express.js, MariaDB
- **Database**: MariaDB với schema được thiết kế sẵn

## 🛠 Yêu cầu hệ thống

- **Node.js**: 16.x hoặc cao hơn
- **npm**: 8.x hoặc cao hơn
- **MariaDB**: 10.x hoặc MySQL 8.x
- **Git**: Để clone repository

## 📦 Cài đặt MariaDB

### Windows
1. Tải MariaDB từ: https://mariadb.org/download/
2. Hoặc cài đặt XAMPP: https://www.apachefriends.org/
3. Khởi động MariaDB service

### macOS
```bash
# Cài đặt qua Homebrew
brew install mariadb
brew services start mariadb

# Thiết lập bảo mật (optional)
mysql_secure_installation
```

### Ubuntu/Linux
```bash
sudo apt update
sudo apt install mariadb-server mariadb-client
sudo systemctl start mariadb
sudo systemctl enable mariadb

# Thiết lập bảo mật (optional)
sudo mysql_secure_installation
```

## 🗄 Setup Database

### 1. Tạo database
```bash
# Đăng nhập MySQL/MariaDB
mysql -u root -p

# Tạo database
CREATE DATABASE banh_mi_son CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

# Tạo user (optional)
CREATE USER 'banhmi_user'@'localhost' IDENTIFIED BY 'your_password';
GRANT ALL PRIVILEGES ON banh_mi_son.* TO 'banhmi_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

### 2. Import schema
```bash
# Từ thư mục root của project
mysql -u root -p banh_mi_son < database/schema.sql
```

## 🔧 Setup Backend

### 1. Cài đặt dependencies
```bash
cd backend
npm install
```

### 2. Cấu hình environment
```bash
# Tạo file .env từ template
cp env.example .env

# Chỉnh sửa file .env
nano .env
```

Cấu hình file `.env`:
```env
# Server Configuration
NODE_ENV=development
PORT=5000
API_BASE_URL=http://localhost:5000

# Database Configuration
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_database_password
DB_NAME=banh_mi_son

# JWT Configuration
JWT_SECRET=your_super_secret_jwt_key_here
JWT_EXPIRES_IN=7d

# CORS Configuration
FRONTEND_URL=http://localhost:3000

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

### 3. Chạy migration (nếu chưa import schema)
```bash
npm run migrate
```

### 4. Khởi động backend server
```bash
# Development mode
npm run dev

# Production mode
npm start
```

Backend sẽ chạy tại: http://localhost:5000

## 🎨 Setup Frontend

### 1. Cài đặt dependencies
```bash
cd ../  # Quay về thư mục root
npm install
```

### 2. Cấu hình environment (nếu cần)
```bash
# Tạo file .env.local (optional)
touch .env.local
```

Thêm vào `.env.local` nếu cần:
```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

### 3. Khởi động frontend
```bash
npm run dev
```

Frontend sẽ chạy tại: http://localhost:3000

## 🔍 Kiểm tra setup

### 1. Kiểm tra backend
```bash
# Health check
curl http://localhost:5000/health

# API info
curl http://localhost:5000/api

# Lấy danh sách sản phẩm
curl http://localhost:5000/api/products
```

### 2. Kiểm tra frontend
- Mở trình duyệt: http://localhost:3000
- Kiểm tra các trang: Menu, Cart, Checkout

### 3. Kiểm tra database
```sql
-- Đăng nhập database
mysql -u root -p banh_mi_son

-- Kiểm tra tables
SHOW TABLES;

-- Kiểm tra dữ liệu mẫu
SELECT * FROM products LIMIT 5;
SELECT * FROM categories;
SELECT * FROM branches;
```

## 📊 Cấu trúc dự án

```
SonBreadProject/
├── backend/                 # Backend API
│   ├── src/
│   │   ├── config/         # Database & app config
│   │   ├── models/         # Database models
│   │   ├── routes/         # API routes
│   │   ├── middleware/     # Express middleware
│   │   └── server.js       # Main server file
│   ├── database/           # Database schema
│   ├── uploads/            # File uploads
│   └── package.json
├── database/
│   └── schema.sql          # Database schema
├── src/                    # Frontend Next.js
│   ├── components/
│   ├── pages/
│   ├── contexts/
│   ├── hooks/
│   ├── stores/
│   └── types/
└── package.json
```

## 🚀 Chạy dự án

### Development mode
```bash
# Terminal 1: Backend
cd backend
npm run dev

# Terminal 2: Frontend  
cd ../
npm run dev
```

### Production mode
```bash
# Backend
cd backend
npm start

# Frontend
npm run build
npm start
```

## 🔧 Troubleshooting

### Lỗi kết nối database
```bash
# Kiểm tra MariaDB có chạy không
sudo systemctl status mariadb

# Khởi động MariaDB
sudo systemctl start mariadb

# Kiểm tra port
netstat -tlnp | grep :3306
```

### Lỗi port đã sử dụng
```bash
# Tìm process sử dụng port
lsof -i :5000
lsof -i :3000

# Kill process
kill -9 <PID>
```

### Reset database
```bash
# Xóa và tạo lại database
mysql -u root -p -e "DROP DATABASE IF EXISTS banh_mi_son; CREATE DATABASE banh_mi_son CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"

# Import lại schema
mysql -u root -p banh_mi_son < database/schema.sql
```

## 📝 API Testing

### Sử dụng curl
```bash
# Lấy danh sách sản phẩm
curl http://localhost:5000/api/products

# Lấy danh mục
curl http://localhost:5000/api/categories

# Tạo đơn hàng
curl -X POST http://localhost:5000/api/orders \
  -H "Content-Type: application/json" \
  -d '{
    "items": [{"product": {"id": 1, "name": "Bánh Mì Pate", "price": 25000}, "quantity": 2}],
    "customerInfo": {"name": "Test User", "phone": "0123456789", "address": "Test Address"},
    "branch_id": 1,
    "payment_method_id": 1,
    "total_amount": 50000
  }'
```

### Sử dụng Postman
Import collection từ file `backend/postman_collection.json` (nếu có)

## 🎯 Tính năng chính

### Frontend
- ✅ Trang chủ với banner và sản phẩm nổi bật
- ✅ Trang menu với filter theo danh mục
- ✅ Giỏ hàng với tính năng thêm/xóa/sửa
- ✅ Trang checkout với form thông tin khách hàng
- ✅ Chọn chi nhánh và phương thức thanh toán
- ✅ Responsive design cho mobile

### Backend API
- ✅ RESTful API với JSON response
- ✅ CRUD operations cho tất cả entities
- ✅ Validation dữ liệu đầu vào
- ✅ Error handling tập trung
- ✅ Rate limiting và security
- ✅ Database connection pooling

### Database
- ✅ Normalized database schema
- ✅ Foreign key constraints
- ✅ Sample data được tạo sẵn
- ✅ Indexes cho performance

## 📞 Hỗ trợ

Nếu gặp vấn đề trong quá trình setup:
1. Kiểm tra logs trong console
2. Đảm bảo tất cả services đang chạy
3. Kiểm tra file .env có đúng không
4. Xem lại hướng dẫn troubleshooting

Chúc bạn setup thành công! 🎉
