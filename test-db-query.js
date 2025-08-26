const { executeQuery } = require('./src/config/database');

async function testDbQuery() {
  console.log('🧪 Testing Database Query...');
  
  try {
    // Test the exact query from AdminUser.findByUsername
    const query = `
      SELECT * FROM admin_users 
      WHERE (username = $1 OR email = $2) AND is_active = TRUE
    `;
    
    console.log('Query:', query);
    console.log('Params:', ['admin', 'admin']);
    
    const rows = await executeQuery(query, ['admin', 'admin']);
    console.log('Result:', rows);
    
    if (rows.length > 0) {
      console.log('✅ Admin user found:', {
        id: rows[0].id,
        username: rows[0].username,
        email: rows[0].email,
        is_active: rows[0].is_active
      });
    } else {
      console.log('❌ No admin user found');
    }
    
  } catch (error) {
    console.error('❌ Database Error:', error);
  }
}

testDbQuery();
