# 三角洲行动账号交易平台 - 技术规格说明书

## 1. 项目概述

**项目名称**: Delta Account Hub (三角洲账号交易平台)
**项目类型**: B2C 账号交易平台 + C2C 市场
**核心功能**: 游戏账号租赁、交易、担保服务
**目标用户**: 三角洲行动玩家、账号商人、租赁需求玩家

---

## 2. 技术架构

### 2.1 技术栈

| 层级 | 技术选型 |
|------|---------|
| 前端框架 | React 18 + TypeScript |
| UI组件库 | Tailwind CSS + shadcn/ui |
| 状态管理 | Zustand |
| 后端框架 | Java 17 + Spring Boot 3.x |
| 数据库 | MySQL (可通过 Docker 运行) |
| ORM | MyBatis-Plus |
| API文档 | Swagger/OpenAPI 3.0 |
| 部署平台 | Vercel (前端) + Render/Railway (后端) |

### 2.2 系统架构

```
┌─────────────────────────────────────────────────────┐
│                   Vercel (前端)                     │
│  https://delta-account-hub.vercel.app              │
└─────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────┐
│               Render/Railway (后端)                 │
│  https://delta-api.onrender.com                    │
│                                                     │
│  /api/auth        - 认证接口                        │
│  /api/accounts    - 账号接口                        │
│  /api/orders      - 订单接口                        │
│  /api/payment     - 支付接口                        │
│  /api/admin       - 管理接口                        │
└─────────────────────────────────────────────────────┘
```

---

## 3. 功能模块

### 3.1 用户模块

| 功能 | 描述 |
|------|------|
| 用户注册 | 手机号/邮箱注册，验证码登录 |
| 用户登录 | JWT Token 认证 |
| 个人信息 | 头像、昵称、实名认证 |
| 账户余额 | 充值、提现、流水记录 |
| 信誉评分 | 交易评价、等级系统 |

### 3.2 账号市场模块

| 功能 | 描述 |
|------|------|
| 账号发布 | 出售/出租账号信息录入 |
| 账号列表 | 筛选排序（价格、等级、皮肤） |
| 账号详情 | 详细属性、截图展示 |
| 搜索过滤 | 关键词、段位、皮肤数量 |
| 在线沟通 | 买卖家即时消息 |

### 3.3 交易模块

| 功能 | 描述 |
|------|------|
| 创建订单 | 立即购买/竞价 |
| 支付流程 | 余额支付/第三方 |
| 订单状态 | 待付款/处理中/已完成/已取消 |
| 售后申请 | 退款/维权申诉 |

### 3.4 租赁模块

| 功能 | 描述 |
|------|------|
| 发布租赁 | 时租/日租/周租 |
| 租赁订单 | 计时自动释放 |
| 押金管理 | 退还/扣除规则 |
| 租赁须知 | 违规处罚机制 |

### 3.5 管理后台

| 功能 | 描述 |
|------|------|
| 用户管理 | 封号、权限设置 |
| 账号审核 | 上架审核、违规下架 |
| 订单管理 | 异常订单处理 |
| 数据统计 | 交易额、用户数、热门账号 |

---

## 4. 数据库设计

### 4.1 核心表结构

```sql
-- 用户表
CREATE TABLE users (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    email VARCHAR(100),
    nickname VARCHAR(50),
    avatar VARCHAR(255),
    balance DECIMAL(10,2) DEFAULT 0,
    credit_score INT DEFAULT 100,
    role ENUM('USER','ADMIN') DEFAULT 'USER',
    status ENUM('ACTIVE','BANNED') DEFAULT 'ACTIVE',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 账号表
CREATE TABLE accounts (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    seller_id BIGINT NOT NULL,
    title VARCHAR(100) NOT NULL,
    game_rank VARCHAR(50),
    skin_count INT DEFAULT 0,
    weapons TEXT,
    price DECIMAL(10,2) NOT NULL,
    rental_price DECIMAL(10,2),
    status ENUM('PENDING','ON_SALE','RENTED','SOLD','OFFLINE') DEFAULT 'PENDING',
    verification_status ENUM('UNVERIFIED','VERIFIED','REJECTED') DEFAULT 'UNVERIFIED',
    description TEXT,
    images JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (seller_id) REFERENCES users(id)
);

-- 订单表
CREATE TABLE orders (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    order_no VARCHAR(64) UNIQUE NOT NULL,
    account_id BIGINT NOT NULL,
    buyer_id BIGINT NOT NULL,
    seller_id BIGINT NOT NULL,
    type ENUM('BUY','RENT') NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    deposit DECIMAL(10,2),
    status ENUM('PENDING','PAID','PROCESSING','COMPLETED','CANCELLED','REFUNDED') DEFAULT 'PENDING',
    rent_start DATETIME,
    rent_end DATETIME,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (account_id) REFERENCES accounts(id),
    FOREIGN KEY (buyer_id) REFERENCES users(id),
    FOREIGN KEY (seller_id) REFERENCES users(id)
);

-- 评价表
CREATE TABLE reviews (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    order_id BIGINT NOT NULL,
    reviewer_id BIGINT NOT NULL,
    reviewee_id BIGINT NOT NULL,
    rating TINYINT NOT NULL,
    content VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES orders(id)
);
```

