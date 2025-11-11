import { expect, test } from "@playwright/test"

/**
 * 示例 E2E 测试 - 基础功能验证
 */
test.describe("CapitalFlow 基础功能", () => {
  test("首页加载正常", async ({ page }) => {
    // 访问首页
    await page.goto("/")

    // 验证页面标题
    await expect(page).toHaveTitle(/CapitalFlow/)

    // 验证主要元素存在
    await expect(page.locator("body")).toBeVisible()
  })

  test("布局切换功能正常", async ({ page }) => {
    await page.goto("/")

    // 等待页面加载完成
    await page.waitForLoadState("networkidle")

    // 查找布局切换按钮（根据实际情况调整选择器）
    const layoutButton = page.getByRole("button", { name: /布局|layout/i })

    if (await layoutButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      await layoutButton.click()

      // 验证布局选项出现
      await expect(page.getByText(/资本流向|综合布局/)).toBeVisible()
    }
  })

  test("新闻列表加载正常", async ({ page }) => {
    await page.goto("/")

    // 等待新闻列表加载
    await page.waitForLoadState("networkidle")

    // 验证至少有一条新闻（根据实际 DOM 结构调整）
    const newsItems = page.locator("[data-testid=\"news-item\"], article, .news-card")
    const count = await newsItems.count()

    expect(count).toBeGreaterThan(0)
  })
})
