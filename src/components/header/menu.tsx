import { motion } from "framer-motion"
import { type LayoutPresetID, layoutPresets } from "@shared/layouts"
import { focusSourcesAtom } from "~/atoms"

// function ThemeToggle() {
//   const { isDark, toggleDark } = useDark()
//   return (
//     <li onClick={toggleDark} className="cursor-pointer [&_*]:cursor-pointer transition-all">
//       <span className={$("inline-block", isDark ? "i-ph-moon-stars-duotone" : "i-ph-sun-dim-duotone")} />
//       <span>
//         {isDark ? "浅色模式" : "深色模式"}
//       </span>
//     </li>
//   )
// }

function LayoutToggle() {
  const setFocusSources = useSetAtom(focusSourcesAtom)
  const [showSubmenu, setShowSubmenu] = useState(false)

  const applyLayout = (layoutId: LayoutPresetID) => {
    const layout = layoutPresets[layoutId]
    setFocusSources(layout.sources)
    setShowSubmenu(false)
  }

  return (
    <li
      className="relative cursor-pointer [&_*]:cursor-pointer transition-all"
      onMouseEnter={() => setShowSubmenu(true)}
      onMouseLeave={() => setShowSubmenu(false)}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="i-ph:layout-duotone inline-block" />
          <span>切换布局</span>
        </div>
        <span className="i-ph:caret-right inline-block text-xs op-50" />
      </div>
      {showSubmenu && (
        <motion.div
          className="absolute left-full top-0 ml-2 min-w-180px bg-base bg-op-90! backdrop-blur-md rounded-lg shadow-xl z-100"
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <ol className="p-2 text-sm">
            {Object.values(layoutPresets).map(layout => (
              <li
                key={layout.id}
                onClick={() => applyLayout(layout.id as LayoutPresetID)}
                className="hover:bg-primary/10 rounded-md transition-all"
              >
                <div className="flex flex-col gap-1">
                  <span className="font-medium">{layout.name}</span>
                  <span className="text-xs op-60">{layout.description}</span>
                </div>
              </li>
            ))}
          </ol>
        </motion.div>
      )}
    </li>
  )
}

export function Menu() {
  const { loggedIn, login, logout, userInfo, enableLogin } = useLogin()
  const [shown, show] = useState(false)
  return (
    <span className="relative" onMouseEnter={() => show(true)} onMouseLeave={() => show(false)}>
      <span className="flex items-center scale-90">
        {
          enableLogin && loggedIn && userInfo.avatar
            ? (
                <button
                  type="button"
                  className="h-6 w-6 rounded-full bg-cover"
                  style={
                    {
                      backgroundImage: `url(${userInfo.avatar}&s=24)`,
                    }
                  }
                >
                </button>
              )
            : <button type="button" className="btn i-si:more-muted-horiz-circle-duotone" />
        }
      </span>
      {shown && (
        <div className="absolute right-0 z-99 bg-transparent pt-4 top-4">
          <motion.div
            id="dropdown-menu"
            className={$([
              "w-200px",
              "bg-primary backdrop-blur-5 bg-op-70! rounded-lg shadow-xl",
            ])}
            initial={{
              scale: 0.9,
            }}
            animate={{
              scale: 1,
            }}
          >
            <ol className="bg-base bg-op-70! backdrop-blur-md p-2 rounded-lg color-base text-base">
              <LayoutToggle />
              {enableLogin && (loggedIn
                ? (
                    <li onClick={logout}>
                      <span className="i-ph:sign-out-duotone inline-block" />
                      <span>退出登录</span>
                    </li>
                  )
                : (
                    <li onClick={login}>
                      <span className="i-ph:sign-in-duotone inline-block" />
                      <span>Github 账号登录</span>
                    </li>
                  ))}
              {/* <ThemeToggle /> */}
              <li onClick={() => window.open(Homepage)} className="cursor-pointer [&_*]:cursor-pointer transition-all">
                <span className="i-ph:github-logo-duotone inline-block" />
                <span>Star on Github </span>
              </li>
              <li className="flex gap-2 items-center">
                <a
                  href="https://github.com/ourongxing/newsnow"
                >
                  <img
                    alt="GitHub stars badge"
                    src="https://img.shields.io/github/stars/ourongxing/newsnow?logo=github&style=flat&labelColor=%235e3c40&color=%23614447"
                  />
                </a>
                <a
                  href="https://github.com/ourongxing/newsnow/fork"
                >
                  <img
                    alt="GitHub forks badge"
                    src="https://img.shields.io/github/forks/ourongxing/newsnow?logo=github&style=flat&labelColor=%235e3c40&color=%23614447"
                  />
                </a>
              </li>
            </ol>
          </motion.div>
        </div>
      )}
    </span>
  )
}
