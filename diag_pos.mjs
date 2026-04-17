import { readFileSync } from 'fs';
const src = readFileSync('src/main.js', 'utf8');
const pos = 286749;
const lineNum = src.slice(0, pos).split('\n').length;
console.log('Linha aproximada:', lineNum);
const lines = src.split('\n');
for (let i = Math.max(0, lineNum-20); i < Math.min(lines.length, lineNum+5); i++) {
  console.log((i+1)+':', JSON.stringify(lines[i]));
}
