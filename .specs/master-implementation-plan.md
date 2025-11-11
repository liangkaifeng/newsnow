# CapitalFlow 总体实施计划

## 版本信息
- **文档版本:** v1.0
- **创建时间:** 2025-01-09
- **负责人:** @liangkaifeng
- **开发分支:** `claude/setup-forked-project-011CUwSjRkkzC5MMNQCjupAV`

## 项目概览

CapitalFlow（资本流）是一个专业的投资资讯聚合平台，专注于：
- A股、港股、加密货币市场的实时资讯
- 开源数据集成（AKShare）
- AI 驱动的投资分析
- 社区驱动的功能需求系统

## 优先级策略

根据用户反馈，实施优先级调整为：

**🔴 P0 - 最高优先级（立即开始）**
- 前端页面功能完善
- 用户体验优化
- 功能需求系统（社区反馈）

**🟡 P1 - 中等优先级（第二阶段）**
- AI 功能集成
- 新闻聚合与去重
- 页面内容展示增强

**🟢 P2 - 低优先级（第三阶段）**
- Python 后端开发（AKShare 集成）
- 市场数据 API
- 高级数据分析功能

## 阶段零：E2E 测试基础设施（P0，预计 0.5 天）

### 目标
优先搭建 E2E 测试基础设施，确保后续功能开发完成后能自动运行测试

### 任务分解

#### Day 0: E2E 测试环境搭建
**负责模块:** Testing Infrastructure

**任务清单:**
- [x] 安装 Playwright 依赖
  ```bash
  pnpm add -D @playwright/test
  pnpm exec playwright install --with-deps
  ```
- [x] 创建 Playwright 配置文件 (`playwright.config.ts`)
  - 多浏览器支持（Chromium、Firefox、WebKit）
  - CI/CD 优化配置
  - 截图和视频录制
- [x] 创建 E2E 测试目录结构
  ```
  e2e/
  ├── example.spec.ts              # 基础功能测试
  ├── feature-requests.spec.ts     # 功能需求系统测试
  └── README.md                    # 测试文档
  ```
