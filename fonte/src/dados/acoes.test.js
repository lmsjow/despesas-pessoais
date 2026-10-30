import { describe, it, expect } from "vitest";
import { pagar } from "./acoes.js";
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
