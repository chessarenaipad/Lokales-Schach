import { Chess } from "chess.js";
import "./style.css";

const PIECES = {
  classic: { name: "Klassisch", cls: "pieces-classic" },
  clean: { name: "Clean", cls: "pieces-clean" },
  neon: { name: "Neon", cls: "pieces-neon" }
};

const BOARD_THEMES = {
  wood: { name: "Holz", light: "#f0d9b5", dark: "#b58863" },
  slate: { name: "Schiefer", light: "#dce4ea", dark: "#647887" },
  emerald: { name: "Smaragd", light: "#e8efd8", dark: "#739552" }
};

const PIECE_GLYPHS = {
  w: { k:"♔", q:"♕", r:"♖", b:"♗", n:"♘", p:"♙" },
  b: { k:"♚", q:"♛", r:"♜", b:"♝", n:"♞", p:"♟" }
};

const THEORY = new Set([
  "e4","d4","c4","Nf3","e5","c5","Nc6","Nf6","d5","d6","e6","g6","c6",
  "Bb5","Bc4","Be2","Nc3","Be7","Bb4","a6","O-O","O-O-O"
]);

const state = {
  chess: new Chess(),
  mode: "local",
  humanColor: "w",
  orientation: "w",
  boardTheme: "wood",
  pieceTheme: "classic",
  timeBase: 300,
  increment: 0,
  clocks: { w: 300000, b: 300000 },
  running: false,
  gameOver: false,
  lastTick: performance.now(),
  hints: { w: 3, b: 3 },
  selected: null,
  legalTargets: [],
  history: [],
  analysis: [],
  engineReady: false,
  engineBusy: false
};

let engine = null;
let engineReadyPromise = null;
let engineQueue = Promise.resolve();

