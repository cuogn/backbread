const { Pool } = require('pg');
require('dotenv').config();

// Parse PostgreSQL connection string
const parseConnectionString = (connectionString) => {
  const url = new URL(connectionString);
  return {
    host: url.hostname,
    port: url.port,
    user: url.username,
    password: url.password,
    database: url.pathname.slice(1), // Remove leading slash
    ssl: {
      rejectUnauthorized: false // For Render.com PostgreSQL
    }
  };
};

// Cấu hình connection pool cho PostgreSQL
const pool = new Pool(parseConnectionString(process.env.DATABASE_URL || 'postgresql://localhost:5432/banh_mi_son'));

// Test kết nối database
const testConnection = async () => {
  let client;
  try {
    client = await pool.connect();
    console.log('✅ Kết nối PostgreSQL thành công!');
    
    // Test query
    const result = await client.query('SELECT NOW() as current_time');
    console.log('✅ Test query thành công:', result.rows[0]);
    
  } catch (err) {
    console.error('❌ Lỗi kết nối PostgreSQL:', err.message);
    throw err;
  } finally {
    if (client) client.release();
  }
};

// Hàm thực thi query với error handling
const executeQuery = async (query, params = []) => {
  let client;
  try {
    client = await pool.connect();
    const result = await client.query(query, params);
    return result.rows;
  } catch (err) {
    console.error('❌ Database Query Error:', err.message);
    console.error('Query:', query);
    console.error('Params:', params);
    throw err;
  } finally {
    if (client) client.release();
  }
};

// Hàm thực thi transaction
const executeTransaction = async (queries) => {
  let client;
  try {
    client = await pool.connect();
    await client.query('BEGIN');
    
    const results = [];
    for (const query of queries) {
      const result = await client.query(query.sql, query.params || []);
      results.push(result.rows);
    }
    
    await client.query('COMMIT');
    return results;
  } catch (err) {
    if (client) {
      await client.query('ROLLBACK');
    }
    console.error('❌ Transaction Error:', err.message);
    throw err;
  } finally {
    if (client) client.release();
  }
};

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🔄 Đang đóng kết nối database...');
  await pool.end();
  console.log('✅ Database connections đã đóng');
  process.exit(0);
});

module.exports = {
  pool,
  testConnection,
  executeQuery,
  executeTransaction
};
