const path = require("path");
const express = require("express");
const {
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
} = require("./db");

const app = express();
const schemaReady = ensureSchema().catch((error) => {
  console.error("Neon schema yaratishda xatolik:", error);
  return false;
});

const projectRoot = __dirname;
const publicDir = path.join(projectRoot, "public");

app.disable("x-powered-by");

app.use((_, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  next();
});
app.use(express.json({ limit: "200kb" }));
app.use("/static", express.static(publicDir, { extensions: ["html"] }));

app.get("/", (_, res) => {
  res.sendFile(path.join(publicDir, "index.html"));
});

app.get("/books/:bookId/pdf", async (req, res) => {
  try {
    const book = await getBookById(req.params.bookId);
    if (!book || !book.pdf_filename) {
      return res.status(404).json({ ok: false, message: "Kitob topilmadi" });
    }
    const pdfPath = path.join(projectRoot, book.pdf_filename);
    res.type("application/pdf");
    res.sendFile(pdfPath, (err) => {
      if (err && !res.headersSent) res.status(404).end();
    });
  } catch {
    if (!res.headersSent) res.status(500).json({ ok: false });
  }
});

app.get("/api/health", async (_, res) => {
  const schemaOk = await schemaReady;
  res.json({ ok: true, db: hasDatabase && schemaOk });
});

app.get("/api/books", async (_, res) => {
  try {
    const books = await getBooks();
    res.json({ ok: true, books });
  } catch (err) {
    res.status(500).json({ ok: false, message: err.message });
  }
});

app.get("/api/books/:id", async (req, res) => {
  try {
    const book = await getBookById(req.params.id);
    if (!book) return res.status(404).json({ ok: false, message: "Topilmadi" });
    res.json({ ok: true, book });
  } catch (err) {
    res.status(500).json({ ok: false, message: err.message });
  }
});

app.get("/api/categories", async (_, res) => {
  try {
    const categories = await getCategories();
    res.json({ ok: true, categories });
  } catch (err) {
    res.status(500).json({ ok: false, message: err.message });
  }
});

app.get("/api/categories/:id", async (req, res) => {
  try {
    const books = await getBooksByCategory(Number(req.params.id));
    res.json({ ok: true, books });
  } catch (err) {
    res.status(500).json({ ok: false, message: err.message });
  }
});

app.get("/api/progress", async (req, res) => {
  const { userId, bookId } = req.query;
  const uid = Number(userId);
  if (!Number.isInteger(uid) || uid <= 0) {
    return res.status(400).json({ ok: false, message: "Noto'g'ri userId" });
  }
  if (typeof bookId !== "string" || !bookId.trim()) {
    return res.status(400).json({ ok: false, message: "Noto'g'ri bookId" });
  }
  const page = await getReadingProgress(uid, bookId.trim());
  res.json({ ok: true, page });
});

app.post("/api/progress", async (req, res) => {
  const { userId, bookId, page } = req.body || {};
  const uid = Number(userId);
  const pg = Number(page);
  if (!Number.isInteger(uid) || uid <= 0) {
    return res.status(400).json({ ok: false, message: "Noto'g'ri userId" });
  }
  if (typeof bookId !== "string" || !bookId.trim()) {
    return res.status(400).json({ ok: false, message: "Noto'g'ri bookId" });
  }
  if (!Number.isInteger(pg) || pg <= 0) {
    return res.status(400).json({ ok: false, message: "Noto'g'ri page" });
  }
  const saved = await saveReadingProgress(uid, bookId.trim(), pg);
  res.json({ ok: true, saved });
});

app.get("/api/user/:userId/progress", async (req, res) => {
  const uid = Number(req.params.userId);
  if (!Number.isInteger(uid) || uid <= 0) {
    return res.status(400).json({ ok: false });
  }
  try {
    const progress = await getUserAllProgress(uid);
    res.json({ ok: true, progress });
  } catch (err) {
    res.status(500).json({ ok: false, message: err.message });
  }
});

app.get("/api/user/:userId/favorites", async (req, res) => {
  const uid = Number(req.params.userId);
  if (!Number.isInteger(uid) || uid <= 0) {
    return res.status(400).json({ ok: false });
  }
  try {
    const favorites = await getUserFavorites(uid);
    res.json({ ok: true, favorites });
  } catch (err) {
    res.status(500).json({ ok: false, message: err.message });
  }
});

app.post("/api/favorites/toggle", async (req, res) => {
  const { userId, bookId } = req.body || {};
  const uid = Number(userId);
  if (!Number.isInteger(uid) || uid <= 0 || !bookId) {
    return res.status(400).json({ ok: false });
  }
  try {
    const isFavorite = await toggleFavorite(uid, bookId);
    res.json({ ok: true, isFavorite });
  } catch (err) {
    res.status(500).json({ ok: false, message: err.message });
  }
});

app.get("/api/user/:userId/stats", async (req, res) => {
  const uid = Number(req.params.userId);
  if (!Number.isInteger(uid) || uid <= 0) {
    return res.status(400).json({ ok: false });
  }
  try {
    const stats = await getUserStats(uid);
    res.json({ ok: true, stats });
  } catch (err) {
    res.status(500).json({ ok: false, message: err.message });
  }
});

module.exports = app;
