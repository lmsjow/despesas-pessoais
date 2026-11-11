import { describe, it, expect } from "vitest";
import { pagar, salvarRecorrente } from "./acoes.js";
import { hoje } from "../lib/datas.js";

const conta = (id, valor) => ({ id, descricao: id, valor, status: "pendente", pagoEm: "" });

describe("pagar", () => {
  it("usa hoje por padrão", () => {
    const m = pagar("despesas", [conta("a", 10)]);
    expect(m["despesas.a"]).toMatchObject({ status: "pago", pagoEm: hoje(), valor: 10 });
  });

  it("aceita outra data e corrige o valor pago", () => {
    const m = pagar("despesas", [conta("luz", 230.4)], "2026-10-12", { luz: 241.17 });
    expect(m["despesas.luz"]).toMatchObject({ pagoEm: "2026-10-12", valor: 241.17 });
  });

  it("paga várias de uma vez com a mesma data", () => {
    const m = pagar("receitas", [conta("x", 1), conta("y", 2)], "2026-10-05");
    expect(Object.values(m).map((i) => [i.status, i.recebidoEm])).toEqual([
      ["pago", "2026-10-05"],
      ["pago", "2026-10-05"],
    ]);
  });
});

describe("salvarRecorrente", () => {
  const vazio = () => ({ despesas: {}, receitas: {}, recorrentes: {}, config: { rendaFixa: [] } });

  it("parcelada nova já cria todas as parcelas nos meses certos", () => {
    const m = salvarRecorrente(vazio(), { descricao: "Relojoaria", valor: 138, tipo: "parcelada", numParcelas: 4, inicio: "2026-11", diaVencimento: 10 }, false);
    const parcelas = Object.values(m).filter((x) => x?.recId).sort((a, b) => a.mes.localeCompare(b.mes));
    expect(parcelas.map((p) => [p.mes, p.descricao, p.vencimento])).toEqual([
      ["2026-11", "Relojoaria (1/4)", "2026-11-10"],
      ["2026-12", "Relojoaria (2/4)", "2026-12-10"],
      ["2027-01", "Relojoaria (3/4)", "2027-01-10"],
      ["2027-02", "Relojoaria (4/4)", "2027-02-10"],
    ]);
  });

  it("não duplica parcelas que já existem ao editar", () => {
    const d = vazio();
    const m1 = salvarRecorrente(d, { descricao: "TV", valor: 100, tipo: "parcelada", numParcelas: 2, inicio: "2099-01", diaVencimento: 5 }, false);
    for (const [k, v] of Object.entries(m1)) d[k.split(".")[0]][k.split(".")[1]] = v;
    const rec = Object.values(d.recorrentes)[0];
    const m2 = salvarRecorrente(d, rec, false);
    expect(Object.keys(m2).filter((k) => k.startsWith("despesas."))).toEqual([]);
  });
});
