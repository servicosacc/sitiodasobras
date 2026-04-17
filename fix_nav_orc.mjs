// fix_nav_orc.mjs — Adiciona item "Orçamentos" ao navItems
// node fix_nav_orc.mjs

import { readFileSync, writeFileSync } from 'fs';

const FILE = 'src/main.js';
let src = readFileSync(FILE, 'utf8');

// Procurar o id "analise" no navItems — sem depender de emojis ou acentos
const ANCHOR = '"analise"';
const idx = src.indexOf(ANCHOR);
if (idx < 0) {
  console.error('FAIL — "analise" não encontrado em', FILE);
  process.exit(1);
}

// A partir do idx, encontrar o }] que fecha o navItems
const after = src.slice(idx);
// Procurar \n  }] (2 espaços, fecha o último item e o array)
const closeRel = after.indexOf('\n  }]');
if (closeRel < 0) {
  console.error('FAIL — não encontrei o fecho }] depois de "analise"');
  console.error('Contexto:', JSON.stringify(after.slice(0, 200)));
  process.exit(1);
}

// Ponto de inserção: logo antes do ] (ou seja, depois do })
const insertAt = idx + closeRel + '\n  }'.length;  // aponta para o ]

const NEW_ITEM = ', {\n    id: "orcamentos",\n    icon: "\uD83D\uDCC4",\n    label: "Or\u00e7amentos"\n  }';

// Verificar que o nav item não foi já inserido
if (src.includes('id: "orcamentos"')) {
  console.log('JÁ EXISTE — nav item "orcamentos" já está no ficheiro, nada a fazer.');
  process.exit(0);
}

src = src.slice(0, insertAt) + NEW_ITEM + src.slice(insertAt);
writeFileSync(FILE, src, 'utf8');
console.log('OK — nav item Orçamentos adicionado.');
console.log('Corre agora:');
console.log('  npm run build && git add -A && git commit -m "feat: modulo orcamentacao" && git push');
