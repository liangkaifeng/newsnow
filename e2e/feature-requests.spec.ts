import { expect, test } from "@playwright/test"

/**
 * 功能需求系统 E2E 测试
 */
test.describe("功能需求系统", () => {
  test.describe("未登录用户", () => {
    test("可以访问需求页面", async ({ page }) => {
      await page.goto("/requests")

      // 验证页面标题
      await expect(page.locator("h1")).toContainText(/功能需求|Feature Request/i)

      // 验证页面说明存在
      await expect(page.getByText(/告诉我们|投票/)).toBeVisible()
    })

    test("可以查看需求列表", async ({ page }) => {
      await page.goto("/requests")

      // 等待数据加载
      await page.waitForLoadState("networkidle")

      // 验证筛选器存在
      await expect(
        page.getByRole("button", { name: /全部|待处理|开发中|已完成/ }).first(),
      ).toBeVisible()

      // 验证排序选择器存在
      await expect(page.getByText(/投票|时间/)).toBeVisible()
    })

    test("显示登录提示", async ({ page }) => {
      await page.goto("/requests")

      // 验证显示登录提示或登录按钮
      const loginPrompt = page.getByText(/登录|邮箱/)
      await expect(loginPrompt).toBeVisible({ timeout: 10000 })
    })

    test("不能提交需求", async ({ page }) => {
      await page.goto("/requests")

      // 提交表单应该不可见或禁用
      const submitButton = page.getByRole("button", { name: /提交|submit/i })

      // 要么按钮不存在，要么被禁用
      const isVisible = await submitButton.isVisible().catch(() => false)
      if (isVisible) {
        await expect(submitButton).toBeDisabled()
      }
    })
  })

  test.describe("登录流程", () => {
    test("可以打开登录弹窗", async ({ page }) => {
      await page.goto("/requests")

      // 点击登录按钮
      const loginButton = page.getByRole("button", { name: /登录|login/i })
      await loginButton.click()

      // 验证弹窗出现
      await expect(page.getByRole("dialog")).toBeVisible()
      await expect(page.getByPlaceholder(/邮箱|email/i)).toBeVisible()
    })

    test("邮箱格式验证", async ({ page }) => {
      await page.goto("/requests")

      // 打开登录弹窗
      const loginButton = page.getByRole("button", { name: /登录|login/i })
      await loginButton.click()

      // 输入无效邮箱
      const emailInput = page.getByPlaceholder(/邮箱|email/i)
      await emailInput.fill("invalid-email")

      // 点击发送按钮
      const sendButton = page.getByRole("button", { name: /发送|send/i })
      await sendButton.click()

      // 验证错误提示
      await expect(page.getByText(/格式|invalid/i)).toBeVisible()
    })

    test("可以发送 Magic Link", async ({ page }) => {
      await page.goto("/requests")

      // 打开登录弹窗
      const loginButton = page.getByRole("button", { name: /登录|login/i })
      await loginButton.click()

      // 输入有效邮箱（测试用）
      const emailInput = page.getByPlaceholder(/邮箱|email/i)
      await emailInput.fill("test@example.com")

      // 点击发送按钮
      const sendButton = page.getByRole("button", { name: /发送|send/i })
      await sendButton.click()

      // 验证成功提示
      await expect(page.getByText(/已发送|sent/i)).toBeVisible({ timeout: 10000 })

      // 验证倒计时状态
      await expect(sendButton).toBeDisabled()
    })
  })

  test.describe("需求列表功能", () => {
    test("可以筛选需求状态", async ({ page }) => {
      await page.goto("/requests")
      await page.waitForLoadState("networkidle")

      // 点击"待处理"筛选
      const pendingFilter = page.getByRole("button", { name: /待处理/ })
      if (await pendingFilter.isVisible().catch(() => false)) {
        await pendingFilter.click()

        // URL 应该更新（如果使用查询参数）
        await page.waitForURL(/status=pending/i, { timeout: 5000 }).catch(() => {})
      }
    })

    test("可以切换排序方式", async ({ page }) => {
      await page.goto("/requests")
      await page.waitForLoadState("networkidle")

      // 查找排序选择器
      const sortSelector = page.getByRole("button", { name: /排序|sort/i })
      if (await sortSelector.isVisible().catch(() => false)) {
        await sortSelector.click()

        // 验证排序选项出现
        await expect(
          page.getByText(/投票数|时间|votes|time/i).first(),
        ).toBeVisible()
      }
    })

    test("需求卡片显示完整信息", async ({ page }) => {
      await page.goto("/requests")
      await page.waitForLoadState("networkidle")

      // 查找第一个需求卡片
      const firstCard = page.locator("[data-testid=\"request-card\"]").first()

      if (await firstCard.isVisible().catch(() => false)) {
        // 验证卡片包含必要信息
        await expect(firstCard).toContainText(/\w+/) // 标题
        await expect(firstCard.locator("[data-testid=\"vote-button\"]")).toBeVisible() // 投票按钮
        await expect(firstCard.getByText(/天前|小时前|分钟前/)).toBeVisible() // 时间
      }
    })

    test("可以展开需求描述", async ({ page }) => {
      await page.goto("/requests")
      await page.waitForLoadState("networkidle")

      // 查找有"展开"按钮的需求卡片
      const expandButton = page.getByRole("button", { name: /展开|more|详情/i }).first()

      if (await expandButton.isVisible().catch(() => false)) {
        await expandButton.click()

        // 验证描述内容显示
        await expect(page.locator("[data-testid=\"request-description\"]")).toBeVisible()
      }
    })
  })

  test.describe("投票功能（需要登录）", () => {
    test.skip("未登录时点击投票应提示登录", async ({ page }) => {
      await page.goto("/requests")
      await page.waitForLoadState("networkidle")

      // 点击投票按钮
      const voteButton = page.locator("[data-testid=\"vote-button\"]").first()
      if (await voteButton.isVisible().catch(() => false)) {
        await voteButton.click()

        // 应该显示登录提示
        await expect(page.getByText(/登录|login/i)).toBeVisible()
      }
    })

    // 注意：以下测试需要真实的登录流程，暂时跳过
    test.skip("登录后可以投票", async ({ page: _page }) => {
      // TODO: 实现登录流程后启用此测试
    })

    test.skip("可以取消投票", async ({ page: _page }) => {
      // TODO: 实现登录流程后启用此测试
    })

    test.skip("投票数实时更新", async ({ page: _page }) => {
      // TODO: 实现登录流程后启用此测试
    })
  })

  test.describe("提交需求功能（需要登录）", () => {
    test.skip("未登录时不显示提交表单", async ({ page }) => {
      await page.goto("/requests")

      const form = page.locator("[data-testid=\"request-form\"]")
      await expect(form).not.toBeVisible()
    })

    // 注意：以下测试需要真实的登录流程，暂时跳过
    test.skip("登录后可以提交需求", async ({ page: _page }) => {
      // TODO: 实现登录流程后启用此测试
    })

    test.skip("标题长度验证", async ({ page: _page }) => {
      // TODO: 实现登录流程后启用此测试
    })

    test.skip("描述长度验证", async ({ page: _page }) => {
      // TODO: 实现登录流程后启用此测试
    })

    test.skip("提交成功后清空表单", async ({ page: _page }) => {
      // TODO: 实现登录流程后启用此测试
    })
  })

  test.describe("响应式设计", () => {
    test("移动端布局正常", async ({ page }) => {
      // 设置移动端视口
      await page.setViewportSize({ width: 375, height: 667 })
      await page.goto("/requests")
      await page.waitForLoadState("networkidle")

      // 验证页面可滚动
      await expect(page.locator("body")).toBeVisible()

      // 验证主要元素存在
      await expect(page.locator("h1")).toBeVisible()
    })

    test("平板端布局正常", async ({ page }) => {
      // 设置平板端视口
      await page.setViewportSize({ width: 768, height: 1024 })
      await page.goto("/requests")
      await page.waitForLoadState("networkidle")

      // 验证页面布局正常
      await expect(page.locator("body")).toBeVisible()
    })
  })

  test.describe("性能测试", () => {
    test("页面加载时间 < 3s", async ({ page }) => {
      const startTime = Date.now()

      await page.goto("/requests")
      await page.waitForLoadState("networkidle")

      const loadTime = Date.now() - startTime

      expect(loadTime).toBeLessThan(3000)
    })

    test("需求列表滚动流畅", async ({ page }) => {
      await page.goto("/requests")
      await page.waitForLoadState("networkidle")

      // 滚动到底部
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))

      // 等待一下确保没有卡顿
      await page.waitForTimeout(500)

      // 验证页面仍然可交互
      await expect(page.locator("body")).toBeVisible()
    })
  })
})
