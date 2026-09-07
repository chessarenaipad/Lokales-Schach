# Lokales Schach mit Stockfish 18

Eine lokale Browser-Schachapp mit:

- regelkonformen Zügen via `chess.js`
- lokalem 2-Spieler-Modus
- Stockfish-18-Bot mit 5 Sekunden Bedenkzeit pro Zug
- 3/5/10 Minuten pro Spieler
- optional +10 Sekunden Inkrement pro Zug
- Schachmatt, Patt, dreifache Stellungswiederholung und Material-Remis
- 3 Brettdesigns und 3 Figuren-Designs
- 3 Hinweise pro Spieler
- Partieanalyse mit `Perfekt`, `Gut`, `Theoriezug`, `Fehler`
- konkretem Verbesserungsvorschlag

## Start

Voraussetzung: Node.js 20+.

```bash
npm install
npm run dev
```

Danach die lokale Vite-Adresse im Browser öffnen.

## Build

```bash
npm run build
npm run preview
```

## Hinweis zum Stockfish-Engine

Das Projekt verwendet Stockfish 18 als WebAssembly-Engine. Das npm-Paket stellt die Engine-Dateien bereit; das `postinstall`-Script kopiert die kleine Single-Threaded-Version nach `public/engine`.

Stockfish steht unter GPLv3. Siehe die Lizenzhinweise des Stockfish-Projekts und des npm-Pakets, wenn du die Anwendung weiterveröffentlichst.

## Analyse

Die Analyse ist bewusst heuristisch kategorisiert:

- **Perfekt:** gespielter Zug entspricht dem von Stockfish vorgeschlagenen Zug.
- **Theoriezug:** Zug befindet sich in der eingebauten kleinen Eröffnungs-Theorieliste und liegt in der frühen Partie.
- **Gut:** Stockfish findet einen besseren Zug, aber der Bewertungsverlust liegt unter dem Fehler-Schwellenwert.
- **Fehler:** deutlicher Bewertungsverlust; Stockfishs Alternative wird als Verbesserung genannt.

Für eine noch stärkere Analyse können die Analysezeiten und Multi-PV später erhöht werden.
