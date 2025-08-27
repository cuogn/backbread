const { executeQuery, executeTransaction } = require('../config/database');

class Order {
  constructor(data) {
    this.id = data.id;
    this.order_code = data.order_code;
    this.customer_id = data.customer_id;
    this.branch_id = data.branch_id;
    this.payment_method_id = data.payment_method_id;
    this.total_amount = data.total_amount;
    this.status = data.status;
    this.customer_name = data.customer_name;
    this.customer_phone = data.customer_phone;
    this.customer_email = data.customer_email;
    this.delivery_address = data.delivery_address;
    this.notes = data.notes;
    this.created_at = data.created_at;
    this.updated_at = data.updated_at;
  }

  // Tạo mã đơn hàng tự động
  static generateOrderCode() {
    const now = new Date();
    const timestamp = now.getTime().toString().slice(-8); // Lấy 8 số cuối
    return `BM${timestamp}`;
  }

  // Lấy tất cả đơn hàng
  static async findAll(options = {}) {
    try {
      let query = `
        SELECT o.*, 
               c.name as customer_name_full,
               b.name as branch_name,
               b.address as branch_address,
               pm.name as payment_method_name
        FROM orders o
        LEFT JOIN customers c ON o.customer_id = c.id
        LEFT JOIN branches b ON o.branch_id = b.id
        LEFT JOIN payment_methods pm ON o.payment_method_id = pm.id
        WHERE 1=1
      `;
      
      const params = [];

      // Filter theo status
      if (options.status) {
        query += ` AND o.status = $${params.length + 1}`;
        params.push(options.status);
      }

      // Filter theo branch
      if (options.branch_id) {
        query += ` AND o.branch_id = $${params.length + 1}`;
        params.push(options.branch_id);
      }

      // Filter theo ngày
      if (options.date_from) {
        query += ` AND DATE(o.created_at) >= $${params.length + 1}`;
        params.push(options.date_from);
      }
      if (options.date_to) {
        query += ` AND DATE(o.created_at) <= $${params.length + 1}`;
        params.push(options.date_to);
      }

      // Search theo order code, customer name, hoặc phone
      if (options.search) {
        query += ` AND (o.order_code LIKE $${params.length + 1} OR o.customer_name LIKE $${params.length + 2} OR o.customer_phone LIKE $${params.length + 3})`;
        params.push(`%${options.search}%`, `%${options.search}%`, `%${options.search}%`);
      }

      // Sắp xếp
      query += ` ORDER BY o.created_at DESC`;

      // Phân trang
      if (options.limit) {
        query += ` LIMIT $${params.length + 1}`;
        params.push(parseInt(options.limit));
        
        if (options.offset) {
          query += ` OFFSET $${params.length + 1}`;
          params.push(parseInt(options.offset));
        }
      }

      const rows = await executeQuery(query, params);
      return rows.map(row => new Order(row));
    } catch (error) {
      throw new Error(`Lỗi khi lấy danh sách đơn hàng: ${error.message}`);
    }
  }

  // Lấy đơn hàng theo ID
  static async findById(id) {
    try {
      const query = `
        SELECT o.*, 
               c.name as customer_name_full,
               b.name as branch_name,
               b.address as branch_address,
               b.phone as branch_phone,
               pm.name as payment_method_name,
               pm.code as payment_method_code
        FROM orders o
        LEFT JOIN customers c ON o.customer_id = c.id
        LEFT JOIN branches b ON o.branch_id = b.id
        LEFT JOIN payment_methods pm ON o.payment_method_id = pm.id
        WHERE o.id = $1
      `;
      
      const rows = await executeQuery(query, [id]);
      
      if (rows.length === 0) {
        return null;
      }
      
      const order = new Order(rows[0]);
      
      // Lấy chi tiết đơn hàng
      order.items = await this.getOrderItems(id);
      
      return order;
    } catch (error) {
      throw new Error(`Lỗi khi lấy đơn hàng: ${error.message}`);
    }
  }

  // Lấy đơn hàng theo mã đơn hàng
  static async findByOrderCode(orderCode) {
    try {
      const query = `
        SELECT o.*, 
               c.name as customer_name_full,
               b.name as branch_name,
               b.address as branch_address,
               b.phone as branch_phone,
               pm.name as payment_method_name,
               pm.code as payment_method_code
        FROM orders o
        LEFT JOIN customers c ON o.customer_id = c.id
        LEFT JOIN branches b ON o.branch_id = b.id
        LEFT JOIN payment_methods pm ON o.payment_method_id = pm.id
        WHERE o.order_code = $1
      `;
      
      const rows = await executeQuery(query, [orderCode]);
      
      if (rows.length === 0) {
        return null;
      }
      
      const order = new Order(rows[0]);
      
      // Lấy chi tiết đơn hàng
      order.items = await this.getOrderItems(order.id);
      
      return order;
    } catch (error) {
      throw new Error(`Lỗi khi lấy đơn hàng theo mã: ${error.message}`);
    }
  }

