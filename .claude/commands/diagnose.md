---
description: 快速诊断项目问题（错误、性能、配置）
---

执行全面的项目健康检查，快速定位问题：

## 诊断范围

### 1. 构建和依赖 📦
- [ ] 检查 `package.json` 依赖版本冲突
- [ ] 检查 `pnpm-lock.yaml` 是否同步
- [ ] 运行 `pnpm install` 确认依赖完整
- [ ] 运行 `pnpm build` 检查构建是否成功
- [ ] 检查 TypeScript 错误 `pnpm typecheck`

### 2. 代码质量 🔍
- [ ] 运行 ESLint `pnpm lint`
- [ ] 检查 TypeScript 类型错误
- [ ] 查找未使用的导入和变量
- [ ] 检查循环依赖

### 3. 测试状态 ✅
- [ ] E2E 测试通过率 `pnpm test:e2e`
- [ ] 失败的测试用例分析
- [ ] 测试覆盖率检查
- [ ] 查看测试报告

### 4. 运行时错误 🐛
- [ ] 检查浏览器控制台错误
- [ ] 检查网络请求失败
- [ ] 检查 Cloudflare Workers 日志
- [ ] 检查 Vercel Functions 日志

### 5. 性能问题 ⚡
- [ ] Lighthouse 评分 < 90
- [ ] 页面加载时间 > 3s
- [ ] API 响应时间 > 500ms
- [ ] 内存泄漏检查

### 6. 配置问题 ⚙️
- [ ] 环境变量缺失（.env 文件）
- [ ] Cloudflare 配置（wrangler.toml）
- [ ] Vercel 配置（vercel.json）
- [ ] Git 配置（.gitignore）

### 7. 安全问题 🔒
- [ ] 依赖漏洞检查 `pnpm audit`
- [ ] 敏感信息泄露（密钥、Token）
- [ ] CORS 配置错误
- [ ] XSS/SQL 注入漏洞

## 执行步骤

1. **自动检查**
   ```bash
   # 依赖和构建
   pnpm install
   pnpm build
   pnpm typecheck
   pnpm lint

   # 测试
   pnpm test:e2e

   # 安全
   pnpm audit
   ```

2. **手动检查**
   - 阅读最近的 Git 提交
   - 查看用户反馈和需求投票
   - 检查部署日志
   - 检查监控数据

3. **问题分类**
   - 🔴 **紧急**：生产环境崩溃、数据丢失、安全漏洞
   - 🟡 **重要**：功能异常、性能严重下降
   - 🟢 **一般**：UI 小问题、优化建议

4. **生成诊断报告**

## 常见问题和解决方案

### 问题 1: 构建失败
**症状**: `pnpm build` 报错
**诊断**:
```bash
# 检查 TypeScript 错误
pnpm typecheck

# 检查 ESLint 错误
pnpm lint

# 清理缓存重试
rm -rf node_modules .cache dist
pnpm install
pnpm build
```

**常见原因**:
- TypeScript 类型错误
- ESLint 规则冲突
- 依赖版本不兼容
- 缓存损坏

---

### 问题 2: E2E 测试失败
**症状**: `pnpm test:e2e` 部分测试失败
**诊断**:
```bash
# 查看详细错误
pnpm test:e2e --reporter=list

# 运行单个测试文件
pnpm test:e2e e2e/feature-requests.spec.ts

# UI 模式调试
pnpm test:e2e:ui
```

**常见原因**:
- 页面结构变化（选择器失效）
- API 响应变化
- 网络超时
- 浏览器兼容性

---

### 问题 3: 页面加载缓慢
**症状**: 首屏加载时间 > 3s
**诊断**:
```bash
# 运行 Lighthouse
pnpm lighthouse

# 检查网络请求
# Chrome DevTools → Network → 查看瀑布图
```

**常见原因**:
- 图片未优化（太大、格式不对）
- 未使用缓存
- 代码未压缩
- 同步加载阻塞渲染

