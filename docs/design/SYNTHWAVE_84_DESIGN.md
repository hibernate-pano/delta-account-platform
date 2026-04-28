# Synthwave 84 - 游戏账号交易平台 UI 设计规范

## 设计理念

**"Digital Arcade Dreams"** — 融合80年代霓虹街机美学与现代极简主义，打造一个让玩家感到熟悉又惊喜的游戏账号交易平台。不是廉价的复古模仿，而是对黄金时代的重新诠释。

---

## 色彩系统

### 主色调

| 名称 | 色值 | 用途 |
|------|------|------|
| **Hot Pink** | `#FF10F0` | 主品牌色、CTA按钮、Logo |
| **Cyber Cyan** | `#00D9FF` | 链接、hover状态、次要强调 |
| **Electric Purple** | `#BD00FF` | 渐变过渡、特殊效果 |
| **Neon Yellow** | `#FFE600` | 警告、成功状态、价格高亮 |

### 功能色

| 名称 | 色值 | 用途 |
|------|------|------|
| **Background Dark** | `#0D0221` | 主背景（深邃紫黑） |
| **Surface** | `#1A0A2E` | 卡片、面板背景 |
| **Grid Lines** | `#2D1B4E` | 网格线、边框 |
| **Text Primary** | `#FFFFFF` | 主要文字 |
| **Text Secondary** | `#B8A5D0` | 次要文字 |
| **Text Muted** | `#6B5B7A` | 禁用文字 |

### 发光效果

```css
--glow-pink: 0 0 20px rgba(255, 16, 240, 0.5);
--glow-cyan: 0 0 20px rgba(0, 217, 255, 0.5);
--glow-purple: 0 0 20px rgba(189, 0, 255, 0.5);
```

---

## 字体系统

### 标题字体

**Orbitron** (Google Fonts) — 未来感几何字体
- 用途: Logo、标题、大号数字
- 字重: 700-900

### 正文字体

**Rajdhani** (Google Fonts) — 现代科技感
- 用途: 正文、按钮、导航
- 字重: 400-600

### 中文备选

**Noto Sans SC** — 保证中文显示

---

## 视觉特效

### 1. 网格背景

```
background-image: 
  linear-gradient(rgba(45, 27, 78, 0.3) 1px, transparent 1px),
  linear-gradient(90deg, rgba(45, 27, 78, 0.3) 1px, transparent 1px);
background-size: 50px 50px;
perspective: 500px;
transform-style: preserve-3d;
```

### 2. 扫描线效果

```css
.scanlines::before {
  content: "";
  position: absolute;
  inset: 0;
  background: repeating-linear-gradient(
    0deg,
    transparent,
    transparent 2px,
    rgba(0, 0, 0, 0.1) 2px,
    rgba(0, 0, 0, 0.1) 4px
  );
  pointer-events: none;
}
```

### 3. 霓虹发光边框

```css
.neon-border {
  border: 1px solid #FF10F0;
  box-shadow: 
    0 0 5px #FF10F0,
    0 0 10px #FF10F0,
    inset 0 0 5px rgba(255, 16, 240, 0.1);
}
```

### 4. 渐变文字

```css
.gradient-text {
  background: linear-gradient(90deg, #FF10F0, #00D9FF, #BD00FF);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}
```

---

## 组件规范

### 按钮

**Primary Button**
- 背景: 渐变 `#FF10F0` → `#BD00FF`
- 文字: 白色，粗体
- 圆角: `4px` (锐利未来感)
- 效果: hover时发光增强，点击时缩放0.95
- 动画: `transform 150ms ease-out`

**Secondary Button**
- 背景: 透明
- 边框: `1px solid #00D9FF`
- 文字: `#00D9FF`
- 效果: hover时背景填充10%透明度

**Ghost Button**
- 背景: 透明
- 文字: `#B8A5D0`
- 效果: hover时文字变白，下划线出现

### 卡片

**Account Card**
- 背景: `#1A0A2E`
- 边框: `1px solid #2D1B4E`
- 圆角: `8px`
- hover: 边框变为霓虹粉发光
- 内含: 游戏图标、游戏名、价格、卖家信息

### 输入框

- 背景: `#0D0221`
- 边框: `1px solid #2D1B4E`
- 聚焦: 边框变粉 `#FF10F0`，添加发光
- 文字: 白色
- placeholder: `#6B5B7A`

### 徽章/标签

**价格标签**
- 背景: 渐变
- 效果: 发光

**状态徽章**
- 待处理: 黄色
- 进行中: 青色
- 已完成: 绿色
- 已取消: 灰色

---

## 布局规范

### 间距系统

- 基础单位: `4px`
- 间距级别: `4, 8, 12, 16, 24, 32, 48, 64, 96`
- 容器最大宽度: `1280px`

### 页面结构

```
┌─────────────────────────────────────────┐
│ HEADER (固定, glass效果)                 │
│ [Logo] [Nav] [Search] [User Menu]       │
├─────────────────────────────────────────┤
│                                         │
│ HERO (可选，全宽渐变背景)                 │
│                                         │
├─────────────────────────────────────────┤
│                                         │
│ CONTENT (卡片网格或列表)                 │
│                                         │
│   ┌─────┐ ┌─────┐ ┌─────┐              │
│   │     │ │     │ │     │              │
│   └─────┘ └─────┘ └─────┘              │
│                                         │
├─────────────────────────────────────────┤
│ FOOTER                                  │
└─────────────────────────────────────────┘
```

---

## 动效规范

### 页面加载

- 卡片依次淡入: `opacity 0→1, translateY 20px→0, stagger 50ms`
- 总时长: `400ms`
- 缓动: `ease-out`

### 悬停效果

- 卡片: `translateY -4px`, 边框发光
- 按钮: 发光增强
- 链接: 下划线滑动出现

### 点击反馈

- 按钮: `scale(0.95)`
- 卡片: `scale(0.98)`

### 过渡时长

- 快速交互: `150ms`
- 标准过渡: `250ms`
- 页面切换: `400ms`

---

## 响应式断点

| 名称 | 宽度 | 布局变化 |
|------|------|----------|
| Mobile | `< 640px` | 单列，底部导航 |
| Tablet | `640px - 1024px` | 双列网格 |
| Desktop | `> 1024px` | 多列网格 |

---

## 实现清单

### Phase 1: 基础设计系统
- [ ] 更新 tailwind.config.js 颜色和字体
- [ ] 创建 CSS 变量文件
- [ ] 更新全局样式 (index.css)
- [ ] 更新按钮组件
- [ ] 更新卡片组件

### Phase 2: Layout重设计
- [ ] Header: 霓虹Logo + 网格背景
- [ ] 导航: 悬停发光效果
- [ ] Footer: 复古风格
- [ ] 移动端底部导航

### Phase 3: 页面组件重设计
- [ ] 首页 Hero
- [ ] 账号卡片
- [ ] 订单页面
- [ ] 消息页面
- [ ] 个人中心

### Phase 4: 特殊效果
- [ ] 扫描线效果
- [ ] 霓虹边框
- [ ] 加载动画
- [ ] 滚动视差
