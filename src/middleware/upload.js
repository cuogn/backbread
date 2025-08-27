const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Tạo thư mục uploads nếu chưa tồn tại
const uploadDir = path.join(__dirname, '../../uploads/products');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Cấu hình storage cho multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Tạo tên file unique với timestamp
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `product-${uniqueSuffix}${ext}`);
  }
});

// File filter - chỉ cho phép ảnh
const fileFilter = (req, file, cb) => {
  // Kiểm tra mimetype
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Chỉ được phép upload file ảnh (jpg, jpeg, png, gif, webp)'), false);
  }
};

// Cấu hình multer
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
    files: 1 // Chỉ cho phép 1 file
  }
});

// Middleware xử lý upload single image
const uploadSingleImage = (fieldName = 'image') => {
  return (req, res, next) => {
    const uploadSingle = upload.single(fieldName);
    
    uploadSingle(req, res, (err) => {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({
            success: false,
            message: 'File ảnh quá lớn. Vui lòng chọn file nhỏ hơn 5MB'
          });
        } else if (err.code === 'LIMIT_FILE_COUNT') {
          return res.status(400).json({
            success: false,
            message: 'Chỉ được phép upload 1 file ảnh'
          });
        } else {
          return res.status(400).json({
            success: false,
            message: `Lỗi upload: ${err.message}`
          });
        }
      } else if (err) {
        return res.status(400).json({
          success: false,
          message: err.message
        });
      }
      
      // Thêm thông tin file vào request
      if (req.file) {
        req.file.url = `/uploads/products/${req.file.filename}`;
      }
      
      next();
    });
  };
};

// Hàm xóa file ảnh
const deleteImage = (filename) => {
  try {
    if (filename) {
      const filePath = path.join(uploadDir, path.basename(filename));
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        return true;
      }
    }
    return false;
  } catch (error) {
    console.error('Error deleting image:', error);
    return false;
  }
};

// Hàm lấy URL đầy đủ của ảnh
const getImageUrl = (filename, baseUrl = '') => {
  if (!filename) return null;
  
  // Nếu đã là URL đầy đủ thì return luôn
  if (filename.startsWith('http')) {
    return filename;
  }
  
  // Nếu đã có /uploads thì return với baseUrl
  if (filename.startsWith('/uploads')) {
    return `${baseUrl}${filename}`;
  }
  
  // Nếu chỉ là tên file thì tạo URL đầy đủ
  return `${baseUrl}/uploads/products/${filename}`;
};

module.exports = {
  uploadSingleImage,
  deleteImage,
  getImageUrl
};
