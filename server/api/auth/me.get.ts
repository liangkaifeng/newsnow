import process from "node:process"
import { getUserFromToken } from "#/utils/jwt"

/**
 * GET /api/auth/me
 * 获取当前登录用户信息
 *
 * Headers:
 *   Authorization: Bearer <session-token>
 *
 * Response:
 * {
 *   "success": true,
 *   "user": {
 *     "id": 1,
 *     "email": "user@example.com"
 *   }
 * }
 */
export default defineEventHandler(async (event) => {
  try {
    const jwtSecret = process.env.JWT_SECRET || "dev-secret-key-change-in-production"

    // 从 token 中获取用户信息
    const user = await getUserFromToken(event, jwtSecret)

    if (!user) {
      return {
        success: false,
        error: "未登录或登录已过期",
      }
    }

    return {
      success: true,
      user: {
        id: user.userId,
        email: user.email,
      },
    }
  } catch (error: any) {
    logger.error("Error in /api/auth/me:", error)

    return {
      success: false,
      error: error.message || "获取用户信息失败",
    }
  }
})
