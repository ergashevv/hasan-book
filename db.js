const { neon } = require("@neondatabase/serverless");

const databaseUrl = process.env.DATABASE_URL;
const hasDatabase =
  typeof databaseUrl === "string" && databaseUrl.trim().length > 0;
const sql = hasDatabase ? neon(databaseUrl) : null;

async function ensureSchema() {
  if (!sql) return false;

  await sql`
    CREATE TABLE IF NOT EXISTS categories (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      name_uz TEXT NOT NULL,
      icon TEXT NOT NULL DEFAULT 'library',
      color TEXT NOT NULL DEFAULT '#c8a96e',
      sort_order INTEGER NOT NULL DEFAULT 0
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS books (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      author TEXT NOT NULL,
      description TEXT DEFAULT '',
      cover_gradient TEXT DEFAULT 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      category_id INTEGER REFERENCES categories(id),
      pdf_filename TEXT NOT NULL,
      total_pages INTEGER DEFAULT 0,
      language TEXT DEFAULT 'en',
      published_year INTEGER DEFAULT 0,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS reading_progress (
      telegram_user_id BIGINT NOT NULL,
      book_id TEXT NOT NULL,
      page INTEGER NOT NULL CHECK (page > 0),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      PRIMARY KEY (telegram_user_id, book_id)
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS user_favorites (
      telegram_user_id BIGINT NOT NULL,
      book_id TEXT NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      PRIMARY KEY (telegram_user_id, book_id)
    )
  `;

  await seedData();
  return true;
}

async function seedData() {
  await sql`
    INSERT INTO categories (id, name, name_uz, icon, color, sort_order) VALUES
      (1, 'Artificial Intelligence', 'Sun''iy Intellekt', 'cpu', '#6c5ce7', 1),
      (2, 'Science & Technology', 'Fan va Texnologiya', 'flask', '#00b894', 2),
      (3, 'Philosophy', 'Falsafa', 'lightbulb', '#e17055', 3),
      (4, 'Business & Finance', 'Biznes va Moliya', 'briefcase', '#fdcb6e', 4),
      (5, 'History', 'Tarix', 'scroll', '#d63031', 5),
      (6, 'Fiction', 'Badiiy Adabiyot', 'bookOpen', '#0984e3', 6),
      (7, 'Psychology', 'Psixologiya', 'brain', '#a29bfe', 7),
      (8, 'Self-Development', 'O''z-o''zini rivojlantirish', 'target', '#55efc4', 8)
    ON CONFLICT (id) DO UPDATE SET icon = EXCLUDED.icon
  `;

  await sql`SELECT setval('categories_id_seq', GREATEST((SELECT COALESCE(MAX(id), 0) FROM categories), 8))`;

  await sql`
    INSERT INTO books (id, title, author, description, cover_gradient, category_id, pdf_filename, total_pages, language, published_year)
    VALUES (
      'nick-bostrom-superintelligence',
      'Superintelligence: Paths, Dangers, Strategies',
      'Nick Bostrom',
      'Nick Bostrom o''zining mashhur asarida sun''iy superintellekt paydo bo''lishi mumkin bo''lgan kelajakni ko''rib chiqadi. Kitobda mashinalar inson aqlidan oshib ketganda nima sodir bo''lishi, bu texnologiyaning xavf va imkoniyatlari hamda insoniyat qanday tayyorlanishi kerakligi haqida chuqur tahlil berilgan. Oxford universitetining professori tomonidan yozilgan bu asar — zamonaviy falsafa va texnologiyaning eng muhim asarlaridan biri.',
      'linear-gradient(145deg, #0c1024 0%, #1a237e 40%, #311b92 70%, #4a148c 100%)',
      1,
      'Nick Bostrom - Superintelligence paths dangers strategies.pdf',
      352,
      'en',
      2014
    )
    ON CONFLICT (id) DO NOTHING
  `;
}

async function getBooks() {
  if (!sql) return [];
  const rows = await sql`
    SELECT b.*, c.name_uz AS category_name, c.icon AS category_icon, c.color AS category_color
    FROM books b
    LEFT JOIN categories c ON b.category_id = c.id
    ORDER BY b.created_at DESC
  `;
  return rows;
}

