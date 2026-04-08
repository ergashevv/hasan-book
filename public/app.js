let pdfjsLib = null;

async function loadPdfJs() {
  if (pdfjsLib) return pdfjsLib;
  pdfjsLib = await import(
    "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.4.168/pdf.min.mjs"
  );
  pdfjsLib.GlobalWorkerOptions.workerSrc =
    "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.4.168/pdf.worker.min.mjs";
  return pdfjsLib;
}

/* ═══ Telegram Init ═══ */

const tg = window.Telegram?.WebApp;
if (tg) {
  tg.ready();
  tg.expand();
  tg.setHeaderColor("#0e1117");
  tg.setBackgroundColor("#0e1117");
}

const userId = tg?.initDataUnsafe?.user?.id ?? null;
const userName = tg?.initDataUnsafe?.user?.first_name ?? "Mehmon";
const userLastName = tg?.initDataUnsafe?.user?.last_name ?? "";
const userUsername = tg?.initDataUnsafe?.user?.username ?? null;
const userPhoto = tg?.initDataUnsafe?.user?.photo_url ?? null;

/* ═══ State ═══ */

const store = {
  books: [],
  categories: [],
  favorites: new Set(),
  progress: {},
  loaded: false,
};

/* ═══ DOM ═══ */

const $app = document.getElementById("app");
const $nav = document.getElementById("bottomNav");

/* ═══ Icons ═══ */

const icons = {
  back: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>',
  search: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>',
  heart: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>',
  heartFilled: '<svg width="20" height="20" viewBox="0 0 24 24" fill="#e74c3c" stroke="#e74c3c" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>',
  book: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>',
  chevron: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>',
  moon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>',
  sun: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>',
  scroll: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 21h12a2 2 0 0 0 2-2v-2H10v2a2 2 0 1 1-4 0V5a2 2 0 1 0-4 0v3h4"/><path d="M19 17V5a2 2 0 0 0-2-2H4"/></svg>',
  books: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/><line x1="12" y1="6" x2="12" y2="13"/><line x1="9" y1="13" x2="15" y2="13"/></svg>',
  cpu: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="4" width="16" height="16" rx="2"/><rect x="9" y="9" width="6" height="6"/><line x1="9" y1="1" x2="9" y2="4"/><line x1="15" y1="1" x2="15" y2="4"/><line x1="9" y1="20" x2="9" y2="23"/><line x1="15" y1="20" x2="15" y2="23"/><line x1="20" y1="9" x2="23" y2="9"/><line x1="20" y1="14" x2="23" y2="14"/><line x1="1" y1="9" x2="4" y2="9"/><line x1="1" y1="14" x2="4" y2="14"/></svg>',
  flask: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 3h6v7l5 8a2 2 0 0 1-1.7 3H5.7A2 2 0 0 1 4 18l5-8V3z"/><line x1="9" y1="3" x2="15" y2="3"/></svg>',
  lightbulb: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18h6"/><path d="M10 22h4"/><path d="M12 2a7 7 0 0 0-4 12.7V17h8v-2.3A7 7 0 0 0 12 2z"/></svg>',
  briefcase: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>',
  clock: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>',
  bookOpen: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>',
  brain: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2a5 5 0 0 1 4.5 2.8A4 4 0 0 1 20 8.5a4 4 0 0 1-1 7.3A5 5 0 0 1 12 22a5 5 0 0 1-7-6.2 4 4 0 0 1-1-7.3 4 4 0 0 1 3.5-3.7A5 5 0 0 1 12 2z"/><path d="M12 2v20"/><path d="M8 6c2 1 4 1 8 0"/><path d="M7.5 12H12"/><path d="M16.5 12H12"/></svg>',
  target: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>',
  library: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>',
};

