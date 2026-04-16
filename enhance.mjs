import { readFileSync, writeFileSync } from 'fs';
const JS_FILE = 'src/main.js';
let src = readFileSync(JS_FILE, 'utf8');
let changes = 0;
function apply(label, from, to) {
  if (src.includes(from)) { src = src.replace(from, to); console.log('✅', label); changes++; }
  else console.warn('⚠️  Não encontrei:', label);
}
apply('inputStyle: transition',
  `  fontFamily: "inherit"\n};\nconst TxtInput`,
  `  fontFamily: "inherit",\n  transition: "border-color 0.14s ease, box-shadow 0.14s ease"\n};\nconst TxtInput`
);
apply('Cartões de obra: sombra',
  `        background: "#111522",\n        borderRadius: 12,\n        border: "1px solid #1e293b",\n        overflow: "hidden"`,
  `        background: "#111522",\n        borderRadius: 14,\n        border: "1px solid #1e293b",\n        overflow: "hidden",\n        boxShadow: "0 2px 14px rgba(0,0,0,0.45)"`
);
apply('Bloco <style>: hover/focus/animações',
  `@import url('https://fonts.googleapis.com/css2?family=Sora:wght@700;800&family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600&display=swap');\n        * { box-sizing:border-box; }\n        ::-webkit-scrollbar{width:5px}::-webkit-scrollbar-track{background:#0d1017}::-webkit-scrollbar-thumb{background:#334155;border-radius:3px}\n        input[type=date]::-webkit-calendar-picker-indicator{filter:invert(0.5);cursor:pointer}`,
  `@import url('https://fonts.googleapis.com/css2?family=Sora:wght@700;800&family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600;9..40,700&display=swap');\n        *,*::before,*::after{box-sizing:border-box}\n        html{scroll-behavior:smooth}\n        body{-webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale}\n        ::-webkit-scrollbar{width:5px;height:5px}\n        ::-webkit-scrollbar-track{background:#0a0e17}\n        ::-webkit-scrollbar-thumb{background:#2a3447;border-radius:4px}\n        ::-webkit-scrollbar-thumb:hover{background:#3d4f6a}\n        ::selection{background:rgba(189,77,42,0.28);color:#f4cfc2}\n        input[type=date]::-webkit-calendar-picker-indicator{filter:invert(0.5);cursor:pointer}\n        button{transition:background 0.14s,color 0.14s,border-color 0.14s,box-shadow 0.15s,transform 0.1s,filter 0.14s!important}\n        button:hover:not(:disabled){transform:translateY(-1px)!important;filter:brightness(1.08)!important;box-shadow:0 4px 14px rgba(0,0,0,0.35)!important}\n        button:active:not(:disabled){transform:translateY(0.5px)!important;filter:brightness(0.94)!important;box-shadow:none!important}\n        button:focus-visible{outline:2px solid rgba(189,77,42,0.5)!important;outline-offset:2px}\n        button:disabled{opacity:0.45!important;cursor:not-allowed!important}\n        input,textarea,select{transition:border-color 0.14s,box-shadow 0.14s!important;caret-color:#bd4d2a!important}\n        input:focus,textarea:focus,select:focus{outline:none;border-color:#bd4d2a!important;box-shadow:0 0 0 3px rgba(189,77,42,0.16)!important}\n        input::placeholder,textarea::placeholder{color:#475569}\n        @keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}\n        @keyframes fadeUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}\n        @keyframes pulse{0%,100%{opacity:1}50%{opacity:.55}}`
);
writeFileSync(JS_FILE, src, 'utf8');
const CSS = `*,*::before,*::after{box-sizing:border-box}
html{scroll-behavior:smooth}
body{margin:0;background:#0d1017;font-family:'DM Sans',system-ui,sans-serif;-webkit-font-smoothing:antialiased;color:#e2e8f0;line-height:1.5}
::-webkit-scrollbar{width:5px;height:5px}
::-webkit-scrollbar-track{background:#0a0e17}
::-webkit-scrollbar-thumb{background:#2a3447;border-radius:4px}
::-webkit-scrollbar-thumb:hover{background:#3d4f6a}
::selection{background:rgba(189,77,42,0.28);color:#f4cfc2}
a{color:#e8795a;transition:color 0.14s}
a:hover{color:#f4a989}
button{transition:background 0.14s,color 0.14s,border-color 0.14s,box-shadow 0.15s,transform 0.1s,filter 0.14s}
button:hover:not(:disabled){transform:translateY(-1px);filter:brightness(1.08);box-shadow:0 4px 14px rgba(0,0,0,0.35)}
button:active:not(:disabled){transform:translateY(0.5px);filter:brightness(0.94);box-shadow:none}
button:focus-visible{outline:2px solid rgba(189,77,42,0.5);outline-offset:2px}
button:disabled{opacity:0.45;cursor:not-allowed;pointer-events:none}
input,textarea,select{transition:border-color 0.14s,box-shadow 0.14s;caret-color:#bd4d2a}
input:focus,textarea:focus,select:focus{outline:none;border-color:#bd4d2a!important;box-shadow:0 0 0 3px rgba(189,77,42,0.16)!important}
input::placeholder,textarea::placeholder{color:#475569}
input[type=date]::-webkit-calendar-picker-indicator{filter:invert(0.5);cursor:pointer}
@keyframes fadeUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}
@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
@keyframes pulse{0%,100%{opacity:1}50%{opacity:.55}}
@media print{body{background:#fff!important;color:#111!important}}
`;
writeFileSync('src/index.css', CSS, 'utf8');
console.log(`\n✅ ${changes} melhorias em main.js + index.css reescrito.\nCorre: npm run build && git add -A && git commit -m "style: melhorias visuais" && git push\n`);
