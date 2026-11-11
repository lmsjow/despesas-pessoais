// Cada ação devolve um conjunto de mudanças { "colecao.id": item | null }
// que o armazenamento grava de uma vez. As telas não montam caminhos à mão.

import { arred } from "../lib/dinheiro.js";
import { hoje, mesAtual, mesDe, mesesEntre, somarMeses } from "../lib/datas.js";
import { PAGO, PENDENTE } from "../lib/calculos.js";
import { gerarLancamentos } from "../lib/gerar.js";
import { novoId } from "../lib/modelo.js";

const agora = () => Date.now();

export function salvarLancamento(colecao, item) {
  const id = item.id || novoId();
  const base = { ...item, id, valor: arred(item.valor), atualizadoEm: agora(), criadoEm: item.criadoEm || agora() };
  if (colecao === "despesas") {
    base.mes = mesDe(base.vencimento) || base.mes;
    base.pagoEm = base.status === PAGO ? base.pagoEm || hoje() : "";
  } else {
    base.mes = mesDe(base.data) || base.mes;
    base.recebidoEm = base.status === PAGO ? base.recebidoEm || hoje() : "";
  }
  return { [`${colecao}.${id}`]: base };
}

export const excluir = (colecao, id) => ({ [`${colecao}.${id}`]: null });

export function alternarStatus(colecao, item) {
  const pago = item.status === PAGO;
  const campoData = colecao === "despesas" ? "pagoEm" : "recebidoEm";
  return {
    [`${colecao}.${item.id}`]: { ...item, status: pago ? PENDENTE : PAGO, [campoData]: pago ? "" : hoje(), atualizadoEm: agora() },
  };
}

/**
 * Marca itens como pagos/recebidos na data informada (padrão: hoje).
 * `valores` permite corrigir o valor efetivamente pago: { id: valor }.
 */
export function pagar(colecao, itens, data = hoje(), valores = {}) {
  const campoData = colecao === "despesas" ? "pagoEm" : "recebidoEm";
  const mudancas = {};
  for (const it of itens) {
    const valor = valores[it.id] > 0 ? arred(valores[it.id]) : it.valor;
    mudancas[`${colecao}.${it.id}`] = { ...it, valor, status: PAGO, [campoData]: data, atualizadoEm: agora() };
  }
  return mudancas;
}

/** Marca como pago (ou reabre) tudo de um mês na coleção indicada. */
export function marcarMes(dados, colecao, mes, pagar) {
  const mudancas = {};
  const campoData = colecao === "despesas" ? "pagoEm" : "recebidoEm";
  for (const it of Object.values(dados[colecao])) {
    if (it.mes !== mes) continue;
    if (pagar && it.status !== PAGO) mudancas[`${colecao}.${it.id}`] = { ...it, status: PAGO, [campoData]: hoje(), atualizadoEm: agora() };
    if (!pagar && it.status === PAGO) mudancas[`${colecao}.${it.id}`] = { ...it, status: PENDENTE, [campoData]: "", atualizadoEm: agora() };
  }
  return mudancas;
}

export function gerar(dados, de, ate) {
  const g = gerarLancamentos(dados, de, ate);
  const mudancas = {};
  for (const [id, it] of Object.entries(g.despesas)) mudancas[`despesas.${id}`] = it;
  for (const [id, it] of Object.entries(g.receitas)) mudancas[`receitas.${id}`] = it;
  return mudancas;
}

export function ajustarSaldo(saldoAtual, novoSaldo, obs = "") {
  const valor = arred(novoSaldo - saldoAtual);
  if (Math.abs(valor) < 0.005) return {};
  const id = novoId();
  return {
    [`ajustes.${id}`]: {
      id,
      data: hoje(),
      mes: mesAtual(),
      valor,
      saldoAnterior: arred(saldoAtual),
      saldoNovo: arred(novoSaldo),
      obs,
      criadoEm: agora(),
    },
  };
}

/**
 * Salva uma recorrente e, se pedido, atualiza valor/categoria dos lançamentos
 * pendentes dela a partir do mês atual.
 */
export function salvarRecorrente(dados, rec, atualizarPendentes) {
  const nova = !rec.id;
  const id = rec.id || novoId();
  const r = { ...rec, id, valor: arred(rec.valor) };
  const mudancas = { [`recorrentes.${id}`]: r, ...lancamentosDaRecorrente(dados, r, nova) };
  if (atualizarPendentes) {
    const atual = mesAtual();
    for (const d of Object.values(dados.despesas)) {
      if (d.recId === id && d.status !== PAGO && d.mes >= atual)
        mudancas[`despesas.${d.id}`] = { ...d, valor: r.valor, categoria: r.categoria, forma: r.forma, responsavel: r.responsavel, atualizadoEm: agora() };
    }
  }
  return mudancas;
}

/**
 * Cria logo os lançamentos de uma recorrente, para ela aparecer no mês certo
 * (relatórios, painel) sem depender do botão "Gerar meses".
 * Parcelada: todas as parcelas. Fixa: até o último mês já gerado no app (mínimo o atual).
 * Ao editar, só do mês atual em diante (não recria o que foi apagado no passado).
 */
function lancamentosDaRecorrente(dados, r, nova) {
  if (!/^\d{4}-\d{2}$/.test(r.inicio || "") || r.ativo === false) return {};
  const atual = mesAtual();
  const de = nova || r.inicio > atual ? r.inicio : atual;
  let ate;
  if (r.tipo === "parcelada") ate = somarMeses(r.inicio, (r.numParcelas || 1) - 1);
  else {
    ate = atual > r.inicio ? atual : r.inicio;
    for (const d of Object.values(dados.despesas || {})) if (d.recId && d.mes > ate) ate = d.mes;
    if (r.fim && r.fim < ate) ate = r.fim;
  }
  if (mesesEntre(de, ate) > 60) ate = somarMeses(de, 60);
  const mudancas = {};
  const g = gerarLancamentos({ ...dados, recorrentes: { [r.id]: r }, config: { ...dados.config, rendaFixa: [] } }, de, ate);
  for (const [gid, it] of Object.entries(g.despesas)) mudancas[`despesas.${gid}`] = it;
  return mudancas;
}

export function excluirRecorrente(dados, id, excluirPendentes) {
  const mudancas = { [`recorrentes.${id}`]: null };
  if (excluirPendentes) {
    const atual = mesAtual();
    for (const d of Object.values(dados.despesas)) if (d.recId === id && d.status !== PAGO && d.mes >= atual) mudancas[`despesas.${d.id}`] = null;
  }
  return mudancas;
}

/** Salva configuração; opcionalmente aplica novos salários às receitas pendentes futuras. */
export function salvarConfig(dados, config, aplicarSalarios) {
  const mudancas = { config };
  if (aplicarSalarios) {
    const atual = mesAtual();
    for (const r of Object.values(dados.receitas)) {
      if (r.status === PAGO || r.mes < atual || !r.rendaId) continue;
      const renda = config.rendaFixa.find((x) => x.id === r.rendaId);
      if (renda && renda.valor !== r.valor) mudancas[`receitas.${r.id}`] = { ...r, valor: renda.valor, atualizadoEm: agora() };
    }
  }
  return mudancas;
}
