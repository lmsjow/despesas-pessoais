import { useMemo, useState } from "react";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis, Legend, ReferenceLine } from "recharts";
import { AlertTriangle, ArrowDownLeft, ArrowUpRight, Check, ChevronRight, Scale, Wallet, Gauge, SlidersHorizontal } from "lucide-react";
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
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-500 via-emerald-600 to-teal-700 p-5 text-white shadow-lg shadow-emerald-700/20 sm:p-7">
        <div className="pointer-events-none absolute -right-16 -top-20 h-64 w-64 rounded-full bg-white/10" />
        <div className="pointer-events-none absolute -bottom-24 right-24 h-48 w-48 rounded-full bg-white/5" />
        <div className="relative flex flex-wrap items-end justify-between gap-5">
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-[13px] font-medium text-emerald-50/90">
              <Wallet size={16} /> Saldo em conta
            </div>
            <div className="num mt-1 text-4xl font-bold tracking-tight sm:text-5xl">{brl(calc.saldoAtual)}</div>
            <div className="mt-2 text-[13px] text-emerald-50/90">
              Previsto para o fim de {nomeMes(calc.atual).split(" ")[0].toLowerCase()}:{" "}
              <b className={cx("num", m.saldoFim < 0 && "rounded bg-rose-500/90 px-1.5")}>{brl(m.saldoFim)}</b>
            </div>
            {calc.ultimoAjuste && <div className="mt-1 text-xs text-emerald-50/70">Conferido com o banco em {dataBR(calc.ultimoAjuste.data)}</div>}
          </div>
          <div className="flex w-full flex-wrap gap-2 sm:w-auto">
            <Pilula rotulo="A receber" valor={m.aReceber + at.totalReceitas} icone={<ArrowDownLeft size={15} />} />
            <Pilula rotulo="A pagar" valor={m.aPagar + at.totalDespesas} icone={<ArrowUpRight size={15} />} />
            <button
              onClick={() => setAjustar(true)}
              className="flex items-center gap-2 rounded-2xl bg-white px-4 py-2.5 text-sm font-semibold text-emerald-700 shadow-sm hover:bg-emerald-50"
            >
              <SlidersHorizontal size={16} /> Ajustar saldo
            </button>
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
        <Indicador rotulo="Receitas do mês" valor={brl(m.recPrev)} sub={`${brl(m.recReceb)} recebido`} icone={<ArrowDownLeft size={18} />} cor="emerald" />
        <Indicador rotulo="Despesas do mês" valor={brl(m.despPrev)} sub={`${brl(m.aPagar)} a pagar`} icone={<ArrowUpRight size={18} />} cor="rose" />
        <Indicador
          rotulo="Resultado do mês"
          valor={brl(m.resultado)}
          sub="receitas − despesas"
          icone={<Scale size={18} />}
          cor={m.resultado >= 0 ? "emerald" : "rose"}
          destaque={m.resultado >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}
        />
        <Cartao className="p-4">
          <div className="flex items-center justify-between">
            <span className="text-[13px] text-slate-500">Renda comprometida</span>
            <span className="rounded-xl bg-indigo-50 p-2 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-300">
              <Gauge size={18} />
            </span>
          </div>
          <div className="mt-1 flex items-center gap-2">
            <span className="num text-xl font-bold">{isFinite(m.comprometido) ? pct(m.comprometido) : "—"}</span>
            <Selo cor={corSituacao(m.situacao)}>{m.situacao}</Selo>
          </div>
          <div className="relative mt-3 h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
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
                <Bar dataKey="Receitas" fill={cores.receita} radius={[5, 5, 0, 0]} maxBarSize={18} />
                <Bar dataKey="Despesas" fill={cores.despesa} radius={[5, 5, 0, 0]} maxBarSize={18} />
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
                <Area type="monotone" dataKey="Realizado" stroke={cores.realizado} strokeWidth={2.4} fill="url(#gr)" connectNulls />
                <Area type="monotone" dataKey="Projetado" stroke={cores.projetado} strokeWidth={2.4} strokeDasharray="6 4" fill="url(#gp)" connectNulls />
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

function Pilula({ rotulo, valor, icone }) {
  return (
    <div className="min-w-32 flex-1 rounded-2xl bg-white/15 px-4 py-2.5 backdrop-blur-sm sm:flex-none">
      <div className="flex items-center gap-1.5 text-xs font-medium text-emerald-50/90">
        {icone} {rotulo}
      </div>
      <div className="num text-base font-bold">{brl(valor)}</div>
    </div>
  );
}

const CORES_IND = {
  emerald: "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-300",
  rose: "bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-300",
};

function Indicador({ rotulo, valor, sub, icone, cor, destaque }) {
  return (
    <Cartao className="p-4">
      <div className="flex items-center justify-between">
        <span className="text-[13px] text-slate-500">{rotulo}</span>
        <span className={cx("rounded-xl p-2", CORES_IND[cor])}>{icone}</span>
      </div>
      <div className={cx("num mt-1 truncate text-xl font-bold", destaque)}>{valor}</div>
      <div className="mt-0.5 truncate text-xs text-slate-500">{sub}</div>
    </Cartao>
  );
}
