# 三角洲账号交易平台 (DeltaHub)

游戏账号租赁和交易平台，支持账号发布、购买、租赁等功能。

## 技术栈

| 层级 | 技术 |
|------|------|
| 前端 | React 18 + TypeScript + Tailwind CSS |
| 后端 | Java 17 + Spring Boot 3.x |
| 数据库 | MySQL |
| ORM | MyBatis-Plus |
| 部署 | Vercel (前端) + Render (后端) |

## 项目结构

```
delta-account-platform/
├── backend/                 # Spring Boot 后端
│   ├── src/
│   │   └── main/
│   │       ├── java/com/delta/account/
│   │       │   ├── controller/  # 控制器
│   │       │   ├── service/     # 业务逻辑
│   │       │   ├── mapper/      # 数据访问
│   │       │   ├── model/       # 数据模型
│   │       │   ├── config/      # 配置
│   │       │   └── common/      # 公共组件
│   │       └── resources/
│   │           ├── application.yml  # 应用配置
│   │           └── schema.sql        # 数据库脚本
│   └── pom.xml
│
├── frontend/                # React 前端
│   ├── src/
│   │   ├── api/            # API 请求
│   │   ├── components/     # 组件
│   │   ├── pages/          # 页面
│   │   ├── store/          # 状态管理
│   │   ├── types/          # 类型定义
│   │   └── index.css       # 全局样式
│   └── package.json
│
├── SPEC.md                 # 技术规格说明书
└── README.md
```

## 快速开始

### 后端 (本地开发)

1. 确保已安装 MySQL 并启动服务
2. 创建数据库:
   ```sql
   CREATE DATABASE delta_account;
   ```
3. 修改 `backend/src/main/resources/application.yml` 中的数据库配置
4. 运行:
   ```bash
   cd backend
   mvn spring-boot:run
   ```
5. 访问 Swagger API 文档: http://localhost:8080/swagger-ui.html

### 前端 (本地开发)

```bash
cd frontend
cp .env.example .env.local
npm install
npm run dev
```

## 部署

### 前端 (Vercel)

```bash
cd frontend
npm install -g vercel
vercel deploy
```

### 后端 (Render)

1. 将代码推送到 GitHub
2. 在 Render 创建一个新的 Web Service
3. 配置:
   - Build Command: `mvn clean package -DskipTests`
   - Start Command: `java -jar target/account-platform-1.0.0.jar`
4. 添加环境变量: `DATABASE_URL` (MySQL 连接字符串)

## API 接口

### 认证
- `POST /api/auth/register` - 用户注册
- `POST /api/auth/login` - 用户登录
- `GET /api/auth/profile` - 获取用户信息

### 账号
- `GET /api/accounts` - 获取账号列表
- `GET /api/accounts/{id}` - 获取账号详情
- `POST /api/accounts` - 发布账号
- `PUT /api/accounts/{id}` - 更新账号
- `DELETE /api/accounts/{id}` - 下架账号

### 订单
- `POST /api/orders` - 创建订单
- `GET /api/orders/{id}` - 获取订单详情
- `PUT /api/orders/{id}/pay` - 支付订单
- `PUT /api/orders/{id}/complete` - 完成订单
- `PUT /api/orders/{id}/cancel` - 取消订单

## 开发规范

- 后端遵循分层架构: Controller → Service → Mapper
- 前端使用函数式组件 + Hooks
- 所有 API 需要 JWT 认证 (除 `/api/auth/*`)
- 代码提交前需自测

## License

MIT
