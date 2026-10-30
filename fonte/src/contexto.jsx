import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { calcular } from "./lib/calculos.js";
import { definirOcultar } from "./lib/dinheiro.js";
import { useAvisos } from "./ui/avisos.jsx";

const Ctx = createContext(null);
export const useApp = () => useContext(Ctx);

const lerPref = (k, padrao) => {
  try {
    const v = localStorage.getItem("cc-" + k);
    return v === null ? padrao : JSON.parse(v);
  } catch {
    return padrao;
  }
};
const salvarPref = (k, v) => {
  try {
    localStorage.setItem("cc-" + k, JSON.stringify(v));
  } catch {}
};

function mensagemErro(e) {
  const c = e?.code || e?.message || "";
  if (c.includes("permission-denied")) return "Sem permissão para salvar. Confira as regras do Firestore.";
  if (c.includes("unavailable")) return "Sem conexão com o servidor. A alteração será enviada quando a internet voltar.";
  return "Não foi possível salvar a alteração. Tente de novo.";
}

/**
 * Estado compartilhado do app logado: dados sincronizados, cálculos,
 * gravação com tratamento de erro, preferências deste aparelho.
 */
export function ProvedorApp({ armazenamento, dados, sincronia, usuario, aoSair, demo, children }) {
  const avisar = useAvisos();
  // preferência: "claro" | "escuro" | "sistema" (segue o aparelho)
  const [preferenciaTema, setPreferenciaTema] = useState(() => lerPref("tema", "sistema"));
  const [sistemaEscuro, setSistemaEscuro] = useState(() => !!window.matchMedia?.("(prefers-color-scheme: dark)").matches);
  useEffect(() => {
    const mq = window.matchMedia?.("(prefers-color-scheme: dark)");
    if (!mq) return;
    const mudar = (e) => setSistemaEscuro(e.matches);
    mq.addEventListener("change", mudar);
    return () => mq.removeEventListener("change", mudar);
  }, []);
  const tema = preferenciaTema === "sistema" ? (sistemaEscuro ? "escuro" : "claro") : preferenciaTema;
  const [ocultar, setOcultar] = useState(() => lerPref("ocultar", false));
  const [tela, setTela] = useState("painel");
  const [online, setOnline] = useState(navigator.onLine);

  definirOcultar(ocultar);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", tema === "escuro");
    document.querySelector('meta[name="theme-color"]')?.setAttribute("content", tema === "escuro" ? "#020617" : "#f1f5f9");
  }, [tema]);
  useEffect(() => salvarPref("tema", preferenciaTema), [preferenciaTema]);
  useEffect(() => salvarPref("ocultar", ocultar), [ocultar]);
  useEffect(() => {
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    addEventListener("online", on);
    addEventListener("offline", off);
    return () => {
      removeEventListener("online", on);
      removeEventListener("offline", off);
    };
  }, []);

  // recalcula ao virar o dia (app aberto de um dia para o outro)
  const [dia, setDia] = useState(() => new Date().toDateString());
  useEffect(() => {
    const t = setInterval(() => setDia(new Date().toDateString()), 60_000);
    return () => clearInterval(t);
  }, []);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const calc = useMemo(() => calcular(dados), [dados, dia]);

  const gravar = useCallback(
    async (mudancas, msgOk) => {
      if (!mudancas || !Object.keys(mudancas).length) return true;
      try {
        const p = armazenamento.gravar(mudancas);
        // offline o Firestore só confirma quando a internet voltar; não esperamos para avisar
        if (msgOk) avisar(msgOk);
        await p;
        return true;
      } catch (e) {
        console.error(e);
        avisar(mensagemErro(e), { tipo: "erro" });
        return false;
      }
    },
    [armazenamento, avisar],
  );

  /** Exclui itens e oferece "Desfazer". */
  const excluirComDesfazer = useCallback(
    (mudancas, texto) => {
      const restaurar = {};
      for (const caminho of Object.keys(mudancas)) {
        const [col, id] = caminho.split(".");
        if (dados[col]?.[id]) restaurar[caminho] = dados[col][id];
      }
      gravar(mudancas);
      avisar(texto, { acao: { rotulo: "Desfazer", executar: () => gravar(restaurar, "Restaurado") } });
    },
    [dados, gravar, avisar],
  );

  const valor = {
    dados,
    calc,
    gravar,
    excluirComDesfazer,
    avisar,
    armazenamento,
    usuario,
    aoSair,
    demo,
    tela,
    irPara: (t) => {
      setTela(t);
      window.scrollTo({ top: 0 });
    },
    tema,
    preferenciaTema,
    definirTema: setPreferenciaTema,
    ocultar,
    alternarOcultar: () => setOcultar((v) => !v),
    sincronia: { ...sincronia, online },
  };
  return <Ctx.Provider value={valor}>{children}</Ctx.Provider>;
}
