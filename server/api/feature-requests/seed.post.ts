import { FeatureRequestTable } from "#/database/feature-requests"

/**
 * POST /api/feature-requests/seed
 * 初始化示例数据（仅用于开发测试）
 */
export default defineEventHandler(async (_event) => {
  try {
    const db = useDatabase()
    const featureRequestTable = new FeatureRequestTable(db)

    // 初始化表
    await featureRequestTable.init()

    // 创建测试用户
    const user1 = await featureRequestTable.getOrCreateUser("user1@example.com")
    const user2 = await featureRequestTable.getOrCreateUser("user2@example.com")
    const user3 = await featureRequestTable.getOrCreateUser("user3@example.com")

    // 创建测试需求
    const requests = [
      {
        title: "添加实时K线图",
        description: "希望能在个股页面看到实时K线图，支持日线、周线、月线切换",
        userId: user1.id,
      },
      {
        title: "支持自选股功能",
        description: "能够添加自选股并实时查看涨跌情况，方便快速关注重要股票",
        userId: user2.id,
      },
      {
        title: "添加新闻推送通知",
        description: "重要新闻能够推送到手机，不错过关键信息",
        userId: user3.id,
      },
      {
        title: "支持暗黑模式",
        description: "夜间看盘时希望能切换到暗黑模式，保护眼睛",
        userId: user1.id,
      },
      {
        title: "添加财务数据对比",
        description: "能够对比多个股票的财务指标，方便横向比较",
        userId: user2.id,
      },
    ]

    const createdRequests = []
    for (const req of requests) {
      const created = await featureRequestTable.createRequest(req)
      createdRequests.push(created)
    }

    // 添加一些投票
    // user2 给第一个需求投票
    await featureRequestTable.toggleVote(createdRequests[0].id, user2.id)
    await featureRequestTable.toggleVote(createdRequests[0].id, user3.id)

    // user1 给第二个需求投票
    await featureRequestTable.toggleVote(createdRequests[1].id, user1.id)
    await featureRequestTable.toggleVote(createdRequests[1].id, user3.id)

    // user3 给第三个需求投票
    await featureRequestTable.toggleVote(createdRequests[2].id, user1.id)

    logger.success("Seed data created successfully")

    return {
      success: true,
      message: "示例数据创建成功",
      data: {
        users: 3,
        requests: createdRequests.length,
        votes: 5,
      },
    }
  } catch (error: any) {
    logger.error("Error seeding data:", error)

    return {
      success: false,
      error: error.message || "Failed to seed data",
    }
  }
})
