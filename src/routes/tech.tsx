import { createFileRoute } from "@tanstack/react-router"
import { layoutPresets } from "@shared/layouts"
import { Column } from "~/components/column"
import { focusSourcesAtom } from "~/atoms"

export const Route = createFileRoute("/tech")({
  component: TechLayoutComponent,
})

function TechLayoutComponent() {
  const setFocusSources = useSetAtom(focusSourcesAtom)

  // 应用技术优先布局
  useEffect(() => {
    setFocusSources(layoutPresets.tech.sources)
  }, [setFocusSources])

  return <Column id="focus" />
}