function fmt(ms) {
  ms = Math.max(0, ms);
  const total = Math.ceil(ms / 1000);
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, "0")}`;
}

function currentColor() {
  return state.chess.turn();
}

function render() {
  document.querySelector("#app").innerHTML = `
    <div class="app-shell">
      <header class="topbar">
        <div>
          <div class="eyebrow">LOKALES SCHACH</div>
          <h1>Schach · Stockfish 18</h1>
        </div>
        <div class="status-pill ${state.engineReady ? "ok" : ""}">
          <span></span>${state.engineReady ? "Engine bereit" : "Engine lädt…"}
        </div>
      </header>

      <main class="layout">
        <section class="game-panel">
          <div class="player-row">
            <div class="player">
              <strong>Schwarz</strong>
              <span>${state.mode === "bot" && state.humanColor === "w" ? "Stockfish" : "Spieler 2"}</span>
            </div>
            <div class="clock ${currentColor() === "b" && state.running ? "active" : ""}" id="clock-b">${fmt(state.clocks.b)}</div>
          </div>

          <div class="board-wrap">
            <div id="board" class="board ${PIECES[state.pieceTheme].cls}"
              style="--light:${BOARD_THEMES[state.boardTheme].light};--dark:${BOARD_THEMES[state.boardTheme].dark}"></div>
          </div>

          <div class="player-row">
            <div class="player">
              <strong>Weiß</strong>
              <span>${state.mode === "bot" && state.humanColor === "b" ? "Stockfish" : "Spieler 1"}</span>
            </div>
            <div class="clock ${currentColor() === "w" && state.running ? "active" : ""}" id="clock-w">${fmt(state.clocks.w)}</div>
          </div>
        </section>

        <aside class="side-panel">
          <section class="card">
            <div class="card-title">Spiel</div>
            <div class="button-grid">
              <button id="newGame">Neue Partie</button>
              <button id="resign" class="secondary">Aufgeben</button>
            </div>
            <div class="mode-row">
              <button class="${state.mode === "local" ? "selected" : ""}" data-mode="local">2 Spieler lokal</button>
              <button class="${state.mode === "bot" ? "selected" : ""}" data-mode="bot">vs. Stockfish</button>
            </div>
          </section>

          <section class="card">
            <div class="card-title">Bedenkzeit</div>
            <div class="time-grid">
              ${[
                [180,0,"3 + 0"],[300,0,"5 + 0"],[600,0,"10 + 0"],
                [180,10,"3 + 10"],[300,10,"5 + 10"],[600,10,"10 + 10"]
              ].map(([t,i,label]) =>
                `<button class="${state.timeBase === t && state.increment === i ? "selected" : ""}" data-time="${t}" data-inc="${i}">${label}</button>`
              ).join("")}
            </div>
          </section>

          <section class="card">
            <div class="card-title">Brett & Figuren</div>
            <label>Brett
              <select id="boardTheme">
                ${Object.entries(BOARD_THEMES).map(([k,v]) =>
                  `<option value="${k}" ${k === state.boardTheme ? "selected" : ""}>${v.name}</option>`
                ).join("")}
              </select>
            </label>
            <label>Figuren
              <select id="pieceTheme">
                ${Object.entries(PIECES).map(([k,v]) =>
                  `<option value="${k}" ${k === state.pieceTheme ? "selected" : ""}>${v.name}</option>`
                ).join("")}
              </select>
            </label>
            <button id="flip" class="secondary full">Brett drehen</button>
          </section>

          <section class="card hint-card">
            <div class="card-title">Hinweis</div>
            <p>Stockfish nennt dir den besten Zug. Pro Spieler sind <b>3 Hinweise</b> verfügbar.</p>
            <button id="hint" ${state.hints[currentColor()] <= 0 || !state.engineReady || state.gameOver ? "disabled" : ""}>
              ♟ Besten Zug anzeigen · ${state.hints[currentColor()]}
            </button>
            <div id="hintText" class="hint-text"></div>
          </section>

          <section class="card moves-card">
            <div class="card-title">Partie</div>
            <div id="moves" class="moves"></div>
            <button id="analysisBtn" class="secondary full" ${state.gameOver && state.history.length ? "" : "disabled"}>
              Partie analysieren
            </button>
          </section>
        </aside>
      </main>

      <div id="resultModal" class="modal hidden"></div>
      <div id="analysisModal" class="modal hidden"></div>
    </div>
  `;

  bind();
  drawBoard();
  drawMoves();
}

function bind() {
  document.querySelector("#newGame").onclick = newGame;
  document.querySelector("#resign").onclick = () =>
    endGame(state.chess.turn() === "w" ? "Schwarz gewinnt durch Aufgabe." : "Weiß gewinnt durch Aufgabe.");

  document.querySelector("#flip").onclick = () => {
    state.orientation = state.orientation === "w" ? "b" : "w";
    render();
  };

  document.querySelector("#hint").onclick = useHint;
  document.querySelector("#analysisBtn").onclick = showAnalysis;

  document.querySelector("#boardTheme").onchange = e => {
    state.boardTheme = e.target.value;
    render();
  };

  document.querySelector("#pieceTheme").onchange = e => {
    state.pieceTheme = e.target.value;
    render();
  };

  document.querySelectorAll("[data-mode]").forEach(button => {
    button.onclick = () => {
      state.mode = button.dataset.mode;
      newGame();
    };
  });

  document.querySelectorAll("[data-time]").forEach(button => {
    button.onclick = () => {
      state.timeBase = +button.dataset.time;
      state.increment = +button.dataset.inc;
      newGame();
    };
  });
}

function drawBoard() {
  const board = document.querySelector("#board");
  if (!board) return;

  board.innerHTML = "";
  const files = state.orientation === "w" ? "abcdefgh" : "hgfedcba";
  const ranks = state.orientation === "w" ? "87654321" : "12345678";
  const lastMove = state.history.at(-1);

  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const file = files[c];
      const rank = ranks[r];
      const square = file + rank;
      const piece = state.chess.get(square);

      const div = document.createElement("button");
      div.className = `square ${(r + c) % 2 === 0 ? "light" : "dark"}`;
      div.dataset.square = square;

      if (state.selected === square) div.classList.add("selected");
      if (state.legalTargets.includes(square)) div.classList.add("target");
      if (lastMove && (lastMove.lan.slice(2,4) === square || lastMove.lan.slice(0,2) === square)) {
        div.classList.add("last");
      }

      if (piece) {
        div.innerHTML = `<span class="piece">${PIECE_GLYPHS[piece.color][piece.type]}</span>`;
      }

      if (c === 0) {
        div.insertAdjacentHTML("afterbegin", `<span class="coord rank">${rank}</span>`);
      }
      if (r === 7) {
        div.insertAdjacentHTML("beforeend", `<span class="coord file">${file}</span>`);
      }

      div.onclick = () => clickSquare(square);
      board.appendChild(div);
    }
  }
}

function drawMoves() {
  const movesEl = document.querySelector("#moves");
  if (!movesEl) return;

  if (!state.history.length) {
    movesEl.innerHTML = `<div class="moves-empty">Noch keine Züge.</div>`;
    return;
  }

  movesEl.innerHTML = state.history.map((move, i) => `
    <div class="move-item">
      <span class="move-no">${Math.floor(i / 2) + 1}${move.color === "w" ? "." : "..."}</span>
      <b>${move.san}</b>
    </div>
  `).join("");
}

function clickSquare(square) {
  if (state.gameOver) return;
  if (state.mode === "bot" && currentColor() !== state.humanColor) return;
  if (state.engineBusy) return;

  const piece = state.chess.get(square);

  if (state.selected) {
    const move = state.legalTargets.includes(square)
      ? { from: state.selected, to: square, promotion: "q" }
      : null;

    if (move) {
      makeMove(move);
      return;
    }
  }

  if (piece && piece.color === currentColor()) {
    state.selected = square;
    state.legalTargets = state.chess.moves({ square, verbose: true }).map(m => m.to);
  } else {
    state.selected = null;
    state.legalTargets = [];
  }

  drawBoard();
}

function makeMove(move) {
  if (state.gameOver) return;

  const before = state.chess.fen();
  const made = state.chess.move(move);
  if (!made) return;

  state.history.push({
    before,
    after: state.chess.fen(),
    san: made.san,
    lan: made.lan,
    color: made.color
  });

  state.clocks[made.color] += state.increment * 1000;
  state.selected = null;
  state.legalTargets = [];
  state.running = true;
  state.lastTick = performance.now();

  if (state.chess.isGameOver()) {
    endGame(gameOverText());
    return;
  }

  render();

  if (state.mode === "bot" && currentColor() !== state.humanColor) {
    botMove();
  }
}

function gameOverText() {
  if (state.chess.isCheckmate()) {
    return `${currentColor() === "w" ? "Schwarz" : "Weiß"} gewinnt durch Schachmatt.`;
  }
  if (state.chess.isStalemate()) return "Remis durch Patt.";
  if (state.chess.isThreefoldRepetition()) return "Remis durch dreifache Stellungswiederholung.";
  if (state.chess.isInsufficientMaterial()) return "Remis wegen unzureichenden Materials.";
  if (state.chess.isDraw()) return "Remis.";
  return "Partie beendet.";
}

function newGame() {
  state.chess = new Chess();
  state.clocks = { w: state.timeBase * 1000, b: state.timeBase * 1000 };
  state.running = false;
  state.gameOver = false;
  state.history = [];
  state.analysis = [];
  state.hints = { w: 3, b: 3 };
  state.selected = null;
  state.legalTargets = [];
  state.engineBusy = false;
  state.lastTick = performance.now();

  document.querySelector("#resultModal")?.classList.add("hidden");
  document.querySelector("#analysisModal")?.classList.add("hidden");
  render();
}

function endGame(text) {
  state.running = false;
  state.gameOver = true;

  render();

  const modal = document.querySelector("#resultModal");
  if (!modal) return;

  modal.innerHTML = `
    <div class="modal-box">
      <h2>${text}</h2>
      <p>${state.history.length} Halbzüge gespielt.</p>
      <button id="closeResult">Schließen</button>
      <button id="analyzeNow" class="secondary">Analyse öffnen</button>
    </div>
  `;

  modal.classList.remove("hidden");

  document.querySelector("#closeResult").onclick = () => modal.classList.add("hidden");
  document.querySelector("#analyzeNow").onclick = () => {
    modal.classList.add("hidden");
    showAnalysis();
  };
}

function tick(now) {
  if (state.running && !state.gameOver) {
    const dt = Math.min(1000, Math.max(0, now - state.lastTick));
    const color = currentColor();

    state.clocks[color] -= dt;

    if (state.clocks[color] <= 0) {
      state.clocks[color] = 0;
      state.running = false;
      endGame(`${color === "w" ? "Schwarz" : "Weiß"} gewinnt auf Zeit.`);
      requestAnimationFrame(tick);
      return;
    }

    const cw = document.querySelector("#clock-w");
    const cb = document.querySelector("#clock-b");
    if (cw) cw.textContent = fmt(state.clocks.w);
    if (cb) cb.textContent = fmt(state.clocks.b);
  }

  state.lastTick = now;
  requestAnimationFrame(tick);
}

function engineWorker() {
  if (engine) return engine;

  const engineUrl = `${import.meta.env.BASE_URL}engine/stockfish-18-lite-single.js`;
  engine = new Worker(engineUrl);

  engineReadyPromise = new Promise((resolve, reject) => {
    const readyTimeout = setTimeout(() => {
      reject(new Error("Stockfish konnte nicht gestartet werden."));
    }, 15000);

    engine.addEventListener("message", event => {
      const line = String(event.data);

      if (line.includes("readyok")) {
        clearTimeout(readyTimeout);
        state.engineReady = true;
        render();
        resolve();
      }

      if (line.startsWith("bestmove ")) {
        // bestmove wird von den jeweiligen Such-Listenern verarbeitet.
      }
    });

    engine.addEventListener("error", event => {
      clearTimeout(readyTimeout);
      console.error("Stockfish Worker-Fehler:", event);
      reject(new Error("Stockfish Worker-Fehler"));
    }, { once: true });
  });

  engine.postMessage("uci");
  engine.postMessage("isready");

  return engine;
}

async function waitForEngine() {
  engineWorker();
  if (!state.engineReady && engineReadyPromise) {
    await engineReadyPromise;
  }
}

function runEngine(command, movetime, parse) {
  engineQueue = engineQueue.then(async () => {
    await waitForEngine();

    const w = engineWorker();

    return new Promise((resolve, reject) => {
      let finished = false;

      const cleanup = () => {
        w.removeEventListener("message", onMessage);
        clearTimeout(timer);
      };

      const finish = value => {
        if (finished) return;
        finished = true;
        cleanup();
        resolve(value);
      };

      const onMessage = event => {
        const line = String(event.data);
        const value = parse(line);
        if (value !== undefined) finish(value);
      };

      const timer = setTimeout(() => {
        if (!finished) {
          finished = true;
          cleanup();
          reject(new Error("Stockfish-Zeitüberschreitung"));
        }
      }, movetime + 5000);

      w.addEventListener("message", onMessage);
      w.postMessage(command);
      w.postMessage(`go movetime ${movetime}`);
    });
  });

  return engineQueue;
}

function engineBestMove(fen, movetime = 5000) {
  return runEngine(
    `position fen ${fen}`,
    movetime,
    line => line.startsWith("bestmove ") ? line.split(/\s+/)[1] : undefined
  );
}

function engineEval(fen, movetime = 1200) {
  let latestScore = 0;

  return runEngine(
    `position fen ${fen}`,
    movetime,
    line => {
      const match = line.match(/score (cp|mate) (-?\d+)/);
      if (match) {
        latestScore = match[1] === "cp"
          ? Number(match[2]) / 100
          : (Number(match[2]) > 0 ? 99 : -99);
      }

      return line.startsWith("bestmove ") ? latestScore : undefined;
    }
  );
}

async function botMove() {
  if (state.engineBusy || state.gameOver) return;

  state.engineBusy = true;
  render();

  try {
    const best = await engineBestMove(state.chess.fen(), 5000);

    if (!state.gameOver && currentColor() !== state.humanColor && best && best !== "(none)") {
      makeMove({
        from: best.slice(0, 2),
        to: best.slice(2, 4),
        promotion: best[4] || "q"
      });
    }
  } catch (error) {
    console.error(error);
    const hint = document.querySelector("#hintText");
    if (hint) hint.textContent = "Stockfish konnte nicht antworten.";
  } finally {
    state.engineBusy = false;
    if (!state.gameOver) render();
  }
}

async function useHint() {
  const color = currentColor();

  if (state.hints[color] <= 0 || state.gameOver || state.engineBusy) return;

  state.hints[color]--;
  state.engineBusy = true;
  render();

  try {
    const best = await engineBestMove(state.chess.fen(), 2500);
    const legal = state.chess.moves({ verbose: true });
    const mv = legal.find(m => m.lan === best);

    if (mv) {
      state.selected = mv.from;
      state.legalTargets = [mv.to];
      render();

      const hintText = document.querySelector("#hintText");
      if (hintText) hintText.textContent = `Bester Zug: ${mv.san}`;
    }
  } catch (error) {
    console.error(error);
    state.hints[color]++;
    render();

    const hintText = document.querySelector("#hintText");
    if (hintText) hintText.textContent = "Stockfish konnte den Hinweis nicht berechnen.";
  } finally {
    state.engineBusy = false;
  }
}

async function analyzeGame() {
  const result = [];

  for (let i = 0; i < state.history.length; i++) {
    const item = state.history[i];
    const before = new Chess(item.before);
    const best = await engineBestMove(item.before, 1800);
    const legal = before.moves({ verbose: true });
    const bestObj = legal.find(m => m.lan === best);

    let quality = "Gut";
    let detail = "Guter Zug.";

    if (bestObj?.lan === item.lan) {
      quality = THEORY.has(item.san) && i < 12 ? "Theoriezug" : "Perfekt";
      detail = quality === "Theoriezug"
        ? "Bekannter Eröffnungszug."
        : "Stockfish bevorzugt genau diesen Zug.";
    } else {
      const afterPlayed = new Chess(item.before);
      afterPlayed.move(item.lan);

      const beforeEval = await engineEval(item.before, 1200);
      const playedEval = await engineEval(afterPlayed.fen(), 1200);
      const sign = item.color === "w" ? 1 : -1;
      const loss = (beforeEval - playedEval) * sign;

      if (loss >= 1.5) {
        quality = "Fehler";
        detail = `Verbesserung: ${bestObj?.san || best}. Der Zug kostet ungefähr ${loss.toFixed(1)} Bauerneinheiten.`;
      } else {
        quality = "Gut";
        detail = `Besser wäre ${bestObj?.san || best}.`;
      }
    }

    result.push({ ...item, quality, detail, best });
  }

  return result;
}

async function showAnalysis() {
  if (!state.history.length || !state.gameOver) return;

  const modal = document.querySelector("#analysisModal");
  if (!modal) return;

  modal.innerHTML = `
    <div class="modal-box wide">
      <h2>Partieanalyse</h2>
      <p>Stockfish analysiert jeden Zug…</p>
      <div class="progress"></div>
    </div>
  `;
  modal.classList.remove("hidden");

  try {
    state.analysis = await analyzeGame();

    modal.innerHTML = `
      <div class="modal-box wide">
        <div class="analysis-head">
          <div>
            <h2>Partieanalyse</h2>
            <p>Bewertung pro Zug und Verbesserungsvorschlag</p>
          </div>
          <button id="closeAnalysis">×</button>
        </div>
        <div class="analysis-list">
          ${state.analysis.map((m, i) => `
            <div class="analysis-row">
              <span class="move-no">${Math.floor(i / 2) + 1}${m.color === "w" ? "." : "..."}</span>
              <b>${m.san}</b>
              <span class="badge ${m.quality.toLowerCase()}">${m.quality}</span>
              <span class="analysis-detail">${m.detail}</span>
            </div>
          `).join("")}
        </div>
      </div>
    `;

    document.querySelector("#closeAnalysis").onclick = () => modal.classList.add("hidden");
  } catch (error) {
    console.error(error);
    modal.innerHTML = `
      <div class="modal-box">
        <h2>Analyse fehlgeschlagen</h2>
        <p>Stockfish konnte die Partie nicht vollständig analysieren.</p>
        <button id="closeAnalysis">Schließen</button>
      </div>
    `;
    document.querySelector("#closeAnalysis").onclick = () => modal.classList.add("hidden");
  }
}

render();
engineWorker();
requestAnimationFrame(tick);
