const express = require('express');
const router = express.Router();
const Category = require('../models/Category');
const { validate, categorySchemas } = require('../middleware/validation');
const { asyncHandler } = require('../middleware/errorHandler');

// GET /api/categories - Lấy danh sách danh mục
router.get('/', asyncHandler(async (req, res) => {
  const categories = await Category.findAll();

  res.json({
    success: true,
    message: 'Lấy danh sách danh mục thành công',
    data: categories.map(category => category.toJSON())
  });
}));

// GET /api/categories/with-count - Lấy danh mục với số lượng sản phẩm
router.get('/with-count', asyncHandler(async (req, res) => {
  const categories = await Category.findAllWithProductCount();

  res.json({
    success: true,
    message: 'Lấy danh mục với số lượng sản phẩm thành công',
    data: categories
  });
}));

// GET /api/categories/:id - Lấy chi tiết danh mục
router.get('/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!id || isNaN(id)) {
    return res.status(400).json({
      success: false,
      message: 'ID danh mục không hợp lệ'
    });
  }

  const category = await Category.findById(parseInt(id));

  if (!category) {
    return res.status(404).json({
      success: false,
      message: 'Danh mục không tồn tại'
    });
  }

  res.json({
    success: true,
    message: 'Lấy chi tiết danh mục thành công',
    data: category.toJSON()
  });
}));

// POST /api/categories - Tạo danh mục mới (Admin only)
router.post('/', 
  validate(categorySchemas.create),
  asyncHandler(async (req, res) => {
    const categoryData = req.body;

    const category = await Category.create(categoryData);

    res.status(201).json({
      success: true,
      message: 'Tạo danh mục thành công',
      data: category.toJSON()
    });
  })
);

// PUT /api/categories/:id - Cập nhật danh mục (Admin only)
router.put('/:id',
  validate(categorySchemas.update),
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const categoryData = req.body;

    if (!id || isNaN(id)) {
      return res.status(400).json({
        success: false,
        message: 'ID danh mục không hợp lệ'
      });
    }

    // Kiểm tra danh mục có tồn tại không
    const existingCategory = await Category.findById(parseInt(id));
    if (!existingCategory) {
      return res.status(404).json({
        success: false,
        message: 'Danh mục không tồn tại'
      });
    }

    const category = await Category.update(id, categoryData);

    res.json({
      success: true,
      message: 'Cập nhật danh mục thành công',
      data: category.toJSON()
    });
  })
);

// DELETE /api/categories/:id - Xóa danh mục (Admin only)
router.delete('/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!id || isNaN(id)) {
    return res.status(400).json({
      success: false,
      message: 'ID danh mục không hợp lệ'
    });
  }

  // Kiểm tra danh mục có tồn tại không
  const existingCategory = await Category.findById(parseInt(id));
  if (!existingCategory) {
    return res.status(404).json({
      success: false,
      message: 'Danh mục không tồn tại'
    });
  }

  await Category.delete(id);

  res.json({
    success: true,
    message: 'Xóa danh mục thành công'
  });
}));

module.exports = router;
