// add_edit_material.mjs — Adiciona botão Editar a cada linha de material
// Arrastar para o Codespace e correr: node add_edit_material.mjs

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
    const hint = from.slice(0, 80).replace(/\n/g, '\\n');
    console.warn('    Procurei: ' + hint + '...');
    fail++;
  }
}

// ── 1. Adicionar spActualizarMaterial a seguir a spApagarMaterial ─────────────
apply('1/5 spActualizarMaterial',
  'async function spApagarMaterial(spId) {',
  'async function spActualizarMaterial(mat,obras) {\n' +
  '  var siteId=await resolverSiteId();\n' +
  '  var listId=await resolverListId(SP_CONFIG.listaMateriais);\n' +
  '  await graphPatch("/sites/"+siteId+"/lists/"+listId+"/items/"+mat.spId+"/fields",materialParaSPFields(mat,obras));\n' +
  '  return mat;\n' +
  '}\n' +
  'async function spApagarMaterial(spId) {'
);

// ── 2. MaterialModal: adicionar "editando" à assinatura ───────────────────────
apply('2/5 prop editando no MaterialModal',
  'function MaterialModal({obras,setMateriais,spAtivo,onClose,materiais}){',
  'function MaterialModal({obras,setMateriais,spAtivo,onClose,materiais,editando}){'
);

// ── 3. MaterialModal: inicializar form com editando (se existir) ──────────────
// Substituir a linha var hoje=... + var empty=... + var _s=React.useState(empty());
apply('3/5 inicializar form com editando',
  'var hoje=new Date().toISOString().slice(0,10);\n' +
  '  var empty=function(){return {obraId:"",descricao:"",fornecedor:"",quantidade:1,unidade:"Un",custoUnitario:0,custoTotal:0,pvpUnitario:0,pvpTotal:0,data:hoje,notas:""};};' +
  '\n  var _s=React.useState(empty()); var form=_s[0]; var setForm=_s[1];',
  'var hoje=new Date().toISOString().slice(0,10);\n' +
  '  var empty=function(){return {obraId:"",descricao:"",fornecedor:"",quantidade:1,unidade:"Un",custoUnitario:0,custoTotal:0,pvpUnitario:0,pvpTotal:0,data:hoje,notas:""};};' +
  '\n  var _s=React.useState(editando?Object.assign({},editando):empty()); var form=_s[0]; var setForm=_s[1];'
);

// ── 4. MaterialModal: save — actualizar se editando, criar se novo ────────────
apply('4/5 save com suporte a editar',
  'var save=async function(){\n' +
  '    if(!form.descricao)return alert("Preenche a descri\\u00e7\\u00e3o do material.");\n' +
  '    setLoading(true);\n' +
  '    try{\n' +
  '      if(spAtivo){var novo=await spCriarMaterial(form,obras);setMateriais(function(p){return [...p,novo];});}\n' +
  '      else{setMateriais(function(p){return [...p,Object.assign({},form,{id:Date.now(),spId:null})];});}\n' +
  '      onClose();\n' +
  '    }catch(e){alert("Erro: "+e.message);}\n' +
  '    setLoading(false);\n' +
  '  };',
  'var save=async function(){\n' +
  '    if(!form.descricao)return alert("Preenche a descri\\u00e7\\u00e3o do material.");\n' +
  '    setLoading(true);\n' +
  '    try{\n' +
  '      if(editando&&editando.id){\n' +
  '        var atualizado=Object.assign({},editando,form);\n' +
  '        if(spAtivo&&editando.spId){await spActualizarMaterial(atualizado,obras);}\n' +
  '        setMateriais(function(p){return p.map(function(m){return m.id===editando.id?atualizado:m;});});\n' +
  '      } else {\n' +
  '        if(spAtivo){var novo=await spCriarMaterial(form,obras);setMateriais(function(p){return [...p,novo];});}\n' +
  '        else{setMateriais(function(p){return [...p,Object.assign({},form,{id:Date.now(),spId:null})];});}\n' +
  '      }\n' +
  '      onClose();\n' +
  '    }catch(e){alert("Erro: "+e.message);}\n' +
  '    setLoading(false);\n' +
  '  };'
);

// ── 5. MateriaisView: adicionar estado editandoMat + botão editar + render modal ──
// Inserir estado editandoMat depois do estado loading
apply('5a/5 estado editandoMat em MateriaisView',
  'var _l=React.useState(false); var loading=_l[0]; var setLoading=_l[1];',
  'var _l=React.useState(false); var loading=_l[0]; var setLoading=_l[1];\n' +
  '  var _em=React.useState(null); var editandoMat=_em[0]; var setEditandoMat=_em[1];'
);

// Adicionar botão editar a seguir ao botão apagar em MateriaisView
// O botão apagar termina com: title: "Apagar"}, "\uD83D\uDDD1")));
// Isto é no JSX compilado, o padrão exacto é:
apply('5b/5 botão editar na linha',
  ',title:"Apagar"},"\uD83D\uDDD1")));',
  ',title:"Apagar"},"\uD83D\uDDD1"),' +
  'CE("button",{onClick:function(){setEditandoMat(m);},style:{background:"transparent",border:"none",cursor:"pointer",color:"#475569",fontSize:14,padding:4},title:"Editar"},"\u270F\uFE0F")));'
);

// ── 5c. Adicionar render do MaterialModal no final do return de MateriaisView ──
// O return de MateriaisView termina com o fecho da tabela/tfoot/div
// Vamos encontrar o fim do componente — procuramos o último elemento antes de "function " que segue MateriaisView
// Estratégia: adicionar antes da última linha do return de MateriaisView
// O return de MateriaisView usa React.createElement("div", null, ...)
// Termina com o tfoot e a div de totais por obra
// Procuramos o padrão do tfoot total que é único
apply('5c/5 render MaterialModal em MateriaisView',
  'CE("tfoot",null,CE("tr",{style:{borderTop:"2px solid #1e293b"}}',
  'editandoMat&&CE(MaterialModal,{obras:obras,setMateriais:setMateriais,spAtivo:spAtivo,materiais:materiais,editando:editandoMat,onClose:function(){setEditandoMat(null);}}),' +
  'CE("tfoot",null,CE("tr",{style:{borderTop:"2px solid #1e293b"}}'
);

// ── Guardar ───────────────────────────────────────────────────────────────────
if (fail === 0) {
  writeFileSync(FILE, src, 'utf8');
  console.log('\nFicheiro guardado. Corre agora:');
  console.log('  npm run build && git add -A && git commit -m "feat: editar materiais" && git push');
} else {
  console.log(`\n${fail} falha(s) — ficheiro NAO alterado.`);
  console.log('Partilha o output acima para diagnosticar.');
}
