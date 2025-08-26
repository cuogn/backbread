const { executeQuery } = require('../config/database');

class Product {
  constructor(data) {
    this.id = data.id;
    this.name = data.name;
    this.description = data.description;
    this.price = data.price;
    this.image_url = data.image_url;
    this.category_id = data.category_id;
    this.is_available = data.is_available;
    this.created_at = data.created_at;
    this.updated_at = data.updated_at;
  }

  // Lấy tất cả sản phẩm
  static async findAll(options = {}) {
    try {
      let query = `
        SELECT p.*, c.name as category_name 
        FROM products p 
        LEFT JOIN categories c ON p.category_id = c.id
        WHERE p.is_available = true
      `;
      
      const params = [];

      // Filter theo category
      if (options.category_id) {
        query += ` AND p.category_id = $${params.length + 1}`;
        params.push(options.category_id);
      }

      // Search theo tên
      if (options.search) {
        query += ` AND (p.name LIKE $${params.length + 1} OR p.description LIKE $${params.length + 2})`;
        params.push(`%${options.search}%`, `%${options.search}%`);
      }

      // Sắp xếp
      query += ` ORDER BY p.created_at DESC`;

      // Phân trang
      if (options.limit) {
        query += ` LIMIT $${params.length + 1}`;
        params.push(parseInt(options.limit));
        
        if (options.offset) {
          query += ` OFFSET $${params.length + 2}`;
          params.push(parseInt(options.offset));
        }
      }

      const rows = await executeQuery(query, params);
      return rows.map(row => new Product(row));
    } catch (error) {
      throw new Error(`Lỗi khi lấy danh sách sản phẩm: ${error.message}`);
    }
  }

  // Lấy sản phẩm theo ID
  static async findById(id) {
    try {
      const query = `
        SELECT p.*, c.name as category_name 
        FROM products p 
        LEFT JOIN categories c ON p.category_id = c.id
        WHERE p.id = $1 AND p.is_available = true
      `;
      
      const rows = await executeQuery(query, [id]);
      
      if (rows.length === 0) {
        return null;
      }
      
      return new Product(rows[0]);
    } catch (error) {
      throw new Error(`Lỗi khi lấy sản phẩm: ${error.message}`);
    }
  }

  // Lấy sản phẩm theo danh mục
  static async findByCategory(categoryId) {
    try {
      const query = `
        SELECT p.*, c.name as category_name 
        FROM products p 
        LEFT JOIN categories c ON p.category_id = c.id
        WHERE p.category_id = $1 AND p.is_available = true
        ORDER BY p.created_at DESC
      `;
      
      const rows = await executeQuery(query, [categoryId]);
      return rows.map(row => new Product(row));
    } catch (error) {
      throw new Error(`Lỗi khi lấy sản phẩm theo danh mục: ${error.message}`);
    }
  }

  // Tạo sản phẩm mới
  static async create(productData) {
    try {
      const query = `
        INSERT INTO products (name, description, price, image_url, category_id, is_available)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING id
      `;
      
      const params = [
        productData.name,
        productData.description,
        productData.price,
        productData.image_url,
        productData.category_id,
        productData.is_available !== undefined ? productData.is_available : true
      ];

      const result = await executeQuery(query, params);
      
      // Lấy sản phẩm vừa tạo
      return await Product.findById(result[0].id);
    } catch (error) {
      throw new Error(`Lỗi khi tạo sản phẩm: ${error.message}`);
    }
  }

  // Cập nhật sản phẩm
  static async update(id, productData) {
    try {
      const updates = [];
      const params = [];

      if (productData.name !== undefined) {
        updates.push('name = $1');
        params.push(productData.name);
      }
      if (productData.description !== undefined) {
        updates.push('description = $1');
        params.push(productData.description);
      }
      if (productData.price !== undefined) {
        updates.push('price = $1');
        params.push(productData.price);
      }
      if (productData.image_url !== undefined) {
        updates.push('image_url = $1');
        params.push(productData.image_url);
      }
      if (productData.category_id !== undefined) {
        updates.push('category_id = $1');
        params.push(productData.category_id);
      }
      if (productData.is_available !== undefined) {
        updates.push('is_available = $1');
        params.push(productData.is_available);
      }

      if (updates.length === 0) {
        throw new Error('Không có dữ liệu để cập nhật');
      }

      params.push(id);

      const query = `UPDATE products SET ${updates.join(', ')} WHERE id = $1`;
      await executeQuery(query, params);

      return await Product.findById(id);
    } catch (error) {
      throw new Error(`Lỗi khi cập nhật sản phẩm: ${error.message}`);
    }
  }

