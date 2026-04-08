import * as pdfjsLib from "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.4.168/pdf.min.mjs";

pdfjsLib.GlobalWorkerOptions.workerSrc =
  "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.4.168/pdf.worker.min.mjs";

const telegram = window.Telegram?.WebApp;
if (telegram) {
  telegram.ready();
  telegram.expand();
  if (typeof telegram.requestFullscreen === "function") {
    telegram.requestFullscreen();
  }
  telegram.setHeaderColor("#0a0c14");
  telegram.setBackgroundColor("#0a0c14");
}

const state = {
  pdf: null,
  page: 1,
  pages: 0,
  zoom: 1,
  rendering: false,
  queuedPage: null,
  themeIndex: 0,
};

const themeOrder = ["night", "day", "sepia"];

const canvas = document.querySelector("#pageCanvas");
const context = canvas.getContext("2d", { alpha: false });
const pageLabel = document.querySelector("#pageLabel");
const loadingState = document.querySelector("#loadingState");
const pageSlider = document.querySelector("#pageSlider");
const zoomLabel = document.querySelector("#zoomLabel");

const prevBtn = document.querySelector("#prevBtn");
const nextBtn = document.querySelector("#nextBtn");
const zoomInBtn = document.querySelector("#zoomInBtn");
const zoomOutBtn = document.querySelector("#zoomOutBtn");
const themeBtn = document.querySelector("#themeBtn");
const fullscreenBtn = document.querySelector("#fullscreenBtn");

const PDF_URL = "/books/superintelligence.pdf";
const BOOK_ID = "nick-bostrom-superintelligence";
const telegramUserId = telegram?.initDataUnsafe?.user?.id ?? null;
let persistTimeout = null;

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function updateMeta() {
  pageLabel.textContent = `Sahifa: ${state.page} / ${state.pages}`;
  zoomLabel.textContent = `${Math.round(state.zoom * 100)}%`;
  pageSlider.max = String(Math.max(1, state.pages));
  pageSlider.value = String(state.page);

  prevBtn.disabled = state.page <= 1;
  nextBtn.disabled = state.page >= state.pages;
}

async function renderPage(pageNumber) {
  if (!state.pdf) {
    return;
  }

  state.rendering = true;
  const page = await state.pdf.getPage(pageNumber);

  const initialViewport = page.getViewport({ scale: 1 });
  const availableWidth = Math.max(320, window.innerWidth - 56);
  const fitScale = availableWidth / initialViewport.width;
  const renderScale = fitScale * state.zoom;
  const viewport = page.getViewport({ scale: renderScale });

  canvas.width = Math.floor(viewport.width);
  canvas.height = Math.floor(viewport.height);
  canvas.style.filter = "saturate(0.96)";

  await page.render({ canvasContext: context, viewport }).promise;
  loadingState.style.display = "none";
  state.rendering = false;
  updateMeta();

  if (state.queuedPage !== null) {
    const queuedPage = state.queuedPage;
    state.queuedPage = null;
    await renderPage(queuedPage);
  }
}

function queueRender(pageNumber) {
  if (state.rendering) {
    state.queuedPage = pageNumber;
    return;
  }
  void renderPage(pageNumber);
}

function goToPage(pageNumber) {
  if (!state.pdf) {
    return;
  }
  state.page = clamp(pageNumber, 1, state.pages);
  queueRender(state.page);
  scheduleProgressSave();
}

function rotateTheme() {
  state.themeIndex = (state.themeIndex + 1) % themeOrder.length;
  const nextTheme = themeOrder[state.themeIndex];
  document.body.dataset.theme = nextTheme;
}

prevBtn.addEventListener("click", () => goToPage(state.page - 1));
nextBtn.addEventListener("click", () => goToPage(state.page + 1));

pageSlider.addEventListener("input", (event) => {
  const value = Number(event.target.value);
  goToPage(value);
});

zoomInBtn.addEventListener("click", () => {
  state.zoom = clamp(state.zoom + 0.1, 0.7, 2.5);
  queueRender(state.page);
});

zoomOutBtn.addEventListener("click", () => {
  state.zoom = clamp(state.zoom - 0.1, 0.7, 2.5);
  queueRender(state.page);
});

themeBtn.addEventListener("click", rotateTheme);

fullscreenBtn.addEventListener("click", async () => {
  if (telegram && typeof telegram.requestFullscreen === "function") {
    telegram.requestFullscreen();
    return;
  }
  if (document.fullscreenElement) {
    await document.exitFullscreen();
    return;
  }
  await document.documentElement.requestFullscreen();
});

window.addEventListener("keydown", (event) => {
  if (event.key === "ArrowRight") {
    goToPage(state.page + 1);
  }
  if (event.key === "ArrowLeft") {
    goToPage(state.page - 1);
  }
});

let resizeTimeout = null;
window.addEventListener("resize", () => {
  if (resizeTimeout) {
    clearTimeout(resizeTimeout);
  }
  resizeTimeout = setTimeout(() => queueRender(state.page), 120);
});

async function loadProgressFromServer() {
  if (!telegramUserId) {
    return 1;
  }

  try {
    const query = new URLSearchParams({
      userId: String(telegramUserId),
      bookId: BOOK_ID,
    });
    const response = await fetch(`/api/progress?${query.toString()}`);
    if (!response.ok) {
      return 1;
    }
    const data = await response.json();
    if (!data || typeof data.page !== "number") {
      return 1;
    }
    return data.page;
  } catch (error) {
    console.error("Progress yuklash xatoligi:", error);
    return 1;
  }
}

function scheduleProgressSave() {
  if (!telegramUserId) {
    return;
  }

  if (persistTimeout) {
    clearTimeout(persistTimeout);
  }

  persistTimeout = setTimeout(() => {
    void saveProgressToServer();
  }, 700);
}

async function saveProgressToServer() {
  if (!telegramUserId) {
    return;
  }

  try {
    await fetch("/api/progress", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        userId: telegramUserId,
        bookId: BOOK_ID,
        page: state.page,
      }),
    });
  } catch (error) {
    console.error("Progress saqlash xatoligi:", error);
  }
}

async function boot() {
  loadingState.style.display = "block";
  updateMeta();

  const task = pdfjsLib.getDocument(PDF_URL);
  state.pdf = await task.promise;
  state.pages = state.pdf.numPages;
  const savedPage = await loadProgressFromServer();
  state.page = clamp(savedPage, 1, state.pages);
  updateMeta();
  await renderPage(state.page);
}

void boot().catch((error) => {
  console.error(error);
  loadingState.textContent = "Xatolik: PDF yuklanmadi.";
});