const categoryIconMap = {
  cpu: icons.cpu,
  flask: icons.flask,
  lightbulb: icons.lightbulb,
  briefcase: icons.briefcase,
  scroll: icons.scroll,
  bookOpen: icons.bookOpen,
  brain: icons.brain,
  target: icons.target,
  library: icons.library,
  book: icons.book,
  clock: icons.clock,
  moon: icons.moon,
  sun: icons.sun,
  search: icons.search,
  heart: icons.heart,
};

function getCategoryIcon(iconName, size) {
  const svg = categoryIconMap[iconName] || icons.library;
  if (!size) return svg;
  return svg.replace(/width="\d+"/, `width="${size}"`).replace(/height="\d+"/, `height="${size}"`);
}

/* ═══ Helpers ═══ */

function esc(str) {
  const d = document.createElement("div");
  d.textContent = str;
  return d.innerHTML;
}

function clamp(v, min, max) {
  return Math.min(max, Math.max(min, v));
}

function coverHTML(book, size = "md") {
  return `<div class="book-cover book-cover-${size}" style="background:${book.cover_gradient}">
    <div class="cover-spine"></div>
    <div class="cover-content">
      <span class="cover-author">${esc(book.author)}</span>
      <h3 class="cover-title">${esc(book.title)}</h3>
    </div>
  </div>`;
}

/* ═══ API ═══ */

async function api(url) {
  const r = await fetch(url);
  if (!r.ok) throw new Error(`${r.status}`);
  return r.json();
}

async function apiPost(url, body) {
  const r = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!r.ok) throw new Error(`${r.status}`);
  return r.json();
}

async function loadData() {
  try {
    const [booksRes, catsRes] = await Promise.all([
      api("/api/books"),
      api("/api/categories"),
    ]);
    store.books = booksRes.books || [];
    store.categories = catsRes.categories || [];

    if (userId) {
      const [progRes, favRes] = await Promise.all([
        api(`/api/user/${userId}/progress`),
        api(`/api/user/${userId}/favorites`),
      ]);
      store.progress = {};
      for (const p of progRes.progress || []) {
        store.progress[p.book_id] = Number(p.page);
      }
      store.favorites = new Set(
        (favRes.favorites || []).map((f) => f.id),
      );
    }
    store.loaded = true;
  } catch (err) {
    console.error("Data yuklash xatoligi:", err);
    store.loaded = true;
  }
}

/* ═══ Router ═══ */

const routes = [
  { pattern: "/", render: renderHome },
  { pattern: "/categories", render: renderCategories },
  { pattern: "/category/:id", render: renderCategoryDetail },
  { pattern: "/book/:id", render: renderBookDetail },
  { pattern: "/read/:id", render: renderReader },
  { pattern: "/profile", render: renderProfile },
];

function matchRoute(pattern, path) {
  const names = [];
  const re = pattern.replace(/:(\w+)/g, (_, n) => {
    names.push(n);
    return "([^/]+)";
  });
  const m = path.match(new RegExp(`^${re}$`));
  if (!m) return null;
  const params = {};
  names.forEach((n, i) => (params[n] = decodeURIComponent(m[i + 1])));
  return params;
}

function navigate(path) {
  window.location.hash = path;
}

function handleRoute() {
  destroyReader();
  window.scrollTo(0, 0);
  const hash = window.location.hash.slice(1) || "/";

  for (const route of routes) {
    const params = matchRoute(route.pattern, hash);
    if (params !== null) {
      route.render(params);
      updateNav(hash);
      updateBackButton(hash);
      return;
    }
  }
  renderHome({});
  updateNav("/");
  updateBackButton("/");
}

function updateNav(path) {
  const isReader = path.startsWith("/read/");
  $nav.style.display = isReader ? "none" : "flex";

  $nav.querySelectorAll(".nav-item").forEach((item) => {
    const href = item.getAttribute("href").slice(1);
    const active = path === href || (href === "/" && path === "/");
    item.classList.toggle("active", active);
  });
}

