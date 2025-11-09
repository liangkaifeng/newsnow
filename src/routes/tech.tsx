import { createFileRoute } from "@tanstack/react-router"
import { layoutPresets } from "@shared/layouts"
import { sources } from "@shared/sources"
import { Column } from "~/components/column"
import { focusSourcesAtom } from "~/atoms"

export const Route = createFileRoute("/tech")({
  component: TechLayoutComponent,
})

function TechLayoutComponent() {
  const setFocusSources = useSetAtom(focusSourcesAtom)

  // 应用技术优先布局，过滤掉不存在的源
  useEffect(() => {
    const validSources = layoutPresets.tech.sources.filter(sourceId => sources[sourceId])
    setFocusSources(validSources)
  }, [setFocusSources])

  return <Column id="focus" />
}
