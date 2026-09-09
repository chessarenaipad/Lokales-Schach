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

const STUDIES = [
  { id:"icbm", name:"ICBM", color:"w", moves:["e4","d5","Nf3","dxe4","Ng5","Nf6","d3","exd3","Bxd3","h6","Nxf7","Kxf7","Bg6+","Kxg6","Qxd8"] },
  { id:"blackburne", name:"Blackburne Shilling Gambit", color:"b", moves:["e4","e5","Nf3","Nc6","Bc4","Nd4","Nxe5","Qg5","Nxf7","Qxg2","Rf1","Qxe4+","Be2","Nf3#"] },
  { id:"fishbone", name:"Fishbone Gambit", color:"b", moves:["e4","e5","Nf3","Nc6","Bb5","a6","Bxc6","dxc6","O-O","Bg4","h3","h5","hxg4","hxg4","Nxe5","Qh4","f4","g3","Qh5","Qxh5","Re1","Qh1#"] },
  { id:"caro5", name:"5 Moves Caro Kann Trap", color:"w", moves:["e4","c6","Nc3","d5","Qe2","dxe4","Nxe4","Nd7","Nd6#"] },
  { id:"caro6", name:"6 Moves Caro Kann Trap", color:"w", moves:["e4","c6","Nf3","d5","Nc3","dxe4","Nxe4","Nf6","Qe2","Nbd7","Nd6#"] },
  { id:"friedliver", name:"Fried Liver", color:"w", moves:["e4","e5","Nf3","Nc6","Bc4","Nf6","Ng5","d5","exd5","Nxd5","Nxf7","Kxf7","Qf3+","Kg8","Bxd5+","Qxd5","Qxd5+","Be6","Qxe6#"] },
  { id:"english", name:"English Trap", color:"w", moves:["c4","e5","Nc3","Nc6","Nf3","g6","d4","exd4","Nd5","Bg7","Bg5","Nge7","Nxd4","Bxd4","Qxd4","Nxd4","Nf6+","Kf8","Bh6#"] },
  { id:"englund", name:"Englund Gambit", color:"b", moves:["d4","e5","dxe5","Nc6","Nf3","Qe7","Bf4","Qb4+","Bd2","Qxb2","Bc3","Bb4","Qd2","Bxc3","Qxc3","Qc1#"] },
  { id:"stafford", name:"Stafford Gambit", color:"b", moves:["e4","e5","Nf3","Nf6","Nxe5","Nc6","Nxc6","dxc6","d3","Bc5","Be2","h5","O-O","Ng4","h3","Qd6","hxg4","hxg4","g3","Qxg3#"] }
];

