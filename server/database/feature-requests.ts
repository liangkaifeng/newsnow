import type { Database } from "db0"

/**
 * 功能需求系统数据库表类
 */

// 类型定义
export interface User {
  id: number
  email: string
  created_at: number
  last_login: number
}

export interface FeatureRequest {
  id: number
  title: string
  description: string
  user_id: number
  status: "pending" | "in_progress" | "completed" | "rejected"
  vote_count: number
  created_at: number
  updated_at: number
}

export interface Vote {
  id: number
  request_id: number
  user_id: number
  created_at: number
}

export interface MagicToken {
  token: string
  email: string
  expires_at: number
  created_at: number
}

export interface RequestWithUser extends FeatureRequest {
  user_email: string
  has_voted?: boolean
}

/**
 * 功能需求表操作类
 */
export class FeatureRequestTable {
  private db: Database

  constructor(db: Database) {
    this.db = db
  }

  /**
   * 初始化数据库表
   */
  async init() {
    // 用户表
    await this.db.prepare(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT UNIQUE NOT NULL,
        created_at INTEGER NOT NULL,
        last_login INTEGER NOT NULL
      );
    `).run()

    await this.db.prepare(`
      CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
    `).run()

    // 功能需求表
    await this.db.prepare(`
      CREATE TABLE IF NOT EXISTS requests (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        description TEXT NOT NULL,
        user_id INTEGER NOT NULL,
        status TEXT DEFAULT 'pending',
        vote_count INTEGER DEFAULT 0,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users(id)
      );
    `).run()

    await this.db.prepare(`
      CREATE INDEX IF NOT EXISTS idx_requests_status ON requests(status);
    `).run()

    await this.db.prepare(`
      CREATE INDEX IF NOT EXISTS idx_requests_vote_count ON requests(vote_count DESC);
    `).run()

    await this.db.prepare(`
      CREATE INDEX IF NOT EXISTS idx_requests_created_at ON requests(created_at DESC);
    `).run()

    // 投票记录表
    await this.db.prepare(`
      CREATE TABLE IF NOT EXISTS votes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        request_id INTEGER NOT NULL,
        user_id INTEGER NOT NULL,
        created_at INTEGER NOT NULL,
        UNIQUE(request_id, user_id),
        FOREIGN KEY (request_id) REFERENCES requests(id),
        FOREIGN KEY (user_id) REFERENCES users(id)
      );
    `).run()

    await this.db.prepare(`
      CREATE INDEX IF NOT EXISTS idx_votes_request ON votes(request_id);
    `).run()

    await this.db.prepare(`
      CREATE INDEX IF NOT EXISTS idx_votes_user ON votes(user_id);
    `).run()

    // Magic Token 表
    await this.db.prepare(`
      CREATE TABLE IF NOT EXISTS magic_tokens (
        token TEXT PRIMARY KEY,
        email TEXT NOT NULL,
        expires_at INTEGER NOT NULL,
        created_at INTEGER NOT NULL
      );
    `).run()

    await this.db.prepare(`
      CREATE INDEX IF NOT EXISTS idx_tokens_email ON magic_tokens(email);
    `).run()

    await this.db.prepare(`
      CREATE INDEX IF NOT EXISTS idx_tokens_expires ON magic_tokens(expires_at);
    `).run()

    logger.success("Feature request tables initialized")
  }

  /**
   * 获取需求列表
   */
  async getRequests(params: {
    status?: string
    sort?: "votes" | "created"
    limit?: number
    offset?: number
    userId?: number
  }): Promise<{ requests: RequestWithUser[], total: number }> {
    const { status = "all", sort = "votes", limit = 50, offset = 0, userId } = params

    let query = `
      SELECT
        r.*,
        u.email as user_email
        ${userId ? `, EXISTS(SELECT 1 FROM votes WHERE request_id = r.id AND user_id = ?) as has_voted` : ", 0 as has_voted"}
      FROM requests r
      JOIN users u ON r.user_id = u.id
    `

    const queryParams: any[] = userId ? [userId] : []

    if (status !== "all") {
      query += ` WHERE r.status = ?`
      queryParams.push(status)
    }

    query += ` ORDER BY ${sort === "votes" ? "r.vote_count DESC" : "r.created_at DESC"}`
    query += ` LIMIT ? OFFSET ?`
    queryParams.push(limit, offset)

    const requests = (await this.db.prepare(query).bind(...queryParams).all()) as any

    // 获取总数
    let countQuery = "SELECT COUNT(*) as total FROM requests"
    if (status !== "all") {
      countQuery += " WHERE status = ?"
      const countResult = (await this.db.prepare(countQuery).bind(status).get()) as any
      return {
        requests: requests.results || [],
        total: countResult?.total || 0,
      }
    }

    const countResult = (await this.db.prepare(countQuery).get()) as any

    return {
      requests: requests.results || [],
      total: countResult?.total || 0,
    }
  }

  /**
   * 创建需求
   */
  async createRequest(params: {
    title: string
    description: string
    userId: number
  }): Promise<FeatureRequest> {
    const { title, description, userId } = params
    const now = Date.now()

    await this.db.prepare(`
      INSERT INTO requests (title, description, user_id, status, vote_count, created_at, updated_at)
      VALUES (?, ?, ?, 'pending', 0, ?, ?)
    `).run(title, description, userId, now, now)

    logger.success(`Created feature request: ${title}`)

    // 返回新创建的需求（通过标题和用户ID查找，因为是刚创建的）
    const request = (await this.db.prepare(`
      SELECT * FROM requests WHERE title = ? AND user_id = ? ORDER BY created_at DESC LIMIT 1
    `).get(title, userId)) as FeatureRequest

    return request
  }

  /**
   * 投票/取消投票
   */
  async toggleVote(requestId: number, userId: number): Promise<{ voteCount: number, hasVoted: boolean }> {
    // 检查是否已投票
    const existingVote = (await this.db.prepare(`
      SELECT id FROM votes WHERE request_id = ? AND user_id = ?
    `).get(requestId, userId)) as Vote | null

    if (existingVote) {
      // 取消投票
      await this.db.prepare(`
        DELETE FROM votes WHERE request_id = ? AND user_id = ?
      `).run(requestId, userId)

      await this.db.prepare(`
        UPDATE requests SET vote_count = vote_count - 1, updated_at = ? WHERE id = ?
      `).run(Date.now(), requestId)

      logger.success(`User ${userId} unvoted request ${requestId}`)
    } else {
      // 投票
      const now = Date.now()
      await this.db.prepare(`
        INSERT INTO votes (request_id, user_id, created_at)
        VALUES (?, ?, ?)
      `).run(requestId, userId, now)

      await this.db.prepare(`
        UPDATE requests SET vote_count = vote_count + 1, updated_at = ? WHERE id = ?
      `).run(now, requestId)

      logger.success(`User ${userId} voted request ${requestId}`)
    }

    // 获取最新投票数
    const request = (await this.db.prepare(`
      SELECT vote_count FROM requests WHERE id = ?
    `).get(requestId)) as { vote_count: number }

    return {
      voteCount: request.vote_count,
      hasVoted: !existingVote,
    }
  }

  /**
   * 创建或获取用户
   */
  async getOrCreateUser(email: string): Promise<User> {
    // 查找用户
    let user = (await this.db.prepare(`
      SELECT * FROM users WHERE email = ?
    `).get(email)) as User | null

    if (!user) {
      // 创建用户
      const now = Date.now()
      await this.db.prepare(`
        INSERT INTO users (email, created_at, last_login)
        VALUES (?, ?, ?)
      `).run(email, now, now)

      user = (await this.db.prepare(`
        SELECT * FROM users WHERE email = ?
      `).get(email)) as User

      logger.success(`Created user: ${email}`)
    } else {
      // 更新最后登录时间
      await this.db.prepare(`
        UPDATE users SET last_login = ? WHERE id = ?
      `).run(Date.now(), user.id)
    }

    return user
  }

  /**
   * 创建 Magic Token
   */
  async createMagicToken(email: string): Promise<string> {
    const token = crypto.randomUUID()
    const now = Date.now()
    const expiresAt = now + 15 * 60 * 1000 // 15 分钟后过期

    await this.db.prepare(`
      INSERT INTO magic_tokens (token, email, expires_at, created_at)
      VALUES (?, ?, ?, ?)
    `).run(token, email, expiresAt, now)

    logger.success(`Created magic token for: ${email}`)

    return token
  }

  /**
   * 验证 Magic Token
   */
  async verifyMagicToken(token: string): Promise<string | null> {
    const magicToken = (await this.db.prepare(`
      SELECT * FROM magic_tokens WHERE token = ?
    `).get(token)) as MagicToken | null

    if (!magicToken) {
      return null
    }

    // 检查是否过期
    if (Date.now() > magicToken.expires_at) {
      // 删除过期 token
      await this.db.prepare(`
        DELETE FROM magic_tokens WHERE token = ?
      `).run(token)
      return null
    }

    // 删除已使用的 token（一次性使用）
    await this.db.prepare(`
      DELETE FROM magic_tokens WHERE token = ?
    `).run(token)

    logger.success(`Verified magic token for: ${magicToken.email}`)

    return magicToken.email
  }

  /**
   * 清理过期的 Magic Tokens
   */
  async cleanupExpiredTokens() {
    const now = Date.now()
    await this.db.prepare(`
      DELETE FROM magic_tokens WHERE expires_at < ?
    `).run(now)

    logger.success("Cleaned up expired magic tokens")
  }

  /**
   * 检查创建需求的速率限制（3个/天）
   */
  async checkRequestRateLimit(userId: number): Promise<{ allowed: boolean, count: number, limit: number }> {
    const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000

    const result = (await this.db.prepare(`
      SELECT COUNT(*) as count FROM requests
      WHERE user_id = ? AND created_at > ?
    `).get(userId, oneDayAgo)) as { count: number }

    const count = result?.count || 0
    const limit = 3

    return {
      allowed: count < limit,
      count,
      limit,
    }
  }

  /**
   * 检查投票的速率限制（20个/天）
   */
  async checkVoteRateLimit(userId: number): Promise<{ allowed: boolean, count: number, limit: number }> {
    const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000

    const result = (await this.db.prepare(`
      SELECT COUNT(*) as count FROM votes
      WHERE user_id = ? AND created_at > ?
    `).get(userId, oneDayAgo)) as { count: number }

    const count = result?.count || 0
    const limit = 20

    return {
      allowed: count < limit,
      count,
      limit,
    }
  }
}
