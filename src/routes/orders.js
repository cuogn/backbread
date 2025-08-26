const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const Product = require('../models/Product');
const Branch = require('../models/Branch');
const PaymentMethod = require('../models/PaymentMethod');
const { validate, orderSchemas, querySchemas } = require('../middleware/validation');
const { asyncHandler } = require('../middleware/errorHandler');

// GET /api/orders - Lấy danh sách đơn hàng
router.get('/', 
  validate(querySchemas.orderQuery, 'query'),
  asyncHandler(async (req, res) => {
    const { page, limit, search, status, branch_id, date_from, date_to } = req.query;
    const offset = (page - 1) * limit;

    const options = {
      limit,
      offset,
      search,
      status,
      branch_id,
      date_from,
      date_to
    };

    const orders = await Order.findAll(options);

    res.json({
      success: true,
      message: 'Lấy danh sách đơn hàng thành công',
      data: {
        orders: orders.map(order => order.toJSON()),
        pagination: {
          current_page: page,
          per_page: limit
        }
      }
    });
  })
);

// GET /api/orders/:id - Lấy chi tiết đơn hàng
router.get('/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!id || isNaN(id)) {
    return res.status(400).json({
      success: false,
      message: 'ID đơn hàng không hợp lệ'
    });
  }

  const order = await Order.findById(parseInt(id));

  if (!order) {
    return res.status(404).json({
      success: false,
      message: 'Đơn hàng không tồn tại'
    });
  }

  res.json({
    success: true,
    message: 'Lấy chi tiết đơn hàng thành công',
    data: order.toJSON()
  });
}));

// GET /api/orders/code/:orderCode - Lấy đơn hàng theo mã
router.get('/code/:orderCode', asyncHandler(async (req, res) => {
  const { orderCode } = req.params;

  if (!orderCode) {
    return res.status(400).json({
      success: false,
      message: 'Mã đơn hàng không hợp lệ'
    });
  }

  const order = await Order.findByOrderCode(orderCode);

  if (!order) {
    return res.status(404).json({
      success: false,
      message: 'Đơn hàng không tồn tại'
    });
  }

  res.json({
    success: true,
    message: 'Lấy đơn hàng thành công',
    data: order.toJSON()
  });
}));

// POST /api/orders - Tạo đơn hàng mới
router.post('/', 
  validate(orderSchemas.create),
  asyncHandler(async (req, res) => {
    const orderData = req.body;

    // Validate products exist and calculate total
    let calculatedTotal = 0;
    for (const item of orderData.items) {
      const product = await Product.findById(parseInt(item.product.id));
      if (!product) {
        return res.status(400).json({
          success: false,
          message: `Sản phẩm với ID ${item.product.id} không tồn tại`
        });
      }
      
      // Verify price matches
      if (product.price !== item.product.price) {
        return res.status(400).json({
          success: false,
          message: `Giá sản phẩm ${product.name} đã thay đổi, vui lòng làm mới giỏ hàng`
        });
      }
      
      calculatedTotal += product.price * item.quantity;
    }

    // Verify total amount
    if (Math.abs(calculatedTotal - orderData.total_amount) > 0.01) {
      return res.status(400).json({
        success: false,
        message: 'Tổng tiền không chính xác'
      });
    }

    // Validate branch exists
    const branch = await Branch.findById(parseInt(orderData.branch_id));
    if (!branch) {
      return res.status(400).json({
        success: false,
        message: 'Chi nhánh không tồn tại'
      });
    }

    // Validate payment method exists
    const paymentMethod = await PaymentMethod.findById(parseInt(orderData.payment_method_id));
    if (!paymentMethod) {
      return res.status(400).json({
        success: false,
        message: 'Phương thức thanh toán không tồn tại'
      });
    }

    const order = await Order.create(orderData);

    res.status(201).json({
      success: true,
      message: 'Tạo đơn hàng thành công',
      data: order.toJSON()
    });
  })
);

// PUT /api/orders/:id/status - Cập nhật trạng thái đơn hàng (Admin only)
router.put('/:id/status',
  validate(orderSchemas.updateStatus),
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;

    if (!id || isNaN(id)) {
      return res.status(400).json({
        success: false,
        message: 'ID đơn hàng không hợp lệ'
      });
    }

    // Kiểm tra đơn hàng có tồn tại không
    const existingOrder = await Order.findById(parseInt(id));
    if (!existingOrder) {
      return res.status(404).json({
        success: false,
        message: 'Đơn hàng không tồn tại'
      });
    }

    const order = await Order.updateStatus(id, status);

    res.json({
      success: true,
      message: 'Cập nhật trạng thái đơn hàng thành công',
      data: order.toJSON()
    });
  })
);

// GET /api/orders/statistics - Thống kê đơn hàng (Admin only)
router.get('/stats/overview', asyncHandler(async (req, res) => {
  const { date_from, date_to } = req.query;

  const statistics = await Order.getStatistics({
    date_from,
    date_to
  });

  res.json({
    success: true,
    message: 'Lấy thống kê đơn hàng thành công',
    data: statistics
  });
}));

module.exports = router;
