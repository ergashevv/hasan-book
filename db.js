const { neon } = require("@neondatabase/serverless");

const databaseUrl = process.env.DATABASE_URL;
const hasDatabase = typeof databaseUrl === "string" && databaseUrl.trim().length > 0;
const sql = hasDatabase ? neon(databaseUrl) : null;

async function ensureSchema() {
  if (!sql) {
    return false;
  }

  await sql`
    CREATE TABLE IF NOT EXISTS reading_progress (
      telegram_user_id BIGINT NOT NULL,
      book_id TEXT NOT NULL,
      page INTEGER NOT NULL CHECK (page > 0),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      PRIMARY KEY (telegram_user_id, book_id)
    )
  `;

  return true;
}

async function getReadingProgress(telegramUserId, bookId) {
  if (!sql) {
    return null;
  }

  const rows = await sql`
    SELECT page
    FROM reading_progress
    WHERE telegram_user_id = ${telegramUserId}
      AND book_id = ${bookId}
    LIMIT 1
  `;

  if (!rows[0]) {
    return null;
  }

  return Number(rows[0].page);
}

async function saveReadingProgress(telegramUserId, bookId, page) {
  if (!sql) {
    return false;
  }

  await sql`
    INSERT INTO reading_progress (telegram_user_id, book_id, page, updated_at)
    VALUES (${telegramUserId}, ${bookId}, ${page}, NOW())
    ON CONFLICT (telegram_user_id, book_id)
    DO UPDATE SET
      page = EXCLUDED.page,
      updated_at = NOW()
  `;

  return true;
}

module.exports = {
  hasDatabase,
  ensureSchema,
  getReadingProgress,
  saveReadingProgress,
};
