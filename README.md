# Telegram PDF Reader (Uzbek)

Node.js asosidagi Telegram bot va Mini App. Foydalanuvchi botga kirganda tugma orqali professional PDF o'qish interfeysini ochadi.

## Imkoniyatlar

- Telegram Mini App (WebView) ichida ishlaydi
- `expand()` va `requestFullscreen()` orqali full-screen rejimga o'tishga harakat qiladi
- PDF sahifalarini o'qish: oldingi/keyingi, slider orqali tez o'tish
- Zoom boshqaruvi
- O'qish temalari: tungi, kunduzgi, sepia
- Uzbek tilidagi UI matnlar
- Neon PostgreSQL orqali foydalanuvchi o'qish progressini saqlash

## 1) O'rnatish

```bash
npm install
```

## 2) Environment sozlash

`.env.example` nusxasini `.env` ga ko'chiring va qiymatlarni to'ldiring:

```env
BOT_TOKEN=your_telegram_bot_token
WEBAPP_URL=https://your-public-domain.com
PORT=3000
DATABASE_URL=postgresql://user:password@host/dbname?sslmode=require
```

## 3) Server va botni ishga tushirish

Terminal 1:

```bash
npm run dev
```

Terminal 2:

```bash
npm run bot
```

## 4) BotFather sozlamasi

`@BotFather` orqali:

1. `/mybots` -> botni tanlang
2. `Bot Settings` -> `Menu Button`
3. `Configure menu button`:
   - Text: `Kutubxona`
   - URL: `.env` dagi `WEBAPP_URL`

Shundan keyin foydalanuvchi bot ichidan Mini App'ni ochadi.

## 5) Neon DB

Neon database URL ni `.env` fayliga qo'shing. Server ishga tushganda `reading_progress` jadvali avtomatik yaratiladi.

API:

- `GET /api/progress?userId=...&bookId=...`
- `POST /api/progress` (`{ userId, bookId, page }`)

## 6) Vercel deploy

1. Loyihani Vercel'ga ulang
2. `Environment Variables` ga quyidagilarni kiriting:
   - `BOT_TOKEN`
   - `WEBAPP_URL` (sizning Vercel domeningiz)
   - `DATABASE_URL` (Neon)
3. Deploy qiling
4. `WEBAPP_URL` qiymatini `https://<project>.vercel.app` ga tenglang

`vercel.json` sozlamasi mavjud va barcha route'lar `server.js` ga yo'naltiriladi.

## 7) Local test uchun URL

Telegram Mini App uchun public HTTPS URL kerak bo'ladi.

Masalan `ngrok`:

```bash
ngrok http 3000
```

Chiqqan HTTPS URL ni `.env` dagi `WEBAPP_URL` ga qo'ying.

## 8) PDF fayl

Server quyidagi faylni readerga beradi:

`Nick Bostrom - Superintelligence paths dangers strategies.pdf`

Route:

- `/books/superintelligence.pdf`

## Tuzilma

- `server.js` - Express server, mini app va PDF route
- `db.js` - Neon ulanish va progress query'lari
- `bot.js` - Telegram bot (Telegraf)
- `public/index.html` - Reader UI
- `public/styles.css` - Professional kutubxona dizayni
- `public/app.js` - PDF rendering va interaction logika
- `vercel.json` - Vercel routing
