import { FeatureRequestTable } from "#/database/feature-requests"

/**
 * GET /api/feature-requests
 * 获取功能需求列表
 *
 * Query 参数:
 * - status: pending | in_progress | completed | rejected | all (默认: all)
 * - sort: votes | created (默认: votes)
 * - limit: number (默认: 50)
 * - offset: number (默认: 0)
 */
export default defineEventHandler(async (event) => {
  try {
    const query = getQuery(event)
    const status = (query.status as string) || "all"
    const sort = (query.sort as "votes" | "created") || "votes"
    const limit = Number.parseInt(query.limit as string) || 50
    const offset = Number.parseInt(query.offset as string) || 0

    // TODO: 从 JWT token 获取 userId（如果已登录）
    const userId = undefined

    // 获取数据库实例
    const db = useDatabase()
    const featureRequestTable = new FeatureRequestTable(db)

    // 确保表已初始化
    await featureRequestTable.init()

    // 获取需求列表
    const { requests, total } = await featureRequestTable.getRequests({
      status,
      sort,
      limit,
      offset,
      userId,
    })

    // 邮箱脱敏
    const maskedRequests = requests.map(request => ({
      ...request,
      user_email: maskEmail(request.user_email),
    }))

    return {
      success: true,
      data: maskedRequests,
      total,
      offset,
      limit,
    }
  } catch (error: any) {
    logger.error("Error fetching feature requests:", error)

    return {
      success: false,
      error: error.message || "Failed to fetch feature requests",
    }
  }
})

/**
 * 邮箱脱敏处理
 */
function maskEmail(email: string): string {
  const [local, domain] = email.split("@")
  if (!local || !domain)
    return email
  return `${local[0]}***@${domain}`
}
