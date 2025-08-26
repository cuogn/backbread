-- Bánh Mì Sơn Database Schema
-- PostgreSQL Database Schema

-- Bảng categories (Danh mục sản phẩm)
CREATE TABLE categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Bảng products (Sản phẩm)
CREATE TABLE products (
    id SERIAL PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    image_url VARCHAR(500),
    category_id INTEGER,
    is_available BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
);

-- Bảng branches (Chi nhánh)
CREATE TABLE branches (
    id SERIAL PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    address TEXT NOT NULL,
    phone VARCHAR(20) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Bảng customers (Khách hàng)
CREATE TABLE customers (
    id SERIAL PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    phone VARCHAR(20) NOT NULL UNIQUE,
    email VARCHAR(200),
    address TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Bảng payment_methods (Phương thức thanh toán)
CREATE TABLE payment_methods (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    code VARCHAR(50) NOT NULL UNIQUE,
    icon VARCHAR(10),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Bảng admin_users (Quản trị viên)
CREATE TABLE admin_users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(200) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    full_name VARCHAR(200) NOT NULL,
    role VARCHAR(20) DEFAULT 'admin' CHECK (role IN ('admin', 'manager')),
    is_active BOOLEAN DEFAULT TRUE,
    last_login TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Bảng orders (Đơn hàng)
CREATE TABLE orders (
    id SERIAL PRIMARY KEY,
    order_code VARCHAR(50) NOT NULL UNIQUE,
    customer_id INTEGER NOT NULL,
    branch_id INTEGER NOT NULL,
    payment_method_id INTEGER NOT NULL,
    total_amount DECIMAL(10,2) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'preparing', 'delivering', 'completed', 'cancelled')),
    customer_name VARCHAR(200) NOT NULL,
    customer_phone VARCHAR(20) NOT NULL,
    customer_email VARCHAR(200),
    delivery_address TEXT NOT NULL,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
    FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE RESTRICT,
    FOREIGN KEY (payment_method_id) REFERENCES payment_methods(id) ON DELETE RESTRICT
);

-- Bảng order_items (Chi tiết đơn hàng)
CREATE TABLE order_items (
    id SERIAL PRIMARY KEY,
    order_id INTEGER NOT NULL,
    product_id INTEGER NOT NULL,
    product_name VARCHAR(200) NOT NULL,
    product_price DECIMAL(10,2) NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    subtotal DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE RESTRICT
);

-- Tạo indexes cho products
CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_products_available ON products(is_available);

-- Tạo index cho branches
CREATE INDEX idx_branches_active ON branches(is_active);

-- Tạo indexes cho customers
CREATE INDEX idx_customers_phone ON customers(phone);
CREATE INDEX idx_customers_email ON customers(email);

-- Tạo indexes cho admin_users
CREATE INDEX idx_admin_users_username ON admin_users(username);
CREATE INDEX idx_admin_users_email ON admin_users(email);
CREATE INDEX idx_admin_users_active ON admin_users(is_active);

-- Tạo indexes cho orders
CREATE INDEX idx_orders_order_code ON orders(order_code);
CREATE INDEX idx_orders_customer ON orders(customer_id);
CREATE INDEX idx_orders_branch ON orders(branch_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created_at ON orders(created_at);

-- Tạo indexes cho order_items
CREATE INDEX idx_order_items_order ON order_items(order_id);
CREATE INDEX idx_order_items_product ON order_items(product_id);

-- Tạo function để tự động cập nhật updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $func$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$func$ language plpgsql;

-- Tạo triggers để tự động cập nhật updated_at
CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON categories FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_branches_updated_at BEFORE UPDATE ON branches FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON customers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_payment_methods_updated_at BEFORE UPDATE ON payment_methods FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_admin_users_updated_at BEFORE UPDATE ON admin_users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert dữ liệu mẫu

-- Categories
INSERT INTO categories (name, description) VALUES
('Bánh Mì Thịt', 'Các loại bánh mì với thịt nguội, pate'),
('Bánh Mì Chả Cá', 'Bánh mì với chả cá Nha Trang'),
('Bánh Mì Đặc Biệt', 'Bánh mì với nhiều loại nhân đặc biệt'),
('Bánh Mì Chay', 'Bánh mì chay cho người ăn chay'),
('Xôi', 'Các loại xôi và món ăn sáng khác');

-- Payment Methods
INSERT INTO payment_methods (name, code, icon) VALUES
('Thanh toán khi nhận hàng (COD)', 'cod', '💵'),
('Ví MoMo', 'momo', '📱'),
('VNPay', 'vnpay', '💳');

-- Admin Users (Mật khẩu: 123 - đã hash bằng bcrypt)
INSERT INTO admin_users (username, email, password, full_name, role) VALUES
('admin', 'admin@banhmi-son.com', '$2a$10$BWU.Z0pRPvhW/IJ8jaUHlutGsfwtGFYW0DwXVSqcjvelCxgSCovhq', 'Quản trị viên', 'admin'),
('manager', 'manager@banhmi-son.com', '$2a$10$BWU.Z0pRPvhW/IJ8jaUHlutGFYW0DwXVSqcjvelCxgSCovhq', 'Quản lý cửa hàng', 'manager');

-- Branches
INSERT INTO branches (name, address, phone) VALUES
('Chi nhánh Núi Hiểu', 'Kiot Số 5, Núi Hiểu, Nếnh, Bắc Ninh', '0332613116'),
('Chi nhánh Núi Hiểu 2', 'Kiot Số 1, Núi Hiểu, Nếnh, Bắc Ninh', '0332613116'),
('Chi nhánh Núi Hiểu 3', 'Kiot Số 1, Núi Hiểu, Nếnh, Bắc Ninh', '0332613116');

-- Products
INSERT INTO products (name, description, price, image_url, category_id) VALUES
('Bánh Mì Pate cột đèn', 'Bánh mì giòn với pate cột đèn thơm lừng, rau sống tươi mát và nước sốt đặc biệt', 25000, 'https://images.unsplash.com/photo-1558030006-450675393462?w=400&h=300&fit=crop', 1),
('Bánh Mì Chả Cá', 'Bánh mì với chả cá Nha Trang đậm đà, thêm rau thơm và tương ớt', 30000, 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400&h=300&fit=crop', 2),
('Bánh Mì Chả cá Đặc Biệt', 'Bánh mì với đầy đủ chả lụa, thịt nguội, pate, trứng ốp la và rau sống', 35000, 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400&h=300&fit=crop', 3),
('Bánh Mì Pate chả cá cột đèn', 'Bánh mì truyền thống với pate gan, chả lụa và rau củ tươi ngon', 20000, 'https://images.unsplash.com/photo-1551024601-bec78aea704b?w=400&h=300&fit=crop', 2),
('Xôi xéo', 'Bánh mì với xíu mại tự làm, nước sốt cà chua đậm đà', 28000, 'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=400&h=300&fit=crop', 5),
('Xôi thập cẩm', 'Chả cá Nha Trang nguyên chất, bánh mì giòn rụm, rau thơm đầy đủ', 32000, 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=400&h=300&fit=crop', 5),
('Xôi Chả cá', 'Thịt gà nướng thơm phức, ướp gia vị đặc trưng với rau sống tươi mát', 30000, 'https://images.unsplash.com/photo-1594212699903-ec8a3eca50f5?w=400&h=300&fit=crop', 5),
('Kem xôi', 'Bánh mì với trứng ốp la, chả lụa và rau sống, phù hợp cho bữa sáng', 22000, 'https://images.unsplash.com/photo-1571091718767-18b5b1457add?w=400&h=300&fit=crop', 5),
('Bánh Mì Chay', 'Bánh mì chay với đậu hũ chiên, rau sống và nước mắm chay', 18000, 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400&h=300&fit=crop', 4),
('Bánh Mì Bò Kho', 'Bánh mì với bò kho đậm đà, thơm lừng gia vị 5 hương', 35000, 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=400&h=300&fit=crop', 3);
