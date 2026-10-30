import { useState } from "react";
import { AlertTriangle, ChevronDown } from "lucide-react";
import { brl } from "../lib/dinheiro.js";
import { dataCurta, dataBR, nomeMes } from "../lib/datas.js";
import { cx } from "../ui/base.jsx";

const ultimoDia = (mes) => {
  const [a, m] = mes.split("-").map(Number);
  return dataBR(`${mes}-${String(new Date(a, m, 0).getDate()).padStart(2, "0")}`);
};

function Linha({ rotulo, detalhe, valor, sinal, cor, forte }) {
  return (
    <div className={cx("flex items-baseline justify-between gap-4 py-1.5", forte && "mt-1 border-t border-slate-200 pt-2.5 text-[14.5px] font-semibold dark:border-slate-700")}>
      <span className={cor}>
        {rotulo}
        {detalhe && <span className="font-normal text-slate-400"> · {detalhe}</span>}
      </span>
      <span className={cx("num shrink-0", cor)}>
        {sinal}
        {brl(Math.abs(valor))}
      </span>
    </div>
  );
}

/**
 * Detalha, linha a linha, como o saldo do fim do mês é calculado.
 * `aoPagar(colecao, itens)` abre a confirmação de pagamento para pendências antigas.
 */
export default function CalculoSaldo({ composicao: c, mes, aoPagar }) {
  const [verItens, setVerItens] = useState(false);
  if (!c) return null;

  if (c.tipo === "realizado") {
    return (
      <div className="text-[13px]">
        <div className="mb-1 font-semibold">Como o mês fechou</div>
        <Linha rotulo="Saldo no início do mês" valor={c.saldoInicio} />
        <Linha rotulo="+ Recebido" valor={c.recebido} sinal="+ " cor="text-emerald-700 dark:text-emerald-400" />
        <Linha rotulo="− Pago" valor={c.pago} sinal="− " cor="text-rose-600 dark:text-rose-400" />
        {c.ajustes !== 0 && <Linha rotulo="± Ajustes de saldo" valor={c.ajustes} sinal={c.ajustes > 0 ? "+ " : "− "} />}
        <Linha rotulo={`= Saldo em ${ultimoDia(mes)}`} valor={c.saldoFim} sinal={c.saldoFim < 0 ? "− " : ""} forte />
      </div>
    );
  }

  const ant = c.anteriores;
  const nAnt = ant.despesas.length + ant.receitas.length;
  const liquidoAnt = ant.aReceber - ant.aPagar;
  const nomeCurto = nomeMes(mes).split(" ")[0].toLowerCase();

  return (
    <div className="text-[13px]">
      <div className="mb-1 font-semibold">Como chegamos em {brl(c.saldoFim)}</div>
      <Linha rotulo="Saldo em conta hoje" valor={c.saldoHoje} sinal={c.saldoHoje < 0 ? "− " : ""} />
      <Linha rotulo={`+ A receber em ${nomeCurto}`} valor={c.aReceber} sinal="+ " cor="text-emerald-700 dark:text-emerald-400" />
      <Linha rotulo={`− A pagar em ${nomeCurto}`} valor={c.aPagar} sinal="− " cor="text-rose-600 dark:text-rose-400" />

      {nAnt > 0 && (
        <div className="-mx-4 my-1 bg-amber-50 px-4 py-1.5 dark:bg-amber-500/10">
          <button onClick={() => setVerItens((v) => !v)} className="flex w-full items-baseline justify-between gap-4 text-left text-amber-800 dark:text-amber-300">
            <span className="flex items-center gap-1.5">
              <AlertTriangle size={14} className="shrink-0 self-center" />
              Ainda em aberto de meses anteriores
              <span className="font-medium underline underline-offset-2">
                {verItens ? "ocultar" : `ver ${nAnt} ${nAnt === 1 ? "item" : "itens"}`}
              </span>
              <ChevronDown size={14} className={cx("transition", verItens && "rotate-180")} />
            </span>
            <span className="num shrink-0 font-semibold">
              {liquidoAnt >= 0 ? "+ " : "− "}
              {brl(Math.abs(liquidoAnt))}
            </span>
          </button>
          <div className="mt-0.5 pl-5 text-xs leading-relaxed text-amber-700/90 dark:text-amber-300/80">
            {ant.aReceber > 0 && <div>+ {brl(ant.aReceber)} a receber que ainda não foi marcado como recebido</div>}
            {ant.aPagar > 0 && <div>− {brl(ant.aPagar)} em contas ainda não marcadas como pagas</div>}
          </div>

          {verItens && (
            <div className="mt-2 divide-y divide-amber-200/70 rounded-lg border border-amber-200 bg-white dark:divide-amber-500/20 dark:border-amber-500/30 dark:bg-slate-900">
              {[...ant.receitas.map((x) => ["receitas", x]), ...ant.despesas.map((x) => ["despesas", x])].map(([col, x]) => (
                <div key={col + x.id} className="flex items-center gap-3 px-3 py-1.5 text-[12.5px]">
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-medium text-slate-700 dark:text-slate-200">{x.descricao}</div>
                    <div className="num text-[11px] text-slate-500">
                      <span className={cx("font-medium uppercase", col === "receitas" ? "text-emerald-600" : "text-rose-600")}>{col === "receitas" ? "a receber" : "a pagar"}</span> ·{" "}
                      {nomeMes(x.mes, true)} · {dataCurta(x.vencimento || x.data)}
                    </div>
                  </div>
                  <span className="num shrink-0 font-semibold">{brl(x.valor)}</span>
                  <button onClick={() => aoPagar(col, [x])} className="shrink-0 rounded-md px-2 py-0.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-500/10">
                    {col === "receitas" ? "Já recebi" : "Já paguei"}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <Linha rotulo={`= Saldo previsto em ${ultimoDia(mes)}`} valor={c.saldoFim} sinal={c.saldoFim < 0 ? "− " : ""} forte cor={c.saldoFim < 0 ? "text-rose-600 dark:text-rose-400" : "text-emerald-700 dark:text-emerald-400"} />
    </div>
  );
}
