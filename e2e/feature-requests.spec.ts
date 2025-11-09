import { expect, test } from "@playwright/test"

/**
 * 功能需求系统 E2E 测试
 */
test.describe("功能需求系统", () => {
  test.describe("未登录用户", () => {
    test("可以访问需求页面", async ({ page }) => {
      await page.goto("/feature-requests")

      // 验证页面标题
      await expect(page.getByRole("heading", { name: "功能需求" })).toBeVisible()

      // 验证页面说明存在
      await expect(
        page.getByText("为 CapitalFlow 提出新功能建议，或为现有建议投票"),
      ).toBeVisible()
    })

    test("可以查看需求列表", async ({ page }) => {
      // 先创建种子数据
      await fetch("http://localhost:5173/api/feature-requests/seed", {
        method: "POST",
      })

      await page.goto("/feature-requests")
      await page.waitForLoadState("networkidle")

      // 验证筛选器存在
      await expect(page.getByText("状态：")).toBeVisible()
      await expect(page.getByText("排序：")).toBeVisible()

      // 验证有需求数据显示
      await expect(page.getByText(/共 \d+ 个需求/)).toBeVisible()
    })

    test("显示登录按钮", async ({ page }) => {
      await page.goto("/feature-requests")

      // 验证显示登录按钮
      const loginButton = page.getByRole("button", { name: "登录" })
      await expect(loginButton).toBeVisible()
    })

    test("不能提交需求", async ({ page }) => {
      await page.goto("/feature-requests")

      // 应该看不到提交按钮，只看到登录提示
      await expect(page.getByText("需要登录才能创建需求或投票")).toBeVisible()
    })
  })

  test.describe("登录流程", () => {
    test("可以打开登录对话框", async ({ page }) => {
      await page.goto("/feature-requests")

      // 点击登录按钮
      const loginButton = page.getByRole("button", { name: "登录" })
      await loginButton.click()

      // 验证对话框出现
      await expect(page.getByRole("heading", { name: "登录" })).toBeVisible()
      await expect(page.getByPlaceholder("your@email.com")).toBeVisible()
    })

    test("可以关闭登录对话框", async ({ page }) => {
      await page.goto("/feature-requests")

      // 打开对话框
      await page.getByRole("button", { name: "登录" }).click()
      await expect(page.getByRole("heading", { name: "登录" })).toBeVisible()

      // 点击关闭按钮（X 图标）
      await page.locator("button[type=\"button\"]").filter({ hasText: "" }).first().click()

      // 对话框应该关闭
      await expect(page.getByRole("heading", { name: "登录" })).not.toBeVisible()
    })

    test("可以发送 Magic Link 邮件", async ({ page }) => {
      await page.goto("/feature-requests")

      // 打开登录对话框
      await page.getByRole("button", { name: "登录" }).click()

      // 输入邮箱
      const emailInput = page.getByPlaceholder("your@email.com")
      await emailInput.fill("test@example.com")

      // 点击发送按钮
      await page.getByRole("button", { name: "发送登录邮件" }).click()

      // 验证切换到验证步骤
      await expect(page.getByText(/验证邮件已发送到/)).toBeVisible({ timeout: 5000 })
      await expect(page.getByText("test@example.com")).toBeVisible()
      await expect(page.getByPlaceholder("粘贴邮件中的验证码")).toBeVisible()
    })

    test("开发模式下可以完成登录", async ({ page }) => {
      await page.goto("/feature-requests")

      // 打开登录对话框
      await page.getByRole("button", { name: "登录" }).click()

      // 输入邮箱
      await page.getByPlaceholder("your@email.com").fill("e2e-test@example.com")

      // 发送邮件
      await page.getByRole("button", { name: "发送登录邮件" }).click()

      // 等待验证码输入框出现
      await expect(page.getByPlaceholder("粘贴邮件中的验证码")).toBeVisible({ timeout: 5000 })

      // 开发模式下 token 会自动填入，直接点击验证
      await page.getByRole("button", { name: "验证登录" }).click()

      // 验证登录成功
      await expect(page.getByText(/登录成功/)).toBeVisible({ timeout: 5000 })

      // 验证对话框关闭
      await expect(page.getByRole("heading", { name: "登录" })).not.toBeVisible()

      // 验证显示用户邮箱
      await expect(page.getByText(/已登录：e2e-test@example.com/)).toBeVisible()
    })
  })

  test.describe("需求列表功能", () => {
    test("可以筛选需求状态", async ({ page }) => {
      // 创建种子数据
      await fetch("http://localhost:5173/api/feature-requests/seed", {
        method: "POST",
      })

      await page.goto("/feature-requests")
      await page.waitForLoadState("networkidle")

      // 点击状态筛选
      const statusSelect = page.locator("select").first()
      await statusSelect.selectOption("pending")

      // 等待数据更新
      await page.waitForTimeout(500)

      // 验证选择已更改
      await expect(statusSelect).toHaveValue("pending")
    })

    test("可以切换排序方式", async ({ page }) => {
      await page.goto("/feature-requests")
      await page.waitForLoadState("networkidle")

      // 切换到按时间排序
      const sortSelect = page.locator("select").nth(1)
      await sortSelect.selectOption("created")

      // 验证选择已更改
      await expect(sortSelect).toHaveValue("created")
    })

    test("需求卡片显示完整信息", async ({ page }) => {
      // 创建种子数据
      await fetch("http://localhost:5173/api/feature-requests/seed", {
        method: "POST",
      })

      await page.goto("/feature-requests")
      await page.waitForLoadState("networkidle")

      // 查找第一个需求卡片
      const firstCard = page.locator(".bg-white.border").first()

      // 验证卡片包含必要信息
      await expect(firstCard).toBeVisible()

      // 验证包含标题
      await expect(firstCard.locator("h3")).toBeVisible()

      // 验证包含描述
      await expect(firstCard.locator("p.text-gray-700")).toBeVisible()

      // 验证包含投票按钮
      await expect(firstCard.locator("button[title*=\"投票\"]").or(firstCard.locator("button[title*=\"取消投票\"]"))).toBeVisible()

      // 验证包含提交者信息
      await expect(firstCard.getByText(/提交者：/)).toBeVisible()

      // 验证包含状态标签
      await expect(firstCard.locator(".px-3.py-1.rounded-full")).toBeVisible()
    })
  })

  test.describe("投票功能（需要登录）", () => {
    test("未登录时点击投票应提示登录", async ({ page }) => {
      // 创建种子数据
      await fetch("http://localhost:5173/api/feature-requests/seed", {
        method: "POST",
      })

      await page.goto("/feature-requests")
      await page.waitForLoadState("networkidle")

      // 点击投票按钮
      const voteButton = page.locator("button[title*=\"投票\"]").first()
      await voteButton.click()

      // 应该显示登录对话框
      await expect(page.getByRole("heading", { name: "登录" })).toBeVisible({ timeout: 5000 })
    })

    test("登录后可以投票", async ({ page }) => {
      // 创建种子数据
      await fetch("http://localhost:5173/api/feature-requests/seed", {
        method: "POST",
      })

      // 先登录
      await page.goto("/feature-requests")
      await page.getByRole("button", { name: "登录" }).click()
      await page.getByPlaceholder("your@email.com").fill("voter@example.com")
      await page.getByRole("button", { name: "发送登录邮件" }).click()
      await page.waitForTimeout(1000)
      await page.getByRole("button", { name: "验证登录" }).click()
      await page.waitForTimeout(1000)

      // 找到第一个未投票的需求并点击投票
      const voteButton = page.locator("button[title=\"投票\"]").first()
      const initialVoteCount = await voteButton.locator("span.text-xs").textContent()

      await voteButton.click()
      await page.waitForTimeout(1000)

      // 验证投票数增加
      const newVoteCount = await voteButton.locator("span.text-xs").textContent()
      expect(Number.parseInt(newVoteCount || "0")).toBeGreaterThan(Number.parseInt(initialVoteCount || "0"))

      // 验证按钮状态变为已投票
      await expect(voteButton).toHaveAttribute("title", "取消投票")
    })

    test("可以取消投票", async ({ page }) => {
      // 创建种子数据并登录
      await fetch("http://localhost:5173/api/feature-requests/seed", {
        method: "POST",
      })

      await page.goto("/feature-requests")
      await page.getByRole("button", { name: "登录" }).click()
      await page.getByPlaceholder("your@email.com").fill("cancel-voter@example.com")
      await page.getByRole("button", { name: "发送登录邮件" }).click()
      await page.waitForTimeout(1000)
      await page.getByRole("button", { name: "验证登录" }).click()
      await page.waitForTimeout(1000)

      // 先投票
      const voteButton = page.locator("button[title=\"投票\"]").first()
      await voteButton.click()
      await page.waitForTimeout(1000)

      // 再取消投票
      const cancelButton = page.locator("button[title=\"取消投票\"]").first()
      const voteCountBeforeCancel = await cancelButton.locator("span.text-xs").textContent()

      await cancelButton.click()
      await page.waitForTimeout(1000)

      // 验证投票数减少
      const voteCountAfterCancel = await page.locator("button[title=\"投票\"]").first().locator("span.text-xs").textContent()
      expect(Number.parseInt(voteCountAfterCancel || "0")).toBeLessThan(Number.parseInt(voteCountBeforeCancel || "0"))
    })
  })

  test.describe("提交需求功能（需要登录）", () => {
    test("未登录时不显示提交表单", async ({ page }) => {
      await page.goto("/feature-requests")

      // 应该只看到登录提示，看不到提交表单按钮
      await expect(page.getByText("需要登录才能创建需求或投票")).toBeVisible()
      await expect(page.getByRole("button", { name: "+ 提交新的功能需求" })).not.toBeVisible()
    })

    test("登录后可以展开提交表单", async ({ page }) => {
      await page.goto("/feature-requests")

      // 先登录
      await page.getByRole("button", { name: "登录" }).click()
      await page.getByPlaceholder("your@email.com").fill("submitter@example.com")
      await page.getByRole("button", { name: "发送登录邮件" }).click()
      await page.waitForTimeout(1000)
      await page.getByRole("button", { name: "验证登录" }).click()
      await page.waitForTimeout(1000)

      // 点击展开表单
      await page.getByRole("button", { name: "+ 提交新的功能需求" }).click()

      // 验证表单显示
      await expect(page.getByRole("heading", { name: "提交新的功能需求" })).toBeVisible()
      await expect(page.getByLabel(/标题/)).toBeVisible()
      await expect(page.getByLabel(/详细描述/)).toBeVisible()
    })

    test("可以提交需求", async ({ page }) => {
      await page.goto("/feature-requests")

      // 先登录
      await page.getByRole("button", { name: "登录" }).click()
      await page.getByPlaceholder("your@email.com").fill("creator@example.com")
      await page.getByRole("button", { name: "发送登录邮件" }).click()
      await page.waitForTimeout(1000)
      await page.getByRole("button", { name: "验证登录" }).click()
      await page.waitForTimeout(1000)

      // 展开表单
      await page.getByRole("button", { name: "+ 提交新的功能需求" }).click()

      // 填写表单
      await page.getByLabel(/标题/).fill("E2E测试需求")
      await page.getByLabel(/详细描述/).fill("这是一个通过 E2E 测试创建的功能需求，用于验证创建功能正常工作。")

      // 提交
      await page.getByRole("button", { name: "提交需求" }).click()

      // 验证成功提示
      await expect(page.getByText(/需求创建成功/)).toBeVisible({ timeout: 5000 })

      // 验证表单已关闭
      await expect(page.getByRole("heading", { name: "提交新的功能需求" })).not.toBeVisible()

      // 验证新需求出现在列表中
      await expect(page.getByText("E2E测试需求")).toBeVisible()
    })

    test("标题长度验证", async ({ page }) => {
      await page.goto("/feature-requests")

      // 登录
      await page.getByRole("button", { name: "登录" }).click()
      await page.getByPlaceholder("your@email.com").fill("validator@example.com")
      await page.getByRole("button", { name: "发送登录邮件" }).click()
      await page.waitForTimeout(1000)
      await page.getByRole("button", { name: "验证登录" }).click()
      await page.waitForTimeout(1000)

      // 展开表单
      await page.getByRole("button", { name: "+ 提交新的功能需求" }).click()

      // 尝试输入超长标题
      const longTitle = "A".repeat(250)
      await page.getByLabel(/标题/).fill(longTitle)

      // 验证字数限制生效
      const titleInput = page.getByLabel(/标题/)
      const actualValue = await titleInput.inputValue()
      expect(actualValue.length).toBeLessThanOrEqual(200)
    })

    test("必填字段验证", async ({ page }) => {
      await page.goto("/feature-requests")

      // 登录
      await page.getByRole("button", { name: "登录" }).click()
      await page.getByPlaceholder("your@email.com").fill("required@example.com")
      await page.getByRole("button", { name: "发送登录邮件" }).click()
      await page.waitForTimeout(1000)
      await page.getByRole("button", { name: "验证登录" }).click()
      await page.waitForTimeout(1000)

      // 展开表单
      await page.getByRole("button", { name: "+ 提交新的功能需求" }).click()

      // 不填写内容直接提交
      await page.getByRole("button", { name: "提交需求" }).click()

      // 验证错误提示
      await expect(page.getByText(/请输入标题/)).toBeVisible({ timeout: 3000 })
    })
  })

  test.describe("响应式设计", () => {
    test("移动端布局正常", async ({ page }) => {
      // 设置移动端视口
      await page.setViewportSize({ width: 375, height: 667 })

      await page.goto("/feature-requests")
      await page.waitForLoadState("networkidle")

      // 验证主要元素存在且可见
      await expect(page.getByRole("heading", { name: "功能需求" })).toBeVisible()
      await expect(page.getByText("状态：")).toBeVisible()
    })
  })
})
