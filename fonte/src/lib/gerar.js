import { dataNoMes, listaMeses, mesesEntre } from "./datas.js";
import { PENDENTE } from "./calculos.js";

export const semParcela = (t) => (t || "").replace(/\s*\(\d+\/\d+\)\s*$/, "").trim();
const norm = (t) => semParcela(t).toLowerCase();

/** Em qual parcela (1..n) a recorrente está no mês, ou null se não cai nesse mês. */
export function parcelaNoMes(rec, mes) {
  if (!rec.inicio || mes < rec.inicio) return null;
  if (rec.ativo === false) return null;
  if (rec.tipo === "parcelada") {
    const n = mesesEntre(rec.inicio, mes) + 1;
    return n <= (rec.numParcelas || 1) ? n : null;
  }
  if (rec.fim && mes > rec.fim) return null;
  return 0;
}

/**
 * Cria os lançamentos de recorrentes e salários entre dois meses (inclusive).
 * Ids são determinísticos (mesma recorrente + mesmo mês = mesmo id), então gerar
 * duas vezes, ou nos dois celulares ao mesmo tempo, nunca duplica.
 * Retorna { despesas: {id: item}, receitas: {id: item} } só com os novos.
 */
export function gerarLancamentos(dados, de, ate, agoraMs = Date.now()) {
  const novasDesp = {};
  const novasRec = {};
  if (!de || !ate || ate < de) return { despesas: novasDesp, receitas: novasRec };

  const despesas = Object.values(dados.despesas || {});
  const receitas = Object.values(dados.receitas || {});
  const existeDesp = new Set();
  for (const d of despesas) {
    if (d.recId) existeDesp.add(d.recId + "|" + d.mes);
    existeDesp.add("nome:" + norm(d.descricao) + "|" + d.mes);
  }
  const existeRec = new Set();
  for (const r of receitas) {
    if (r.rendaId) existeRec.add(r.rendaId + "|" + r.mes);
    existeRec.add("nome:" + norm(r.descricao) + "|" + r.mes);
  }

  const recorrentes = Object.values(dados.recorrentes || {});
  for (const mes of listaMeses(de, ate)) {
    for (const rec of recorrentes) {
      const p = parcelaNoMes(rec, mes);
      if (p === null) continue;
      if (existeDesp.has(rec.id + "|" + mes) || existeDesp.has("nome:" + norm(rec.descricao) + "|" + mes)) continue;
      const id = `r_${rec.id}_${mes}`;
      novasDesp[id] = {
        id,
        mes,
        vencimento: dataNoMes(mes, rec.diaVencimento || 5),
        descricao: p ? `${rec.descricao} (${p}/${rec.numParcelas})` : rec.descricao,
        categoria: rec.categoria || "Outros",
        responsavel: rec.responsavel || "",
        valor: rec.valor,
        status: PENDENTE,
        pagoEm: "",
        forma: rec.forma || "",
        obs: "",
        recId: rec.id,
        parcela: p || null,
        criadoEm: agoraMs,
      };
      existeDesp.add(rec.id + "|" + mes);
    }

    for (const renda of dados.config?.rendaFixa || []) {
      if (!renda.valor || renda.valor <= 0) continue;
      const descricao = renda.descricao || `Salário ${renda.responsavel}`;
      if (existeRec.has(renda.id + "|" + mes) || existeRec.has("nome:" + norm(descricao) + "|" + mes)) continue;
      const id = `s_${renda.id}_${mes}`;
      novasRec[id] = {
        id,
        mes,
        data: dataNoMes(mes, renda.dia || 5),
        descricao,
        categoria: "Salário",
        responsavel: renda.responsavel || "",
        valor: renda.valor,
        status: PENDENTE,
        recebidoEm: "",
        obs: "",
        rendaId: renda.id,
        criadoEm: agoraMs,
      };
      existeRec.add(renda.id + "|" + mes);
    }
  }
  return { despesas: novasDesp, receitas: novasRec };
}
