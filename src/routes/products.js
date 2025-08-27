const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const Category = require('../models/Category');
const { validate, productSchemas, querySchemas } = require('../middleware/validation');
const { asyncHandler } = require('../middleware/errorHandler');
const { authenticateAdmin, requireAdminOrManager } = require('../middleware/auth');
const { uploadSingleImage, deleteImage, getImageUrl } = require('../middleware/upload');

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
  authenticateAdmin,
  requireAdminOrManager,
  uploadSingleImage('image'),
  asyncHandler(async (req, res) => {
    console.log('POST /api/products - Request received');
    console.log('Body:', req.body);
    console.log('File:', req.file ? { filename: req.file.filename, size: req.file.size } : 'No file');
    
    try {
      const { name, description, price, category_id, is_available } = req.body;

      // Validate required fields
      if (!name || !price || !category_id) {
        console.log('Validation failed: Missing required fields');
        // Xóa file đã upload nếu có lỗi validation
        if (req.file) {
          deleteImage(req.file.filename);
        }
        return res.status(400).json({
          success: false,
          message: 'Vui lòng nhập đầy đủ thông tin: tên, giá, danh mục'
        });
      }

      console.log('Checking category exists:', category_id);
      // Kiểm tra danh mục có tồn tại không
      const category = await Category.findById(parseInt(category_id));
      if (!category) {
        console.log('Category not found:', category_id);
        if (req.file) {
          deleteImage(req.file.filename);
        }
        return res.status(400).json({
          success: false,
          message: 'Danh mục không tồn tại'
        });
      }

      console.log('Creating product with data');
      const productData = {
        name,
        description: description || '',
        price: parseFloat(price),
        category_id: parseInt(category_id),
        is_available: is_available !== undefined ? is_available === 'true' : true,
        image_url: req.file ? req.file.url : null
      };

      console.log('Product data:', productData);
      const product = await Product.create(productData);
      console.log('Product created successfully:', product.id);

      res.status(201).json({
        success: true,
        message: 'Tạo sản phẩm thành công',
        data: product.toJSON()
      });
    } catch (error) {
      console.error('Error in POST /api/products:', error);
      // Xóa file đã upload nếu có lỗi
      if (req.file) {
        deleteImage(req.file.filename);
      }
      
      res.status(500).json({
        success: false,
        message: 'Lỗi server khi tạo sản phẩm: ' + error.message
      });
    }
  })
);

// PUT /api/products/:id - Cập nhật sản phẩm (Admin only)
router.put('/:id',
  authenticateAdmin,
  requireAdminOrManager,
  uploadSingleImage('image'),
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { name, description, price, category_id, is_available } = req.body;

    if (!id || isNaN(id)) {
      if (req.file) {
        deleteImage(req.file.filename);
      }
      return res.status(400).json({
        success: false,
        message: 'ID sản phẩm không hợp lệ'
      });
    }

    const productId = parseInt(id);

    // Kiểm tra sản phẩm có tồn tại không
    const existingProduct = await Product.findById(productId);
    if (!existingProduct) {
      if (req.file) {
        deleteImage(req.file.filename);
      }
      return res.status(404).json({
        success: false,
        message: 'Sản phẩm không tồn tại'
      });
    }

    // Kiểm tra danh mục nếu có thay đổi
    if (category_id) {
      const category = await Category.findById(parseInt(category_id));
      if (!category) {
        if (req.file) {
          deleteImage(req.file.filename);
        }
        return res.status(400).json({
          success: false,
          message: 'Danh mục không tồn tại'
        });
      }
    }

    const productData = {};
    if (name !== undefined) productData.name = name;
    if (description !== undefined) productData.description = description;
    if (price !== undefined) productData.price = parseFloat(price);
    if (category_id !== undefined) productData.category_id = parseInt(category_id);
    if (is_available !== undefined) productData.is_available = is_available === 'true';

    // Xử lý ảnh mới
    if (req.file) {
      // Xóa ảnh cũ nếu có
      if (existingProduct.image_url) {
        const oldImageName = existingProduct.image_url.split('/').pop();
        deleteImage(oldImageName);
      }
      productData.image_url = req.file.url;
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
router.delete('/:id', 
  authenticateAdmin,
  requireAdminOrManager,
  asyncHandler(async (req, res) => {
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

    // Xóa ảnh nếu có
    if (existingProduct.image_url) {
      const imageName = existingProduct.image_url.split('/').pop();
      deleteImage(imageName);
    }

    await Product.delete(productId);

    res.json({
      success: true,
      message: 'Xóa sản phẩm thành công'
    });
  })
);

// POST /api/products/test - Test endpoint (Admin only)
router.post('/test', 
  authenticateAdmin,
  requireAdminOrManager,
  asyncHandler(async (req, res) => {
    console.log('Test endpoint hit');
    res.json({
      success: true,
      message: 'Test endpoint working',
      data: {
        timestamp: new Date().toISOString(),
        body: req.body,
        admin: req.admin ? { id: req.admin.id, username: req.admin.username } : null
      }
    });
  })
);

// POST /api/products/simple - Simplified create without upload (Admin only)
router.post('/simple', 
  authenticateAdmin,
  requireAdminOrManager,
  asyncHandler(async (req, res) => {
    console.log('Simple POST /api/products/simple - Request received');
    console.log('Body:', req.body);
    
    try {
      const { name, description, price, category_id, is_available } = req.body;

      // Validate required fields
      if (!name || !price || !category_id) {
        console.log('Validation failed: Missing required fields');
        return res.status(400).json({
          success: false,
          message: 'Vui lòng nhập đầy đủ thông tin: tên, giá, danh mục'
        });
      }

      console.log('Checking category exists:', category_id);
      // Kiểm tra danh mục có tồn tại không
      const category = await Category.findById(parseInt(category_id));
      if (!category) {
        console.log('Category not found:', category_id);
        return res.status(400).json({
          success: false,
          message: 'Danh mục không tồn tại'
        });
      }

      console.log('Creating product with data');
      const productData = {
        name,
        description: description || '',
        price: parseFloat(price),
        category_id: parseInt(category_id),
        is_available: is_available !== undefined ? is_available === 'true' : true,
        image_url: null // No image for simple endpoint
      };

      console.log('Product data:', productData);
      const product = await Product.create(productData);
      console.log('Product created successfully:', product.id);

      res.status(201).json({
        success: true,
        message: 'Tạo sản phẩm thành công',
        data: product.toJSON()
      });
    } catch (error) {
      console.error('Error in POST /api/products/simple:', error);
      
      res.status(500).json({
        success: false,
        message: 'Lỗi server khi tạo sản phẩm: ' + error.message
      });
    }
  })
);

// POST /api/products/upload-image - Upload ảnh riêng (Admin only)
router.post('/upload-image',
  authenticateAdmin,
  requireAdminOrManager,
  uploadSingleImage('image'),
  asyncHandler(async (req, res) => {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng chọn file ảnh'
      });
    }

    res.json({
      success: true,
      message: 'Upload ảnh thành công',
      data: {
        filename: req.file.filename,
        url: req.file.url,
        size: req.file.size
      }
    });
  })
);

module.exports = router;
