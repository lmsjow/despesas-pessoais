import { describe, it, expect, vi, beforeEach } from "vitest";

// Firestore simulado em memória: um documento, com updateDoc entendendo
// caminhos "a.b.c" e deleteField(), como o Firestore real.
const APAGAR = Symbol("apagar");
let banco;
let ouvinte;
const aplicar = (alvo, caminho, valor) => {
  const partes = caminho.split(".");
  let o = alvo;
  for (const p of partes.slice(0, -1)) o = o[p] ??= {};
  if (valor === APAGAR) delete o[partes.at(-1)];
  else o[partes.at(-1)] = valor;
};
const snap = () => ({ exists: () => banco !== null, data: () => structuredClone(banco), metadata: { hasPendingWrites: false, fromCache: false } });
const notificar = () => ouvinte && ouvinte(snap());

vi.mock("firebase/firestore", () => ({
  doc: () => ({}),
  deleteField: () => APAGAR,
  onSnapshot: (_ref, _op, cb) => {
    ouvinte = cb;
    queueMicrotask(notificar);
    return () => (ouvinte = null);
  },
  updateDoc: async (_ref, campos) => {
    if (banco === null) throw new Error("not-found");
    for (const [k, v] of Object.entries(campos)) aplicar(banco, k, v);
    notificar();
  },
  runTransaction: async (_db, fn) => {
    await fn({
      get: async () => snap(),
      set: (_r, v) => (banco = structuredClone(v)),
      update: (_r, v) => Object.entries(v).forEach(([k, x]) => aplicar(banco, k, x)),
    });
    notificar();
  },
}));

const { criarArmazenamentoFirestore } = await import("./armazenamento.js");
const espera = () => new Promise((r) => setTimeout(r, 0));

const antigo = {
  config: { saldoInicial: 100, rendaFixa: [{ responsavel: "Ana", valor: 3000 }] },
  receitas: [{ id: "r1", mesAno: "Out/26", categoria: "Salário", descricao: "Salário Ana", valor: 3000, status: "Pago" }],
  despesas: [{ id: "d1", mesAno: "Out/26", descricao: "Luz", valor: 200, status: "Pendente", data: "2026-10-05" }],
  recorrentes: [],
};

beforeEach(() => {
  banco = null;
  ouvinte = null;
  globalThis.navigator ??= { onLine: true };
});

describe("armazenamento Firestore", () => {
  it("migra o `state` antigo uma única vez e mantém a cópia", async () => {
    banco = { state: structuredClone(antigo), updatedAt: 1 };
    const recebidos = [];
    const a = criarArmazenamentoFirestore({}, "uid");
    a.assinar((r) => recebidos.push(r.dados), (e) => { throw e; });
    await espera();
    await espera();
    expect(banco.state).toEqual(antigo); // backup intacto
    expect(banco.v2.despesas.d1).toMatchObject({ mes: "2026-10", valor: 200, status: "pendente" });
    expect(recebidos.at(-1).receitas.r1.valor).toBe(3000);
    const v2 = structuredClone(banco.v2);
    notificar(); // novo snapshot não migra de novo
    await espera();
    expect(banco.v2).toEqual(v2);
  });

  it("conta nova recebe documento vazio", async () => {
    const a = criarArmazenamentoFirestore({}, "uid");
    const recebidos = [];
    a.assinar((r) => recebidos.push(r.dados), (e) => { throw e; });
    await espera();
    await espera();
    expect(recebidos.at(-1).despesas).toEqual({});
    expect(recebidos.at(-1).config.categoriasDespesa.length).toBeGreaterThan(5);
  });

  it("grava só o item alterado — edições de dois aparelhos não se sobrescrevem", async () => {
    banco = { state: structuredClone(antigo) };
    const celular1 = criarArmazenamentoFirestore({}, "uid");
    const celular2 = criarArmazenamentoFirestore({}, "uid");
    celular1.assinar(() => {}, (e) => { throw e; });
    await espera();
    await espera();
    // os dois partem do mesmo estado e alteram coisas diferentes "ao mesmo tempo"
    await celular1.gravar({ "despesas.d1": { ...banco.v2.despesas.d1, status: "pago" } });
    await celular2.gravar({ "despesas.nova": { id: "nova", mes: "2026-10", valor: 50, descricao: "Pão" } });
    expect(banco.v2.despesas.d1.status).toBe("pago");
    expect(banco.v2.despesas.nova.valor).toBe(50);
    await celular2.gravar({ "despesas.nova": null });
    expect(banco.v2.despesas.nova).toBeUndefined();
    expect(banco.v2.despesas.d1.status).toBe("pago");
  });
});
