import type { NewsItem } from "@shared/types"

export default defineSource(async () => {
  // BlockBeats 快讯 RSS Feed
  const url = "https://api.theblockbeats.news/v2/rss/newsflash"

  try {
    const data = await rss2json(url)

    if (!data || !data.items) {
      return []
    }

    return data.items.slice(0, 30).map((item): NewsItem => ({
      id: item.id || item.link,
      title: item.title,
      url: item.link,
      pubDate: item.created ? parseRelativeDate(item.created).valueOf() : undefined,
      extra: {
        info: "BlockBeats",
      },
    }))
  } catch {
    // 如果 RSS 失败，返回空数组而不是抛出错误
    return []
  }
})
