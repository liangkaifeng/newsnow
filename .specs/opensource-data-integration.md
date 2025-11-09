# Spec: 开源数据接入（AKShare）

## 📋 需求背景

**问题**：
- 商业数据API成本高（￥500-2000/月）
- 调用次数限制，不稳定
- 数据源单一

**目标**：
- 使用 AKShare 开源库替代商业API
- 降低成本至 ￥0-50/月
- 获取更全面的市场数据

**优先级**: P0 - 核心功能
**预计工时**: 3-5天
**负责人**: liangkaifeng

---

## 🎯 功能范围

### In Scope（本期实现）
1. ✅ 搭建 Python FastAPI 服务
2. ✅ 接入 AKShare 数据源
3. ✅ 实现核心API端点（5个）
4. ✅ Cloudflare Workers 缓存层
5. ✅ 前端数据展示页面

### Out of Scope（后期实现）
- ❌ 历史数据查询（只做实时/近期）
- ❌ 个性化推荐
- ❌ 数据导出功能

---

## 🏗️ 技术方案

### 架构图
```
┌────────────────────────────────────┐
│  CapitalFlow Frontend              │
│  (React + TanStack Query)          │
└────────────────────────────────────┘
              ↓ HTTPS
┌────────────────────────────────────┐
│  Cloudflare Workers                │
│  - API Gateway                     │
│  - KV Cache (5-60min TTL)          │
│  - Rate Limiting                   │
└────────────────────────────────────┘
              ↓ HTTPS
┌────────────────────────────────────┐
│  FastAPI Service (Vercel)          │
│  - AKShare Integration             │
│  - Data Processing                 │
│  - Error Handling                  │
└────────────────────────────────────┘
              ↓
┌────────────────────────────────────┐
│  AKShare                           │
│  - 免费开源数据源                   │
│  - 无调用限制                       │
└────────────────────────────────────┘
```

### 技术栈
- **Python 服务**: FastAPI + AKShare + pandas
- **部署**: Vercel Serverless Functions
- **缓存**: Cloudflare KV Storage
- **前端**: React + TanStack Query

---

## 📝 详细设计

### 1. API 端点设计

#### 1.1 个股资金流向
```http
GET /api/capital-flow/individual?indicator=今日&limit=100

Response:
{
  "success": true,
  "data": [
    {
      "code": "600519",
      "name": "贵州茅台",
      "price": 1850.00,
      "change": 2.34,
      "mainInflow": 23456789,      // 主力净流入（元）
      "mainInflowRatio": 12.34,    // 占比(%)
      "retailInflow": -12345678,   // 散户净流入
      "largeOrderInflow": 15678900 // 大单净流入
    }
  ],
  "timestamp": 1704844800000,
  "cached": true
}
```

#### 1.2 北向资金
```http
GET /api/capital-flow/northbound

Response:
{
  "success": true,
  "data": {
    "hgt": {  // 沪股通
      "today": {
        "netInflow": 32.5,    // 净流入（亿元）
        "balance": 487.5      // 余额
      },
      "history": [
        { "date": "2025-01-09", "netInflow": 32.5 }
      ]
    },
    "sgt": { ... }  // 深股通
  }
}
```

#### 1.3 热门股票
```http
GET /api/hot-stocks?limit=50

Response:
{
  "success": true,
  "data": [
    {
      "rank": 1,
      "code": "600519",
      "name": "贵州茅台",
      "price": 1850.00,
      "change": 2.34,
      "popularity": 98.5,  // 人气指数
      "mentions": 12345    // 提及次数
    }
  ]
}
```

#### 1.4 龙虎榜
```http
GET /api/dragon-tiger?date=20250109

Response:
{
  "success": true,
  "data": [
    {
      "code": "600519",
      "name": "贵州茅台",
      "date": "2025-01-09",
      "reason": "日涨幅偏离值达7%",
      "buyAmount": 12345678,   // 买入总额
      "sellAmount": 9876543,   // 卖出总额
      "netAmount": 2469135,    // 净额
      "seats": [               // 营业部席位
        {
          "name": "机构专用",
          "buyAmount": 5000000,
          "sellAmount": 0
        }
      ]
    }
  ]
}
```

#### 1.5 个股详情
```http
GET /api/stock/600519

Response:
{
  "success": true,
  "data": {
    "basic": {
      "code": "600519",
      "name": "贵州茅台",
      "price": 1850.00,
      "change": 2.34,
      "volume": 1234567,
      "turnover": 22876543210,
      "marketCap": 232345678900
    },
    "capitalFlow": {
      "today": { ... },
      "week": { ... }
    },
    "technicals": {
      "ma5": 1820.00,
      "ma10": 1800.00,
      "ma20": 1780.00
    }
  }
}
```