---

## 5. API 接口设计

### 5.1 认证接口

| 方法 | 路径 | 描述 |
|------|------|------|
| POST | /api/auth/register | 用户注册 |
| POST | /api/auth/login | 用户登录 |
| POST | /api/auth/logout | 登出 |
| GET | /api/auth/profile | 获取个人信息 |

### 5.2 账号接口

| 方法 | 路径 | 描述 |
|------|------|------|
| GET | /api/accounts | 账号列表(筛选) |
| GET | /api/accounts/{id} | 账号详情 |
| POST | /api/accounts | 发布账号 |
| PUT | /api/accounts/{id} | 更新账号信息 |
| DELETE | /api/accounts/{id} | 下架账号 |

### 5.3 订单接口

| 方法 | 路径 | 描述 |
|------|------|------|
| POST | /api/orders | 创建订单 |
| GET | /api/orders/{id} | 订单详情 |
| PUT | /api/orders/{id}/pay | 支付订单 |
| PUT | /api/orders/{id}/complete | 完成订单 |
| POST | /api/orders/{id}/refund | 申请退款 |

---

## 6. 前端页面设计

### 6.1 页面结构

```
/                           - 首页（热门账号展示）
/accounts                   - 账号市场列表
/accounts/:id              - 账号详情页
/auth/login                - 登录页
/auth/register             - 注册页
/user/profile              - 用户中心
/user/orders               - 我的订单
/user/orders/:id           - 订单详情
/user/wallet               - 钱包/充值
/sell                      - 发布账号页
/admin                     - 管理后台
```

### 6.2 UI 设计规范

- **主色调**: #1a1a2e (深蓝黑) + #e94560 (珊瑚红强调)
- **字体**: Inter (英文), Noto Sans SC (中文)
- **卡片**: 圆角 12px, 阴影 hover 时增强
- **间距**: 4px 基准网格
- **响应式**: Mobile (<768px), Tablet (768-1024px), Desktop (>1024px)

---

## 7. 安全设计

- JWT Token 认证 (access_token + refresh_token)
- 密码 BCrypt 加密存储
- 验证码限流 (60次/分钟)
- 敏感操作需要二次验证
- 订单金额校验防止篡改
- SQL 注入防护 (MyBatis #{})

---

## 8. 开发里程碑

### Phase 1: 基础架构 (第1-2小时)
- [ ] 项目初始化
- [ ] 数据库设计
- [ ] 后端基础框架
- [ ] 前端脚手架

### Phase 2: 核心功能 (第3-5小时)
- [ ] 用户认证 (注册/登录)
- [ ] 账号 CRUD
- [ ] 账号列表+详情页
- [ ] 订单流程

### Phase 3: 完善功能 (第6-7小时)
- [ ] 租赁功能
- [ ] 评价系统
- [ ] 搜索筛选
- [ ] 用户中心

### Phase 4: 部署上线 (第8小时)
- [ ] 后端部署
- [ ] 前端部署
- [ ] 测试验收
- [ ] 性能优化

---

## 9. 验收标准

- [ ] 用户可以注册、登录
- [ ] 可以浏览账号列表
- [ ] 可以发布账号
- [ ] 可以创建订单并完成交易
- [ ] 账号详情页展示完整
- [ ] 响应式设计正常
- [ ] API 文档完整
- [ ] 部署可访问

---

*文档版本: v1.0*
*创建时间: 2026-03-08*
