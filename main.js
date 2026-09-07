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
  "Bb5","Bc4","Be2","Nf3","Nc3","Be7","Bb4","a6","O-O","O-O-O"
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
  engineBusy: false,
  engineQueue: Promise.resolve()
};

let engine = null;

function fmt(ms) {
  ms = Math.max(0, ms);
  const total = Math.ceil(ms / 1000);
  return `${Math.floor(total/60)}:${String(total%60).padStart(2,"0")}`;
}

function currentColor() { return state.chess.turn(); }

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
            <div class="player"><strong>Schwarz</strong><span>${state.mode === "bot" && state.humanColor === "w" ? "Stockfish" : "Spieler 2"}</span></div>
            <div class="clock ${currentColor()==="b" && state.running ? "active" : ""}" id="clock-b">${fmt(state.clocks.b)}</div>
          </div>

          <div class="board-wrap">
            <div id="board" class="board ${PIECES[state.pieceTheme].cls}" style="--light:${BOARD_THEMES[state.boardTheme].light};--dark:${BOARD_THEMES[state.boardTheme].dark}"></div>
          </div>

          <div class="player-row">
            <div class="player"><strong>Weiß</strong><span>${state.mode === "bot" && state.humanColor === "b" ? "Stockfish" : "Spieler 1"}</span></div>
            <div class="clock ${currentColor()==="w" && state.running ? "active" : ""}" id="clock-w">${fmt(state.clocks.w)}</div>
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
              <button class="${state.mode==="local"?"selected":""}" data-mode="local">2 Spieler lokal</button>
              <button class="${state.mode==="bot"?"selected":""}" data-mode="bot">vs. Stockfish</button>
            </div>
          </section>

          <section class="card">
            <div class="card-title">Bedenkzeit</div>
            <div class="time-grid">
              ${[[180,0,"3 + 0"],[300,0,"5 + 0"],[600,0,"10 + 0"],[180,10,"3 + 10"],[300,10,"5 + 10"],[600,10,"10 + 10"]].map(([t,i,label]) =>
                `<button class="${state.timeBase===t&&state.increment===i?"selected":""}" data-time="${t}" data-inc="${i}">${label}</button>`).join("")}
            </div>
          </section>

          <section class="card">
            <div class="card-title">Brett & Figuren</div>
            <label>Brett
              <select id="boardTheme">${Object.entries(BOARD_THEMES).map(([k,v])=>`<option value="${k}" ${k===state.boardTheme?"selected":""}>${v.name}</option>`).join("")}</select>
            </label>
            <label>Figuren
              <select id="pieceTheme">${Object.entries(PIECES).map(([k,v])=>`<option value="${k}" ${k===state.pieceTheme?"selected":""}>${v.name}</option>`).join("")}</select>
            </label>
            <button id="flip" class="secondary full">Brett drehen</button>
          </section>

          <section class="card hint-card">
            <div class="card-title">Hinweis</div>
            <p>Stockfish nennt dir den besten Zug. Pro Spieler sind <b>3 Hinweise</b> verfügbar.</p>
            <button id="hint" ${state.hints[currentColor()]<=0 || !state.engineReady || state.gameOver ? "disabled":""}>♟ Besten Zug anzeigen · ${state.hints[currentColor()]}</button>
            <div id="hintText" class="hint-text"></div>
          </section>

          <section class="card moves-card">
            <div class="card-title">Partie</div>
            <div id="moves" class="moves"></div>
            <button id="analysisBtn" class="secondary full" ${state.gameOver && state.history.length ? "" : "disabled"}>Partie analysieren</button>
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
  document.querySelector("#resign").onclick = () => endGame(state.chess.turn()==="w" ? "Schwarz gewinnt durch Aufgabe." : "Weiß gewinnt durch Aufgabe.");
  document.querySelector("#flip").onclick = () => { state.orientation = state.orientation==="w" ? "b" : "w"; render(); };
  document.querySelector("#hint").onclick = useHint;
  document.querySelector("#analysisBtn").onclick = showAnalysis;
  document.querySelector("#boardTheme").onchange = e => { state.boardTheme=e.target.value; render(); };
  document.querySelector("#pieceTheme").onchange = e => { state.pieceTheme=e.target.value; render(); };
  document.querySelectorAll("[data-mode]").forEach(b => b.onclick=()=>{state.mode=b.dataset.mode; newGame();});
  document.querySelectorAll("[data-time]").forEach(b => b.onclick=()=>{state.timeBase=+b.dataset.time;state.increment=+b.dataset.inc;newGame();});
}

