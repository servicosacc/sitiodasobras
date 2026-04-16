import fs from 'fs';

const html = fs.readFileSync('original_index.html', 'utf-8');

// Marca o inicio a partir de HORAS_DIA (evita depender das alteracoes do Bloco A)
const startMarker = 'const HORAS_DIA = 8;';
const endMarker   = '</script><script>const root = ReactDOM.createRoot';

const startIdx = html.indexOf(startMarker);
const endIdx   = html.indexOf(endMarker);

if (startIdx === -1) {
  console.error('Nao encontrei "const HORAS_DIA = 8;". Ficheiro inesperado.');
  process.exit(1);
}
if (endIdx === -1) {
  console.error('Nao encontrei o marcador final. Ficheiro inesperado.');
  process.exit(1);
}

let appCode = html.substring(startIdx, endIdx).trim();

// Remover bloco de dados de exemplo (initialObras)
const deadStart  = appCode.indexOf('const initialObras');
const utilsStart = appCode.indexOf('// \u2500\u2500\u2500 UTILS ');
if (deadStart !== -1 && utilsStart !== -1 && deadStart < utilsStart) {
  appCode = appCode.substring(0, deadStart).trimEnd() + '\n\n' + appCode.substring(utilsStart);
  console.log('Bloco initialObras removido');
}

// FUNCIONARIOS e CUSTO_HORA ficam sempre vazios (carregados do SharePoint)
const header = 'let FUNCIONARIOS = [];\nlet CUSTO_HORA = {};\n\n';

const mainJs = [
  "import * as msal from '@azure/msal-browser';",
  "import React, { useState, useMemo } from 'react';",
  "import ReactDOM from 'react-dom/client';",
  "import './index.css';",
  "",
  "// \u2500\u2500\u2500 GESTAO DE OBRAS \u2014 SITIO DAS OBRAS, LDA \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500",
  "",
  header + appCode,
  "",
  "// \u2500\u2500\u2500 RENDER \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500",
  "const _appRoot = ReactDOM.createRoot(document.getElementById('root'));",
  "_appRoot.render(React.createElement(window.GestaoObrasApp));",
].join('\n');

const newHtml = `<!DOCTYPE html>
<html lang="pt">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Gestao de Obras \u2014 Sitio das Obras, Lda</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.js"></script>
  </body>
</html>`;

const indexCss = `*, *::before, *::after { box-sizing: border-box; }\nbody { margin: 0; background: #0f172a; }\n`;

fs.mkdirSync('src', { recursive: true });
if (!fs.existsSync('index.html.backup')) {
  fs.copyFileSync('index.html', 'index.html.backup');
  console.log('Backup criado: index.html.backup');
}
fs.writeFileSync('src/main.js',   mainJs,   'utf-8');
fs.writeFileSync('src/index.css', indexCss, 'utf-8');
fs.writeFileSync('index.html',    newHtml,  'utf-8');

for (const f of ['src/main.jsx','src/App.jsx','src/App.css','src/App.js']) {
  try { fs.unlinkSync(f); console.log('Removido: ' + f); } catch {}
}

console.log('\nMigracao concluida!');
console.log('  src/main.js  \u2014 ' + Math.round(mainJs.length / 1024) + 'KB');
console.log('  index.html   \u2014 entrada Vite');
console.log('\nProximo passo: npm run dev');