  // Xóa sản phẩm (soft delete)
  static async delete(id) {
    try {
      const query = `UPDATE products SET is_available = false WHERE id = $1`;
      await executeQuery(query, [id]);
      return true;
    } catch (error) {
      throw new Error(`Lỗi khi xóa sản phẩm: ${error.message}`);
    }
  }

  // Đếm tổng số sản phẩm
  static async count(options = {}) {
    try {
      let query = `SELECT COUNT(*) as total FROM products WHERE is_available = true`;
      const params = [];

      if (options.category_id) {
        query += ` AND category_id = $${params.length + 1}`;
        params.push(options.category_id);
      }

      if (options.search) {
        query += ` AND (name LIKE $${params.length + 1} OR description LIKE $${params.length + 2})`;
        params.push(`%${options.search}%`, `%${options.search}%`);
      }

      const rows = await executeQuery(query, params);
      // Convert BigInt to number to avoid mixing types
      return Number(rows[0].total);
    } catch (error) {
      throw new Error(`Lỗi khi đếm sản phẩm: ${error.message}`);
    }
  }

  // Lấy số lượng sản phẩm
  static async getCount() {
    try {
      const query = `SELECT COUNT(*) as count FROM products WHERE is_available = true`;
      const result = await executeQuery(query);
      return { count: Number(result[0].count) };
    } catch (error) {
      console.error('Error getting product count:', error);
      throw error;
    }
  }

  // Lấy sản phẩm với phân trang cho admin
  static async findAllWithPagination(options = {}) {
    try {
      const { page = 1, limit = 20, category, search } = options;
      const offset = (page - 1) * limit;

      let query = `
        SELECT p.*, c.name as category_name 
        FROM products p 
        LEFT JOIN categories c ON p.category_id = c.id
        WHERE 1=1
      `;
      
      const params = [];

      // Filter theo category
      if (category) {
        query += ` AND c.name = $${params.length + 1}`;
        params.push(category);
      }

      // Search theo tên
      if (search) {
        query += ` AND (p.name LIKE $${params.length + 1} OR p.description LIKE $${params.length + 2})`;
        params.push(`%${search}%`, `%${search}%`);
      }

      // Sắp xếp
      query += ` ORDER BY p.created_at DESC`;

      // Phân trang
      query += ` LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
      params.push(limit, offset);

      const products = await executeQuery(query, params);

      // Lấy tổng số sản phẩm
      let countQuery = `
        SELECT COUNT(*) as total
        FROM products p 
        LEFT JOIN categories c ON p.category_id = c.id
        WHERE 1=1
      `;
      const countParams = [];

      if (category) {
        countQuery += ` AND c.name = $${countParams.length + 1}`;
        countParams.push(category);
      }

      if (search) {
        countQuery += ` AND (p.name LIKE $${countParams.length + 1} OR p.description LIKE $${countParams.length + 2})`;
        countParams.push(`%${search}%`, `%${search}%`);
      }

      const countResult = await executeQuery(countQuery, countParams);
      const total = Number(countResult[0].total);

      return {
        products,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      console.error('Error finding products with pagination:', error);
      throw error;
    }
  }

  // Tìm kiếm sản phẩm theo từ khóa
  static async search(keyword, category_id = null, limit = 10, offset = 0) {
    let query = `
      SELECT p.*, c.name as category_name 
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.is_available = 1
    `;
    
    const params = [];
    
    if (keyword) {
      query += ` AND (p.name LIKE $${params.length + 1} OR p.description LIKE $${params.length + 2})`;
      params.push(`%${keyword}%`, `%${keyword}%`);
    }
    
    if (category_id) {
      query += ` AND p.category_id = $${params.length + 1}`;
      params.push(category_id);
    }
    
    query += ` ORDER BY p.created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);
    
    const rows = await executeQuery(query, params);
    return rows;
  }

  // Convert to JSON cho API response
  toJSON() {
    return {
      id: Number(this.id),
      name: this.name,
      description: this.description,
      price: parseFloat(this.price),
      image: this.image_url,
      category: this.category_name || null,
      category_id: Number(this.category_id),
      is_available: Boolean(this.is_available),
      created_at: this.created_at,
      updated_at: this.updated_at
    };
  }
}

module.exports = Product;
