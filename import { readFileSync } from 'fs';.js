import { readFileSync } from 'fs';
const src = readFileSync('src/main.js', 'utf8');
const idx = src.indexOf('analise');
if (idx < 0) { console.log('NAO ENCONTREI "analise"'); process.exit(1); }
// show 200 chars around first occurrence
console.log('--- contexto (repr) ---');
const slice = src.slice(Math.max(0, idx - 60), idx + 200);
console.log(JSON.stringify(slice));
