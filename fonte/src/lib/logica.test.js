import { describe, it, expect } from "vitest";
import { lerValor, somar } from "./dinheiro.js";
import { hoje, somarMeses, dataNoMes, mesAntigoParaNovo } from "./datas.js";
import { calcular, PAGO, PENDENTE } from "./calculos.js";
import { gerarLancamentos } from "./gerar.js";
import { migrarDoAntigo, lerBackup } from "./migrar.js";
import { dadosVazios } from "./modelo.js";
import { sugerirCategoria } from "./categorias.js";

const AGORA = new Date(2026, 9, 30, 22, 30); // 30/10/2026 22:30 (hora local)

const base = (despesas = [], receitas = [], extra = {}) => {
  const d = dadosVazios();
  d.config.saldoInicial = 1000;
  despesas.forEach((x, i) => (d.despesas["d" + i] = { id: "d" + i, ...x }));
  receitas.forEach((x, i) => (d.receitas["r" + i] = { id: "r" + i, ...x }));
  return { ...d, ...extra };
};
const mes = (r, m) => r.meses.find((x) => x.mes === m);

describe("lerValor", () => {
  it.each([
    ["1.500", 1500],
    ["1.500,90", 1500.9],
    ["150,5", 150.5],
    ["R$ 2.345.678,00", 2345678],
    ["1500.75", 1500.75],
    ["  89 ", 89],
    ["-20,00", -20],
  ])("%s → %s", (e, s) => expect(lerValor(e)).toBe(s));
  it.each(["", "abc", "1,2,3", "12a"])("rejeita %s", (e) => expect(lerValor(e)).toBeNaN());
});

describe("somas em centavos", () => {
  it("10 × 0,10 = 1,00 exato", () => expect(somar(Array(10).fill({ valor: 0.1 }))).toBe(1));
});

describe("datas", () => {
  it("usa o dia local, não UTC (22h30 continua sendo dia 30)", () => expect(hoje(AGORA)).toBe("2026-10-30"));
  it("soma meses virando o ano", () => expect(somarMeses("2026-11", 3)).toBe("2027-02"));
  it("dia 31 em fevereiro vira 28", () => expect(dataNoMes("2027-02", 31)).toBe("2027-02-28"));
  it("converte formato antigo", () => expect(mesAntigoParaNovo("Out/26")).toBe("2026-10"));
});

describe("calcular", () => {
  it("conta de novembro paga adiantada não é descontada duas vezes", () => {
    const r = calcular(base([{ mes: "2026-11", valor: 300, status: PAGO }]), AGORA);
    expect(r.saldoAtual).toBe(700);
    expect(mes(r, "2026-10").saldoFim).toBe(700);
    expect(mes(r, "2026-11").saldoFim).toBe(700);
  });

  it("conta atrasada entra na projeção do mês atual", () => {
    const r = calcular(base([{ mes: "2026-09", valor: 400, status: PENDENTE }]), AGORA);
    expect(r.saldoAtual).toBe(1000);
    expect(r.atrasadas.totalDespesas).toBe(400);
    expect(mes(r, "2026-10").saldoFim).toBe(600);
  });

  it("projeção futura soma só o que está em aberto", () => {
    const r = calcular(
      base(
        [
          { mes: "2026-10", valor: 200, status: PAGO },
          { mes: "2026-10", valor: 100, status: PENDENTE },
          { mes: "2026-12", valor: 500, status: PENDENTE },
        ],
        [{ mes: "2026-11", valor: 1000, status: PENDENTE }],
      ),
      AGORA,
    );
    expect(r.saldoAtual).toBe(800);
    expect(mes(r, "2026-10").saldoFim).toBe(700);
    expect(mes(r, "2026-11").saldoFim).toBe(1700);
    expect(mes(r, "2026-12").saldoFim).toBe(1200);
    expect(r.saldoFinalPlano).toBe(1200);
  });

  it("ajustes de saldo mudam o saldo atual", () => {
    const d = base();
    d.ajustes.a = { id: "a", mes: "2026-10", data: "2026-10-01", valor: -50.25 };
    expect(calcular(d, AGORA).saldoAtual).toBe(949.75);
  });

  it("comprometimento e situação", () => {
    const r = calcular(base([{ mes: "2026-10", valor: 850, status: PENDENTE }], [{ mes: "2026-10", valor: 1000, status: PENDENTE }]), AGORA);
    expect(r.mesAtual.comprometido).toBeCloseTo(0.85);
    expect(r.mesAtual.situacao).toBe("Risco");
  });
});

