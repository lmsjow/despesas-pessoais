import { useMemo, useState } from "react";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis, Legend, ReferenceLine } from "recharts";
import { AlertTriangle, ArrowDownLeft, ArrowUpRight, Check, ChevronRight, Scale, Wallet, Gauge, SlidersHorizontal, TrendingUp } from "lucide-react";
import { useApp } from "../contexto.jsx";
import { brl, pct } from "../lib/dinheiro.js";
import { dataBR, dataCurta, hoje, nomeMes, somarMeses } from "../lib/datas.js";
import { PAGO } from "../lib/calculos.js";
import { Cartao, Selo, Titulo, corSituacao, cx } from "../ui/base.jsx";
import { DicaGrafico, eixo, formatoEixo, useCoresGrafico } from "../ui/graficos.jsx";
import ModalAjuste from "./ModalAjuste.jsx";
import ModalPagamento from "./ModalPagamento.jsx";

export default function Painel() {
  const { calc, dados, irPara } = useApp();
  const cores = useCoresGrafico();
  const [ajustar, setAjustar] = useState(false);
  const [pagando, setPagando] = useState(null);
  const m = calc.mesAtual;
  const cfg = dados.config;
  const at = calc.atrasadas;

  const janela = useMemo(() => {
    const de = somarMeses(calc.atual, -5);
    const ate = somarMeses(calc.atual, 6);
    return calc.meses.filter((x) => x.mes >= de && x.mes <= ate);
  }, [calc]);
  const barras = janela.filter((x) => x.mes <= somarMeses(calc.atual, 2)).map((x) => ({ nome: nomeMes(x.mes, true), Receitas: x.recPrev, Despesas: x.despPrev }));
  const linha = janela.map((x) => ({
    nome: nomeMes(x.mes, true),
    Realizado: x.mes <= calc.atual ? x.realizado : null,
    Projetado: x.mes >= calc.atual ? x.saldoFim : null,
  }));

  const h = hoje();
  const proximas = useMemo(
    () =>
      Object.values(dados.despesas)
        .filter((d) => d.status !== PAGO && d.mes === calc.atual)
        .sort((a, b) => (a.vencimento || "").localeCompare(b.vencimento || ""))
        .slice(0, 6),
    [dados.despesas, calc.atual],
  );

  const porCategoria = useMemo(() => {
    const mapa = {};
    for (const d of m?.despesas || []) mapa[d.categoria || "Outros"] = (mapa[d.categoria || "Outros"] || 0) + d.valor;
    return Object.entries(mapa)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
  }, [m]);
  const maiorCat = porCategoria[0]?.[1] || 1;

  const corComp = m.comprometido >= cfg.limiteRisco ? "bg-rose-500" : m.comprometido >= cfg.limiteAtencao ? "bg-amber-500" : "bg-emerald-500";

  return (
    <div className="space-y-5">
      {/* Saldo */}
      <div className="relative overflow-hidden rounded-[22px] bg-slate-950 p-5 text-white shadow-[0_20px_40px_-20px_rgba(0,0,0,.45)] ring-1 ring-white/[0.08] sm:p-7">
        {/* brilho e grade sutis */}
        <div className="pointer-events-none absolute -right-24 -top-32 h-80 w-80 rounded-full bg-emerald-500/25 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-40 left-1/4 h-72 w-72 rounded-full bg-teal-400/10 blur-3xl" />
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.07]"
          style={{ backgroundImage: "linear-gradient(rgba(255,255,255,.6) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.6) 1px,transparent 1px)", backgroundSize: "32px 32px", maskImage: "radial-gradient(ellipse at 80% 0%,#000 10%,transparent 70%)" }}
        />
        <div className="relative">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-[13px] font-medium text-white/60">
              <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-white/10 ring-1 ring-white/10">
                <Wallet size={13} />
              </span>
              Saldo em conta
            </div>
            <button
              onClick={() => setAjustar(true)}
              className="flex h-8 items-center gap-1.5 rounded-[10px] bg-white/[0.08] px-3 text-[12.5px] font-medium text-white/90 ring-1 ring-inset ring-white/10 backdrop-blur transition hover:bg-white/[0.14]"
            >
              <SlidersHorizontal size={14} /> Ajustar saldo
            </button>
          </div>
          <div className="num mt-3 text-[40px] font-semibold leading-none tracking-[-0.035em] sm:text-[52px]">{brl(calc.saldoAtual)}</div>
          <div className="mt-3 flex flex-wrap items-center gap-2 text-[12.5px]">
            <span className={cx("inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 ring-1 ring-inset", m.saldoFim < 0 ? "bg-rose-500/15 text-rose-200 ring-rose-400/30" : "bg-emerald-400/10 text-emerald-200 ring-emerald-300/20")}>
              <TrendingUp size={13} /> Fim de {nomeMes(calc.atual).split(" ")[0].toLowerCase()}: <b className="num font-semibold text-white">{brl(m.saldoFim)}</b>
            </span>
            {calc.ultimoAjuste && <span className="text-white/45">conferido com o banco em {dataBR(calc.ultimoAjuste.data)}</span>}
          </div>
          <div className="mt-6 grid grid-cols-2 gap-px overflow-hidden rounded-2xl bg-white/[0.08] ring-1 ring-white/[0.08]">
            <Pilula rotulo="A receber" valor={m.aReceber + at.totalReceitas} icone={<ArrowDownLeft size={14} />} cor="text-emerald-300" />
            <Pilula rotulo="A pagar" valor={m.aPagar + at.totalDespesas} icone={<ArrowUpRight size={14} />} cor="text-rose-300" />
          </div>
        </div>
      </div>

      {at.despesas.length > 0 && (
        <button
          onClick={() => irPara("despesas")}
          className="flex w-full items-center gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-left text-sm text-amber-900 hover:bg-amber-100/70 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200"
        >
          <AlertTriangle size={19} className="shrink-0 text-amber-600" />
          <span className="flex-1">
            <b>{at.despesas.length} conta(s) atrasada(s)</b> de meses anteriores somando <b className="num">{brl(at.totalDespesas)}</b>. Elas já estão descontadas da previsão.
          </span>
          <ChevronRight size={18} />
        </button>
      )}
      {m.saldoFim < 0 && (
        <div className="flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-900 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-200">
          <AlertTriangle size={19} className="mt-0.5 shrink-0 text-rose-600" />
          <span>
            Pagando tudo o que está em aberto, a conta fica <b>negativa em {brl(-m.saldoFim)}</b> no fim do mês. Considere adiar despesas variáveis.
          </span>
        </div>
      )}

      {/* Indicadores do mês */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Indicador rotulo="Receitas do mês" valor={brl(m.recPrev)} sub={`${brl(m.recReceb)} recebido`} icone={<ArrowDownLeft size={15} />} cor="emerald" />
        <Indicador rotulo="Despesas do mês" valor={brl(m.despPrev)} sub={`${brl(m.aPagar)} a pagar`} icone={<ArrowUpRight size={15} />} cor="rose" />
        <Indicador
          rotulo="Resultado do mês"
          valor={brl(m.resultado)}
          sub="receitas − despesas"
          icone={<Scale size={15} />}
          cor={m.resultado >= 0 ? "emerald" : "rose"}
          destaque={m.resultado >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}
        />
        <Cartao className="p-4">
          <div className="flex items-center gap-1.5 text-[12.5px] font-medium text-slate-500">
            <Gauge size={15} className="text-indigo-500" />
            Renda comprometida
          </div>
          <div className="mt-2 flex items-center gap-2">
            <span className="num text-[22px] font-semibold">{isFinite(m.comprometido) ? pct(m.comprometido) : "—"}</span>
            <Selo cor={corSituacao(m.situacao)}>{m.situacao}</Selo>
          </div>
          <div className="relative mt-3 h-1.5 overflow-hidden rounded-full bg-slate-900/[0.06] dark:bg-white/[0.08]">
            <div className={cx("h-full rounded-full transition-all", corComp)} style={{ width: `${Math.min(100, (isFinite(m.comprometido) ? m.comprometido : 1) * 100)}%` }} />
            <div className="absolute inset-y-0 w-0.5 bg-amber-500/70" style={{ left: `${cfg.limiteAtencao * 100}%` }} />
            <div className="absolute inset-y-0 w-0.5 bg-rose-500/70" style={{ left: `${cfg.limiteRisco * 100}%` }} />
          </div>
        </Cartao>
      </div>

      {/* Gráficos */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Cartao className="p-4 sm:p-5">
          <Titulo>Receitas × despesas</Titulo>
          <div className="h-60">
            <ResponsiveContainer>
              <BarChart data={barras} margin={{ left: -8, right: 4, top: 4 }} barGap={3}>
                <CartesianGrid vertical={false} stroke={cores.grade} />
                <XAxis dataKey="nome" {...eixo(cores)} />
                <YAxis {...eixo(cores)} tickFormatter={formatoEixo} width={48} />
                <Tooltip content={<DicaGrafico />} cursor={{ fill: cores.cursor }} />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
                <Bar isAnimationActive={false} dataKey="Receitas" fill={cores.receita} radius={[5, 5, 0, 0]} maxBarSize={18} />
                <Bar isAnimationActive={false} dataKey="Despesas" fill={cores.despesa} radius={[5, 5, 0, 0]} maxBarSize={18} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Cartao>
        <Cartao className="p-4 sm:p-5">
          <Titulo acao={<button onClick={() => irPara("projecao")} className="text-xs font-medium text-emerald-600 hover:underline dark:text-emerald-400">Ver projeção</button>}>
            Evolução do saldo
          </Titulo>
          <div className="h-60">
            <ResponsiveContainer>
              <AreaChart data={linha} margin={{ left: -8, right: 4, top: 4 }}>
                <defs>
                  <linearGradient id="gp" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0" stopColor={cores.projetado} stopOpacity={0.25} />
                    <stop offset="1" stopColor={cores.projetado} stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gr" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0" stopColor={cores.realizado} stopOpacity={0.25} />
                    <stop offset="1" stopColor={cores.realizado} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} stroke={cores.grade} />
                <XAxis dataKey="nome" {...eixo(cores)} />
                <YAxis {...eixo(cores)} tickFormatter={formatoEixo} width={48} />
                <Tooltip content={<DicaGrafico />} />
                <ReferenceLine y={0} stroke={cores.despesa} strokeDasharray="4 4" strokeOpacity={0.6} />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
                <Area isAnimationActive={false} type="monotone" dataKey="Realizado" stroke={cores.realizado} strokeWidth={2.4} fill="url(#gr)" connectNulls />
                <Area isAnimationActive={false} type="monotone" dataKey="Projetado" stroke={cores.projetado} strokeWidth={2.4} strokeDasharray="6 4" fill="url(#gp)" connectNulls />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Cartao>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Cartao className="p-4 sm:p-5">
          <Titulo acao={<button onClick={() => irPara("despesas")} className="text-xs font-medium text-emerald-600 hover:underline dark:text-emerald-400">Ver todas</button>}>
            Contas em aberto em {nomeMes(calc.atual).split(" ")[0].toLowerCase()}
          </Titulo>
          {proximas.length === 0 ? (
            <p className="py-6 text-center text-sm text-slate-500">Tudo pago neste mês. 🎉</p>
          ) : (
            <div className="-mx-1 divide-y divide-slate-100 dark:divide-slate-800">
              {proximas.map((d) => {
                const vencida = d.vencimento < h;
                return (
                  <div key={d.id} className="flex items-center gap-3 px-1 py-2.5">
                    <div className={cx("w-12 shrink-0 rounded-xl py-1 text-center text-xs font-semibold", vencida ? "bg-rose-50 text-rose-600 dark:bg-rose-500/10" : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300")}>
                      {dataCurta(d.vencimento)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-medium">{d.descricao}</div>
                      <div className="text-xs text-slate-500">{vencida ? "Vencida" : d.categoria}</div>
                    </div>
                    <div className="num text-sm font-semibold">{brl(d.valor)}</div>
                    <button
                      onClick={() => setPagando([d])}
                      title="Marcar como paga"
                      aria-label={`Marcar ${d.descricao} como paga`}
                      className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-slate-300 text-slate-400 hover:border-emerald-500 hover:bg-emerald-500 hover:text-white dark:border-slate-600"
                    >
                      <Check size={15} strokeWidth={3} />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </Cartao>
        <Cartao className="p-4 sm:p-5">
          <Titulo acao={<button onClick={() => irPara("relatorios")} className="text-xs font-medium text-emerald-600 hover:underline dark:text-emerald-400">Relatórios</button>}>
            Para onde vai o dinheiro
          </Titulo>
          {porCategoria.length === 0 ? (
            <p className="py-6 text-center text-sm text-slate-500">Sem despesas neste mês.</p>
          ) : (
            <div className="space-y-3 pt-1">
              {porCategoria.map(([cat, v]) => (
                <div key={cat}>
                  <div className="mb-1 flex justify-between text-sm">
                    <span className="font-medium">{cat}</span>
                    <span className="num text-slate-600 dark:text-slate-300">
                      {brl(v)} <span className="text-xs text-slate-400">· {pct(m.despPrev ? v / m.despPrev : 0)}</span>
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                    <div className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-teal-500" style={{ width: `${(v / maiorCat) * 100}%` }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </Cartao>
      </div>

      {ajustar && <ModalAjuste aoFechar={() => setAjustar(false)} />}
      {pagando && <ModalPagamento colecao="despesas" itens={pagando} aoFechar={() => setPagando(null)} />}
    </div>
  );
}

function Pilula({ rotulo, valor, icone, cor }) {
  return (
    <div className="bg-slate-950/40 px-4 py-3 backdrop-blur">
      <div className={cx("flex items-center gap-1.5 text-[12px] font-medium", cor)}>
        {icone} {rotulo}
      </div>
      <div className="num mt-0.5 text-[17px] font-semibold">{brl(valor)}</div>
    </div>
  );
}

const CORES_IND = {
  emerald: "text-emerald-600 dark:text-emerald-400",
  rose: "text-rose-500 dark:text-rose-400",
};

function Indicador({ rotulo, valor, sub, icone, cor, destaque }) {
  return (
    <Cartao className="p-4">
      <div className="flex items-center gap-1.5 text-[12.5px] font-medium text-slate-500">
        <span className={CORES_IND[cor]}>{icone}</span>
        {rotulo}
      </div>
      <div className={cx("num mt-2 truncate text-[22px] font-semibold", destaque)}>{valor}</div>
      <div className="mt-0.5 truncate text-[12px] text-slate-400">{sub}</div>
    </Cartao>
  );
}
