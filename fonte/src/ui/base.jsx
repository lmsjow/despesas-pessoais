import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { lerValor, paraCampo } from "../lib/dinheiro.js";
import { nomeMes, somarMeses } from "../lib/datas.js";

export const cx = (...c) => c.filter(Boolean).join(" ");

export function Cartao({ className, children, ...p }) {
  return (
    <div
      className={cx("rounded-2xl border border-slate-200/80 bg-white shadow-sm shadow-slate-900/[0.03] dark:border-slate-800 dark:bg-slate-900", className)}
      {...p}
    >
      {children}
    </div>
  );
}

export function Titulo({ children, acao, className }) {
  return (
    <div className={cx("mb-3 flex items-center justify-between gap-3", className)}>
      <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200">{children}</h3>
      {acao}
    </div>
  );
}

const VARIANTES = {
  primario: "bg-marca-600 text-white hover:bg-marca-700 shadow-sm shadow-marca-600/20",
  secundario: "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700 dark:hover:bg-slate-700",
  fantasma: "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800",
  perigo: "bg-rose-600 text-white hover:bg-rose-700",
  perigoSuave: "text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-500/10",
};

export function Botao({ variante = "primario", tamanho = "md", className, children, ...p }) {
  return (
    <button
      type="button"
      className={cx(
        "inline-flex items-center justify-center gap-2 rounded-xl font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50",
        tamanho === "sm" ? "px-3 py-1.5 text-[13px]" : "px-4 py-2.5 text-sm",
        VARIANTES[variante],
        className,
      )}
      {...p}
    >
      {children}
    </button>
  );
}

export function BotaoIcone({ titulo, className, children, ...p }) {
  return (
    <button
      type="button"
      title={titulo}
      aria-label={titulo}
      className={cx(
        "inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-800 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100",
        className,
      )}
      {...p}
    >
      {children}
    </button>
  );
}

export const classeEntrada =
  "w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-[15px] text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-marca-500 focus:ring-4 focus:ring-marca-500/15 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-100";

export function Campo({ rotulo, erro, dica, children, className }) {
  return (
    <label className={cx("flex flex-col gap-1.5", className)}>
      <span className="text-[13px] font-medium text-slate-600 dark:text-slate-300">{rotulo}</span>
      {children}
      {erro ? <span className="text-xs text-rose-600 dark:text-rose-400">{erro}</span> : dica ? <span className="text-xs text-slate-400">{dica}</span> : null}
    </label>
  );
}

