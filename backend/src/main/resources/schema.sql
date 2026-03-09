-- 三角洲账号交易平台数据库脚本
-- 创建日期: 2026-03-08

-- 创建数据库
CREATE DATABASE IF NOT EXISTS delta_account DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE delta_account;

-- 用户表
CREATE TABLE IF NOT EXISTS users (
    id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '用户ID',
    username VARCHAR(50) UNIQUE NOT NULL COMMENT '用户名',
    password VARCHAR(255) NOT NULL COMMENT '密码',
    phone VARCHAR(20) COMMENT '手机号',
    email VARCHAR(100) COMMENT '邮箱',
    nickname VARCHAR(50) COMMENT '昵称',
    avatar VARCHAR(255) COMMENT '头像URL',
    balance DECIMAL(10,2) DEFAULT 0 COMMENT '账户余额',
    credit_score INT DEFAULT 100 COMMENT '信誉分',
    role ENUM('USER','ADMIN') DEFAULT 'USER' COMMENT '角色',
    status ENUM('ACTIVE','BANNED') DEFAULT 'ACTIVE' COMMENT '状态',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    INDEX idx_username (username),
    INDEX idx_phone (phone),
    INDEX idx_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户表';

-- 账号表
CREATE TABLE IF NOT EXISTS accounts (
    id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '账号ID',
    seller_id BIGINT NOT NULL COMMENT '卖家ID',
    title VARCHAR(100) NOT NULL COMMENT '标题',
    game_rank VARCHAR(50) COMMENT '游戏段位',
    skin_count INT DEFAULT 0 COMMENT '皮肤数量',
    weapons TEXT COMMENT '武器装备(JSON)',
    price DECIMAL(10,2) NOT NULL COMMENT '售价',
    rental_price DECIMAL(10,2) COMMENT '租价/小时',
    status ENUM('PENDING','ON_SALE','RENTED','SOLD','OFFLINE') DEFAULT 'PENDING' COMMENT '状态',
    verification_status ENUM('UNVERIFIED','VERIFIED','REJECTED') DEFAULT 'UNVERIFIED' COMMENT '审核状态',
    description TEXT COMMENT '描述',
    images JSON COMMENT '截图(JSON数组)',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    INDEX idx_seller (seller_id),
    INDEX idx_status (status),
    INDEX idx_price (price),
    INDEX idx_created (created_at),
    FOREIGN KEY (seller_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='账号表';

-- 订单表
CREATE TABLE IF NOT EXISTS orders (
    id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '订单ID',
    order_no VARCHAR(64) UNIQUE NOT NULL COMMENT '订单号',
    account_id BIGINT NOT NULL COMMENT '账号ID',
    buyer_id BIGINT NOT NULL COMMENT '买家ID',
    seller_id BIGINT NOT NULL COMMENT '卖家ID',
    type ENUM('BUY','RENT') NOT NULL COMMENT '交易类型',
    amount DECIMAL(10,2) NOT NULL COMMENT '金额',
    deposit DECIMAL(10,2) COMMENT '押金',
    status ENUM('PENDING','PAID','PROCESSING','COMPLETED','CANCELLED','REFUNDED') DEFAULT 'PENDING' COMMENT '状态',
    rent_start DATETIME COMMENT '租赁开始时间',
    rent_end DATETIME COMMENT '租赁结束时间',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    INDEX idx_order_no (order_no),
    INDEX idx_account (account_id),
    INDEX idx_buyer (buyer_id),
    INDEX idx_seller (seller_id),
    INDEX idx_status (status),
    FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE CASCADE,
    FOREIGN KEY (buyer_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (seller_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='订单表';

-- 评价表
CREATE TABLE IF NOT EXISTS reviews (
    id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '评价ID',
    order_id BIGINT NOT NULL COMMENT '订单ID',
    reviewer_id BIGINT NOT NULL COMMENT '评价人ID',
    reviewee_id BIGINT NOT NULL COMMENT '被评价人ID',
    rating TINYINT NOT NULL COMMENT '评分(1-5)',
    content VARCHAR(500) COMMENT '评价内容',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    INDEX idx_order (order_id),
    INDEX idx_reviewer (reviewer_id),
    INDEX idx_reviewee (reviewee_id),
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    FOREIGN KEY (reviewer_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (reviewee_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='评价表';

-- 插入测试数据
INSERT INTO users (username, password, nickname, balance, credit_score, role, status) VALUES
('admin', '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iAt6Z5EH', '管理员', 0, 100, 'ADMIN', 'ACTIVE'),
('seller1', '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iAt6Z5EH', '资深卖家', 1000.00, 100, 'USER', 'ACTIVE'),
('buyer1', '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iAt6Z5EH', '普通买家', 500.00, 100, 'USER', 'ACTIVE');

-- 插入测试账号数据
INSERT INTO accounts (seller_id, title, game_rank, skin_count, weapons, price, rental_price, status, verification_status, description, images) VALUES
(2, '满皮肤史诗账号', '钻石', 150, 'AK47、M4A1、AWM', 2999.00, 50.00, 'ON_SALE', 'VERIFIED', '顶级账号，包含150+皮肤，所有英雄都已解锁。', '["https://example.com/img1.jpg"]'),
(2, '高级战斗账号', '铂金', 80, 'AK47、M4A1', 1299.00, 25.00, 'ON_SALE', 'VERIFIED', '80皮肤，段位铂金，适合喜欢玩战的玩家。', '["https://example.com/img2.jpg"]'),
(2, '新手入门账号', '黄金', 30, 'M4A1', 399.00, 10.00, 'ON_SALE', 'VERIFIED', '30皮肤，适合新手玩家入门。', '[]'),
(2, '肝帝账号', '钻石', 200, '全武器', 4999.00, 80.00, 'ON_SALE', 'VERIFIED', '肝帝账号，200+皮肤收集，几乎全武器。', '[]');

-- 密码都是: password123

-- 通知表
CREATE TABLE IF NOT EXISTS notifications (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT NOT NULL,
    type VARCHAR(50) NOT NULL,
    title VARCHAR(100) NOT NULL,
    content TEXT,
    status VARCHAR(20) DEFAULT 'UNREAD',
    related_id VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_user (user_id),
    INDEX idx_status (status),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='通知表';

-- 流水记录表
CREATE TABLE IF NOT EXISTS transaction_records (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT NOT NULL,
    type ENUM('RECHARGE', 'WITHDRAW', 'BUY', 'SELL', 'RENT', 'REFUND') NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    balance_before DECIMAL(10,2) NOT NULL,
    balance_after DECIMAL(10,2) NOT NULL,
    description VARCHAR(255),
    order_id BIGINT,
    status ENUM('PENDING', 'COMPLETED', 'FAILED') DEFAULT 'COMPLETED',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    INDEX idx_user (user_id),
    INDEX idx_type (type),
    INDEX idx_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='流水记录表';

-- 充值记录表
CREATE TABLE IF NOT EXISTS recharges (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    payment_method VARCHAR(50) DEFAULT 'SIMULATED',
    transaction_no VARCHAR(64),
    status ENUM('PENDING', 'COMPLETED', 'FAILED') DEFAULT 'PENDING',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    INDEX idx_user (user_id),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='充值记录表';

-- 提现记录表
CREATE TABLE IF NOT EXISTS withdrawals (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    account_type ENUM('ALIPAY', 'BANK') DEFAULT 'ALIPAY',
    account_no VARCHAR(50),
    account_name VARCHAR(50),
    status ENUM('PENDING', 'PROCESSING', 'COMPLETED', 'REJECTED') DEFAULT 'PENDING',
    reject_reason VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    INDEX idx_user (user_id),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='提现记录表';

-- 聊天会话表
CREATE TABLE IF NOT EXISTS chat_sessions (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    account_id BIGINT,
    buyer_id BIGINT NOT NULL,
    seller_id BIGINT NOT NULL,
    last_message VARCHAR(255),
    last_message_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (account_id) REFERENCES accounts(id),
    FOREIGN KEY (buyer_id) REFERENCES users(id),
    FOREIGN KEY (seller_id) REFERENCES users(id),
    INDEX idx_buyer (buyer_id),
    INDEX idx_seller (seller_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='聊天会话表';

-- 聊天消息表
CREATE TABLE IF NOT EXISTS chat_messages (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    session_id BIGINT NOT NULL,
    sender_id BIGINT NOT NULL,
    content TEXT NOT NULL,
    type ENUM('TEXT', 'IMAGE', 'SYSTEM') DEFAULT 'TEXT',
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (session_id) REFERENCES chat_sessions(id) ON DELETE CASCADE,
    FOREIGN KEY (sender_id) REFERENCES users(id),
    INDEX idx_session (session_id),
    INDEX idx_sender (sender_id),
    INDEX idx_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='聊天消息表';

-- 退款申请表
CREATE TABLE IF NOT EXISTS refund_requests (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    order_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    reason VARCHAR(500) NOT NULL,
    evidence_images JSON,
    status ENUM('PENDING', 'PROCESSING', 'AGREED', 'REJECTED', 'CANCELLED') DEFAULT 'PENDING',
    admin_remark VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES orders(id),
    FOREIGN KEY (user_id) REFERENCES users(id),
    INDEX idx_order (order_id),
    INDEX idx_user (user_id),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='退款申请表';