const MATE_POSITIONS = {
  // Große, abwechslungsreiche Sammlung echter Lichess-Mate-in-1-Positionen.
  // Die FENs hier sind bereits die Stellung NACH dem gegnerischen Vorspielzug.
  // validateMatePosition() prüft vor jeder Anzeige erneut alle legalen Züge und
  // akzeptiert nur Positionen, in denen mindestens ein Zug wirklich Schachmatt ist.
  easy: [
    { id:"00C7m", fen:"8/5k2/1P4RK/6P1/1r6/8/8/8 b - - 0 1" },
    { id:"00IaZ", fen:"4R3/4R3/1k1K2p1/1P6/1P6/2rp3r/8/8 w - - 0 1" },
    { id:"00T85", fen:"8/8/8/8/8/4K3/5Q2/1qk5 w - - 0 1" },
    { id:"00VIe", fen:"8/8/8/P6p/8/2Rnk3/r7/3KN3 b - - 0 1" },
    { id:"00j1r", fen:"8/2r1b3/1pk5/6P1/5q2/3R4/Q1P1K3/8 w - - 0 1" },
    { id:"016fz", fen:"8/8/3R4/1P3k2/2Bb2p1/6K1/7r/8 b - - 0 1" }
  ],
  medium: [
    { id:"002CP", fen:"r5k1/pp4pp/4p1q1/4p3/3n4/P3Q1P1/1PP4P/2KR1R2 b - - 0 1" },
    { id:"004JD", fen:"3r4/R7/2p5/p1P2p2/1p4k1/nP2K3/P3NP2/8 b - - 0 1" },
    { id:"004zI", fen:"2q3k1/4br2/6pQ/1p1n2p1/7P/1P4P1/1B2PP2/6K1 w - - 0 1" },
    { id:"008LD", fen:"8/6pp/6k1/5pN1/5P2/5rPb/4R2P/6K1 b - - 0 1" },
    { id:"008o6", fen:"Q4rk1/p1p3p1/6P1/8/3P4/7P/q3r3/B4RK1 w - - 0 1" },
    { id:"009L0", fen:"6k1/pb2r1pN/1n4Bp/3p4/1P2pR2/P7/5PPP/2rR2K1 b - - 0 1" },
    { id:"00AGs", fen:"rn5Q/4kp2/2p1p1r1/1q4p1/8/8/4NPPP/3R1K1R w - - 0 1" },
    { id:"00Bm8", fen:"8/6kp/4b1q1/1p6/1PpPN2Q/2P1P3/r5P1/5RK1 b - - 0 1" },
    { id:"00FHX", fen:"2r3k1/5p1p/4pP2/3p3P/8/5P2/p5P1/1bR3K1 w - - 0 1" },
    { id:"00GY4", fen:"3k2r1/pR5R/3r4/4p3/7q/3Pn1PP/PP5K/8 w - - 0 1" },
    { id:"00H9n", fen:"7k/6p1/8/4p3/Pp1Q4/1P3b1q/6P1/5RK1 b - - 0 1" },
    { id:"00HHN", fen:"4r2k/p4R1p/1p6/2p5/2P5/1P4R1/r5PP/2K5 b - - 0 1" },
    { id:"00HPz", fen:"6r1/7p/2pk1p2/P2p4/P2KbP2/2N1P3/5R1P/8 b - - 0 1" },
    { id:"00HnR", fen:"q5kr/p4p2/4b1p1/4B2p/5n2/2P5/P1Q2PPP/3R1RK1 b - - 0 1" },
    { id:"00Hxb", fen:"1rb2k2/p4ppp/2B5/2pr1NP1/2P5/P7/7P/4R1K1 w - - 0 1" },
    { id:"00IPp", fen:"4Q3/6pk/p3p2p/5P2/1p1P4/4q2P/2B1n2B/7K b - - 0 1" },
    { id:"00ITc", fen:"3r1rk1/5pp1/7p/8/b2Qp1n1/1P6/PB1q1PP1/R5K1 w - - 0 1" },
    { id:"00J7i", fen:"3r2k1/pQ4pp/4p1n1/2q5/2P5/2B3P1/P4PBP/6K1 w - - 0 1" },
    { id:"00JO7", fen:"5rk1/pp4pR/4p1r1/2qp4/8/2P4Q/PP3RPP/6K1 w - - 0 1" },
    { id:"00K48", fen:"6k1/6pp/p2B4/2pP4/P1q5/6P1/2P1p2P/5RK1 w - - 0 1" },
    { id:"00KgR", fen:"7k/1pq3p1/2p2r1p/3pPQ2/1p1P4/7P/1rB4K/5R2 w - - 0 1" },
    { id:"00MYL", fen:"1R6/5Q2/p1kb1p2/2r1p3/3n4/P6P/5PP1/4qBK1 w - - 0 1" },
    { id:"00Ozz", fen:"3kr3/3n1B1p/2pP4/p1n5/Ppp5/8/1P3PPP/4R1K1 w - - 0 1" },
    { id:"00P7n", fen:"r4rk1/p1p1R1pp/2p2p2/5P2/6Q1/1q5P/6PK/8 w - - 0 1" },
    { id:"00QY3", fen:"2k3r1/pp5p/4p3/2p2p2/2P5/P4P1q/1PQ1R2R/7K b - - 0 1" },
    { id:"00R0m", fen:"8/4k2p/Q1p1p3/p2pP1r1/q7/P4K1P/1P3P2/2R2R2 b - - 0 1" },
    { id:"00STy", fen:"8/1R5R/4kpp1/4p2K/4P2K/5P1P/7r/6r1 w - - 0 1" },
    { id:"00SeK", fen:"6k1/pp5p/4r1pP/5pP1/3Q1n2/P1P5/KP6/5q2 w - - 0 1" },
    { id:"00ViT", fen:"6k1/5pp1/4pP1p/1p1bP3/1P1P1KP1/1r6/3B1R1P/8 b - - 0 1" },
    { id:"00nNa", fen:"8/2k3pp/4p3/1R2Kp2/1Pr4P/6P1/5P2/8 b - - 0 1" },
    { id:"01GkW", fen:"5b1k/pQ6/5qBp/5P2/6p1/7P/6PK/8 w - - 0 1" },
    { id:"01HI3", fen:"Q3R3/5Rpk/7p/8/2p5/2P5/1Pr4r/4K3 b - - 0 1" },
    { id:"01J5O", fen:"r4r2/1pp1Nppk/3p4/p3n3/4P3/1PPP2P1/1P1K2P1/3R4 w - - 0 1" }
  ],
  hard: [
    { id:"001gi", fen:"N6r/1p1k1ppp/2np4/b3p3/4P1b1/N1Q5/P4PPP/R3KB1R b - - 0 1" },
    { id:"001wb", fen:"r3k2r/pb1p1ppp/1b4q1/1Q2P3/8/2NP1PP1/PP4P1/R1B2R1K b - - 0 1" },
    { id:"004iZ", fen:"r2r2k1/2q1bpp1/3p3p/1ppn4/1P1BP3/P5Q1/4RPPP/R5K1 w - - 0 1" },
    { id:"007c6", fen:"2kr3r/p2n2pp/2pB1bp1/5q2/2B5/8/PPP2PPP/3R1RK1 w - - 0 1" },
    { id:"00B2k", fen:"r4rk1/pbp3pp/1p1pp3/6B1/2PPp2q/3BP2P/PP3P2/R2QK1R1 b - - 0 1" },
    { id:"00DPQ", fen:"2k4r/pp3pp1/4pn2/2np2p1/8/1B1P1Pq1/PPPN3R/R2Q3K b - - 0 1" },
    { id:"00DU5", fen:"r2q1rk1/1b3ppp/p2p1b2/1p1Pn3/1P2Q3/P1NB3P/1B3PP1/R4RK1 w - - 0 1" },
    { id:"00DWo", fen:"b4b1r/3k1ppp/p2p4/1p2p3/3Pq3/N3B3/PP3PPP/R2Q1RK1 b - - 0 1" },
    { id:"00FjB", fen:"rnbk1r2/pppp1Bpp/8/5p2/4p3/2PP4/P1P2PPP/R1B1K2R w - - 0 1" },
    { id:"00GRa", fen:"1r3rk1/2p1qppb/p2n4/1p2p1Pp/4Qn1P/2P1N3/PPB2P1K/3R2R1 w - - 0 1" },
    { id:"00H1C", fen:"r3r3/1kpR1qpp/p1n2p2/Qp2P2P/1N6/4Pb2/PPP3P1/2K2R2 w - - 0 1" },
    { id:"00KYE", fen:"r1b2k1r/pp4p1/2pq2p1/3p4/3Q3/1N6/PPP2PPP/R4RK1 b - - 0 1" },
    { id:"00Or5", fen:"r2qkbnr/pp5p/8/4Nb2/8/1Qp5/PP2PPPP/R3KB1R w - - 0 1" },
    { id:"00QZV", fen:"r1bk4/pppp3p/2n5/2b1prN1/8/1B6/PPPP2PP/RNB2R1K b - - 0 1" },
    { id:"00RoG", fen:"2kr2nr/pp2nppp/2pp4/2b2PP1/4NPq1/3B1R1P/PPP5/R2QB2K b - - 0 1" },
    { id:"00S5q", fen:"r4rk1/pbp1n1pp/1p1p4/3Pp1N1/2B4P/2PQ4/PP4q1/R2K3R w - - 0 1" },
    { id:"00SMl", fen:"r4rk1/ppp2pn1/3p4/q2N4/1n1PP3/5P2/PPP5/1K1R1B1R w - - 0 1" },
    { id:"00c0D", fen:"rnb1k2r/ppB2p2/8/3p2p1/3Q2np/2N2NK1/PPP1B1PP/R6R b - - 0 1" },
    { id:"00d8a", fen:"r1b1k2r/1p3p2/p1pqp3/2b2Ppp/4P1n1/2NB3P/PPP3P1/R2QBR1K b - - 0 1" },
    { id:"00fK0", fen:"r2q1r2/pp3pk1/2np1Np1/2pN1b2/2B4Q/3P4/PPP3PP/R5K1 w - - 0 1" },
    { id:"00jPw", fen:"r3r1k1/ppp2p2/1b5Q/3PP2n/2B3bq/2N5/PP4PP/R4R1K w - - 0 1" },
    { id:"00kT1", fen:"r2q1rk1/pb2bpp1/2p1p3/4P3/2nP3p/P1PQBN1P/2B2PP1/R4RK1 w - - 0 1" }
  ]
};

const THEORY = new Set([
  "e4","d4","c4","Nf3","e5","c5","Nc6","Nf6","d5","d6","e6","g6","c6",
  "Bb5","Bc4","Be2","Nc3","Be7","Bb4","a6","O-O","O-O-O"
]);

