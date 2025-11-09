import { useState } from "react"
import { useMutation } from "@tanstack/react-query"
import { createFeatureRequest } from "~/utils/feature-requests-api"

interface FeatureRequestFormProps {
  onSuccess: () => void
}

export function FeatureRequestForm({ onSuccess }: FeatureRequestFormProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const toast = useToast()

  const createMutation = useMutation({
    mutationFn: createFeatureRequest,
    onSuccess: (data) => {
      if (data.success) {
        setTitle("")
        setDescription("")
        setIsExpanded(false)
        onSuccess()
        toast("需求创建成功！", { type: "success" })
      } else {
        toast(data.error || "创建失败", { type: "error" })
      }
    },
    onError: (error) => {
      console.error("Create error:", error)
      toast("创建失败，请稍后重试", { type: "error" })
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!title.trim()) {
      toast("请输入标题", { type: "warning" })
      return
    }

    if (!description.trim()) {
      toast("请输入描述", { type: "warning" })
      return
    }

    createMutation.mutate({ title: title.trim(), description: description.trim() })
  }

  if (!isExpanded) {
    return (
      <div className="mb-8">
        <button
          type="button"
          onClick={() => setIsExpanded(true)}
          className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 font-medium transition-colors"
        >
          + 提交新的功能需求
        </button>
      </div>
    )
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 mb-8">
      <h2 className="text-xl font-semibold mb-4">提交新的功能需求</h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* 标题 */}
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
            标题
            <span className="text-red-500">*</span>
          </label>
          <input
            id="title"
            type="text"
            value={title}
            onChange={e => setTitle(e.target.value)}
            maxLength={200}
            placeholder="简明扼要地描述您的需求"
            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <div className="text-xs text-gray-500 mt-1">
            {title.length}
            {" "}
            / 200 字符
          </div>
        </div>

        {/* 描述 */}
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
            详细描述
            <span className="text-red-500">*</span>
          </label>
          <textarea
            id="description"
            value={description}
            onChange={e => setDescription(e.target.value)}
            maxLength={2000}
            rows={6}
            placeholder="详细说明您的需求，包括使用场景、期望效果等"
            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <div className="text-xs text-gray-500 mt-1">
            {description.length}
            {" "}
            / 2000 字符
          </div>
        </div>

        {/* 限制提示 */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm text-yellow-800">
          <strong>注意：</strong>
          每天最多可以提交 3 个需求，投票 20 次
        </div>

        {/* 按钮 */}
        <div className="flex gap-3">
          <button
            type="submit"
            disabled={createMutation.isPending}
            className={$([
              "bg-blue-600 text-white px-6 py-2 rounded-lg font-medium",
              "hover:bg-blue-700 transition-colors",
              createMutation.isPending && "opacity-50 cursor-not-allowed",
            ])}
          >
            {createMutation.isPending ? "提交中..." : "提交需求"}
          </button>
          <button
            type="button"
            onClick={() => {
              setIsExpanded(false)
              setTitle("")
              setDescription("")
            }}
            className="bg-gray-200 text-gray-700 px-6 py-2 rounded-lg font-medium hover:bg-gray-300 transition-colors"
          >
            取消
          </button>
        </div>
      </form>
    </div>
  )
}