### 2. FastAPI 实现

**项目结构**：
```
capitalflow-api/
├── main.py              # 入口
├── requirements.txt     # 依赖
├── vercel.json         # Vercel配置
├── api/
│   ├── __init__.py
│   ├── routes/
│   │   ├── capital_flow.py
│   │   ├── hot_stocks.py
│   │   ├── dragon_tiger.py
│   │   └── stock_info.py
│   ├── services/
│   │   ├── akshare_service.py
│   │   └── cache.py
│   └── models/
│       └── responses.py
└── .env.example
```

**main.py**:
```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from api.routes import capital_flow, hot_stocks, dragon_tiger, stock_info

app = FastAPI(
    title="CapitalFlow API",
    version="1.0.0",
    description="开源金融数据API"
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://flow.liangkaifeng.com", "http://localhost:5173"],
    allow_methods=["GET"],
    allow_headers=["*"],
)

# 路由
app.include_router(capital_flow.router, prefix="/api/capital-flow", tags=["资金流向"])
app.include_router(hot_stocks.router, prefix="/api", tags=["热门股票"])
app.include_router(dragon_tiger.router, prefix="/api", tags=["龙虎榜"])
app.include_router(stock_info.router, prefix="/api", tags=["个股信息"])

@app.get("/")
def health_check():
    return {"status": "ok", "message": "CapitalFlow API is running"}
```

**requirements.txt**:
```
fastapi==0.109.0
akshare==1.12.0
pandas==2.1.4
uvicorn==0.27.0
```

**vercel.json**:
```json
{
  "builds": [
    {
      "src": "main.py",
      "use": "@vercel/python"
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "main.py"
    }
  ]
}
```

### 3. Cloudflare Workers 缓存层

```typescript
// workers/api-gateway.ts
export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url)

    // CORS
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, OPTIONS',
          'Access-Control-Allow-Headers': '*',
        }
      })
    }

    // 缓存键
    const cacheKey = `${url.pathname}${url.search}`

    // 检查 KV 缓存
    const cached = await env.CACHE.get(cacheKey)
    if (cached) {
      return new Response(cached, {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'X-Cache': 'HIT'
        }
      })
    }

    // 调用后端 API
    const apiUrl = `https://capitalflow-api.vercel.app${url.pathname}${url.search}`
    const response = await fetch(apiUrl)
    const data = await response.text()

    // 缓存策略
    const ttl = getCacheTTL(url.pathname)
    if (ttl > 0) {
      await env.CACHE.put(cacheKey, data, { expirationTtl: ttl })
    }

    return new Response(data, {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'X-Cache': 'MISS'
      }
    })
  }
}

function getCacheTTL(path: string): number {
  if (path.includes('/hot-stocks')) return 60 * 5      // 5分钟
  if (path.includes('/capital-flow')) return 60 * 10   // 10分钟
  if (path.includes('/dragon-tiger')) return 60 * 60   // 1小时
  if (path.includes('/stock/')) return 60 * 2          // 2分钟
  return 60 * 10 // 默认10分钟
}
```

### 4. 前端集成

**新建数据看板页面**：
```typescript
// src/routes/data.tsx
import { createFileRoute } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'

export const Route = createFileRoute('/data')({
  component: DataDashboard,
})

