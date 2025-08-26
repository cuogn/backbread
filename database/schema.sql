-- Bánh Mì Sơn Database Schema
-- MariaDB/MySQL Database Schema

-- Tạo database
CREATE DATABASE IF NOT EXISTS banh_mi_son CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE banh_mi_son;

-- Bảng categories (Danh mục sản phẩm)
CREATE TABLE categories (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Bảng products (Sản phẩm)
CREATE TABLE products (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    image_url VARCHAR(500),
    category_id INT,
    is_available BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL,
    INDEX idx_category (category_id),
    INDEX idx_available (is_available)
);

-- Bảng branches (Chi nhánh)
CREATE TABLE branches (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(200) NOT NULL,
    address TEXT NOT NULL,
    phone VARCHAR(20) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_active (is_active)
);

-- Bảng customers (Khách hàng)
CREATE TABLE customers (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(200) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    email VARCHAR(200),
    address TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY unique_phone (phone),
    INDEX idx_phone (phone),
    INDEX idx_email (email)
);

-- Bảng payment_methods (Phương thức thanh toán)
CREATE TABLE payment_methods (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    code VARCHAR(50) NOT NULL UNIQUE,
    icon VARCHAR(10),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Bảng admin (Quản trị viên)
CREATE TABLE admin_users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(200) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    full_name VARCHAR(200) NOT NULL,
    role ENUM('admin', 'manager') DEFAULT 'admin',
    is_active BOOLEAN DEFAULT TRUE,
    last_login TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_username (username),
    INDEX idx_email (email),
    INDEX idx_active (is_active)
);

-- Bảng orders (Đơn hàng)
CREATE TABLE orders (
    id INT PRIMARY KEY AUTO_INCREMENT,
    order_code VARCHAR(50) NOT NULL UNIQUE,
    customer_id INT NOT NULL,
    branch_id INT NOT NULL,
    payment_method_id INT NOT NULL,
    total_amount DECIMAL(10,2) NOT NULL,
    status ENUM('pending', 'confirmed', 'preparing', 'delivering', 'completed', 'cancelled') DEFAULT 'pending',
    customer_name VARCHAR(200) NOT NULL,
    customer_phone VARCHAR(20) NOT NULL,
    customer_email VARCHAR(200),
    delivery_address TEXT NOT NULL,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
    FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE RESTRICT,
    FOREIGN KEY (payment_method_id) REFERENCES payment_methods(id) ON DELETE RESTRICT,
    INDEX idx_order_code (order_code),
    INDEX idx_customer (customer_id),
    INDEX idx_branch (branch_id),
    INDEX idx_status (status),
    INDEX idx_created_at (created_at)
);

-- Bảng order_items (Chi tiết đơn hàng)
CREATE TABLE order_items (
    id INT PRIMARY KEY AUTO_INCREMENT,
    order_id INT NOT NULL,
    product_id INT NOT NULL,
    product_name VARCHAR(200) NOT NULL,
    product_price DECIMAL(10,2) NOT NULL,
    quantity INT NOT NULL DEFAULT 1,
    subtotal DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE RESTRICT,
    INDEX idx_order (order_id),
    INDEX idx_product (product_id)
);

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
