// fix_dedup.mjs — Remove bloco de código duplicado em src/main.js
// node fix_dedup.mjs

import { readFileSync, writeFileSync } from 'fs';

const FILE = 'src/main.js';
let src = readFileSync(FILE, 'utf8');

const MARKER = 'var ARTIGOS_DEFAULT = [';
const ANCHOR = 'window.GestaoObrasApp = function App() {';

const first = src.indexOf(MARKER);
const second = src.indexOf(MARKER, first + 1);

if (first < 0) {
  console.error('FAIL — ARTIGOS_DEFAULT não encontrado');
  process.exit(1);
}

if (second < 0) {
  console.log('OK — sem duplicado, ficheiro limpo');
  process.exit(0);
}

console.log('Duplicado encontrado em posição:', second);

// O duplicado vai de `second` até ao início de window.GestaoObrasApp
const anchorIdx = src.indexOf(ANCHOR, second);
if (anchorIdx < 0) {
  console.error('FAIL — ANCHOR não encontrado após duplicado');
  process.exit(1);
}

// Remover: desde o início do duplicado até ao ANCHOR (exclusive)
// (precisa de recuar até ao \n antes de "var ARTIGOS_DEFAULT")
let removeStart = second;
// recuar para apanhar a linha inteira incluindo newline antes
while (removeStart > 0 && src[removeStart - 1] !== '\n') removeStart--;

const removed = src.slice(removeStart, anchorIdx);
console.log('A remover', removed.length, 'caracteres (', removed.slice(0,80).replace(/\n/g,'\\n'), '...)');

src = src.slice(0, removeStart) + src.slice(anchorIdx);

writeFileSync(FILE, src, 'utf8');
console.log('OK — duplicado removido.');
console.log('\nCorre agora:');
console.log('  npm run build && git add -A && git commit -m "feat: modulo orcamentacao" && git push');