function drawBoard() {
  const board = document.querySelector("#board");
  board.innerHTML = "";
  const files = state.orientation==="w" ? "abcdefgh" : "hgfedcba";
  const ranks = state.orientation==="w" ? "87654321" : "12345678";

  for (let r=0;r<8;r++) for (let c=0;c<8;c++) {
    const file = files[c], rank = ranks[r], square = file+rank;
    const piece = state.chess.get(square);
    const div = document.createElement("button");
    div.className = `square ${(r+c)%2===0?"light":"dark"}`;
    div.dataset.square = square;
    if (state.selected===square) div.classList.add("selected");
    if (state.legalTargets.includes(square)) div.classList.add("target");
    if (state.chess.history({verbose:true}).at(-1)?.to===square) div.classList.add("last");
    if (piece) div.innerHTML = `<span class="piece">${PIECE_GLYPHS[piece.color][piece.type]}</span>`;
    if (c===0) div.insertAdjacentHTML("afterbegin", `<span class="coord rank">${rank}</span>`);
    if (r===7) div.insertAdjacentHTML("beforeend", `<span class="coord file">${file}</span>`);
    div.onclick = () => clickSquare(square);
    board.appendChild(div);
  }
}

function clickSquare(square) {
  if (state.gameOver) return;
  if (state.mode==="bot" && currentColor()!==state.humanColor) return;

  const piece = state.chess.get(square);
  if (state.selected) {
    const move = state.legalTargets.includes(square) ? {from:state.selected,to:square,promotion:"q"} : null;
    if (move) {
      makeMove(move);
      return;
    }
  }
  if (piece && piece.color===currentColor()) {
    state.selected=square;
    state.legalTargets=state.chess.moves({square, verbose:true}).map(m=>m.to);
  } else {
    state.selected=null; state.legalTargets=[];
  }
  drawBoard();
}

function makeMove(move) {
  const before = state.chess.fen();
  const made = state.chess.move(move);
  if (!made) return;
  state.history.push({ before, after:state.chess.fen(), san:made.san, lan:made.lan, color:made.color });
  state.clocks[made.color] += 0; // clarity
  state.clocks[made.color] += state.increment * 1000;
  state.selected=null; state.legalTargets=[];
  state.running=true; state.lastTick=performance.now();

  if (state.chess.isGameOver()) {
    endGame(gameOverText());
    return;
  }

  render();
  if (state.mode==="bot" && currentColor()!==state.humanColor) botMove();
}

function gameOverText() {
  if (state.chess.isCheckmate()) return `${currentColor()==="w" ? "Schwarz" : "Weiß"} gewinnt durch Schachmatt.`;
  if (state.chess.isStalemate()) return "Remis durch Patt.";
  if (state.chess.isThreefoldRepetition()) return "Remis durch dreifache Stellungswiederholung.";
  if (state.chess.isInsufficientMaterial()) return "Remis wegen unzureichenden Materials.";
  if (state.chess.isDraw()) return "Remis.";
  return "Partie beendet.";
}

function newGame() {
  state.chess = new Chess();
  state.clocks={w:state.timeBase*1000,b:state.timeBase*1000};
  state.running=false; state.gameOver=false; state.history=[]; state.analysis=[];
  state.hints={w:3,b:3}; state.selected=null; state.legalTargets=[];
  state.lastTick=performance.now();
  document.querySelector("#resultModal")?.classList.add("hidden");
  render();
}

function endGame(text) {
  state.running=false; state.gameOver=true;
  render();
  const modal=document.querySelector("#resultModal");
  modal.innerHTML=`<div class="modal-box"><h2>${text}</h2><p>${state.history.length} Züge gespielt.</p><button id="closeResult">Schließen</button><button id="analyzeNow" class="secondary">Analyse öffnen</button></div>`;
  modal.classList.remove("hidden");
  document.querySelector("#closeResult").onclick=()=>modal.classList.add("hidden");
  document.querySelector("#analyzeNow").onclick=()=>{modal.classList.add("hidden");showAnalysis();};
}

function tick() {
  const now=performance.now();
  if (state.running && !state.gameOver) {
    const dt=now-state.lastTick;
    state.clocks[currentColor()]-=dt;
    if (state.clocks[currentColor()]<=0) {
      state.clocks[currentColor()]=0;
      endGame(`${currentColor()==="w" ? "Schwarz" : "Weiß"} gewinnt auf Zeit.`);
    }
    const cw=document.querySelector("#clock-w"), cb=document.querySelector("#clock-b");
    if(cw) cw.textContent=fmt(state.clocks.w);
    if(cb) cb.textContent=fmt(state.clocks.b);
  }
  state.lastTick=now;
  requestAnimationFrame(tick);
}

function engineWorker() {
  if (engine) return engine;
  engine = new Worker("/engine/stockfish-18-lite-single.js");
  engine.postMessage("uci");
  engine.postMessage("isready");
  engine.onmessage = e => {
    if (typeof e.data==="string" && e.data.includes("readyok")) {
      state.engineReady=true; render();
    }
  };
  return engine;
}

