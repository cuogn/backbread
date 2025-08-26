const Joi = require('joi');

// Validation middleware factory
const validate = (schema, property = 'body') => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req[property], {
      abortEarly: false,
      allowUnknown: false,
      stripUnknown: true
    });

    if (error) {
      const errorMessage = error.details
        .map(detail => detail.message)
        .join(', ');
      
      return res.status(400).json({
        success: false,
        message: 'Dữ liệu không hợp lệ',
        errors: error.details.map(detail => ({
          field: detail.path.join('.'),
          message: detail.message
        }))
      });
    }

    // Replace request data with validated data
    req[property] = value;
    next();
  };
};

// Product validation schemas
const productSchemas = {
  create: Joi.object({
    name: Joi.string().min(1).max(200).required()
      .messages({
        'string.empty': 'Tên sản phẩm không được để trống',
        'string.max': 'Tên sản phẩm không được vượt quá 200 ký tự'
      }),
    description: Joi.string().allow('').max(1000)
      .messages({
        'string.max': 'Mô tả không được vượt quá 1000 ký tự'
      }),
    price: Joi.number().positive().required()
      .messages({
        'number.positive': 'Giá sản phẩm phải lớn hơn 0',
        'any.required': 'Giá sản phẩm là bắt buộc'
      }),
    image_url: Joi.string().uri().allow('').optional()
      .messages({
        'string.uri': 'URL hình ảnh không hợp lệ'
      }),
    category_id: Joi.number().integer().positive().required()
      .messages({
        'number.positive': 'ID danh mục không hợp lệ',
        'any.required': 'Danh mục là bắt buộc'
      }),
    is_available: Joi.boolean().optional()
  }),

  update: Joi.object({
    name: Joi.string().min(1).max(200).optional(),
    description: Joi.string().allow('').max(1000).optional(),
    price: Joi.number().positive().optional(),
    image_url: Joi.string().uri().allow('').optional(),
    category_id: Joi.number().integer().positive().optional(),
    is_available: Joi.boolean().optional()
  })
};

// Category validation schemas
const categorySchemas = {
  create: Joi.object({
    name: Joi.string().min(1).max(100).required()
      .messages({
        'string.empty': 'Tên danh mục không được để trống',
        'string.max': 'Tên danh mục không được vượt quá 100 ký tự'
      }),
    description: Joi.string().allow('').max(500).optional(),
    is_active: Joi.boolean().optional()
  }),

  update: Joi.object({
    name: Joi.string().min(1).max(100).optional(),
    description: Joi.string().allow('').max(500).optional(),
    is_active: Joi.boolean().optional()
  })
};

// Branch validation schemas
const branchSchemas = {
  create: Joi.object({
    name: Joi.string().min(1).max(200).required()
      .messages({
        'string.empty': 'Tên chi nhánh không được để trống',
        'string.max': 'Tên chi nhánh không được vượt quá 200 ký tự'
      }),
    address: Joi.string().min(1).required()
      .messages({
        'string.empty': 'Địa chỉ không được để trống'
      }),
    phone: Joi.string().pattern(/^[0-9]{10,11}$/).required()
      .messages({
        'string.pattern.base': 'Số điện thoại không hợp lệ (10-11 số)',
        'any.required': 'Số điện thoại là bắt buộc'
      }),
    is_active: Joi.boolean().optional()
  }),

  update: Joi.object({
    name: Joi.string().min(1).max(200).optional(),
    address: Joi.string().min(1).optional(),
    phone: Joi.string().pattern(/^[0-9]{10,11}$/).optional(),
    is_active: Joi.boolean().optional()
  })
};

// Order validation schemas
const orderSchemas = {
  create: Joi.object({
    items: Joi.array().items(
      Joi.object({
        product: Joi.object({
          id: Joi.number().integer().positive().required(),
          name: Joi.string().required(),
          price: Joi.number().positive().required()
        }).required(),
        quantity: Joi.number().integer().min(1).required()
      })
    ).min(1).required()
      .messages({
        'array.min': 'Đơn hàng phải có ít nhất 1 sản phẩm'
      }),
    
    customerInfo: Joi.object({
      name: Joi.string().min(1).max(200).required()
        .messages({
          'string.empty': 'Họ tên không được để trống'
        }),
      phone: Joi.string().pattern(/^[0-9]{10,11}$/).required()
        .messages({
          'string.pattern.base': 'Số điện thoại không hợp lệ (10-11 số)'
        }),
      email: Joi.string().email().allow('').optional()
        .messages({
          'string.email': 'Email không hợp lệ'
        }),
      address: Joi.string().min(1).required()
        .messages({
          'string.empty': 'Địa chỉ giao hàng không được để trống'
        })
    }).required(),
    
    branch_id: Joi.number().integer().positive().required()
      .messages({
        'any.required': 'Chi nhánh là bắt buộc'
      }),
    
    payment_method_id: Joi.number().integer().positive().required()
      .messages({
        'any.required': 'Phương thức thanh toán là bắt buộc'
      }),
    
    total_amount: Joi.number().positive().required()
      .messages({
        'number.positive': 'Tổng tiền phải lớn hơn 0'
      }),
    
    notes: Joi.string().allow('').max(500).optional()
  }),

  updateStatus: Joi.object({
    status: Joi.string().valid('pending', 'confirmed', 'preparing', 'delivering', 'completed', 'cancelled').required()
      .messages({
        'any.only': 'Trạng thái không hợp lệ'
      })
  })
};

// Query parameter validation schemas
const querySchemas = {
  pagination: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20),
    search: Joi.string().allow('').optional(),
    category_id: Joi.number().integer().positive().optional()
  }),

  orderQuery: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20),
    search: Joi.string().allow('').optional(),
    status: Joi.string().valid('pending', 'confirmed', 'preparing', 'delivering', 'completed', 'cancelled').optional(),
    branch_id: Joi.number().integer().positive().optional(),
    date_from: Joi.date().iso().optional(),
    date_to: Joi.date().iso().optional()
  })
};

module.exports = {
  validate,
  productSchemas,
  categorySchemas,
  branchSchemas,
  orderSchemas,
  querySchemas
};
