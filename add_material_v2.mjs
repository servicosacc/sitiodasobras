// add_material_v2.mjs — Adiciona botão + modal Registar Material
// Arrastar para o Codespace e correr: node add_material_v2.mjs

import { readFileSync, writeFileSync } from 'fs';

const FILE = 'src/main.js';
const src_original = readFileSync(FILE, 'utf8');
let src = src_original;
let ok = 0, fail = 0;

function apply(label, from, to) {
  if (src.includes(from)) {
    src = src.replace(from, to);
    console.log('OK', label);
    ok++;
  } else {
    console.warn('FAIL', label);
    fail++;
  }
}

// ── 1. Componente MaterialModal ───────────────────────────────────────────────
// Nota: emoji escritos como escapes JS literais (\\u) para não corruper o ficheiro
const MODAL = `
function MaterialModal({obras,setMateriais,spAtivo,onClose}){
  var hoje=new Date().toISOString().slice(0,10);
  var empty=function(){return {obraId:"",descricao:"",fornecedor:"",quantidade:1,unidade:"Un",custoUnitario:0,custoTotal:0,pvpUnitario:0,pvpTotal:0,data:hoje,notas:""};};
  var _s=React.useState(empty()); var form=_s[0]; var setForm=_s[1];
  var _l=React.useState(false); var loading=_l[0]; var setLoading=_l[1];
  var set=function(k,v){setForm(function(p){var n=Object.assign({},p);n[k]=v;var q=parseFloat(n.quantidade)||0,c=parseFloat(n.custoUnitario)||0;n.custoTotal=Math.round(q*c*100)/100;n.pvpUnitario=Math.round(c*1.3*100)/100;n.pvpTotal=Math.round(q*n.pvpUnitario*100)/100;return n;});};
  var UNI=["Un","M2","M","Kg","Lt","Saco","Rolo","Cx","P\\u00e7"];
  var save=async function(){
    if(!form.descricao)return alert("Preenche a descri\\u00e7\\u00e3o do material.");
    setLoading(true);
    try{
      if(spAtivo){var novo=await spCriarMaterial(form,obras);setMateriais(function(p){return [...p,novo];});}
      else{setMateriais(function(p){return [...p,Object.assign({},form,{id:Date.now(),spId:null})];});}
      onClose();
    }catch(e){alert("Erro: "+e.message);}
    setLoading(false);
  };
  var CE=React.createElement;
  var Lbl=function(t){return CE("label",{style:{fontSize:10,color:"#64748b",fontWeight:700,textTransform:"uppercase",letterSpacing:1,display:"block",marginBottom:5}},t);};
  var Fld=function(label,child){return CE("div",{style:{marginBottom:14}},Lbl(label),child);};
  return CE("div",{style:{position:"fixed",inset:0,background:"rgba(0,0,0,0.78)",zIndex:300,display:"flex",alignItems:"center",justifyContent:"center",padding:16}},
    CE("div",{style:{background:"#1a1f35",borderRadius:16,padding:28,width:560,maxWidth:"100%",maxHeight:"90vh",overflowY:"auto",boxShadow:"0 24px 64px rgba(0,0,0,0.65)"}},
      CE("div",{style:{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:22}},
        CE("h3",{style:{fontFamily:"'Sora',sans-serif",color:"#e2e8f0",margin:0,fontSize:18,fontWeight:700}},"Registar Material"),
        CE("button",{onClick:onClose,style:{background:"none",border:"none",color:"#64748b",fontSize:24,cursor:"pointer",lineHeight:1,padding:"0 2px"}},"\\u00D7")
      ),
      Fld("Obra (opcional)",CE(Sel,{value:form.obraId,onChange:function(e){set("obraId",e.target.value);}},
        CE("option",{value:""},"Seleccionar obra..."),
        obras.map(function(o){return CE("option",{key:o.spId||o.id,value:String(o.spId||o.id)},o.titulo||o.sinistro||"Sem t\\u00edtulo");})
      )),
      CE("div",{style:{display:"grid",gridTemplateColumns:"2fr 1fr",gap:12}},
        Fld("Descri\\u00e7\\u00e3o do Material *",CE(TxtInput,{type:"text",value:form.descricao,onChange:function(e){set("descricao",e.target.value);},placeholder:"Ex: Argamassa, Tinta, Azulejo..."})),
        Fld("Data",CE(TxtInput,{type:"date",value:form.data,onChange:function(e){set("data",e.target.value);}}))
      ),
      Fld("Fornecedor",CE(TxtInput,{type:"text",value:form.fornecedor,onChange:function(e){set("fornecedor",e.target.value);},placeholder:"Nome do fornecedor"})),
      CE("div",{style:{display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr",gap:10}},
        Fld("Quantidade",CE(TxtInput,{type:"number",min:"0",step:"0.01",value:form.quantidade,onChange:function(e){set("quantidade",e.target.value);}})),
        Fld("Unidade",CE(Sel,{value:form.unidade,onChange:function(e){set("unidade",e.target.value);}},UNI.map(function(u){return CE("option",{key:u,value:u},u);}))),
        Fld("Custo Unit. (\\u20ac)",CE(TxtInput,{type:"number",min:"0",step:"0.01",value:form.custoUnitario,onChange:function(e){set("custoUnitario",e.target.value);}})),
        Fld("Custo Total",CE("div",{style:{padding:"10px 14px",background:"#0f1117",border:"1px solid #334155",borderRadius:8,color:"#10b981",fontWeight:700,fontSize:15}},form.custoTotal.toFixed(2)," \\u20ac"))
      ),
      form.pvpTotal>0&&CE("div",{style:{padding:"9px 12px",background:"rgba(16,185,129,0.07)",border:"1px solid rgba(16,185,129,0.2)",borderRadius:8,marginBottom:14,fontSize:12,color:"#64748b"}},
        "PVP unit\\u00e1rio: ",CE("strong",{style:{color:"#10b981"}},form.pvpUnitario.toFixed(2),"\\u20ac"),
        "  \\u00b7  PVP total: ",CE("strong",{style:{color:"#10b981"}},form.pvpTotal.toFixed(2),"\\u20ac")
      ),
      Fld("Notas",CE(TxtArea,{value:form.notas,onChange:function(e){set("notas",e.target.value);},placeholder:"Observa\\u00e7\\u00f5es opcionais...",style:{minHeight:60}})),
      CE("div",{style:{display:"flex",gap:10,justifyContent:"flex-end",marginTop:8}},
        CE(Btn,{variant:"ghost",onClick:onClose},"Cancelar"),
        CE(Btn,{variant:"primary",onClick:save,disabled:loading},loading?"A guardar...":"Guardar Material")
      )
    )
  );
}

`;

