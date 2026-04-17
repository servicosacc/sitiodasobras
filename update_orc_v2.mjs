// update_orc_v2.mjs — Frações/Secções + pesquisa artigos + Word export
// node update_orc_v2.mjs

import { readFileSync, writeFileSync } from 'fs';
const FILE = 'src/main.js';
let src = readFileSync(FILE, 'utf8');
let ok = 0, fail = 0;

// ── Helper: substituição simples ──────────────────────────────────────────────
function apply(label, from, to) {
  if (src.includes(from)) {
    src = src.replace(from, to);
    console.log('OK', label);
    ok++;
  } else {
    console.warn('FAIL', label, '\n  Procurei:', from.slice(0,80).replace(/\n/g,'\\n'));
    fail++;
  }
}

// ── Helper: substituir função inteira (suporta destructuring e strings com {}) ─
function replaceFunction(name, newImpl) {
  const marker = 'function ' + name + '(';
  const start = src.indexOf(marker);
  if (start < 0) { console.warn('FAIL replaceFunction: ' + name + ' not found'); fail++; return; }

  let i = start + marker.length; // logo após o '(' da lista de parâmetros

  // 1. Saltar a lista de parâmetros (rastreia parênteses, ignora strings)
  let parenD = 1;
  while (i < src.length && parenD > 0) {
    const c = src[i];
    if (c === '"' || c === "'" || c === '`') {
      const q = c; i++;
      while (i < src.length && src[i] !== q) { if (src[i] === '\\') i++; i++; }
    } else if (c === '(') parenD++;
    else if (c === ')') parenD--;
    i++;
  }

  // 2. Encontrar o '{' de abertura do corpo da função
  while (i < src.length && src[i] !== '{') i++;

  // 3. Contar chaves rastreando strings (para não contar {} dentro de strings CSS)
  let depth = 0, inStr = null;
  while (i < src.length) {
    const c = src[i];
    if (inStr) {
      if (c === '\\') i++;          // saltar escape
      else if (c === inStr) inStr = null;
    } else if (c === '"' || c === "'" || c === '`') {
      inStr = c;
    } else if (c === '{') depth++;
    else if (c === '}') { if (--depth === 0) break; }
    i++;
  }

  src = src.slice(0, start) + newImpl + src.slice(i + 1);
  console.log('OK replaced:', name);
  ok++;
}

// ════════════════════════════════════════════════════════════════════════════
// 1. downloadDoc (inserir antes de imprimirHTML se não existe)
// ════════════════════════════════════════════════════════════════════════════
if (!src.includes('function downloadDoc(')) {
  apply('downloadDoc',
    'function imprimirHTML(',
    'function downloadDoc(filename,html){var blob=new Blob(["\\ufeff",html],{type:"application/msword"});var url=URL.createObjectURL(blob);var a=document.createElement("a");a.href=url;a.download=filename+".doc";document.body.appendChild(a);a.click();document.body.removeChild(a);URL.revokeObjectURL(url);}\nfunction imprimirHTML('
  );
} else { console.log('OK downloadDoc já existe'); ok++; }

