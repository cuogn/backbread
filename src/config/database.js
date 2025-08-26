const mariadb = require('mariadb');
require('dotenv').config();

// Cấu hình connection pool cho MariaDB
const pool = mariadb.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'banh_mi_son',
  connectionLimit: 20,
  acquireTimeout: 30000,
  timeout: 30000,
  charset: 'utf8mb4',
  // Tự động reconnect khi mất kết nối
  reconnect: true
});

// Test kết nối database
const testConnection = async () => {
  let conn;
  try {
    conn = await pool.getConnection();
    console.log('✅ Kết nối MariaDB thành công!');
    
    // Test query
    const rows = await conn.query('SELECT 1 as test');
    console.log('✅ Test query thành công:', rows);
    
  } catch (err) {
    console.error('❌ Lỗi kết nối MariaDB:', err.message);
    throw err;
  } finally {
    if (conn) conn.release();
  }
};

// Hàm thực thi query với error handling
const executeQuery = async (query, params = []) => {
  let conn;
  try {
    conn = await pool.getConnection();
    const result = await conn.query(query, params);
    return result;
  } catch (err) {
    console.error('❌ Database Query Error:', err.message);
    console.error('Query:', query);
    console.error('Params:', params);
    throw err;
  } finally {
    if (conn) conn.release();
  }
};

// Hàm thực thi transaction
const executeTransaction = async (queries) => {
  let conn;
  try {
    conn = await pool.getConnection();
    await conn.beginTransaction();
    
    const results = [];
    for (const { query, params } of queries) {
      const result = await conn.query(query, params);
      results.push(result);
    }
    
    await conn.commit();
    return results;
  } catch (err) {
    if (conn) await conn.rollback();
    console.error('❌ Transaction Error:', err.message);
    throw err;
  } finally {
    if (conn) conn.release();
  }
};

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('🔄 Đang đóng kết nối database...');
  await pool.end();
  console.log('✅ Đã đóng kết nối database');
  process.exit(0);
});

module.exports = {
  pool,
  testConnection,
  executeQuery,
  executeTransaction
};
