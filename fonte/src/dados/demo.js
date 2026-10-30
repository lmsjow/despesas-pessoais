// Dados fictícios para o modo demonstração (?demo na URL).
import { dadosVazios } from "../lib/modelo.js";
import { gerarLancamentos } from "../lib/gerar.js";
import { mesAtual, somarMeses, hoje } from "../lib/datas.js";
import { PAGO } from "../lib/calculos.js";

export function dadosDemo() {
  const d = dadosVazios();
  const atual = mesAtual();
  const inicio = somarMeses(atual, -3);
  d.config.saldoInicial = 2500;
  d.config.dataInicial = `${inicio}-01`;
  d.config.responsaveis = ["Ana", "Bruno", "Casal"];
  d.config.rendaFixa = [
    { id: "ana", responsavel: "Ana", valor: 5200, dia: 5 },
    { id: "bruno", responsavel: "Bruno", valor: 3800, dia: 5 },
  ];
  const rec = (id, descricao, valor, categoria, extra = {}) =>
    (d.recorrentes[id] = { id, descricao, valor, categoria, responsavel: "Casal", forma: "Boleto", tipo: "fixa", inicio, diaVencimento: 10, ativo: true, obs: "", ...extra });
  rec("aluguel", "Aluguel", 1800, "Moradia", { diaVencimento: 5 });
  rec("luz", "Conta de luz", 230.4, "Moradia");
  rec("agua", "Água", 98.7, "Moradia");
  rec("internet", "Internet", 119.9, "Assinaturas", { forma: "Crédito" });
  rec("escola", "Escola", 890, "Educação", { diaVencimento: 8 });
  rec("plano", "Plano de saúde", 640, "Saúde");
  rec("mercado", "Supermercado", 1400, "Alimentação", { forma: "Débito", diaVencimento: 20 });
  rec("cartao", "Fatura do cartão", 950, "Cartão de Crédito", { forma: "Boleto", diaVencimento: 15 });
  rec("sofa", "Sofá novo", 320, "Móveis / Casa", { tipo: "parcelada", numParcelas: 10, forma: "Crédito" });
  rec("academia", "Academia", 110, "Saúde", { responsavel: "Ana", forma: "Pix" });

  const g = gerarLancamentos(d, inicio, somarMeses(atual, 6), 0);
  Object.assign(d.despesas, g.despesas);
  Object.assign(d.receitas, g.receitas);
  const h = hoje();
  for (const x of Object.values(d.despesas)) {
    if (x.mes < atual || (x.mes === atual && x.vencimento <= h && x.recId !== "cartao")) {
      x.status = PAGO;
      x.pagoEm = x.vencimento;
    }
  }
  for (const x of Object.values(d.receitas)) {
    if (x.mes <= atual) {
      x.status = PAGO;
      x.recebidoEm = x.data;
    }
  }
  // uma conta esquecida do mês passado, para mostrar o alerta de atrasadas
  const ant = somarMeses(atual, -1);
  d.despesas.ipva = {
    id: "ipva", mes: ant, vencimento: `${ant}-25`, descricao: "IPVA (3/3)", categoria: "Transporte", responsavel: "Bruno",
    valor: 412.35, status: "pendente", pagoEm: "", forma: "Boleto", obs: "", recId: null, parcela: null, criadoEm: 0,
  };
  d.despesas.cinema = {
    id: "cinema", mes: atual, vencimento: h, descricao: "Cinema e pizza", categoria: "Lazer", responsavel: "Casal",
    valor: 186, status: PAGO, pagoEm: h, forma: "Crédito", obs: "", recId: null, parcela: null, criadoEm: 0,
  };
  return d;
}
