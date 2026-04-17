// add_orcamentos.mjs — Módulo de Orçamentação completo
// Arrastar para o Codespace e correr: node add_orcamentos.mjs

import { readFileSync, writeFileSync } from 'fs';

const FILE = 'src/main.js';
let src = readFileSync(FILE, 'utf8');
let ok = 0, fail = 0;

// Guarda anti-duplicados: abortar se já foi aplicado
if (src.includes('function OrcamentosView(') || src.includes('function OrcamentoEditor(')) {
  console.error('ABORT — módulo já inserido. Faz git checkout HEAD -- src/main.js antes de correr de novo.');
  process.exit(1);
}

function apply(label, from, to) {
  if (src.includes(from)) {
    src = src.replace(from, to);
    console.log('OK', label);
    ok++;
  } else {
    console.warn('FAIL', label);
    console.warn('    Procurei: ' + from.slice(0, 80).replace(/\n/g, '\\n') + '...');
    fail++;
  }
}

// ─── CÓDIGO A INSERIR ──────────────────────────────────────────────────────────

const CODE = `
// ═══════════════════════════════════════════════════════════════════════════════
// BASE DE ARTIGOS — pré-carregada com artigos dos orçamentos reais
// ═══════════════════════════════════════════════════════════════════════════════
var ARTIGOS_DEFAULT = [
  {id:1,  categoria:"Pesquisa",      descricao:"Pesquisa n\\u00e3o destrutiva de infiltra\\u00e7\\u00e3o",              unidade:"uni", precoUnit:325},
  {id:2,  categoria:"Pesquisa",      descricao:"Pesquisa destrutiva e repara\\u00e7\\u00e3o de canaliza\\u00e7\\u00e3o", unidade:"uni", precoUnit:320},
  {id:3,  categoria:"Canaliza\\u00e7\\u00e3o", descricao:"Teste de press\\u00e3o em rede de abastecimento",             unidade:"uni", precoUnit:320},
  {id:4,  categoria:"Canaliza\\u00e7\\u00e3o", descricao:"Reconstru\\u00e7\\u00e3o de rozo e encerramento",             unidade:"uni", precoUnit:150},
  {id:5,  categoria:"Demoli\\u00e7\\u00e3o",   descricao:"Remo\\u00e7\\u00e3o de revestimento cer\\u00e2mico danificado",unidade:"m2",  precoUnit:12.5},
  {id:6,  categoria:"Demoli\\u00e7\\u00e3o",   descricao:"Remo\\u00e7\\u00e3o de teto em gesso cartonado",              unidade:"uni", precoUnit:185},
  {id:7,  categoria:"Demoli\\u00e7\\u00e3o",   descricao:"Remo\\u00e7\\u00e3o e transporte de res\\u00edduos a aterro", unidade:"uni", precoUnit:125},
  {id:8,  categoria:"Prepara\\u00e7\\u00e3o",  descricao:"Prote\\u00e7\\u00e3o de elementos e movimenta\\u00e7\\u00e3o de recheio", unidade:"uni", precoUnit:120},
  {id:9,  categoria:"Prepara\\u00e7\\u00e3o",  descricao:"Desmontagem e prote\\u00e7\\u00e3o de m\\u00f3veis de cozinha",unidade:"uni", precoUnit:185},
  {id:10, categoria:"Prepara\\u00e7\\u00e3o",  descricao:"Abertura de rozo para acesso a canaliza\\u00e7\\u00e3o",     unidade:"uni", precoUnit:125},
  {id:11, categoria:"Cer\\u00e2mica",          descricao:"Assentamento de cer\\u00e2mica em parede",                    unidade:"m2",  precoUnit:67.5},
  {id:12, categoria:"Cer\\u00e2mica",          descricao:"Assentamento de cer\\u00e2mica em pavimento",                 unidade:"m2",  precoUnit:67.5},
  {id:13, categoria:"Cer\\u00e2mica",          descricao:"Argamassas e rejuntes",                                       unidade:"vg",  precoUnit:75},
  {id:14, categoria:"Pintura",                 descricao:"Pintura pl\\u00e1stica interior paredes e tetos",             unidade:"m2",  precoUnit:13.5},
  {id:15, categoria:"Pintura",                 descricao:"Pintura de teto ap\\u00f3s substitui\\u00e7\\u00e3o de cer\\u00e2mica", unidade:"uni", precoUnit:180},
  {id:16, categoria:"Pintura",                 descricao:"Aplica\\u00e7\\u00e3o de prim\\u00e1rio isolante anti-mancha", unidade:"uni", precoUnit:120},
  {id:17, categoria:"Acabamentos",             descricao:"Prepara\\u00e7\\u00e3o de superf\\u00edcie (rasca, estuque, lixagem)", unidade:"uni", precoUnit:180},
  {id:18, categoria:"Tetos",                   descricao:"Teto em gesso cartonado com acabamento de juntas",            unidade:"uni", precoUnit:220},
  {id:19, categoria:"Pavimentos",              descricao:"Pavimento flutuante equivalente ao original",                 unidade:"m2",  precoUnit:70},
  {id:20, categoria:"Pavimentos",              descricao:"Rod\\u00e1p\\u00e9",                                          unidade:"ml",  precoUnit:18},
  {id:21, categoria:"Sanit\\u00e1rios",        descricao:"Substitui\\u00e7\\u00e3o de autoclismo",                      unidade:"uni", precoUnit:425},
  {id:22, categoria:"Sanit\\u00e1rios",        descricao:"Remo\\u00e7\\u00e3o e recoloca\\u00e7\\u00e3o de lou\\u00e7as sanit\\u00e1rias", unidade:"uni", precoUnit:80},
  {id:23, categoria:"Limpeza",                 descricao:"Limpeza final e transporte de res\\u00edduos",                unidade:"uni", precoUnit:125},
  {id:24, categoria:"Limpeza",                 descricao:"Remontagem de acess\\u00f3rios e limpeza final",              unidade:"uni", precoUnit:185},
];

function nextNumeroOrc(orcamentos) {
  var ano = new Date().getFullYear();
  var deste = orcamentos.filter(function(o){ return o.numero && o.numero.indexOf("ORC-"+ano)===0; });
  var n = deste.length + 1;
  return "ORC-" + ano + "-" + String(n).padStart(3,"0");
}

// ═══════════════════════════════════════════════════════════════════════════════
// PDF DO ORÇAMENTO
// ═══════════════════════════════════════════════════════════════════════════════
function gerarOrcamentoPDF(orc) {
  var totalGeral = orc.secoes.reduce(function(s,sec){return s+sec.linhas.reduce(function(ss,l){return ss+(l.total||0);},0);},0);
  var ivaVal = totalGeral * (orc.iva||0) / 100;
  var hoje = new Date().toLocaleDateString("pt-PT",{day:"2-digit",month:"2-digit",year:"numeric"});
  var secoesHTML = orc.secoes.map(function(sec,si){
    var subTotal = sec.linhas.reduce(function(s,l){return s+(l.total||0);},0);
    var linhasHTML = sec.linhas.map(function(l,li){
      return '<tr><td style="padding:7px 10px;border-bottom:1px solid #f5f5f5;color:#555;">'+(si+1)+'.'+(li+1)+'</td>'
        +'<td style="padding:7px 10px;border-bottom:1px solid #f5f5f5;">'+l.descricao+'</td>'
        +'<td style="padding:7px 10px;border-bottom:1px solid #f5f5f5;text-align:center;">'+l.quantidade+'</td>'
        +'<td style="padding:7px 10px;border-bottom:1px solid #f5f5f5;text-align:center;">'+l.unidade+'</td>'
        +'<td style="padding:7px 10px;border-bottom:1px solid #f5f5f5;text-align:right;">'+parseFloat(l.precoUnit||0).toFixed(2)+'\\u20ac</td>'
        +'<td style="padding:7px 10px;border-bottom:1px solid #f5f5f5;text-align:right;font-weight:700;color:#c0392b;">'+parseFloat(l.total||0).toFixed(2)+'\\u20ac</td>'
        +'</tr>';
    }).join("");
    return '<div style="margin-bottom:24px;">'
      +'<div style="background:#fef2f2;padding:8px 14px;border-left:4px solid #c0392b;margin-bottom:8px;">'
      +'<strong style="font-size:13px;color:#c0392b;">'+(si+1)+'. '+sec.nome+'</strong>'
      +(sec.proprietario?'<span style="font-size:11px;color:#888;margin-left:12px;">'+sec.proprietario+'</span>':'')
      +'</div>'
      +'<table style="width:100%;border-collapse:collapse;font-size:12px;">'
      +'<thead><tr style="background:#fef2f2;">'
      +'<th style="padding:7px 10px;text-align:left;font-size:10px;text-transform:uppercase;letter-spacing:1px;color:#c0392b;">Art.</th>'
      +'<th style="padding:7px 10px;text-align:left;font-size:10px;text-transform:uppercase;letter-spacing:1px;color:#c0392b;">Designa\\u00e7\\u00e3o</th>'
      +'<th style="padding:7px 10px;text-align:center;font-size:10px;text-transform:uppercase;letter-spacing:1px;color:#c0392b;">Quant.</th>'
      +'<th style="padding:7px 10px;text-align:center;font-size:10px;text-transform:uppercase;letter-spacing:1px;color:#c0392b;">Un.</th>'
      +'<th style="padding:7px 10px;text-align:right;font-size:10px;text-transform:uppercase;letter-spacing:1px;color:#c0392b;">Pre\\u00e7o Unit.</th>'
      +'<th style="padding:7px 10px;text-align:right;font-size:10px;text-transform:uppercase;letter-spacing:1px;color:#c0392b;">Total</th>'
      +'</tr></thead><tbody>'+linhasHTML
      +'<tr style="background:#fef2f2;"><td colspan="5" style="padding:8px 10px;font-weight:700;text-align:right;font-size:11px;text-transform:uppercase;letter-spacing:1px;">Subtotal '+sec.nome+'</td>'
      +'<td style="padding:8px 10px;font-weight:800;text-align:right;color:#c0392b;">'+subTotal.toFixed(2)+'\\u20ac</td></tr>'
      +'</tbody></table></div>';
  }).join("");
  return '<!DOCTYPE html><html lang="pt"><head><meta charset="UTF-8"/><title>Or\\u00e7amento '+orc.numero+'</title>'
    +'<style>@import url(https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap);'
    +'*{box-sizing:border-box;margin:0;padding:0}body{font-family:"Inter",sans-serif;font-size:13px;color:#222;padding:32px 40px;background:#fff;line-height:1.5}'
    +'h1{font-size:20px;font-weight:700;color:#c0392b}h2{font-size:11px;font-weight:700;color:#c0392b;text-transform:uppercase;letter-spacing:1.2px;margin:18px 0 8px;border-bottom:1px solid #f0e0de;padding-bottom:4px}'
    +'@media print{body{padding:18px 26px}@page{margin:1cm;size:A4}}</style></head><body>'
    +cabecalhoHTML()
    +'<div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:20px;">'
    +'<div><div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#aaa;margin-bottom:4px;">Or\\u00e7amento</div>'
    +'<h1>'+orc.numero+'</h1>'
    +(orc.titulo?'<div style="font-size:14px;color:#333;margin-top:4px;">'+orc.titulo+'</div>':'')+'</div>'
    +'<div style="text-align:right;font-size:11px;color:#aaa;line-height:2;">'
    +(orc.cliente?'<div><strong style="color:#333;">'+orc.cliente+'</strong></div>':'')
    +(orc.morada?'<div>'+orc.morada+'</div>':'')
    +'<div>Data: <strong style="color:#555;">'+orc.data+'</strong></div>'
    +'<div>V\\u00e1lido por 30 dias</div>'
    +'</div></div>'
    +secoesHTML
    +'<div style="margin-top:16px;padding:14px 18px;background:#fef2f2;border-radius:8px;border:1px solid #f0e0de;">'
    +'<div style="display:flex;justify-content:space-between;font-size:13px;margin-bottom:6px;"><span>Total sem IVA</span><strong>'+totalGeral.toFixed(2)+'\\u20ac</strong></div>'
    +(orc.iva>0?'<div style="display:flex;justify-content:space-between;font-size:13px;margin-bottom:6px;"><span>IVA ('+orc.iva+'%)</span><strong>'+ivaVal.toFixed(2)+'\\u20ac</strong></div>':'')
    +'<div style="display:flex;justify-content:space-between;font-size:16px;font-weight:800;color:#c0392b;border-top:1px solid #f0e0de;padding-top:8px;margin-top:6px;">'
    +'<span>TOTAL'+(orc.iva>0?' (com IVA)':'')+'</span><span>'+(totalGeral+ivaVal).toFixed(2)+'\\u20ac</span></div></div>'
    +(orc.notas?'<div style="margin-top:16px;font-size:12px;color:#666;padding:10px 14px;border:1px solid #eee;border-radius:6px;">'+orc.notas+'</div>':'')
    +rodapeHTML("Or\\u00e7amento "+orc.numero)
    +'</body></html>';
}

// ═══════════════════════════════════════════════════════════════════════════════
// GERIR ARTIGOS MODAL
// ═══════════════════════════════════════════════════════════════════════════════
function ArtigosModal({artigos, setArtigos, onClose}) {
  var CE=React.createElement;
  var CATS=["Pesquisa","Canaliza\\u00e7\\u00e3o","Demoli\\u00e7\\u00e3o","Prepara\\u00e7\\u00e3o","Cer\\u00e2mica","Pintura","Acabamentos","Tetos","Pavimentos","Sanit\\u00e1rios","Limpeza","Geral"];
  var UNI=["uni","m2","m","ml","kg","lt","vg","cx"];
  var _f=React.useState({descricao:"",unidade:"uni",precoUnit:"",categoria:"Geral"});
  var form=_f[0]; var setForm=_f[1];
  var _e=React.useState(null); var editId=_e[0]; var setEditId=_e[1];

  var setF=function(k,v){setForm(function(p){return Object.assign({},p,{[k]:v});});};
  var handleSave=function(){
    if(!form.descricao.trim())return alert("Preenche a descri\\u00e7\\u00e3o.");
    if(editId!==null){
      setArtigos(function(p){return p.map(function(a){return a.id===editId?Object.assign({},a,form,{precoUnit:parseFloat(form.precoUnit)||0}):a;});});
      setEditId(null);
    } else {
      setArtigos(function(p){return [...p,Object.assign({},form,{id:Date.now(),precoUnit:parseFloat(form.precoUnit)||0})];});
    }
    setForm({descricao:"",unidade:"uni",precoUnit:"",categoria:"Geral"});
  };
  var startEdit=function(a){setEditId(a.id);setForm({descricao:a.descricao,unidade:a.unidade,precoUnit:String(a.precoUnit),categoria:a.categoria||"Geral"});};
  var handleDel=function(id){if(window.confirm("Apagar artigo?"))setArtigos(function(p){return p.filter(function(a){return a.id!==id;});});};
  var porCat={};
  artigos.forEach(function(a){var c=a.categoria||"Geral";if(!porCat[c])porCat[c]=[];porCat[c].push(a);});
  var lbl=function(t){return CE("label",{style:{fontSize:10,color:"#64748b",fontWeight:700,textTransform:"uppercase",letterSpacing:1,display:"block",marginBottom:4}},t);};

  return CE("div",{style:{position:"fixed",inset:0,background:"rgba(0,0,0,0.8)",zIndex:500,display:"flex",alignItems:"center",justifyContent:"center",padding:16}},
    CE("div",{style:{background:"#1a1f35",borderRadius:16,padding:28,width:860,maxWidth:"100%",maxHeight:"92vh",overflowY:"auto",boxShadow:"0 24px 64px rgba(0,0,0,0.7)"}},
      CE("div",{style:{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}},
        CE("h3",{style:{color:"#e2e8f0",margin:0,fontSize:18,fontWeight:700,fontFamily:"'Sora',sans-serif"}},"Base de Artigos"),
        CE("button",{onClick:onClose,style:{background:"none",border:"none",color:"#64748b",fontSize:24,cursor:"pointer"}},"\u00D7")
      ),
      CE("div",{style:{background:"#111827",borderRadius:10,padding:14,marginBottom:20,display:"grid",gridTemplateColumns:"2.5fr 1fr 1fr 1fr auto",gap:10,alignItems:"end"}},
        CE("div",null,lbl("Descri\\u00e7\\u00e3o"),CE(TxtInput,{type:"text",value:form.descricao,placeholder:"Ex: Pintura pl\\u00e1stica interior",onChange:function(e){setForm(function(p){return Object.assign({},p,{descricao:e.target.value});});}})),
        CE("div",null,lbl("Categoria"),CE(Sel,{value:form.categoria,onChange:function(e){setForm(function(p){return Object.assign({},p,{categoria:e.target.value});})}},CATS.map(function(c){return CE("option",{key:c,value:c},c);}))),
        CE("div",null,lbl("Unidade"),CE(Sel,{value:form.unidade,onChange:function(e){setForm(function(p){return Object.assign({},p,{unidade:e.target.value});})}},UNI.map(function(u){return CE("option",{key:u,value:u},u);}))),
        CE("div",null,lbl("Pre\\u00e7o Unit. (\\u20ac)"),CE(TxtInput,{type:"number",min:"0",step:"0.01",value:form.precoUnit,onChange:function(e){setForm(function(p){return Object.assign({},p,{precoUnit:e.target.value});});}})),
        CE("div",null,CE(Btn,{variant:"primary",onClick:handleSave},editId!==null?"Actualizar":"+ Adicionar"))
      ),
      Object.keys(porCat).sort().map(function(cat){
        return CE("div",{key:cat,style:{marginBottom:18}},
          CE("div",{style:{fontSize:11,fontWeight:700,color:"#bd4d2a",textTransform:"uppercase",letterSpacing:1,marginBottom:6,paddingLeft:4}},cat),
          CE("div",{style:{background:"#111827",borderRadius:8,overflow:"hidden"}},
            CE("table",{style:{width:"100%",borderCollapse:"collapse",fontSize:12}},
              CE("tbody",null,porCat[cat].map(function(a){
                return CE("tr",{key:a.id,style:{borderBottom:"1px solid #1e293b"}},
                  CE("td",{style:{padding:"8px 14px",color:"#e2e8f0",flex:1}},a.descricao),
                  CE("td",{style:{padding:"8px 14px",color:"#64748b",textAlign:"center",width:60}},a.unidade),
                  CE("td",{style:{padding:"8px 14px",color:"#10b981",textAlign:"right",fontWeight:700,width:90}},a.precoUnit.toFixed(2),"\u20ac"),
                  CE("td",{style:{padding:"8px 8px",textAlign:"right",whiteSpace:"nowrap",width:80}},
                    CE("button",{onClick:function(){startEdit(a);},style:{background:"none",border:"none",color:"#94a3b8",cursor:"pointer",fontSize:13,padding:"2px 6px"}},"\u270F\uFE0F"),
                    CE("button",{onClick:function(){handleDel(a.id);},style:{background:"none",border:"none",color:"#475569",cursor:"pointer",fontSize:13,padding:"2px 6px"}},"\uD83D\uDDD1")
                  )
                );
              }))
            )
          )
        );
      })
    )
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// EDITOR DE ORÇAMENTO
// ═══════════════════════════════════════════════════════════════════════════════
function OrcamentoEditor({orcamento, artigos, obras, orcamentos, onSave, onClose, setObras}) {
  var CE=React.createElement;
  var hoje=new Date().toISOString().slice(0,10);
  var emptyOrc=function(){return {id:Date.now(),numero:nextNumeroOrc(orcamentos),titulo:"",cliente:"",morada:"",contacto:"",data:hoje,estado:"rascunho",iva:0,notas:"",secoes:[]};};
  var _f=React.useState(orcamento&&orcamento.id?Object.assign({},orcamento):emptyOrc());
  var form=_f[0]; var setForm=_f[1];
  var _sec=React.useState(null); var secAtiva=_sec[0]; var setSecAtiva=_sec[1];
  var _art=React.useState(false); var showPickArt=_art[0]; var setShowPickArt=_art[1];
  var _saving=React.useState(false); var saving=_saving[0]; var setSaving=_saving[1];

  var setF=function(k,v){setForm(function(p){return Object.assign({},p,{[k]:v});});};

  var addSeccao=function(){
    var nova={id:Date.now(),nome:"Nova Sec\\u00e7\\u00e3o",proprietario:"",contacto:"",linhas:[],obraId:null};
    setForm(function(p){return Object.assign({},p,{secoes:[...p.secoes,nova]});});
    setSecAtiva(nova.id);
  };

  var updateSec=function(id,changes){
    setForm(function(p){return Object.assign({},p,{secoes:p.secoes.map(function(s){return s.id===id?Object.assign({},s,changes):s;})});});
  };

  var delSec=function(id){
    if(!window.confirm("Apagar sec\\u00e7\\u00e3o?"))return;
    setForm(function(p){return Object.assign({},p,{secoes:p.secoes.filter(function(s){return s.id!==id;})});});
    if(secAtiva===id)setSecAtiva(null);
  };

  var addLinha=function(secId, artigo){
    var nova={id:Date.now(),artigoId:artigo?artigo.id:null,descricao:artigo?artigo.descricao:"",unidade:artigo?artigo.unidade:"uni",quantidade:1,precoUnit:artigo?artigo.precoUnit:0,total:artigo?artigo.precoUnit:0};
    updateSec(secId,{linhas:[...(form.secoes.find(function(s){return s.id===secId;})||{linhas:[]}).linhas,nova]});
  };

  var updateLinha=function(secId,linhaId,changes){
    updateSec(secId,{linhas:(form.secoes.find(function(s){return s.id===secId;})||{linhas:[]}).linhas.map(function(l){
      if(l.id!==linhaId)return l;
      var n=Object.assign({},l,changes);
      n.total=Math.round((parseFloat(n.quantidade)||0)*(parseFloat(n.precoUnit)||0)*100)/100;
      return n;
    })});
  };

  var delLinha=function(secId,linhaId){
    updateSec(secId,{linhas:(form.secoes.find(function(s){return s.id===secId;})||{linhas:[]}).linhas.filter(function(l){return l.id!==linhaId;})});
  };

  var converterEmObra=function(secId){
    var sec=form.secoes.find(function(s){return s.id===secId;});
    if(!sec)return;
    if(!window.confirm("Criar obra para a sec\\u00e7\\u00e3o \\""+sec.nome+"\\"?"))return;
    var novaObra={id:Date.now(),spId:null,titulo:(form.titulo||form.numero)+" - "+sec.nome,cliente:sec.proprietario||"",clienteTel:sec.contacto||"",tipo:"particular",estado:"pendente",inicio:hoje,duracao:1,trabalhos:sec.linhas.map(function(l){return l.descricao;}),funcionarios:[],especialidades:[],notas:"Criado a partir de or\\u00e7amento "+form.numero};
    setObras(function(p){return [...p,novaObra];});
    updateSec(secId,{obraId:novaObra.id});
    alert("Obra criada: "+(form.titulo||form.numero)+" - "+sec.nome);
  };

  var handleSave=function(){
    if(!form.cliente.trim()&&!form.titulo.trim())return alert("Preenche o cliente ou t\\u00edtulo.");
    setSaving(true);
    onSave(form);
    setSaving(false);
  };

  var secAtual=form.secoes.find(function(s){return s.id===secAtiva;})||null;
  var totalGeral=form.secoes.reduce(function(s,sec){return s+sec.linhas.reduce(function(ss,l){return ss+(l.total||0);},0);},0);
  var ivaVal=totalGeral*(form.iva||0)/100;

  var lbl=function(t){return CE("label",{style:{fontSize:10,color:"#64748b",fontWeight:700,textTransform:"uppercase",letterSpacing:1,display:"block",marginBottom:4}},t);};
  var ESTADOS=["rascunho","enviado","aprovado","rejeitado"];
  var ESTADO_COLORS={rascunho:"#64748b",enviado:"#3b82f6",aprovado:"#10b981",rejeitado:"#ef4444"};

  return CE("div",{style:{position:"fixed",inset:0,background:"#0d1117",zIndex:200,display:"flex",flexDirection:"column",overflow:"hidden"}},
    // Header bar
    CE("div",{style:{background:"#1a1f35",borderBottom:"1px solid #1e293b",padding:"14px 24px",display:"flex",alignItems:"center",gap:16,flexShrink:0}},
      CE("button",{onClick:onClose,style:{background:"none",border:"none",color:"#64748b",cursor:"pointer",fontSize:20,lineHeight:1,padding:"0 4px"}},"\u2190"),
      CE("div",{style:{flex:1}},
        CE("div",{style:{fontSize:11,color:"#64748b",fontWeight:700,textTransform:"uppercase",letterSpacing:1}},form.numero),
        CE("div",{style:{fontSize:16,fontWeight:700,color:"#e2e8f0",marginTop:2}},form.titulo||form.cliente||"Novo Or\\u00e7amento")
      ),
      CE("div",{style:{display:"flex",alignItems:"center",gap:10}},
        CE(Sel,{value:form.estado,onChange:function(e){setF("estado",e.target.value)},style:{background:ESTADO_COLORS[form.estado]+"22",border:"1px solid "+ESTADO_COLORS[form.estado]+"44",color:ESTADO_COLORS[form.estado],fontWeight:700,borderRadius:6,padding:"6px 10px",fontSize:12}},
          ESTADOS.map(function(e){return CE("option",{key:e,value:e},e.charAt(0).toUpperCase()+e.slice(1));})
        ),
        CE("div",{style:{fontSize:15,fontWeight:800,color:"#10b981",minWidth:100,textAlign:"right"}},totalGeral.toFixed(2)+" \\u20ac"),
        CE(Btn,{variant:"ghost",onClick:function(){imprimirHTML(gerarOrcamentoPDF(form));}},"\uD83D\uDDA8\uFE0F PDF"),
        CE(Btn,{variant:"primary",onClick:handleSave,disabled:saving},saving?"A guardar...":"Guardar")
      )
    ),
    // Main content
    CE("div",{style:{display:"flex",flex:1,overflow:"hidden"}},
      // Left panel — header fields + sections list
      CE("div",{style:{width:300,minWidth:300,background:"#111827",borderRight:"1px solid #1e293b",display:"flex",flexDirection:"column",overflow:"hidden"}},
        CE("div",{style:{padding:16,overflowY:"auto",flex:1}},
          // Header fields
          CE("div",{style:{marginBottom:16}},
            CE("div",{style:{fontSize:11,fontWeight:700,color:"#64748b",textTransform:"uppercase",letterSpacing:1,marginBottom:10}},"Dados do Or\\u00e7amento"),
            CE("div",{style:{marginBottom:10}},lbl("T\\u00edtulo / Obra"),CE(TxtInput,{type:"text",value:form.titulo,placeholder:"Ex: Ed. Rainha - Infiltra\\u00e7\\u00e3o",onChange:function(e){setF("titulo",e.target.value);}})),
            CE("div",{style:{marginBottom:10}},lbl("Cliente (Condom\\u00ednio)"),CE(TxtInput,{type:"text",value:form.cliente,placeholder:"Nome do condom\\u00ednio ou cliente",onChange:function(e){setF("cliente",e.target.value);}})),
            CE("div",{style:{marginBottom:10}},lbl("Morada"),CE(TxtInput,{type:"text",value:form.morada,onChange:function(e){setF("morada",e.target.value);}})),
            CE("div",{style:{marginBottom:10,display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}},
              CE("div",null,lbl("Data"),CE(TxtInput,{type:"date",value:form.data,onChange:function(e){setF("data",e.target.value);}})),
              CE("div",null,lbl("IVA (%)"),CE(Sel,{value:form.iva,onChange:function(e){setF("iva",parseInt(e.target.value)||0);}},CE("option",{value:0},"Sem IVA"),CE("option",{value:6},"6%"),CE("option",{value:23},"23%")))
            ),
            CE("div",{style:{marginBottom:10}},lbl("Notas"),CE(TxtArea,{value:form.notas,onChange:function(e){setF("notas",e.target.value);},placeholder:"Observa\\u00e7\\u00f5es...",style:{minHeight:50}}))
          ),
          // Sections
          CE("div",null,
            CE("div",{style:{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}},
              CE("div",{style:{fontSize:11,fontWeight:700,color:"#64748b",textTransform:"uppercase",letterSpacing:1}},"Sec\\u00e7\\u00f5es"),
              CE("button",{onClick:addSeccao,style:{background:"#bd4d2a",border:"none",color:"#fff",borderRadius:6,padding:"4px 10px",fontSize:11,fontWeight:700,cursor:"pointer"}},"+ Sec\\u00e7\\u00e3o")
            ),
            form.secoes.length===0&&CE("div",{style:{color:"#475569",fontSize:12,padding:"12px 0",textAlign:"center"}},"Adiciona sec\\u00e7\\u00f5es (frac\\u00e7\\u00f5es, zonas comuns...)"),
            form.secoes.map(function(sec){
              var subT=sec.linhas.reduce(function(s,l){return s+(l.total||0);},0);
              var isAtiva=secAtiva===sec.id;
              return CE("div",{key:sec.id,style:{background:isAtiva?"rgba(189,77,42,0.12)":"#1a2035",borderRadius:8,padding:"10px 12px",marginBottom:6,cursor:"pointer",border:isAtiva?"1px solid rgba(189,77,42,0.4)":"1px solid transparent"},onClick:function(){setSecAtiva(sec.id);}},
                CE("div",{style:{display:"flex",justifyContent:"space-between",alignItems:"center"}},
                  CE("div",{style:{fontWeight:700,fontSize:13,color:isAtiva?"#e2e8f0":"#94a3b8"}},sec.nome),
                  CE("div",{style:{display:"flex",alignItems:"center",gap:8}},
                    CE("div",{style:{fontSize:11,color:"#10b981",fontWeight:700}},subT.toFixed(0)+"\\u20ac"),
                    sec.obraId&&CE("div",{style:{fontSize:9,background:"rgba(16,185,129,0.15)",color:"#10b981",border:"1px solid rgba(16,185,129,0.3)",borderRadius:4,padding:"1px 5px"}},"Obra"),
                    CE("button",{onClick:function(e){e.stopPropagation();delSec(sec.id);},style:{background:"none",border:"none",color:"#475569",cursor:"pointer",fontSize:11,padding:2}},"\u00D7")
                  )
                ),
                CE("div",{style:{fontSize:11,color:"#475569",marginTop:2}},sec.linhas.length," artigo",sec.linhas.length!==1?"s":"")
              );
            })
          )
        ),
        // Total footer
        CE("div",{style:{padding:"12px 16px",borderTop:"1px solid #1e293b",background:"#0d1117"}},
          form.iva>0&&CE("div",{style:{display:"flex",justifyContent:"space-between",fontSize:12,color:"#64748b",marginBottom:4}},CE("span",null,"IVA ("+form.iva+"%)"),CE("span",null,ivaVal.toFixed(2)+"\\u20ac")),
          CE("div",{style:{display:"flex",justifyContent:"space-between",fontSize:14,fontWeight:800,color:"#e2e8f0"}},CE("span",null,"Total"),CE("span",{style:{color:"#10b981"}},(totalGeral+ivaVal).toFixed(2)+"\\u20ac"))
        )
      ),
      // Right panel — line items for selected section
      CE("div",{style:{flex:1,display:"flex",flexDirection:"column",overflow:"hidden"}},
        secAtual===null
          ? CE("div",{style:{flex:1,display:"flex",alignItems:"center",justifyContent:"center",color:"#475569",fontSize:14}},
              form.secoes.length===0?"Adiciona uma sec\\u00e7\\u00e3o para come\\u00e7ar":"Selecciona uma sec\\u00e7\\u00e3o para editar os artigos"
            )
          : CE("div",{style:{flex:1,display:"flex",flexDirection:"column",overflow:"hidden"}},
              // Section header
              CE("div",{style:{padding:"14px 20px",background:"#111827",borderBottom:"1px solid #1e293b",flexShrink:0}},
                CE("div",{style:{display:"grid",gridTemplateColumns:"1fr 1fr auto",gap:10,alignItems:"end",marginBottom:10}},
                  CE("div",null,lbl("Nome da Sec\\u00e7\\u00e3o"),CE(TxtInput,{type:"text",value:secAtual.nome,onChange:function(e){updateSec(secAtual.id,{nome:e.target.value});}})),
                  CE("div",null,lbl("Propriet\\u00e1rio / Contacto"),CE(TxtInput,{type:"text",value:secAtual.proprietario,placeholder:"Nome do propriet\\u00e1rio",onChange:function(e){updateSec(secAtual.id,{proprietario:e.target.value});}})),
                  CE("div",null,
                    CE(Btn,{variant:secAtual.obraId?"ghost":"primary",onClick:function(){converterEmObra(secAtual.id);},disabled:!!secAtual.obraId},
                      secAtual.obraId?"Obra Criada":"\u2192 Converter em Obra"
                    )
                  )
                ),
                CE("div",{style:{display:"flex",gap:8}},
                  CE(Btn,{variant:"primary",onClick:function(){setShowPickArt(true);}},"+  Artigo da Base"),
                  CE(Btn,{variant:"ghost",onClick:function(){addLinha(secAtual.id,null);}},"+  Artigo Manual")
                )
              ),
              // Line items table
              CE("div",{style:{flex:1,overflowY:"auto",padding:"0 20px 20px"}},
                secAtual.linhas.length===0
                  ? CE("div",{style:{textAlign:"center",color:"#475569",fontSize:13,padding:"40px 0"}},"Adiciona artigos a esta sec\\u00e7\\u00e3o")
                  : CE("table",{style:{width:"100%",borderCollapse:"collapse",fontSize:12,marginTop:8}},
                    CE("thead",null,CE("tr",{style:{borderBottom:"1px solid #1e293b"}},
                      CE("th",{style:{padding:"8px 10px",textAlign:"left",color:"#64748b",fontWeight:700,textTransform:"uppercase",letterSpacing:1,fontSize:10}},  "Designa\\u00e7\\u00e3o"),
                      CE("th",{style:{padding:"8px 10px",textAlign:"center",color:"#64748b",fontWeight:700,textTransform:"uppercase",letterSpacing:1,fontSize:10,width:80}},"Qtd"),
                      CE("th",{style:{padding:"8px 10px",textAlign:"center",color:"#64748b",fontWeight:700,textTransform:"uppercase",letterSpacing:1,fontSize:10,width:60}},"Un."),
                      CE("th",{style:{padding:"8px 10px",textAlign:"right",color:"#64748b",fontWeight:700,textTransform:"uppercase",letterSpacing:1,fontSize:10,width:100}},"Pre\\u00e7o Unit."),
                      CE("th",{style:{padding:"8px 10px",textAlign:"right",color:"#64748b",fontWeight:700,textTransform:"uppercase",letterSpacing:1,fontSize:10,width:100}},"Total"),
                      CE("th",{style:{width:40}})
                    )),
                    CE("tbody",null,secAtual.linhas.map(function(l){
                      return CE("tr",{key:l.id,style:{borderBottom:"1px solid #0d1117"}},
                        CE("td",{style:{padding:"8px 10px"}},CE(TxtInput,{type:"text",value:l.descricao,onChange:function(e){updateLinha(secAtual.id,l.id,{descricao:e.target.value});},style:{fontSize:12}})),
                        CE("td",{style:{padding:"8px 6px"}},CE(TxtInput,{type:"number",min:"0",step:"0.01",value:l.quantidade,onChange:function(e){updateLinha(secAtual.id,l.id,{quantidade:parseFloat(e.target.value)||0});},style:{textAlign:"center",fontSize:12}})),
                        CE("td",{style:{padding:"8px 6px"}},CE(Sel,{value:l.unidade,onChange:function(e){updateLinha(secAtual.id,l.id,{unidade:e.target.value});},style:{fontSize:12}},["uni","m2","m","ml","kg","lt","vg","cx"].map(function(u){return CE("option",{key:u,value:u},u);}))),
                        CE("td",{style:{padding:"8px 6px"}},CE(TxtInput,{type:"number",min:"0",step:"0.01",value:l.precoUnit,onChange:function(e){updateLinha(secAtual.id,l.id,{precoUnit:parseFloat(e.target.value)||0});},style:{textAlign:"right",fontSize:12}})),
                        CE("td",{style:{padding:"8px 10px",textAlign:"right",fontWeight:700,color:"#10b981",whiteSpace:"nowrap"}},(l.total||0).toFixed(2)+" \\u20ac"),
                        CE("td",{style:{padding:"8px 4px",textAlign:"center"}},CE("button",{onClick:function(){delLinha(secAtual.id,l.id);},style:{background:"none",border:"none",color:"#475569",cursor:"pointer",fontSize:13}},"\u00D7"))
                      );
                    })),
                    CE("tfoot",null,CE("tr",{style:{borderTop:"2px solid #1e293b"}},
                      CE("td",{colSpan:4,style:{padding:"10px",textAlign:"right",fontSize:12,color:"#64748b",fontWeight:700,textTransform:"uppercase",letterSpacing:1}},"Subtotal "+secAtual.nome),
                      CE("td",{style:{padding:"10px",textAlign:"right",fontWeight:800,color:"#bd4d2a",fontSize:14}},secAtual.linhas.reduce(function(s,l){return s+(l.total||0);},0).toFixed(2)+" \\u20ac"),
                      CE("td",null)
                    ))
                  )
              )
            )
      )
    ),
    // Artigos picker overlay
    showPickArt&&secAtual&&CE("div",{style:{position:"fixed",inset:0,background:"rgba(0,0,0,0.7)",zIndex:600,display:"flex",alignItems:"center",justifyContent:"center",padding:16}},
      CE("div",{style:{background:"#1a1f35",borderRadius:14,padding:24,width:600,maxWidth:"100%",maxHeight:"80vh",overflowY:"auto",boxShadow:"0 20px 60px rgba(0,0,0,0.7)"}},
        CE("div",{style:{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}},
          CE("h4",{style:{color:"#e2e8f0",margin:0,fontSize:16,fontWeight:700}},"Seleccionar Artigo"),
          CE("button",{onClick:function(){setShowPickArt(false);},style:{background:"none",border:"none",color:"#64748b",fontSize:22,cursor:"pointer"}},"\u00D7")
        ),
        artigos.map(function(a){
          return CE("div",{key:a.id,style:{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"10px 14px",borderBottom:"1px solid #1e293b",cursor:"pointer",borderRadius:6},
            onClick:function(){addLinha(secAtual.id,a);setShowPickArt(false);}},
            CE("div",null,
              CE("div",{style:{fontSize:13,color:"#e2e8f0",fontWeight:500}},a.descricao),
              CE("div",{style:{fontSize:10,color:"#64748b",marginTop:2}},a.categoria)
            ),
            CE("div",{style:{display:"flex",gap:10,alignItems:"center"}},
              CE("div",{style:{fontSize:11,color:"#64748b"}},a.unidade),
              CE("div",{style:{fontSize:13,color:"#10b981",fontWeight:700,minWidth:60,textAlign:"right"}},a.precoUnit.toFixed(2)+"\\u20ac")
            )
          );
        })
      )
    )
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// VISTA ORÇAMENTOS
// ═══════════════════════════════════════════════════════════════════════════════
function OrcamentosView({orcamentos, setOrcamentos, artigos, setArtigos, obras, setObras, onNovoOrcamento, onEditOrcamento}) {
  var CE=React.createElement;
  var _filtro=React.useState("todos"); var filtro=_filtro[0]; var setFiltro=_filtro[1];
  var _showArt=React.useState(false); var showArt=_showArt[0]; var setShowArt=_showArt[1];

  var ESTADO_COLORS={rascunho:"#64748b",enviado:"#3b82f6",aprovado:"#10b981",rejeitado:"#ef4444"};
  var filtrados=filtro==="todos"?orcamentos:orcamentos.filter(function(o){return o.estado===filtro;});
  var handleDel=function(id){if(window.confirm("Apagar or\\u00e7amento?"))setOrcamentos(function(p){return p.filter(function(o){return o.id!==id;});});};

  return CE("div",null,
    showArt&&CE(ArtigosModal,{artigos:artigos,setArtigos:setArtigos,onClose:function(){setShowArt(false);}}),
    CE("div",{style:{display:"flex",alignItems:"flex-start",justifyContent:"space-between",marginBottom:24,flexWrap:"wrap",gap:12}},
      CE("div",null,
        CE("h1",{style:{fontFamily:"'Sora',sans-serif",fontSize:26,fontWeight:800,color:"#e2e8f0",margin:0}},"Or\\u00e7amentos"),
        CE("p",{style:{color:"#64748b",fontSize:13,marginTop:4}},"Cria\\u00e7\\u00e3o e gest\\u00e3o de or\\u00e7amentos e convers\\u00e3o em obras")
      ),
      CE("div",{style:{display:"flex",gap:8}},
        CE(Btn,{variant:"ghost",onClick:function(){setShowArt(true);}},"\u2699\uFE0F Base de Artigos"),
        CE(Btn,{variant:"primary",onClick:onNovoOrcamento},"+ Novo Or\\u00e7amento")
      )
    ),
    CE("div",{style:{display:"flex",gap:6,marginBottom:16,flexWrap:"wrap"}},
      ["todos","rascunho","enviado","aprovado","rejeitado"].map(function(e){
        var count=e==="todos"?orcamentos.length:orcamentos.filter(function(o){return o.estado===e;}).length;
        return CE("button",{key:e,onClick:function(){setFiltro(e);},style:{padding:"6px 14px",borderRadius:20,border:"none",cursor:"pointer",fontSize:12,fontWeight:700,background:filtro===e?(ESTADO_COLORS[e]||"#bd4d2a"):"rgba(255,255,255,0.05)",color:filtro===e?"#fff":(ESTADO_COLORS[e]||"#94a3b8")}},
          e.charAt(0).toUpperCase()+e.slice(1)+" ("+count+")"
        );
      })
    ),
    filtrados.length===0
      ? CE("div",{style:{textAlign:"center",color:"#64748b",padding:"60px 0",fontSize:14}},
          CE("div",{style:{fontSize:40,marginBottom:12}},"\uD83D\uDCC4"),
          "Sem or\\u00e7amentos",filtro!=="todos"?" neste estado":""
        )
      : CE("div",{style:{background:"#111827",borderRadius:12,border:"1px solid #1e293b",overflow:"hidden"}},
          CE("table",{style:{width:"100%",borderCollapse:"collapse",fontSize:12}},
            CE("thead",null,CE("tr",{style:{borderBottom:"1px solid #1e293b"}},
              ["N\\u00famero","T\\u00edtulo / Cliente","Data","Sec\\u00e7\\u00f5es","Total","Estado",""].map(function(h){
                return CE("th",{key:h,style:{padding:"10px 14px",textAlign:h==="Total"?"right":"left",color:"#64748b",fontWeight:700,textTransform:"uppercase",letterSpacing:1,fontSize:10}},h);
              })
            )),
            CE("tbody",null,filtrados.map(function(orc){
              var total=orc.secoes.reduce(function(s,sec){return s+sec.linhas.reduce(function(ss,l){return ss+(l.total||0);},0);},0);
              var ivaV=total*(orc.iva||0)/100;
              return CE("tr",{key:orc.id,style:{borderBottom:"1px solid #0d1117",cursor:"pointer"},onClick:function(){onEditOrcamento(orc);}},
                CE("td",{style:{padding:"12px 14px",color:"#94a3b8",fontWeight:700,whiteSpace:"nowrap"}},orc.numero),
                CE("td",{style:{padding:"12px 14px"}},
                  CE("div",{style:{color:"#e2e8f0",fontWeight:500}},orc.titulo||"(sem t\\u00edtulo)"),
                  orc.cliente&&CE("div",{style:{color:"#64748b",fontSize:11,marginTop:2}},orc.cliente)
                ),
                CE("td",{style:{padding:"12px 14px",color:"#64748b",whiteSpace:"nowrap"}},orc.data?new Date(orc.data).toLocaleDateString("pt-PT"):""),
                CE("td",{style:{padding:"12px 14px",color:"#94a3b8"}},orc.secoes.length," sec",orc.secoes.length!==1?"\\u00e7\\u00f5es":"\\u00e7\\u00e3o"),
                CE("td",{style:{padding:"12px 14px",textAlign:"right",color:"#10b981",fontWeight:700,whiteSpace:"nowrap"}},(total+ivaV).toFixed(2)+" \\u20ac"),
                CE("td",{style:{padding:"12px 14px"}},
                  CE("span",{style:{padding:"3px 10px",borderRadius:20,fontSize:11,fontWeight:700,background:(ESTADO_COLORS[orc.estado]||"#64748b")+"22",color:ESTADO_COLORS[orc.estado]||"#64748b"}},
                    orc.estado?orc.estado.charAt(0).toUpperCase()+orc.estado.slice(1):"Rascunho"
                  )
                ),
                CE("td",{style:{padding:"12px 8px",textAlign:"right",whiteSpace:"nowrap"},onClick:function(e){e.stopPropagation();}},
                  CE("button",{onClick:function(e){e.stopPropagation();imprimirHTML(gerarOrcamentoPDF(orc));},style:{background:"none",border:"none",color:"#64748b",cursor:"pointer",fontSize:13,padding:"2px 6px"},title:"PDF"},"\uD83D\uDDA8\uFE0F"),
                  CE("button",{onClick:function(e){e.stopPropagation();handleDel(orc.id);},style:{background:"none",border:"none",color:"#475569",cursor:"pointer",fontSize:13,padding:"2px 6px"},title:"Apagar"},"\uD83D\uDDD1")
                )
              );
            }))
          )
        )
  );
}

`;

