// Abre uma janela com o relatório de despesas pronto para imprimir/salvar em PDF.
import { brl } from "./dinheiro.js";
import { dataBR, nomeMes } from "./datas.js";
import { somar } from "./dinheiro.js";
import { PAGO } from "./calculos.js";

const esc = (t) =>
  String(t ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

export function gerarRelatorioPdf({ itens, mes, filtros, saldoAtual, fimDoMes, ehMesAtual }) {
  if (!itens.length) return "vazio";
  const total = somar(itens);
  const pago = somar(itens.filter((d) => d.status === PAGO));
  const aPagar = total - pago;
  const linhas = itens
    .map(
      (d) =>
        `<tr><td>${esc(dataBR(d.vencimento))}</td><td><b>${esc(d.descricao)}</b><small>${esc([d.responsavel, d.forma].filter(Boolean).join(" · "))}</small>${
          d.obs ? `<small><i>${esc(d.obs)}</i></small>` : ""
        }</td><td>${esc(d.categoria)}</td><td class="c"><span class="st ${d.status === PAGO ? "pg" : "pe"}">${d.status === PAGO ? "Pago" : "Pendente"}</span></td><td class="v">${esc(brl(d.valor))}</td></tr>`,
    )
    .join("");
  const w = window.open("", "_blank");
  if (!w) return "bloqueado";
  w.document.open();
  w.document.write(`<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>Despesas - ${esc(nomeMes(mes))}</title><style>
@page{size:A4;margin:12mm}*{box-sizing:border-box}body{font:10px/1.35 system-ui,Segoe UI,Arial,sans-serif;color:#0f172a;margin:0}
h1{font-size:19px;margin:0}.sub{color:#64748b;margin-top:2px}.topo{display:flex;justify-content:space-between;border-bottom:2px solid #10b981;padding-bottom:8px;margin-bottom:10px}
.marca{font-weight:700;color:#047857;text-align:right}.cards{display:grid;grid-template-columns:repeat(4,1fr);gap:6px;margin-bottom:10px}
.card{border:1px solid #e2e8f0;border-radius:8px;padding:7px 9px}.card span{display:block;color:#64748b;font-size:8.5px}.card b{font-size:13px}
.verde b{color:#047857}.verm b{color:#be123c}table{width:100%;border-collapse:collapse}th{background:#0f172a;color:#fff;text-align:left;padding:5px;font-size:8.5px}
td{border-bottom:1px solid #e2e8f0;padding:5px;vertical-align:top}td small{display:block;color:#64748b;font-size:8px}.c{text-align:center}.v{text-align:right;font-weight:700;white-space:nowrap}
.st{padding:1px 6px;border-radius:9px;font-size:8px;font-weight:700}.pg{background:#d1fae5;color:#047857}.pe{background:#ffe4e6;color:#be123c}
tr{page-break-inside:avoid}thead{display:table-header-group}.rod{margin-top:8px;color:#94a3b8;font-size:8px;display:flex;justify-content:space-between}
@media print{body{-webkit-print-color-adjust:exact;print-color-adjust:exact}}</style></head><body>
<div class="topo"><div><h1>Relatório de despesas</h1><div class="sub">${esc(nomeMes(mes))}${filtros ? " · " + esc(filtros) : ""} · ${itens.length} conta(s)</div></div><div class="marca">Casa &amp; Cofre</div></div>
<div class="cards"><div class="card"><span>Total do período</span><b>${esc(brl(total))}</b></div><div class="card verde"><span>Já pago</span><b>${esc(brl(pago))}</b></div><div class="card verm"><span>A pagar</span><b>${esc(brl(aPagar))}</b></div>
<div class="card"><span>${ehMesAtual ? "Saldo previsto no fim do mês" : "Saldo em conta hoje"}</span><b>${esc(brl(ehMesAtual ? fimDoMes : saldoAtual))}</b></div></div>
<table><thead><tr><th style="width:13%">Vencimento</th><th>Descrição</th><th style="width:18%">Categoria</th><th style="width:11%" class="c">Status</th><th style="width:14%" class="v">Valor</th></tr></thead><tbody>${linhas}</tbody></table>
<div class="rod"><span>Gerado em ${esc(new Date().toLocaleString("pt-BR"))}</span><span>Casa &amp; Cofre</span></div></body></html>`);
  w.document.close();
  setTimeout(() => {
    w.focus();
    w.print();
  }, 250);
  return "ok";
}
