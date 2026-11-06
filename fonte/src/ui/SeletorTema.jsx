import { useEffect, useRef, useState } from "react";
import { Monitor, Moon, Sun, Check } from "lucide-react";
import { useApp } from "../contexto.jsx";
import { BotaoIcone, cx } from "./base.jsx";

export const OPCOES_TEMA = [
  ["claro", "Claro", Sun],
  ["escuro", "Escuro", Moon],
  ["sistema", "Automático", Monitor],
];

/** Botão do topo: abre um menu com Claro / Escuro / Automático. */
export function MenuTema() {
  const { preferenciaTema, definirTema, tema } = useApp();
  const [aberto, setAberto] = useState(false);
  const ref = useRef();
  useEffect(() => {
    if (!aberto) return;
    const fora = (e) => !ref.current?.contains(e.target) && setAberto(false);
    const esc = (e) => e.key === "Escape" && setAberto(false);
    document.addEventListener("mousedown", fora);
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("mousedown", fora);
      document.removeEventListener("keydown", esc);
    };
  }, [aberto]);
  const Icone = preferenciaTema === "sistema" ? Monitor : tema === "escuro" ? Moon : Sun;

  return (
    <div ref={ref} className="relative">
      <BotaoIcone titulo="Tema" aria-haspopup="menu" aria-expanded={aberto} onClick={() => setAberto((v) => !v)}>
        <Icone size={18} />
      </BotaoIcone>
      {aberto && (
        <div role="menu" className="animar-subir absolute right-0 top-11 z-50 w-44 rounded-xl border border-slate-200 bg-white p-1 shadow-xl dark:border-slate-700 dark:bg-slate-900">
          <div className="px-2.5 pb-1 pt-1.5 text-[11px] font-medium uppercase tracking-wide text-slate-400">Tema</div>
          {OPCOES_TEMA.map(([v, r, I]) => (
            <button
              key={v}
              role="menuitemradio"
              aria-checked={preferenciaTema === v}
              onClick={() => {
                definirTema(v);
                setAberto(false);
              }}
              className={cx(
                "flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-sm",
                preferenciaTema === v ? "bg-slate-100 font-medium dark:bg-slate-800" : "hover:bg-slate-50 dark:hover:bg-slate-800/60",
              )}
            >
              <I size={16} className="text-slate-500" />
              <span className="flex-1">{r}</span>
              {preferenciaTema === v && <Check size={15} className="text-emerald-600" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/** Versão em abas para a tela de Configurações. */
export function AbasTema() {
  const { preferenciaTema, definirTema } = useApp();
  return (
    <div className="grid grid-cols-3 gap-2">
      {OPCOES_TEMA.map(([v, r, I]) => (
        <button
          key={v}
          onClick={() => definirTema(v)}
          aria-pressed={preferenciaTema === v}
          className={cx(
            "flex flex-col items-center gap-1.5 rounded-xl border px-3 py-3 text-sm font-medium transition",
            preferenciaTema === v
              ? "border-slate-900 bg-slate-900/[0.03] text-slate-900 ring-2 ring-slate-900/10 dark:border-white dark:bg-white/[0.06] dark:text-white dark:ring-white/10"
              : "border-slate-200 text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800",
          )}
        >
          <I size={19} />
          {r}
        </button>
      ))}
    </div>
  );
}
