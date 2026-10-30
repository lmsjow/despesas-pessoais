import { createContext, useCallback, useContext, useRef, useState } from "react";
import { CheckCircle2, AlertTriangle, X } from "lucide-react";
import { cx } from "./base.jsx";

const Ctx = createContext(null);
export const useAvisos = () => useContext(Ctx);

/** Avisos rápidos no rodapé, com botão opcional (ex.: "Desfazer"). */
export function ProvedorAvisos({ children }) {
  const [lista, setLista] = useState([]);
  const seq = useRef(0);
  const fechar = useCallback((id) => setLista((l) => l.filter((a) => a.id !== id)), []);
  const avisar = useCallback(
    (texto, { tipo = "ok", acao, duracao } = {}) => {
      const id = ++seq.current;
      setLista((l) => [...l.slice(-2), { id, texto, tipo, acao }]);
      setTimeout(() => fechar(id), duracao ?? (acao ? 6000 : tipo === "erro" ? 7000 : 3000));
    },
    [fechar],
  );
  return (
    <Ctx.Provider value={avisar}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 bottom-20 z-[60] flex flex-col items-center gap-2 px-4 lg:bottom-6">
        {lista.map((a) => (
          <div
            key={a.id}
            role="status"
            className={cx(
              "animar-subir pointer-events-auto flex w-full max-w-md items-center gap-3 rounded-2xl px-4 py-3 text-sm shadow-xl",
              a.tipo === "erro" ? "bg-rose-600 text-white" : "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900",
            )}
          >
            {a.tipo === "erro" ? <AlertTriangle size={18} className="shrink-0" /> : <CheckCircle2 size={18} className="shrink-0 text-emerald-400 dark:text-emerald-600" />}
            <span className="flex-1">{a.texto}</span>
            {a.acao && (
              <button
                className="rounded-lg px-2 py-1 font-semibold text-emerald-300 hover:bg-white/10 dark:text-emerald-700"
                onClick={() => {
                  a.acao.executar();
                  fechar(a.id);
                }}
              >
                {a.acao.rotulo}
              </button>
            )}
            <button aria-label="Fechar aviso" className="opacity-60 hover:opacity-100" onClick={() => fechar(a.id)}>
              <X size={16} />
            </button>
          </div>
        ))}
      </div>
    </Ctx.Provider>
  );
}
