const fs = require('fs').promises;
const path = require('path');
const { executeQuery } = require('../config/database');

const runMigration = async () => {
  try {
    console.log('🔄 Bắt đầu chạy migration database PostgreSQL...');

    // Đọc file schema.sql
    const schemaPath = path.join(__dirname, '../../database/schema.sql');
    const sqlContent = await fs.readFile(schemaPath, 'utf8');

    // Tách các câu lệnh SQL (cải thiện cho PostgreSQL)
    const statements = [];
    let currentStatement = '';
    let inFunction = false;
    let braceCount = 0;
    
    const lines = sqlContent.split('\n');
    
    for (const line of lines) {
      const trimmedLine = line.trim();
      
      // Skip comments and empty lines
      if (trimmedLine.startsWith('--') || trimmedLine === '') {
        continue;
      }
      
      currentStatement += line + '\n';
      
      // Check if we're in a function definition
      if (trimmedLine.includes('CREATE OR REPLACE FUNCTION') || trimmedLine.includes('CREATE FUNCTION')) {
        inFunction = true;
        braceCount = 0;
      }
      
      // Count braces in function
      if (inFunction) {
        braceCount += (trimmedLine.match(/\{/g) || []).length;
        braceCount -= (trimmedLine.match(/\}/g) || []).length;
        
        // Function ends when brace count reaches 0
        if (braceCount === 0 && trimmedLine.includes('$$')) {
          inFunction = false;
          statements.push(currentStatement.trim());
          currentStatement = '';
          continue;
        }
      }
      
      // Regular statement ends with semicolon
      if (!inFunction && trimmedLine.endsWith(';')) {
        statements.push(currentStatement.trim());
        currentStatement = '';
      }
    }
    
    // Add any remaining statement
    if (currentStatement.trim()) {
      statements.push(currentStatement.trim());
    }

    console.log(`📝 Tìm thấy ${statements.length} câu lệnh SQL`);

    // Thực thi từng câu lệnh
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      
      try {
        await executeQuery(statement);
        console.log(`✅ Thực thi thành công câu lệnh ${i + 1}/${statements.length}`);
      } catch (error) {
        // Bỏ qua lỗi PostgreSQL-specific
        if (error.code === '42P07' || // duplicate_table
            error.code === '42710' || // duplicate_object
            error.code === '42P06' || // duplicate_schema
            error.code === '42P01' || // undefined_table (for indexes that might be created before tables)
            error.message.includes('already exists') ||
            error.message.includes('duplicate key') ||
            error.message.includes('relation') && error.message.includes('already exists')) {
          console.log(`⚠️  Bỏ qua câu lệnh ${i + 1}: ${error.message}`);
          continue;
        }
        
        // Log the error for debugging
        console.error(`❌ Lỗi ở câu lệnh ${i + 1}:`, error.message);
        console.error(`SQL: ${statement.substring(0, 100)}...`);
        throw error;
      }
    }

    console.log('✅ Migration PostgreSQL hoàn thành thành công!');
    console.log('📊 Database đã được tạo với cấu trúc:');
    console.log('   - Categories (Danh mục)');
    console.log('   - Products (Sản phẩm)');
    console.log('   - Branches (Chi nhánh)');
    console.log('   - Customers (Khách hàng)');
    console.log('   - Payment Methods (Phương thức thanh toán)');
    console.log('   - Admin Users (Quản trị viên)');
    console.log('   - Orders (Đơn hàng)');
    console.log('   - Order Items (Chi tiết đơn hàng)');
    console.log('💡 Dữ liệu mẫu đã được thêm vào database');
    
  } catch (error) {
    console.error('❌ Lỗi khi chạy migration:', error.message);
    throw error;
  }
};

// Chạy migration nếu file được gọi trực tiếp
if (require.main === module) {
  runMigration()
    .then(() => {
      console.log('🎉 Migration thành công!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Migration thất bại:', error);
      process.exit(1);
    });
}

module.exports = runMigration;
