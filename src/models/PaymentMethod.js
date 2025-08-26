const { executeQuery } = require('../config/database');

class PaymentMethod {
  constructor(data) {
    this.id = data.id;
    this.name = data.name;
    this.code = data.code;
    this.icon = data.icon;
    this.is_active = data.is_active;
    this.created_at = data.created_at;
    this.updated_at = data.updated_at;
  }

  // Lấy tất cả phương thức thanh toán
  static async findAll() {
    try {
      const query = `
        SELECT * FROM payment_methods 
        WHERE is_active = true 
        ORDER BY created_at ASC
      `;
      
      const rows = await executeQuery(query);
      return rows.map(row => new PaymentMethod(row));
    } catch (error) {
      throw new Error(`Lỗi khi lấy danh sách phương thức thanh toán: ${error.message}`);
    }
  }

  // Lấy phương thức thanh toán theo ID
  static async findById(id) {
    try {
      const query = `SELECT * FROM payment_methods WHERE id = ? AND is_active = true`;
      const rows = await executeQuery(query, [id]);
      
      if (rows.length === 0) {
        return null;
      }
      
      return new PaymentMethod(rows[0]);
    } catch (error) {
      throw new Error(`Lỗi khi lấy phương thức thanh toán: ${error.message}`);
    }
  }

  // Lấy phương thức thanh toán theo code
  static async findByCode(code) {
    try {
      const query = `SELECT * FROM payment_methods WHERE code = ? AND is_active = true`;
      const rows = await executeQuery(query, [code]);
      
      if (rows.length === 0) {
        return null;
      }
      
      return new PaymentMethod(rows[0]);
    } catch (error) {
      throw new Error(`Lỗi khi lấy phương thức thanh toán theo mã: ${error.message}`);
    }
  }

  // Tạo phương thức thanh toán mới
  static async create(paymentMethodData) {
    try {
      const query = `
        INSERT INTO payment_methods (name, code, icon, is_active)
        VALUES (?, ?, ?, ?)
      `;
      
      const params = [
        paymentMethodData.name,
        paymentMethodData.code,
        paymentMethodData.icon || null,
        paymentMethodData.is_active !== undefined ? paymentMethodData.is_active : true
      ];

      const result = await executeQuery(query, params);
      
      // Lấy phương thức thanh toán vừa tạo
      return await PaymentMethod.findById(Number(result.insertId));
    } catch (error) {
      if (error.code === 'ER_DUP_ENTRY') {
        throw new Error('Mã phương thức thanh toán đã tồn tại');
      }
      throw new Error(`Lỗi khi tạo phương thức thanh toán: ${error.message}`);
    }
  }

  // Cập nhật phương thức thanh toán
  static async update(id, paymentMethodData) {
    try {
      const updates = [];
      const params = [];

      if (paymentMethodData.name !== undefined) {
        updates.push('name = ?');
        params.push(paymentMethodData.name);
      }
      if (paymentMethodData.code !== undefined) {
        updates.push('code = ?');
        params.push(paymentMethodData.code);
      }
      if (paymentMethodData.icon !== undefined) {
        updates.push('icon = ?');
        params.push(paymentMethodData.icon);
      }
      if (paymentMethodData.is_active !== undefined) {
        updates.push('is_active = ?');
        params.push(paymentMethodData.is_active);
      }

      if (updates.length === 0) {
        throw new Error('Không có dữ liệu để cập nhật');
      }

      params.push(id);

      const query = `UPDATE payment_methods SET ${updates.join(', ')} WHERE id = ?`;
      await executeQuery(query, params);

      return await PaymentMethod.findById(id);
    } catch (error) {
      if (error.code === 'ER_DUP_ENTRY') {
        throw new Error('Mã phương thức thanh toán đã tồn tại');
      }
      throw new Error(`Lỗi khi cập nhật phương thức thanh toán: ${error.message}`);
    }
  }

  // Xóa phương thức thanh toán (soft delete)
  static async delete(id) {
    try {
      // Kiểm tra xem phương thức thanh toán có đơn hàng không
      const orderCountQuery = `
        SELECT COUNT(*) as count 
        FROM orders 
        WHERE payment_method_id = ?
      `;
      const orderCount = await executeQuery(orderCountQuery, [id]);
      
      if (orderCount[0].count > 0) {
        throw new Error('Không thể xóa phương thức thanh toán vì có đơn hàng sử dụng');
      }

      const query = `UPDATE payment_methods SET is_active = false WHERE id = ?`;
      await executeQuery(query, [id]);
      return true;
    } catch (error) {
      throw new Error(`Lỗi khi xóa phương thức thanh toán: ${error.message}`);
    }
  }

  // Convert to JSON cho API response
  toJSON() {
    return {
      id: Number(this.id),
      name: this.name,
      code: this.code,
      icon: this.icon,
      is_active: Boolean(this.is_active),
      created_at: this.created_at,
      updated_at: this.updated_at
    };
  }
}

module.exports = PaymentMethod;
