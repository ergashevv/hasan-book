require("dotenv").config();
const { Telegraf, Markup } = require("telegraf");

const botToken = process.env.BOT_TOKEN;
const webAppUrl =
  process.env.WEBAPP_URL ||
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "");

if (!botToken) {
  throw new Error("BOT_TOKEN topilmadi. .env faylini tekshiring.");
}

if (!webAppUrl) {
  throw new Error("WEBAPP_URL topilmadi. .env faylini tekshiring.");
}

const bot = new Telegraf(botToken);

const openLibraryKeyboard = Markup.inlineKeyboard([
  Markup.button.webApp("Kutubxonani ochish", webAppUrl),
]);

bot.start(async (context) => {
  await context.reply(
    "Assalomu alaykum!\n\n" +
      "Bu bot orqali siz Telegram ichida professional kitob o'qish muhitida PDF kitobni full-screen rejimda o'qishingiz mumkin.",
    openLibraryKeyboard,
  );
});

bot.command("kitob", async (context) => {
  await context.reply(
    "Quyidagi tugma orqali kitobni o'qishni boshlang:",
    openLibraryKeyboard,
  );
});

if (require.main === module) {
  bot.launch().then(() => {
    console.log("Telegram bot ishga tushdi (polling rejim).");
  });
  process.once("SIGINT", () => bot.stop("SIGINT"));
  process.once("SIGTERM", () => bot.stop("SIGTERM"));
}

module.exports = bot;
