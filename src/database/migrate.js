const fs = require('fs').promises;
const path = require('path');
const { executeQuery } = require('../config/database');

const runMigration = async () => {
  try {
    console.log('🔄 Bắt đầu chạy migration database...');

    // Đọc file schema.sql
    const schemaPath = path.join(__dirname, '../../database/schema.sql');
    const sqlContent = await fs.readFile(schemaPath, 'utf8');

    // Tách các câu lệnh SQL
    const statements = sqlContent
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

    console.log(`📝 Tìm thấy ${statements.length} câu lệnh SQL`);

    // Thực thi từng câu lệnh
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      
      try {
        await executeQuery(statement);
        console.log(`✅ Thực thi thành công câu lệnh ${i + 1}/${statements.length}`);
      } catch (error) {
        // Bỏ qua lỗi database/table already exists
        if (error.code === 'ER_DB_CREATE_EXISTS' || 
            error.code === 'ER_TABLE_EXISTS_ERROR' ||
            error.message.includes('already exists')) {
          console.log(`⚠️  Bỏ qua câu lệnh ${i + 1}: ${error.message}`);
          continue;
        }
        throw error;
      }
    }

    console.log('✅ Migration hoàn thành thành công!');
    console.log('📊 Database đã được tạo với cấu trúc:');
    console.log('   - Categories (Danh mục)');
    console.log('   - Products (Sản phẩm)');
    console.log('   - Branches (Chi nhánh)');
    console.log('   - Customers (Khách hàng)');
    console.log('   - Payment Methods (Phương thức thanh toán)');
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
