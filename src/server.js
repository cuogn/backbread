const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const config = require('./config');
const { testConnection } = require('./config/database');
const routes = require('./routes');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');

const app = express();

// Security middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// CORS configuration with better error handling
app.use(cors(config.cors));

// Handle CORS preflight requests
app.options('*', cors(config.cors));

// Compression middleware
app.use(compression());

// Request logging
if (config.server.env === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// Rate limiting
const limiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.maxRequests,
  message: {
    success: false,
    message: 'Quá nhiều yêu cầu từ IP này, vui lòng thử lại sau'
  },
  standardHeaders: true,
  legacyHeaders: false
});
app.use('/api', limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static files
app.use('/uploads', express.static('uploads'));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Bánh Mì Sơn API Server đang hoạt động bình thường',
    timestamp: new Date().toISOString(),
    environment: config.server.env,
    version: '1.0.0'
  });
});

// API routes
app.use('/api', routes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Bánh Mì Sơn API Server',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      api: '/api',
      products: '/api/products',
      categories: '/api/categories',
      orders: '/api/orders',
      branches: '/api/branches'
    },
    documentation: 'API documentation available at /api'
  });
});

// 404 handler
app.use(notFoundHandler);

// Error handling middleware (must be last)
app.use(errorHandler);

// Start server
const startServer = async () => {
  try {
    // Test database connection
    console.log('🔄 Đang kiểm tra kết nối database...');
    await testConnection();
    
    // Start HTTP server
    const server = app.listen(config.server.port, () => {
      console.log('🚀 Server Information:');
      console.log(`   Environment: ${config.server.env}`);
      console.log(`   Port: ${config.server.port}`);
      console.log(`   Base URL: ${config.server.baseUrl}`);
      console.log(`   API Endpoints: ${config.server.baseUrl}/api`);
      console.log(`   Health Check: ${config.server.baseUrl}/health`);
      console.log('✅ Bánh Mì Sơn API Server đã khởi động thành công!');
      console.log('🌐 CORS enabled for:');
      console.log('   - https://son-bread.vercel.app');
      console.log('   - http://localhost:3000 (development)');
    });

    // Graceful shutdown handling
    const gracefulShutdown = (signal) => {
      console.log(`\n🔄 Nhận tín hiệu ${signal}, đang tắt server...`);
      
      server.close((err) => {
        if (err) {
          console.error('❌ Lỗi khi tắt server:', err);
          process.exit(1);
        }
        
        console.log('✅ Server đã tắt thành công');
        process.exit(0);
      });
    };

    // Handle process termination
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
    
  } catch (error) {
    console.error('❌ Lỗi khởi động server:', error.message);
    process.exit(1);
  }
};

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('❌ Uncaught Exception:', err);
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Start the server
startServer();

module.exports = app;
