import { CATEGORIAS_DESPESA, CATEGORIAS_RECEITA, FORMAS_PAGAMENTO } from "./categorias.js";
import { hoje } from "./datas.js";

export const VERSAO_DADOS = 2;

/** Id seguro para usar como nome de campo no Firestore (só letras, números, _ e -). */
export const novoId = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-5);
export const idSeguro = (id) => String(id || "").replace(/[^A-Za-z0-9_-]/g, "") || novoId();

export const configPadrao = () => ({
  saldoInicial: 0,
  dataInicial: hoje(),
  rendaFixa: [],
  categoriasDespesa: [...CATEGORIAS_DESPESA],
  categoriasReceita: [...CATEGORIAS_RECEITA],
  responsaveis: ["Casal"],
  formasPagamento: [...FORMAS_PAGAMENTO],
  limiteAtencao: 0.7,
  limiteRisco: 0.8,
  metaReservaMeses: 3,
  metaPoupancaPct: 0.2,
});

export const dadosVazios = () => ({
  versao: VERSAO_DADOS,
  config: configPadrao(),
  despesas: {},
  receitas: {},
  recorrentes: {},
  ajustes: {},
});

/** Garante que todos os campos existam, mesmo em documentos incompletos. */
export function completar(d) {
  const base = dadosVazios();
  if (!d || typeof d !== "object") return base;
  return {
    ...base,
    ...d,
    config: { ...base.config, ...(d.config || {}) },
    despesas: d.despesas || {},
    receitas: d.receitas || {},
    recorrentes: d.recorrentes || {},
    ajustes: d.ajustes || {},
  };
}
