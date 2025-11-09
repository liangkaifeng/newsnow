import process from "node:process"
import { FeatureRequestTable } from "#/database/feature-requests"
import { getUserFromToken } from "#/utils/jwt"

/**
 * POST /api/feature-requests/:id/vote
 * 对功能需求投票或取消投票
 *
 * Headers:
 *   Authorization: Bearer <session-token>
 *
 * Response:
 * {
 *   "success": true,
 *   "data": {
 *     "voteCount": 5,
 *     "hasVoted": true
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

    // 获取需求 ID
    const id = getRouterParam(event, "id")
    const requestId = Number.parseInt(id || "")

    if (!requestId || Number.isNaN(requestId)) {
      return {
        success: false,
        error: "无效的需求 ID",
      }
    }

    // 获取数据库实例
    const db = useDatabase()
    const featureRequestTable = new FeatureRequestTable(db)
    await featureRequestTable.init()

    // 检查当前是否已投票
    const existingVote = (await db.prepare(`
      SELECT id FROM votes WHERE request_id = ? AND user_id = ?
    `).get(requestId, currentUser.userId)) as { id: number } | null

    // 如果是新投票（不是取消投票），检查速率限制
    if (!existingVote) {
      const rateLimit = await featureRequestTable.checkVoteRateLimit(currentUser.userId)
      if (!rateLimit.allowed) {
        return {
          success: false,
          error: `您今天已投票 ${rateLimit.count} 次，已达每日限额（${rateLimit.limit}次）`,
        }
      }
    }

    // 切换投票状态
    const result = await featureRequestTable.toggleVote(requestId, currentUser.userId)

    logger.success(
      `User ${currentUser.email} ${result.hasVoted ? "voted" : "unvoted"} for request ${requestId}`,
    )

    return {
      success: true,
      data: result,
    }
  } catch (error: any) {
    logger.error("Error toggling vote:", error)

    return {
      success: false,
      error: error.message || "投票失败，请稍后重试",
    }
  }
})