// ════════════════════════════════════════════════════════════════════════════
// 2. gerarOrcamentoPDF — suporta fracoes + seccoes
// ════════════════════════════════════════════════════════════════════════════
replaceFunction('gerarOrcamentoPDF', `function gerarOrcamentoPDF(orc) {
  var fracoes=orc.fracoes||[];
  var seccoes=orc.seccoes||[];
  if(!orc.fracoes&&orc.secoes&&orc.secoes.length){seccoes=orc.secoes.map(function(s){return {id:s.id,nome:s.nome,linhas:s.linhas||[]};});}
  var totalF=fracoes.reduce(function(s,f){return s+f.seccoes.reduce(function(ss,sec){return ss+sec.linhas.reduce(function(sss,l){return sss+(l.total||0);},0);},0);},0);
  var totalS=seccoes.reduce(function(s,sec){return s+sec.linhas.reduce(function(ss,l){return ss+(l.total||0);},0);},0);
  var totalGeral=totalF+totalS;
  var ivaVal=totalGeral*(orc.iva||0)/100;
  var th='<th style="padding:7px 10px;text-align:left;font-size:10px;text-transform:uppercase;letter-spacing:1px;color:#c0392b;">';
  var thC='<th style="padding:7px 10px;text-align:center;font-size:10px;text-transform:uppercase;letter-spacing:1px;color:#c0392b;">';
  var thR='<th style="padding:7px 10px;text-align:right;font-size:10px;text-transform:uppercase;letter-spacing:1px;color:#c0392b;">';
  var thead='<table style="width:100%;border-collapse:collapse;font-size:12px;"><thead><tr style="background:#fef2f2;">'+th+'Art.</th>'+th+'Descri\u00e7\u00e3o</th>'+thC+'Qtd</th>'+thC+'Un.</th>'+thR+'Pre\u00e7o Unit.</th>'+thR+'Total</th></tr></thead>';
  function linhaHTML(l,ref){return '<tr><td style="padding:7px 10px;border-bottom:1px solid #f5f5f5;color:#555;">'+ref+'</td><td style="padding:7px 10px;border-bottom:1px solid #f5f5f5;">'+l.descricao+'</td><td style="padding:7px 10px;border-bottom:1px solid #f5f5f5;text-align:center;">'+l.quantidade+'</td><td style="padding:7px 10px;border-bottom:1px solid #f5f5f5;text-align:center;">'+l.unidade+'</td><td style="padding:7px 10px;border-bottom:1px solid #f5f5f5;text-align:right;">'+parseFloat(l.precoUnit||0).toFixed(2)+'\u20ac</td><td style="padding:7px 10px;border-bottom:1px solid #f5f5f5;text-align:right;font-weight:700;color:#c0392b;">'+parseFloat(l.total||0).toFixed(2)+'\u20ac</td></tr>';}
  var fracoesHTML=fracoes.map(function(f,fi){
    var fTotal=f.seccoes.reduce(function(s,sec){return s+sec.linhas.reduce(function(ss,l){return ss+(l.total||0);},0);},0);
    var secsHTML=f.seccoes.map(function(sec,si){
      var sTotal=sec.linhas.reduce(function(s,l){return s+(l.total||0);},0);
      var rows=sec.linhas.map(function(l,li){return linhaHTML(l,(fi+1)+'.'+(si+1)+'.'+(li+1));}).join('');
      return '<div style="margin-bottom:10px;"><div style="font-size:11px;font-weight:600;color:#666;padding:4px 10px;background:#fafafa;margin-bottom:4px;">'+(fi+1)+'.'+(si+1)+' \u2014 '+sec.nome+'<span style="float:right">'+sTotal.toFixed(2)+'\u20ac</span></div>'+(rows?thead+'<tbody>'+rows+'</tbody></table>':'<p style="color:#bbb;font-style:italic;font-size:11px;padding:4px 10px;">Sem artigos</p>')+'</div>';
    }).join('');
    return '<div style="margin-bottom:24px;"><div style="background:#fef2f2;padding:8px 14px;border-left:4px solid #c0392b;margin-bottom:8px;display:flex;justify-content:space-between;align-items:center;"><strong style="font-size:13px;color:#c0392b;">'+(fi+1)+'. Fra\u00e7\u00e3o \u2014 '+f.nome+'</strong>'+(f.proprietario?'<span style="font-size:11px;color:#888;">'+f.proprietario+'</span>':'')+'</div>'+secsHTML+'<div style="text-align:right;font-size:12px;font-weight:700;color:#c0392b;padding:6px 10px;border-top:1px solid #f0e0de;">Subtotal Fra\u00e7\u00e3o '+(fi+1)+': '+fTotal.toFixed(2)+'\u20ac</div></div>';
  }).join('');
  var seccoesHTML=seccoes.map(function(sec,si){
    var sTotal=sec.linhas.reduce(function(s,l){return s+(l.total||0);},0);
    var rows=sec.linhas.map(function(l,li){return linhaHTML(l,(fracoes.length+si+1)+'.'+(li+1));}).join('');
    return '<div style="margin-bottom:24px;"><div style="background:#f8fafc;padding:8px 14px;border-left:4px solid #64748b;margin-bottom:8px;"><strong style="font-size:13px;color:#475569;">'+(fracoes.length+si+1)+'. '+sec.nome+'</strong></div>'+(rows?thead+'<tbody>'+rows+'<tr style="background:#f8fafc;"><td colspan="5" style="padding:8px 10px;font-weight:700;text-align:right;font-size:11px;text-transform:uppercase;">Subtotal '+sec.nome+'</td><td style="padding:8px 10px;font-weight:800;text-align:right;color:#475569;">'+sTotal.toFixed(2)+'\u20ac</td></tr></tbody></table>':'<p style="color:#bbb;font-style:italic;font-size:11px;padding:4px 10px;">Sem artigos</p>')+'</div>';
  }).join('');
  return '<!DOCTYPE html><html lang="pt"><head><meta charset="UTF-8"/><title>Or\u00e7amento '+orc.numero+'</title><style>@import url(https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap);*{box-sizing:border-box;margin:0;padding:0}body{font-family:"Inter",sans-serif;font-size:13px;color:#222;padding:32px 40px;background:#fff;line-height:1.5}h1{font-size:20px;font-weight:700;color:#c0392b}@media print{body{padding:18px 26px}@page{margin:1cm;size:A4}}</style></head><body>'
    +cabecalhoHTML()
    +'<div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:20px;"><div><div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#aaa;margin-bottom:4px;">Or\u00e7amento</div><h1>'+orc.numero+'</h1>'+(orc.titulo?'<div style="font-size:14px;color:#333;margin-top:4px;">'+orc.titulo+'</div>':'')+'</div><div style="text-align:right;font-size:11px;color:#aaa;line-height:2;">'+(orc.cliente?'<div><strong style="color:#333;">'+orc.cliente+'</strong></div>':'')+(orc.morada?'<div>'+orc.morada+'</div>':'')+'<div>Data: <strong style="color:#555;">'+orc.data+'</strong></div><div>V\u00e1lido por 30 dias</div></div></div>'
    +fracoesHTML+seccoesHTML
    +'<div style="margin-top:16px;padding:14px 18px;background:#fef2f2;border-radius:8px;border:1px solid #f0e0de;"><div style="display:flex;justify-content:space-between;font-size:13px;margin-bottom:6px;"><span>Total sem IVA</span><strong>'+totalGeral.toFixed(2)+'\u20ac</strong></div>'+(orc.iva>0?'<div style="display:flex;justify-content:space-between;font-size:13px;margin-bottom:6px;"><span>IVA ('+orc.iva+'%)</span><strong>'+ivaVal.toFixed(2)+'\u20ac</strong></div>':'')+'<div style="display:flex;justify-content:space-between;font-size:16px;font-weight:800;color:#c0392b;border-top:1px solid #f0e0de;padding-top:8px;margin-top:6px;"><span>TOTAL'+(orc.iva>0?' (com IVA)':'')+'</span><span>'+(totalGeral+ivaVal).toFixed(2)+'\u20ac</span></div></div>'
    +(orc.notas?'<div style="margin-top:16px;font-size:12px;color:#666;padding:10px 14px;border:1px solid #eee;border-radius:6px;">'+orc.notas+'</div>':'')
    +rodapeHTML("Or\u00e7amento "+orc.numero)
    +'</body></html>';
}`);

