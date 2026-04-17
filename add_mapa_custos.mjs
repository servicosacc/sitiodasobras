// add_mapa_custos.mjs — Transforma "Mapa de Horas" em "Mapa de Custos de Obra"
// Inclui horas + materiais alocados à obra
// Arrastar para o Codespace e correr: node add_mapa_custos.mjs

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

// ── 1. Substituir gerarMapaHoras para incluir materiais ───────────────────────
// A função começa com: function gerarMapaHoras(obra, registos) {
// e termina com: ${rodapeHTML("Mapa de Horas")}
// Substituímos a assinatura para aceitar materiais e reescrevemos o HTML gerado

const OLD_FN_START = 'function gerarMapaHoras(obra, registos) {';
const OLD_FN_END = '${rodapeHTML("Mapa de Horas")}\n</body></html>`;\n}';

const idxStart = src.indexOf(OLD_FN_START);
const idxEnd   = src.indexOf(OLD_FN_END);

if (idxStart < 0 || idxEnd < 0) {
  console.warn('FAIL 1/4 gerarMapaHoras — padrão não encontrado');
  fail++;
} else {
  const before = src.slice(0, idxStart);
  const after  = src.slice(idxEnd + OLD_FN_END.length);

  const NEW_FN = `function gerarMapaHoras(obra, registos, materiais) {
  const hoje = new Date().toLocaleDateString("pt-PT", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric"
  });
  const mats = (materiais || []).filter(m => String(m.obraId) === String(obra.spId || obra.id));
  const regs = registos.filter(r => r.obraId === obra.id).sort((a, b) => a.data.localeCompare(b.data));
  const totalH = regs.reduce((s, r) => s + r.horas, 0);
  const totalMO = regs.reduce((s, r) => s + r.horas * CUSTO_HORA[r.funcionario], 0);
  const totalMat = mats.reduce((s, m) => s + (m.custoTotal || 0), 0);
  const totalGeral = totalMO + totalMat;
  const porFunc = FUNCIONARIOS.map(f => ({
    f,
    h: regs.filter(r => r.funcionario === f).reduce((s, r) => s + r.horas, 0),
    c: regs.filter(r => r.funcionario === f).reduce((s, r) => s + r.horas * CUSTO_HORA[r.funcionario], 0)
  })).filter(x => x.h > 0);
  const lD = regs.map(r => \`<tr><td style="padding:8px 12px;border-bottom:1px solid #f5f5f5;">\${toDate(r.data).toLocaleDateString("pt-PT", {
    weekday: "short",
    day: "2-digit",
    month: "2-digit",
    year: "numeric"
  })}</td><td style="padding:8px 12px;border-bottom:1px solid #f5f5f5;font-weight:600;">\${r.funcionario}</td><td style="padding:8px 12px;border-bottom:1px solid #f5f5f5;text-align:center;">\${r.horas}h</td><td style="padding:8px 12px;border-bottom:1px solid #f5f5f5;text-align:right;color:#16a34a;font-weight:600;">\${(r.horas * CUSTO_HORA[r.funcionario]).toFixed(2)}€</td><td style="padding:8px 12px;border-bottom:1px solid #f5f5f5;color:#666;">\${r.notas || ""}</td></tr>\`).join("");
  const lF = porFunc.map(x => \`<tr><td style="padding:9px 14px;border-bottom:1px solid #f5f5f5;font-weight:600;">\${x.f}</td><td style="padding:9px 14px;border-bottom:1px solid #f5f5f5;text-align:center;">\${CUSTO_HORA[x.f]}€/h</td><td style="padding:9px 14px;border-bottom:1px solid #f5f5f5;text-align:center;font-weight:700;">\${x.h}h</td><td style="padding:9px 14px;border-bottom:1px solid #f5f5f5;text-align:right;color:#16a34a;font-weight:700;">\${x.c.toFixed(2)}€</td></tr>\`).join("");
  const lM = mats.map(m => \`<tr><td style="padding:8px 12px;border-bottom:1px solid #f5f5f5;">\${m.data ? m.data : "—"}</td><td style="padding:8px 12px;border-bottom:1px solid #f5f5f5;font-weight:600;">\${m.descricao}</td><td style="padding:8px 12px;border-bottom:1px solid #f5f5f5;color:#666;">\${m.fornecedor || "—"}</td><td style="padding:8px 12px;border-bottom:1px solid #f5f5f5;text-align:center;">\${m.quantidade} \${m.unidade}</td><td style="padding:8px 12px;border-bottom:1px solid #f5f5f5;text-align:right;color:#16a34a;font-weight:600;">\${(m.custoTotal || 0).toFixed(2)}€</td></tr>\`).join("");
  return \`<!DOCTYPE html><html lang="pt"><head><meta charset="UTF-8"/><title>Mapa de Custos de Obra</title><style>@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap');*{box-sizing:border-box;margin:0;padding:0}body{font-family:'Inter',sans-serif;font-size:13px;color:#222;padding:32px 40px;background:#fff;line-height:1.5}h1{font-size:19px;font-weight:700;color:#c0392b;margin-bottom:4px}h2{font-size:11px;font-weight:700;color:#c0392b;text-transform:uppercase;letter-spacing:1.2px;margin:22px 0 10px;border-bottom:1px solid #f0e0de;padding-bottom:5px}table{width:100%;border-collapse:collapse}thead tr{background:#fef2f2}th{padding:8px 12px;text-align:left;font-size:10px;text-transform:uppercase;letter-spacing:1px;color:#c0392b;font-weight:700}.linha{border-bottom:1px solid #555;margin:30px 0 6px}@media print{body{padding:18px 26px}@page{margin:1.2cm;size:A4}}</style></head><body>
\${cabecalhoHTML()}
<div style="display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:18px;"><div><div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#aaa;margin-bottom:4px;">Mapa de Custos de Obra</div><h1>\${obra.titulo}</h1>\${obra.condominio ? \`<div style="font-size:12px;color:#666;margin-top:3px;">\${obra.condominio}</div>\` : ""}</div><div style="text-align:right;font-size:11px;color:#aaa;line-height:1.9;"><div>Início: <strong style="color:#555;">\${fmt(obra.inicio)}</strong></div><div>Fim previsto: <strong style="color:#555;">\${fmt(fimObra(obra))}</strong></div><div>Emitido em: <strong style="color:#555;">\${hoje}</strong></div></div></div>
<div style="display:flex;gap:12px;margin-bottom:22px;">
<div style="flex:1;background:#fef2f2;border-radius:8px;padding:14px;text-align:center;"><div style="font-size:22px;font-weight:800;color:#c0392b;">\${totalH}h</div><div style="font-size:10px;text-transform:uppercase;letter-spacing:1px;color:#c0392b;margin-top:3px;">Total Horas</div></div>
<div style="flex:1;background:#f0fdf4;border-radius:8px;padding:14px;text-align:center;"><div style="font-size:22px;font-weight:800;color:#16a34a;">\${totalMO.toFixed(2)}€</div><div style="font-size:10px;text-transform:uppercase;letter-spacing:1px;color:#16a34a;margin-top:3px;">Custo M. Obra</div></div>
<div style="flex:1;background:#eff6ff;border-radius:8px;padding:14px;text-align:center;"><div style="font-size:22px;font-weight:800;color:#1d4ed8;">\${totalMat.toFixed(2)}€</div><div style="font-size:10px;text-transform:uppercase;letter-spacing:1px;color:#1d4ed8;margin-top:3px;">Custo Materiais</div></div>
<div style="flex:1;background:#fdf4ff;border-radius:8px;padding:14px;text-align:center;"><div style="font-size:22px;font-weight:800;color:#7c3aed;">\${totalGeral.toFixed(2)}€</div><div style="font-size:10px;text-transform:uppercase;letter-spacing:1px;color:#7c3aed;margin-top:3px;">Custo Total</div></div>
</div>
<h2>Resumo por Funcionário (Mão de Obra)</h2>
\${porFunc.length === 0 ? \`<p style="color:#bbb;font-style:italic;padding:10px 0;">Sem horas registadas.</p>\` : \`<table><thead><tr><th>Funcionário</th><th style="text-align:center;">Custo/Hora</th><th style="text-align:center;">Total Horas</th><th style="text-align:right;">Custo</th></tr></thead><tbody>\${lF}<tr style="background:#fef2f2;font-weight:800;"><td style="padding:10px 14px;" colspan="2">TOTAL MÃO DE OBRA</td><td style="padding:10px 14px;text-align:center;">\${totalH}h</td><td style="padding:10px 14px;text-align:right;color:#16a34a;">\${totalMO.toFixed(2)}€</td></tr></tbody></table>\`}
<h2>Detalhe de Registos Diários</h2>
\${regs.length === 0 ? \`<p style="color:#bbb;font-style:italic;padding:10px 0;">Sem registos de horas.</p>\` : \`<table><thead><tr><th>Data</th><th>Funcionário</th><th style="text-align:center;">Horas</th><th style="text-align:right;">Valor</th><th>Notas</th></tr></thead><tbody>\${lD}<tr style="background:#fef2f2;font-weight:800;"><td style="padding:10px 12px;" colspan="2">TOTAL</td><td style="padding:10px 12px;text-align:center;">\${totalH}h</td><td style="padding:10px 12px;text-align:right;color:#16a34a;">\${totalMO.toFixed(2)}€</td><td></td></tr></tbody></table>\`}
<h2 style="margin-top:26px;">Materiais</h2>
\${mats.length === 0 ? \`<p style="color:#bbb;font-style:italic;padding:10px 0;">Sem materiais registados para esta obra.</p>\` : \`<table><thead><tr><th>Data</th><th>Descrição</th><th>Fornecedor</th><th style="text-align:center;">Qtd</th><th style="text-align:right;">Custo</th></tr></thead><tbody>\${lM}<tr style="background:#fef2f2;font-weight:800;"><td style="padding:10px 12px;" colspan="4">TOTAL MATERIAIS</td><td style="padding:10px 12px;text-align:right;color:#16a34a;">\${totalMat.toFixed(2)}€</td></tr></tbody></table>\`}
<div style="margin-top:22px;padding:16px;background:#fef2f2;border-radius:8px;border:2px solid #c0392b;display:flex;justify-content:space-between;align-items:center;">
  <div style="font-size:13px;font-weight:700;color:#c0392b;text-transform:uppercase;letter-spacing:1px;">Custo Total da Obra</div>
  <div style="font-size:28px;font-weight:800;color:#c0392b;">\${totalGeral.toFixed(2)}€</div>
</div>
<h2 style="margin-top:28px;">Validação</h2>
<div style="border:1px solid #ddd;border-radius:8px;padding:18px;margin-top:8px;"><div style="display:grid;grid-template-columns:1fr 1fr;gap:48px;"><div><div style="font-size:11px;color:#999;margin-bottom:4px;">Responsável de Obra — Sítio das Obras, Lda</div><div class="linha"></div><div style="font-size:11px;color:#aaa;">Nome e assinatura &nbsp;·&nbsp; Data: ___/___/______</div></div><div><div style="font-size:11px;color:#999;margin-bottom:4px;">Cliente</div><div class="linha"></div><div style="font-size:11px;color:#aaa;">Nome e assinatura &nbsp;·&nbsp; Data: ___/___/______</div></div></div></div>
\${rodapeHTML("Mapa de Custos de Obra")}
</body></html>\`;
}`;

  src = before + NEW_FN + after;
  console.log('OK 1/4 gerarMapaHoras reescrita');
  ok++;
}

