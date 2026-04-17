// fix_font.mjs — Corrige font-family:'Inter' na linha 4254
// node fix_font.mjs

import { readFileSync, writeFileSync } from 'fs';

const FILE = 'src/main.js';
let src = readFileSync(FILE, 'utf8');

const lines = src.split('\n');
const lineIdx = 4253; // linha 4254 (0-indexed = 4253)
const original = lines[lineIdx];
console.log('Linha actual:', JSON.stringify(original.slice(0, 150)));

if (!original) {
  console.error('Linha não encontrada');
  process.exit(1);
}

// Substituir todas as ocorrências de 'Inter' por "Inter" nesta linha
const fixed = original.replace(/font-family:'Inter'/g, 'font-family:"Inter"');

if (fixed === original) {
  console.warn('Padrão não encontrado na linha 4254 — a procurar noutras linhas...');
  // Procura global no ficheiro
  const idx = src.indexOf("font-family:'Inter'");
  if (idx >= 0) {
    src = src.replace("font-family:'Inter'", 'font-family:"Inter"');
    console.log('OK — corrigido em posição', idx);
    writeFileSync(FILE, src, 'utf8');
  } else {
    console.error('FAIL — font-family não encontrado');
    process.exit(1);
  }
} else {
  lines[lineIdx] = fixed;
  src = lines.join('\n');
  writeFileSync(FILE, src, 'utf8');
  console.log('OK — font-family corrigido');
}

console.log('\nCorre agora:');
console.log('  npm run build && git add -A && git commit -m "feat: modulo orcamentacao" && git push');