// ════════════════════════════════════════════════════════════════════════════
// 3. OrcamentoEditor — Frações + Secções
// ════════════════════════════════════════════════════════════════════════════
replaceFunction('OrcamentoEditor', `function OrcamentoEditor({orcamento, artigos, obras, orcamentos, onSave, onClose, setObras}) {
  var CE=React.createElement;
  var hoje=new Date().toISOString().slice(0,10);
  var emptyOrc=function(){return {id:Date.now(),numero:nextNumeroOrc(orcamentos),titulo:"",cliente:"",morada:"",contacto:"",data:hoje,estado:"rascunho",iva:0,notas:"",fracoes:[],seccoes:[]};};
  var initForm=orcamento&&orcamento.id?Object.assign({fracoes:[],seccoes:[]},orcamento):emptyOrc();
  // migrate old secoes format
  if(!initForm.fracoes.length&&!initForm.seccoes.length&&(orcamento&&orcamento.secoes&&orcamento.secoes.length)){initForm.seccoes=orcamento.secoes.map(function(s){return {id:s.id,nome:s.nome,linhas:s.linhas||[]};});}
  var _f=React.useState(initForm); var form=_f[0]; var setForm=_f[1];
  var _sel=React.useState(null); var sel=_sel[0]; var setSel=_sel[1];
  var _art=React.useState(false); var showPickArt=_art[0]; var setShowPickArt=_art[1];
  var _saving=React.useState(false); var saving=_saving[0]; var setSaving=_saving[1];
  var setF=function(k,v){setForm(function(p){return Object.assign({},p,{[k]:v});});};
  // ── FRAÇÕES ──
  var addFracao=function(){var nova={id:Date.now(),nome:"Nova Fra\u00e7\u00e3o",proprietario:"",contacto:"",seccoes:[{id:Date.now()+1,nome:"Sec\u00e7\u00e3o 1",linhas:[]}],obraId:null};setForm(function(p){return Object.assign({},p,{fracoes:[...p.fracoes,nova]});});setSel({tipo:'frsec',fracaoId:nova.id,seccaoId:nova.seccoes[0].id});};
  var updFracao=function(fId,ch){setForm(function(p){return Object.assign({},p,{fracoes:p.fracoes.map(function(f){return f.id===fId?Object.assign({},f,ch):f;})});});};
  var delFracao=function(fId){if(!window.confirm("Apagar fra\u00e7\u00e3o?"))return;setForm(function(p){return Object.assign({},p,{fracoes:p.fracoes.filter(function(f){return f.id!==fId;})});});if(sel&&sel.fracaoId===fId)setSel(null);};
  // ── SECÇÕES DENTRO DE FRAÇÃO ──
  var addSecFracao=function(fId){var nova={id:Date.now(),nome:"Nova Sec\u00e7\u00e3o",linhas:[]};var f=form.fracoes.find(function(f){return f.id===fId;});if(!f)return;updFracao(fId,{seccoes:[...f.seccoes,nova]});setSel({tipo:'frsec',fracaoId:fId,seccaoId:nova.id});};
  var updSecFracao=function(fId,sId,ch){var f=form.fracoes.find(function(f){return f.id===fId;});if(!f)return;updFracao(fId,{seccoes:f.seccoes.map(function(s){return s.id===sId?Object.assign({},s,ch):s;})});};
  var delSecFracao=function(fId,sId){var f=form.fracoes.find(function(f){return f.id===fId;});if(!f)return;updFracao(fId,{seccoes:f.seccoes.filter(function(s){return s.id!==sId;})});if(sel&&sel.seccaoId===sId)setSel(null);};
  // ── SECÇÕES STANDALONE ──
  var addSeccao=function(){var nova={id:Date.now(),nome:"Nova Sec\u00e7\u00e3o",linhas:[]};setForm(function(p){return Object.assign({},p,{seccoes:[...p.seccoes,nova]});});setSel({tipo:'seccao',seccaoId:nova.id});};
  var updSeccao=function(sId,ch){setForm(function(p){return Object.assign({},p,{seccoes:p.seccoes.map(function(s){return s.id===sId?Object.assign({},s,ch):s;})});});};
  var delSeccao=function(sId){if(!window.confirm("Apagar sec\u00e7\u00e3o?"))return;setForm(function(p){return Object.assign({},p,{seccoes:p.seccoes.filter(function(s){return s.id!==sId;})});});if(sel&&sel.seccaoId===sId)setSel(null);};
  // ── LINHAS ──
  var getLinhas=function(){if(!sel)return [];if(sel.tipo==='seccao'){var s=form.seccoes.find(function(s){return s.id===sel.seccaoId;});return s?s.linhas:[];}if(sel.tipo==='frsec'){var f=form.fracoes.find(function(f){return f.id===sel.fracaoId;});if(!f)return [];var s=f.seccoes.find(function(s){return s.id===sel.seccaoId;});return s?s.linhas:[];}return [];};
  var setLinhas=function(ls){if(!sel)return;if(sel.tipo==='seccao')updSeccao(sel.seccaoId,{linhas:ls});if(sel.tipo==='frsec')updSecFracao(sel.fracaoId,sel.seccaoId,{linhas:ls});};
  var addLinha=function(artigo){var nova={id:Date.now(),artigoId:artigo?artigo.id:null,descricao:artigo?artigo.descricao:"",unidade:artigo?artigo.unidade:"uni",quantidade:1,precoUnit:artigo?artigo.precoUnit:0,total:artigo?artigo.precoUnit:0};setLinhas([...getLinhas(),nova]);};
  var updLinha=function(lId,ch){setLinhas(getLinhas().map(function(l){if(l.id!==lId)return l;var n=Object.assign({},l,ch);n.total=Math.round((parseFloat(n.quantidade)||0)*(parseFloat(n.precoUnit)||0)*100)/100;return n;}));};
  var delLinha=function(lId){setLinhas(getLinhas().filter(function(l){return l.id!==lId;}));};
  // ── CONVERTER EM OBRA ──
  var converterEmObra=function(fId){var f=form.fracoes.find(function(f){return f.id===fId;});if(!f||!window.confirm("Criar obra para "+f.nome+"?"))return;var ls=f.seccoes.reduce(function(a,s){return a.concat(s.linhas);}, []);var novaObra={id:Date.now(),spId:null,titulo:(form.titulo||form.numero)+" - "+f.nome,cliente:f.proprietario||"",clienteTel:f.contacto||"",tipo:"particular",estado:"pendente",inicio:hoje,duracao:1,trabalhos:ls.map(function(l){return l.descricao;}),funcionarios:[],especialidades:[],notas:"Or\u00e7amento "+form.numero};setObras(function(p){return [...p,novaObra];});updFracao(fId,{obraId:novaObra.id});alert("Obra criada: "+novaObra.titulo);};
  // ── TOTAIS ──
  var totalF=form.fracoes.reduce(function(s,f){return s+f.seccoes.reduce(function(ss,sec){return ss+sec.linhas.reduce(function(sss,l){return sss+(l.total||0);},0);},0);},0);
  var totalS=form.seccoes.reduce(function(s,sec){return s+sec.linhas.reduce(function(ss,l){return ss+(l.total||0);},0);},0);
  var totalGeral=totalF+totalS; var ivaVal=totalGeral*(form.iva||0)/100;
  var linhasAtual=getLinhas();
  var subT=linhasAtual.reduce(function(s,l){return s+(l.total||0);},0);
  var handleSave=function(){if(!form.cliente.trim()&&!form.titulo.trim())return alert("Preenche o cliente ou t\u00edtulo.");setSaving(true);onSave(form);setSaving(false);};
  var lbl=function(t){return CE("label",{style:{fontSize:10,color:"#64748b",fontWeight:700,textTransform:"uppercase",letterSpacing:1,display:"block",marginBottom:4}},t);};
  var ESTADOS=["rascunho","enviado","aprovado","rejeitado"];
  var ECOL={rascunho:"#64748b",enviado:"#3b82f6",aprovado:"#10b981",rejeitado:"#ef4444"};
  var selFracao=sel&&sel.fracaoId?form.fracoes.find(function(f){return f.id===sel.fracaoId;}):null;
  var selSeccao=sel?(sel.tipo==='seccao'?form.seccoes.find(function(s){return s.id===sel.seccaoId;}):selFracao?selFracao.seccoes.find(function(s){return s.id===sel.seccaoId;}):null):null;
  var selLabel=sel?(selFracao?(selFracao.nome+(selSeccao?" \u203a "+selSeccao.nome:"")):(selSeccao?selSeccao.nome:"")):"";
  return CE("div",{style:{position:"fixed",inset:0,background:"#0d1117",zIndex:200,display:"flex",flexDirection:"column",overflow:"hidden"}},
    CE("div",{style:{background:"#1a1f35",borderBottom:"1px solid #1e293b",padding:"14px 24px",display:"flex",alignItems:"center",gap:16,flexShrink:0}},
      CE("button",{onClick:onClose,style:{background:"none",border:"none",color:"#64748b",cursor:"pointer",fontSize:20,padding:"0 4px"}},"\u2190"),
      CE("div",{style:{flex:1}},
        CE("div",{style:{fontSize:11,color:"#64748b",fontWeight:700,textTransform:"uppercase",letterSpacing:1}},form.numero),
        CE("div",{style:{fontSize:16,fontWeight:700,color:"#e2e8f0",marginTop:2}},form.titulo||form.cliente||"Novo Or\u00e7amento")
      ),
      CE("div",{style:{display:"flex",alignItems:"center",gap:10}},
        CE(Sel,{value:form.estado,onChange:function(e){setF("estado",e.target.value);},style:{background:ECOL[form.estado]+"22",border:"1px solid "+ECOL[form.estado]+"44",color:ECOL[form.estado],fontWeight:700,borderRadius:6,padding:"6px 10px",fontSize:12}},ESTADOS.map(function(e){return CE("option",{key:e,value:e},e.charAt(0).toUpperCase()+e.slice(1));})),
        CE("div",{style:{fontSize:15,fontWeight:800,color:"#10b981",minWidth:100,textAlign:"right"}},totalGeral.toFixed(2)+" \u20ac"),
        CE(Btn,{variant:"ghost",onClick:function(){imprimirHTML(gerarOrcamentoPDF(form));}},"PDF"),
        CE(Btn,{variant:"ghost",onClick:function(){downloadDoc("Orc_"+form.numero,gerarOrcamentoPDF(form));}},"Word"),
        CE(Btn,{variant:"primary",onClick:handleSave,disabled:saving},saving?"A guardar...":"Guardar")
      )
    ),
    CE("div",{style:{display:"flex",flex:1,overflow:"hidden"}},
      CE("div",{style:{width:300,minWidth:300,background:"#111827",borderRight:"1px solid #1e293b",display:"flex",flexDirection:"column",overflow:"hidden"}},
        CE("div",{style:{padding:16,overflowY:"auto",flex:1}},
          CE("div",{style:{marginBottom:16}},
            CE("div",{style:{fontSize:11,fontWeight:700,color:"#64748b",textTransform:"uppercase",letterSpacing:1,marginBottom:10}},"Dados"),
            CE("div",{style:{marginBottom:8}},lbl("T\u00edtulo"),CE(TxtInput,{type:"text",value:form.titulo,placeholder:"Ed. Rainha - Infiltra\u00e7\u00e3o",onChange:function(e){setF("titulo",e.target.value);}})),
            CE("div",{style:{marginBottom:8}},lbl("Cliente"),CE(TxtInput,{type:"text",value:form.cliente,onChange:function(e){setF("cliente",e.target.value);}})),
            CE("div",{style:{marginBottom:8}},lbl("Morada"),CE(TxtInput,{type:"text",value:form.morada,onChange:function(e){setF("morada",e.target.value);}})),
            CE("div",{style:{marginBottom:8,display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}},
              CE("div",null,lbl("Data"),CE(TxtInput,{type:"date",value:form.data,onChange:function(e){setF("data",e.target.value);}})),
              CE("div",null,lbl("IVA"),CE(Sel,{value:form.iva,onChange:function(e){setF("iva",parseInt(e.target.value)||0);}},CE("option",{value:0},"0%"),CE("option",{value:6},"6%"),CE("option",{value:23},"23%")))
            ),
            CE("div",null,lbl("Notas"),CE(TxtArea,{value:form.notas,onChange:function(e){setF("notas",e.target.value);},style:{minHeight:48}}))
          ),
          CE("div",{style:{marginBottom:16}},
            CE("div",{style:{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}},
              CE("div",{style:{fontSize:11,fontWeight:700,color:"#bd4d2a",textTransform:"uppercase",letterSpacing:1}},"Fra\u00e7\u00f5es"),
              CE("button",{onClick:addFracao,style:{background:"#bd4d2a",border:"none",color:"#fff",borderRadius:6,padding:"4px 10px",fontSize:11,fontWeight:700,cursor:"pointer"}},"+")
            ),
            form.fracoes.length===0&&CE("div",{style:{color:"#475569",fontSize:12,padding:"6px 0"}},"Sem fra\u00e7\u00f5es"),
            form.fracoes.map(function(f){
              var fT=f.seccoes.reduce(function(s,sec){return s+sec.linhas.reduce(function(ss,l){return ss+(l.total||0);},0);},0);
              var isSelF=sel&&sel.fracaoId===f.id;
              return CE("div",{key:f.id,style:{background:"#1a2035",borderRadius:8,marginBottom:6,border:isSelF?"1px solid rgba(189,77,42,0.5)":"1px solid transparent",overflow:"hidden"}},
                CE("div",{style:{padding:"9px 12px",display:"flex",justifyContent:"space-between",alignItems:"center"}},
                  CE("div",{style:{flex:1,minWidth:0}},
                    CE("div",{style:{fontWeight:700,fontSize:13,color:"#e2e8f0",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}},f.nome),
                    f.proprietario&&CE("div",{style:{fontSize:11,color:"#64748b",marginTop:1}},f.proprietario)
                  ),
                  CE("div",{style:{display:"flex",alignItems:"center",gap:4,flexShrink:0}},
                    CE("div",{style:{fontSize:11,color:"#10b981",fontWeight:700}},fT.toFixed(0)+"\u20ac"),
                    f.obraId&&CE("span",{style:{fontSize:9,background:"rgba(16,185,129,0.15)",color:"#10b981",border:"1px solid rgba(16,185,129,0.3)",borderRadius:3,padding:"1px 4px"}},"Obra"),
                    CE("button",{onClick:function(){converterEmObra(f.id);},title:"Converter em Obra",disabled:!!f.obraId,style:{background:"none",border:"none",color:f.obraId?"#1e293b":"#bd4d2a",cursor:f.obraId?"default":"pointer",fontSize:13,padding:"1px 3px"}},"\u2192"),
                    CE("button",{onClick:function(){addSecFracao(f.id);},title:"Adicionar sec\u00e7\u00e3o",style:{background:"none",border:"none",color:"#64748b",cursor:"pointer",fontSize:13,padding:"1px 3px"}},"+"),
                    CE("button",{onClick:function(){delFracao(f.id);},style:{background:"none",border:"none",color:"#475569",cursor:"pointer",fontSize:13,padding:"1px 3px"}},"\u00d7")
                  )
                ),
                f.seccoes.map(function(s){
                  var isSelS=sel&&sel.fracaoId===f.id&&sel.seccaoId===s.id;
                  var sT=s.linhas.reduce(function(ss,l){return ss+(l.total||0);},0);
                  return CE("div",{key:s.id,onClick:function(){setSel({tipo:'frsec',fracaoId:f.id,seccaoId:s.id});},style:{padding:"6px 10px 6px 22px",cursor:"pointer",background:isSelS?"rgba(189,77,42,0.12)":"transparent",borderTop:"1px solid rgba(255,255,255,0.04)",display:"flex",justifyContent:"space-between",alignItems:"center"}},
                    CE("div",{style:{fontSize:12,color:isSelS?"#e2e8f0":"#94a3b8"}},s.nome),
                    CE("div",{style:{display:"flex",gap:6,alignItems:"center"}},
                      CE("span",{style:{fontSize:10,color:"#475569"}},s.linhas.length+"art"),
                      CE("span",{style:{fontSize:11,color:"#10b981",fontWeight:700}},sT.toFixed(0)+"\u20ac"),
                      CE("button",{onClick:function(e){e.stopPropagation();delSecFracao(f.id,s.id);},style:{background:"none",border:"none",color:"#475569",cursor:"pointer",fontSize:11,padding:"0 2px"}},"\u00d7")
                    )
                  );
                })
              );
            })
          ),
          CE("div",null,
            CE("div",{style:{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}},
              CE("div",{style:{fontSize:11,fontWeight:700,color:"#64748b",textTransform:"uppercase",letterSpacing:1}},"Sec\u00e7\u00f5es"),
              CE("button",{onClick:addSeccao,style:{background:"#1e293b",border:"1px solid #334155",color:"#94a3b8",borderRadius:6,padding:"4px 10px",fontSize:11,fontWeight:700,cursor:"pointer"}},"+")
            ),
            form.seccoes.length===0&&CE("div",{style:{color:"#475569",fontSize:12,padding:"6px 0"}},"Sem sec\u00e7\u00f5es"),
            form.seccoes.map(function(s){
              var isSelS=sel&&sel.tipo==='seccao'&&sel.seccaoId===s.id;
              var sT=s.linhas.reduce(function(ss,l){return ss+(l.total||0);},0);
              return CE("div",{key:s.id,onClick:function(){setSel({tipo:'seccao',seccaoId:s.id});},style:{background:isSelS?"rgba(189,77,42,0.12)":"#1a2035",borderRadius:8,padding:"9px 12px",marginBottom:6,cursor:"pointer",border:isSelS?"1px solid rgba(189,77,42,0.4)":"1px solid transparent"}},
                CE("div",{style:{display:"flex",justifyContent:"space-between",alignItems:"center"}},
                  CE("div",{style:{fontWeight:700,fontSize:13,color:isSelS?"#e2e8f0":"#94a3b8"}},s.nome),
                  CE("div",{style:{display:"flex",gap:8,alignItems:"center"}},
                    CE("span",{style:{fontSize:11,color:"#10b981",fontWeight:700}},sT.toFixed(0)+"\u20ac"),
                    CE("button",{onClick:function(e){e.stopPropagation();delSeccao(s.id);},style:{background:"none",border:"none",color:"#475569",cursor:"pointer",fontSize:11,padding:2}},"\u00d7")
                  )
                )
              );
            })
          )
        ),
        CE("div",{style:{padding:"12px 16px",borderTop:"1px solid #1e293b",background:"#0d1117"}},
          form.iva>0&&CE("div",{style:{display:"flex",justifyContent:"space-between",fontSize:12,color:"#64748b",marginBottom:4}},CE("span",null,"IVA ("+form.iva+"%)"),CE("span",null,ivaVal.toFixed(2)+"\u20ac")),
          CE("div",{style:{display:"flex",justifyContent:"space-between",fontSize:14,fontWeight:800,color:"#e2e8f0"}},CE("span",null,"Total"),CE("span",{style:{color:"#10b981"}},(totalGeral+ivaVal).toFixed(2)+"\u20ac"))
        )
      ),
      CE("div",{style:{flex:1,display:"flex",flexDirection:"column",overflow:"hidden"}},
        sel===null
          ? CE("div",{style:{flex:1,display:"flex",alignItems:"center",justifyContent:"center",color:"#475569",fontSize:14}},(form.fracoes.length+form.seccoes.length)===0?"Adiciona uma Fra\u00e7\u00e3o ou Sec\u00e7\u00e3o para come\u00e7ar":"Selecciona uma sec\u00e7\u00e3o")
          : CE("div",{style:{flex:1,display:"flex",flexDirection:"column",overflow:"hidden"}},
              CE("div",{style:{padding:"14px 20px",background:"#111827",borderBottom:"1px solid #1e293b",flexShrink:0}},
                CE("div",{style:{fontSize:13,fontWeight:700,color:"#e2e8f0",marginBottom:10}},selLabel),
                sel.tipo==='frsec'&&selFracao&&CE("div",{style:{marginBottom:10}},
                  CE("div",{style:{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,marginBottom:6}},
                    CE("div",null,lbl("Nome fra\u00e7\u00e3o"),CE(TxtInput,{type:"text",value:selFracao.nome,onChange:function(e){updFracao(sel.fracaoId,{nome:e.target.value});}})),
                    CE("div",null,lbl("Propriet\u00e1rio (fra\u00e7\u00e3o)"),CE(TxtInput,{type:"text",value:selFracao.proprietario,onChange:function(e){updFracao(sel.fracaoId,{proprietario:e.target.value});}})),
                    CE("div",null,lbl("Contacto"),CE(TxtInput,{type:"text",value:selFracao.contacto,onChange:function(e){updFracao(sel.fracaoId,{contacto:e.target.value});}}))),
                  CE("div",null,lbl("Nome sec\u00e7\u00e3o"),CE(TxtInput,{type:"text",value:selSeccao?selSeccao.nome:"",onChange:function(e){updSecFracao(sel.fracaoId,sel.seccaoId,{nome:e.target.value});}}))
                ),
                sel.tipo==='seccao'&&selSeccao&&CE("div",{style:{marginBottom:10}},lbl("Nome sec\u00e7\u00e3o"),CE(TxtInput,{type:"text",value:selSeccao.nome,onChange:function(e){updSeccao(sel.seccaoId,{nome:e.target.value});}})),
                CE("div",{style:{display:"flex",gap:8}},
                  CE(Btn,{variant:"primary",onClick:function(){setShowPickArt(true);}},"+  Artigo da Base"),
                  CE(Btn,{variant:"ghost",onClick:function(){addLinha(null);}},"+  Manual")
                )
              ),
              CE("div",{style:{flex:1,overflowY:"auto",padding:"0 20px 20px"}},
                linhasAtual.length===0
                  ? CE("div",{style:{textAlign:"center",color:"#475569",fontSize:13,padding:"40px 0"}},"Adiciona artigos")
                  : CE("table",{style:{width:"100%",borderCollapse:"collapse",fontSize:12,marginTop:8}},
                      CE("thead",null,CE("tr",{style:{borderBottom:"1px solid #1e293b"}},
                        CE("th",{style:{padding:"8px 10px",textAlign:"left",color:"#64748b",fontWeight:700,textTransform:"uppercase",letterSpacing:1,fontSize:10}},"Designa\u00e7\u00e3o"),
                        CE("th",{style:{padding:"8px 10px",textAlign:"center",color:"#64748b",fontWeight:700,textTransform:"uppercase",letterSpacing:1,fontSize:10,width:70}},"Qtd"),
                        CE("th",{style:{padding:"8px 10px",textAlign:"center",color:"#64748b",fontWeight:700,textTransform:"uppercase",letterSpacing:1,fontSize:10,width:55}},"Un."),
                        CE("th",{style:{padding:"8px 10px",textAlign:"right",color:"#64748b",fontWeight:700,textTransform:"uppercase",letterSpacing:1,fontSize:10,width:90}},"\u20ac/Un."),
                        CE("th",{style:{padding:"8px 10px",textAlign:"right",color:"#64748b",fontWeight:700,textTransform:"uppercase",letterSpacing:1,fontSize:10,width:90}},"Total"),
                        CE("th",{style:{width:36}})
                      )),
                      CE("tbody",null,linhasAtual.map(function(l){
                        return CE("tr",{key:l.id,style:{borderBottom:"1px solid #0d1117"}},
                          CE("td",{style:{padding:"7px 10px"}},CE(TxtInput,{type:"text",value:l.descricao,onChange:function(e){updLinha(l.id,{descricao:e.target.value});},style:{fontSize:12}})),
                          CE("td",{style:{padding:"7px 6px"}},CE(TxtInput,{type:"number",min:"0",step:"0.01",value:l.quantidade,onChange:function(e){updLinha(l.id,{quantidade:parseFloat(e.target.value)||0});},style:{textAlign:"center",fontSize:12}})),
                          CE("td",{style:{padding:"7px 6px"}},CE(Sel,{value:l.unidade,onChange:function(e){updLinha(l.id,{unidade:e.target.value});},style:{fontSize:12}},["uni","m2","m","ml","kg","lt","vg","cx"].map(function(u){return CE("option",{key:u,value:u},u);}))),
                          CE("td",{style:{padding:"7px 6px"}},CE(TxtInput,{type:"number",min:"0",step:"0.01",value:l.precoUnit,onChange:function(e){updLinha(l.id,{precoUnit:parseFloat(e.target.value)||0});},style:{textAlign:"right",fontSize:12}})),
                          CE("td",{style:{padding:"7px 10px",textAlign:"right",fontWeight:700,color:"#10b981",whiteSpace:"nowrap"}},(l.total||0).toFixed(2)+"\u20ac"),
                          CE("td",{style:{padding:"7px 4px",textAlign:"center"}},CE("button",{onClick:function(){delLinha(l.id);},style:{background:"none",border:"none",color:"#475569",cursor:"pointer",fontSize:13}},"\u00d7"))
                        );
                      })),
                      CE("tfoot",null,CE("tr",{style:{borderTop:"2px solid #1e293b"}},
                        CE("td",{colSpan:4,style:{padding:"9px 10px",textAlign:"right",fontSize:12,color:"#64748b",fontWeight:700,textTransform:"uppercase",letterSpacing:1}},"Subtotal"),
                        CE("td",{style:{padding:"9px 10px",textAlign:"right",fontWeight:800,color:"#bd4d2a",fontSize:14}},subT.toFixed(2)+"\u20ac"),
                        CE("td",null)
                      ))
                    )
              )
            )
      )
    ),
    showPickArt&&sel&&CE("div",{style:{position:"fixed",inset:0,background:"rgba(0,0,0,0.7)",zIndex:600,display:"flex",alignItems:"center",justifyContent:"center",padding:16}},
      CE("div",{style:{background:"#1a1f35",borderRadius:14,padding:24,width:600,maxWidth:"100%",maxHeight:"80vh",overflowY:"auto",boxShadow:"0 20px 60px rgba(0,0,0,0.7)"}},
        CE("div",{style:{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}},
          CE("h4",{style:{color:"#e2e8f0",margin:0,fontSize:16,fontWeight:700}},"Seleccionar Artigo"),
          CE("button",{onClick:function(){setShowPickArt(false);},style:{background:"none",border:"none",color:"#64748b",fontSize:22,cursor:"pointer"}},"\u00d7")
        ),
        artigos.map(function(a){
          return CE("div",{key:a.id,onClick:function(){addLinha(a);setShowPickArt(false);},style:{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"10px 14px",borderBottom:"1px solid #1e293b",cursor:"pointer",borderRadius:6}},
            CE("div",null,CE("div",{style:{fontSize:13,color:"#e2e8f0",fontWeight:500}},a.descricao),CE("div",{style:{fontSize:10,color:"#64748b",marginTop:2}},a.categoria)),
            CE("div",{style:{display:"flex",gap:10,alignItems:"center"}},CE("div",{style:{fontSize:11,color:"#64748b"}},a.unidade),CE("div",{style:{fontSize:13,color:"#10b981",fontWeight:700,minWidth:60,textAlign:"right"}},a.precoUnit.toFixed(2)+"\u20ac"))
          );
        })
      )
    )
  );
}`);

