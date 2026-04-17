// fix_pdf_css.mjs — Corrige sintaxe CSS em gerarOrcamentoPDF
// node fix_pdf_css.mjs

import { readFileSync, writeFileSync } from 'fs';

const FILE = 'src/main.js';
let src = readFileSync(FILE, 'utf8');

// A linha com o erro tem url('https://...') dentro de uma string JS com '
// Corrigir: url('...') → url(...) e font-family:'Inter' → font-family:"Inter"

const OLD1 = `+'<style>@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap');'`;
const NEW1 = `+'<style>@import url(https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap);'`;

if (src.includes(OLD1)) {
  src = src.replace(OLD1, NEW1);
  console.log('OK 1/2 — url() corrigido');
} else {
  console.warn('FAIL 1/2 — padrão url() não encontrado');
  // Mostrar contexto à volta da linha 4253
  const lines = src.split('\n');
  console.warn('Linha 4252:', JSON.stringify(lines[4251]?.slice(0, 120)));
  console.warn('Linha 4253:', JSON.stringify(lines[4252]?.slice(0, 120)));
  console.warn('Linha 4254:', JSON.stringify(lines[4253]?.slice(0, 120)));
  process.exit(1);
}

const OLD2 = `font-family:'Inter',sans-serif;`;
const NEW2 = `font-family:"Inter",sans-serif;`;

if (src.includes(OLD2)) {
  src = src.replace(OLD2, NEW2);
  console.log('OK 2/2 — font-family corrigido');
} else {
  // pode já estar correcto
  console.log('OK 2/2 — font-family já usa aspas duplas');
}

writeFileSync(FILE, src, 'utf8');
console.log('\nFicheiro corrigido. Corre agora:');
console.log('  npm run build && git add -A && git commit -m "feat: modulo orcamentacao" && git push');