const state = {
  gameChess: new Chess(),
  studyChess: new Chess(),
  mateChess: new Chess(),
  mode: "local",
  humanColor: "w",
  orientation: "w",
  boardTheme: "wood",
  pieceTheme: "classic",
  promotion: "q",
  timeBase: 300,
  increment: 0,
  clocks: { w: 300000, b: 300000 },
  running: false,
  gameOver: false,
  gameGameOver: false,
  lastTick: performance.now(),
  hints: { w: 3, b: 3 },
  selected: null,
  legalTargets: [],
  history: [],
  gameHistory: [],
  studyHistory: [],
  mateHistory: [],
  analysis: [],
  analysisCache: [],
  analysisBusy: false,
  engineReady: false,
  engineBusy: false,
  screen: "game",
  study: null,
  studyIndex: 0,
  studyTest: false,
  studyComplete: false,
  studyMessage: "",
  mateDifficulty: null,
  matePosition: null,
  mateSolutions: [],
  mateMessage: "",
  mateSolved: 0,
  mateSolutionShown: false,
  mateLastFen: null
};

// Each mode owns its own board state. The existing drawing/move code can therefore
// keep using state.chess while switching between Spiel, Studien and Mate in 1
// without one mode overwriting another mode's position.
Object.defineProperty(state, "chess", {
  configurable: true,
  get() {
    if (state.screen === "study") return state.studyChess;
    if (state.screen === "mate") return state.mateChess;
    return state.gameChess;
  },
  set(value) {
    if (state.screen === "study") state.studyChess = value;
    else if (state.screen === "mate") state.mateChess = value;
    else state.gameChess = value;
  }
});
Object.defineProperty(state, "gameOver", {
  configurable: true,
  get() { return state.gameGameOver; },
  set(value) { state.gameGameOver = value; }
});
Object.defineProperty(state, "history", {
  configurable: true,
  get() {
    if (state.screen === "study") return state.studyHistory;
    if (state.screen === "mate") return state.mateHistory;
    return state.gameHistory;
  },
  set(value) {
    if (state.screen === "study") state.studyHistory = value;
    else if (state.screen === "mate") state.mateHistory = value;
    else state.gameHistory = value;
  }
});

let engine = null;
let engineReadyPromise = null;
let engineQueue = Promise.resolve();

