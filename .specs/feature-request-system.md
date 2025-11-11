# Feature Request System - 需求投票系统

## 1. 需求背景 (Requirement Background)

### 1.1 业务目标
CapitalFlow 作为开源的投资资讯聚合平台，需要一个社区驱动的功能需求收集系统，让用户能够：
- 提交新功能需求
- 查看其他用户的需求
- 为感兴趣的需求投票
- 帮助开发团队了解用户优先级

### 1.2 用户故事
- 作为普通访客，我希望能够查看所有用户提交的功能需求列表，按热度排序
- 作为注册用户，我希望能够提交新的功能需求
- 作为注册用户，我希望能够为我感兴趣的需求投票 (+1)
- 作为开发者，我希望能够看到最受欢迎的需求，优先开发

### 1.3 现状问题
- 无法收集用户反馈和功能需求
- 不知道用户最需要什么功能
- 缺少与社区的互动渠道

## 2. 功能范围 (Feature Scope)

### 2.1 核心功能 (In Scope)
✅ 邮箱登录认证（Magic Link）
✅ 提交功能需求（标题 + 详细描述）
✅ 查看需求列表（所有人可见）
✅ 投票功能（+1）
✅ 按热度排序（投票数）
✅ 需求状态标签（待处理、开发中、已完成、已拒绝）
✅ 响应式UI组件

### 2.2 暂不实现 (Out of Scope)
❌ OAuth 登录（GitHub、Google）
❌ 需求评论功能
❌ 需求搜索/筛选
❌ 管理后台（状态更新通过 Cloudflare D1 Console）
❌ 邮件通知

### 2.3 未来扩展 (Future Enhancement)
- 需求标签系统
- 需求合并功能
- 开发进度跟踪
- 用户积分系统

## 3. 技术架构 (Technical Architecture)

### 3.1 整体架构

```
┌─────────────────────────────────────────────────────────┐
│                    Frontend (React)                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │ RequestForm  │  │ RequestList  │  │ LoginModal   │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
└─────────────────────────────────────────────────────────┘
                           │
                           ↓ API Calls
┌─────────────────────────────────────────────────────────┐
│              Cloudflare Workers (API)                    │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │ POST /login  │  │ POST /vote   │  │ GET /requests│  │
│  │ POST /request│  │ POST /verify │  │              │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
└─────────────────────────────────────────────────────────┘
                           │
                           ↓ Database Operations
┌─────────────────────────────────────────────────────────┐
│                   Cloudflare D1 (SQLite)                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │   users      │  │   requests   │  │    votes     │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
└─────────────────────────────────────────────────────────┘
```

### 3.2 数据库设计

```sql
-- 用户表
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT UNIQUE NOT NULL,
  created_at INTEGER NOT NULL,
  last_login INTEGER NOT NULL
);

CREATE INDEX idx_users_email ON users(email);

-- 功能需求表
CREATE TABLE requests (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  user_id INTEGER NOT NULL,
  status TEXT DEFAULT 'pending', -- pending, in_progress, completed, rejected
  vote_count INTEGER DEFAULT 0,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE INDEX idx_requests_status ON requests(status);
CREATE INDEX idx_requests_vote_count ON requests(vote_count DESC);

-- 投票记录表
CREATE TABLE votes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  request_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  created_at INTEGER NOT NULL,
  UNIQUE(request_id, user_id),
  FOREIGN KEY (request_id) REFERENCES requests(id),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE INDEX idx_votes_request ON votes(request_id);
CREATE INDEX idx_votes_user ON votes(user_id);

-- Magic Link 令牌表
CREATE TABLE magic_tokens (
  token TEXT PRIMARY KEY,
  email TEXT NOT NULL,
  expires_at INTEGER NOT NULL,
  created_at INTEGER NOT NULL
);

CREATE INDEX idx_tokens_email ON magic_tokens(email);
CREATE INDEX idx_tokens_expires ON magic_tokens(expires_at);
```

### 3.3 API 端点设计

#### 3.3.1 POST /api/auth/login
发送 Magic Link 到用户邮箱

**Request:**
```json
{
  "email": "user@example.com"
}
```

**Response:**
```json
{
  "success": true,
  "message": "验证邮件已发送，请查收"
}
```

**实现逻辑:**
1. 验证邮箱格式
2. 生成随机 token (crypto.randomUUID())
3. 保存到 magic_tokens 表（有效期 15 分钟）
4. 通过 Cloudflare Email Workers 发送包含验证链接的邮件
5. 链接格式: `https://flow.liangkaifeng.com/auth/verify?token={token}`

