const maxPage = answerRows.length;
let currentPage = 1;
let rollingTimer = null;
let skipNextBlur = false;

const coverPage = document.getElementById("coverPage");
const oraclePage = document.getElementById("oraclePage");
const shellBook = document.getElementById("shellBook");
const enterButton = document.getElementById("enterButton");
const questionInput = document.getElementById("questionInput");
const pageInput = document.getElementById("pageInput");
const prevPage = document.getElementById("prevPage");
const nextPage = document.getElementById("nextPage");
const confirmButton = document.getElementById("confirmButton");
const randomButton = document.getElementById("randomButton");
const answerZone = document.getElementById("answerZone");
const answerBubble = document.getElementById("answerBubble");
const answerLyric = document.getElementById("answerLyric");
const answerSong = document.getElementById("answerSong");
const resetButton = document.getElementById("resetButton");
const homeButton = document.getElementById("homeButton");

function padPage(page) {
  return String(page).padStart(3, "0");
}

function clampPage(value) {
  const number = Number.parseInt(String(value).replace(/\D/g, ""), 10);
  if (Number.isNaN(number)) return 1;
  return Math.min(maxPage, Math.max(1, number));
}

function setPage(page, shouldReveal = true) {
  currentPage = clampPage(page);
  pageInput.value = padPage(currentPage);
  if (shouldReveal) revealAnswer(currentPage);
}

function selectPage(page) {
  setPage(page, false);
  answerZone.classList.remove("is-visible");
}

function confirmReveal() {
  skipNextBlur = document.activeElement === pageInput;
  setPage(pageInput.value || currentPage, true);
  if (document.activeElement === pageInput) pageInput.blur();
}

function answerForPage(page) {
  const row = answerRows[page - 1] || answerRows[0];
  return {
    page,
    lyric: row[0],
    song: row[1]
  };
}

function lyricFontSize(lyric) {
  const compactLength = lyric.replace(/\s/g, "").length;
  const lineCount = lyric.split("\n").length;
  const longestSegment = Math.max(...lyric.split(/\s+/).map((segment) => segment.length || 0));
  const pressure = compactLength + Math.max(0, lineCount - 1) * 8;

  if (longestSegment > 20) return "0.52rem";
  if (longestSegment > 18) return "0.58rem";
  if (longestSegment > 16) return "0.64rem";
  if (longestSegment > 14) return "0.72rem";
  if (pressure > 70) return "0.68rem";
  if (pressure > 58) return "0.76rem";
  if (pressure > 46) return "0.84rem";
  if (pressure > 34) return "0.96rem";
  if (pressure > 24) return "1.08rem";
  return "1.46rem";
}

function scheduleLyricFit() {
  if (!answerZone.classList.contains("is-visible")) return;

  window.requestAnimationFrame(() => {
    fitLyricText();
    window.setTimeout(fitLyricText, 120);
    window.setTimeout(fitLyricText, 420);
    window.setTimeout(fitLyricText, 900);
  });
}

function fitLyricText() {
  const bubble = answerBubble;
  const minSize = 0.42;
  const baseSize = answerLyric.dataset.baseSize || "1.46rem";
  const setAvailableHeight = () => {
    const availableHeight = Math.max(72, bubble.clientHeight - answerSong.offsetHeight - 24);
    answerLyric.style.maxHeight = `${availableHeight}px`;
  };

  bubble.classList.remove("is-dense");
  answerLyric.style.setProperty("--lyric-size", baseSize);
  setAvailableHeight();

  if (bubble.clientWidth < 40 || answerLyric.clientWidth < 40 || answerLyric.clientHeight < 20) {
    return;
  }

  const isOverflowing = () => (
    answerLyric.scrollHeight > answerLyric.clientHeight + 2 ||
    answerLyric.scrollWidth > answerLyric.clientWidth + 2
  );
  let size = Number.parseFloat(window.getComputedStyle(answerLyric).fontSize) / 16;

  while (size > minSize && isOverflowing()) {
    size -= 0.04;
    answerLyric.style.setProperty("--lyric-size", `${size.toFixed(2)}rem`);
  }

  if (answerLyric.scrollHeight > answerLyric.clientHeight + 2) {
    bubble.classList.add("is-dense");
    setAvailableHeight();

    while (size > minSize && isOverflowing()) {
      size -= 0.04;
      answerLyric.style.setProperty("--lyric-size", `${size.toFixed(2)}rem`);
    }
  } else {
    bubble.classList.remove("is-dense");
  }
}

function openShell() {
  coverPage.classList.add("is-open");
}

function goOracle() {
  openShell();
  window.setTimeout(() => {
    coverPage.classList.remove("is-active");
    oraclePage.classList.add("is-active");
  }, 420);
}