export function Selecao({ opcoes, vazio, className, ...p }) {
  return (
    <select className={cx(classeEntrada, "appearance-none bg-[length:16px] bg-[right_10px_center] bg-no-repeat pr-8", className)} style={{ backgroundImage: SETA }} {...p}>
      {vazio !== undefined && <option value="">{vazio}</option>}
      {opcoes.map((o) => (typeof o === "string" ? <option key={o}>{o}</option> : <option key={o.valor} value={o.valor}>{o.rotulo}</option>))}
    </select>
  );
}
const SETA = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`;

/** Campo de valor em reais: aceita "1.500", "1.500,90", "150,5". */
export function CampoValor({ valor, aoMudar, ...p }) {
  const [texto, setTexto] = useState(() => paraCampo(valor));
  useEffect(() => {
    if (!Object.is(lerValor(texto), valor)) setTexto(paraCampo(valor));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [valor]);
  return (
    <div className="relative">
      <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">R$</span>
      <input
        inputMode="decimal"
        className={cx(classeEntrada, "num pl-10")}
        placeholder="0,00"
        value={texto}
        onChange={(e) => {
          setTexto(e.target.value);
          const v = lerValor(e.target.value);
          aoMudar(isNaN(v) ? NaN : v);
        }}
        onBlur={() => {
          const v = lerValor(texto);
          if (!isNaN(v)) setTexto(paraCampo(v));
        }}
        {...p}
      />
    </div>
  );
}

export function Modal({ titulo, aoFechar, children, rodape, largo }) {
  useEffect(() => {
    const esc = (e) => e.key === "Escape" && aoFechar();
    document.addEventListener("keydown", esc);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", esc);
      document.body.style.overflow = overflow;
    };
  }, [aoFechar]);
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/50 backdrop-blur-[2px] sm:items-center sm:p-4" onMouseDown={aoFechar}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={titulo}
        onMouseDown={(e) => e.stopPropagation()}
        className={cx(
          "animar-subir flex max-h-[92dvh] w-full flex-col rounded-t-3xl bg-white shadow-2xl sm:rounded-3xl dark:bg-slate-900",
          largo ? "sm:max-w-2xl" : "sm:max-w-md",
        )}
      >
        <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-5 py-4 dark:border-slate-800">
          <h2 className="text-base font-semibold">{titulo}</h2>
          <BotaoIcone titulo="Fechar" onClick={aoFechar}>
            <X size={18} />
          </BotaoIcone>
        </div>
        <div className="overflow-y-auto px-5 py-4">{children}</div>
        {rodape && <div className="pb-seguro flex flex-wrap justify-end gap-2 border-t border-slate-100 px-5 pt-3 dark:border-slate-800">{rodape}</div>}
      </div>
    </div>
  );
}

export function SeletorMes({ mes, aoMudar, className }) {
  return (
    <div className={cx("inline-flex items-center rounded-xl border border-slate-200 bg-white p-0.5 dark:border-slate-700 dark:bg-slate-900", className)}>
      <BotaoIcone titulo="Mês anterior" onClick={() => aoMudar(somarMeses(mes, -1))} className="h-8 w-8">
        <ChevronLeft size={17} />
      </BotaoIcone>
      <span className="min-w-36 text-center text-sm font-semibold">{nomeMes(mes)}</span>
      <BotaoIcone titulo="Próximo mês" onClick={() => aoMudar(somarMeses(mes, 1))} className="h-8 w-8">
        <ChevronRight size={17} />
      </BotaoIcone>
    </div>
  );
}

export function Abas({ abas, valor, aoMudar, className }) {
  return (
    <div className={cx("inline-flex rounded-xl bg-slate-200/60 p-1 dark:bg-slate-800", className)}>
      {abas.map(([v, r]) => (
        <button
          key={v}
          type="button"
          onClick={() => aoMudar(v)}
          className={cx(
            "rounded-lg px-3 py-1.5 text-[13px] font-medium transition",
            valor === v ? "bg-white text-slate-900 shadow-sm dark:bg-slate-700 dark:text-white" : "text-slate-500 hover:text-slate-800 dark:text-slate-400",
          )}
        >
          {r}
        </button>
      ))}
    </div>
  );
}

export function Selo({ cor = "slate", children }) {
  const cores = {
    verde: "bg-emerald-50 text-emerald-700 ring-emerald-600/15 dark:bg-emerald-500/10 dark:text-emerald-300",
    ambar: "bg-amber-50 text-amber-700 ring-amber-600/20 dark:bg-amber-500/10 dark:text-amber-300",
    vermelho: "bg-rose-50 text-rose-700 ring-rose-600/15 dark:bg-rose-500/10 dark:text-rose-300",
    azul: "bg-sky-50 text-sky-700 ring-sky-600/15 dark:bg-sky-500/10 dark:text-sky-300",
    slate: "bg-slate-100 text-slate-600 ring-slate-500/10 dark:bg-slate-800 dark:text-slate-300",
  };
  return <span className={cx("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11.5px] font-medium ring-1 ring-inset", cores[cor])}>{children}</span>;
}

export const corSituacao = (s) => ({ Saudável: "verde", Atenção: "ambar", Risco: "vermelho" })[s] || "slate";

export function Vazio({ icone, titulo, texto, acao }) {
  return (
    <div className="flex flex-col items-center px-6 py-12 text-center">
      {icone && <div className="mb-3 rounded-2xl bg-slate-100 p-3 text-slate-400 dark:bg-slate-800">{icone}</div>}
      <p className="font-medium text-slate-700 dark:text-slate-200">{titulo}</p>
      {texto && <p className="mt-1 max-w-sm text-sm text-slate-500">{texto}</p>}
      {acao && <div className="mt-4">{acao}</div>}
    </div>
  );
}

export function Confirmar({ titulo, texto, rotulo = "Confirmar", perigo, aoConfirmar, aoFechar, children }) {
  return (
    <Modal
      titulo={titulo}
      aoFechar={aoFechar}
      rodape={
        <>
          <Botao variante="secundario" onClick={aoFechar}>
            Cancelar
          </Botao>
          <Botao
            variante={perigo ? "perigo" : "primario"}
            onClick={() => {
              aoConfirmar();
              aoFechar();
            }}
          >
            {rotulo}
          </Botao>
        </>
      }
    >
      {texto && <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300">{texto}</p>}
      {children}
    </Modal>
  );
}

export function Interruptor({ marcado, aoMudar, rotulo, descricao }) {
  return (
    <label className="flex cursor-pointer items-start gap-3">
      <span className="relative mt-0.5 inline-flex shrink-0">
        <input type="checkbox" className="peer sr-only" checked={marcado} onChange={(e) => aoMudar(e.target.checked)} />
        <span className="h-5 w-9 rounded-full bg-slate-300 transition peer-checked:bg-marca-600 dark:bg-slate-600" />
        <span className="absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-white shadow transition peer-checked:translate-x-4" />
      </span>
      <span>
        <span className="block text-sm font-medium">{rotulo}</span>
        {descricao && <span className="block text-xs text-slate-500">{descricao}</span>}
      </span>
    </label>
  );
}
