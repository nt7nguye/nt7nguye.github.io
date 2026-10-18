// 2048 where each tile value is a rung on the org chart.
const ROLES = {
  2: "Intern", 4: "Engineer", 8: "Senior", 16: "Staff", 32: "Principal", 64: "Manager",
  128: "Director", 256: "VP", 512: "CTO", 1024: "CEO", 2048: "The Board",
};
const N = 4;
const SLIDE_MS = 100;

const board = document.getElementById("board");
const status = document.getElementById("status");
let tiles, nextId, busy;

function reset() {
  board.querySelectorAll(".tile").forEach((el) => el.remove());
  tiles = [];
  nextId = 1;
  busy = false;
  spawn();
  spawn();
  render();
}

function spawn() {
  const empty = [];
  for (let r = 0; r < N; r++)
    for (let c = 0; c < N; c++)
      if (!tiles.some((t) => t.r === r && t.c === c)) empty.push([r, c]);
  if (!empty.length) return;
  const [r, c] = empty[Math.floor(Math.random() * empty.length)];
  tiles.push({ id: nextId++, r, c, v: 2 });
}

function render() {
  for (const t of tiles) {
    let el = document.getElementById("t" + t.id);
    if (!el) {
      el = document.createElement("div");
      el.id = "t" + t.id;
      el.className = "tile";
      board.appendChild(el);
    }
    const level = Math.log2(t.v);
    el.style.left = t.c * 25 + "%";
    el.style.top = t.r * 25 + "%";
    el.style.setProperty("--level", level);
    el.classList.toggle("dark", level > 7);
    el.textContent = ROLES[t.v];
  }
  const top = Math.max(...tiles.map((t) => t.v));
  status.textContent = gameOver() ? `Game over. You made it to ${ROLES[top]}.` : `Highest: ${ROLES[top]}`;
}

function gameOver() {
  if (tiles.length < N * N) return false;
  const at = (r, c) => tiles.find((t) => t.r === r && t.c === c);
  return tiles.every((t) => {
    const right = at(t.r, t.c + 1), down = at(t.r + 1, t.c);
    return (!right || right.v !== t.v) && (!down || down.v !== t.v);
  });
}

// dr/dc is the direction tiles slide in.
function move(dr, dc) {
  if (busy || gameOver()) return;
  let moved = false;
  const merged = [];
  for (let line = 0; line < N; line++) {
    // Walk the line starting from the edge the tiles slide toward.
    const cells = [];
    for (let k = 0; k < N; k++) {
      const i = dr + dc > 0 ? N - 1 - k : k;
      cells.push(dr ? [i, line] : [line, i]);
    }
    let target = 0;
    let last = null;
    for (const [r, c] of cells) {
      const t = tiles.find((x) => x.r === r && x.c === c && !x.gone);
      if (!t) continue;
      if (last && last.v === t.v && !last.merged) {
        [t.r, t.c] = [last.r, last.c];
        t.gone = true;
        last.merged = true;
        merged.push([last, t]);
        moved = true;
        continue;
      }
      const [nr, nc] = cells[target++];
      if (nr !== t.r || nc !== t.c) moved = true;
      [t.r, t.c] = [nr, nc];
      last = t;
    }
  }
  if (!moved) return;
  busy = true;
  render();
  setTimeout(() => {
    for (const [keep, gone] of merged) {
      keep.v *= 2;
      document.getElementById("t" + gone.id).remove();
    }
    tiles = tiles.filter((t) => !t.gone);
    tiles.forEach((t) => delete t.merged);
    spawn();
    render();
    busy = false;
  }, SLIDE_MS);
}

const KEYS = { ArrowLeft: [0, -1], ArrowRight: [0, 1], ArrowUp: [-1, 0], ArrowDown: [1, 0] };
board.addEventListener("keydown", (e) => {
  if (!KEYS[e.key]) return;
  e.preventDefault();
  move(...KEYS[e.key]);
});

let touch = null;
board.addEventListener("touchstart", (e) => { touch = e.touches[0]; }, { passive: true });
board.addEventListener("touchend", (e) => {
  if (!touch) return;
  const dx = e.changedTouches[0].clientX - touch.clientX;
  const dy = e.changedTouches[0].clientY - touch.clientY;
  touch = null;
  if (Math.max(Math.abs(dx), Math.abs(dy)) < 24) return;
  if (Math.abs(dx) > Math.abs(dy)) move(0, Math.sign(dx));
  else move(Math.sign(dy), 0);
});

document.getElementById("restart").addEventListener("click", () => { reset(); board.focus(); });
reset();
