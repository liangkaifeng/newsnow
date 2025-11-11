/**
 * Feature Requests API utilities
 */

export interface FeatureRequest {
  id: number
  title: string
  description: string
  user_id: number
  user_email: string
  status: "pending" | "in_progress" | "completed" | "rejected"
  vote_count: number
  has_voted?: boolean
  created_at: number
  updated_at: number
}

export interface User {
  id: number
  email: string
}

/**
 * 获取功能需求列表
 */
export async function getFeatureRequests(params?: {
  status?: string
  sort?: "votes" | "created"
  limit?: number
  offset?: number
}): Promise<{
    success: boolean
    data: FeatureRequest[]
    total: number
    error?: string
  }> {
  const query = new URLSearchParams()
  if (params?.status)
    query.append("status", params.status)
  if (params?.sort)
    query.append("sort", params.sort)
  if (params?.limit)
    query.append("limit", params.limit.toString())
  if (params?.offset)
    query.append("offset", params.offset.toString())

  const token = localStorage.getItem("session_token")
  const headers: Record<string, string> = {}
  if (token)
    headers.Authorization = `Bearer ${token}`

  const response = await fetch(`/api/feature-requests?${query}`, { headers })
  return await response.json()
}

/**
 * 创建功能需求
 */
export async function createFeatureRequest(data: {
  title: string
  description: string
}): Promise<{ success: boolean, data?: FeatureRequest, error?: string }> {
  const token = localStorage.getItem("session_token")
  if (!token) {
    return { success: false, error: "请先登录" }
  }

  const response = await fetch("/api/feature-requests", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  })

  return await response.json()
}

/**
 * 投票/取消投票
 */
export async function toggleVote(requestId: number): Promise<{
  success: boolean
  data?: { voteCount: number, hasVoted: boolean }
  error?: string
}> {
  const token = localStorage.getItem("session_token")
  if (!token) {
    return { success: false, error: "请先登录" }
  }

  const response = await fetch(`/api/feature-requests/${requestId}/vote`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })

  return await response.json()
}

/**
 * 发送登录邮件
 */
export async function sendLoginEmail(email: string): Promise<{
  success: boolean
  message?: string
  token?: string
  error?: string
}> {
  const response = await fetch("/api/auth/login", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email }),
  })

  return await response.json()
}

/**
 * 验证 Magic Token
 */
export async function verifyMagicToken(token: string): Promise<{
  success: boolean
  user?: User
  sessionToken?: string
  error?: string
}> {
  const response = await fetch("/api/auth/verify", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ token }),
  })

  const result = await response.json()

  // 保存 session token 到 localStorage
  if (result.success && result.sessionToken) {
    localStorage.setItem("session_token", result.sessionToken)
  }

  return result
}

/**
 * 获取当前用户信息
 */
export async function getCurrentUser(): Promise<{
  success: boolean
  user?: User
  error?: string
}> {
  const token = localStorage.getItem("session_token")
  if (!token) {
    return { success: false, error: "未登录" }
  }

  const response = await fetch("/api/auth/me", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })

  return await response.json()
}

/**
 * 登出
 */
export function logout() {
  localStorage.removeItem("session_token")
}
