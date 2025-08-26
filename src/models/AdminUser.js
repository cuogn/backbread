const { executeQuery } = require('../config/database');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('../config');

class AdminUser {
  // Tìm admin user theo username hoặc email
  static async findByUsername(username) {
    const query = `
      SELECT * FROM admin_users 
      WHERE (username = $1 OR email = $2) AND is_active = 1
    `;
    const rows = await executeQuery(query, [username, username]);
    return rows[0];
  }

  // Tìm admin user theo ID
  static async findById(id) {
    const query = `
      SELECT id, username, email, full_name, role, is_active, last_login, created_at 
      FROM admin_users 
      WHERE id = $1 AND is_active = 1
    `;
    const rows = await executeQuery(query, [id]);
    return rows[0];
  }

  // Tạo admin user mới
  static async create(userData) {
    const { username, email, password, full_name, role = 'admin' } = userData;
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const query = `
      INSERT INTO admin_users (username, email, password, full_name, role)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id
    `;
    
    const result = await executeQuery(query, [
      username, email, hashedPassword, full_name, role
    ]);
    
    return this.findById(result[0].id);
  }

  // Cập nhật thông tin admin user
  static async update(id, userData) {
    const { username, email, full_name, role, is_active } = userData;
    
    const query = `
      UPDATE admin_users 
      SET username = $1, email = $2, full_name = $3, role = $4, is_active = $5
      WHERE id = $6
    `;
    
    await executeQuery(query, [username, email, full_name, role, is_active, id]);
    return this.findById(id);
  }

  // Cập nhật mật khẩu
  static async updatePassword(id, newPassword) {
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    const query = `UPDATE admin_users SET password = $1 WHERE id = $2`;
    await executeQuery(query, [hashedPassword, id]);
    
    return true;
  }

  // Cập nhật last login
  static async updateLastLogin(id) {
    const query = `UPDATE admin_users SET last_login = NOW() WHERE id = $1`;
    await executeQuery(query, [id]);
  }

  // Xác thực mật khẩu
  static async verifyPassword(plainPassword, hashedPassword) {
    return await bcrypt.compare(plainPassword, hashedPassword);
  }

  // Tạo JWT token
  static generateToken(user) {
    const payload = {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role
    };
    
    return jwt.sign(payload, config.jwt.secret, {
      expiresIn: config.jwt.expiresIn
    });
  }

  // Xác thực JWT token
  static verifyToken(token) {
    try {
      return jwt.verify(token, config.jwt.secret);
    } catch (error) {
      return null;
    }
  }

  // Lấy danh sách tất cả admin users
  static async findAll() {
    const query = `
      SELECT id, username, email, full_name, role, is_active, last_login, created_at 
      FROM admin_users 
      ORDER BY created_at DESC
    `;
    const rows = await executeQuery(query);
    return rows;
  }

  // Xóa admin user (soft delete)
  static async delete(id) {
    const query = `UPDATE admin_users SET is_active = 0 WHERE id = $1`;
    await executeQuery(query, [id]);
    return true;
  }
}

module.exports = AdminUser;
