import process from "node:process"
import { FeatureRequestTable } from "#/database/feature-requests"
import { getUserFromToken } from "#/utils/jwt"

/**
 * POST /api/feature-requests
 * 创建新的功能需求
 *
 * Headers:
 *   Authorization: Bearer <session-token>
 *
 * Request Body:
 * {
 *   "title": "需求标题",
 *   "description": "需求描述"
 * }
 *
 * Response:
 * {
 *   "success": true,
 *   "data": {
 *     "id": 1,
 *     "title": "需求标题",
 *     "description": "需求描述",
 *     "user_id": 1,
 *     "status": "pending",
 *     "vote_count": 0,
 *     "created_at": 1234567890,
 *     "updated_at": 1234567890
 *   }
 * }
 */
export default defineEventHandler(async (event) => {
  try {
    // 验证登录状态
    const jwtSecret = process.env.JWT_SECRET || "dev-secret-key-change-in-production"
    const currentUser = await getUserFromToken(event, jwtSecret)

    if (!currentUser) {
      return {
        success: false,
        error: "请先登录",
      }
    }

    // 读取请求体
    const body = await readBody(event)
    const { title, description } = body

    // 验证必填字段
    if (!title || typeof title !== "string" || title.trim().length === 0) {
      return {
        success: false,
        error: "标题不能为空",
      }
    }

    if (!description || typeof description !== "string" || description.trim().length === 0) {
      return {
        success: false,
        error: "描述不能为空",
      }
    }

    // 验证字段长度
    if (title.length > 200) {
      return {
        success: false,
        error: "标题不能超过 200 个字符",
      }
    }

    if (description.length > 2000) {
      return {
        success: false,
        error: "描述不能超过 2000 个字符",
      }
    }

    // 获取数据库实例
    const db = useDatabase()
    const featureRequestTable = new FeatureRequestTable(db)
    await featureRequestTable.init()

    // 检查速率限制（3个需求/天）
    const rateLimit = await featureRequestTable.checkRequestRateLimit(currentUser.userId)
    if (!rateLimit.allowed) {
      return {
        success: false,
        error: `您今天已创建 ${rateLimit.count} 个需求，已达每日限额（${rateLimit.limit}个）`,
      }
    }

    // 创建需求
    const request = await featureRequestTable.createRequest({
      title: title.trim(),
      description: description.trim(),
      userId: currentUser.userId,
    })

    logger.success(`User ${currentUser.email} created request: ${title}`)

    return {
      success: true,
      data: request,
    }
  } catch (error: any) {
    logger.error("Error creating feature request:", error)

    return {
      success: false,
      error: error.message || "创建需求失败，请稍后重试",
    }
  }
})