// ── 2. ImpressaoModal: aceitar materiais na assinatura ────────────────────────
apply('2/4 prop materiais em ImpressaoModal',
  'function ImpressaoModal({\n  obra,\n  registos,\n  tipo,\n  onClose\n}) {',
  'function ImpressaoModal({\n  obra,\n  registos,\n  tipo,\n  onClose,\n  materiais\n}) {'
);

// ── 3. ImpressaoModal: passar materiais ao gerarMapaHoras ─────────────────────
apply('3/4 passar materiais a gerarMapaHoras',
  'const html = tipo === "ficha" ? gerarFichaObra(obra) : gerarMapaHoras(obra, registos);',
  'const html = tipo === "ficha" ? gerarFichaObra(obra) : gerarMapaHoras(obra, registos, materiais);'
);

// ── 4. ImpressaoModal: actualizar label e nome do ficheiro ────────────────────
apply('4/4 label Mapa de Custos de Obra',
  'const nome = tipo === "ficha" ? `Ficha_Obra_${obra.id}` : `Mapa_Horas_${obra.id}`;\n' +
  '  const label = tipo === "ficha" ? "Ficha de Obra" : "Mapa de Horas";',
  'const nome = tipo === "ficha" ? `Ficha_Obra_${obra.id}` : `Mapa_Custos_${obra.id}`;\n' +
  '  const label = tipo === "ficha" ? "Ficha de Obra" : "Mapa de Custos de Obra";'
);

// ── 5. GestaoObrasApp: passar materiais ao ImpressaoModal ─────────────────────
apply('5/4 materiais no render ImpressaoModal',
  '  obra: impressaoModal.obra,\n    registos: registos,\n    tipo: impressaoModal.tipo,\n    onClose: () => setImpressaoModal(null)',
  '  obra: impressaoModal.obra,\n    registos: registos,\n    materiais: materiais,\n    tipo: impressaoModal.tipo,\n    onClose: () => setImpressaoModal(null)'
);

// ── Guardar ───────────────────────────────────────────────────────────────────
if (fail === 0) {
  writeFileSync(FILE, src, 'utf8');
  console.log('\nFicheiro guardado. Corre agora:');
  console.log('  npm run build && git add -A && git commit -m "feat: mapa de custos de obra com materiais" && git push');
} else {
  console.log(`\n${fail} falha(s) — ficheiro NAO alterado.`);
  console.log('Partilha o output acima para diagnosticar.');
}