#### 3.3.2 POST /api/auth/verify
验证 Magic Link 并登录

**Request:**
```json
{
  "token": "uuid-token-string"
}
```

**Response:**
```json
{
  "success": true,
  "user": {
    "id": 1,
    "email": "user@example.com"
  },
  "session_token": "jwt-token-string"
}
```

**实现逻辑:**
1. 查询 magic_tokens 表
2. 验证 token 是否存在且未过期
3. 创建或更新用户记录
4. 生成 JWT session token（有效期 30 天）
5. 删除已使用的 magic_token
6. 返回 session token（存储在 localStorage）

#### 3.3.3 GET /api/requests
获取需求列表

**Query Parameters:**
- `status`: pending | in_progress | completed | rejected | all (default: all)
- `sort`: votes | created (default: votes)
- `limit`: number (default: 50)
- `offset`: number (default: 0)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "title": "添加实时K线图",
      "description": "希望能在个股页面看到实时K线图",
      "status": "pending",
      "vote_count": 42,
      "user_email": "u***@example.com",
      "created_at": 1736380800,
      "has_voted": false
    }
  ],
  "total": 100,
  "offset": 0,
  "limit": 50
}
```

**实现逻辑:**
1. 从 requests 表查询，JOIN users 表获取邮箱
2. 根据 sort 参数排序
3. 如果有 session token，JOIN votes 表判断当前用户是否已投票
4. 邮箱脱敏处理（只显示首字母和域名）
5. 分页返回

#### 3.3.4 POST /api/requests
创建新需求

**Request:**
```json
{
  "title": "添加实时K线图",
  "description": "希望能在个股页面看到实时K线图，支持日线、周线、月线切换"
}
```

**Headers:**
```
Authorization: Bearer {session_token}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 123,
    "title": "添加实时K线图",
    "description": "希望能在个股页面看到实时K线图，支持日线、周线、月线切换",
    "status": "pending",
    "vote_count": 0,
    "created_at": 1736380800
  }
}
```

**实现逻辑:**
1. 验证 JWT token
2. 验证 title（1-100字符）和 description（1-1000字符）
3. 插入 requests 表
4. 返回新创建的需求

**错误处理:**
- 401: 未登录或 token 无效
- 400: 标题或描述格式错误

#### 3.3.5 POST /api/requests/:id/vote
为需求投票

**Headers:**
```
Authorization: Bearer {session_token}
```

**Response:**
```json
{
  "success": true,
  "vote_count": 43
}
```

**实现逻辑:**
1. 验证 JWT token
2. 检查是否已投票（votes 表）
3. 如果未投票：插入 votes 记录，更新 requests.vote_count + 1
4. 如果已投票：删除 votes 记录，更新 requests.vote_count - 1（取消投票）
5. 返回最新投票数

**错误处理:**
- 401: 未登录或 token 无效
- 404: 需求不存在

### 3.4 前端组件设计

#### 3.4.1 页面结构
```tsx
// app/routes/requests.tsx
import { RequestList } from '~/components/RequestList'
import { RequestForm } from '~/components/RequestForm'
import { useAuth } from '~/hooks/useAuth'

export default function RequestsPage() {
  const { user, isAuthenticated } = useAuth()

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-2">功能需求</h1>
      <p className="text-gray-600 mb-8">
        告诉我们你想要什么功能，为你感兴趣的需求投票
      </p>

      {isAuthenticated && <RequestForm />}
      {!isAuthenticated && <LoginPrompt />}

      <RequestList />
    </div>
  )
}
```

#### 3.4.2 核心组件

**RequestForm.tsx** - 需求提交表单
```tsx
interface RequestFormProps {
  onSubmit: (data: { title: string; description: string }) => void
}

// 包含:
// - 标题输入框（最多100字符）
// - 描述输入框（最多1000字符，支持markdown）
// - 提交按钮
// - 字符计数器
```

**RequestList.tsx** - 需求列表
```tsx
interface RequestListProps {
  filter?: 'all' | 'pending' | 'in_progress' | 'completed'
}

// 包含:
// - 状态筛选器
// - 排序选择（按投票/按时间）
// - RequestCard 列表
// - 加载更多按钮（分页）
```

**RequestCard.tsx** - 单个需求卡片
```tsx
interface RequestCardProps {
  request: Request
  onVote: (id: number) => void
  hasVoted: boolean
}

