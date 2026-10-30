import { centavos, reais } from "./dinheiro.js";
import { listaMeses, mesAtual as mesAtualHoje } from "./datas.js";

export const PAGO = "pago";
export const PENDENTE = "pendente";

const vals = (obj) => Object.values(obj || {});

/**
 * Explica de onde vem o saldo no fim de um mês (o mesmo número de `calcular`).
 *  - meses passados: saldo no início + recebido − pago ± ajustes
 *  - mês atual e futuros: saldo de hoje + a receber − a pagar do mês, mais o que
 *    ainda está em aberto de meses anteriores (atrasado ou não pago ainda).
 */
export function composicaoSaldo(dados, calc, mes) {
  const info = calc.meses.find((m) => m.mes === mes);
  if (!info) return null;
  if (info.passado) {
    return {
      tipo: "realizado",
      saldoInicio: info.saldoInicio,
      recebido: info.recReceb,
      pago: info.despPagas,
      ajustes: info.ajustes,
      saldoFim: info.saldoFim,
    };
  }
  const anteriores = (colecao) =>
    vals(dados[colecao])
      .filter((x) => x.mes && x.mes < mes && x.status !== PAGO)
      .sort((a, b) => (a.mes + (a.vencimento || a.data || "")).localeCompare(b.mes + (b.vencimento || b.data || "")));
  const despAnt = anteriores("despesas");
  const recAnt = anteriores("receitas");
  return {
    tipo: "previsto",
    saldoHoje: calc.saldoAtual,
    aReceber: info.aReceber,
    aPagar: info.aPagar,
    anteriores: {
      despesas: despAnt,
      receitas: recAnt,
      aPagar: reais(despAnt.reduce((s, x) => s + centavos(x.valor), 0)),
      aReceber: reais(recAnt.reduce((s, x) => s + centavos(x.valor), 0)),
    },
    saldoFim: info.saldoFim,
  };
}

/**
 * Calcula saldo, situação de cada mês e projeção.
 *
 * Regras (corrigidas em relação à versão antiga):
 * - Saldo atual = saldo inicial + tudo que já foi recebido − tudo que já foi pago + ajustes,
 *   independentemente do mês de competência.
 * - A projeção soma apenas o que ainda está EM ABERTO. Assim, uma conta de novembro
 *   paga em outubro não é descontada duas vezes.
 * - Contas e receitas pendentes de meses passados (atrasadas) entram no mês atual.
 */
export function calcular(dados, agora = new Date()) {
  const config = dados.config || {};
  const despesas = vals(dados.despesas);
  const receitas = vals(dados.receitas);
  const ajustes = vals(dados.ajustes);
  const atual = mesAtualHoje(agora);

  const porMes = new Map();
  const mesInfo = (mes) => {
    if (!porMes.has(mes))
      porMes.set(mes, { recPrev: 0, recReceb: 0, despPrev: 0, despPagas: 0, ajustes: 0, despesas: [], receitas: [] });
    return porMes.get(mes);
  };

  let saldoC = centavos(config.saldoInicial);
  const atrasadas = { despesas: [], receitas: [], despC: 0, recC: 0 };

  for (const d of despesas) {
    if (!d.mes) continue;
    const v = centavos(d.valor);
    const info = mesInfo(d.mes);
    info.despPrev += v;
    info.despesas.push(d);
    if (d.status === PAGO) {
      info.despPagas += v;
      saldoC -= v;
    } else if (d.mes < atual) {
      atrasadas.despesas.push(d);
      atrasadas.despC += v;
    }
  }
  for (const r of receitas) {
    if (!r.mes) continue;
    const v = centavos(r.valor);
    const info = mesInfo(r.mes);
    info.recPrev += v;
    info.receitas.push(r);
    if (r.status === PAGO) {
      info.recReceb += v;
      saldoC += v;
    } else if (r.mes < atual) {
      atrasadas.receitas.push(r);
      atrasadas.recC += v;
    }
  }
  for (const a of ajustes) {
    if (!a.mes) continue;
    const v = centavos(a.valor);
    mesInfo(a.mes).ajustes += v;
    saldoC += v;
  }

  mesInfo(atual);
  const chaves = [...porMes.keys()].sort();
  const todos = listaMeses(chaves[0], chaves[chaves.length - 1]);

  let realizadoC = centavos(config.saldoInicial);
  let projetadoC = 0;
  const meses = todos.map((mes) => {
    const i = porMes.get(mes) || mesInfo(mes);
    const aReceberC = i.recPrev - i.recReceb;
    const aPagarC = i.despPrev - i.despPagas;
    const saldoIniC = mes <= atual ? realizadoC : projetadoC;

    let saldoFimC;
    if (mes < atual) {
      realizadoC += i.recReceb - i.despPagas + i.ajustes;
      saldoFimC = realizadoC;
    } else if (mes === atual) {
      realizadoC += i.recReceb - i.despPagas + i.ajustes;
      // parte do saldo atual vem de pagamentos de meses futuros; usamos o saldo real da conta
      saldoFimC = saldoC + aReceberC + atrasadas.recC - aPagarC - atrasadas.despC;
      projetadoC = saldoFimC;
    } else {
      projetadoC += aReceberC - aPagarC;
      saldoFimC = projetadoC;
    }

    const comprometido = i.recPrev > 0 ? i.despPrev / i.recPrev : i.despPrev > 0 ? Infinity : 0;
    let situacao = "Saudável";
    if (comprometido >= (config.limiteRisco ?? 0.8)) situacao = "Risco";
    else if (comprometido >= (config.limiteAtencao ?? 0.7)) situacao = "Atenção";

    return {
      mes,
      passado: mes < atual,
      atual: mes === atual,
      futuro: mes > atual,
      recPrev: reais(i.recPrev),
      recReceb: reais(i.recReceb),
      aReceber: reais(aReceberC),
      despPrev: reais(i.despPrev),
      despPagas: reais(i.despPagas),
      aPagar: reais(aPagarC),
      ajustes: reais(i.ajustes),
      resultado: reais(i.recPrev - i.despPrev),
      comprometido,
      situacao,
      saldoInicio: reais(saldoIniC),
      saldoFim: reais(saldoFimC),
      realizado: mes <= atual ? reais(realizadoC) : null,
      despesas: i.despesas,
      receitas: i.receitas,
    };
  });

  const mesAtual = meses.find((m) => m.atual);
  const comDespesa = meses.filter((m) => m.despPrev > 0 && m.mes <= atual).slice(-6);
  const despMedia = comDespesa.length ? comDespesa.reduce((s, m) => s + m.despPrev, 0) / comDespesa.length : 0;
  const ultimoAjuste = [...ajustes].sort((a, b) => (b.data || "").localeCompare(a.data || "") || (b.criadoEm || 0) - (a.criadoEm || 0))[0] || null;

  return {
    atual,
    saldoAtual: reais(saldoC),
    meses,
    mesAtual,
    atrasadas: {
      despesas: atrasadas.despesas.sort((a, b) => (a.vencimento || "").localeCompare(b.vencimento || "")),
      receitas: atrasadas.receitas,
      totalDespesas: reais(atrasadas.despC),
      totalReceitas: reais(atrasadas.recC),
    },
    saldoFinalPlano: meses.length ? meses[meses.length - 1].saldoFim : reais(saldoC),
    despMedia,
    ultimoAjuste,
  };
}