**解决方案**:
- 图片转换为 WebP
- 添加 CDN 缓存
- 代码分割（dynamic import）
- 使用 async/defer 加载脚本

---

### 问题 4: API 响应慢
**症状**: API 响应时间 > 500ms
**诊断**:
```bash
# 查看 Cloudflare Workers 日志
wrangler tail

# 本地测试 API
curl -w "@curl-format.txt" https://flow.liangkaifeng.com/api/requests
```

**常见原因**:
- 数据库查询慢（缺少索引）
- 未使用缓存
- 外部 API 调用慢
- 冷启动延迟

**解决方案**:
- 添加数据库索引
- 使用 Cloudflare KV 缓存
- 批量请求外部 API
- 预热 Workers（定时请求）

---

### 问题 5: 部署失败
**症状**: Cloudflare Pages 部署失败
**诊断**:
```bash
# 本地构建测试
pnpm build

# 查看部署日志
# Cloudflare Dashboard → Pages → 查看构建日志
```

**常见原因**:
- 构建命令错误
- 环境变量缺失
- 依赖安装失败
- 输出目录错误

**解决方案**:
- 检查 `package.json` 中的 build script
- 在 Cloudflare Dashboard 配置环境变量
- 使用 `pnpm install --frozen-lockfile`
- 确认输出目录为 `dist/output/public`

---

### 问题 6: 依赖漏洞
**症状**: `pnpm audit` 发现漏洞
**诊断**:
```bash
# 查看漏洞详情
pnpm audit

# 自动修复
pnpm audit --fix
```

**常见原因**:
- 依赖包有已知漏洞
- 间接依赖有漏洞

**解决方案**:
- 升级依赖到安全版本
- 使用 `resolutions` 强制使用安全版本
- 如无法升级，评估风险并记录

---

### 问题 7: 成本超支
**症状**: 每月费用 > ￥200
**诊断**:
```bash
# 查看 Cloudflare 使用量
# Cloudflare Dashboard → Analytics

# 查看 Vercel 使用量
# Vercel Dashboard → Usage

# 查看 Anthropic 使用量
# Anthropic Console → Usage
```

**常见原因**:
- AI 调用过多
- Workers 请求量超标
- 带宽使用过多
- 恶意请求

**解决方案**:
- 添加限流（每用户每天 5 次 AI）
- 优化缓存（延长 TTL）
- 图片压缩（WebP + 质量 80%）
- 添加 WAF 规则（防止恶意请求）

## 输出格式

```markdown
# 诊断报告

## 系统状态
- ✅ 构建: 正常
- ✅ 依赖: 正常
- ✅ 类型检查: 正常
- ✅ ESLint: 正常
- ⚠️  E2E 测试: 2 个失败
- ❌ 性能: Lighthouse 85 分（目标 90+）

## 发现的问题

### 🔴 紧急问题（需立即修复）
无

### 🟡 重要问题（需尽快修复）
1. **E2E 测试失败**: `e2e/feature-requests.spec.ts`
   - 失败测试: "可以打开登录弹窗"
   - 原因: 页面结构变化，选择器失效
   - 建议: 更新测试选择器为 `data-testid="login-button"`

2. **性能问题**: 首屏加载时间 3.2s（目标 < 2s）
   - 原因: 图片未压缩（PNG 格式）
   - 建议: 转换为 WebP 格式，减少 60% 大小

### 🟢 一般问题（可稍后处理）
1. **代码风格**: 部分函数缺少注释
   - 位置: `app/lib/utils.ts`
   - 建议: 添加 JSDoc 注释

## 优先修复顺序
1. 更新 E2E 测试选择器（10 分钟）
2. 图片转换为 WebP（30 分钟）
3. 添加代码注释（1 小时）

## 预防措施
- 添加 `data-testid` 到所有交互元素（防止测试失效）
- 配置图片自动压缩（构建时）
- 添加 pre-commit hook（强制注释）
```

---

**使用提示**：
- 定期运行诊断（每周一次）
- 部署前必须运行诊断
- 发现问题后优先修复高优先级问题
- 记录常见问题和解决方案
