// fix_dedup2.mjs — Remove bloco de estado duplicado em GestaoObrasApp
// node fix_dedup2.mjs

import { readFileSync, writeFileSync } from 'fs';

const FILE = 'src/main.js';
let src = readFileSync(FILE, 'utf8');
let changed = 0;

function dedup(label, marker) {
  const first = src.indexOf(marker);
  if (first < 0) { console.log('NÃO EXISTE:', label); return; }
  const second = src.indexOf(marker, first + marker.length);
  if (second < 0) { console.log('OK (sem dup):', label); return; }

  // Remover desde o início da linha do segundo até ao fim dessa linha (inclusive \n)
  let start = second;
  while (start > 0 && src[start - 1] !== '\n') start--;
  let end = src.indexOf('\n', second);
  if (end < 0) end = src.length;
  else end++; // incluir o \n

  src = src.slice(0, start) + src.slice(end);
  console.log('REMOVIDO dup:', label);
  changed++;
}

// Remover duplicados linha a linha (do mais específico para o mais geral)
dedup('artigos useState',      "const [artigos, setArtigos] = useState(function(){try{return JSON.parse(localStorage.getItem('artigos'))");
dedup('orcamentos useState',   "const [orcamentos, setOrcamentos] = useState(function(){try{return JSON.parse(localStorage.getItem('orcamentos'))");
dedup('orcamentoEditando',     'const [orcamentoEditando, setOrcamentoEditando] = useState(null);');
dedup('useEffect artigos',     "React.useEffect(function(){localStorage.setItem('artigos'");
dedup('useEffect orcamentos',  "React.useEffect(function(){localStorage.setItem('orcamentos'");

// Remover também duplicados de render (OrcamentosView e OrcamentoEditor)
dedup('render OrcamentosView', 'view === "orcamentos" && !orcamentoEditando && /*#__PURE__*/React.createElement(OrcamentosView,');
dedup('render OrcamentoEditor','orcamentoEditando !== null && /*#__PURE__*/React.createElement(OrcamentoEditor,');

if (changed === 0) {
  console.log('\nNenhum duplicado encontrado — ficheiro já limpo.');
} else {
  writeFileSync(FILE, src, 'utf8');
  console.log(`\n${changed} duplicado(s) removido(s). Corre agora:`);
  console.log('  npm run build && git add -A && git commit -m "feat: modulo orcamentacao" && git push');
}
