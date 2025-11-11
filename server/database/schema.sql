-- CapitalFlow 功能需求系统数据库 Schema
-- 创建时间: 2025-01-09

-- 用户表
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT UNIQUE NOT NULL,
  created_at INTEGER NOT NULL,
  last_login INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- 功能需求表
CREATE TABLE IF NOT EXISTS requests (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  user_id INTEGER NOT NULL,
  status TEXT DEFAULT 'pending', -- pending, in_progress, completed, rejected
  vote_count INTEGER DEFAULT 0,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_requests_status ON requests(status);
CREATE INDEX IF NOT EXISTS idx_requests_vote_count ON requests(vote_count DESC);
CREATE INDEX IF NOT EXISTS idx_requests_created_at ON requests(created_at DESC);

-- 投票记录表
CREATE TABLE IF NOT EXISTS votes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  request_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  created_at INTEGER NOT NULL,
  UNIQUE(request_id, user_id),
  FOREIGN KEY (request_id) REFERENCES requests(id),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_votes_request ON votes(request_id);
CREATE INDEX IF NOT EXISTS idx_votes_user ON votes(user_id);

-- Magic Link 令牌表
CREATE TABLE IF NOT EXISTS magic_tokens (
  token TEXT PRIMARY KEY,
  email TEXT NOT NULL,
  expires_at INTEGER NOT NULL,
  created_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_tokens_email ON magic_tokens(email);
CREATE INDEX IF NOT EXISTS idx_tokens_expires ON magic_tokens(expires_at);