// ════════════════════════════════════════════════════════════════════════════
// 4. ArtigosModal — barra de pesquisa
// ════════════════════════════════════════════════════════════════════════════
apply('pesquisa state em ArtigosModal',
  'var _e=React.useState(null); var editId=_e[0]; var setEditId=_e[1];',
  'var _e=React.useState(null); var editId=_e[0]; var setEditId=_e[1];\n  var _q=React.useState(""); var pesquisa=_q[0]; var setPesquisa=_q[1];'
);
apply('filtro artigos por pesquisa',
  'var porCat={};\n  artigos.forEach(function(a){var c=a.categoria||"Geral";if(!porCat[c])porCat[c]=[];porCat[c].push(a);});',
  'var artigosFilt=artigos.filter(function(a){var q=pesquisa.toLowerCase();return !q||a.descricao.toLowerCase().indexOf(q)>=0||(a.categoria||"").toLowerCase().indexOf(q)>=0;});\n  var porCat={};\n  artigosFilt.forEach(function(a){var c=a.categoria||"Geral";if(!porCat[c])porCat[c]=[];porCat[c].push(a);});'
);
apply('input pesquisa em ArtigosModal UI',
  'CE("h3",{style:{color:"#e2e8f0",margin:0,fontSize:18,fontWeight:700,fontFamily:"\'Sora\',sans-serif"}},"Base de Artigos"),',
  'CE("h3",{style:{color:"#e2e8f0",margin:0,fontSize:18,fontWeight:700,fontFamily:"\'Sora\',sans-serif"}},"Base de Artigos"),\n        CE("input",{type:"search",placeholder:"Pesquisar...",value:pesquisa,onChange:function(e){setPesquisa(e.target.value);},style:{background:"#1e293b",border:"1px solid #334155",borderRadius:8,padding:"6px 12px",color:"#e2e8f0",fontSize:13,outline:"none",width:220}}),'
);

