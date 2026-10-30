// Duas implementações com a mesma interface:
//  - Firestore (uso real): um documento por família, cada lançamento é um campo
//    próprio (v2.despesas.<id>). Cada alteração grava só o item mexido, então
//    edições feitas ao mesmo tempo em dois celulares não se sobrescrevem.
//  - Local (modo demonstração, ?demo na URL): guarda no navegador.
//
// Interface:
//   assinar(aoMudar, aoErro) → cancelar
//     aoMudar({ dados, pendente, doCache })
//   gravar(mudancas) → Promise   mudancas = { "despesas.ID": item | null, "config": {...} }
//   substituirTudo(dados) → Promise

import { doc, onSnapshot, runTransaction, updateDoc, deleteField } from "firebase/firestore";
import { completar, dadosVazios } from "../lib/modelo.js";
import { migrarDoAntigo } from "../lib/migrar.js";

export function criarArmazenamentoFirestore(db, uid) {
  const ref = doc(db, "households", uid);

  async function prepararDocumento() {
    // Executa uma única vez por conta: converte o `state` do app antigo
    // (que fica guardado como cópia) ou cria um documento vazio.
    await runTransaction(db, async (tx) => {
      const snap = await tx.get(ref);
      if (snap.exists() && snap.data().v2) return;
      const antigo = snap.exists() ? snap.data().state : null;
      const v2 = antigo ? migrarDoAntigo(antigo) : dadosVazios();
      const extra = { v2, migradoEm: Date.now() };
      if (snap.exists()) tx.update(ref, extra);
      else tx.set(ref, extra);
    });
  }

  return {
    assinar(aoMudar, aoErro) {
      let preparando = false;
      return onSnapshot(
        ref,
        { includeMetadataChanges: true },
        (snap) => {
          const v2 = snap.exists() ? snap.data().v2 : null;
          if (!v2) {
            if (snap.metadata.fromCache && !navigator.onLine) {
              aoErro(new Error("offline-primeiro-acesso"));
              return;
            }
            if (!preparando) {
              preparando = true;
              prepararDocumento()
                .catch(aoErro)
                .finally(() => (preparando = false));
            }
            return;
          }
          aoMudar({ dados: completar(v2), pendente: snap.metadata.hasPendingWrites, doCache: snap.metadata.fromCache });
        },
        aoErro,
      );
    },
    gravar(mudancas) {
      const campos = {};
      for (const [caminho, valor] of Object.entries(mudancas)) campos["v2." + caminho] = valor === null ? deleteField() : valor;
      campos.atualizadoEm = Date.now();
      return updateDoc(ref, campos);
    },
    substituirTudo(dados) {
      return updateDoc(ref, { v2: dados, atualizadoEm: Date.now() });
    },
  };
}

const CHAVE_DEMO = "casa-cofre-demo-v2";

export function criarArmazenamentoLocal(dadosIniciais) {
  let dados;
  try {
    dados = JSON.parse(localStorage.getItem(CHAVE_DEMO) || "null");
  } catch {
    dados = null;
  }
  dados = completar(dados || dadosIniciais());
  const ouvintes = new Set();
  const salvar = () => {
    try {
      localStorage.setItem(CHAVE_DEMO, JSON.stringify(dados));
    } catch {}
    ouvintes.forEach((f) => f({ dados, pendente: false, doCache: false }));
  };

  return {
    assinar(aoMudar) {
      ouvintes.add(aoMudar);
      queueMicrotask(() => aoMudar({ dados, pendente: false, doCache: false }));
      return () => ouvintes.delete(aoMudar);
    },
    async gravar(mudancas) {
      const novo = structuredClone(dados);
      for (const [caminho, valor] of Object.entries(mudancas)) {
        const partes = caminho.split(".");
        let alvo = novo;
        for (const p of partes.slice(0, -1)) alvo = alvo[p] ??= {};
        const ultima = partes[partes.length - 1];
        if (valor === null) delete alvo[ultima];
        else alvo[ultima] = valor;
      }
      dados = novo;
      salvar();
    },
    async substituirTudo(novos) {
      dados = completar(structuredClone(novos));
      salvar();
    },
  };
}
