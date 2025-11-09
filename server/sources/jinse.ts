import type { NewsItem } from "@shared/types"

export default defineSource(async () => {
  // 金色财经快讯 API - 需要 limit 参数
  const url = "https://api.jinse.cn/noah/v2/lives?limit=30"

  try {
    const response: any = await myFetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
    })

    if (!response || !response.list) {
      return []
    }

    const newsItems: NewsItem[] = []

    // 数据结构: list[] 是日期分组，每个分组里的 lives[] 是新闻列表
    response.list.forEach((dateGroup: any) => {
      if (dateGroup.lives && Array.isArray(dateGroup.lives)) {
        dateGroup.lives.forEach((item: any) => {
          newsItems.push({
            id: item.id,
            title: item.content_prefix || item.content || item.title,
            url: item.link || `https://www.jinse.cn/lives/${item.id}.html`,
            pubDate: item.created_at * 1000,
            extra: {
              info: "金色财经",
            },
          })
        })
      }
    })

    return newsItems.slice(0, 30)
  } catch {
    // 如果 API 失败，返回空数组而不是抛出错误
    return []
  }
})
