# Delta Account Platform - Complete Product Design

## Project Overview

**Project Name**: Delta Account Hub (三角洲账号交易平台)
**Project Type**: B2C Account Trading Platform + C2C Marketplace
**Core Features**: Game account rental, trading, guarantee services, messaging, wallet
**Target Users**: Delta Action game players, account merchants, rental seekers

---

## 1. System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Frontend (React + TS)                    │
├──────────┬──────────┬──────────┬──────────┬──────────┬────────┤
│  Home    │ Accounts │  Detail  │   User   │ Messages │  Admin │
├──────────┴──────────┴──────────┴──────────┴──────────┴────────┤
│                     Zustand State Management                   │
│                    Axios + Interceptors API                    │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Backend (Spring Boot)                     │
├──────────┬──────────┬──────────┬──────────┬──────────┬────────┤
│   Auth  │ Accounts │  Orders  │  Wallet  │ Messages │  Admin │
├──────────┴──────────┴──────────┴──────────┴──────────┴────────┤
│                    MyBatis-Plus + MySQL                         │
└─────────────────────────────────────────────────────────────────┘
```

---

## 2. New Database Tables

### 2.1 Transaction Records

```sql
CREATE TABLE transaction_records (
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Transaction records table';
```

### 2.2 Recharge Records

```sql
CREATE TABLE recharges (
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Recharge records table';
```

### 2.3 Withdrawal Records

```sql
CREATE TABLE withdrawals (
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Withdrawal records table';
```

### 2.4 Chat Sessions

```sql
CREATE TABLE chat_sessions (
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Chat sessions table';
```

### 2.5 Chat Messages

```sql
CREATE TABLE chat_messages (
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Chat messages table';
```

### 2.6 Refund Requests

```sql
CREATE TABLE refund_requests (
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Refund requests table';
```

---

## 3. API Design

### 3.1 Wallet API

| Method | Path | Description |
|--------|------|-------------|
| GET | /api/wallet/balance | Get balance |
| POST | /api/wallet/recharge | Recharge (simulated) |
| POST | /api/wallet/withdraw | Withdraw |
| GET | /api/wallet/transactions | Transaction records |
| GET | /api/wallet/recharges | Recharge records |
| GET | /api/wallet/withdrawals | Withdrawal records |

### 3.2 Message API

| Method | Path | Description |
|--------|------|-------------|
| GET | /api/messages/sessions | Session list |
| GET | /api/messages/sessions/{id} | Get messages |
| POST | /api/messages/sessions/{id} | Send message |
| PUT | /api/messages/sessions/{id}/read | Mark as read |
| GET | /api/messages/unread-count | Unread count |

### 3.3 Refund API

| Method | Path | Description |
|--------|------|-------------|
| POST | /api/refunds | Apply for refund |
| GET | /api/refunds/{id} | Refund detail |
| PUT | /api/refunds/{id}/cancel | Cancel refund |
| GET | /api/refunds/my | My refund list |
| PUT | /api/refunds/{id}/process | Process (admin) |

### 3.4 Notification API

| Method | Path | Description |
|--------|------|-------------|
| GET | /api/notifications | Notification list |
| PUT | /api/notifications/{id}/read | Mark as read |
| PUT | /api/notifications/read-all | Mark all as read |
| GET | /api/notifications/unread-count | Unread count |

### 3.5 Review API

| Method | Path | Description |
|--------|------|-------------|
| POST | /api/reviews | Submit review |
| GET | /api/reviews/account/{id} | Account reviews |
| GET | /api/reviews/user/{id} | User reviews |

---

## 4. Frontend Pages

```
/                           → Home
/accounts                   → Account market
/accounts/:id              → Account detail
/auth/login                → Login
/auth/register             → Register
/user/profile              → User profile
/user/wallet               → Wallet/Recharge/Withdraw
/user/orders               → My orders
/user/orders/:id           → Order detail (refund apply)
/user/refunds              → My refunds
/sell                      → Publish account
/messages                  → Message center
/messages/:sessionId       → Chat window
/notifications             → Notification list
/admin                     → Admin dashboard
/admin/accounts            → Account review
/admin/orders              → Order management
/admin/refunds             → Refund processing
/admin/users               → User management
/admin/finance             → Finance management
```

---

## 5. Implementation Phases

### Phase 1: Wallet System (1.5 days)
- Database tables
- Backend wallet API
- Frontend wallet page
- Transaction history

### Phase 2: Messaging System (1.5 days)
- Database tables
- WebSocket configuration
- Backend messaging API
- Frontend chat page

### Phase 3: Refund System (0.5 days)
- Database tables
- Backend refund API
- Frontend refund flow

### Phase 4: Notification + Review (1 day)
- Notification integration
- Review system enhancement
- Frontend notification UI

### Phase 5: Admin Dashboard (1 day)
- Account review
- Refund processing
- User management
- Finance overview

### Phase 6: Polish (1.5 days)
- UI/UX improvements
- Error handling
- Testing and fixes

---

## 6. Security Considerations

- All balance changes use `@Transactional`
- Complete transaction logging
- Prevent concurrent deduction issues
- WebSocket connection authentication
- Rate limiting on wallet operations

---

*Document Version: v1.0*
*Created: 2026-03-09*
