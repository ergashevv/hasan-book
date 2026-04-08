const path = require("path");
const express = require("express");
require("dotenv").config();
const {
  hasDatabase,
  ensureSchema,
  getReadingProgress,
  saveReadingProgress,
} = require("./db");

const app = express();
const port = Number(process.env.PORT || 3000);
const schemaReady = ensureSchema().catch((error) => {
  console.error("Neon schema yaratishda xatolik:", error);
  return false;
});

const projectRoot = __dirname;
const publicDir = path.join(projectRoot, "public");
const sourcePdfPath = path.join(
  projectRoot,
  "Nick Bostrom - Superintelligence paths dangers strategies.pdf",
);

app.disable("x-powered-by");

app.use((_, response, next) => {
  response.setHeader("X-Content-Type-Options", "nosniff");
  response.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  next();
});
app.use(express.json({ limit: "200kb" }));

app.use("/static", express.static(publicDir, { extensions: ["html"] }));

app.get("/", (_, response) => {
  response.sendFile(path.join(publicDir, "index.html"));
});

app.get("/books/superintelligence.pdf", (_, response) => {
  response.type("application/pdf");
  response.sendFile(sourcePdfPath);
});

app.get("/api/health", async (_, response) => {
  const schemaOk = await schemaReady;
  response.json({ ok: true, db: hasDatabase && schemaOk });
});

app.get("/api/progress", async (request, response) => {
  const { userId, bookId } = request.query;
  const parsedUserId = Number(userId);

  if (!Number.isInteger(parsedUserId) || parsedUserId <= 0) {
    response.status(400).json({ ok: false, message: "Noto'g'ri userId" });
    return;
  }

  if (typeof bookId !== "string" || bookId.trim().length === 0) {
    response.status(400).json({ ok: false, message: "Noto'g'ri bookId" });
    return;
  }

  const page = await getReadingProgress(parsedUserId, bookId.trim());
  response.json({ ok: true, page });
});

app.post("/api/progress", async (request, response) => {
  if (!Object.hasOwn(request, "body") || request.body === null) {
    response.status(400).json({ ok: false, message: "Body topilmadi" });
    return;
  }

  const { userId, bookId, page } = request.body;
  const parsedUserId = Number(userId);
  const parsedPage = Number(page);

  if (!Number.isInteger(parsedUserId) || parsedUserId <= 0) {
    response.status(400).json({ ok: false, message: "Noto'g'ri userId" });
    return;
  }

  if (typeof bookId !== "string" || bookId.trim().length === 0) {
    response.status(400).json({ ok: false, message: "Noto'g'ri bookId" });
    return;
  }

  if (!Number.isInteger(parsedPage) || parsedPage <= 0) {
    response.status(400).json({ ok: false, message: "Noto'g'ri page" });
    return;
  }

  const saved = await saveReadingProgress(parsedUserId, bookId.trim(), parsedPage);
  response.json({ ok: true, saved });
});

module.exports = app;

if (require.main === module) {
  app.listen(port, () => {
    console.log(`Server ishga tushdi: http://localhost:${port}`);
  });
}