async function getBookById(id) {
  if (!sql) return null;
  const rows = await sql`
    SELECT b.*, c.name_uz AS category_name, c.icon AS category_icon, c.color AS category_color
    FROM books b
    LEFT JOIN categories c ON b.category_id = c.id
    WHERE b.id = ${id}
    LIMIT 1
  `;
  return rows[0] || null;
}

async function getCategories() {
  if (!sql) return [];
  const rows = await sql`
    SELECT c.*, COUNT(b.id)::int AS book_count
    FROM categories c
    LEFT JOIN books b ON c.id = b.category_id
    GROUP BY c.id
    ORDER BY c.sort_order
  `;
  return rows;
}

async function getBooksByCategory(categoryId) {
  if (!sql) return [];
  const rows = await sql`
    SELECT b.*, c.name_uz AS category_name, c.icon AS category_icon, c.color AS category_color
    FROM books b
    LEFT JOIN categories c ON b.category_id = c.id
    WHERE b.category_id = ${categoryId}
    ORDER BY b.created_at DESC
  `;
  return rows;
}

async function getReadingProgress(userId, bookId) {
  if (!sql) return null;
  const rows = await sql`
    SELECT page FROM reading_progress
    WHERE telegram_user_id = ${userId} AND book_id = ${bookId}
    LIMIT 1
  `;
  return rows[0] ? Number(rows[0].page) : null;
}

async function saveReadingProgress(userId, bookId, page) {
  if (!sql) return false;
  await sql`
    INSERT INTO reading_progress (telegram_user_id, book_id, page, updated_at)
    VALUES (${userId}, ${bookId}, ${page}, NOW())
    ON CONFLICT (telegram_user_id, book_id)
    DO UPDATE SET page = EXCLUDED.page, updated_at = NOW()
  `;
  return true;
}

async function getUserAllProgress(userId) {
  if (!sql) return [];
  const rows = await sql`
    SELECT book_id, page, updated_at
    FROM reading_progress
    WHERE telegram_user_id = ${userId}
    ORDER BY updated_at DESC
  `;
  return rows;
}

async function getUserFavorites(userId) {
  if (!sql) return [];
  const rows = await sql`
    SELECT b.*, c.name_uz AS category_name, c.icon AS category_icon, c.color AS category_color
    FROM user_favorites uf
    JOIN books b ON uf.book_id = b.id
    LEFT JOIN categories c ON b.category_id = c.id
    WHERE uf.telegram_user_id = ${userId}
    ORDER BY uf.created_at DESC
  `;
  return rows;
}

async function toggleFavorite(userId, bookId) {
  if (!sql) return false;
  const existing = await sql`
    SELECT 1 FROM user_favorites
    WHERE telegram_user_id = ${userId} AND book_id = ${bookId}
    LIMIT 1
  `;
  if (existing.length > 0) {
    await sql`
      DELETE FROM user_favorites
      WHERE telegram_user_id = ${userId} AND book_id = ${bookId}
    `;
    return false;
  }
  await sql`
    INSERT INTO user_favorites (telegram_user_id, book_id)
    VALUES (${userId}, ${bookId})
  `;
  return true;
}

async function getUserStats(userId) {
  if (!sql) return { booksReading: 0, totalPages: 0, favoritesCount: 0 };
  const progressRows = await sql`
    SELECT COUNT(DISTINCT book_id)::int AS books_count,
           COALESCE(SUM(page), 0)::int AS total_pages
    FROM reading_progress
    WHERE telegram_user_id = ${userId}
  `;
  const favRows = await sql`
    SELECT COUNT(*)::int AS fav_count
    FROM user_favorites
    WHERE telegram_user_id = ${userId}
  `;
  return {
    booksReading: Number(progressRows[0]?.books_count || 0),
    totalPages: Number(progressRows[0]?.total_pages || 0),
    favoritesCount: Number(favRows[0]?.fav_count || 0),
  };
}

module.exports = {
  hasDatabase,
  ensureSchema,
  getBooks,
  getBookById,
  getCategories,
  getBooksByCategory,
  getReadingProgress,
  saveReadingProgress,
  getUserAllProgress,
  getUserFavorites,
  toggleFavorite,
  getUserStats,
};
