import { useState } from "react";
import { AlertTriangle, ChevronDown } from "lucide-react";
import { brl } from "../lib/dinheiro.js";
import { dataCurta, dataBR, nomeMes } from "../lib/datas.js";
import { cx } from "../ui/base.jsx";

const ultimoDia = (mes) => {
  const [a, m] = mes.split("-").map(Number);
  return dataBR(`${mes}-${String(new Date(a, m, 0).getDate()).padStart(2, "0")}`).slice(0, 5);
};

function Linha({ rotulo, valor, sinal = "", cor, forte }) {
  return (
    <div className={cx("flex items-baseline justify-between gap-4 py-0.5", forte && "mt-1 border-t border-slate-200 pt-1.5 font-semibold dark:border-slate-700", cor)}>
      <span>{rotulo}</span>
      <span className="num shrink-0">
        {sinal}
        {brl(Math.abs(valor))}
      </span>
    </div>
  );
}

/**
 * Conta resumida do saldo no fim do mês, para o balão do card de saldo.
 * `aoPagar(colecao, itens)` abre a confirmação para pendências antigas.
 */
export default function CalculoSaldo({ composicao: c, mes, aoPagar }) {
  const [verItens, setVerItens] = useState(false);
  if (!c) return null;
  const corFim = c.saldoFim < 0 ? "text-rose-600 dark:text-rose-400" : "text-emerald-700 dark:text-emerald-400";

  if (c.tipo === "realizado") {
    return (
      <div className="text-[12.5px]">
        <Linha rotulo="Início do mês" valor={c.saldoInicio} sinal={c.saldoInicio < 0 ? "− " : ""} />
        <Linha rotulo="+ recebido" valor={c.recebido} sinal="+ " cor="text-sky-700 dark:text-sky-400" />
        <Linha rotulo="− pago" valor={c.pago} sinal="− " cor="text-rose-600 dark:text-rose-400" />
        {c.ajustes !== 0 && <Linha rotulo="± ajustes" valor={c.ajustes} sinal={c.ajustes > 0 ? "+ " : "− "} />}
        <Linha rotulo={`= saldo em ${ultimoDia(mes)}`} valor={c.saldoFim} sinal={c.saldoFim < 0 ? "− " : ""} cor={corFim} forte />
      </div>
    );
  }

  const ant = c.anteriores;
  const itens = [...ant.receitas.map((x) => ["receitas", x]), ...ant.despesas.map((x) => ["despesas", x])];
  const liquido = ant.aReceber - ant.aPagar;

  return (
    <div className="text-[12.5px]">
      <Linha rotulo="Hoje em conta" valor={c.saldoHoje} sinal={c.saldoHoje < 0 ? "− " : ""} />
      <Linha rotulo="+ a receber no mês" valor={c.aReceber} sinal="+ " cor="text-sky-700 dark:text-sky-400" />
      <Linha rotulo="− a pagar no mês" valor={c.aPagar} sinal="− " cor="text-rose-600 dark:text-rose-400" />
      {itens.length > 0 && (
        <button onClick={() => setVerItens((v) => !v)} className="flex w-full items-baseline justify-between gap-4 py-0.5 text-left text-amber-700 dark:text-amber-400">
          <span className="flex items-center gap-1">
            <AlertTriangle size={12} className="self-center" />± em aberto de antes
            <span className="font-semibold underline underline-offset-2">{itens.length}</span>
            <ChevronDown size={12} className={cx("self-center transition", verItens && "rotate-180")} />
          </span>
          <span className="num shrink-0">
            {liquido >= 0 ? "+ " : "− "}
            {brl(Math.abs(liquido))}
          </span>
        </button>
      )}
      {verItens && (
        <div className="my-1 max-h-44 divide-y divide-slate-100 overflow-y-auto rounded-lg border border-slate-200 dark:divide-slate-800 dark:border-slate-700">
          {itens.map(([col, x]) => (
            <div key={col + x.id} className="flex items-center gap-2 px-2 py-1">
              <div className="min-w-0 flex-1">
                <div className="truncate font-medium">{x.descricao}</div>
                <div className="num text-[11px] text-slate-400">
                  {col === "receitas" ? "receber" : "pagar"} · {nomeMes(x.mes, true)} · {dataCurta(x.vencimento || x.data)}
                </div>
              </div>
              <span className="num shrink-0">{brl(x.valor)}</span>
              <button onClick={() => aoPagar(col, [x])} className="shrink-0 rounded px-1.5 py-0.5 text-[11.5px] font-semibold text-emerald-700 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-500/10">
                {col === "receitas" ? "Recebi" : "Paguei"}
              </button>
            </div>
          ))}
        </div>
      )}
      <Linha rotulo={`= previsto em ${ultimoDia(mes)}`} valor={c.saldoFim} sinal={c.saldoFim < 0 ? "− " : ""} cor={corFim} forte />
    </div>
  );
}