function revealAnswer(page) {
  const answer = answerForPage(page);
  const baseSize = lyricFontSize(answer.lyric);
  answerLyric.textContent = answer.lyric.trim();
  answerLyric.dataset.baseSize = baseSize;
  answerLyric.style.setProperty("--lyric-size", baseSize);
  answerSong.textContent = `—— 《${answer.song}》`;
  answerZone.classList.remove("is-visible");

  window.setTimeout(() => {
    answerBubble.style.animation = "none";
    answerBubble.offsetHeight;
    answerBubble.style.animation = "";
    answerZone.classList.add("is-visible");
    scheduleLyricFit();
  }, 120);
}

function rollRandomPage() {
  if (rollingTimer) return;

  const finalPage = Math.floor(Math.random() * maxPage) + 1;
  let ticks = 0;
  const totalTicks = 24 + Math.floor(Math.random() * 12);

  pageInput.classList.add("is-rolling");
  answerZone.classList.remove("is-visible");
  randomButton.disabled = true;

  rollingTimer = window.setInterval(() => {
    ticks += 1;
    const ghostPage = Math.floor(Math.random() * maxPage) + 1;
    pageInput.value = padPage(ghostPage);

    if (ticks >= totalTicks) {
      window.clearInterval(rollingTimer);
      rollingTimer = null;
      pageInput.classList.remove("is-rolling");
      randomButton.disabled = false;
      setPage(finalPage, true);
    }
  }, 70);
}

function resetOracle() {
  questionInput.value = "";
  currentPage = 1;
  pageInput.value = "001";
  answerZone.classList.remove("is-visible");
}

function returnHome() {
  resetOracle();
  oraclePage.classList.remove("is-active");
  coverPage.classList.add("is-active");
  coverPage.classList.remove("is-open");
}

function bindSwipe(target, callback) {
  if (!target) return;

  let startX = 0;
  let startY = 0;
  let isTracking = false;
  let hasTriggered = false;

  function start(x, y) {
    startX = x;
    startY = y;
    isTracking = true;
    hasTriggered = false;
  }

  function move(x, y) {
    if (!isTracking || hasTriggered) return;

    const dx = x - startX;
    const dy = y - startY;

    if (Math.abs(dx) < 48 && Math.abs(dy) < 48) return;
    hasTriggered = true;
    callback({ dx, dy });
  }

  function end(x, y) {
    if (!isTracking) return;
    move(x, y);
    isTracking = false;
  }

  target.addEventListener("touchstart", (event) => {
    const touch = event.touches[0];
    start(touch.clientX, touch.clientY);
  }, { passive: true });

  target.addEventListener("touchmove", (event) => {
    const touch = event.touches[0];
    move(touch.clientX, touch.clientY);
  }, { passive: true });

  target.addEventListener("touchend", (event) => {
    const touch = event.changedTouches[0];
    end(touch.clientX, touch.clientY);
  }, { passive: true });

  target.addEventListener("mousedown", (event) => {
    start(event.clientX, event.clientY);
  });

  window.addEventListener("mousemove", (event) => {
    move(event.clientX, event.clientY);
  });

  window.addEventListener("mouseup", (event) => {
    end(event.clientX, event.clientY);
  });
}

shellBook.addEventListener("click", openShell);
enterButton.addEventListener("click", goOracle);

bindSwipe(coverPage, ({ dx, dy }) => {
  if (dx > 45 || dy < -45) openShell();
});

bindSwipe(document.querySelector(".page-picker"), ({ dx }) => {
  if (dx > 38) selectPage(currentPage - 1);
  if (dx < -38) selectPage(currentPage + 1);
});

prevPage.addEventListener("click", () => selectPage(currentPage - 1));
nextPage.addEventListener("click", () => selectPage(currentPage + 1));
confirmButton.addEventListener("click", confirmReveal);
randomButton.addEventListener("click", rollRandomPage);
resetButton.addEventListener("click", resetOracle);
homeButton.addEventListener("click", returnHome);

pageInput.addEventListener("focus", () => {
  pageInput.select();
});

pageInput.addEventListener("input", () => {
  pageInput.value = pageInput.value.replace(/\D/g, "").slice(0, 3);
});

pageInput.addEventListener("blur", () => {
  if (skipNextBlur) {
    skipNextBlur = false;
    return;
  }
  selectPage(pageInput.value || currentPage);
});

pageInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    event.preventDefault();
    event.stopPropagation();
    confirmReveal();
  }
});

window.addEventListener("keydown", (event) => {
  if (!oraclePage.classList.contains("is-active")) return;

  if (event.key === "Enter") {
    event.preventDefault();
    confirmReveal();
  }

  if (event.key === "ArrowLeft") selectPage(currentPage - 1);
  if (event.key === "ArrowRight") selectPage(currentPage + 1);
});

window.addEventListener("resize", () => {
  if (answerZone.classList.contains("is-visible")) {
    scheduleLyricFit();
  }
});

if (document.fonts && document.fonts.ready) {
  document.fonts.ready.then(scheduleLyricFit);
}

setPage(1, false);

if (window.location.hash === "#cover-open") {
  openShell();
}

if (window.location.hash === "#oracle-preview") {
  coverPage.classList.remove("is-active");
  oraclePage.classList.add("is-active");
  setPage(1, true);
}
