-- Delta Account Platform - Phase 2 迁移脚本
-- Analytics、Dashboard、Audit 相关功能
-- 执行时间: 2026-04-27

-- ============================================
-- 1. 创建审计日志表
-- ============================================
CREATE TABLE IF NOT EXISTS audit_logs (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT COMMENT '操作用户ID',
    action VARCHAR(100) NOT NULL COMMENT '操作类型',
    entity_type VARCHAR(50) COMMENT '实体类型: ORDER, ACCOUNT, USER, DISPUTE',
    entity_id BIGINT COMMENT '实体ID',
    description VARCHAR(255) COMMENT '操作描述',
    ip_address VARCHAR(50) COMMENT 'IP地址',
    user_agent VARCHAR(255) COMMENT '用户代理',
    request_params TEXT COMMENT '请求参数(JSON)',
    response_result TEXT COMMENT '响应结果(JSON)',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_audit_user (user_id),
    INDEX idx_audit_action (action),
    INDEX idx_audit_entity (entity_type, entity_id),
    INDEX idx_audit_created (created_at),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='审计日志表';

-- ============================================
-- 2. 创建账号浏览记录表
-- ============================================
CREATE TABLE IF NOT EXISTS account_views (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    account_id BIGINT NOT NULL COMMENT '账号ID',
    visitor_id BIGINT COMMENT '访问者ID(可为NULL)',
    ip_address VARCHAR(50) COMMENT 'IP地址',
    user_agent VARCHAR(255) COMMENT '用户代理',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_view_account (account_id),
    INDEX idx_view_visitor (visitor_id),
    INDEX idx_view_created (created_at),
    FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='账号浏览记录表';

-- ============================================
-- 3. 订单增加更多统计字段（可选扩展）
-- ============================================
-- 已有的字段足够当前使用，跳过

-- ============================================
-- 4. 用户统计表（用于加速Dashboard查询）
-- ============================================
CREATE TABLE IF NOT EXISTS daily_stats (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    stat_date DATE NOT NULL COMMENT '统计日期',
    stat_type VARCHAR(50) NOT NULL COMMENT '统计类型: NEW_USERS, NEW_ACCOUNTS, NEW_ORDERS, REVENUE',
    stat_value BIGINT DEFAULT 0 COMMENT '统计值',
    stat_amount DECIMAL(12,2) DEFAULT 0 COMMENT '金额(用于收入统计)',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uk_date_type (stat_date, stat_type),
    INDEX idx_stat_date (stat_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='每日统计数据表';

-- ============================================
-- 5. 初始化一些统计数据
-- ============================================
INSERT INTO daily_stats (stat_date, stat_type, stat_value) VALUES
(CURDATE(), 'NEW_USERS', 0),
(CURDATE(), 'NEW_ACCOUNTS', 0),
(CURDATE(), 'NEW_ORDERS', 0),
(CURDATE(), 'REVENUE', 0);