// ── 1. Inserir componentes antes de window.GestaoObrasApp ─────────────────────
// Escapamos $ para evitar interpretação especial em str.replace()
const escapedCode = CODE.replace(/\$/g, '$$$$');
apply('1/4 componentes orcamentos',
  'window.GestaoObrasApp = function App() {',
  escapedCode + 'window.GestaoObrasApp = function App() {'
);

// ── 2. Estado artigos + orcamentos + orcamentoEditando em GestaoObrasApp ──────
apply('2/4 estado artigos e orcamentos',
  'const [editandoMat, setEditandoMat] = useState(null);',
  'const [editandoMat, setEditandoMat] = useState(null);\n' +
  '  const [artigos, setArtigos] = useState(function(){try{return JSON.parse(localStorage.getItem(\'artigos\'))||ARTIGOS_DEFAULT;}catch(e){return ARTIGOS_DEFAULT;}});\n' +
  '  const [orcamentos, setOrcamentos] = useState(function(){try{return JSON.parse(localStorage.getItem(\'orcamentos\'))||[];}catch(e){return [];}});\n' +
  '  const [orcamentoEditando, setOrcamentoEditando] = useState(null);\n' +
  '  React.useEffect(function(){localStorage.setItem(\'artigos\',JSON.stringify(artigos));}, [artigos]);\n' +
  '  React.useEffect(function(){localStorage.setItem(\'orcamentos\',JSON.stringify(orcamentos));}, [orcamentos]);'
);