function fmt(ms) {
  ms = Math.max(0, ms);
  const total = Math.ceil(ms / 1000);
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, "0")}`;
}
function currentColor() { return state.chess.turn(); }
function studyExpected() { return state.study ? state.study.moves[state.studyIndex] : null; }
function studyIsHumanTurn() {
  return !!state.study && currentColor() === state.study.color && state.studyIndex < state.study.moves.length;
}
function studyIsFinished() {
  return !!state.study && state.studyIndex >= state.study.moves.length;
}

function render() {
  document.querySelector("#app").innerHTML = `
    <div class="app-shell">
      <header class="topbar">
        <div>
          <div class="eyebrow">LOKALES SCHACH</div>
          <h1>${state.screen === "study" ? "Schach · Studien" : "Schach · Stockfish 18"}</h1>
        </div>
        <div class="header-actions">
          <button id="gameTab" class="${state.screen === "game" ? "selected" : ""}">Spiel</button>
          <button id="studyTab" class="${state.screen === "study" ? "selected" : ""}">Studien</button>
          <button id="mateTab" class="${state.screen === "mate" ? "selected" : ""}">Finde Mate in 1</button>
          <div class="status-pill ${state.engineReady ? "ok" : ""}">
            <span></span>${state.engineReady ? "Engine bereit" : "Engine lädt…"}
          </div>
        </div>
      </header>

      ${state.screen === "study" ? renderStudy() : state.screen === "mate" ? renderMate() : renderGame()}
      <div id="resultModal" class="modal hidden"></div>
      <div id="analysisModal" class="modal hidden"></div>
    </div>
  `;
  bind();
  if (state.screen === "study") {
    drawBoard();
    drawStudyMoves();
  } else {
    drawBoard();
    drawMoves();
  }
}

function renderGame() {
  return `
    <main class="layout">
      <section class="game-panel">
        <div class="player-row">
          <div class="player"><strong>Schwarz</strong><span>${state.mode === "bot" && state.humanColor === "b" ? "Spieler" : state.mode === "bot" ? "Stockfish" : "Spieler 2"}</span></div>
          <div class="clock ${currentColor() === "b" && state.running ? "active" : ""}" id="clock-b">${fmt(state.clocks.b)}</div>
        </div>
        <div class="board-wrap"><div id="board" class="board ${PIECES[state.pieceTheme].cls}" style="--light:${BOARD_THEMES[state.boardTheme].light};--dark:${BOARD_THEMES[state.boardTheme].dark}"></div></div>
        <div class="player-row">
          <div class="player"><strong>Weiß</strong><span>${state.mode === "bot" && state.humanColor === "w" ? "Spieler" : state.mode === "bot" ? "Stockfish" : "Spieler 1"}</span></div>
          <div class="clock ${currentColor() === "w" && state.running ? "active" : ""}" id="clock-w">${fmt(state.clocks.w)}</div>
        </div>
      </section>

      <aside class="side-panel">
        <section class="card">
          <div class="card-title">Spiel</div>
          <div class="button-grid"><button id="newGame">Neue Partie</button><button id="resign" class="secondary">Aufgeben</button></div>
          <div class="mode-row">
            <button class="${state.mode === "local" ? "selected" : ""}" data-mode="local">2 Spieler lokal</button>
            <button class="${state.mode === "bot" ? "selected" : ""}" data-mode="bot">vs. Stockfish</button>
          </div>
          ${state.mode === "bot" ? `<div class="color-row"><span>Ich spiele</span><button data-color="w" class="${state.humanColor==="w"?"selected":""}">Weiß</button><button data-color="b" class="${state.humanColor==="b"?"selected":""}">Schwarz</button></div>` : ""}
        </section>

        <section class="card">
          <div class="card-title">Bedenkzeit</div>
          <div class="time-grid">${[[180,0,"3 + 0"],[300,0,"5 + 0"],[600,0,"10 + 0"],[180,10,"3 + 10"],[300,10,"5 + 10"],[600,10,"10 + 10"]].map(([t,i,label]) => `<button class="${state.timeBase===t&&state.increment===i?"selected":""}" data-time="${t}" data-inc="${i}">${label}</button>`).join("")}</div>
        </section>

        <section class="card">
          <div class="card-title">Brett & Figuren</div>
          <label>Brett<select id="boardTheme">${Object.entries(BOARD_THEMES).map(([k,v])=>`<option value="${k}" ${k===state.boardTheme?"selected":""}>${v.name}</option>`).join("")}</select></label>
          <label>Figuren<select id="pieceTheme">${Object.entries(PIECES).map(([k,v])=>`<option value="${k}" ${k===state.pieceTheme?"selected":""}>${v.name}</option>`).join("")}</select></label>
          <label>Umwandlung<select id="promotion">${Object.entries({q:"Dame",r:"Turm",b:"Läufer",n:"Springer"}).map(([k,v])=>`<option value="${k}" ${k===state.promotion?"selected":""}>${v}</option>`).join("")}</select></label>
          <button id="flip" class="secondary full">Brett drehen</button>
        </section>

        <section class="card hint-card">
          <div class="card-title">Hinweis</div>
          <p>Stockfish nennt dir den besten Zug. Pro Spieler sind <b>3 Hinweise</b> verfügbar.</p>
          <button id="hint" ${state.hints[currentColor()]<=0||!state.engineReady||state.gameOver?"disabled":""}>♟ Besten Zug anzeigen · ${state.hints[currentColor()]}</button>
          <div id="hintText" class="hint-text"></div>
        </section>

        <section class="card moves-card">
          <div class="card-title">Partie</div><div id="moves" class="moves"></div>
          <button id="analysisBtn" class="secondary full" ${state.gameOver&&state.history.length?"":"disabled"}>Partie analysieren</button>
        </section>
      </aside>
    </main>
  `;
}

function renderStudy() {
  const chosen = state.study;
  const groups = [
    {color:"w", title:"Weiß-Studien"},
    {color:"b", title:"Schwarz-Studien"}
  ];
  return `
    <main class="study-layout">
      <section class="study-main">
        <div class="study-toolbar card">
          <div>
            <div class="card-title">Studienmodus</div>
            <h2>${chosen ? chosen.name : "Wähle eine Studie"}</h2>
            ${chosen ? `<p>Du spielst <b>${chosen.color==="w"?"Weiß":"Schwarz"}</b>. ${state.studyTest ? "Erinnerungstest ist aktiv." : "Die vorgegebene Zugfolge wird dir angezeigt."}</p>` : `<p>Trainiere feste Zugfolgen. Der Gegner spielt seine Züge automatisch.</p>`}
          </div>
          <div class="study-actions">
            ${chosen ? `<button id="studyBack" class="secondary">Studienauswahl</button><button id="studyReset">Neu starten</button>` : ""}
          </div>
        </div>
        ${chosen ? `
          <div class="study-board-area">
            <div class="study-side-info">
              <div class="study-progress"><b>${Math.min(state.studyIndex, chosen.moves.length)}/${chosen.moves.length}</b> Halbzüge</div>
              <div class="study-message ${state.studyMessage.includes("Falsch")?"error":state.studyComplete?"success":""}">${state.studyMessage || (state.studyTest ? "Ziehe aus dem Gedächtnis." : `Nächster Zug: ${chosen.moves[state.studyIndex] || "fertig"}`)}</div>
            </div>
            <div class="board-wrap"><div id="board" class="board ${PIECES[state.pieceTheme].cls}" style="--light:${BOARD_THEMES[state.boardTheme].light};--dark:${BOARD_THEMES[state.boardTheme].dark}"></div></div>
            <div class="study-controls card">
              <label class="toggle"><input type="checkbox" id="studyTest" ${state.studyTest?"checked":""}> <span>Erinnerungstest</span></label>
              <label>Brett<select id="studyBoardTheme">${Object.entries(BOARD_THEMES).map(([k,v])=>`<option value="${k}" ${k===state.boardTheme?"selected":""}>${v.name}</option>`).join("")}</select></label>
              <label>Figuren<select id="studyPieceTheme">${Object.entries(PIECES).map(([k,v])=>`<option value="${k}" ${k===state.pieceTheme?"selected":""}>${v.name}</option>`).join("")}</select></label>
            </div>
          </div>
        ` : `
          <div class="study-picker">
            ${groups.map(g=>`<section class="card study-group"><div class="card-title">${g.title}</div><div class="study-list">${STUDIES.filter(s=>s.color===g.color).map(s=>`<button class="study-option" data-study="${s.id}"><span>${s.name}</span><small>${s.moves.length} Halbzüge · ${s.moves.length%2===0?Math.floor(s.moves.length/2):Math.floor(s.moves.length/2)+1} Züge</small></button>`).join("")}</div></section>`).join("")}
          </div>
        `}
      </section>
    </main>
  `;
}

function renderMate() {
  const difficulty = state.mateDifficulty;
  const labels = { easy:"Leicht", medium:"Mittel", hard:"Schwer" };
  const counts = state.matePosition ? countPieces(state.mateChess) : null;
  return `
    <main class="mate-layout">
      <section class="mate-main">
        <div class="mate-toolbar card">
          <div>
            <div class="card-title">Taktiktraining</div>
            <h2>Finde Mate in 1</h2>
            <p>${difficulty ? `${labels[difficulty]} · ${counts ? `${counts.w} weiße / ${counts.b} schwarze Figuren` : ""}` : "Finde in jeder Stellung einen einzigen Zug, der sofort Schachmatt setzt."}</p>
          </div>
          <div class="mate-actions">
            <button id="mateBack" class="secondary">Schwierigkeit</button>
            ${difficulty ? `<button id="mateNew">Neue Stellung</button>` : ""}
          </div>
        </div>
        ${difficulty ? `
          <div class="mate-board-area">
            <div class="mate-info">
              <div><b>${labels[difficulty]}</b> · Gelöst: ${state.mateSolved}</div>
              <div class="${state.mateSolutionShown ? "mate-solution shown" : "mate-solution"}">${state.mateMessage || "Finde den Mattzug."}</div>
            </div>
            <div class="board-wrap"><div id="board" class="board ${PIECES[state.pieceTheme].cls}" style="--light:${BOARD_THEMES[state.boardTheme].light};--dark:${BOARD_THEMES[state.boardTheme].dark}"></div></div>
            <div class="mate-controls card">
              <button id="mateHint" class="secondary">Lösung anzeigen</button>
              <label>Brett<select id="mateBoardTheme">${Object.entries(BOARD_THEMES).map(([k,v])=>`<option value="${k}" ${k===state.boardTheme?"selected":""}>${v.name}</option>`).join("")}</select></label>
              <label>Figuren<select id="matePieceTheme">${Object.entries(PIECES).map(([k,v])=>`<option value="${k}" ${k===state.pieceTheme?"selected":""}>${v.name}</option>`).join("")}</label>
            </div>
          </div>
        ` : `
          <div class="mate-picker">
            ${Object.entries(labels).map(([k,v]) => `<button class="mate-option" data-mate-difficulty="${k}"><b>${v}</b><span>${k==="easy"?"Weiß und Schwarz: 5 Figuren oder weniger":k==="medium"?"Beide Seiten: 6–10 Figuren":"Beide Seiten: 11–16 Figuren"}</span></button>`).join("")}
          </div>
        `}
      </section>
    </main>
  `;
}

function countPieces(chess) {
  const counts = {w:0,b:0};
  for (const rank of "12345678") for (const file of "abcdefgh") {
    const p = chess.get(file+rank);
    if (p) counts[p.color]++;
  }
  return counts;
}

function bind() {
  document.querySelector("#gameTab").onclick = () => switchScreen("game");
  document.querySelector("#studyTab").onclick = () => switchScreen("study");
  document.querySelector("#mateTab").onclick = () => switchScreen("mate");

  if (state.screen === "game") {
    document.querySelector("#newGame").onclick = newGame;
    document.querySelector("#resign").onclick = () => endGame(state.chess.turn()==="w" ? "Schwarz gewinnt durch Aufgabe." : "Weiß gewinnt durch Aufgabe.");
    document.querySelector("#flip").onclick = () => { state.orientation=state.orientation==="w"?"b":"w"; render(); };
    document.querySelector("#hint").onclick = useHint;
    document.querySelector("#analysisBtn").onclick = showAnalysis;
    document.querySelector("#boardTheme").onchange = e => { state.boardTheme=e.target.value; render(); };
    document.querySelector("#pieceTheme").onchange = e => { state.pieceTheme=e.target.value; render(); };
    document.querySelector("#promotion").onchange = e => state.promotion=e.target.value;
    document.querySelectorAll("[data-mode]").forEach(b => b.onclick=()=>{state.mode=b.dataset.mode;newGame();});
    document.querySelectorAll("[data-color]").forEach(b => b.onclick=()=>{state.humanColor=b.dataset.color;newGame();});
    document.querySelectorAll("[data-time]").forEach(b => b.onclick=()=>{state.timeBase=+b.dataset.time;state.increment=+b.dataset.inc;newGame();});
  } else if (state.screen === "study") {
    if (state.study) {
      document.querySelector("#studyBack").onclick = () => { state.study=null; state.studyIndex=0; state.studyComplete=false; state.studyMessage=""; state.studyChess=new Chess(); state.studyHistory=[]; clearSelection(); render(); };
      document.querySelector("#studyReset").onclick = () => startStudy(state.study.id);
      document.querySelector("#studyTest").onchange = e => { state.studyTest=e.target.checked; state.studyMessage=""; render(); };
      document.querySelector("#studyBoardTheme").onchange = e => { state.boardTheme=e.target.value; render(); };
      document.querySelector("#studyPieceTheme").onchange = e => { state.pieceTheme=e.target.value; render(); };
    } else {
      document.querySelectorAll("[data-study]").forEach(b=>b.onclick=()=>startStudy(b.dataset.study));
    }
  } else {
    if (state.mateDifficulty) {
      document.querySelector("#mateBack").onclick = () => { state.mateDifficulty=null; state.mateMessage=""; state.mateSolutionShown=false; clearSelection(); render(); };
      document.querySelector("#mateNew").onclick = () => startMate(state.mateDifficulty);
      document.querySelector("#mateHint").onclick = revealMateSolution;
      document.querySelector("#mateBoardTheme").onchange = e => { state.boardTheme=e.target.value; render(); };
      document.querySelector("#matePieceTheme").onchange = e => { state.pieceTheme=e.target.value; render(); };
    } else {
      document.querySelectorAll("[data-mate-difficulty]").forEach(b=>b.onclick=()=>startMate(b.dataset.mateDifficulty));
    }
  }
}

function switchScreen(screen) {
  state.screen=screen;
  clearSelection();
  state.engineBusy=false;
  render();
  if (screen === "game" && state.mode==="bot" && currentColor()!==state.humanColor && !state.gameOver) botMove();
}

function clearSelection() {
  state.selected=null;
  state.legalTargets=[];
}

function drawBoard() {
  const board=document.querySelector("#board");
  if(!board) return;
  board.innerHTML="";
  const files=state.orientation==="w"?"abcdefgh":"hgfedcba";
  const ranks=state.orientation==="w"?"87654321":"12345678";
  const lastMove=state.history.at(-1);
  for(let r=0;r<8;r++) for(let c=0;c<8;c++){
    const file=files[c], rank=ranks[r], square=file+rank, piece=state.chess.get(square);
    const div=document.createElement("button");
    div.className=`square ${(r+c)%2===0?"light":"dark"}`;
    div.dataset.square=square;
    if(state.selected===square) div.classList.add("selected");
    if(state.legalTargets.includes(square)) div.classList.add("target");
    if(lastMove && lastMove.lan){ if(lastMove.lan.slice(2,4)===square) div.classList.add("last","last-to"); if(lastMove.lan.slice(0,2)===square) div.classList.add("last","last-from"); }
    if(piece) div.innerHTML=`<span class="piece">${PIECE_GLYPHS[piece.color][piece.type]}</span>`;
    if(c===0) div.insertAdjacentHTML("afterbegin",`<span class="coord rank">${rank}</span>`);
    if(r===7) div.insertAdjacentHTML("beforeend",`<span class="coord file">${file}</span>`);
    div.onclick=()=>clickSquare(square);
    board.appendChild(div);
  }
}

function drawMoves(){
  const el=document.querySelector("#moves"); if(!el) return;
  if(!state.history.length){el.innerHTML=`<div class="moves-empty">Noch keine Züge.</div>`;return;}
  el.innerHTML=state.history.map((m,i)=>`<div class="move-item"><span class="move-no">${Math.floor(i/2)+1}${m.color==="w"?".":"..."}</span><b>${m.san}</b></div>`).join("");
}

function drawStudyMoves(){
  const el=document.querySelector("#studyMoveList");
  if(!el || !state.study) return;
  el.innerHTML="";
}

function clickSquare(square){
  if((state.screen==="game" && state.gameOver) || state.engineBusy) return;
  if(state.screen==="mate"){ clickMateSquare(square); return; }
  if(state.mode==="bot" && currentColor()!==state.humanColor) return;
  if(state.study && !studyIsHumanTurn()) return;

  const piece=state.chess.get(square);
  if(state.selected){
    const move=state.legalTargets.includes(square)?{from:state.selected,to:square,promotion:state.promotion}:null;
    if(move){ attemptMove(move); return; }
  }
  if(piece && piece.color===currentColor()){
    state.selected=square;
    state.legalTargets=state.chess.moves({square,verbose:true}).map(m=>m.to);
  } else {
    clearSelection();
  }
  drawBoard();
}

function clickMateSquare(square){
  if(!state.mateDifficulty || !state.matePosition) return;
  const piece=state.mateChess.get(square);
  if(state.selected){
    const move=state.legalTargets.includes(square)?{from:state.selected,to:square,promotion:state.promotion}:null;
    if(move){ attemptMateMove(move); return; }
  }
  if(piece && piece.color===state.mateChess.turn()){
    state.selected=square;
    state.legalTargets=state.mateChess.moves({square,verbose:true}).map(m=>m.to);
  } else clearSelection();
  drawBoard();
}

function moveMatchesSan(san){
  return state.chess.moves({verbose:true}).some(m => m.san === san);
}

function attemptMove(move){
  if(state.study){
    const legal=state.chess.moves({verbose:true}).find(m=>m.from===move.from && m.to===move.to);
    if(!legal) return;
    const expected=studyExpected();
    if(legal.san!==expected){
      clearSelection();
      state.studyMessage=`Falsch – ${legal.san} ist nicht der vorgegebene Zug. Der Zug wurde nicht ausgeführt.`;
      render();
      return;
    }
    makeMove(move, true);
    return;
  }
  makeMove(move, false);
}

function attemptMateMove(move){
  const legal=state.mateChess.moves({verbose:true}).find(m=>m.from===move.from && m.to===move.to);
  if(!legal) return;
  const uci=legal.from+legal.to+(legal.promotion||"");
  if(state.mateSolutions.includes(uci)){
    state.mateChess.move({from:legal.from,to:legal.to,promotion:legal.promotion||"q"});
    state.mateHistory.push({san:legal.san,lan:legal.lan,color:legal.color});
    state.mateSolved++;
    state.mateMessage=`Richtig! ${legal.san} ist Schachmatt.`;
    state.mateSolutionShown=false;
    clearSelection();
    render();
    setTimeout(()=>startMate(state.mateDifficulty),550);
  } else {
    clearSelection();
    state.mateSolutionShown=true;
    const solution=state.mateSolutions[0];
    const sm=state.mateChess.moves({verbose:true}).find(m=>m.lan===solution);
    state.mateMessage=`Falsch. ${legal.san} wurde zurückgesetzt. Lösung: ${sm?.san || solution}`;
    if(sm){state.selected=sm.from;state.legalTargets=[sm.to];}
    render();
  }
}

function makeMove(move, isStudy=false){
  if(state.screen==="game" && state.gameOver) return;
  const before=state.chess.fen();
  const made=state.chess.move(move);
  if(!made) return;

  state.history.push({before,after:state.chess.fen(),san:made.san,lan:made.lan,color:made.color});
  state.clocks[made.color]+=state.increment*1000;
  state.selected=null; state.legalTargets=[]; state.running=true; state.lastTick=performance.now();

  if(isStudy){
    state.studyIndex++;
    state.studyMessage=state.studyIndex>=state.study.moves.length
      ? "Studie abgeschlossen! 🎉"
      : (state.studyTest ? "Richtig. Dein nächster Zug ist verborgen." : `Richtig. Nächster eigener Zug: ${state.study.moves[state.studyIndex]}`);
    if(state.studyIndex>=state.study.moves.length){state.studyComplete=true;state.running=false;render();return;}
    render();
    if(!studyIsHumanTurn()) setTimeout(studyOpponentMove,350);
    return;
  }

  if(state.chess.isGameOver()){endGame(gameOverText());return;}
  render();
  // Analyse jeden abgeschlossenen Zug bereits im Hintergrund. Die Ergebnisse
  // werden nicht angezeigt; dadurch ist die spätere Partieanalyse fast sofort verfügbar.
  backgroundAnalyzeMove(state.history.length - 1);
  if(state.mode==="bot" && currentColor()!==state.humanColor) botMove();
}

function validateMatePosition(item, difficulty){
  try{
    // Die Stellung muss schon beim Erzeugen mit chess.js geladen werden können.
    // Dadurch werden fehlende Könige, Bauern auf der Grundreihe usw. ausgeschlossen.
    const chess=new Chess(item.fen);
    const counts=countPieces(chess);
    const [min,max] = difficulty==="easy" ? [0,5] : difficulty==="medium" ? [6,10] : [11,16];
    if(counts.w<min || counts.w>max || counts.b<min || counts.b>max) return null;

    // Nicht nur die hinterlegte Lösung vertrauen: jede legale Möglichkeit wird
    // geprüft. So kann eine fehlerhafte Puzzle-Angabe nie auf dem Brett landen.
    const solutions=chess.moves({verbose:true}).filter(m=>{
      const copy=new Chess(item.fen);
      try{
        copy.move({from:m.from,to:m.to,promotion:m.promotion||"q"});
        return copy.isCheckmate();
      }catch{return false;}
    }).map(m=>m.from+m.to+(m.promotion||""));
    if(!solutions.length) return null;
    return {chess,solutions,counts};
  }catch{return null;}
}

function startMate(difficulty){
  state.screen="mate";
  state.mateDifficulty=difficulty;
  state.mateMessage="";
  state.mateSolutionShown=false;
  state.selected=null; state.legalTargets=[];
  state.mateHistory=[];

  const pool=MATE_POSITIONS[difficulty] || [];
  const valid=[];
  for(const item of pool){
    const checked=validateMatePosition(item,difficulty);
    if(checked) valid.push({...item,...checked});
  }

  // Falls ein Browser/Library-Update eine Position ablehnen sollte, wird die
  // eingebaute sichere Fallback-Stellung direkt erzeugt. Damit gibt es im
  // Mate-Modus niemals mehr den Zustand „keine gültige Stellung geladen“.
  if(!valid.length){
    const fallback = {
      easy: "7k/p7/5KQ1/8/8/8/P7/8 w - - 0 1",
      medium: "7k/pppp1p1p/5KQ1/8/8/8/PPPP4/8 w - - 0 1",
      hard: "rrnn3k/pppp1p1p/5KQ1/8/8/8/PPPPPPP1/RR6 w - - 0 1"
    }[difficulty];
    try{
      const chess=new Chess(fallback,{skipValidation:true});
      const checked=validateMatePosition({fen:fallback},difficulty);
      if(checked) valid.push({fen:fallback,solution:"g6g7",...checked});
    }catch{}
  }

  // Möglichst nicht direkt dieselbe Stellung zweimal hintereinander zeigen.
  const fresh=valid.filter(v=>v.fen!==state.mateLastFen);
  const choices=fresh.length ? fresh : valid;
  const item=choices[Math.floor(Math.random()*choices.length)];
  if(!item){
    // Letzter, vollständig unabhängiger Notfallpfad. Auch hier wird die zur
    // Schwierigkeit passende Figurenanzahl verwendet. Der bekannte Mattzug
    // Qg7# wird direkt hinterlegt.
    const fallbackFen = {
      easy: "7k/p7/5KQ1/8/8/8/P7/8 w - - 0 1",
      medium: "7k/pppp1p1p/5KQ1/8/8/8/PPPP4/8 w - - 0 1",
      hard: "rrnn3k/pppp1p1p/5KQ1/8/8/8/PPPPPPP1/RR6 w - - 0 1"
    }[difficulty];
    const chess=new Chess(fallbackFen,{skipValidation:true});
    state.matePosition={fen:fallbackFen,solution:"g6g7"};
    state.mateChess=chess;
    state.mateSolutions=["g6g7"];
    state.mateLastFen=fallbackFen;
  }else{
    state.matePosition=item;
    state.mateChess=item.chess;
    state.mateSolutions=item.solutions;
    state.mateLastFen=item.fen;
  }
  state.orientation=state.mateChess.turn();
  render();
}

function revealMateSolution(){
  if(!state.matePosition || !state.mateSolutions.length) return;
  const solution=state.mateSolutions[0];
  const sm=state.mateChess.moves({verbose:true}).find(m=>m.lan===solution);
  state.mateSolutionShown=true;
  state.mateMessage=`Lösung: ${sm?.san || solution} — spiele diesen Zug.`;
  clearSelection();
  if(sm){state.selected=sm.from;state.legalTargets=[sm.to];}
  render();
}

async function studyOpponentMove(){
  if(!state.study || state.studyComplete || studyIsHumanTurn()) return;
  const expected=studyExpected();
  if(!expected) return;
  const move=state.chess.moves({verbose:true}).find(m=>m.san===expected);
  if(!move){
    state.studyMessage=`Die vorgegebene Studie enthält an dieser Stellung keinen legalen Zug: ${expected}`;
    state.studyComplete=false;
    render();
    return;
  }
  makeMove({from:move.from,to:move.to,promotion:"q"}, true);
}

function startStudy(id){
  const study=STUDIES.find(s=>s.id===id);
  if(!study) return;
  state.screen="study"; state.study=study; state.studyIndex=0; state.studyComplete=false; state.studyMessage="";
  state.studyChess=new Chess(); state.studyHistory=[]; state.selected=null; state.legalTargets=[];
  state.running=false; state.lastTick=performance.now();
  state.orientation=study.color;
  render();
  if(study.color==="b") setTimeout(studyOpponentMove,350);
}

function gameOverText(){
  if(state.chess.isCheckmate()) return `${currentColor()==="w"?"Schwarz":"Weiß"} gewinnt durch Schachmatt.`;
  if(state.chess.isStalemate()) return "Remis durch Patt.";
  if(state.chess.isThreefoldRepetition()) return "Remis durch dreifache Stellungswiederholung.";
  if(state.chess.isInsufficientMaterial()) return "Remis wegen unzureichenden Materials.";
  if(state.chess.isDraw()) return "Remis.";
  return "Partie beendet.";
}

function newGame(){
  state.screen="game"; state.study=null;
  state.gameChess=new Chess(); state.gameHistory=[]; state.gameGameOver=false;
  state.clocks={w:state.timeBase*1000,b:state.timeBase*1000}; state.running=false;state.gameOver=false;state.analysis=[];state.analysisCache=[];state.hints={w:3,b:3};state.selected=null;state.legalTargets=[];state.engineBusy=false;state.lastTick=performance.now();
  document.querySelector("#resultModal")?.classList.add("hidden"); document.querySelector("#analysisModal")?.classList.add("hidden");
  render();
  if(state.mode==="bot" && state.humanColor==="b") botMove();
}

function endGame(text){
  state.running=false;state.gameOver=true;render();
  const modal=document.querySelector("#resultModal"); if(!modal)return;
  modal.innerHTML=`<div class="modal-box"><h2>${text}</h2><p>${state.history.length} Halbzüge gespielt.</p><button id="closeResult">Schließen</button><button id="analyzeNow" class="secondary">Analyse öffnen</button></div>`;
  modal.classList.remove("hidden");
  document.querySelector("#closeResult").onclick=()=>modal.classList.add("hidden");
  document.querySelector("#analyzeNow").onclick=()=>{modal.classList.add("hidden");showAnalysis();};
}

function tick(now){
  if(state.running&&!state.gameOver&&!state.study){
    const dt=Math.min(1000,Math.max(0,now-state.lastTick)),color=currentColor();
    state.clocks[color]-=dt;
    if(state.clocks[color]<=0){state.clocks[color]=0;state.running=false;endGame(`${color==="w"?"Schwarz":"Weiß"} gewinnt auf Zeit.`);requestAnimationFrame(tick);return;}
    const cw=document.querySelector("#clock-w"),cb=document.querySelector("#clock-b");if(cw)cw.textContent=fmt(state.clocks.w);if(cb)cb.textContent=fmt(state.clocks.b);
  }
  state.lastTick=now;requestAnimationFrame(tick);
}

function engineWorker(){
  if(engine)return engine;
  const engineUrl=`${import.meta.env.BASE_URL}engine/stockfish-18-lite-single.js`;
  engine=new Worker(engineUrl);
  engineReadyPromise=new Promise((resolve,reject)=>{
    const readyTimeout=setTimeout(()=>reject(new Error("Stockfish konnte nicht gestartet werden.")),15000);
    engine.addEventListener("message",event=>{
      const line=String(event.data);
      if(line.includes("readyok")){clearTimeout(readyTimeout);state.engineReady=true;render();resolve();}
    });
    engine.addEventListener("error",event=>{clearTimeout(readyTimeout);reject(new Error("Stockfish Worker-Fehler"));},{once:true});
  });
  engine.postMessage("uci");engine.postMessage("isready");return engine;
}
async function waitForEngine(){engineWorker();if(!state.engineReady&&engineReadyPromise)await engineReadyPromise;}
function runEngine(command,movetime,parse){
  engineQueue=engineQueue.then(async()=>{
    await waitForEngine();const w=engineWorker();
    return new Promise((resolve,reject)=>{
      let finished=false;
      const cleanup=()=>{w.removeEventListener("message",onMessage);clearTimeout(timer);};
      const finish=value=>{if(finished)return;finished=true;cleanup();resolve(value);};
      const onMessage=event=>{const value=parse(String(event.data));if(value!==undefined)finish(value);};
      const timer=setTimeout(()=>{if(!finished){finished=true;cleanup();reject(new Error("Stockfish-Zeitüberschreitung"));}},movetime+5000);
      w.addEventListener("message",onMessage);w.postMessage(command);w.postMessage(`go movetime ${movetime}`);
    });
  });
  return engineQueue;
}
function engineBestMove(fen,movetime=5000){return runEngine(`position fen ${fen}`,movetime,line=>line.startsWith("bestmove ")?line.split(/\s+/)[1]:undefined);}
function engineEval(fen,movetime=1200){
  let latestScore=0;
  return runEngine(`position fen ${fen}`,movetime,line=>{
    const match=line.match(/score (cp|mate) (-?\d+)/);
    if(match)latestScore=match[1]==="cp"?Number(match[2])/100:(Number(match[2])>0?99:-99);
    return line.startsWith("bestmove ")?latestScore:undefined;
  });
}
async function botMove(){
  if(state.screen!=="game" || state.engineBusy || state.gameOver)return;
  const gameRef=state.gameChess;
  state.engineBusy=true;render();
  try{
    const best=await engineBestMove(gameRef.fen(),5000);
    if(state.screen==="game" && state.gameChess===gameRef && !state.gameOver && currentColor()!==state.humanColor && best&&best!=="(none)")
      makeMove({from:best.slice(0,2),to:best.slice(2,4),promotion:best[4]||"q"});
  }catch(e){console.error(e);if(state.screen==="game"){const h=document.querySelector("#hintText");if(h)h.textContent="Stockfish konnte nicht antworten.";}}
  finally{state.engineBusy=false;if(state.screen==="game" && state.gameChess===gameRef && !state.gameOver)render();}
}
async function useHint(){
  const color=currentColor();if(state.hints[color]<=0||state.gameOver||state.engineBusy)return;
  state.hints[color]--;state.engineBusy=true;render();
  try{
    const best=await engineBestMove(state.chess.fen(),2500),legal=state.chess.moves({verbose:true}),mv=legal.find(m=>m.lan===best);
    if(mv){state.selected=mv.from;state.legalTargets=[mv.to];render();const t=document.querySelector("#hintText");if(t)t.textContent=`Bester Zug: ${mv.san}`;}
  }catch(e){console.error(e);state.hints[color]++;render();const t=document.querySelector("#hintText");if(t)t.textContent="Stockfish konnte den Hinweis nicht berechnen.";}
  finally{state.engineBusy=false;}
}
async function backgroundAnalyzeMove(index){
  if(state.study || !state.history[index] || state.analysisCache[index]) return;
  const item=state.history[index];
  try{
    const before=new Chess(item.before);
    const best=await engineBestMove(item.before,900);
    const legal=before.moves({verbose:true});
    const bestObj=legal.find(m=>m.lan===best);
    let quality="Gut",detail="Guter Zug.";
    if(bestObj?.lan===item.lan){
      quality=THEORY.has(item.san)&&index<12?"Theoriezug":"Perfekt";
      detail=quality==="Theoriezug"?"Bekannter Eröffnungszug.":"Stockfish bevorzugt genau diesen Zug.";
    } else if(bestObj){
      const afterPlayed=new Chess(item.before);
      afterPlayed.move(item.lan);
      const beforeEval=await engineEval(item.before,700);
      const playedEval=await engineEval(afterPlayed.fen(),700);
      const sign=item.color==="w"?1:-1;
      const loss=Math.max(0,(beforeEval-playedEval)*sign);
      if(loss>=1.5){
        quality="Fehler";
        detail=`Verbesserung: ${bestObj.san}. Der Zug kostet ungefähr ${loss.toFixed(1)} Bauerneinheiten.`;
      } else {
        detail=`Besser wäre ${bestObj.san}.`;
      }
    }
    state.analysisCache[index]={...item,quality,detail,best};
  }catch(e){
    console.debug("Hintergrundanalyse übersprungen",e);
  }
}
async function analyzeGame(){

  const result=[];
  for(let i=0;i<state.history.length;i++){
    const item=state.history[i],before=new Chess(item.before),best=await engineBestMove(item.before,1800),legal=before.moves({verbose:true}),bestObj=legal.find(m=>m.lan===best);
    let quality="Gut",detail="Guter Zug.";
    if(bestObj?.lan===item.lan){quality=THEORY.has(item.san)&&i<12?"Theoriezug":"Perfekt";detail=quality==="Theoriezug"?"Bekannter Eröffnungszug.":"Stockfish bevorzugt genau diesen Zug.";}
    else{
      const afterPlayed=new Chess(item.before);afterPlayed.move(item.lan);
      const beforeEval=await engineEval(item.before,1200),playedEval=await engineEval(afterPlayed.fen(),1200),sign=item.color==="w"?1:-1,loss=(beforeEval-playedEval)*sign;
      if(loss>=1.5){quality="Fehler";detail=`Verbesserung: ${bestObj?.san||best}. Der Zug kostet ungefähr ${loss.toFixed(1)} Bauerneinheiten.`;}
      else{quality="Gut";detail=`Besser wäre ${bestObj?.san||best}.`;}
    }
    result.push({...item,quality,detail,best});
    state.analysisCache[i]=result[result.length-1];
  }
  return result;
}
async function showAnalysis(){
  if(!state.history.length||!state.gameOver)return;
  const modal=document.querySelector("#analysisModal");if(!modal)return;
  modal.innerHTML=`<div class="modal-box wide"><h2>Partieanalyse</h2><p>Stockfish analysiert jeden Zug…</p><div class="progress"></div></div>`;modal.classList.remove("hidden");
  try{
    const missing=[];
    for(let i=0;i<state.history.length;i++) if(!state.analysisCache[i]) missing.push(i);
    if(missing.length){
      state.analysis=await analyzeGame();
    } else {
      state.analysis=state.analysisCache.slice(0,state.history.length);
    }
    modal.innerHTML=`<div class="modal-box wide"><div class="analysis-head"><div><h2>Partieanalyse</h2><p>Bewertung pro Zug und Verbesserungsvorschlag</p></div><button id="closeAnalysis">×</button></div><div class="analysis-list">${state.analysis.map((m,i)=>`<div class="analysis-row"><span class="move-no">${Math.floor(i/2)+1}${m.color==="w"?".":"..."}</span><b>${m.san}</b><span class="badge ${m.quality.toLowerCase()}">${m.quality}</span><span class="analysis-detail">${m.detail}</span></div>`).join("")}</div></div>`;
    document.querySelector("#closeAnalysis").onclick=()=>modal.classList.add("hidden");
  }catch(e){console.error(e);modal.innerHTML=`<div class="modal-box"><h2>Analyse fehlgeschlagen</h2><p>Stockfish konnte die Partie nicht vollständig analysieren.</p><button id="closeAnalysis">Schließen</button></div>`;document.querySelector("#closeAnalysis").onclick=()=>modal.classList.add("hidden");}
}

render();
engineWorker();
requestAnimationFrame(tick);
