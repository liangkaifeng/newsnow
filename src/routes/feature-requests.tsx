import { createFileRoute } from "@tanstack/react-router"
import { FeatureRequestsPage } from "~/components/feature-requests/feature-requests-page"

export const Route = createFileRoute("/feature-requests")({
  component: FeatureRequestsComponent,
})

function FeatureRequestsComponent() {
  return <FeatureRequestsPage />
}
