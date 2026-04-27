-- Delta Account Platform - 托管系统迁移脚本
-- 添加资金托管和交易保障相关字段
-- 执行时间: 2026-04-27

-- ============================================
-- 1. 给 orders 表添加托管相关字段
-- ============================================
ALTER TABLE orders
ADD COLUMN escrow_status VARCHAR(30) DEFAULT 'PENDING_RECEIVE' COMMENT '托管状态: PENDING_RECEIVE(待确认收货), IN_ESCROW(托管中), RELEASED(已释放), DISPUTED(争议中), REFUNDED(已退款)';

ALTER TABLE orders
ADD COLUMN escrow_amount DECIMAL(10,2) COMMENT '托管金额';

ALTER TABLE orders
ADD COLUMN received_at DATETIME COMMENT '确认收货时间';

ALTER TABLE orders
ADD COLUMN escrow_release_at DATETIME COMMENT '托管释放时间(冻结期结束后)';

ALTER TABLE orders
ADD COLUMN dispute_id BIGINT COMMENT '关联的纠纷ID';

-- 添加索引
CREATE INDEX idx_orders_escrow_status ON orders(escrow_status);
CREATE INDEX idx_orders_escrow_release_at ON orders(escrow_release_at);

-- ============================================
-- 2. 创建 disputes 表（纠纷/争议表）
-- ============================================
CREATE TABLE IF NOT EXISTS disputes (
    id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '纠纷ID',
    dispute_no VARCHAR(64) UNIQUE NOT NULL COMMENT '纠纷编号',
    order_id BIGINT NOT NULL COMMENT '关联订单ID',
    initiator_id BIGINT NOT NULL COMMENT '发起人ID',
    respondent_id BIGINT NOT NULL COMMENT '被投诉方ID',
    reason VARCHAR(100) NOT NULL COMMENT '纠纷原因: ACCOUNT_NOT_AS_DESCRIBED(账号与描述不符), ACCOUNT_RECOVERY(账号找回), NOT_RECEIVED(未收到账号), FRAUD(欺诈), OTHER(其他)',
    description TEXT COMMENT '详细描述',
    evidence_images JSON COMMENT '证据图片(JSON数组)',
    status VARCHAR(20) DEFAULT 'OPEN' COMMENT '状态: OPEN(开启), UNDER_REVIEW(审核中), MEDIATING(调解中), RESOLVED(已解决), REJECTED(已拒绝)',
    resolution VARCHAR(50) COMMENT '解决方案: FULL_REFUND(全额退款), PARTIAL_REFUND(部分退款), RELEASE_TO_SELLER(打款给卖家), CANCELLED(已撤销)',
    admin_remark VARCHAR(500) COMMENT '管理员备注',
    resolved_at DATETIME COMMENT '解决时间',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    FOREIGN KEY (initiator_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (respondent_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_dispute_order (order_id),
    INDEX idx_dispute_status (status),
    INDEX idx_dispute_initiator (initiator_id),
    INDEX idx_dispute_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='纠纷/争议表';

-- ============================================
-- 3. 给 users 表添加保证金字段
-- ============================================
ALTER TABLE users
ADD COLUMN security_deposit DECIMAL(10,2) DEFAULT 0 COMMENT '安全保证金';

ALTER TABLE users
ADD COLUMN deposit_status VARCHAR(20) DEFAULT 'NONE' COMMENT '保证金状态: NONE(无), LOCKED(锁定), FROZEN(冻结), RELEASED(已释放)';

ALTER TABLE users
ADD COLUMN risk_level VARCHAR(20) DEFAULT 'NORMAL' COMMENT '风险等级: LOW(低), NORMAL(正常), HIGH(高), BLOCKED(被封)';

-- ============================================
-- 4. 给 accounts 表添加验证等级
-- ============================================
ALTER TABLE accounts
ADD COLUMN verification_level INT DEFAULT 0 COMMENT '验证等级: 0(未验证), 1(基础验证), 2(高级验证), 3(深度验证)';

ALTER TABLE accounts
ADD COLUMN verification_remark VARCHAR(255) COMMENT '验证备注';

ALTER TABLE accounts
ADD COLUMN verified_at DATETIME COMMENT '验证时间';

-- ============================================
-- 5. 给 chat_messages 表添加已撤回标记
-- ============================================
ALTER TABLE chat_messages
ADD COLUMN is_recalled BOOLEAN DEFAULT FALSE COMMENT '是否已撤回';

-- ============================================
-- 6. 更新测试数据（如果需要）
-- ============================================
-- 为现有订单设置初始托管状态
UPDATE orders
SET escrow_status = 'RELEASED'
WHERE status IN ('COMPLETED', 'CANCELLED', 'REFUNDED');

UPDATE orders
SET escrow_status = 'IN_ESCROW'
WHERE status = 'PAID';

-- 设置冻结期为订单完成后24小时
UPDATE orders
SET escrow_release_at = DATE_ADD(updated_at, INTERVAL 24 HOUR)
WHERE status = 'COMPLETED';

-- 设置默认卖家保证金状态
UPDATE users
SET deposit_status = 'NONE'
WHERE role = 'USER';