// 包含:
// - 投票按钮（显示投票数）
// - 需求标题
// - 需求描述（折叠/展开）
// - 状态标签
// - 提交者邮箱（脱敏）
// - 创建时间
```

**LoginModal.tsx** - 登录弹窗
```tsx
interface LoginModalProps {
  isOpen: boolean
  onClose: () => void
}

// 包含:
// - 邮箱输入框
// - 发送验证码按钮
// - 倒计时状态（60秒）
// - 说明文字
```

#### 3.4.3 状态管理（Jotai）

```tsx
// atoms/authAtom.ts
export const userAtom = atom<User | null>(null)
export const sessionTokenAtom = atom<string | null>(
  localStorage.getItem('session_token')
)

// atoms/requestsAtom.ts
export const requestsAtom = atom<Request[]>([])
export const requestsFilterAtom = atom<RequestFilter>({
  status: 'all',
  sort: 'votes'
})
```

#### 3.4.4 API Hooks

```tsx
// hooks/useRequests.ts
export function useRequests() {
  const [filter] = useAtom(requestsFilterAtom)

  return useQuery({
    queryKey: ['requests', filter],
    queryFn: () => fetchRequests(filter),
    refetchInterval: 30000 // 30秒自动刷新
  })
}

// hooks/useVote.ts
export function useVote() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (requestId: number) => voteRequest(requestId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['requests'] })
    }
  })
}

// hooks/useAuth.ts
export function useAuth() {
  const [sessionToken] = useAtom(sessionTokenAtom)
  const [user, setUser] = useAtom(userAtom)

  useEffect(() => {
    if (sessionToken) {
      // 验证 token 有效性，解析 JWT 获取 user 信息
      const decoded = decodeJWT(sessionToken)
      setUser(decoded.user)
    }
  }, [sessionToken])

  return {
    user,
    isAuthenticated: !!user,
    login: (email: string) => sendMagicLink(email),
    logout: () => {
      localStorage.removeItem('session_token')
      setUser(null)
    }
  }
}
```

### 3.5 Cloudflare Workers 实现

```typescript
// functions/api/requests/index.ts
interface Env {
  DB: D1Database
  JWT_SECRET: string
  EMAIL_FROM: string
}

export const onRequestGet: PagesFunction<Env> = async ({ env, request }) => {
  const url = new URL(request.url)
  const status = url.searchParams.get('status') || 'all'
  const sort = url.searchParams.get('sort') || 'votes'
  const limit = parseInt(url.searchParams.get('limit') || '50')
  const offset = parseInt(url.searchParams.get('offset') || '0')

  // 获取当前用户（如果已登录）
  const sessionToken = request.headers.get('Authorization')?.replace('Bearer ', '')
  let userId: number | null = null

  if (sessionToken) {
    const decoded = await verifyJWT(sessionToken, env.JWT_SECRET)
    userId = decoded.userId
  }

  // 构建 SQL 查询
  let query = `
    SELECT
      r.*,
      u.email,
      ${userId ? `EXISTS(SELECT 1 FROM votes WHERE request_id = r.id AND user_id = ?) as has_voted` : '0 as has_voted'}
    FROM requests r
    JOIN users u ON r.user_id = u.id
  `

  const params: any[] = userId ? [userId] : []

  if (status !== 'all') {
    query += ` WHERE r.status = ?`
    params.push(status)
  }

  query += ` ORDER BY ${sort === 'votes' ? 'r.vote_count DESC' : 'r.created_at DESC'}`
  query += ` LIMIT ? OFFSET ?`
  params.push(limit, offset)

  const { results } = await env.DB.prepare(query).bind(...params).all()

  // 邮箱脱敏
  const data = results.map(r => ({
    ...r,
    user_email: maskEmail(r.email)
  }))

  return new Response(JSON.stringify({
    success: true,
    data,
    total: results.length,
    offset,
    limit
  }), {
    headers: { 'Content-Type': 'application/json' }
  })
}

