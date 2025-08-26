const express = require('express');
const router = express.Router();
const Branch = require('../models/Branch');
const { validate, branchSchemas } = require('../middleware/validation');
const { asyncHandler } = require('../middleware/errorHandler');

// GET /api/branches - Lấy danh sách chi nhánh
router.get('/', asyncHandler(async (req, res) => {
  const branches = await Branch.findAll();

  res.json({
    success: true,
    message: 'Lấy danh sách chi nhánh thành công',
    data: branches.map(branch => branch.toJSON())
  });
}));

// GET /api/branches/:id - Lấy chi tiết chi nhánh
router.get('/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!id || isNaN(id)) {
    return res.status(400).json({
      success: false,
      message: 'ID chi nhánh không hợp lệ'
    });
  }

  const branch = await Branch.findById(parseInt(id));

  if (!branch) {
    return res.status(404).json({
      success: false,
      message: 'Chi nhánh không tồn tại'
    });
  }

  res.json({
    success: true,
    message: 'Lấy chi tiết chi nhánh thành công',
    data: branch.toJSON()
  });
}));

// POST /api/branches - Tạo chi nhánh mới (Admin only)
router.post('/', 
  validate(branchSchemas.create),
  asyncHandler(async (req, res) => {
    const branchData = req.body;

    const branch = await Branch.create(branchData);

    res.status(201).json({
      success: true,
      message: 'Tạo chi nhánh thành công',
      data: branch.toJSON()
    });
  })
);

// PUT /api/branches/:id - Cập nhật chi nhánh (Admin only)
router.put('/:id',
  validate(branchSchemas.update),
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const branchData = req.body;

    if (!id || isNaN(id)) {
      return res.status(400).json({
        success: false,
        message: 'ID chi nhánh không hợp lệ'
      });
    }

    // Kiểm tra chi nhánh có tồn tại không
    const existingBranch = await Branch.findById(parseInt(id));
    if (!existingBranch) {
      return res.status(404).json({
        success: false,
        message: 'Chi nhánh không tồn tại'
      });
    }

    const branch = await Branch.update(id, branchData);

    res.json({
      success: true,
      message: 'Cập nhật chi nhánh thành công',
      data: branch.toJSON()
    });
  })
);

// DELETE /api/branches/:id - Xóa chi nhánh (Admin only)
router.delete('/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!id || isNaN(id)) {
    return res.status(400).json({
      success: false,
      message: 'ID chi nhánh không hợp lệ'
    });
  }

  // Kiểm tra chi nhánh có tồn tại không
  const existingBranch = await Branch.findById(parseInt(id));
  if (!existingBranch) {
    return res.status(404).json({
      success: false,
      message: 'Chi nhánh không tồn tại'
    });
  }

  await Branch.delete(id);

  res.json({
    success: true,
    message: 'Xóa chi nhánh thành công'
  });
}));

module.exports = router;
