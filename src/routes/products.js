const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const { validate, productSchemas, querySchemas } = require('../middleware/validation');
const { asyncHandler } = require('../middleware/errorHandler');

// GET /api/products - Lấy danh sách sản phẩm
router.get('/', 
  validate(querySchemas.pagination, 'query'),
  asyncHandler(async (req, res) => {
    const { page, limit, search, category_id } = req.query;
    const offset = (page - 1) * limit;

    const options = {
      limit: parseInt(limit),
      offset: parseInt(offset),
      search,
      category_id: category_id ? parseInt(category_id) : undefined
    };

    const [products, total] = await Promise.all([
      Product.findAll(options),
      Product.count({ search, category_id: options.category_id })
    ]);

    // Convert BigInt to number to avoid mixing types
    const totalCount = Number(total);
    const pageLimit = Number(limit);
    const currentPage = Number(page);
    const totalPages = Math.ceil(totalCount / pageLimit);

    res.json({
      success: true,
      message: 'Lấy danh sách sản phẩm thành công',
      data: {
        products: products.map(product => product.toJSON()),
        pagination: {
          current_page: currentPage,
          total_pages: totalPages,
          per_page: pageLimit,
          total_items: totalCount,
          has_next_page: currentPage < totalPages,
          has_prev_page: currentPage > 1
        }
      }
    });
  })
);

// GET /api/products/:id - Lấy chi tiết sản phẩm
router.get('/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!id || isNaN(id)) {
    return res.status(400).json({
      success: false,
      message: 'ID sản phẩm không hợp lệ'
    });
  }

  const product = await Product.findById(parseInt(id));

  if (!product) {
    return res.status(404).json({
      success: false,
      message: 'Sản phẩm không tồn tại'
    });
  }

  res.json({
    success: true,
    message: 'Lấy chi tiết sản phẩm thành công',
    data: product.toJSON()
  });
}));

// GET /api/products/category/:categoryId - Lấy sản phẩm theo danh mục
router.get('/category/:categoryId', asyncHandler(async (req, res) => {
  const { categoryId } = req.params;

  if (!categoryId || isNaN(categoryId)) {
    return res.status(400).json({
      success: false,
      message: 'ID danh mục không hợp lệ'
    });
  }

  const products = await Product.findByCategory(parseInt(categoryId));

  res.json({
    success: true,
    message: 'Lấy sản phẩm theo danh mục thành công',
    data: products.map(product => product.toJSON())
  });
}));

// POST /api/products - Tạo sản phẩm mới (Admin only)
router.post('/', 
  validate(productSchemas.create),
  asyncHandler(async (req, res) => {
    const productData = req.body;

    const product = await Product.create(productData);

    res.status(201).json({
      success: true,
      message: 'Tạo sản phẩm thành công',
      data: product.toJSON()
    });
  })
);

// PUT /api/products/:id - Cập nhật sản phẩm (Admin only)
router.put('/:id',
  validate(productSchemas.update),
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const productData = req.body;

    if (!id || isNaN(id)) {
      return res.status(400).json({
        success: false,
        message: 'ID sản phẩm không hợp lệ'
      });
    }

    const productId = parseInt(id);

    // Kiểm tra sản phẩm có tồn tại không
    const existingProduct = await Product.findById(productId);
    if (!existingProduct) {
      return res.status(404).json({
        success: false,
        message: 'Sản phẩm không tồn tại'
      });
    }

    const product = await Product.update(productId, productData);

    res.json({
      success: true,
      message: 'Cập nhật sản phẩm thành công',
      data: product.toJSON()
    });
  })
);

// DELETE /api/products/:id - Xóa sản phẩm (Admin only)
router.delete('/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!id || isNaN(id)) {
    return res.status(400).json({
      success: false,
      message: 'ID sản phẩm không hợp lệ'
    });
  }

  const productId = parseInt(id);

  // Kiểm tra sản phẩm có tồn tại không
  const existingProduct = await Product.findById(productId);
  if (!existingProduct) {
    return res.status(404).json({
      success: false,
      message: 'Sản phẩm không tồn tại'
    });
  }

  await Product.delete(productId);

  res.json({
    success: true,
    message: 'Xóa sản phẩm thành công'
  });
}));

module.exports = router;
