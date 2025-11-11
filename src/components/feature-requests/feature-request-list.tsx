import { FeatureRequestItem } from "./feature-request-item"
import type { FeatureRequest } from "~/utils/feature-requests-api"

interface FeatureRequestListProps {
  requests: FeatureRequest[]
  onVoteSuccess: () => void
  onLoginRequired: () => void
}

export function FeatureRequestList({
  requests,
  onVoteSuccess,
  onLoginRequired,
}: FeatureRequestListProps) {
  if (requests.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        暂无需求，来创建第一个吧！
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {requests.map(request => (
        <FeatureRequestItem
          key={request.id}
          request={request}
          onVoteSuccess={onVoteSuccess}
          onLoginRequired={onLoginRequired}
        />
      ))}
    </div>
  )
}
