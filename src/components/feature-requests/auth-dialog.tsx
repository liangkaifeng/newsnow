import { useState } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { sendLoginEmail, verifyMagicToken } from "~/utils/feature-requests-api"

interface AuthDialogProps {
  onClose: () => void
}

export function AuthDialog({ onClose }: AuthDialogProps) {
  const [step, setStep] = useState<"email" | "verify">("email")
  const [email, setEmail] = useState("")
  const [token, setToken] = useState("")
  const queryClient = useQueryClient()
  const toast = useToast()

  const sendEmailMutation = useMutation({
    mutationFn: sendLoginEmail,
    onSuccess: (data) => {
      if (data.success) {
        setStep("verify")
        // 开发模式下，如果返回了 token，自动填入
        if (data.token) {
          setToken(data.token)
        }
        toast(data.message || "验证邮件已发送", { type: "success" })
      } else {
        toast(data.error || "发送失败", { type: "error" })
      }
    },
    onError: (error) => {
      console.error("Send email error:", error)
      toast("发送失败，请稍后重试", { type: "error" })
    },
  })

  const verifyMutation = useMutation({
    mutationFn: verifyMagicToken,
    onSuccess: (data) => {
      if (data.success) {
        // 刷新用户信息查询
        queryClient.invalidateQueries({ queryKey: ["currentUser"] })
        toast("登录成功！", { type: "success" })
        onClose()
      } else {
        toast(data.error || "验证失败", { type: "error" })
      }
    },
    onError: (error) => {
      console.error("Verify error:", error)
      toast("验证失败，请稍后重试", { type: "error" })
    },
  })

  const handleSendEmail = (e: React.FormEvent) => {
    e.preventDefault()

    if (!email.trim()) {
      toast("请输入邮箱地址", { type: "warning" })
      return
    }

    sendEmailMutation.mutate(email.trim())
  }

  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault()

    if (!token.trim()) {
      toast("请输入验证码", { type: "warning" })
      return
    }

    verifyMutation.mutate(token.trim())
  }

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg p-8 max-w-md w-full mx-4"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">登录</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {step === "email"
          ? (
              <form onSubmit={handleSendEmail}>
                <p className="text-gray-600 mb-4">
                  输入您的邮箱地址，我们会发送一封包含登录链接的邮件
                </p>

                <div className="mb-4">
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                    邮箱地址
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="your@email.com"
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <button
                  type="submit"
                  disabled={sendEmailMutation.isPending}
                  className={$([
                    "w-full bg-blue-600 text-white px-6 py-3 rounded-lg font-medium",
                    "hover:bg-blue-700 transition-colors",
                    sendEmailMutation.isPending && "opacity-50 cursor-not-allowed",
                  ])}
                >
                  {sendEmailMutation.isPending ? "发送中..." : "发送登录邮件"}
                </button>
              </form>
            )
          : (
              <form onSubmit={handleVerify}>
                <p className="text-gray-600 mb-4">
                  验证邮件已发送到
                  {" "}
                  <strong>{email}</strong>
                  ，请查收并输入邮件中的验证码
                </p>

                <div className="mb-4">
                  <label htmlFor="token" className="block text-sm font-medium text-gray-700 mb-1">
                    验证码
                  </label>
                  <input
                    id="token"
                    type="text"
                    value={token}
                    onChange={e => setToken(e.target.value)}
                    placeholder="粘贴邮件中的验证码"
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="flex gap-3">
                  <button
                    type="submit"
                    disabled={verifyMutation.isPending}
                    className={$([
                      "flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg font-medium",
                      "hover:bg-blue-700 transition-colors",
                      verifyMutation.isPending && "opacity-50 cursor-not-allowed",
                    ])}
                  >
                    {verifyMutation.isPending ? "验证中..." : "验证登录"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setStep("email")}
                    className="px-6 py-3 border border-gray-300 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                  >
                    重新发送
                  </button>
                </div>
              </form>
            )}
      </div>
    </div>
  )
}
