# Bánh Mì Sơn - Backend API

Backend API cho website Bánh Mì Sơn, được xây dựng bằng Node.js, Express và MariaDB.

## 🚀 Tính năng

- **Quản lý sản phẩm**: CRUD operations cho bánh mì và các món ăn
- **Quản lý danh mục**: Phân loại sản phẩm theo danh mục
- **Quản lý đơn hàng**: Tạo, theo dõi và cập nhật trạng thái đơn hàng
- **Quản lý chi nhánh**: Thông tin các chi nhánh cửa hàng
- **Phương thức thanh toán**: Hỗ trợ nhiều phương thức thanh toán
- **API RESTful**: Chuẩn REST API với JSON response
- **Validation**: Kiểm tra dữ liệu đầu vào với Joi
- **Error handling**: Xử lý lỗi tập trung
- **Rate limiting**: Giới hạn số lượng request
- **Security**: Bảo mật với Helmet, CORS

## 🛠 Công nghệ sử dụng

- **Runtime**: Node.js 16+
- **Framework**: Express.js
- **Database**: MariaDB/MySQL
- **Validation**: Joi
- **Security**: Helmet, CORS, Express Rate Limit
- **Logging**: Morgan
- **Environment**: dotenv

## 📦 Cài đặt

### 1. Cài đặt dependencies

```bash
cd backend
npm install
```

### 2. Cấu hình environment

Tạo file `.env` từ template:

```bash
cp env.example .env
```

Chỉnh sửa file `.env`:

```env
# Server Configuration
NODE_ENV=development
PORT=5000
API_BASE_URL=http://localhost:5000

# Database Configuration
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=banh_mi_son

# CORS Configuration
FRONTEND_URL=http://localhost:3000
```

### 3. Cài đặt MariaDB

#### Windows:
```bash
# Tải và cài đặt MariaDB từ: https://mariadb.org/download/
# Hoặc dùng XAMPP: https://www.apachefriends.org/
```

#### macOS:
```bash
brew install mariadb
brew services start mariadb
```

#### Ubuntu/Debian:
```bash
sudo apt update
sudo apt install mariadb-server
sudo systemctl start mariadb
```

### 4. Tạo database và chạy migration

```bash
# Tạo database và tables
npm run migrate

# Hoặc chạy thủ công
mysql -u root -p < database/schema.sql
```

### 5. Khởi động server

```bash
# Development mode
npm run dev

# Production mode
npm start
```

Server sẽ chạy tại: http://localhost:5000

## 📚 API Endpoints

### Health Check
- `GET /health` - Kiểm tra trạng thái server

### Products (Sản phẩm)
- `GET /api/products` - Lấy danh sách sản phẩm
- `GET /api/products/:id` - Lấy chi tiết sản phẩm
- `GET /api/products/category/:categoryId` - Lấy sản phẩm theo danh mục
- `POST /api/products` - Tạo sản phẩm mới
- `PUT /api/products/:id` - Cập nhật sản phẩm
- `DELETE /api/products/:id` - Xóa sản phẩm

### Categories (Danh mục)
- `GET /api/categories` - Lấy danh sách danh mục
- `GET /api/categories/with-count` - Lấy danh mục với số lượng sản phẩm
- `GET /api/categories/:id` - Lấy chi tiết danh mục
- `POST /api/categories` - Tạo danh mục mới
- `PUT /api/categories/:id` - Cập nhật danh mục
- `DELETE /api/categories/:id` - Xóa danh mục

### Orders (Đơn hàng)
- `GET /api/orders` - Lấy danh sách đơn hàng
- `GET /api/orders/:id` - Lấy chi tiết đơn hàng
- `GET /api/orders/code/:orderCode` - Lấy đơn hàng theo mã
- `POST /api/orders` - Tạo đơn hàng mới
- `PUT /api/orders/:id/status` - Cập nhật trạng thái đơn hàng
- `GET /api/orders/stats/overview` - Thống kê đơn hàng

### Branches (Chi nhánh)
- `GET /api/branches` - Lấy danh sách chi nhánh
- `GET /api/branches/:id` - Lấy chi tiết chi nhánh
- `POST /api/branches` - Tạo chi nhánh mới
- `PUT /api/branches/:id` - Cập nhật chi nhánh
- `DELETE /api/branches/:id` - Xóa chi nhánh

### Payment Methods (Phương thức thanh toán)
- `GET /api/payment-methods` - Lấy danh sách phương thức thanh toán
- `GET /api/payment-methods/:id` - Lấy chi tiết phương thức thanh toán
- `GET /api/payment-methods/code/:code` - Lấy phương thức thanh toán theo mã

## 📊 Database Schema

### Tables
- **categories**: Danh mục sản phẩm
- **products**: Sản phẩm
- **branches**: Chi nhánh cửa hàng
- **customers**: Thông tin khách hàng
- **payment_methods**: Phương thức thanh toán
- **orders**: Đơn hàng
- **order_items**: Chi tiết đơn hàng

### Relationships
- Products ↔ Categories (Many-to-One)
- Orders ↔ Customers (Many-to-One)
- Orders ↔ Branches (Many-to-One)
- Orders ↔ Payment Methods (Many-to-One)
- Order Items ↔ Orders (Many-to-One)
- Order Items ↔ Products (Many-to-One)

## 🔧 Scripts

```bash
# Khởi động development server
npm run dev

# Khởi động production server
npm start

# Chạy migration database
npm run migrate

# Chạy tests
npm test
```

## 📝 Request/Response Examples

### Tạo đơn hàng mới
```bash
POST /api/orders
Content-Type: application/json

{
  "items": [
    {
      "product": {
        "id": 1,
        "name": "Bánh Mì Pate cột đèn",
        "price": 25000
      },
      "quantity": 2
    }
  ],
  "customerInfo": {
    "name": "Nguyễn Văn A",
    "phone": "0123456789",
    "email": "test@example.com",
    "address": "123 Đường ABC, Quận 1, TP.HCM"
  },
  "branch_id": 1,
  "payment_method_id": 1,
  "total_amount": 50000,
  "notes": "Giao hàng nhanh"
}
```

### Response
```json
{
  "success": true,
  "message": "Tạo đơn hàng thành công",
  "data": {
    "id": 1,
    "order_code": "BM12345678",
    "customer": {
      "name": "Nguyễn Văn A",
      "phone": "0123456789",
      "email": "test@example.com",
      "address": "123 Đường ABC, Quận 1, TP.HCM"
    },
    "total_amount": 50000,
    "status": "pending",
    "items": [...],
    "created_at": "2024-01-01T00:00:00.000Z"
  }
}
```

## 🚨 Error Handling

API sử dụng HTTP status codes chuẩn:

- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `409` - Conflict
- `422` - Validation Error
- `429` - Too Many Requests
- `500` - Internal Server Error

Error response format:
```json
{
  "success": false,
  "message": "Mô tả lỗi",
  "errors": [
    {
      "field": "field_name",
      "message": "Chi tiết lỗi"
    }
  ]
}
```

## 🔒 Security

- **Helmet**: Thiết lập các HTTP headers bảo mật
- **CORS**: Cấu hình Cross-Origin Resource Sharing
- **Rate Limiting**: Giới hạn số lượng request
- **Input Validation**: Kiểm tra và làm sạch dữ liệu đầu vào
- **SQL Injection Protection**: Sử dụng parameterized queries

## 📈 Monitoring

- **Health Check**: `/health` endpoint để kiểm tra trạng thái
- **Logging**: Morgan middleware cho request logging
- **Error Tracking**: Centralized error handling

## 🤝 Contributing

1. Fork the project
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License.
