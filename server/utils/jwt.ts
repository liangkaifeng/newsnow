import { SignJWT, jwtVerify } from "jose"

/**
 * JWT 工具函数
 * 用于 Magic Link 认证系统
 */

export interface JWTPayload {
  userId: number
  email: string
  iat?: number
  exp?: number
}

/**
 * 签名 JWT token
 * @param payload - 要编码的数据
 * @param secret - JWT 密钥
 * @param expiresIn - 过期时间（默认 30 天）
 */
export async function signJWT(
  payload: JWTPayload,
  secret: string,
  expiresIn: string = "30d",
): Promise<string> {
  const encoder = new TextEncoder()
  const jwt = await new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(expiresIn)
    .sign(encoder.encode(secret))

  return jwt
}

/**
 * 验证并解码 JWT token
 * @param token - JWT token
 * @param secret - JWT 密钥
 */
export async function verifyJWT(
  token: string,
  secret: string,
): Promise<JWTPayload> {
  const encoder = new TextEncoder()
  const { payload } = await jwtVerify(token, encoder.encode(secret))

  return payload as JWTPayload
}

/**
 * 从请求头中提取 JWT token
 * @param event - H3 事件对象
 */
export function extractToken(event: any): string | null {
  const authHeader = getHeader(event, "Authorization")
  if (!authHeader)
    return null

  // 支持 "Bearer <token>" 格式
  if (authHeader.startsWith("Bearer ")) {
    return authHeader.substring(7)
  }

  return authHeader
}

/**
 * 从 JWT token 中获取用户信息
 * @param event - H3 事件对象
 * @param secret - JWT 密钥
 */
export async function getUserFromToken(
  event: any,
  secret: string,
): Promise<JWTPayload | null> {
  try {
    const token = extractToken(event)
    if (!token)
      return null

    const payload = await verifyJWT(token, secret)
    return payload
  } catch (error) {
    logger.error("Failed to verify JWT token:", error)
    return null
  }
}