function DataDashboard() {
  const { data: capitalFlow } = useQuery({
    queryKey: ['capital-flow'],
    queryFn: () => fetch('/api/capital-flow/individual?limit=20')
      .then(res => res.json()),
    refetchInterval: 60000, // 1分钟刷新
  })

  const { data: northbound } = useQuery({
    queryKey: ['northbound'],
    queryFn: () => fetch('/api/capital-flow/northbound')
      .then(res => res.json()),
    refetchInterval: 60000,
  })

  const { data: hotStocks } = useQuery({
    queryKey: ['hot-stocks'],
    queryFn: () => fetch('/api/hot-stocks?limit=20')
      .then(res => res.json()),
    refetchInterval: 60000,
  })

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">市场数据</h1>

      {/* 北向资金 */}
      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">北向资金流向</h2>
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 bg-blue-50 dark:bg-blue-900 rounded-lg">
            <div className="text-sm text-gray-600">沪股通</div>
            <div className="text-2xl font-bold">
              {northbound?.data?.hgt?.today?.netInflow?.toFixed(2)} 亿
            </div>
            <div className="text-xs text-gray-500">净流入</div>
          </div>
          <div className="p-4 bg-blue-50 dark:bg-blue-900 rounded-lg">
            <div className="text-sm text-gray-600">深股通</div>
            <div className="text-2xl font-bold">
              {northbound?.data?.sgt?.today?.netInflow?.toFixed(2)} 亿
            </div>
            <div className="text-xs text-gray-500">净流入</div>
          </div>
        </div>
      </section>

      {/* 主力资金流向 TOP20 */}
      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">主力资金流向 TOP20</h2>
        <table className="w-full">
          <thead>
            <tr className="border-b">
              <th className="text-left p-2">股票</th>
              <th className="text-right p-2">最新价</th>
              <th className="text-right p-2">涨跌幅</th>
              <th className="text-right p-2">主力净流入</th>
              <th className="text-right p-2">净占比</th>
            </tr>
          </thead>
          <tbody>
            {capitalFlow?.data?.map((stock: any) => (
              <tr key={stock.code} className="border-b hover:bg-gray-50">
                <td className="p-2">
                  <div>{stock.name}</div>
                  <div className="text-xs text-gray-500">{stock.code}</div>
                </td>
                <td className="text-right p-2">{stock.price}</td>
                <td className={`text-right p-2 ${stock.change > 0 ? 'text-red-500' : 'text-green-500'}`}>
                  {stock.change > 0 ? '+' : ''}{stock.change}%
                </td>
                <td className="text-right p-2">
                  {(stock.mainInflow / 100000000).toFixed(2)} 亿
                </td>
                <td className="text-right p-2">{stock.mainInflowRatio}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {/* 热门股票 */}
      <section>
        <h2 className="text-2xl font-semibold mb-4">热门股票</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {hotStocks?.data?.slice(0, 8).map((stock: any) => (
            <div key={stock.code} className="p-4 border rounded-lg">
              <div className="font-semibold">{stock.name}</div>
              <div className="text-xs text-gray-500">{stock.code}</div>
              <div className="text-lg mt-2">{stock.price}</div>
              <div className={stock.change > 0 ? 'text-red-500' : 'text-green-500'}>
                {stock.change > 0 ? '+' : ''}{stock.change}%
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
```

---

## ✅ 验收标准

### 功能测试
- [ ] API 能正常返回数据（200 OK）
- [ ] 数据格式符合设计
- [ ] 缓存命中率 > 80%
- [ ] 响应时间 < 500ms（缓存命中时 < 100ms）

### 数据准确性
- [ ] 资金流向数据与东财对比误差 < 5%
- [ ] 实时行情延迟 < 5分钟
- [ ] 北向资金数据准确

### 性能指标
- [ ] API QPS > 100
- [ ] 99th 响应时间 < 1s
- [ ] 可用性 > 99.9%

### 成本控制
- [ ] 月度成本 < ￥50
- [ ] 无额外付费API调用

---

## 📅 实施计划

### Day 1: 搭建基础服务
- [ ] 创建 FastAPI 项目
- [ ] 配置 Vercel 部署
- [ ] 实现健康检查接口
- [ ] 测试 AKShare 数据获取

### Day 2: 实现核心API
- [ ] 个股资金流向 API
- [ ] 北向资金 API
- [ ] 热门股票 API
- [ ] 单元测试

### Day 3: 缓存层 + 龙虎榜
- [ ] Cloudflare Workers 缓存
- [ ] 龙虎榜 API
- [ ] 个股详情 API
- [ ] 集成测试

### Day 4: 前端集成
- [ ] 创建数据看板页面
- [ ] TanStack Query 集成
- [ ] UI组件开发
- [ ] 响应式适配

### Day 5: 测试 + 优化
- [ ] 性能测试
- [ ] 错误处理优化
- [ ] 文档完善
- [ ] 上线部署

---

## 🚧 风险与应对

| 风险 | 影响 | 概率 | 应对方案 |
|------|------|------|---------|
| AKShare 接口变更 | 高 | 中 | 定期检查，保留备用数据源 |
| Vercel 流量超限 | 中 | 低 | 监控流量，必要时迁移Railway |
| 数据延迟 | 中 | 中 | 增加缓存，降低刷新频率 |
| API 调用失败 | 高 | 低 | 重试机制 + 降级展示 |

---

## 📚 参考资料

- [AKShare 官方文档](https://akshare.akfamily.xyz/)
- [FastAPI 文档](https://fastapi.tiangolo.com/)
- [Vercel Python 部署](https://vercel.com/docs/functions/serverless-functions/runtimes/python)
- [Cloudflare Workers KV](https://developers.cloudflare.com/kv/)

---

**创建时间**: 2025-01-09
**最后更新**: 2025-01-09
**状态**: 📋 待实施
**关联文档**: `.specs/opensource-data-and-ai-friendly.md`
