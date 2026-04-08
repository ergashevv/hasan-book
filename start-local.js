require("dotenv").config();
const app = require("./server");
const bot = require("./bot");

const port = Number(process.env.PORT || 3000);

app.listen(port, () => {
  console.log(`Server ishga tushdi: http://localhost:${port}`);

  if (process.env.BOT_TOKEN) {
    bot.launch().then(() => {
      console.log("Telegram bot ishga tushdi (polling rejim).");
    }).catch((err) => {
      console.error("Bot ishga tushmadi:", err.message);
    });
  }
});

process.once("SIGINT", () => { bot.stop("SIGINT"); process.exit(); });
process.once("SIGTERM", () => { bot.stop("SIGTERM"); process.exit(); });
