import process from "node:process"
import { defineConfig, devices } from "@playwright/test"

/**
 * Playwright E2E 测试配置
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  // 测试文件目录
  testDir: "./e2e",

  // 每个测试的超时时间（30秒）
  timeout: 30 * 1000,

  // 全局测试配置
  fullyParallel: true,
  forbidOnly: !!process.env.CI, // CI 环境禁止 test.only
  retries: process.env.CI ? 2 : 0, // CI 环境失败重试 2 次
  workers: process.env.CI ? 1 : undefined, // CI 环境串行运行
  reporter: process.env.CI ? "html" : "list", // CI 生成 HTML 报告

  // 公共配置
  use: {
    // 基础 URL
    baseURL: process.env.PLAYWRIGHT_BASE_URL || "http://localhost:5173",

    // 录制失败时的截图和视频
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",

    // 浏览器配置
    headless: true,
    viewport: { width: 1280, height: 720 },
    ignoreHTTPSErrors: true,

    // 默认超时
    actionTimeout: 10 * 1000,
    navigationTimeout: 30 * 1000,
  },

  // 多浏览器测试配置
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
    // 仅在 CI 环境运行多浏览器测试
    ...(process.env.CI
      ? [
          {
            name: "firefox",
            use: { ...devices["Desktop Firefox"] },
          },
          {
            name: "webkit",
            use: { ...devices["Desktop Safari"] },
          },
          {
            name: "Mobile Chrome",
            use: { ...devices["Pixel 5"] },
          },
        ]
      : []),
  ],

  // 开发服务器配置（本地测试时自动启动）
  webServer: process.env.CI
    ? undefined
    : {
        command: "npm run dev",
        url: "http://localhost:5173",
        reuseExistingServer: !process.env.CI,
        timeout: 120 * 1000,
      },
})
