import { useMutation } from "@tanstack/react-query"
import type { FeatureRequest } from "~/utils/feature-requests-api"
import { toggleVote } from "~/utils/feature-requests-api"

interface FeatureRequestItemProps {
  request: FeatureRequest
  onVoteSuccess: () => void
  onLoginRequired: () => void
}

const statusLabels = {
  pending: "待处理",
  in_progress: "进行中",
  completed: "已完成",
  rejected: "已拒绝",
}

const statusColors = {
  pending: "bg-gray-100 text-gray-700",
  in_progress: "bg-blue-100 text-blue-700",
  completed: "bg-green-100 text-green-700",
  rejected: "bg-red-100 text-red-700",
}

export function FeatureRequestItem({
  request,
  onVoteSuccess,
  onLoginRequired,
}: FeatureRequestItemProps) {
  const toast = useToast()

  const voteMutation = useMutation({
    mutationFn: () => toggleVote(request.id),
    onSuccess: (data) => {
      if (data.success) {
        onVoteSuccess()
      } else if (data.error?.includes("登录")) {
        onLoginRequired()
      } else {
        toast(data.error || "投票失败", { type: "error" })
      }
    },
    onError: (error) => {
      console.error("Vote error:", error)
      toast("投票失败，请稍后重试", { type: "error" })
    },
  })

  const handleVote = () => {
    voteMutation.mutate()
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
      <div className="flex gap-4">
        {/* 投票按钮 */}
        <div className="flex flex-col items-center">
          <button
            type="button"
            onClick={handleVote}
            disabled={voteMutation.isPending}
            className={$([
              "w-12 h-12 rounded-lg border-2 flex flex-col items-center justify-center",
              "hover:bg-blue-50 transition-colors",
              request.has_voted ? "border-blue-600 bg-blue-50" : "border-gray-300",
              voteMutation.isPending && "opacity-50 cursor-not-allowed",
            ])}
            title={request.has_voted ? "取消投票" : "投票"}
          >
            <svg
              className={$([
                "w-5 h-5",
                request.has_voted ? "text-blue-600" : "text-gray-400",
              ])}
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path d="M2 10.5a1.5 1.5 0 113 0v6a1.5 1.5 0 01-3 0v-6zM6 10.333v5.43a2 2 0 001.106 1.79l.05.025A4 4 0 008.943 18h5.416a2 2 0 001.962-1.608l1.2-6A2 2 0 0015.56 8H12V4a2 2 0 00-2-2 1 1 0 00-1 1v.667a4 4 0 01-.8 2.4L6.8 7.933a4 4 0 00-.8 2.4z" />
            </svg>
            <span className={$([
              "text-xs font-semibold mt-1",
              request.has_voted ? "text-blue-600" : "text-gray-600",
            ])}
            >
              {request.vote_count}
            </span>
          </button>
        </div>

        {/* 需求内容 */}
        <div className="flex-1">
          <div className="flex items-start justify-between mb-2">
            <h3 className="text-lg font-semibold text-gray-900">
              {request.title}
            </h3>
            <span
              className={$([
                "px-3 py-1 rounded-full text-xs font-medium",
                statusColors[request.status],
              ])}
            >
              {statusLabels[request.status]}
            </span>
          </div>

          <p className="text-gray-700 mb-3 whitespace-pre-wrap">
            {request.description}
          </p>

          <div className="flex items-center gap-4 text-sm text-gray-500">
            <span>
              提交者：
              {request.user_email}
            </span>
            <span>•</span>
            <span>{new Date(request.created_at).toLocaleDateString("zh-CN")}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
