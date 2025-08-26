# 🚀 Hướng dẫn Deploy Backend lên Render

## 📋 Tổng quan

Backend API cho Bánh Mì Sơn được deploy trên Render.com với PostgreSQL database.

## 🔗 URLs

- **Frontend (Vercel):** https://son-bread.vercel.app
- **Backend (Render):** https://backbread.onrender.com
- **Database (Render PostgreSQL):** `postgresql://banh_mi_son_user:...@dpg-d2msh33ipnbc73fa1q50-a.singapore-postgres.render.com/banh_mi_son`

## 🛠 Cấu hình Render

### 1. Tạo Web Service

1. Đăng nhập Render Dashboard
2. Click "New" → "Web Service"
3. Kết nối GitHub repository
4. Cấu hình:
   - **Name:** `backbread`
   - **Root Directory:** `backbread` (hoặc để trống nếu repo chỉ chứa backend)
   - **Runtime:** `Node`
   - **Build Command:** `npm install`
   - **Start Command:** `node src/server.js`
   - **Region:** `Singapore` (gần database)
   - **Health Check Path:** `/health`

### 2. Environment Variables

Thêm các biến môi trường sau:

```env
NODE_ENV=production
PORT=10000
API_BASE_URL=https://backbread.onrender.com
DATABASE_URL=postgresql://banh_mi_son_user:dh5CJF2pjtJneC5E0AgFfIxNjsdgDULF@dpg-d2msh33ipnbc73fa1q50-a.singapore-postgres.render.com/banh_mi_son
JWT_SECRET=your_super_secret_jwt_key_here
FRONTEND_URL=https://son-bread.vercel.app
MAX_FILE_SIZE=5242880
UPLOAD_PATH=/opt/render/project/src/uploads
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

### 3. Persistent Disk (cho uploads)

1. Render Dashboard → Disks → "Add Disk"
2. Cấu hình:
   - **Name:** `uploads-disk`
   - **Mount Path:** `/opt/render/project/src/uploads`
   - **Size:** `5 GB`

### 4. Auto Deploy

- Bật "Auto-Deploy" để tự động deploy khi push code
- Health check phải trả về 200 tại `/health`

## 🔧 CORS Configuration

Backend đã được cấu hình CORS để chấp nhận:

- ✅ `https://son-bread.vercel.app` (Production frontend)
- ✅ `https://www.son-bread.vercel.app` (Production với www)
- ✅ `http://localhost:3000` (Local development)
- ✅ `http://127.0.0.1:3000` (Local development alternative)
- ✅ `https://backbread.onrender.com` (Backend testing)

## 🗄️ Database Migration

### Cách 1: Render Shell (Khuyến nghị)

1. Render Dashboard → Web Service → "Shell"
2. Chạy lệnh:

```bash
npm run migrate
```

### Cách 2: Local Migration

```bash
# Cập nhật .env với DATABASE_URL production
DATABASE_URL=postgresql://banh_mi_son_user:...@dpg-d2msh33ipnbc73fa1q50-a.singapore-postgres.render.com/banh_mi_son

# Chạy migration
npm run migrate
```

## 🧪 Testing

### Test CORS Configuration

```bash
npm run test-cors
```

### Test API Endpoints

```bash
# Health check
curl https://backbread.onrender.com/health

# Products
curl https://backbread.onrender.com/api/products

# Categories
curl https://backbread.onrender.com/api/categories
```

## 📊 Monitoring

### Health Check

- **Endpoint:** `https://backbread.onrender.com/health`
- **Expected Response:**

```json
{
  "success": true,
  "message": "Bánh Mì Sơn API Server đang hoạt động bình thường",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "environment": "production",
  "version": "1.0.0"
}
```

### Logs

- Render Dashboard → Web Service → "Logs"
- Theo dõi real-time logs và errors

## 🔒 Security

### Environment Variables

- ✅ `JWT_SECRET`: Chuỗi bí mật mạnh
- ✅ `DATABASE_URL`: SSL enabled
- ✅ CORS: Chỉ cho phép domains được tin cậy

### Rate Limiting

- ✅ 100 requests per 15 minutes per IP
- ✅ Applied to `/api/*` endpoints

### Headers Security

- ✅ Helmet.js enabled
- ✅ CORS headers configured
- ✅ Content-Type validation

## 🚨 Troubleshooting

### Lỗi thường gặp

#### 1. Database Connection Failed

```bash
# Kiểm tra DATABASE_URL
echo $DATABASE_URL

# Test connection
npm run migrate
```

#### 2. CORS Errors

```bash
# Test CORS
npm run test-cors

# Kiểm tra FRONTEND_URL
echo $FRONTEND_URL
```

#### 3. File Upload Failed

```bash
# Kiểm tra disk mount
ls -la /opt/render/project/src/uploads

# Kiểm tra permissions
chmod 755 /opt/render/project/src/uploads
```

#### 4. Health Check Failed

```bash
# Kiểm tra logs
tail -f /var/log/render.log

# Test endpoint
curl https://backbread.onrender.com/health
```

### Performance Issues

- **Cold Start:** Render free tier có cold start ~30s
- **Database:** Sử dụng connection pooling
- **Caching:** Implement Redis nếu cần

## 📈 Scaling

### Free Tier Limits

- **Build Time:** 15 minutes
- **Request Timeout:** 30 seconds
- **Sleep:** 15 minutes inactive

### Upgrade Options

- **Starter:** $7/month - No sleep, 512MB RAM
- **Standard:** $25/month - 1GB RAM, custom domains

## 🔄 CI/CD

### GitHub Actions (Optional)

```yaml
name: Deploy to Render
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Deploy to Render
        env:
          RENDER_TOKEN: ${{ secrets.RENDER_TOKEN }}
        run: |
          curl -X POST "https://api.render.com/v1/services/$SERVICE_ID/deploys" \
            -H "Authorization: Bearer $RENDER_TOKEN" \
            -H "Content-Type: application/json"
```

## 📞 Support

- **Render Support:** https://render.com/docs/help
- **PostgreSQL Docs:** https://render.com/docs/databases
- **Node.js Docs:** https://nodejs.org/docs

---

**Lưu ý:** Đảm bảo backup database thường xuyên và monitor logs để phát hiện issues sớm.
