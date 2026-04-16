// add_autocomplete.mjs — Autocomplete em Descrição e Fornecedor no modal de materiais
// Arrastar para o Codespace e correr: node add_autocomplete.mjs

import { readFileSync, writeFileSync } from 'fs';

const FILE = 'src/main.js';
let src = readFileSync(FILE, 'utf8');
let ok = 0, fail = 0;

function apply(label, from, to) {
  if (src.includes(from)) {
    src = src.replace(from, to);
    console.log('OK', label);
    ok++;
  } else {
    console.warn('FAIL', label);
    // Show context to help debug
    const hint = from.slice(0, 60).replace(/\n/g, '\\n');
    console.warn('    Procurei: ' + hint + '...');
    fail++;
  }
}

// ── 1. Adicionar "materiais" à assinatura do MaterialModal ────────────────────
apply('1/5 prop materiais no MaterialModal',
  'function MaterialModal({obras,setMateriais,spAtivo,onClose}){',
  'function MaterialModal({obras,setMateriais,spAtivo,onClose,materiais}){'
);

// ── 2. Calcular listas únicas de descrições e fornecedores ────────────────────
// Inserir a seguir à linha var UNI=...
apply('2/5 listas de autocomplete',
  'var UNI=["Un","M2","M","Kg","Lt","Saco","Rolo","Cx","P\\u00e7"];',
  'var UNI=["Un","M2","M","Kg","Lt","Saco","Rolo","Cx","P\\u00e7"];\n' +
  '  var _mats=materiais||[];\n' +
  '  var _dl=[...new Set(_mats.map(function(x){return x.descricao;}).filter(Boolean))].sort();\n' +
  '  var _fl=[...new Set(_mats.map(function(x){return x.fornecedor;}).filter(Boolean))].sort();'
);

// ── 3. Campo Descrição com datalist ──────────────────────────────────────────
apply('3/5 datalist Descrição',
  'Fld("Descri\\u00e7\\u00e3o do Material *",CE(TxtInput,{type:"text",value:form.descricao,onChange:function(e){set("descricao",e.target.value);},placeholder:"Ex: Argamassa, Tinta, Azulejo..."}))',
  'Fld("Descri\\u00e7\\u00e3o do Material *",CE("div",{style:{position:"relative"}},' +
    'CE("datalist",{id:"ml-desc"},_dl.map(function(d){return CE("option",{key:d,value:d});})),' +
    'CE(TxtInput,{type:"text",list:"ml-desc",value:form.descricao,onChange:function(e){set("descricao",e.target.value);},placeholder:"Ex: Argamassa, Tinta, Azulejo..."})))'
);

// ── 4. Campo Fornecedor com datalist ─────────────────────────────────────────
apply('4/5 datalist Fornecedor',
  'Fld("Fornecedor",CE(TxtInput,{type:"text",value:form.fornecedor,onChange:function(e){set("fornecedor",e.target.value);},placeholder:"Nome do fornecedor"}))',
  'Fld("Fornecedor",CE("div",{style:{position:"relative"}},' +
    'CE("datalist",{id:"ml-forn"},_fl.map(function(f){return CE("option",{key:f,value:f});})),' +
    'CE(TxtInput,{type:"text",list:"ml-forn",value:form.fornecedor,onChange:function(e){set("fornecedor",e.target.value);},placeholder:"Nome do fornecedor"})))'
);

// ── 5. Passar "materiais" ao MaterialModal no render ──────────────────────────
apply('5/5 passar materiais ao render',
  '    setMateriais: setMateriais,\n    spAtivo: spAtivo,\n    onClose: function(){ setMaterialModal(false); }',
  '    setMateriais: setMateriais,\n    materiais: materiais,\n    spAtivo: spAtivo,\n    onClose: function(){ setMaterialModal(false); }'
);

// ── Guardar ───────────────────────────────────────────────────────────────────
if (fail === 0) {
  writeFileSync(FILE, src, 'utf8');
  console.log('\nFicheiro guardado. Corre agora:');
  console.log('  npm run build && git add -A && git commit -m "feat: autocomplete descrição e fornecedor" && git push');
} else {
  console.log(`\n${fail} falha(s) — ficheiro NAO alterado.`);
  console.log('Partilha o output acima para diagnosticar.');
}
