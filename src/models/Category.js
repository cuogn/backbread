const { executeQuery } = require('../config/database');

class Category {
  constructor(data) {
    this.id = data.id;
    this.name = data.name;
    this.description = data.description;
    this.is_active = data.is_active;
    this.created_at = data.created_at;
    this.updated_at = data.updated_at;
  }

  // Lấy tất cả danh mục
  static async findAll() {
    try {
      const query = `
        SELECT * FROM categories 
        WHERE is_active = true 
        ORDER BY created_at ASC
      `;
      
      const rows = await executeQuery(query);
      return rows.map(row => new Category(row));
    } catch (error) {
      throw new Error(`Lỗi khi lấy danh sách danh mục: ${error.message}`);
    }
  }

  // Lấy danh mục theo ID
  static async findById(id) {
    try {
      const query = `SELECT * FROM categories WHERE id = ? AND is_active = true`;
      const rows = await executeQuery(query, [id]);
      
      if (rows.length === 0) {
        return null;
      }
      
      return new Category(rows[0]);
    } catch (error) {
      throw new Error(`Lỗi khi lấy danh mục: ${error.message}`);
    }
  }

  // Lấy danh mục theo tên
  static async findByName(name) {
    try {
      const query = `SELECT * FROM categories WHERE name = ? AND is_active = true`;
      const rows = await executeQuery(query, [name]);
      
      if (rows.length === 0) {
        return null;
      }
      
      return new Category(rows[0]);
    } catch (error) {
      throw new Error(`Lỗi khi lấy danh mục theo tên: ${error.message}`);
    }
  }

  // Lấy danh mục với số lượng sản phẩm
  static async findAllWithProductCount() {
    try {
      const query = `
        SELECT c.*, COUNT(p.id) as product_count
        FROM categories c
        LEFT JOIN products p ON c.id = p.category_id AND p.is_available = true
        WHERE c.is_active = true
        GROUP BY c.id
        ORDER BY c.created_at ASC
      `;
      
      const rows = await executeQuery(query);
      return rows.map(row => ({
        ...new Category(row).toJSON(),
        product_count: Number(row.product_count)
      }));
    } catch (error) {
      throw new Error(`Lỗi khi lấy danh mục với số lượng sản phẩm: ${error.message}`);
    }
  }

  // Tạo danh mục mới
  static async create(categoryData) {
    try {
      const query = `
        INSERT INTO categories (name, description, is_active)
        VALUES (?, ?, ?)
      `;
      
      const params = [
        categoryData.name,
        categoryData.description || null,
        categoryData.is_active !== undefined ? categoryData.is_active : true
      ];

      const result = await executeQuery(query, params);
      
      // Lấy danh mục vừa tạo
      return await Category.findById(Number(result.insertId));
    } catch (error) {
      if (error.code === 'ER_DUP_ENTRY') {
        throw new Error('Tên danh mục đã tồn tại');
      }
      throw new Error(`Lỗi khi tạo danh mục: ${error.message}`);
    }
  }

  // Cập nhật danh mục
  static async update(id, categoryData) {
    try {
      const updates = [];
      const params = [];

      if (categoryData.name !== undefined) {
        updates.push('name = ?');
        params.push(categoryData.name);
      }
      if (categoryData.description !== undefined) {
        updates.push('description = ?');
        params.push(categoryData.description);
      }
      if (categoryData.is_active !== undefined) {
        updates.push('is_active = ?');
        params.push(categoryData.is_active);
      }

      if (updates.length === 0) {
        throw new Error('Không có dữ liệu để cập nhật');
      }

      params.push(id);

      const query = `UPDATE categories SET ${updates.join(', ')} WHERE id = ?`;
      await executeQuery(query, params);

      return await Category.findById(id);
    } catch (error) {
      if (error.code === 'ER_DUP_ENTRY') {
        throw new Error('Tên danh mục đã tồn tại');
      }
      throw new Error(`Lỗi khi cập nhật danh mục: ${error.message}`);
    }
  }

  // Xóa danh mục (soft delete)
  static async delete(id) {
    try {
      // Kiểm tra xem danh mục có sản phẩm không
      const productCountQuery = `
        SELECT COUNT(*) as count 
        FROM products 
        WHERE category_id = ? AND is_available = true
      `;
      const productCount = await executeQuery(productCountQuery, [id]);
      
      if (productCount[0].count > 0) {
        throw new Error('Không thể xóa danh mục vì còn sản phẩm thuộc danh mục này');
      }

      const query = `UPDATE categories SET is_active = false WHERE id = ?`;
      await executeQuery(query, [id]);
      return true;
    } catch (error) {
      throw new Error(`Lỗi khi xóa danh mục: ${error.message}`);
    }
  }

  // Lấy số lượng danh mục
  static async getCount() {
    try {
      const query = `SELECT COUNT(*) as count FROM categories WHERE is_active = true`;
      const result = await executeQuery(query);
      return { count: Number(result[0].count) };
    } catch (error) {
      console.error('Error getting category count:', error);
      throw error;
    }
  }

  // Convert to JSON cho API response
  toJSON() {
    return {
      id: Number(this.id),
      name: this.name,
      description: this.description,
      is_active: Boolean(this.is_active),
      created_at: this.created_at,
      updated_at: this.updated_at
    };
  }
}

module.exports = Category;
