const express = require('express');
const router = express.Router();

// Import route modules
const productsRoutes = require('./products');
const categoriesRoutes = require('./categories');
const ordersRoutes = require('./orders');
const branchesRoutes = require('./branches');
const paymentMethodsRoutes = require('./payment-methods');
const adminRoutes = require('./admin');

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'API Server đang hoạt động bình thường',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// API info endpoint
router.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Chào mừng đến với Bánh Mì Sơn API',
    version: '1.0.0',
    endpoints: {
      products: '/api/products',
      categories: '/api/categories',
      orders: '/api/orders',
      branches: '/api/branches',
      paymentMethods: '/api/payment-methods',
      admin: '/api/admin',
      health: '/api/health'
    },
    documentation: 'https://api.banhmi-son.com/docs'
  });
});

// Mount route modules
router.use('/products', productsRoutes);
router.use('/categories', categoriesRoutes);
router.use('/orders', ordersRoutes);
router.use('/branches', branchesRoutes);
router.use('/payment-methods', paymentMethodsRoutes);
router.use('/admin', adminRoutes);

module.exports = router;