// ── 4. Render OrcamentosView ──────────────────────────────────────────────────
apply('3/4 render OrcamentosView',
  'view === "analise" && /*#__PURE__*/React.createElement(AnaliseView, {',
  'view === "orcamentos" && !orcamentoEditando && /*#__PURE__*/React.createElement(OrcamentosView, {\n' +
  '    orcamentos: orcamentos,\n' +
  '    setOrcamentos: setOrcamentos,\n' +
  '    artigos: artigos,\n' +
  '    setArtigos: setArtigos,\n' +
  '    obras: obras,\n' +
  '    setObras: setObras,\n' +
  '    onNovoOrcamento: function(){ setOrcamentoEditando({}); setView("orcamentos"); },\n' +
  '    onEditOrcamento: function(o){ setOrcamentoEditando(o); }\n' +
  '  }), view === "analise" && /*#__PURE__*/React.createElement(AnaliseView, {'
);

// ── 5. Render OrcamentoEditor (overlay) ──────────────────────────────────────
apply('4/4 render OrcamentoEditor',
  'obraModal !== undefined && /*#__PURE__*/React.createElement(ObraModal,',
  'orcamentoEditando !== null && /*#__PURE__*/React.createElement(OrcamentoEditor, {\n' +
  '    orcamento: orcamentoEditando,\n' +
  '    artigos: artigos,\n' +
  '    obras: obras,\n' +
  '    orcamentos: orcamentos,\n' +
  '    setObras: setObras,\n' +
  '    onSave: function(orc){\n' +
  '      setOrcamentos(function(p){\n' +
  '        var exists=p.find(function(o){return o.id===orc.id;});\n' +
  '        return exists?p.map(function(o){return o.id===orc.id?orc:o;}): [...p, orc];\n' +
  '      });\n' +
  '      setOrcamentoEditando(null);\n' +
  '    },\n' +
  '    onClose: function(){ setOrcamentoEditando(null); }\n' +
  '  }), obraModal !== undefined && /*#__PURE__*/React.createElement(ObraModal,'
);

// ── Guardar ───────────────────────────────────────────────────────────────────
if (fail === 0) {
  writeFileSync(FILE, src, 'utf8');
  console.log('\nFicheiro guardado. Corre agora:');
  console.log('  node fix_nav_orc.mjs');
  console.log('  npm run build && git add -A && git commit -m "feat: modulo orcamentacao" && git push');
} else {
  console.log(`\n${fail} falha(s) — ficheiro NAO alterado.`);
  console.log('Partilha o output para diagnosticar.');
}
