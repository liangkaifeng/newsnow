import type { SourceID } from "./types"

/**
 * 布局预设配置
 * 每个布局定义了一组默认的关注源
 */

export interface LayoutPreset {
  id: string
  name: string
  description: string
  sources: SourceID[]
}

export const layoutPresets: Record<string, LayoutPreset> = {
  finance: {
    id: "finance",
    name: "资本流向",
    description: "追踪 A股、加密货币、期货市场的资本流动",
    sources: [
      // A股财经 - 优先级最高
      "cls-telegraph", // 财联社电报
      "xueqiu-hotstock", // 雪球热门股票
      "gelonghui", // 格隆汇事件
      "cls-hot", // 财联社热门
      "fastbull-express", // 法布财经快讯
      // 香港科技 - 第二优先级
      "36kr-quick", // 36氪快讯
      "ithome", // IT之家
      // 加密货币 - 第三优先级
      "jinse", // 金色财经
      "blockbeats", // BlockBeats
      "coindesk", // CoinDesk
      // 期货/金融数据 - 第四优先级
      "jin10", // 金十数据
      "wallstreetcn-quick", // 华尔街见闻
      "mktnews-flash", // MKTNews
    ] as SourceID[],
  },
  tech: {
    id: "tech",
    name: "综合布局",
    description: "科技、资讯、开发者内容均衡展示",
    sources: [
      // 科技开发者
      "sspai",
      "v2ex-share",
      "bestblogs",
      "github-trending-today",
      "producthunt",
      "hackernews",
      "ithome",
      // 综合资讯
      "36kr-quick",
      "coolapk",
      "solidot",
    ] as SourceID[],
  },
} as const

export type LayoutPresetID = keyof typeof layoutPresets

export const defaultLayoutId: LayoutPresetID = "finance"
