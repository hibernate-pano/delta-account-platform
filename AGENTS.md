# Repository Guidelines

## Project Structure & Module Organization
- `backend/` 是 Spring Boot 3 + MyBatis-Plus 后端，核心代码在 `backend/src/main/java/com/delta/account/`，按 `controller`、`service`、`mapper`、`model`、`config`、`common` 分层。
- `backend/src/main/resources/` 存放运行配置与数据库脚本（如 `application.yml`、`schema.sql`）。
- `frontend/` 是 React + TypeScript + Vite 前端，页面在 `frontend/src/pages`，通用组件在 `frontend/src/components`，API 封装在 `frontend/src/api`，状态管理在 `frontend/src/store`。
- `docs/` 存放设计/计划文档；`SPEC.md` 和 `README.md` 提供产品与部署背景。

## Build, Test, and Development Commands
- 后端本地启动：`cd backend && mvn spring-boot:run`
- 后端打包：`cd backend && mvn clean package -DskipTests`
- 后端测试：`cd backend && mvn test`
- 前端安装依赖：`cd frontend && npm install`
- 前端开发：`cd frontend && npm run dev`
- 前端构建：`cd frontend && npm run build`
- 前端检查：`cd frontend && npm run lint`

## Coding Style & Naming Conventions
- 后端保持分层调用链：`Controller -> Service -> Mapper`，避免跨层直接访问。
- Java 类命名遵循职责后缀：`*Controller`、`*Service`、`*ServiceImpl`、`*Mapper`；DTO 放在 `model/dto`，实体放在 `model/entity`。
- 前端使用函数组件 + Hooks；页面组件使用 `PascalCase`（如 `AccountDetailPage.tsx`），工具函数使用小驼峰。
- 前端代码质量以 `frontend/eslint.config.js` 为准；提交前至少运行一次 `npm run lint`。

## Testing Guidelines
- 仓库当前未建立完整自动化测试体系（后端暂无 `src/test`、前端无测试脚本）。
- 新增功能时建议最少补充后端单元/集成测试（`mvn test` 可执行），并在 PR 中提供前端手动回归步骤。
- 涉及登录、支付、钱包、订单状态流转的改动，必须附带端到端手动验证结果。

## Commit & Pull Request Guidelines
- 延续现有提交前缀：`feat:`、`fix:`、`chore:`（可接中文说明），例如 `feat: 完成钱包退款流程`。
- 单个 commit 聚焦单一目的；功能改动与重构/格式化尽量分开。
- PR 需包含：变更摘要、影响范围、验证命令与结果；UI 变更附截图，接口变更附示例请求/响应。

## Security & Configuration Tips
- 不要提交真实密钥或数据库凭据；本地配置基于 `.env.example` 与 `application.yml` 模板。
- 优先通过环境变量覆盖生产配置（参考 `render.yaml`、`frontend/vercel.json`），避免硬编码敏感信息。