apply('1/4 MaterialModal',
  'window.GestaoObrasApp = function App() {',
  MODAL + 'window.GestaoObrasApp = function App() {'
);

// ── 2. Estado materialModal ───────────────────────────────────────────────────
apply('2/4 estado materialModal',
  'const [registoModal, setRegistoModal] = useState(null);',
  'const [registoModal, setRegistoModal] = useState(null);\n  const [materialModal, setMaterialModal] = useState(false);'
);

// ── 3. Botão na sidebar ───────────────────────────────────────────────────────
// O botão Registar Horas fecha com ")))) " ou similar — tentamos os padrões mais comuns
const BTN_MATERIAL = `, /*#__PURE__*/React.createElement("button", {
        onClick: function(){ setMaterialModal(true); },
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
      }, "Registar Material")`;

// Tenta vários padrões de fecho do botão Registar Horas
const patterns = [
  '"\\u23F1 Registar Horas"))))',
  '"\u23F1 Registar Horas"))))',
  '"\\u23F1 Registar Horas"))), ',
];

let btnDone = false;
for (const pat of patterns) {
  if (src.includes(pat)) {
    const closeCount = pat.endsWith(', ') ? 3 : 4;
    const base = pat.replace(/\)+,?\s*$/, '');
    const replacement = base + ')' + BTN_MATERIAL + ')))'  + (pat.endsWith(', ') ? ', ' : '');
    src = src.replace(pat, replacement);
    console.log('OK 3/4 botão sidebar');
    ok++;
    btnDone = true;
    break;
  }
}
if (!btnDone) {
  const idx = src.indexOf('Registar Horas"');
  const ctx = idx >= 0 ? JSON.stringify(src.slice(idx, idx+25)) : 'não encontrado';
  console.warn('FAIL 3/4 botão sidebar — contexto: ' + ctx);
  fail++;
}

// ── 4. Render do MaterialModal ────────────────────────────────────────────────
apply('4/4 render MaterialModal',
  '    onSave: handleSaveRegisto\n  }));',
  `    onSave: handleSaveRegisto
  }), materialModal && /*#__PURE__*/React.createElement(MaterialModal, {
    obras: obras,
    setMateriais: setMateriais,
    spAtivo: spAtivo,
    onClose: function(){ setMaterialModal(false); }
  }));`
);

// ── Guardar ───────────────────────────────────────────────────────────────────
if (fail === 0) {
  writeFileSync(FILE, src, 'utf8');
  console.log('\nFicheiro guardado. Corre agora:');
  console.log('  npm run build && git add -A && git commit -m "feat: modal Registar Material" && git push');
} else {
  console.log(`\n${fail} falha(s). Ficheiro NAO alterado. Partilha este output para diagnosticar.`);
}