function maskEmail(email: string): string {
  const [local, domain] = email.split('@')
  return `${local[0]}***@${domain}`
}
```

### 3.6 邮件发送（Cloudflare Email Workers）

```typescript
// functions/api/auth/login.ts
export const onRequestPost: PagesFunction<Env> = async ({ env, request }) => {
  const { email } = await request.json()

  // 验证邮箱格式
  if (!isValidEmail(email)) {
    return new Response(JSON.stringify({
      success: false,
      error: '邮箱格式不正确'
    }), { status: 400 })
  }

  // 生成 token
  const token = crypto.randomUUID()
  const expiresAt = Date.now() + 15 * 60 * 1000 // 15分钟

  // 保存到数据库
  await env.DB.prepare(`
    INSERT INTO magic_tokens (token, email, expires_at, created_at)
    VALUES (?, ?, ?, ?)
  `).bind(token, email, expiresAt, Date.now()).run()

  // 发送邮件
  const verifyUrl = `https://flow.liangkaifeng.com/auth/verify?token=${token}`

  await fetch('https://api.mailchannels.net/tx/v1/send', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      personalizations: [{
        to: [{ email }]
      }],
      from: {
        email: env.EMAIL_FROM,
        name: 'CapitalFlow'
      },
      subject: '登录验证 - CapitalFlow',
      content: [{
        type: 'text/html',
        value: `
          <h2>欢迎登录 CapitalFlow</h2>
          <p>点击下方链接完成登录（15分钟内有效）：</p>
          <a href="${verifyUrl}">${verifyUrl}</a>
          <p>如果这不是您的操作，请忽略此邮件。</p>
        `
      }]
    })
  })

  return new Response(JSON.stringify({
    success: true,
    message: '验证邮件已发送，请查收'
  }))
}
```

### 3.7 JWT 认证

```typescript
// lib/jwt.ts
import { SignJWT, jwtVerify } from 'jose'

export async function signJWT(payload: any, secret: string): Promise<string> {
  const encoder = new TextEncoder()
  const jwt = await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('30d')
    .sign(encoder.encode(secret))

  return jwt
}