describe("gerarLancamentos", () => {
  const dados = () => {
    const d = dadosVazios();
    d.recorrentes.luz = { id: "luz", descricao: "Luz", valor: 200, tipo: "fixa", inicio: "2026-10", diaVencimento: 31, ativo: true };
    d.recorrentes.tv = { id: "tv", descricao: "TV", valor: 100, tipo: "parcelada", numParcelas: 2, inicio: "2026-10", ativo: true };
    d.config.rendaFixa = [{ id: "s1", responsavel: "Ana", valor: 3000 }];
    return d;
  };

  it("gera fixas, parcelas e salários com ids estáveis", () => {
    const g = gerarLancamentos(dados(), "2026-10", "2026-12");
    const desp = Object.values(g.despesas);
    expect(desp.filter((x) => x.recId === "luz")).toHaveLength(3);
    expect(desp.filter((x) => x.recId === "tv").map((x) => x.descricao)).toEqual(["TV (1/2)", "TV (2/2)"]);
    expect(g.despesas["r_luz_2026-11"].vencimento).toBe("2026-11-30");
    expect(Object.keys(g.receitas)).toEqual(["s_s1_2026-10", "s_s1_2026-11", "s_s1_2026-12"]);
  });

  it("não duplica o que já existe", () => {
    const d = dados();
    Object.assign(d.despesas, gerarLancamentos(d, "2026-10", "2026-11").despesas);
    d.despesas.x = { id: "x", descricao: "Luz", mes: "2026-12", valor: 210 }; // lançada à mão
    const g = gerarLancamentos(d, "2026-10", "2026-12");
    expect(Object.keys(g.despesas)).toEqual([]);
  });
});

describe("migração do app antigo", () => {
  const antigo = {
    config: { saldoInicial: 100, rendaFixa: [{ responsavel: "Ana", valor: 3000 }], categoriasDespesa: ["Moradia", "Ajustes", "Outros"] },
    receitas: [
      { id: "r1", mesAno: "Out/26", categoria: "Salário", descricao: "Salário Ana", valor: 3000, status: "Pago", data: "2026-10-05" },
      { id: "r2", mesAno: "Jul/26", categoria: "Saldo Inicial", descricao: "Saldo", valor: 100, status: "Pago" },
    ],
    despesas: [
      { id: "d1", mesAno: "Out/26", descricao: "Móveis (2/10)", valor: 570, status: "Pendente", data: "2026-10-05" },
      { id: "d2", mesAno: "Ago/26", descricao: "Ajuste de Saldo", categoria: "Ajustes", forma: "Ajuste", valor: 1032.71, status: "Pago" },
      { id: "d3", mesAno: "Set/26", descricao: "Ajuste pendente", categoria: "Ajustes", valor: 50, status: "Pendente" },
    ],
    recorrentes: [{ id: "m1", descricao: "Móveis", valor: 570, tipo: "Parcelada", numParcelas: 10, primeiraParcela: "Set/26" }],
    ajustes: [{ id: "a1", mesAno: "Out/26", data: "2026-10-01", valor: 10 }],
  };

  it("converte sem perder lançamentos e preserva o saldo", () => {
    const n = migrarDoAntigo(antigo);
    expect(n.config.categoriasDespesa).not.toContain("Ajustes");
    expect(Object.keys(n.receitas)).toEqual(["r1"]);
    expect(n.despesas.d1).toMatchObject({ mes: "2026-10", status: PENDENTE, recId: "m1", parcela: 2 });
    expect(n.despesas.d3).toMatchObject({ categoria: "Outros", valor: 50 }); // não é mais apagada
    expect(n.ajustes.d2.valor).toBe(-1032.71);
    expect(n.config.rendaFixa[0].id).toBeTruthy();
    expect(n.receitas.r1.rendaId).toBe(n.config.rendaFixa[0].id);
    // 100 + 3000 − 1032,71 + 10
    expect(calcular(n, AGORA).saldoAtual).toBe(2077.29);
  });

  it("lerBackup aceita formato antigo e recusa lixo", () => {
    expect(lerBackup(JSON.stringify(antigo)).versao).toBe(2);
    expect(() => lerBackup("{}")).toThrow();
    expect(() => lerBackup("não é json")).toThrow();
  });
});

describe("sugerirCategoria", () => {
  it("não confunde gasolina com gás", () => expect(sugerirCategoria("Gasolina posto")).toBe("Transporte"));
  it("reconhece conta de luz", () => expect(sugerirCategoria("Conta de luz")).toBe("Moradia"));
  it("não marca 'estimativa' como TIM", () => expect(sugerirCategoria("estimativa")).toBe(null));
});
