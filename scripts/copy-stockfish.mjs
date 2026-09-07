import { mkdirSync, copyFileSync } from "node:fs";
import { resolve } from "node:path";

const src = resolve("node_modules/stockfish/bin");
const dst = resolve("public/engine");

mkdirSync(dst, { recursive: true });

for (const file of [
  "stockfish-18-lite-single.js",
  "stockfish-18-lite-single.wasm"
]) {
  copyFileSync(
    resolve(src, file),
    resolve(dst, file)
  );
}

console.log("Stockfish 18 lite-single nach public/engine kopiert.");