// ════════════════════════════════════════════════════════════════════════════
// 5. OrcamentosView — total com nova estrutura
// ════════════════════════════════════════════════════════════════════════════
apply('total orcamentos nova estrutura',
  'var total=orc.secoes.reduce(function(s,sec){return s+sec.linhas.reduce(function(ss,l){return ss+(l.total||0);},0);},0);',
  'var _frs=orc.fracoes||[];var _scs=orc.seccoes||(orc.secoes||[]);var total=_frs.reduce(function(s,f){return s+f.seccoes.reduce(function(ss,sec){return ss+sec.linhas.reduce(function(sss,l){return sss+(l.total||0);},0);},0);},0)+_scs.reduce(function(s,sec){return s+sec.linhas.reduce(function(ss,l){return ss+(l.total||0);},0);},0);'
);

// ── Guardar ───────────────────────────────────────────────────────────────────
console.log('\nResultado: '+ok+' OK, '+fail+' falha(s)');
if (fail <= 1 && ok >= 4) {
  writeFileSync(FILE, src, 'utf8');
  console.log('Ficheiro guardado. Corre agora:');
  console.log('  npm run build && git add -A && git commit -m "feat: fracoes seccoes pesquisa word" && git push');
} else {
  console.log('ABORT — demasiadas falhas. Ficheiro NAO alterado. Corre primeiro: git checkout HEAD -- src/main.js');
}
