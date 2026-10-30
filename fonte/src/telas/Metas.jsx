import { ShieldCheck, PiggyBank, Lightbulb } from "lucide-react";
import { useApp } from "../contexto.jsx";
import { brl, pct } from "../lib/dinheiro.js";
import { nomeMes } from "../lib/datas.js";
import { Botao, Cartao, cx } from "../ui/base.jsx";

function Anel({ valor, cor }) {
  const r = 52;
  const c = 2 * Math.PI * r;
  const p = Math.max(0, Math.min(1, valor));
  return (
    <svg viewBox="0 0 120 120" className="h-32 w-32 -rotate-90">
      <circle cx="60" cy="60" r={r} fill="none" strokeWidth="11" className="stroke-slate-100 dark:stroke-slate-800" />
      <circle cx="60" cy="60" r={r} fill="none" strokeWidth="11" strokeLinecap="round" stroke={cor} strokeDasharray={`${c * p} ${c}`} className="transition-all duration-700" />
    </svg>
  );
}

export default function Metas() {
  const { calc, dados, irPara } = useApp();
  const cfg = dados.config;
  const metaReserva = calc.despMedia * cfg.metaReservaMeses;
  const progReserva = metaReserva > 0 ? Math.max(0, calc.saldoAtual) / metaReserva : 0;
  const falta = Math.max(0, metaReserva - calc.saldoAtual);
  const m = calc.mesAtual;
  const metaPoupanca = m.recPrev * cfg.metaPoupancaPct;
  const progPoupanca = metaPoupanca > 0 ? Math.max(0, m.resultado) / metaPoupanca : 0;
  const mesesParaReserva = falta > 0 && m.resultado > 0 ? Math.ceil(falta / m.resultado) : null;

  return (
    <div className="space-y-4">
      <div className="grid gap-4 lg:grid-cols-2">
        <Cartao className="p-5">
          <div className="mb-4 flex items-center gap-2 font-semibold">
            <span className="rounded-xl bg-sky-50 p-2 text-sky-600 dark:bg-sky-500/10 dark:text-sky-300">
              <ShieldCheck size={18} />
            </span>
            Reserva de emergência
          </div>
          <div className="flex items-center gap-5">
            <div className="relative shrink-0">
              <Anel valor={progReserva} cor="#0ea5e9" />
              <div className="absolute inset-0 flex items-center justify-center text-xl font-bold">{pct(Math.min(progReserva, 9.99))}</div>
            </div>
            <div className="space-y-1 text-sm">
              <div className="text-slate-500">
                Meta: <b className="num text-slate-800 dark:text-slate-100">{brl(metaReserva)}</b>
              </div>
              <div className="text-xs text-slate-500">
                {cfg.metaReservaMeses} meses × gasto médio de {brl(calc.despMedia)}
              </div>
              <div className="text-slate-500">
                Saldo atual: <b className="num text-slate-800 dark:text-slate-100">{brl(calc.saldoAtual)}</b>
              </div>
              <div className={cx("pt-1 font-medium", falta > 0 ? "text-amber-600" : "text-emerald-600")}>{falta > 0 ? `Faltam ${brl(falta)}` : "Meta atingida! 🎉"}</div>
            </div>
          </div>
        </Cartao>

        <Cartao className="p-5">
          <div className="mb-4 flex items-center gap-2 font-semibold">
            <span className="rounded-xl bg-emerald-50 p-2 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-300">
              <PiggyBank size={18} />
            </span>
            Poupança de {nomeMes(calc.atual).split(" ")[0].toLowerCase()}
          </div>
          <div className="flex items-center gap-5">
            <div className="relative shrink-0">
              <Anel valor={progPoupanca} cor="#10b981" />
              <div className="absolute inset-0 flex items-center justify-center text-xl font-bold">{pct(Math.min(progPoupanca, 9.99))}</div>
            </div>
            <div className="space-y-1 text-sm">
              <div className="text-slate-500">
                Meta ({pct(cfg.metaPoupancaPct)} da renda): <b className="num text-slate-800 dark:text-slate-100">{brl(metaPoupanca)}</b>
              </div>
              <div className="text-slate-500">
                Sobra prevista: <b className={cx("num", m.resultado < 0 ? "text-rose-600" : "text-slate-800 dark:text-slate-100")}>{brl(m.resultado)}</b>
              </div>
              <div className={cx("pt-1 font-medium", progPoupanca >= 1 ? "text-emerald-600" : "text-amber-600")}>
                {progPoupanca >= 1 ? "Meta do mês atingida" : `Faltam ${brl(Math.max(0, metaPoupanca - Math.max(0, m.resultado)))}`}
              </div>
            </div>
          </div>
        </Cartao>
      </div>

      <Cartao className="flex items-start gap-3 p-5 text-sm leading-relaxed">
        <Lightbulb size={20} className="mt-0.5 shrink-0 text-amber-500" />
        <div className="space-y-1.5 text-slate-600 dark:text-slate-300">
          {mesesParaReserva && (
            <p>
              Mantendo a sobra deste mês ({brl(m.resultado)}), a reserva fica completa em cerca de <b>{mesesParaReserva} {mesesParaReserva === 1 ? "mês" : "meses"}</b>.
            </p>
          )}
          {m.resultado <= 0 && <p>Neste mês as despesas previstas são iguais ou maiores que as receitas — revise as contas variáveis para voltar a poupar.</p>}
          {calc.atrasadas.despesas.length > 0 && <p>Quitar as {calc.atrasadas.despesas.length} conta(s) atrasada(s) antes de poupar evita juros e multas.</p>}
          <p className="text-xs text-slate-400">
            As metas podem ser alteradas em{" "}
            <Botao variante="fantasma" tamanho="sm" className="px-1 py-0 align-baseline text-xs" onClick={() => irPara("config")}>
              Configurações
            </Botao>
            .
          </p>
        </div>
      </Cartao>
    </div>
  );
}
