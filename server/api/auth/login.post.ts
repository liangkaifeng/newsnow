import process from "node:process"
import { FeatureRequestTable } from "#/database/feature-requests"
import { isValidEmail, sendMagicLink } from "#/utils/email"

/**
 * POST /api/auth/login
 * 发送 Magic Link 到用户邮箱
 *
 * Request Body:
 * {
 *   "email": "user@example.com"
 * }
 *
 * Response:
 * {
 *   "success": true,
 *   "message": "验证邮件已发送，请查收"
 * }
 */
export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    const { email } = body

    // 验证邮箱格式
    if (!email || typeof email !== "string") {
      return {
        success: false,
        error: "邮箱地址不能为空",
      }
    }

    if (!isValidEmail(email)) {
      return {
        success: false,
        error: "邮箱格式不正确",
      }
    }

    // 获取数据库实例
    const db = useDatabase()
    const featureRequestTable = new FeatureRequestTable(db)

    // 确保表已初始化
    await featureRequestTable.init()

    // 生成 Magic Token
    const token = await featureRequestTable.createMagicToken(email)

    // 发送邮件
    const emailSent = await sendMagicLink(email, token)

    if (!emailSent) {
      logger.error(`Failed to send magic link to ${email}`)
      return {
        success: false,
        error: "邮件发送失败，请稍后重试",
      }
    }

    logger.success(`Magic link sent to ${email}`)

    return {
      success: true,
      message: "验证邮件已发送，请查收",
      // 开发环境返回 token 方便测试
      ...((!process.env.CF_PAGES && !process.env.VERCEL) ? { token } : {}),
    }
  } catch (error: any) {
    logger.error("Error in login:", error)

    return {
      success: false,
      error: error.message || "登录失败，请稍后重试",
    }
  }
})
