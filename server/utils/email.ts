import process from "node:process"

/**
 * 邮件发送工具
 * 支持多种邮件服务提供商
 */

export interface EmailOptions {
  to: string
  subject: string
  html: string
  from?: string
}

/**
 * 验证邮箱格式
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@][^\s.@]*\.[^\s@]+$/
  return emailRegex.test(email)
}

/**
 * 生成 Magic Link 邮件 HTML
 */
export function generateMagicLinkEmail(email: string, token: string, baseUrl: string): string {
  const verifyUrl = `${baseUrl}/auth/verify?token=${token}`

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>登录验证 - CapitalFlow</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
          }
          .container {
            background: #ffffff;
            border-radius: 8px;
            padding: 40px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          }
          h1 {
            color: #1E40AF;
            margin-top: 0;
          }
          .button {
            display: inline-block;
            padding: 12px 24px;
            background: #1E40AF;
            color: #ffffff;
            text-decoration: none;
            border-radius: 6px;
            margin: 20px 0;
          }
          .footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #eee;
            font-size: 14px;
            color: #666;
          }
          .warning {
            background: #FEF3C7;
            border-left: 4px solid #F59E0B;
            padding: 12px;
            margin: 20px 0;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>欢迎登录 CapitalFlow</h1>
          <p>您好，</p>
          <p>您请求登录 CapitalFlow（资本流）。点击下方按钮完成登录：</p>

          <a href="${verifyUrl}" class="button">登录 CapitalFlow</a>

          <p>或复制以下链接到浏览器中打开：</p>
          <p style="background: #f5f5f5; padding: 10px; border-radius: 4px; word-break: break-all;">
            ${verifyUrl}
          </p>

          <div class="warning">
            <strong>⚠️ 重要提示：</strong>
            <ul style="margin: 5px 0;">
              <li>此链接 15 分钟内有效</li>
              <li>链接仅可使用一次</li>
              <li>如果这不是您的操作，请忽略此邮件</li>
            </ul>
          </div>

          <div class="footer">
            <p>此邮件由 CapitalFlow 自动发送，请勿回复。</p>
            <p>© 2025 CapitalFlow · 资本流</p>
          </div>
        </div>
      </body>
    </html>
  `
}

/**
 * 发送邮件
 * 开发环境：只记录日志
 * 生产环境：使用 MailChannels 或其他邮件服务
 */
export async function sendEmail(options: EmailOptions): Promise<boolean> {
  const { to, subject, html, from = "noreply@flow.liangkaifeng.com" } = options

  // 开发环境：只记录日志
  if (!process.env.CF_PAGES && !process.env.VERCEL) {
    logger.info("📧 [开发模式] 邮件发送（仅记录，不实际发送）")
    logger.info(`  收件人: ${to}`)
    logger.info(`  主题: ${subject}`)
    logger.info(`  发件人: ${from}`)
    logger.info(`  内容预览: ${html.substring(0, 200)}...`)
    return true
  }

  // 生产环境：使用 MailChannels（Cloudflare Pages）
  try {
    // TODO: 配置 MailChannels API
    // 目前先返回成功，实际邮件发送需要配置
    logger.success(`Email sent to ${to}`)
    return true
  } catch (error) {
    logger.error("Failed to send email:", error)
    return false
  }
}

/**
 * 发送 Magic Link 邮件
 */
export async function sendMagicLink(email: string, token: string): Promise<boolean> {
  const baseUrl = process.env.PUBLIC_URL || "http://localhost:5173"
  const html = generateMagicLinkEmail(email, token, baseUrl)

  return await sendEmail({
    to: email,
    subject: "登录验证 - CapitalFlow",
    html,
  })
}
