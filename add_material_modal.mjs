#!/usr/bin/env node
// add_material_modal.mjs — Adiciona botão "Registar Material" na sidebar com modal
// Corre no Codespace: node add_material_modal.mjs

import { readFileSync, writeFileSync } from 'fs';

const FILE = 'src/main.js';
let src = readFileSync(FILE, 'utf8');
let ok = 0, fail = 0;

function apply(label, from, to) {
  if (src.includes(from)) {
    src = src.replace(from, to);
    console.log('✅', label);
    ok++;
  } else {
    console.warn('⚠️  Não encontrei:', label);
    fail++;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. Inserir o componente MaterialModal antes de GestaoObrasApp
// ─────────────────────────────────────────────────────────────────────────────
const MODAL_CODE = `function MaterialModal({obras, setMateriais, spAtivo, onClose}) {
  const hoje = new Date().toISOString().slice(0, 10);
  const emptyMat = () => ({obraId:"",descricao:"",fornecedor:"",quantidade:1,unidade:"Un",custoUnitario:0,custoTotal:0,pvpUnitario:0,pvpTotal:0,data:hoje,notas:""});
  const [form, setForm] = useState(emptyMat());
  const [loading, setLoading] = useState(false);
  const set = (k, v) => setForm(p => {
    const n = {...p, [k]: v};
    const qtd = parseFloat(n.quantidade)||0, cu = parseFloat(n.custoUnitario)||0;
    n.custoTotal = Math.round(qtd * cu * 100) / 100;
    n.pvpUnitario = Math.round(cu * 1.30 * 100) / 100;
    n.pvpTotal = Math.round(qtd * n.pvpUnitario * 100) / 100;
    return n;
  });
  const UNIDADES = ["Un","M2","M","Kg","Lt","Saco","Rolo","Cx","P\\u00e7"];
  const handleSave = async () => {
    if (!form.descricao) return alert("Preenche a descri\\u00e7\\u00e3o do material.");
    setLoading(true);
    try {
      if (spAtivo) {
        const novo = await spCriarMaterial(form, obras);
        setMateriais(p => [...p, novo]);
      } else {
        setMateriais(p => [...p, {...form, id: Date.now(), spId: null}]);
      }
      onClose();
    } catch(e) { alert("Erro: " + e.message); }
    setLoading(false);
  };
  const inpStyle = {fontSize:10,color:"#64748b",fontWeight:700,textTransform:"uppercase",letterSpacing:1,display:"block",marginBottom:5};
  const F = (label, children) => /*#__PURE__*/React.createElement(Field, {label}, children);
  return /*#__PURE__*/React.createElement("div", {
    style:{position:"fixed",inset:0,background:"rgba(0,0,0,0.75)",zIndex:300,display:"flex",alignItems:"center",justifyContent:"center",padding:16}
  }, /*#__PURE__*/React.createElement("div", {
    style:{background:"#1a1f35",borderRadius:16,padding:28,width:560,maxWidth:"100%",maxHeight:"90vh",overflowY:"auto",boxShadow:"0 24px 64px rgba(0,0,0,0.6)"}
  },
    /*#__PURE__*/React.createElement("div", {style:{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}},
      /*#__PURE__*/React.createElement("h3", {style:{fontFamily:"'Sora',sans-serif",color:"#e2e8f0",margin:0,fontSize:18}}, "\\uD83E\\uDDF1 Registar Material"),
      /*#__PURE__*/React.createElement("button", {onClick:onClose,style:{background:"none",border:"none",color:"#64748b",fontSize:22,cursor:"pointer",lineHeight:1,padding:"0 4px"}}, "\\u00D7")
    ),
    F("Obra (opcional)", /*#__PURE__*/React.createElement(Sel, {value:form.obraId,onChange:e=>set("obraId",e.target.value)},
      /*#__PURE__*/React.createElement("option",{value:""},"Seleccionar obra..."),
      obras.map(o=>/*#__PURE__*/React.createElement("option",{key:o.spId||o.id,value:String(o.spId||o.id)},o.titulo||o.sinistro||"Sem t\\u00edtulo"))
    )),
    /*#__PURE__*/React.createElement("div",{style:{display:"grid",gridTemplateColumns:"2fr 1fr",gap:12}},
      F("Descri\\u00e7\\u00e3o do Material *", /*#__PURE__*/React.createElement(TxtInput,{type:"text",value:form.descricao,onChange:e=>set("descricao",e.target.value),placeholder:"Ex: Argamassa, Tinta, Azulejo..."})),
      F("Data", /*#__PURE__*/React.createElement(TxtInput,{type:"date",value:form.data,onChange:e=>set("data",e.target.value)}))
    ),
    F("Fornecedor", /*#__PURE__*/React.createElement(TxtInput,{type:"text",value:form.fornecedor,onChange:e=>set("fornecedor",e.target.value),placeholder:"Nome do fornecedor"})),
    /*#__PURE__*/React.createElement("div",{style:{display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr",gap:10}},
      F("Quantidade", /*#__PURE__*/React.createElement(TxtInput,{type:"number",min:"0",step:"0.01",value:form.quantidade,onChange:e=>set("quantidade",e.target.value)})),
      F("Unidade", /*#__PURE__*/React.createElement(Sel,{value:form.unidade,onChange:e=>set("unidade",e.target.value)},UNIDADES.map(u=>/*#__PURE__*/React.createElement("option",{key:u,value:u},u)))),
      F("Custo Unit. (\\u20ac)", /*#__PURE__*/React.createElement(TxtInput,{type:"number",min:"0",step:"0.01",value:form.custoUnitario,onChange:e=>set("custoUnitario",e.target.value)})),
      F("Custo Total", /*#__PURE__*/React.createElement("div",{style:{padding:"10px 14px",background:"#0f1117",border:"1px solid #334155",borderRadius:8,color:"#10b981",fontWeight:700,fontSize:14}},form.custoTotal.toFixed(2)," \\u20ac"))
    ),
    form.custoUnitario > 0 && /*#__PURE__*/React.createElement("div",{style:{padding:"8px 12px",background:"rgba(16,185,129,0.08)",border:"1px solid rgba(16,185,129,0.2)",borderRadius:8,marginBottom:16,fontSize:12,color:"#64748b"}},
      "PVP unit\\u00e1rio: ",/*#__PURE__*/React.createElement("strong",{style:{color:"#10b981"}},form.pvpUnitario.toFixed(2)," \\u20ac"),
      " \\u00b7 PVP total: ",/*#__PURE__*/React.createElement("strong",{style:{color:"#10b981"}},form.pvpTotal.toFixed(2)," \\u20ac")
    ),
    F("Notas", /*#__PURE__*/React.createElement(TxtArea,{value:form.notas,onChange:e=>set("notas",e.target.value),placeholder:"Observa\\u00e7\\u00f5es opcionais...",style:{minHeight:60}})),
    /*#__PURE__*/React.createElement("div",{style:{display:"flex",gap:10,justifyContent:"flex-end",marginTop:8}},
      /*#__PURE__*/React.createElement(Btn,{variant:"ghost",onClick:onClose},"Cancelar"),
      /*#__PURE__*/React.createElement(Btn,{variant:"primary",onClick:handleSave,disabled:loading},loading?"A guardar...":"\\uD83E\\uDDF1 Guardar Material")
    )
  ));
}

`;

apply('Componente MaterialModal',
  'function GestaoObrasApp()',
  MODAL_CODE + 'function GestaoObrasApp()'
);

// ─────────────────────────────────────────────────────────────────────────────
// 2. Estado materialModal em GestaoObrasApp
// ─────────────────────────────────────────────────────────────────────────────
apply('Estado materialModal',
  'const [registoModal, setRegistoModal] = useState(null);',
  'const [registoModal, setRegistoModal] = useState(null);\n  const [materialModal, setMaterialModal] = useState(false);'
);

// ─────────────────────────────────────────────────────────────────────────────
// 3. Botão "Registar Material" na sidebar — depois do "Registar Horas"
//    Pattern: o texto do botão Registar Horas é "\u23F1 Registar Horas"
//    seguido de )))) (fecha: botão, div marginTop, nav, div sidebar)
// ─────────────────────────────────────────────────────────────────────────────
const HORAS_CLOSING = '"\\u23F1 Registar Horas"))))';
const HORAS_CLOSING_ALT = '"\u23F1 Registar Horas"))))';  // caso esteja como char real

const MATERIAL_BTN = `, /*#__PURE__*/React.createElement("button", {
        onClick: () => setMaterialModal(true),
        style: {
          width: "100%",
          padding: "10px 14px",
          borderRadius: 8,
          marginTop: 6,
          background: "#2d3a50",
          border: "none",
          color: "#c8d6e5",
          cursor: "pointer",
          fontSize: 13,
          fontWeight: 700,
          textAlign: "center",
          fontFamily: "inherit"
        }
      }, "\\uD83E\\uDDF1 Registar Material")`;

if (src.includes(HORAS_CLOSING)) {
  // Insert new button before the last 3 closing parens (keep )))) but split as: button) + marginTop_div) + nav) + sidebar))
  // Structure after insert: "⏱ Registar Horas"),  <new button>  )))
  src = src.replace(HORAS_CLOSING,
    '"\\u23F1 Registar Horas")' + MATERIAL_BTN + ')))'
  );
  console.log('✅ Botão Registar Material na sidebar (escape literal)');
  ok++;
} else if (src.includes(HORAS_CLOSING_ALT)) {
  src = src.replace(HORAS_CLOSING_ALT,
    '"\u23F1 Registar Horas")' + MATERIAL_BTN + ')))'
  );
  console.log('✅ Botão Registar Material na sidebar (char real)');
  ok++;
} else {
  // Debug: show what's after "Registar Horas" in the file
  const idx = src.indexOf('Registar Horas"');
  if (idx > 0) {
    const after = src.slice(idx, idx + 30).replace(/\n/g, '↵');
    console.warn('⚠️  Botão sidebar: padrão não encontrado. Após "Registar Horas": ' + JSON.stringify(after));
  } else {
    console.warn('⚠️  Botão sidebar: "Registar Horas" não encontrado no ficheiro');
  }
  fail++;
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. Render do MaterialModal no JSX (depois do RegistoHorasModal)
// ─────────────────────────────────────────────────────────────────────────────
apply('Render MaterialModal',
  '    onSave: handleSaveRegisto\n  }));',
  `    onSave: handleSaveRegisto
  }), materialModal && /*#__PURE__*/React.createElement(MaterialModal, {
    obras: obras,
    setMateriais: setMateriais,
    spAtivo: spAtivo,
    onClose: () => setMaterialModal(false)
  }));`
);

// ─────────────────────────────────────────────────────────────────────────────
writeFileSync(FILE, src, 'utf8');
console.log(`\n${ok}/4 alterações aplicadas.`);
if (fail === 0) {
  console.log('\nAgora corre:');
  console.log('  npm run build && git add -A && git commit -m "feat: botão Registar Material na sidebar" && git push');
} else {
  console.log('\nAlgumas alterações falharam. Mostra este output para eu ajudar a corrigir.');
}