function updateBackButton(path) {
  if (!tg) return;
  const inner =
    path.startsWith("/book/") ||
    path.startsWith("/read/") ||
    path.startsWith("/category/");
  if (inner) tg.BackButton.show();
  else tg.BackButton.hide();
}

window.addEventListener("hashchange", handleRoute);

if (tg?.BackButton) {
  tg.BackButton.onClick(() => history.back());
}

/* ═══ Home Page ═══ */

function renderHome() {
  const booksHTML = store.books
    .map(
      (b) => `<div class="book-card" data-id="${b.id}">
      ${coverHTML(b)}
      <div class="book-info">
        <h4>${esc(b.title)}</h4>
        <p>${esc(b.author)}</p>
      </div>
    </div>`,
    )
    .join("");

  const catsHTML = store.categories
    .map(
      (c) => `<div class="category-chip" data-id="${c.id}">
      <span class="chip-icon">${getCategoryIcon(c.icon)}</span>
      <span class="chip-name">${esc(c.name_uz)}</span>
      ${Number(c.book_count) > 0 ? `<span class="chip-count">${c.book_count}</span>` : ""}
    </div>`,
    )
    .join("");

  const readingBooks = store.books.filter((b) => store.progress[b.id]);
  let continueHTML = "";
  if (readingBooks.length > 0) {
    continueHTML = `<div class="section">
      <div class="section-header"><h3>Davom ettirish</h3></div>
      ${readingBooks
        .map((b) => {
          const pg = store.progress[b.id] || 1;
          const pct =
            b.total_pages > 0 ? Math.round((pg / b.total_pages) * 100) : 0;
          return `<div class="continue-card" data-id="${b.id}">
          ${coverHTML(b, "sm")}
          <div class="continue-info">
            <h4>${esc(b.title)}</h4>
            <p>${esc(b.author)}</p>
            <div class="progress-track"><div class="progress-fill" style="width:${pct}%"></div></div>
            <span class="progress-text">Sahifa ${pg} / ${b.total_pages} · ${pct}%</span>
          </div>
        </div>`;
        })
        .join("")}
    </div>`;
  }

  $app.innerHTML = `<div class="page page-home">
    <div class="search-container">
      <div class="search-bar">
        ${icons.search}
        <input type="text" id="searchInput" placeholder="Kitob qidirish..." />
      </div>
    </div>
    <div class="welcome-section">
      <h2>Xush kelibsiz, ${esc(userName)}</h2>
      <p>Bugun nima o'qiymiz?</p>
    </div>
    ${continueHTML}
    <div class="section">
      <div class="section-header">
        <h3>Turkumlar</h3>
        <a href="#/categories" class="see-all">Barchasi</a>
      </div>
      <div class="categories-scroll">${catsHTML}</div>
    </div>
    <div class="section">
      <div class="section-header"><h3>Barcha kitoblar</h3></div>
      <div class="books-grid" id="booksGrid">${booksHTML}</div>
      ${store.books.length === 0 ? `<div class="empty-state"><div class="empty-icon">${getCategoryIcon("library", 48)}</div><h3>Hozircha kitob mavjud emas</h3><p>Tez orada kitoblar qo'shiladi</p></div>` : ""}
    </div>
  </div>`;

  $app.querySelectorAll(".book-card").forEach((el) =>
    el.addEventListener("click", () => navigate(`/book/${el.dataset.id}`)),
  );
  $app.querySelectorAll(".continue-card").forEach((el) =>
    el.addEventListener("click", () => navigate(`/read/${el.dataset.id}`)),
  );
  $app.querySelectorAll(".category-chip").forEach((el) =>
    el.addEventListener("click", () =>
      navigate(`/category/${el.dataset.id}`),
    ),
  );

  const searchInput = document.getElementById("searchInput");
  if (searchInput) {
    searchInput.addEventListener("input", (e) => {
      const q = e.target.value.toLowerCase().trim();
      $app.querySelectorAll(".book-card").forEach((card) => {
        const book = store.books.find((b) => b.id === card.dataset.id);
        if (!book) return;
        const match =
          !q ||
          book.title.toLowerCase().includes(q) ||
          book.author.toLowerCase().includes(q);
        card.style.display = match ? "" : "none";
      });
    });
  }
}

/* ═══ Categories Page ═══ */

function renderCategories() {
  $app.innerHTML = `<div class="page page-categories">
    <div class="page-header">
      <h2>Turkumlar</h2>
      <p>Qiziqishingizga mos turkumni tanlang</p>
    </div>
    <div class="categories-grid">
      ${store.categories
        .map(
          (c) => `<div class="category-card" data-id="${c.id}" style="--cat-color:${c.color}">
          <div class="category-icon-large">${getCategoryIcon(c.icon, 36)}</div>
          <h3>${esc(c.name_uz)}</h3>
          <p>${Number(c.book_count) || 0} kitob</p>
        </div>`,
        )
        .join("")}
    </div>
  </div>`;

  $app.querySelectorAll(".category-card").forEach((el) =>
    el.addEventListener("click", () =>
      navigate(`/category/${el.dataset.id}`),
    ),
  );
}

/* ═══ Category Detail ═══ */

function renderCategoryDetail({ id }) {
  const cat = store.categories.find((c) => String(c.id) === String(id));
  const books = store.books.filter(
    (b) => String(b.category_id) === String(id),
  );

  $app.innerHTML = `<div class="page page-category-detail">
    <div class="page-header page-header-with-back">
      <button class="back-btn" id="backBtn">${icons.back}</button>
      <div>
        <h2>${cat ? `<span class="inline-icon">${getCategoryIcon(cat.icon)}</span> ${esc(cat.name_uz)}` : "Turkum"}</h2>
        <p>${books.length} kitob</p>
      </div>
    </div>
    ${
      books.length > 0
        ? `<div class="books-grid">${books
            .map(
              (b) => `<div class="book-card" data-id="${b.id}">
              ${coverHTML(b)}
              <div class="book-info">
                <h4>${esc(b.title)}</h4>
                <p>${esc(b.author)}</p>
              </div>
            </div>`,
            )
            .join("")}</div>`
        : `<div class="empty-state">
          <div class="empty-icon">${getCategoryIcon("library", 48)}</div>
          <h3>Hozircha kitob mavjud emas</h3>
          <p>Bu turkumga tez orada kitoblar qo'shiladi</p>
        </div>`
    }
  </div>`;

  document
    .getElementById("backBtn")
    ?.addEventListener("click", () => history.back());
  $app.querySelectorAll(".book-card").forEach((el) =>
    el.addEventListener("click", () => navigate(`/book/${el.dataset.id}`)),
  );
}

/* ═══ Book Detail Page ═══ */

function renderBookDetail({ id }) {
  const book = store.books.find((b) => b.id === id);
  if (!book) {
    $app.innerHTML =
      '<div class="page"><div class="empty-state"><h3>Kitob topilmadi</h3></div></div>';
    return;
  }

  const cat = store.categories.find(
    (c) => Number(c.id) === Number(book.category_id),
  );
  const pg = store.progress[book.id];
  const isFav = store.favorites.has(book.id);
  const pct =
    pg && book.total_pages > 0
      ? Math.round((pg / book.total_pages) * 100)
      : 0;

  $app.innerHTML = `<div class="page page-book-detail">
    <div class="detail-header">
      <button class="back-btn" id="backBtn">${icons.back}</button>
      <button class="fav-btn ${isFav ? "active" : ""}" id="favBtn">
        ${isFav ? icons.heartFilled : icons.heart}
      </button>
    </div>
    <div class="detail-cover-section">${coverHTML(book, "lg")}</div>
    <div class="detail-info">
      <h1>${esc(book.title)}</h1>
      <p class="detail-author">${esc(book.author)}</p>
      <div class="detail-badges">
        ${cat ? `<span class="badge" style="--badge-color:${cat.color}">${getCategoryIcon(cat.icon)} ${esc(cat.name_uz)}</span>` : ""}
        <span class="badge">${book.total_pages} sahifa</span>
        <span class="badge">${book.language === "en" ? "English" : "O'zbek"}</span>
        ${book.published_year ? `<span class="badge">${book.published_year}</span>` : ""}
      </div>
      ${
        pg
          ? `<div class="detail-progress">
          <div class="progress-track"><div class="progress-fill" style="width:${pct}%"></div></div>
          <span class="progress-text">Sahifa ${pg} / ${book.total_pages} · ${pct}%</span>
        </div>`
          : ""
      }
      ${
        book.description
          ? `<div class="detail-description">
          <h3>Kitob haqida</h3>
          <p>${esc(book.description)}</p>
        </div>`
          : ""
      }
    </div>
    <div class="detail-actions">
      <button class="btn-primary" id="readBtn">
        ${pg ? "Davom ettirish" : "O'qishni boshlash"}
      </button>
    </div>
  </div>`;

  document
    .getElementById("backBtn")
    .addEventListener("click", () => history.back());
  document
    .getElementById("readBtn")
    .addEventListener("click", () => navigate(`/read/${book.id}`));
  document.getElementById("favBtn").addEventListener("click", async () => {
    if (!userId) return;
    try {
      const res = await apiPost("/api/favorites/toggle", {
        userId,
        bookId: book.id,
      });
      if (res.isFavorite) store.favorites.add(book.id);
      else store.favorites.delete(book.id);
      renderBookDetail({ id });
    } catch (e) {
      console.error(e);
    }
  });
}

/* ═══ Reader ═══ */

let reader = {
  pdf: null,
  page: 1,
  totalPages: 0,
  zoom: 1,
  rendering: false,
  queued: null,
  themeIdx: 0,
  bookId: null,
  controlsVisible: true,
  saveTimer: null,
  touchStartX: 0,
  touchStartY: 0,
};

const readerThemes = ["night", "day", "sepia"];
const themeIcons = [icons.moon, icons.sun, icons.scroll];

function destroyReader() {
  if (reader.saveTimer) clearTimeout(reader.saveTimer);
  if (reader.pdf && tg) {
    if (typeof tg.exitFullscreen === "function") {
      try { tg.exitFullscreen(); } catch {}
    }
    if (typeof tg.enableVerticalSwipes === "function") {
      try { tg.enableVerticalSwipes(); } catch {}
    }
  }
  reader.pdf = null;
  reader.bookId = null;
  reader.page = 1;
  reader.totalPages = 0;
  reader.zoom = 1;
  reader.rendering = false;
  reader.queued = null;
  reader.controlsVisible = true;
}

async function renderReader({ id }) {
  const book = store.books.find((b) => b.id === id);
  if (!book) return;

  reader.bookId = id;
  reader.themeIdx = 0;

  if (tg) {
    tg.setHeaderColor("#0a0c14");
    tg.setBackgroundColor("#0a0c14");
  }

  $app.innerHTML = `<div class="page page-reader" data-theme="night" id="readerPage">
    <div class="reader-header" id="readerHeader">
      <button class="reader-back" id="readerBack">${icons.back}</button>
      <div class="reader-title">
        <h4>${esc(book.title)}</h4>
        <span id="readerPageLabel">Yuklanmoqda...</span>
      </div>
      <div class="reader-actions">
        <button class="reader-theme-btn" id="readerThemeBtn" aria-label="Tema">${themeIcons[0]}</button>
      </div>
    </div>
    <div class="reader-canvas-container" id="readerContainer">
      <div class="reader-loading" id="readerLoading">
        <div class="loading-spinner"></div>
      </div>
      <canvas id="readerCanvas" style="display:none"></canvas>
    </div>
    <div class="reader-controls" id="readerControls">
      <div class="reader-progress-bar">
        <input type="range" id="readerSlider" min="1" max="1" value="1" />
      </div>
      <div class="reader-btns">
        <button id="readerPrev" disabled><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg> Oldingi</button>
        <span id="readerPercent">0%</span>
        <button id="readerNext" disabled>Keyingi <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg></button>
      </div>
      <div class="reader-zoom-btns">
        <button id="readerZoomOut">A−</button>
        <button id="readerZoomIn">A+</button>
        <span id="readerZoomLabel">100%</span>
      </div>
    </div>
  </div>`;

  const canvas = document.getElementById("readerCanvas");
  const ctx = canvas.getContext("2d", { alpha: false });
  const loading = document.getElementById("readerLoading");
  const pageLabel = document.getElementById("readerPageLabel");
  const slider = document.getElementById("readerSlider");
  const pctLabel = document.getElementById("readerPercent");
  const zoomLabel = document.getElementById("readerZoomLabel");
  const prevBtn = document.getElementById("readerPrev");
  const nextBtn = document.getElementById("readerNext");
  const container = document.getElementById("readerContainer");
  const readerPage = document.getElementById("readerPage");

  function updateUI() {
    pageLabel.textContent = `Sahifa ${reader.page} / ${reader.totalPages}`;
    const pct =
      reader.totalPages > 0
        ? Math.round((reader.page / reader.totalPages) * 100)
        : 0;
    pctLabel.textContent = `${pct}%`;
    zoomLabel.textContent = `${Math.round(reader.zoom * 100)}%`;
    slider.max = String(Math.max(1, reader.totalPages));
    slider.value = String(reader.page);
    prevBtn.disabled = reader.page <= 1;
    nextBtn.disabled = reader.page >= reader.totalPages;
  }

  async function renderPdfPage(num) {
    if (!reader.pdf) return;
    reader.rendering = true;
    const page = await reader.pdf.getPage(num);
    const iv = page.getViewport({ scale: 1 });
    const aw = Math.max(280, container.clientWidth - 16);
    const ah = container.clientHeight - 16;
    const fitScaleW = aw / iv.width;
    const fitScaleH = ah / iv.height;
    const fitScale = Math.min(fitScaleW, fitScaleH);
    const scale = fitScale * reader.zoom;
    const dpr = window.devicePixelRatio || 1;

    const cssVp = page.getViewport({ scale });
    const hiResVp = page.getViewport({ scale: scale * dpr });

    canvas.width = Math.floor(hiResVp.width);
    canvas.height = Math.floor(hiResVp.height);
    canvas.style.width = Math.floor(cssVp.width) + "px";
    canvas.style.height = Math.floor(cssVp.height) + "px";
    ctx.setTransform(1, 0, 0, 1, 0, 0);

    await page.render({ canvasContext: ctx, viewport: hiResVp }).promise;

    loading.style.display = "none";
    canvas.style.display = "block";
    reader.rendering = false;
    updateUI();
    container.scrollTo({ top: 0, behavior: "instant" });

    if (reader.queued !== null) {
      const q = reader.queued;
      reader.queued = null;
      await renderPdfPage(q);
    }
  }

  function queueRender(num) {
    if (reader.rendering) {
      reader.queued = num;
      return;
    }
    renderPdfPage(num).catch(console.error);
  }

  function goPage(num) {
    if (!reader.pdf) return;
    reader.page = clamp(num, 1, reader.totalPages);
    queueRender(reader.page);
    scheduleProgressSave();
  }

  function scheduleProgressSave() {
    if (!userId || !reader.bookId) return;
    if (reader.saveTimer) clearTimeout(reader.saveTimer);
    reader.saveTimer = setTimeout(() => {
      store.progress[reader.bookId] = reader.page;
      apiPost("/api/progress", {
        userId,
        bookId: reader.bookId,
        page: reader.page,
      }).catch(console.error);
    }, 600);
  }

  function toggleControls() {
    reader.controlsVisible = !reader.controlsVisible;
    document
      .getElementById("readerHeader")
      ?.classList.toggle("hidden", !reader.controlsVisible);
    document
      .getElementById("readerControls")
      ?.classList.toggle("hidden", !reader.controlsVisible);
  }

  function rotateTheme() {
    reader.themeIdx = (reader.themeIdx + 1) % readerThemes.length;
    readerPage.dataset.theme = readerThemes[reader.themeIdx];
    document.getElementById("readerThemeBtn").innerHTML =
      themeIcons[reader.themeIdx];
  }

  document.getElementById("readerBack").addEventListener("click", () => {
    if (tg) {
      tg.setHeaderColor("#0e1117");
      tg.setBackgroundColor("#0e1117");
      if (typeof tg.exitFullscreen === "function") {
        try { tg.exitFullscreen(); } catch {}
      }
      if (typeof tg.enableVerticalSwipes === "function") {
        try { tg.enableVerticalSwipes(); } catch {}
      }
    }
    history.back();
  });

  prevBtn.addEventListener("click", () => goPage(reader.page - 1));
  nextBtn.addEventListener("click", () => goPage(reader.page + 1));
  slider.addEventListener("input", (e) => goPage(Number(e.target.value)));

  document.getElementById("readerZoomIn").addEventListener("click", () => {
    reader.zoom = clamp(reader.zoom + 0.15, 0.5, 3);
    queueRender(reader.page);
  });
  document.getElementById("readerZoomOut").addEventListener("click", () => {
    reader.zoom = clamp(reader.zoom - 0.15, 0.5, 3);
    queueRender(reader.page);
  });

  document
    .getElementById("readerThemeBtn")
    .addEventListener("click", rotateTheme);

  container.addEventListener("click", (e) => {
    if (e.target === canvas || e.target === container) {
      const rect = container.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const w = rect.width;
      if (x < w * 0.25) goPage(reader.page - 1);
      else if (x > w * 0.75) goPage(reader.page + 1);
      else toggleControls();
    }
  });

  container.addEventListener("touchstart", (e) => {
    reader.touchStartX = e.touches[0].clientX;
    reader.touchStartY = e.touches[0].clientY;
  }, { passive: true });

  container.addEventListener("touchend", (e) => {
    const dx = e.changedTouches[0].clientX - reader.touchStartX;
    const dy = e.changedTouches[0].clientY - reader.touchStartY;
    if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.5) {
      if (dx > 0) goPage(reader.page - 1);
      else goPage(reader.page + 1);
    }
  }, { passive: true });

  window.addEventListener("keydown", function readerKeys(e) {
    if (!reader.pdf) {
      window.removeEventListener("keydown", readerKeys);
      return;
    }
    if (e.key === "ArrowRight") goPage(reader.page + 1);
    if (e.key === "ArrowLeft") goPage(reader.page - 1);
  });

  let resizeTimer = null;
  const onResize = () => {
    if (!reader.pdf) return;
    if (resizeTimer) clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => queueRender(reader.page), 150);
  };
  window.addEventListener("resize", onResize);

  try {
    const pdfLib = await loadPdfJs();
    const pdfUrl = `/books/${book.id}/pdf`;

    const checkResp = await fetch(pdfUrl, { method: "HEAD" });
    if (!checkResp.ok) {
      throw new Error(`Server ${checkResp.status} qaytardi`);
    }

    const task = pdfLib.getDocument(pdfUrl);
    reader.pdf = await task.promise;
    reader.totalPages = reader.pdf.numPages;

    let startPage = 1;
    if (store.progress[book.id]) {
      startPage = store.progress[book.id];
    } else if (userId) {
      try {
        const res = await api(
          `/api/progress?userId=${userId}&bookId=${book.id}`,
        );
        if (res.page) startPage = res.page;
      } catch {}
    }
    reader.page = clamp(startPage, 1, reader.totalPages);
    updateUI();
    await renderPdfPage(reader.page);

    if (tg) {
      if (typeof tg.requestFullscreen === "function") {
        try { tg.requestFullscreen(); } catch {}
      }
      if (typeof tg.disableVerticalSwipes === "function") {
        try { tg.disableVerticalSwipes(); } catch {}
      }
    }
  } catch (err) {
    console.error("PDF yuklash xatoligi:", err);
    loading.innerHTML = `<div style="text-align:center;padding:20px">
      <p style="color:#c75050;margin-bottom:12px">PDF yuklanmadi</p>
      <p style="color:#888;font-size:13px;margin-bottom:16px">${esc(err.message || "Noma'lum xatolik")}</p>
      <button onclick="location.reload()" style="background:#2563eb;color:#fff;border:none;padding:10px 24px;border-radius:8px;font-size:14px;cursor:pointer">Qayta urinish</button>
    </div>`;
  }
}

/* ═══ Profile Page ═══ */

async function renderProfile() {
  let stats = { booksReading: 0, totalPages: 0, favoritesCount: 0 };
  let favBooks = [];

  if (userId) {
    try {
      const [statsRes, favRes] = await Promise.all([
        api(`/api/user/${userId}/stats`),
        api(`/api/user/${userId}/favorites`),
      ]);
      stats = statsRes.stats || stats;
      favBooks = favRes.favorites || [];
    } catch (e) {
      console.error(e);
    }
  }

  const initials = (userName[0] || "M").toUpperCase();

  $app.innerHTML = `<div class="page page-profile">
    <div class="profile-header">
      <div class="profile-avatar">
        ${userPhoto ? `<img src="${esc(userPhoto)}" alt="" />` : initials}
      </div>
      <h2>${esc(userName)} ${esc(userLastName)}</h2>
      ${userUsername ? `<p>@${esc(userUsername)}</p>` : '<p>Telegram orqali kirgan</p>'}
    </div>

    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-value">${stats.booksReading}</div>
        <div class="stat-label">Kitoblar</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">${stats.totalPages}</div>
        <div class="stat-label">Sahifalar</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">${stats.favoritesCount}</div>
        <div class="stat-label">Sevimli</div>
      </div>
    </div>

    ${
      favBooks.length > 0
        ? `<div class="profile-section">
        <h3>Sevimli kitoblar</h3>
        <div class="profile-fav-list">
          ${favBooks
            .map(
              (b) => `<div class="fav-item" data-id="${b.id}">
              <div class="fav-item-cover" style="background:${b.cover_gradient}">
                <div class="cover-spine"></div>
              </div>
              <div class="fav-item-info">
                <h4>${esc(b.title)}</h4>
                <p>${esc(b.author)}</p>
              </div>
            </div>`,
            )
            .join("")}
        </div>
      </div>`
        : ""
    }

    <div class="profile-section">
      <h3>Sozlamalar</h3>
      <div class="settings-list">
        <div class="settings-item" id="settingTheme">
          <span class="settings-item-label">${icons.moon} Kitob o'qish rejimi</span>
          <span class="settings-item-value">Tungi ${icons.chevron}</span>
        </div>
        <div class="settings-item" id="settingAbout">
          <span class="settings-item-label">${icons.book} Kutubxona haqida</span>
          <span class="settings-item-value">${icons.chevron}</span>
        </div>
      </div>
    </div>
  </div>`;

  $app.querySelectorAll(".fav-item").forEach((el) =>
    el.addEventListener("click", () => navigate(`/book/${el.dataset.id}`)),
  );
}

/* ═══ Boot ═══ */

async function boot() {
  await loadData();
  handleRoute();
}

boot().catch(console.error);
