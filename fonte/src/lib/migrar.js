// Converte os dados do app antigo (campo `state` no Firestore ou backup .json)
// para o formato novo. Nada é apagado no Firestore: o `state` antigo continua
// guardado no documento como cópia de segurança.

import { arred } from "./dinheiro.js";
import { mesAntigoParaNovo, mesDe, hoje } from "./datas.js";
import { idSeguro, configPadrao, dadosVazios, VERSAO_DADOS } from "./modelo.js";
import { PAGO, PENDENTE } from "./calculos.js";
import { semParcela } from "./gerar.js";
import { CATEGORIAS_DESPESA } from "./categorias.js";

const status = (s) => (s === "Pago" || s === PAGO ? PAGO : PENDENTE);
const mesItem = (it) => mesAntigoParaNovo(it.mesAno) || mesDe(it.data) || mesDe(hoje());

const ehAjusteDespesa = (d) =>
  !!d && (d.categoria === "Ajustes" || d.forma === "Ajuste") && /ajuste/i.test((d.descricao || "") + " " + (d.forma || ""));
const ehAjusteReceita = (d) =>
  !!d && /^ajuste de saldo/i.test(d.descricao || "") && (d.obs === "Ajuste manual do saldo" || d.categoria === "Ajustes");

export function migrarDoAntigo(antigo) {
  const novo = dadosVazios();
  if (!antigo || typeof antigo !== "object") return novo;
  const usados = new Set();
  const id = (bruto) => {
    let i = idSeguro(bruto);
    while (usados.has(i)) i = i + "x";
    usados.add(i);
    return i;
  };

  const c = antigo.config || {};
  const base = configPadrao();
  const semAjuste = (lista) => (lista || []).filter((x) => x !== "Ajustes" && x !== "Ajuste" && x !== "Saldo Inicial");
  novo.config = {
    ...base,
    saldoInicial: arred(Number(c.saldoInicial) || 0),
    dataInicial: c.dataInicial || base.dataInicial,
    rendaFixa: (c.rendaFixa || []).map((r) => ({
      id: id(r.id || "renda" + (r.responsavel || "")),
      responsavel: r.responsavel || "",
      valor: arred(Number(r.valor) || 0),
      dia: 5,
    })),
    categoriasDespesa: semAjuste(c.categoriasDespesa).length ? semAjuste(c.categoriasDespesa) : base.categoriasDespesa,
    categoriasReceita: semAjuste(c.categoriasReceita).length ? semAjuste(c.categoriasReceita) : base.categoriasReceita,
    responsaveis: c.responsaveis?.length ? c.responsaveis : base.responsaveis,
    formasPagamento: semAjuste(c.formasPagamento).length ? semAjuste(c.formasPagamento) : base.formasPagamento,
    limiteAtencao: Number(c.limiteAtencao) || base.limiteAtencao,
    limiteRisco: Number(c.limiteRisco) || base.limiteRisco,
    metaReservaMeses: Number(c.metaReservaMeses) || base.metaReservaMeses,
    metaPoupancaPct: Number(c.metaPoupancaPct) || base.metaPoupancaPct,
  };

  const addAjuste = (a) => {
    const i = id(a.id);
    novo.ajustes[i] = {
      id: i,
      data: a.data || hoje(),
      mes: a.mes || mesItem(a),
      valor: arred(Number(a.valor) || 0),
      saldoAnterior: a.saldoAnterior ?? null,
      saldoNovo: a.saldoNovo ?? null,
      obs: a.obs || "",
      criadoEm: a.criadoEm || 0,
    };
  };
  (antigo.ajustes || []).forEach(addAjuste);

  // Recorrentes primeiro, para ligar os lançamentos já gerados a elas.
  const recPorNome = new Map();
  for (const r of antigo.recorrentes || []) {
    const i = id(r.id);
    const parcelada = r.tipo === "Parcelada" || r.tipo === "parcelada";
    novo.recorrentes[i] = {
      id: i,
      descricao: r.descricao || "",
      valor: arred(Number(r.valor) || 0),
      categoria: r.categoria || "Outros",
      responsavel: r.responsavel || "",
      forma: r.forma === "Ajuste" ? "" : r.forma || "",
      tipo: parcelada ? "parcelada" : "fixa",
      numParcelas: parcelada ? parseInt(r.numParcelas, 10) || 1 : null,
      inicio: mesAntigoParaNovo(r.primeiraParcela) || r.inicio || mesDe(hoje()),
      fim: null,
      diaVencimento: 5,
      ativo: true,
      obs: r.obs || "",
    };
    recPorNome.set((r.descricao || "").trim().toLowerCase(), novo.recorrentes[i]);
  }

  for (const d of antigo.despesas || []) {
    const valor = arred(Number(d.valor) || 0);
    let categoria = d.categoria && d.categoria !== "Ajustes" ? d.categoria : "Outros";
    if (ehAjusteDespesa(d)) {
      if (status(d.status) === PAGO) {
        if (valor !== 0)
          addAjuste({ id: d.id, data: d.dataPagamento || d.data, mes: mesItem(d), valor: -Math.abs(valor), obs: "Convertido de ajuste antigo" });
        continue;
      }
      if (valor === 0) continue;
      categoria = "Outros"; // ajuste pendente vira despesa comum (o app antigo apagava)
    }
    const i = id(d.id);
    const mes = mesItem(d);
    const rec = recPorNome.get(semParcela(d.descricao).toLowerCase());
    const m = /\((\d+)\/(\d+)\)\s*$/.exec(d.descricao || "");
    novo.despesas[i] = {
      id: i,
      mes,
      vencimento: d.data || `${mes}-05`,
      descricao: d.descricao || "",
      categoria,
      responsavel: d.responsavel || "",
      valor,
      status: status(d.status),
      pagoEm: status(d.status) === PAGO ? d.dataPagamento || d.data || "" : "",
      forma: d.forma === "Ajuste" ? "" : d.forma || "",
      obs: d.obs || "",
      recId: rec && mes >= rec.inicio ? rec.id : null,
      parcela: m ? parseInt(m[1], 10) : null,
      criadoEm: 0,
    };
  }

  for (const r of antigo.receitas || []) {
    const valor = arred(Number(r.valor) || 0);
    if (r.categoria === "Saldo Inicial") continue; // já está em config.saldoInicial
    if (ehAjusteReceita(r)) {
      if (status(r.status) === PAGO && valor !== 0)
        addAjuste({ id: r.id, data: r.data, mes: mesItem(r), valor: Math.abs(valor), obs: "Convertido de ajuste antigo" });
      continue;
    }
    const i = id(r.id);
    const renda = novo.config.rendaFixa.find((x) => (r.descricao || "") === `Salário ${x.responsavel}`);
    novo.receitas[i] = {
      id: i,
      mes: mesItem(r),
      data: r.data || "",
      descricao: r.descricao || "",
      categoria: r.categoria || "Outros",
      responsavel: r.responsavel || "",
      valor,
      status: status(r.status),
      recebidoEm: status(r.status) === PAGO ? r.data || "" : "",
      obs: r.obs || "",
      rendaId: renda ? renda.id : null,
      criadoEm: 0,
    };
  }

  // categorias usadas mas que não estão na lista continuam disponíveis
  for (const d of Object.values(novo.despesas))
    if (d.categoria && !novo.config.categoriasDespesa.includes(d.categoria)) novo.config.categoriasDespesa.push(d.categoria);
  if (!novo.config.categoriasDespesa.length) novo.config.categoriasDespesa = [...CATEGORIAS_DESPESA];

  novo.versao = VERSAO_DADOS;
  return novo;
}

/** Aceita backup do app novo ou do antigo. Lança erro com mensagem amigável se inválido. */
export function lerBackup(texto) {
  let j;
  try {
    j = JSON.parse(texto);
  } catch {
    throw new Error("O arquivo não é um JSON válido.");
  }
  if (j && j.versao === VERSAO_DADOS && j.config && typeof j.despesas === "object" && !Array.isArray(j.despesas)) return j;
  if (j && j.config && Array.isArray(j.despesas) && Array.isArray(j.receitas)) return migrarDoAntigo(j);
  throw new Error("Este arquivo não parece ser um backup do Casa & Cofre.");
}
