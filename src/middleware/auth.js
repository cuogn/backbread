const AdminUser = require('../models/AdminUser');

// Middleware xác thực admin
const authenticateAdmin = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Không có token xác thực'
      });
    }

    // Xác thực token
    const decoded = AdminUser.verifyToken(token);
    if (!decoded) {
      return res.status(401).json({
        success: false,
        message: 'Token không hợp lệ'
      });
    }

    // Lấy thông tin admin user
    const adminUser = await AdminUser.findById(decoded.id);
    if (!adminUser) {
      return res.status(401).json({
        success: false,
        message: 'Admin user không tồn tại'
      });
    }

    // Thêm thông tin admin vào request
    req.admin = adminUser;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi xác thực'
    });
  }
};

// Middleware kiểm tra quyền admin
const requireAdmin = (req, res, next) => {
  if (req.admin.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Không có quyền truy cập'
    });
  }
  next();
};

// Middleware kiểm tra quyền admin hoặc manager
const requireAdminOrManager = (req, res, next) => {
  if (!['admin', 'manager'].includes(req.admin.role)) {
    return res.status(403).json({
      success: false,
      message: 'Không có quyền truy cập'
    });
  }
  next();
};

module.exports = {
  authenticateAdmin,
  requireAdmin,
  requireAdminOrManager
};