- [x] 创建 GitHub Actions workflow (`.github/workflows/e2e-tests.yml`)
  - 在每次 push 到 main/claude/** 分支时运行
  - Pull Request 自动测试
  - 失败时上传测试报告和截图
- [x] 添加 npm scripts
  ```json
  {
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui",
    "test:e2e:debug": "playwright test --debug"
  }
  ```
- [x] 编写测试文档 (`e2e/README.md`)
- [x] 创建基础测试用例
  - 首页加载测试
  - 布局切换测试
  - 新闻列表加载测试

**验收标准:**
- ✅ Playwright 安装成功
- ✅ 基础测试用例通过
- ✅ GitHub Actions workflow 配置完成
- ✅ 本地运行 `pnpm test:e2e` 成功

**预估工时:** 2-3 小时

**重要说明:**
🔴 **E2E 测试优先原则:**
- 每个新功能开发完成后，必须先编写 E2E 测试
- 所有 E2E 测试通过后才能提交代码
- CI/CD 会自动运行 E2E 测试，失败则阻止合并

---

## 阶段一：前端功能完善（P0，预计 5-6 天）

### 目标
完成核心用户交互功能，让用户能够提交需求、投票，提升社区参与度

### 任务分解

#### Day 1: 功能需求系统 - 数据库 & 基础 API
**负责模块:** Backend (Cloudflare Workers + D1)

**任务清单:**
- [ ] 创建 Cloudflare D1 数据库实例
  ```bash
  wrangler d1 create capitalflow-db
  ```
- [ ] 执行数据库 schema（4 张表：users, requests, votes, magic_tokens）
  ```bash
  wrangler d1 execute capitalflow-db --file=./db/schema.sql
  ```
- [ ] 配置环境变量
  - `JWT_SECRET`: 随机生成 256-bit 密钥
  - `EMAIL_FROM`: noreply@flow.liangkaifeng.com
- [ ] 实现 `GET /api/requests` 端点
  - 支持状态筛选、排序、分页
  - 返回投票数、创建时间等信息
- [ ] 编写 API 测试用例（至少 5 个测试场景）

**验收标准:**
- D1 数据库创建成功，可通过 Cloudflare Dashboard 访问
- GET /api/requests 返回正确的 JSON 结构
- 响应时间 < 200ms

**E2E 测试:**
- 无需 E2E（后端 API，可使用集成测试）

**预估工时:** 4 小时

---

#### Day 2: 功能需求系统 - 认证系统
**负责模块:** Authentication (Magic Link)

**任务清单:**
- [ ] 实现 `POST /api/auth/login` 端点
  - 验证邮箱格式
  - 生成 UUID token
  - 存储到 magic_tokens 表（15分钟有效期）
  - 发送 Magic Link 邮件
- [ ] 配置 Cloudflare Email Workers
  - 使用 MailChannels API
  - 配置 SPF/DKIM 记录（提高送达率）
- [ ] 实现 `POST /api/auth/verify` 端点
  - 验证 token 有效性
  - 创建或更新用户记录
  - 生成 JWT session token（30天有效期）
  - 删除已使用的 magic_token
- [ ] JWT 工具函数
  - `signJWT()`: 签名 JWT
  - `verifyJWT()`: 验证 JWT
  - 使用 jose 库

**验收标准:**
- Magic Link 邮件在 5 秒内送达
- 点击链接后成功登录，获得 session token
- Token 过期后无法使用
- Magic Link 使用一次后失效

**E2E 测试:**
- [ ] 更新 `e2e/feature-requests.spec.ts` 中的登录测试
- [ ] 测试发送 Magic Link 功能
- [ ] 测试邮箱格式验证
- [ ] 运行 `pnpm test:e2e` 确保所有测试通过

**预估工时:** 6 小时

---

#### Day 3: 功能需求系统 - 需求提交 & 投票 API
**负责模块:** Backend API

**任务清单:**
- [ ] 实现 `POST /api/requests` 端点（创建需求）
  - 验证 JWT token
  - 验证标题（5-100字符）
  - 验证描述（10-1000字符）
  - 插入数据库
  - 返回新创建的需求 ID
- [ ] 实现 `POST /api/requests/:id/vote` 端点（投票/取消投票）
  - 验证 JWT token
  - 检查是否已投票
  - 更新投票记录和计数
  - 返回最新投票数
- [ ] 添加速率限制
  - 每个邮箱每天最多提交 3 个需求
  - 每个邮箱每天最多投票 20 次
  - 使用 Cloudflare Rate Limiting 或 D1 记录

**验收标准:**
- 未登录用户无法提交需求或投票（返回 401）
- 同一用户不能对同一需求重复投票
- 投票操作响应时间 < 100ms
- 速率限制正常工作

**E2E 测试:**
- [ ] 启用 `e2e/feature-requests.spec.ts` 中被跳过的投票测试
- [ ] 测试提交需求功能
- [ ] 测试表单验证
- [ ] 运行 `pnpm test:e2e` 确保所有测试通过

**预估工时:** 5 小时

---

#### Day 4: 功能需求系统 - 前端组件开发
**负责模块:** Frontend (React)

**任务清单:**
- [ ] 创建 `/requests` 路由
  ```bash
  app/routes/requests.tsx
  ```
- [ ] 开发核心组件
  - **RequestList.tsx**: 需求列表容器
    - 状态筛选器（全部/待处理/开发中/已完成）
    - 排序选择（按投票/按时间）
    - 分页加载
  - **RequestCard.tsx**: 单个需求卡片
    - 投票按钮（显示投票数，已投票高亮）
    - 需求标题和描述
    - 状态标签（颜色编码）
    - 提交者信息（脱敏）
    - 创建时间
  - **RequestForm.tsx**: 需求提交表单
    - 标题输入框（字符计数）
    - 描述输入框（支持换行）
    - 提交按钮
    - 表单验证提示
  - **LoginModal.tsx**: 登录弹窗
    - 邮箱输入框
    - 发送验证码按钮
    - 倒计时状态（60秒）
    - 成功/错误提示
- [ ] 实现自定义 Hooks
  - **useAuth.ts**: 认证状态管理
    - 登录、登出、验证
    - localStorage 存储 session token
    - JWT 解码获取用户信息
  - **useRequests.ts**: 需求列表查询
    - TanStack Query 集成
    - 30秒自动刷新
    - 分页和筛选参数
  - **useVote.ts**: 投票 Mutation
    - 乐观更新 UI
    - 错误回滚
- [ ] Jotai 状态原子
  - `userAtom`: 当前用户
  - `sessionTokenAtom`: 会话令牌
  - `requestsFilterAtom`: 筛选条件

**验收标准:**
- 所有组件正常渲染，无控制台错误
- 表单验证工作正常
- 投票动画流畅
- 移动端布局正确

**E2E 测试:**
- [ ] 更新所有前端相关的 E2E 测试
- [ ] 测试组件交互功能
- [ ] 测试响应式布局
- [ ] 运行 `pnpm test:e2e` 确保所有测试通过

**预估工时:** 8 小时

---

#### Day 5: 功能需求系统 - UI/UX 优化 & 测试
**负责模块:** UI/UX & QA

**任务清单:**
- [ ] 响应式设计调整
  - Desktop (≥768px): 最大宽度 896px，侧边投票按钮
  - Mobile (<768px): 全宽布局，投票按钮右上角
- [ ] 样式优化
  - 状态标签颜色：待处理（灰）、开发中（蓝）、已完成（绿）、已拒绝（红）
  - 投票按钮状态：未投票（灰色边框）、已投票（蓝色填充）
  - Hover 和 Active 状态动画
- [ ] 交互优化
  - 骨架屏加载状态
  - 空状态提示（无需求时显示引导）
  - Toast 通知（成功/错误提示）
  - 需求描述折叠/展开（超过 3 行）
- [ ] 端到端测试
  - 测试场景 1: 游客查看需求列表
  - 测试场景 2: 用户登录流程（发送 Magic Link → 点击验证 → 登录成功）
  - 测试场景 3: 提交新需求
  - 测试场景 4: 投票和取消投票
  - 测试场景 5: 状态筛选和排序
- [ ] 性能测试
  - Lighthouse 评分 > 90
  - 首屏加载时间 < 2s
  - API 响应时间监控
- [ ] 部署到生产环境
  ```bash
  git add .
  git commit -m "feat: 完成功能需求系统"
  git push -u origin claude/setup-forked-project-011CUwSjRkkzC5MMNQCjupAV
  npm run build
  wrangler pages deploy
  ```

**验收标准:**
- 所有测试场景通过
- Lighthouse Performance > 90
- 移动端和桌面端体验良好
- 生产环境部署成功

**E2E 测试（最终验证）:**
- [x] 运行完整的 E2E 测试套件 `pnpm test:e2e`
- [x] 所有测试场景必须通过（包括多浏览器）
- [x] 性能测试通过（加载时间 < 3s）
- [x] 响应式测试通过（移动端、平板端）
- [x] CI/CD 自动测试通过（GitHub Actions）

**预估工时:** 6 小时

---

### 阶段一总结

**总工时:** 29 小时 (约 4-5 个工作日)

**交付物:**
- ✅ 完整的功能需求系统
- ✅ 邮箱登录（Magic Link）
- ✅ 需求提交和投票功能
- ✅ 响应式 UI 组件
- ✅ 生产环境部署

**里程碑:**
用户可以在网站底部看到功能需求入口，登录后提交需求并为感兴趣的功能投票。

---

## 阶段二：AI 功能集成（P1，预计 7 天）

### 目标
集成 AI 能力，提供智能新闻聚合、摘要和分析功能

### 任务分解

#### Day 6-7: 新闻聚合与去重
**负责模块:** AI Processing

**任务清单:**
- [ ] 实现新闻相似度检测算法
  - TF-IDF 向量化（支持中文分词）
  - 余弦相似度计算
  - 相似度阈值: 0.75
- [ ] 新闻聚合逻辑
  - 按时间窗口（6小时）分组
  - 识别重复新闻
  - 选择主新闻（最早或最权威来源）
  - 关联相似新闻
- [ ] 数据库 Schema
  ```sql
  CREATE TABLE news_clusters (
    id INTEGER PRIMARY KEY,
    title TEXT NOT NULL,
    main_news_id TEXT NOT NULL,
    related_news_ids TEXT, -- JSON array
    similarity_score REAL,
    created_at INTEGER
  );
  ```
- [ ] Cloudflare Workers Cron Job
  - 每 15 分钟执行一次聚合
  - 处理最近 24 小时的新闻

**验收标准:**
- 相同新闻能被正确识别并聚合
- 聚合结果在 1 分钟内完成
- 误报率 < 5%

**预估工时:** 12 小时

---

#### Day 8-9: AI 新闻摘要
**负责模块:** Claude Integration

**任务清单:**
- [ ] Claude API 集成
  - 使用 Anthropic SDK
  - 配置 API Key (环境变量)
  - 错误处理和重试机制
- [ ] 新闻摘要生成
  - Prompt 设计：总结多条相似新闻为一段话（100-200字）
  - 批量处理（每次最多 10 条聚合新闻）
  - 结果缓存（24 小时）
- [ ] 前端展示
  - NewsCluster 组件
  - 主新闻 + AI 摘要 + 相关新闻列表
  - 展开/折叠相关新闻
- [ ] 成本优化
  - 仅对热门新闻（> 5 个来源）生成摘要
  - 使用 Claude Haiku（成本更低）
  - 预估成本: ￥50-100/月

**验收标准:**
- AI 摘要准确、简洁、客观
- 生成时间 < 3 秒
- 前端展示流畅

**预估工时:** 10 小时

---

#### Day 10-11: AI 投资分析（实验性功能）
**负责模块:** AI Analysis

**任务清单:**
- [ ] 设计 AI 分析接口
  - `POST /api/ai/analyze-sector`: 板块分析
  - `POST /api/ai/analyze-stock`: 个股分析
  - 输入: 新闻列表 + 股票代码
  - 输出: 分析结论 + 风险提示
- [ ] Prompt Engineering
  - 板块分析 Prompt（关注资金流向、政策影响）
  - 个股分析 Prompt（基本面、技术面、新闻面）
  - 添加免责声明
- [ ] 前端集成
  - 添加 "AI 分析" 按钮（仅对财经新闻）
  - 分析结果展示（卡片形式）
  - 风险提示高亮
- [ ] 限流保护
  - 每个用户每天最多 5 次 AI 分析
  - 使用 D1 记录调用次数

**验收标准:**
- AI 分析结果有参考价值
- 包含明确的免责声明
- 成本可控（每次分析 < ￥0.1）

**预估工时:** 10 小时

---

#### Day 12: MCP (Model Context Protocol) 支持
**负责模块:** AI Infrastructure

**任务清单:**
- [ ] 实现 MCP Server
  - 使用 `@modelcontextprotocol/sdk`
  - 定义工具（Tools）：
    - `get_latest_news`: 获取最新资讯
    - `search_stock_news`: 搜索个股新闻
    - `get_market_sentiment`: 获取市场情绪
- [ ] 部署 MCP Server
  - Vercel Serverless Functions
  - 或 Cloudflare Workers（长连接支持）
- [ ] 文档编写
  - MCP Server 使用说明
  - 集成示例（Claude Desktop、API）

**验收标准:**
- Claude Desktop 能成功连接 MCP Server
- 工具调用返回正确数据
- 文档清晰易懂

**预估工时:** 6 小时

---

### 阶段二总结

**总工时:** 48 小时 (约 6-7 个工作日)

**交付物:**
- ✅ 智能新闻聚合与去重
- ✅ AI 生成新闻摘要
- ✅ AI 投资分析（实验性）
- ✅ MCP Server 部署

**里程碑:**
用户可以看到聚合后的新闻摘要，减少信息重复；可以使用 AI 分析功能获取投资建议（实验性）。

---

## 阶段三：开源数据集成（P2，预计 10 天）

### 目标
集成 AKShare 开源数据库，提供 A股、港股、加密货币的实时数据

### 任务分解

#### Day 13-14: FastAPI 项目初始化
**负责模块:** Python Backend

**任务清单:**
- [ ] 创建 FastAPI 项目结构
  ```
  backend/
  ├── main.py           # FastAPI 入口
  ├── routers/
  │   ├── capital_flow.py
  │   ├── stocks.py
  │   └── crypto.py
  ├── services/
  │   └── akshare_service.py
  ├── models/
  │   └── schemas.py
  ├── requirements.txt
  └── vercel.json
  ```
- [ ] 安装依赖
  ```txt
  fastapi==0.104.1
  akshare==1.12.0
  pandas==2.1.3
  uvicorn==0.24.0
  pydantic==2.5.0
  ```
- [ ] 配置 Vercel 部署
  ```json
  {
    "builds": [
      { "src": "main.py", "use": "@vercel/python" }
    ],
    "routes": [
      { "src": "/(.*)", "dest": "main.py" }
    ]
  }
  ```
- [ ] 实现健康检查端点
  ```python
  @app.get("/health")
  async def health():
      return {"status": "ok"}
  ```

**验收标准:**
- FastAPI 本地运行成功
- 健康检查端点返回 200
- Vercel 部署成功

**预估工时:** 8 小时

---

#### Day 15-16: AKShare 数据接口 - 资金流向
**负责模块:** Capital Flow API

**任务清单:**
- [ ] 实现 `GET /api/data/capital-flow`
  - 个股资金流向排名（今日、3日、5日、10日）
  - 板块资金流向排名
  - 返回字段: 股票代码、名称、主力净流入、散户净流入、涨跌幅
- [ ] AKShare 函数调用
  ```python
  import akshare as ak
  df = ak.stock_individual_fund_flow_rank(indicator="今日")
  ```
- [ ] 数据清洗和格式化
  - 转换为 JSON
  - 字段重命名（中文 → 英文）
  - 数值格式化（保留 2 位小数）
- [ ] Cloudflare Workers 缓存层
  - KV 存储缓存（TTL: 5 分钟）
  - 减少 Vercel 调用次数

**验收标准:**
- API 返回正确的资金流向数据
- 响应时间 < 500ms（含缓存）
- 数据格式符合前端需求

**预估工时:** 10 小时

---

#### Day 17-18: AKShare 数据接口 - 股票行情
**负责模块:** Stock Data API

**任务清单:**
- [ ] 实现 `GET /api/data/stocks/hot`
  - 热门股票排行（按搜索量、资金流入）
  - 返回字段: 股票代码、名称、涨跌幅、成交量、搜索热度
- [ ] 实现 `GET /api/data/stocks/dragon-tiger`
  - 龙虎榜数据（买入、卖出前 5 席位）
  - 返回字段: 股票代码、营业部名称、买入金额、卖出金额
- [ ] 实现 `GET /api/data/stocks/northbound`
  - 北向资金流向（沪股通、深股通）
  - 返回字段: 净流入金额、成交金额、前 10 活跃股
- [ ] AKShare 函数
  ```python
  ak.stock_hot_rank_em()  # 热门股票
  ak.stock_lhb_detail()   # 龙虎榜
  ak.stock_hsgt_north_net_flow_in()  # 北向资金
  ```

**验收标准:**
- 3 个端点全部正常工作
- 数据实时性 < 10 分钟
- 缓存策略合理

**预估工时:** 12 小时

---

#### Day 19-20: AKShare 数据接口 - 加密货币
**负责模块:** Crypto Data API

**任务清单:**
- [ ] 实现 `GET /api/data/crypto/markets`
  - 主流加密货币行情（BTC, ETH, BNB 等）
  - 返回字段: 代码、价格、24h 涨跌幅、市值
- [ ] 实现 `GET /api/data/crypto/funding-rate`
  - 合约资金费率（判断多空情绪）
  - 返回字段: 交易对、资金费率、多空比
- [ ] AKShare 函数
  ```python
  ak.crypto_spot_price()  # 现货价格
  ak.crypto_funding_rate()  # 资金费率
  ```
- [ ] 实时行情更新
  - Cloudflare Workers Cron（每分钟刷新缓存）

**验收标准:**
- 加密货币数据准确
- 更新频率 < 1 分钟
- 支持主流交易所（Binance、OKX）

**预估工时:** 10 小时

---

#### Day 21-22: 前端数据看板
**负责模块:** Data Dashboard UI

**任务清单:**
- [ ] 创建 `/data` 路由
- [ ] 开发数据展示组件
  - **CapitalFlowTable.tsx**: 资金流向表格
  - **HotStocksCard.tsx**: 热门股票卡片
  - **DragonTigerList.tsx**: 龙虎榜列表
  - **NorthboundFlow.tsx**: 北向资金流向图表
  - **CryptoMarkets.tsx**: 加密货币行情
- [ ] 数据可视化
  - 使用 Recharts 绘制资金流向趋势图
  - 使用 TailwindCSS 表格样式
  - 红涨绿跌配色
- [ ] TanStack Query 集成
  - 自动刷新（30秒）
  - 加载和错误状态

**验收标准:**
- 数据看板页面美观
- 图表清晰易读
- 数据自动刷新

**预估工时:** 12 小时

---

### 阶段三总结

**总工时:** 52 小时 (约 7-10 个工作日)

**交付物:**
- ✅ FastAPI + AKShare 后端
- ✅ 5 个数据 API 端点
- ✅ Cloudflare Workers 缓存层
- ✅ 前端数据看板

**里程碑:**
用户可以在数据看板页面查看实时的资金流向、热门股票、龙虎榜、北向资金和加密货币行情。

---

## 技术栈总览

### 前端
- **框架:** React 19
- **路由:** TanStack Router
- **数据获取:** TanStack Query
- **状态管理:** Jotai
- **样式:** UnoCSS + TailwindCSS
- **图表:** Recharts
- **类型:** TypeScript

### 后端
- **API Gateway:** Cloudflare Workers
- **数据服务:** FastAPI (Python)
- **数据库:** Cloudflare D1 (SQLite)
- **缓存:** Cloudflare KV
- **邮件:** MailChannels (via Email Workers)

### AI
- **模型:** Claude 3.5 Sonnet (主力), Claude Haiku (成本优化)
- **协议:** Model Context Protocol (MCP)
- **SDK:** Anthropic SDK

### 数据源
- **开源库:** AKShare 1.12.0+
- **新闻源:** 17+ RSS/API（财经、科技、加密货币）

### 部署
- **前端:** Cloudflare Pages
- **Workers:** Cloudflare Workers
- **Python 后端:** Vercel Serverless Functions
- **域名:** flow.liangkaifeng.com

---

## E2E 测试策略总结

### 测试优先原则

🔴 **核心原则:** E2E 测试是质量保障的第一道防线

1. **开发前:** 搭建测试基础设施（Day 0）
2. **开发中:** 每完成一个功能模块，立即编写 E2E 测试
3. **开发后:** 所有测试通过才能提交代码
4. **部署前:** CI/CD 自动运行测试，失败则阻止部署

### 测试覆盖范围

#### 已实现（Day 0）
- ✅ 基础功能测试（首页、布局、新闻列表）
- ✅ 功能需求系统框架测试（未登录用户可见性）
- ✅ 响应式布局测试（移动端、平板端）
- ✅ 性能基准测试（加载时间 < 3s）

#### 待实现（随功能开发）
- ⏸️ 认证流程测试（Magic Link）
- ⏸️ 需求提交测试
- ⏸️ 投票功能测试
- ⏸️ 数据看板测试（阶段三）
- ⏸️ AI 功能测试（阶段二）

### 测试工具和环境

**本地开发:**
```bash
# UI 模式（推荐）
pnpm test:e2e:ui

# 调试模式
pnpm test:e2e:debug

# 有头模式（查看浏览器）
pnpm test:e2e:headed
```

**CI/CD 环境:**
- 自动运行于 GitHub Actions
- 多浏览器并行测试（Chromium、Firefox、WebKit）
- 失败时自动上传截图和报告

### 测试文档位置

- 配置: `playwright.config.ts`
- 测试用例: `e2e/*.spec.ts`
- 测试文档: `e2e/README.md`
- CI 配置: `.github/workflows/e2e-tests.yml`

---

## 总时间估算

| 阶段 | 任务 | 工时 | 工作日 |
|------|------|------|--------|
| 阶段零 | E2E 测试基础设施 | 3h | 0.5天 |
| 阶段一 | 前端功能完善 | 29h | 4-5天 |
| 阶段二 | AI 功能集成 | 48h | 6-7天 |
| 阶段三 | 开源数据集成 | 52h | 7-10天 |
| **总计** | | **132h** | **18-23天** |

**说明:**
- 按每天 6 小时有效工作时间计算
- 不包括测试修复和优化时间
- 实际开发时间可能有 ±20% 浮动

---

## 成本估算

### 开发成本
- 人力成本: 按实际情况计算

### 运营成本（月度）

**阶段一（功能需求系统）:**
- Cloudflare D1: ￥0（免费额度内）
- Email Workers: ￥0（免费 3000 封/月）
- Workers: ￥0（免费额度内）
- **小计:** ￥0/月

**阶段二（AI 功能）:**
- Claude API: ￥50-100/月（Haiku 模型，每天处理 100 条新闻）
- Cloudflare: ￥0（免费额度内）
- **小计:** ￥50-100/月

**阶段三（开源数据）:**
- Vercel: ￥0-50/月（Hobby 免费，超额 $20）
- Cloudflare KV: ￥0（免费额度内）
- **小计:** ￥0-50/月

**总运营成本:** ￥50-150/月

---

## 风险管理

### 技术风险

**1. AKShare 数据源稳定性**
- **风险:** AKShare 底层数据源可能变更或失效
- **对策:**
  - 定期更新 AKShare 版本
  - 监控数据异常，及时切换备用源
  - 在 GitHub 关注 AKShare 项目动态

**2. Cloudflare Workers 限流**
- **风险:** 超过免费额度导致服务中断
- **对策:**
  - 监控请求量
  - 优化缓存策略（延长 TTL）
  - 准备升级到付费计划

**3. AI 成本超支**
- **风险:** Claude API 调用量超预期
- **对策:**
  - 严格限流（每用户每天最多 5 次）
  - 仅对热门新闻生成摘要
  - 切换到 Haiku 模型降低成本

### 业务风险

**1. 用户增长缓慢**
- **风险:** 功能需求系统无人使用
- **对策:**
  - 在首页添加明显入口
  - 预填充一些示例需求
  - 社交媒体推广

**2. 垃圾内容泛滥**
- **风险:** 恶意用户提交垃圾需求
- **对策:**
  - 速率限制（每天 3 个需求）
  - 邮箱验证门槛
  - 后期添加内容审核

---

## 验收标准（总体）

### 功能完整性
- [ ] 功能需求系统完整可用（登录、提交、投票）
- [ ] 新闻聚合去重正常工作
- [ ] AI 摘要准确客观
- [ ] 数据 API 全部可用
- [ ] 前端页面响应式布局

### 性能指标
- [ ] Lighthouse Performance > 90
- [ ] 首屏加载时间 < 2s
- [ ] API 响应时间 < 500ms（P95）
- [ ] 数据刷新频率 < 1 分钟

### 安全性
- [ ] JWT 认证正常工作
- [ ] SQL 注入防护
- [ ] XSS 防护
- [ ] CORS 正确配置
- [ ] 速率限制生效

### 用户体验
- [ ] 移动端体验良好
- [ ] 加载状态清晰
- [ ] 错误提示友好
- [ ] 数据展示美观

---

## 下一步行动（立即开始）

### 1. 创建数据库
```bash
cd /home/user/newsnow
wrangler d1 create capitalflow-db
```

### 2. 准备数据库 Schema
创建 `db/schema.sql` 文件

### 3. 配置环境变量
在 Cloudflare Dashboard 添加:
- `JWT_SECRET`
- `EMAIL_FROM`
- `ANTHROPIC_API_KEY`

### 4. 开始 Day 1 任务
实现 `GET /api/requests` 端点

---

**文档状态:** ✅ 已完成
**最后更新:** 2025-01-09
**批准人:** @liangkaifeng
