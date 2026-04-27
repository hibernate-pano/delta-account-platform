-- Delta Account Platform - Phase 3 迁移脚本
-- 图片上传、消息增强相关功能
-- 执行时间: 2026-04-27

-- ============================================
-- 1. chat_messages 表添加 is_recalled 字段
-- ============================================
-- 注意：Phase 1 已经添加了这个字段，这里只是确认
-- ALTER TABLE chat_messages ADD COLUMN is_recalled BOOLEAN DEFAULT FALSE;

-- ============================================
-- 2. 创建账号浏览记录表（增强分析功能）
-- ============================================
CREATE TABLE IF NOT EXISTS account_views (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    account_id BIGINT NOT NULL COMMENT '账号ID',
    visitor_id BIGINT COMMENT '访问者ID(可为NULL游客)',
    ip_address VARCHAR(50) COMMENT 'IP地址',
    user_agent VARCHAR(255) COMMENT '用户代理',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_view_account (account_id),
    INDEX idx_view_visitor (visitor_id),
    INDEX idx_view_created (created_at),
    FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE CASCADE,
    FOREIGN KEY (visitor_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='账号浏览记录表';

-- ============================================
-- 3. 创建会话参与表（方便查询某个用户参与的所有会话）
-- ============================================
CREATE TABLE IF NOT EXISTS session_participants (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    session_id BIGINT NOT NULL COMMENT '会话ID',
    user_id BIGINT NOT NULL COMMENT '用户ID',
    role ENUM('BUYER', 'SELLER') NOT NULL COMMENT '角色',
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_read_at TIMESTAMP COMMENT '最后阅读时间',
    UNIQUE KEY uk_session_user (session_id, user_id),
    INDEX idx_participant_user (user_id),
    FOREIGN KEY (session_id) REFERENCES chat_sessions(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='会话参与者表';

-- ============================================
-- 4. 添加留言板功能（简单的问答系统）
-- ============================================
CREATE TABLE IF NOT EXISTS comments (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    account_id BIGINT NOT NULL COMMENT '关联账号ID',
    user_id BIGINT NOT NULL COMMENT '评论用户ID',
    parent_id BIGINT COMMENT '父评论ID（回复）',
    content TEXT NOT NULL COMMENT '评论内容',
    status VARCHAR(20) DEFAULT 'ACTIVE' COMMENT '状态: ACTIVE, DELETED, HIDDEN',
    like_count INT DEFAULT 0 COMMENT '点赞数',
    reply_count INT DEFAULT 0 COMMENT '回复数',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_comment_account (account_id),
    INDEX idx_comment_user (user_id),
    INDEX idx_comment_parent (parent_id),
    FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (parent_id) REFERENCES comments(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='账号评论/问答表';

-- ============================================
-- 5. 创建每日统计表（用于 Dashboard 加速）
-- ============================================
CREATE TABLE IF NOT EXISTS daily_stats (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    stat_date DATE NOT NULL COMMENT '统计日期',
    stat_type VARCHAR(50) NOT NULL COMMENT '统计类型',
    stat_value BIGINT DEFAULT 0 COMMENT '统计值（数量）',
    stat_amount DECIMAL(12,2) DEFAULT 0 COMMENT '统计金额',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uk_date_type (stat_date, stat_type),
    INDEX idx_stat_date (stat_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='每日统计数据表';

-- 初始化一些统计数据
INSERT INTO daily_stats (stat_date, stat_type, stat_value) VALUES
(CURDATE(), 'NEW_USERS', 0),
(CURDATE(), 'NEW_ACCOUNTS', 0),
(CURDATE(), 'NEW_ORDERS', 0),
(CURDATE(), 'REVENUE', 0);