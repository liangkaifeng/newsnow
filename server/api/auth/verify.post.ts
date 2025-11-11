import process from "node:process"
import { FeatureRequestTable } from "#/database/feature-requests"
import { signJWT } from "#/utils/jwt"

/**
 * POST /api/auth/verify
 * 验证 Magic Link token 并生成 JWT session token
 *
 * Request Body:
 * {
 *   "token": "uuid-token-string"
 * }
 *
 * Response:
 * {
 *   "success": true,
 *   "user": {
 *     "id": 1,
 *     "email": "user@example.com"
 *   },
 *   "sessionToken": "jwt-token-string"
 * }
 */
export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    const { token } = body

    // 验证 token 参数
    if (!token || typeof token !== "string") {
      return {
        success: false,
        error: "验证码不能为空",
      }
    }

    // 获取数据库实例
    const db = useDatabase()
    const featureRequestTable = new FeatureRequestTable(db)

    // 确保表已初始化
    await featureRequestTable.init()

    // 验证 Magic Token
    const email = await featureRequestTable.verifyMagicToken(token)

    if (!email) {
      logger.warn(`Invalid or expired token: ${token}`)
      return {
        success: false,
        error: "验证码无效或已过期",
      }
    }

    // 获取或创建用户
    const user = await featureRequestTable.getOrCreateUser(email)

    // 生成 JWT session token
    const jwtSecret = process.env.JWT_SECRET || "dev-secret-key-change-in-production"
    const sessionToken = await signJWT(
      {
        userId: user.id,
        email: user.email,
      },
      jwtSecret,
      "30d", // 30 天有效期
    )

    logger.success(`User ${email} logged in successfully`)

    return {
      success: true,
      user: {
        id: user.id,
        email: user.email,
      },
      sessionToken,
    }
  } catch (error: any) {
    logger.error("Error in verify:", error)

    return {
      success: false,
      error: error.message || "验证失败，请稍后重试",
    }
  }
})
