import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { FeatureRequestList } from "./feature-request-list"
import { FeatureRequestForm } from "./feature-request-form"
import { AuthDialog } from "./auth-dialog"
import { getCurrentUser, getFeatureRequests } from "~/utils/feature-requests-api"

export function FeatureRequestsPage() {
  const [status, setStatus] = useState<string>("all")
  const [sort, setSort] = useState<"votes" | "created">("votes")
  const [showAuthDialog, setShowAuthDialog] = useState(false)

  // 获取当前用户
  const { data: userResult } = useQuery({
    queryKey: ["currentUser"],
    queryFn: getCurrentUser,
    retry: false,
  })

  const isLoggedIn = userResult?.success === true

  // 获取需求列表
  const { data: requestsResult, isLoading, refetch } = useQuery({
    queryKey: ["featureRequests", status, sort],
    queryFn: () => getFeatureRequests({ status, sort }),
  })

  const requests = requestsResult?.data || []
  const total = requestsResult?.total || 0

  return (
    <div className="min-h-screen py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* 标题和用户信息 */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">功能需求</h1>
          <p className="text-gray-600">
            为 CapitalFlow 提出新功能建议，或为现有建议投票
          </p>
          {isLoggedIn && (
            <p className="text-sm text-blue-600 mt-2">
              已登录：
              {userResult?.user?.email}
            </p>
          )}
        </div>

        {/* 创建需求表单 */}
        {isLoggedIn
          ? (
              <FeatureRequestForm onSuccess={() => refetch()} />
            )
          : (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 mb-8">
                <p className="text-gray-700 mb-3">
                  需要登录才能创建需求或投票
                </p>
                <button
                  type="button"
                  onClick={() => setShowAuthDialog(true)}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                >
                  登录
                </button>
              </div>
            )}

        {/* 过滤器 */}
        <div className="flex gap-4 mb-6">
          <div>
            <label className="text-sm text-gray-600 mr-2">状态：</label>
            <select
              value={status}
              onChange={e => setStatus(e.target.value)}
              className="border border-gray-300 rounded px-3 py-1"
            >
              <option value="all">全部</option>
              <option value="pending">待处理</option>
              <option value="in_progress">进行中</option>
              <option value="completed">已完成</option>
              <option value="rejected">已拒绝</option>
            </select>
          </div>
          <div>
            <label className="text-sm text-gray-600 mr-2">排序：</label>
            <select
              value={sort}
              onChange={e => setSort(e.target.value as "votes" | "created")}
              className="border border-gray-300 rounded px-3 py-1"
            >
              <option value="votes">票数</option>
              <option value="created">时间</option>
            </select>
          </div>
        </div>

        {/* 需求列表 */}
        {isLoading
          ? (
              <div className="text-center py-12 text-gray-500">加载中...</div>
            )
          : (
              <>
                <div className="mb-4 text-sm text-gray-600">
                  共
                  {" "}
                  {total}
                  {" "}
                  个需求
                </div>
                <FeatureRequestList
                  requests={requests}
                  onVoteSuccess={() => refetch()}
                  onLoginRequired={() => setShowAuthDialog(true)}
                />
              </>
            )}
      </div>

      {/* 登录对话框 */}
      {showAuthDialog && (
        <AuthDialog onClose={() => setShowAuthDialog(false)} />
      )}
    </div>
  )
}