export async function verifyJWT(token: string, secret: string): Promise<any> {
  const encoder = new TextEncoder()
  const { payload } = await jwtVerify(token, encoder.encode(secret))
  return payload
}
```

## 4. UI/UX 设计

### 4.1 功能需求页面布局

```
┌────────────────────────────────────────────────────────┐
│  CapitalFlow  [搜索]  [布局] [登录]                       │
└────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────┐
│                                                         │
│  📋 功能需求                                             │
│  告诉我们你想要什么功能，为你感兴趣的需求投票              │
│                                                         │
│  ┌──────────────────────────────────────────────────┐ │
│  │ ✍️ 提交新需求                                      │ │
│  │ ┌──────────────────────────────────────────────┐ │ │
│  │ │ 标题: [                                    ] │ │ │
│  │ │ 描述: [                                    ] │ │ │
│  │ │       [                                    ] │ │ │
│  │ │ [提交]                                       │ │ │
│  │ └──────────────────────────────────────────────┘ │ │
│  └──────────────────────────────────────────────────┘ │
│                                                         │
│  🔥 热门需求                                             │
│  [全部] [待处理] [开发中] [已完成]   排序: [投票数 ▼]      │
│                                                         │
│  ┌──────────────────────────────────────────────────┐ │
│  │ [▲ 42]  添加实时K线图                 [待处理]      │ │
│  │         希望能在个股页面看到实时K线图...             │ │
│  │         提交者: u***@example.com  2天前            │ │
│  └──────────────────────────────────────────────────┘ │
│                                                         │
│  ┌──────────────────────────────────────────────────┐ │
│  │ [▲ 38]  支持自选股功能                [开发中]      │ │
│  │         能够添加自选股并实时查看...                 │ │
│  │         提交者: j***@gmail.com  5天前              │ │
│  └──────────────────────────────────────────────────┘ │
│                                                         │
│  [加载更多]                                             │
│                                                         │
└────────────────────────────────────────────────────────┘
```

### 4.2 投票按钮状态

**未投票状态:**
```
┌────────┐
│  ▲ 42  │  ← 灰色，hover 时变蓝
└────────┘
```

**已投票状态:**
```
┌────────┐
│  ▲ 42  │  ← 蓝色填充，点击取消投票
└────────┘
```

### 4.3 状态标签颜色

- 待处理 (pending): 灰色
- 开发中 (in_progress): 蓝色
- 已完成 (completed): 绿色
- 已拒绝 (rejected): 红色

### 4.4 响应式设计

**Desktop (≥768px):**
- 最大宽度 896px (max-w-4xl)
- 每行显示完整信息
- 侧边显示投票按钮

**Mobile (<768px):**
- 全宽布局
- 投票按钮移至右上角
- 描述默认折叠

## 5. 实施计划 (Implementation Plan)

### 第1天: 数据库 & API 基础
- [x] 创建 D1 数据库
- [x] 执行 SQL schema
- [x] 实现 GET /api/requests 端点
- [x] 测试数据库查询

### 第2天: 认证系统
- [x] 实现 POST /api/auth/login（发送 Magic Link）
- [x] 实现 POST /api/auth/verify（验证 token）
- [x] JWT 签名和验证
- [x] 配置 Cloudflare Email Workers

### 第3天: 需求提交 & 投票
- [x] 实现 POST /api/requests（创建需求）
- [x] 实现 POST /api/requests/:id/vote（投票）
- [x] API 错误处理和验证

### 第4天: 前端组件
- [x] RequestList 组件
- [x] RequestCard 组件
- [x] RequestForm 组件
- [x] LoginModal 组件
- [x] useAuth hook
- [x] useRequests hook
- [x] useVote hook

### 第5天: UI/UX & 测试
- [x] 响应式样式调整
- [x] 状态标签样式
- [x] 投票动画效果
- [x] 端到端测试
- [x] 部署到生产环境

## 6. 验收标准 (Acceptance Criteria)

### 6.1 功能验收
- [ ] 未登录用户可以查看所有需求
- [ ] 用户可以通过邮箱接收 Magic Link 并成功登录
- [ ] 登录用户可以提交新需求
- [ ] 登录用户可以为需求投票，再次点击取消投票
- [ ] 需求列表按投票数从高到低排序
- [ ] 每个用户对同一需求只能投一票
- [ ] 投票数实时更新

### 6.2 性能验收
- [ ] GET /api/requests 响应时间 < 200ms
- [ ] 投票操作响应时间 < 100ms
- [ ] 页面首次加载时间 < 2s
- [ ] Magic Link 邮件发送时间 < 5s

### 6.3 安全验收
- [ ] JWT token 过期后无法使用
- [ ] Magic Link 15分钟后失效
- [ ] Magic Link 使用一次后失效
- [ ] SQL 注入防护
- [ ] XSS 防护（输入过滤）

### 6.4 UI/UX 验收
- [ ] 移动端布局正常
- [ ] 投票按钮有视觉反馈
- [ ] 表单验证错误提示清晰
- [ ] 加载状态显示
- [ ] 空状态提示

## 7. 风险与对策 (Risks & Mitigation)

### 7.1 邮件送达率低
**风险:** Magic Link 邮件进入垃圾箱或发送失败
**对策:**
- 使用 MailChannels 并配置 SPF/DKIM
- 添加重新发送按钮（60秒冷却）
- 提示用户检查垃圾箱

### 7.2 恶意投票
**风险:** 用户创建多个邮箱账号刷票
**对策:**
- 限制每个邮箱每天提交需求数量（3个）
- 限制每个邮箱每天投票数量（20个）
- 添加 IP 限流（Cloudflare Rate Limiting）

### 7.3 垃圾需求
**风险:** 用户提交无意义或广告内容
**对策:**
- 标题最少 5 个字符
- 描述最少 10 个字符
- 后期可添加内容审核（AI 或人工）

### 7.4 数据库性能
**风险:** 需求数量增长后查询变慢
**对策:**
- 已创建必要索引
- 使用分页加载
- Cloudflare Workers 缓存 1 分钟

## 8. 成本估算 (Cost Estimation)

### 8.1 Cloudflare 服务
- D1 数据库: 免费额度内（100k 读取/天，50k 写入/天）
- Email Workers: MailChannels 免费额度（3000 封/月）
- Workers: 免费额度内（100k 请求/天）

### 8.2 总成本
**预估:** ￥0/月（免费额度内）

**扩展后:**
- 如果超过免费额度，D1: $5/月
- 邮件服务: $10/月（1万封）
- **总计:** ￥100-150/月

## 9. 下一步行动 (Next Actions)

1. 创建 Cloudflare D1 数据库
2. 执行数据库 schema
3. 配置环境变量（JWT_SECRET, EMAIL_FROM）
4. 实现后端 API
5. 开发前端组件
6. 端到端测试
7. 部署上线
8. 收集用户反馈

---

**文档版本:** v1.0
**创建时间:** 2025-01-09
**最后更新:** 2025-01-09
**负责人:** @liangkaifeng