function engineBestMove(fen, movetime=5000) {
  return new Promise((resolve,reject)=>{
    const w=engineWorker();
    let best=null;
    const onMessage=e=>{
      const line=String(e.data);
      if(line.startsWith("bestmove ")) {
        best=line.split(/\s+/)[1];
        w.removeEventListener("message",onMessage);
        resolve(best);
      }
    };
    w.addEventListener("message",onMessage);
    w.postMessage("position fen "+fen);
    w.postMessage(`go movetime ${movetime}`);
    setTimeout(()=>{ if(!best){w.removeEventListener("message",onMessage);reject(new Error("Engine timeout"));}},movetime+2500);
  });
}

async function botMove() {
  if(state.engineBusy || state.gameOver) return;
  state.engineBusy=true;
  try {
    const best=await engineBestMove(state.chess.fen(),5000);
    if(!state.gameOver && currentColor()!==state.humanColor) makeMove({from:best.slice(0,2),to:best.slice(2,4),promotion:best[4]||"q"});
  } catch(e) {
    console.error(e);
  } finally { state.engineBusy=false; }
}

async function useHint() {
  const color=currentColor();
  if(state.hints[color]<=0 || state.gameOver) return;
  state.hints[color]--;
  const best=await engineBestMove(state.chess.fen(),2500);
  const legal=state.chess.moves({verbose:true});
  const mv=legal.find(m=>m.lan===best);
  const el=document.querySelector("#hintText");
  if(mv && el) {
    state.selected=mv.from; state.legalTargets=[mv.to];
    el.textContent=`Bester Zug: ${mv.san}`;
    drawBoard();
  }
  render();
  const el2=document.querySelector("#hintText");
  if(el2) el2.textContent=`Bester Zug: ${mv?.san || best}`;
}

async function analyzeGame() {
  const result=[];
  for(let i=0;i<state.history.length;i++){
    const item=state.history[i];
    const before=new Chess(item.before);
    const played=before.move(item.lan);
    const best=await engineBestMove(item.before,1800);
    const legal=before.moves({verbose:true});
    const bestObj=legal.find(m=>m.lan===best);
    let quality="Gut", detail="Guter Zug.";
    if(bestObj?.lan===item.lan) {
      quality = THEORY.has(item.san) && i<12 ? "Theoriezug" : "Perfekt";
      detail = quality==="Theoriezug" ? "Bekannter Eröffnungszug." : "Stockfish bevorzugt genau diesen Zug.";
    } else {
      const afterPlayed=new Chess(item.before);
      afterPlayed.move(item.lan);
      const alt=await engineEval(item.before,1800);
      const playedEval=await engineEval(afterPlayed.fen(),1800);
      const sign=item.color==="w"?1:-1;
      const loss=(alt-playedEval)*sign;
      if(loss>=1.5) {
        quality="Fehler";
        detail=`Verbesserung: ${bestObj?.san || best}. Der Zug kostet ungefähr ${loss.toFixed(1)} Bauerneinheiten.`;
      } else {
        quality="Gut";
        detail=`Besser wäre ${bestObj?.san || best}.`;
      }
    }
    result.push({...item,quality,detail,best});
  }
  return result;
}

function engineEval(fen,movetime=1200){
  return new Promise((resolve,reject)=>{
    const w=engineWorker(); let val=0;
    const on=e=>{
      const s=String(e.data), m=s.match(/score (cp|mate) (-?\d+)/);
      if(m) val=m[1]==="cp"?+m[2]/100:(+m[2]>0?99:-99);
      if(s.startsWith("bestmove ")){w.removeEventListener("message",on);resolve(val);}
    };
    w.addEventListener("message",on);
    w.postMessage("position fen "+fen); w.postMessage(`go movetime ${movetime}`);
    setTimeout(()=>{w.removeEventListener("message",on);resolve(val)},movetime+2000);
  });
}

async function showAnalysis() {
  const modal=document.querySelector("#analysisModal");
  modal.innerHTML=`<div class="modal-box wide"><h2>Partieanalyse</h2><p>Stockfish analysiert jeden Zug…</p><div class="progress"></div></div>`;
  modal.classList.remove("hidden");
  state.analysis=await analyzeGame();
  modal.innerHTML=`<div class="modal-box wide">
    <div class="analysis-head"><div><h2>Partieanalyse</h2><p>Bewertung pro Zug und Verbesserungsvorschlag</p></div><button id="closeAnalysis">×</button></div>
    <div class="analysis-list">${state.analysis.map((m,i)=>`
      <div class="analysis-row">
        <span class="move-no">${i+1}${m.color==="w"?"…":""}</span>
        <b>${m.san}</b>
        <span class="badge ${m.quality.toLowerCase()}">${m.quality}</span>
        <span class="analysis-detail">${m.detail}</span>
      </div>`).join("")}</div>
  </div>`;
  document.querySelector("#closeAnalysis").onclick=()=>modal.classList.add("hidden");
}

render();
engineWorker();
requestAnimationFrame(tick);
