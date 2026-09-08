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
  promotion: "q",
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
  analysisCache: [],
  analysisBusy: false,
  engineReady: false,
  engineBusy: false,
  screen: "game",
  study: null,
  studyIndex: 0,
  studyTest: false,
  studyComplete: false,
  studyMessage: ""
};

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
          <div class="status-pill ${state.engineReady ? "ok" : ""}">
            <span></span>${state.engineReady ? "Engine bereit" : "Engine lädt…"}
          </div>
        </div>
      </header>

      ${state.screen === "study" ? renderStudy() : renderGame()}
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

function bind() {
  document.querySelector("#gameTab").onclick = () => { state.screen="game"; render(); };
  document.querySelector("#studyTab").onclick = () => { state.screen="study"; render(); };

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
  } else if (state.study) {
    document.querySelector("#studyBack").onclick = () => { state.study=null; state.studyIndex=0; state.studyComplete=false; state.studyMessage=""; render(); };
    document.querySelector("#studyReset").onclick = () => startStudy(state.study.id);
    document.querySelector("#studyTest").onchange = e => { state.studyTest=e.target.checked; state.studyMessage=""; render(); };
    document.querySelector("#studyBoardTheme").onchange = e => { state.boardTheme=e.target.value; render(); };
    document.querySelector("#studyPieceTheme").onchange = e => { state.pieceTheme=e.target.value; render(); };
  } else {
    document.querySelectorAll("[data-study]").forEach(b => b.onclick=()=>startStudy(b.dataset.study));
  }
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
    if(lastMove && (lastMove.lan.slice(2,4)===square || lastMove.lan.slice(0,2)===square)) div.classList.add("last");
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
  if(state.gameOver || state.engineBusy) return;
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
    state.selected=null; state.legalTargets=[];
  }
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
    if(state.studyTest && legal.san!==expected){
      state.selected=null; state.legalTargets=[];
      state.studyMessage=`Falsch – ${legal.san} war nicht der vorgegebene Zug und wurde sofort zurückgezogen.`;
      render();
      return;
    }
    makeMove(move, true);
    return;
  }
  makeMove(move, false);
}

function makeMove(move, isStudy=false){
  if(state.gameOver) return;
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
  state.chess=new Chess(); state.history=[]; state.selected=null; state.legalTargets=[]; state.running=false; state.gameOver=false; state.lastTick=performance.now();
  state.orientation=study.color; // Spielerperspektive
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
  state.screen="game"; state.study=null; state.chess=new Chess();
  state.clocks={w:state.timeBase*1000,b:state.timeBase*1000}; state.running=false;state.gameOver=false;state.history=[];state.analysis=[];state.analysisCache=[];state.hints={w:3,b:3};state.selected=null;state.legalTargets=[];state.engineBusy=false;state.lastTick=performance.now();
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
  if(state.engineBusy||state.gameOver)return;
  state.engineBusy=true;render();
  try{
    const best=await engineBestMove(state.chess.fen(),5000);
    if(!state.gameOver&&currentColor()!==state.humanColor&&best&&best!=="(none)")makeMove({from:best.slice(0,2),to:best.slice(2,4),promotion:best[4]||"q"});
  }catch(e){console.error(e);const h=document.querySelector("#hintText");if(h)h.textContent="Stockfish konnte nicht antworten.";}
  finally{state.engineBusy=false;if(!state.gameOver)render();}
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
