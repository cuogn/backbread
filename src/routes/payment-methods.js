const express = require('express');
const router = express.Router();
const PaymentMethod = require('../models/PaymentMethod');
const { asyncHandler } = require('../middleware/errorHandler');

// GET /api/payment-methods - Lấy danh sách phương thức thanh toán
router.get('/', asyncHandler(async (req, res) => {
  const paymentMethods = await PaymentMethod.findAll();

  res.json({
    success: true,
    message: 'Lấy danh sách phương thức thanh toán thành công',
    data: paymentMethods.map(method => method.toJSON())
  });
}));

// GET /api/payment-methods/:id - Lấy chi tiết phương thức thanh toán
router.get('/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!id || isNaN(id)) {
    return res.status(400).json({
      success: false,
      message: 'ID phương thức thanh toán không hợp lệ'
    });
  }

  const paymentMethod = await PaymentMethod.findById(parseInt(id));

  if (!paymentMethod) {
    return res.status(404).json({
      success: false,
      message: 'Phương thức thanh toán không tồn tại'
    });
  }

  res.json({
    success: true,
    message: 'Lấy chi tiết phương thức thanh toán thành công',
    data: paymentMethod.toJSON()
  });
}));

// GET /api/payment-methods/code/:code - Lấy phương thức thanh toán theo mã
router.get('/code/:code', asyncHandler(async (req, res) => {
  const { code } = req.params;

  if (!code) {
    return res.status(400).json({
      success: false,
      message: 'Mã phương thức thanh toán không hợp lệ'
    });
  }

  const paymentMethod = await PaymentMethod.findByCode(code);

  if (!paymentMethod) {
    return res.status(404).json({
      success: false,
      message: 'Phương thức thanh toán không tồn tại'
    });
  }

  res.json({
    success: true,
    message: 'Lấy phương thức thanh toán thành công',
    data: paymentMethod.toJSON()
  });
}));

module.exports = router;