  // Lấy chi tiết đơn hàng
  static async getOrderItems(orderId) {
    try {
      const query = `
        SELECT oi.*, p.name as product_name, p.image_url as product_image
        FROM order_items oi
        LEFT JOIN products p ON oi.product_id = p.id
        WHERE oi.order_id = $1
        ORDER BY oi.id
      `;
      
      const rows = await executeQuery(query, [orderId]);
      return rows;
    } catch (error) {
      throw new Error(`Lỗi khi lấy chi tiết đơn hàng: ${error.message}`);
    }
  }

  // Tạo đơn hàng mới
  static async create(orderData) {
    try {
      const orderCode = this.generateOrderCode();
      
      // Prepare transaction queries
      const queries = [];
      
      // 1. Tạo hoặc lấy customer
      let customerId;
      const existingCustomer = await executeQuery(
        'SELECT id FROM customers WHERE phone = $1',
        [orderData.customerInfo.phone]
      );
      
      if (existingCustomer.length > 0) {
        customerId = existingCustomer[0].id;
        // Cập nhật thông tin customer
        queries.push({
          sql: `UPDATE customers SET name = $1, email = $2, address = $3 WHERE id = $4`,
          params: [
            orderData.customerInfo.name,
            orderData.customerInfo.email || null,
            orderData.customerInfo.address,
            customerId
          ]
        });
      } else {
        // Tạo customer mới
        queries.push({
          sql: `INSERT INTO customers (name, phone, email, address) VALUES ($1, $2, $3, $4) RETURNING id`,
          params: [
            orderData.customerInfo.name,
            orderData.customerInfo.phone,
            orderData.customerInfo.email || null,
            orderData.customerInfo.address
          ]
        });
      }

      // 2. Tạo order
      const orderQuery = `
        INSERT INTO orders (
          order_code, customer_id, branch_id, payment_method_id, 
          total_amount, customer_name, customer_phone, customer_email, 
          delivery_address, notes, status
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING id
      `;
      
      // 3. Thực thi transaction
      const results = await executeTransaction([
        // Tạo customer nếu chưa có
        ...(existingCustomer.length === 0 ? [queries[0]] : []),
        // Tạo order
        {
          sql: orderQuery,
          params: [
            orderCode,
            existingCustomer.length > 0 ? customerId : null, // Sẽ được set sau khi tạo customer
            orderData.branch_id,
            orderData.payment_method_id,
            orderData.total_amount,
            orderData.customerInfo.name,
            orderData.customerInfo.phone,
            orderData.customerInfo.email || null,
            orderData.customerInfo.address,
            orderData.notes || null,
            'pending'
          ]
        }
      ]);

      // Lấy order ID
      const orderId = Number(results[results.length - 1][0].id);
      
      // Nếu tạo customer mới, cập nhật customer_id cho order
      if (existingCustomer.length === 0) {
        const newCustomerId = Number(results[0][0].id);
        await executeQuery(
          'UPDATE orders SET customer_id = $1 WHERE id = $2',
          [newCustomerId, orderId]
        );
      }

      // 4. Tạo order items
      for (const item of orderData.items) {
        await executeQuery(
          `INSERT INTO order_items (order_id, product_id, product_name, product_price, quantity, subtotal)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [
            orderId,
            item.product.id,
            item.product.name,
            item.product.price,
            item.quantity,
            item.product.price * item.quantity
          ]
        );
      }

      // Lấy đơn hàng vừa tạo
      return await this.findById(orderId);
    } catch (error) {
      throw new Error(`Lỗi khi tạo đơn hàng: ${error.message}`);
    }
  }

  // Cập nhật trạng thái đơn hàng
  static async updateStatus(id, status) {
    try {
      const validStatuses = ['pending', 'confirmed', 'preparing', 'delivering', 'completed', 'cancelled'];
      
      if (!validStatuses.includes(status)) {
        throw new Error('Trạng thái đơn hàng không hợp lệ');
      }

      const query = `UPDATE orders SET status = $1 WHERE id = $2`;
      await executeQuery(query, [status, id]);

      return await this.findById(id);
    } catch (error) {
      throw new Error(`Lỗi khi cập nhật trạng thái đơn hàng: ${error.message}`);
    }
  }

  // Thống kê đơn hàng
  static async getStatistics(options = {}) {
    try {
      let dateCondition = '';
      const params = [];

      if (options.date_from && options.date_to) {
        dateCondition = 'WHERE DATE(created_at) BETWEEN $1 AND $2';
        params.push(options.date_from, options.date_to);
      } else if (options.date_from) {
        dateCondition = 'WHERE DATE(created_at) >= $1';
        params.push(options.date_from);
      } else if (options.date_to) {
        dateCondition = 'WHERE DATE(created_at) <= $1';
        params.push(options.date_to);
      }

      const queries = [
        // Tổng số đơn hàng
        `SELECT COUNT(*) as total_orders FROM orders ${dateCondition}`,
        // Tổng doanh thu
        `SELECT SUM(total_amount) as total_revenue FROM orders ${dateCondition} AND status != 'cancelled'`,
        // Đơn hàng theo trạng thái
        `SELECT status, COUNT(*) as count FROM orders ${dateCondition} GROUP BY status`,
        // Doanh thu theo ngày
        `SELECT DATE(created_at) as date, SUM(total_amount) as revenue 
         FROM orders ${dateCondition} AND status != 'cancelled' 
         GROUP BY DATE(created_at) ORDER BY date DESC LIMIT 7`
      ];

      const results = await Promise.all(
        queries.map(query => executeQuery(query, params))
      );

      return {
        total_orders: results[0][0].total_orders || 0,
        total_revenue: parseFloat(results[1][0].total_revenue || 0),
        orders_by_status: results[2],
        daily_revenue: results[3]
      };
    } catch (error) {
      throw new Error(`Lỗi khi lấy thống kê: ${error.message}`);
    }
  }

  // Lấy số lượng đơn hàng
  static async getCount() {
    try {
      const query = `SELECT COUNT(*) as count FROM orders`;
      const result = await executeQuery(query);
      return { count: Number(result[0].count) };
    } catch (error) {
      console.error('Error getting order count:', error);
      throw error;
    }
  }

  // Lấy số lượng đơn hàng hôm nay
  static async getTodayCount() {
    try {
      const query = `SELECT COUNT(*) as count FROM orders WHERE DATE(created_at) = CURRENT_DATE`;
      const result = await executeQuery(query);
      return { count: Number(result[0].count) };
    } catch (error) {
      console.error('Error getting today order count:', error);
      throw error;
    }
  }

  // Lấy tổng doanh thu
  static async getTotalRevenue() {
    try {
      const query = `SELECT SUM(total_amount) as revenue FROM orders WHERE status != 'cancelled'`;
      const result = await executeQuery(query);
      return { revenue: Number(result[0].revenue) || 0 };
    } catch (error) {
      console.error('Error getting total revenue:', error);
      throw error;
    }
  }

  // Lấy đơn hàng với phân trang cho admin
  static async findAllWithPagination(options = {}) {
    try {
      const { page = 1, limit = 20, status, branch_id } = options;
      const offset = (page - 1) * limit;

      let query = `
        SELECT o.*, 
               c.name as customer_name_full,
               b.name as branch_name,
               b.address as branch_address,
               pm.name as payment_method_name
        FROM orders o
        LEFT JOIN customers c ON o.customer_id = c.id
        LEFT JOIN branches b ON o.branch_id = b.id
        LEFT JOIN payment_methods pm ON o.payment_method_id = pm.id
        WHERE 1=1
      `;
      
      const params = [];

      // Filter theo status
      if (status) {
        query += ` AND o.status = $${params.length + 1}`;
        params.push(status);
      }

      // Filter theo branch
      if (branch_id) {
        query += ` AND o.branch_id = $${params.length + 1}`;
        params.push(branch_id);
      }

      // Sắp xếp
      query += ` ORDER BY o.created_at DESC`;

      // Phân trang
      query += ` LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
      params.push(limit, offset);

      const orders = await executeQuery(query, params);

      // Lấy tổng số đơn hàng
      let countQuery = `
        SELECT COUNT(*) as total
        FROM orders o
        WHERE 1=1
      `;
      const countParams = [];

      if (status) {
        countQuery += ` AND o.status = $${countParams.length + 1}`;
        countParams.push(status);
      }

      if (branch_id) {
        countQuery += ` AND o.branch_id = $${countParams.length + 1}`;
        countParams.push(branch_id);
      }

      const countResult = await executeQuery(countQuery, countParams);
      const total = Number(countResult[0].total);

      return {
        orders,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      console.error('Error finding orders with pagination:', error);
      throw error;
    }
  }

  // Convert to JSON cho API response
  toJSON() {
    return {
      id: this.id,
      order_code: this.order_code,
      customer: {
        id: this.customer_id,
        name: this.customer_name,
        phone: this.customer_phone,
        email: this.customer_email,
        address: this.delivery_address
      },
      branch: {
        id: this.branch_id,
        name: this.branch_name,
        address: this.branch_address,
        phone: this.branch_phone
      },
      payment_method: {
        id: this.payment_method_id,
        name: this.payment_method_name,
        code: this.payment_method_code
      },
      total_amount: parseFloat(this.total_amount),
      status: this.status,
      notes: this.notes,
      items: this.items || [],
      created_at: this.created_at,
      updated_at: this.updated_at
    };
  }
}

module.exports = Order;
