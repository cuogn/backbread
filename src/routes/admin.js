const express = require('express');
const router = express.Router();
const AdminUser = require('../models/AdminUser');
const Product = require('../models/Product');
const Category = require('../models/Category');
const Order = require('../models/Order');
const Branch = require('../models/Branch');
const PaymentMethod = require('../models/PaymentMethod');
const { authenticateAdmin, requireAdmin, requireAdminOrManager } = require('../middleware/auth');

// ===== AUTHENTICATION ROUTES =====

// Đăng nhập admin
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng nhập đầy đủ thông tin'
      });
    }

    // Tìm admin user
    const adminUser = await AdminUser.findByUsername(username);
    if (!adminUser) {
      return res.status(401).json({
        success: false,
        message: 'Tên đăng nhập hoặc mật khẩu không đúng'
      });
    }

    // Kiểm tra mật khẩu
    const isValidPassword = await AdminUser.verifyPassword(password, adminUser.password);
    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        message: 'Tên đăng nhập hoặc mật khẩu không đúng'
      });
    }

    // Cập nhật last login
    await AdminUser.updateLastLogin(adminUser.id);

    // Tạo token
    const token = AdminUser.generateToken(adminUser);

    res.json({
      success: true,
      message: 'Đăng nhập thành công',
      data: {
        token,
        admin: {
          id: adminUser.id,
          username: adminUser.username,
          email: adminUser.email,
          full_name: adminUser.full_name,
          role: adminUser.role
        }
      }
    });
  } catch (error) {
    console.error('Admin login error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi đăng nhập'
    });
  }
});

// Lấy thông tin admin hiện tại
router.get('/me', authenticateAdmin, async (req, res) => {
  try {
    res.json({
      success: true,
      data: {
        admin: {
          id: req.admin.id,
          username: req.admin.username,
          email: req.admin.email,
          full_name: req.admin.full_name,
          role: req.admin.role,
          last_login: req.admin.last_login
        }
      }
    });
  } catch (error) {
    console.error('Get admin info error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi lấy thông tin admin'
    });
  }
});

// ===== DASHBOARD STATS =====

// Lấy thống kê dashboard
router.get('/dashboard/stats', authenticateAdmin, requireAdminOrManager, async (req, res) => {
  try {
    // Lấy thống kê từ các bảng
    const [
      productsResult,
      categoriesResult,
      ordersResult,
      branchesResult,
      todayOrdersResult,
      revenueResult
    ] = await Promise.all([
      Product.getCount(),
      Category.getCount(),
      Order.getCount(),
      Branch.getCount(),
      Order.getTodayCount(),
      Order.getTotalRevenue()
    ]);

    res.json({
      success: true,
      data: {
        products: productsResult.count,
        categories: categoriesResult.count,
        orders: ordersResult.count,
        branches: branchesResult.count,
        todayOrders: todayOrdersResult.count,
        totalRevenue: revenueResult.revenue || 0
      }
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi lấy thống kê dashboard'
    });
  }
});

// ===== ADMIN MANAGEMENT =====

// Lấy danh sách admin users
router.get('/users', authenticateAdmin, requireAdmin, async (req, res) => {
  try {
    const adminUsers = await AdminUser.findAll();
    res.json({
      success: true,
      data: adminUsers
    });
  } catch (error) {
    console.error('Get admin users error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi lấy danh sách admin'
    });
  }
});

// Tạo admin user mới
router.post('/users', authenticateAdmin, requireAdmin, async (req, res) => {
  try {
    const { username, email, password, full_name, role } = req.body;

    if (!username || !email || !password || !full_name) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng nhập đầy đủ thông tin'
      });
    }

    const newAdmin = await AdminUser.create({
      username,
      email,
      password,
      full_name,
      role: role || 'admin'
    });

    res.status(201).json({
      success: true,
      message: 'Tạo admin user thành công',
      data: newAdmin
    });
  } catch (error) {
    console.error('Create admin user error:', error);
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({
        success: false,
        message: 'Username hoặc email đã tồn tại'
      });
    }
    res.status(500).json({
      success: false,
      message: 'Lỗi tạo admin user'
    });
  }
});

// ===== PRODUCT MANAGEMENT =====

// Lấy danh sách sản phẩm (admin) - hiển thị tất cả sản phẩm kể cả đã xóa
router.get('/products', authenticateAdmin, requireAdminOrManager, async (req, res) => {
  try {
    const { page = 1, limit = 20, category, search } = req.query;
    const result = await Product.findAllWithPagination({
      page: parseInt(page),
      limit: parseInt(limit),
      category,
      search
    });

    res.json({
      success: true,
      data: {
        products: result.products.map(product => product.toJSON()),
        pagination: result.pagination
      }
    });
  } catch (error) {
    console.error('Get admin products error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi lấy danh sách sản phẩm'
    });
  }
});

// Tạo sản phẩm mới
router.post('/products', authenticateAdmin, requireAdminOrManager, async (req, res) => {
  try {
    const productData = req.body;
    const newProduct = await Product.create(productData);

    res.status(201).json({
      success: true,
      message: 'Tạo sản phẩm thành công',
      data: newProduct
    });
  } catch (error) {
    console.error('Create product error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi tạo sản phẩm'
    });
  }
});

// Cập nhật sản phẩm
router.put('/products/:id', authenticateAdmin, requireAdminOrManager, async (req, res) => {
  try {
    const { id } = req.params;
    const productData = req.body;
    
    const updatedProduct = await Product.update(id, productData);
    if (!updatedProduct) {
      return res.status(404).json({
        success: false,
        message: 'Sản phẩm không tồn tại'
      });
    }

    res.json({
      success: true,
      message: 'Cập nhật sản phẩm thành công',
      data: updatedProduct
    });
  } catch (error) {
    console.error('Update product error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi cập nhật sản phẩm'
    });
  }
});

// Xóa sản phẩm
router.delete('/products/:id', authenticateAdmin, requireAdminOrManager, async (req, res) => {
  try {
    const { id } = req.params;
    await Product.delete(id);

    res.json({
      success: true,
      message: 'Xóa sản phẩm thành công'
    });
  } catch (error) {
    console.error('Delete product error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi xóa sản phẩm'
    });
  }
});

// ===== ORDER MANAGEMENT =====

// Lấy danh sách đơn hàng (admin)
router.get('/orders', authenticateAdmin, requireAdminOrManager, async (req, res) => {
  try {
    const { page = 1, limit = 20, status, branch_id } = req.query;
    const orders = await Order.findAllWithPagination({
      page: parseInt(page),
      limit: parseInt(limit),
      status,
      branch_id
    });

    res.json({
      success: true,
      data: orders
    });
  } catch (error) {
    console.error('Get admin orders error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi lấy danh sách đơn hàng'
    });
  }
});

// Cập nhật trạng thái đơn hàng
router.put('/orders/:id/status', authenticateAdmin, requireAdminOrManager, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng chọn trạng thái'
      });
    }

    const updatedOrder = await Order.updateStatus(id, status);
    if (!updatedOrder) {
      return res.status(404).json({
        success: false,
        message: 'Đơn hàng không tồn tại'
      });
    }

    res.json({
      success: true,
      message: 'Cập nhật trạng thái đơn hàng thành công',
      data: updatedOrder
    });
  } catch (error) {
    console.error('Update order status error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi cập nhật trạng thái đơn hàng'
    });
  }
});

module.exports = router;
