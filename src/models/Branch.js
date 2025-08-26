const { executeQuery } = require('../config/database');

class Branch {
  constructor(data) {
    this.id = data.id;
    this.name = data.name;
    this.address = data.address;
    this.phone = data.phone;
    this.is_active = data.is_active;
    this.created_at = data.created_at;
    this.updated_at = data.updated_at;
  }

  // Lấy tất cả chi nhánh
  static async findAll() {
    try {
      const query = `
        SELECT * FROM branches 
        WHERE is_active = true 
        ORDER BY created_at ASC
      `;
      
      const rows = await executeQuery(query);
      return rows.map(row => new Branch(row));
    } catch (error) {
      throw new Error(`Lỗi khi lấy danh sách chi nhánh: ${error.message}`);
    }
  }

  // Lấy chi nhánh theo ID
  static async findById(id) {
    try {
      const query = `SELECT * FROM branches WHERE id = ? AND is_active = true`;
      const rows = await executeQuery(query, [id]);
      
      if (rows.length === 0) {
        return null;
      }
      
      return new Branch(rows[0]);
    } catch (error) {
      throw new Error(`Lỗi khi lấy chi nhánh: ${error.message}`);
    }
  }

  // Tạo chi nhánh mới
  static async create(branchData) {
    try {
      const query = `
        INSERT INTO branches (name, address, phone, is_active)
        VALUES (?, ?, ?, ?)
      `;
      
      const params = [
        branchData.name,
        branchData.address,
        branchData.phone,
        branchData.is_active !== undefined ? branchData.is_active : true
      ];

      const result = await executeQuery(query, params);
      
      // Lấy chi nhánh vừa tạo
      return await Branch.findById(Number(result.insertId));
    } catch (error) {
      throw new Error(`Lỗi khi tạo chi nhánh: ${error.message}`);
    }
  }

  // Cập nhật chi nhánh
  static async update(id, branchData) {
    try {
      const updates = [];
      const params = [];

      if (branchData.name !== undefined) {
        updates.push('name = ?');
        params.push(branchData.name);
      }
      if (branchData.address !== undefined) {
        updates.push('address = ?');
        params.push(branchData.address);
      }
      if (branchData.phone !== undefined) {
        updates.push('phone = ?');
        params.push(branchData.phone);
      }
      if (branchData.is_active !== undefined) {
        updates.push('is_active = ?');
        params.push(branchData.is_active);
      }

      if (updates.length === 0) {
        throw new Error('Không có dữ liệu để cập nhật');
      }

      params.push(id);

      const query = `UPDATE branches SET ${updates.join(', ')} WHERE id = ?`;
      await executeQuery(query, params);

      return await Branch.findById(id);
    } catch (error) {
      throw new Error(`Lỗi khi cập nhật chi nhánh: ${error.message}`);
    }
  }

  // Xóa chi nhánh (soft delete)
  static async delete(id) {
    try {
      // Kiểm tra xem chi nhánh có đơn hàng không
      const orderCountQuery = `
        SELECT COUNT(*) as count 
        FROM orders 
        WHERE branch_id = ?
      `;
      const orderCount = await executeQuery(orderCountQuery, [id]);
      
      if (orderCount[0].count > 0) {
        throw new Error('Không thể xóa chi nhánh vì có đơn hàng liên quan');
      }

      const query = `UPDATE branches SET is_active = false WHERE id = ?`;
      await executeQuery(query, [id]);
      return true;
    } catch (error) {
      throw new Error(`Lỗi khi xóa chi nhánh: ${error.message}`);
    }
  }

  // Convert to JSON cho API response
  // Lấy số lượng chi nhánh
  static async getCount() {
    try {
      const query = `SELECT COUNT(*) as count FROM branches WHERE is_active = true`;
      const result = await executeQuery(query);
      return { count: Number(result[0].count) };
    } catch (error) {
      console.error('Error getting branch count:', error);
      throw error;
    }
  }

  toJSON() {
    return {
      id: Number(this.id),
      name: this.name,
      address: this.address,
      phone: this.phone,
      is_active: Boolean(this.is_active),
      created_at: this.created_at,
      updated_at: this.updated_at
    };
  }
}

module.exports = Branch;
