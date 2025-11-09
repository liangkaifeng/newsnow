# E2E 测试文档

## 概述

CapitalFlow 使用 [Playwright](https://playwright.dev/) 进行端到端（E2E）测试，确保核心功能在真实浏览器环境中正常工作。

## 快速开始

### 安装依赖

```bash
pnpm install
pnpm exec playwright install --with-deps
```

### 运行测试

```bash
# 运行所有 E2E 测试（headless 模式）
pnpm test:e2e

# 使用 UI 模式运行（推荐开发时使用）
pnpm test:e2e:ui

# 有头模式运行（查看浏览器界面）
pnpm test:e2e:headed

# 调试模式（逐步执行）
pnpm test:e2e:debug

# 查看测试报告
pnpm test:e2e:report
```

## 测试文件结构

```
e2e/
├── example.spec.ts              # 基础功能测试示例
├── feature-requests.spec.ts     # 功能需求系统测试
└── README.md                    # 本文档
```

## 测试覆盖范围

### 已实现的测试

#### 1. 基础功能测试 (`example.spec.ts`)
- ✅ 首页加载正常
- ✅ 布局切换功能
- ✅ 新闻列表加载

#### 2. 功能需求系统测试 (`feature-requests.spec.ts`)

**未登录用户:**
- ✅ 访问需求页面
- ✅ 查看需求列表
- ✅ 显示登录提示
- ✅ 不能提交需求

**登录流程:**
- ✅ 打开登录弹窗
- ✅ 邮箱格式验证
- ✅ 发送 Magic Link

**需求列表功能:**
- ✅ 筛选需求状态
- ✅ 切换排序方式
- ✅ 需求卡片显示完整信息
- ✅ 展开需求描述

**响应式设计:**
- ✅ 移动端布局
- ✅ 平板端布局

**性能测试:**
- ✅ 页面加载时间 < 3s
- ✅ 列表滚动流畅

### 待实现的测试

以下测试需要真实的认证系统实现后才能启用（目前标记为 `test.skip`）:

- ⏸️ 登录后投票功能
- ⏸️ 取消投票功能
- ⏸️ 登录后提交需求
- ⏸️ 表单验证（标题/描述长度）
- ⏸️ 提交成功后清空表单

## 编写新测试

### 测试文件命名规范

- 文件名: `*.spec.ts`
- 位置: `/e2e/` 目录下
- 示例: `e2e/auth.spec.ts`

### 测试模板

```typescript
import { test, expect } from '@playwright/test'

test.describe('功能模块名称', () => {
  test('测试场景描述', async ({ page }) => {
    // 1. 访问页面
    await page.goto('/your-page')

    // 2. 等待加载完成
    await page.waitForLoadState('networkidle')

    // 3. 执行操作
    await page.getByRole('button', { name: '按钮文本' }).click()

    // 4. 验证结果
    await expect(page.getByText('预期文本')).toBeVisible()
  })
})
```

### 最佳实践

#### 1. 使用语义化选择器

**推荐 ✅:**
```typescript
// 使用角色和名称
await page.getByRole('button', { name: '提交' })
await page.getByRole('heading', { name: '功能需求' })

// 使用测试 ID
await page.locator('[data-testid="request-card"]')

// 使用标签
await page.getByLabel('邮箱')
```

**不推荐 ❌:**
```typescript
// 避免使用脆弱的 CSS 选择器
await page.locator('.btn-submit')
await page.locator('div > div > button:nth-child(2)')
```

#### 2. 等待策略

```typescript
// 等待网络空闲
await page.waitForLoadState('networkidle')

// 等待元素出现
await expect(page.getByText('加载完成')).toBeVisible()

// 设置超时
await page.getByRole('button').click({ timeout: 5000 })
```

#### 3. 错误处理

```typescript
// 使用条件判断
const button = page.getByRole('button', { name: '可选按钮' })
if (await button.isVisible().catch(() => false)) {
  await button.click()
}

// 使用 test.skip 跳过未实现功能
test.skip('需要登录才能测试的功能', async ({ page }) => {
  // TODO: 实现登录后启用此测试
})
```

#### 4. 多浏览器测试

测试会在以下浏览器运行（CI 环境）:
- Chromium (主要测试)
- Firefox (兼容性测试)
- WebKit (Safari 兼容性)
- Mobile Chrome (移动端测试)

本地开发时默认只运行 Chromium 以加快速度。

## CI/CD 集成

### GitHub Actions

E2E 测试会在以下情况自动运行:
- 推送到 `main` 分支
- 推送到 `claude/**` 分支
- 创建 Pull Request
- 手动触发 workflow

### 测试报告

- 成功: ✅ 测试通过，继续部署
- 失败: ❌ 测试失败，生成报告并上传到 GitHub Artifacts

失败时查看报告:
1. 进入 GitHub Actions 页面
2. 找到失败的 workflow run
3. 下载 `playwright-report` 或 `playwright-screenshots` artifact
4. 解压后用浏览器打开 `index.html`

## 调试技巧

### 1. 使用 UI 模式

```bash
pnpm test:e2e:ui
```

UI 模式提供:
- 可视化测试执行
- 逐步调试
- 时间旅行（回放）
- DOM 快照

### 2. 使用调试模式

```bash
pnpm test:e2e:debug
```

或在测试代码中添加 `await page.pause()`:

```typescript
test('调试示例', async ({ page }) => {
  await page.goto('/')
  await page.pause() // 在此处暂停，打开 Playwright Inspector
  await page.getByRole('button').click()
})
```

### 3. 查看浏览器界面

```bash
pnpm test:e2e:headed
```

### 4. 只运行特定测试

```bash
# 运行单个文件
pnpm test:e2e feature-requests.spec.ts

# 运行匹配的测试
pnpm test:e2e -g "登录"

# 运行特定项目（浏览器）
pnpm test:e2e --project=chromium
```

## 性能基准

| 测试场景 | 目标 | 当前状态 |
|---------|------|---------|
| 页面加载时间 | < 3s | ✅ 通过 |
| API 响应时间 | < 500ms | 待实现 |
| 首屏渲染 | < 2s | 待测试 |
| 交互响应 | < 100ms | 待测试 |

## 故障排查

### 常见问题

#### 1. 测试超时

**错误信息:**
```
Timeout 30000ms exceeded
```

**解决方法:**
- 检查网络连接
- 增加超时时间: `test.setTimeout(60000)`
- 检查是否有死锁或无限循环

#### 2. 元素未找到

**错误信息:**
```
Error: locator.click: Target closed
```

**解决方法:**
- 使用 `waitForLoadState('networkidle')`
- 添加显式等待: `await expect(element).toBeVisible()`
- 检查选择器是否正确

#### 3. 浏览器未安装

**错误信息:**
```
browserType.launch: Executable doesn't exist
```

**解决方法:**
```bash
pnpm exec playwright install --with-deps
```

## 参考资料

- [Playwright 官方文档](https://playwright.dev/)
- [Best Practices](https://playwright.dev/docs/best-practices)
- [API Reference](https://playwright.dev/docs/api/class-test)
- [选择器指南](https://playwright.dev/docs/selectors)

## 贡献指南

添加新测试时:
1. 确保测试是独立的（不依赖其他测试）
2. 使用有意义的测试描述
3. 添加必要的注释
4. 在本地通过所有测试后再提交
5. 更新本文档（如果添加了新的测试模块）

---

**最后更新:** 2025-01-09
**维护者:** @liangkaifeng
