import { Fragment, useState } from "react";
import { Area, AreaChart, CartesianGrid, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ChevronDown, Info } from "lucide-react";
import { useApp } from "../contexto.jsx";
import { brl, pct } from "../lib/dinheiro.js";
import { nomeMes, somarMeses } from "../lib/datas.js";
import { Abas, Cartao, Selo, Titulo, corSituacao, cx } from "../ui/base.jsx";
import { DicaGrafico, eixo, formatoEixo, useCoresGrafico } from "../ui/graficos.jsx";

export default function Projecao() {
  const { calc } = useApp();
  const cores = useCoresGrafico();
  const [aberto, setAberto] = useState(calc.atual);
  const [alcance, setAlcance] = useState("12");
  const de = somarMeses(calc.atual, -3);
  const ate = alcance === "tudo" ? "9999-12" : somarMeses(calc.atual, parseInt(alcance, 10));
  const meses = calc.meses.filter((m) => m.mes >= de && m.mes <= ate);
  const futuros = meses.filter((m) => m.mes >= calc.atual);
  const menor = futuros.reduce((a, m) => (!a || m.saldoFim < a.saldoFim ? m : a), null);
  const dados = meses.map((m) => ({ nome: nomeMes(m.mes, true), Saldo: m.saldoFim }));

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Abas
          abas={[
            ["6", "6 meses"],
            ["12", "12 meses"],
            ["tudo", "Tudo lançado"],
          ]}
          valor={alcance}
          aoMudar={setAlcance}
        />
        <p className="flex items-center gap-1.5 text-xs text-slate-500">
          <Info size={14} /> Considera só o que está lançado. Gere os meses em Contas fixas para uma projeção completa.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <Cartao className="p-4">
          <div className="text-[13px] text-slate-500">Saldo hoje</div>
          <div className="num mt-0.5 text-xl font-bold">{brl(calc.saldoAtual)}</div>
        </Cartao>
        <Cartao className="p-4">
          <div className="text-[13px] text-slate-500">Saldo no fim do período</div>
          <div className={cx("num mt-0.5 text-xl font-bold", futuros.at(-1)?.saldoFim < 0 && "text-rose-600")}>{brl(futuros.at(-1)?.saldoFim ?? calc.saldoAtual)}</div>
        </Cartao>
        <Cartao className="p-4">
          <div className="text-[13px] text-slate-500">Mês mais apertado</div>
          <div className={cx("num mt-0.5 text-xl font-bold", menor?.saldoFim < 0 && "text-rose-600")}>{menor ? brl(menor.saldoFim) : "—"}</div>
          {menor && <div className="text-xs text-slate-500">{nomeMes(menor.mes)}</div>}
        </Cartao>
      </div>

      <Cartao className="p-4 sm:p-5">
        <Titulo>Saldo no fim de cada mês</Titulo>
        <div className="h-64">
          <ResponsiveContainer>
            <AreaChart data={dados} margin={{ left: -8, right: 4, top: 4 }}>
              <defs>
                <linearGradient id="gs" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0" stopColor={cores.projetado} stopOpacity={0.3} />
                  <stop offset="1" stopColor={cores.projetado} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} stroke={cores.grade} />
              <XAxis dataKey="nome" {...eixo(cores)} />
              <YAxis {...eixo(cores)} tickFormatter={formatoEixo} width={48} />
              <Tooltip content={<DicaGrafico />} />
              <ReferenceLine y={0} stroke={cores.despesa} strokeDasharray="4 4" />
              <ReferenceLine x={nomeMes(calc.atual, true)} stroke={cores.texto} strokeDasharray="2 4" label={{ value: "hoje", fontSize: 11, fill: cores.texto, position: "insideTopRight" }} />
              <Area type="monotone" dataKey="Saldo" stroke={cores.projetado} strokeWidth={2.5} fill="url(#gs)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </Cartao>

      <Cartao className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-left text-xs text-slate-500 dark:border-slate-800">
                <th className="px-4 py-3 font-medium">Mês</th>
                <th className="px-3 py-3 text-right font-medium">Receitas</th>
                <th className="px-3 py-3 text-right font-medium">Despesas</th>
                <th className="px-3 py-3 text-right font-medium">Resultado</th>
                <th className="px-3 py-3 text-right font-medium">Saldo final</th>
                <th className="px-4 py-3 font-medium">Situação</th>
              </tr>
            </thead>
            <tbody>
              {meses.map((m) => (
                <Fragment key={m.mes}>
                  <tr
                    onClick={() => setAberto(aberto === m.mes ? null : m.mes)}
                    className={cx(
                      "cursor-pointer border-b border-slate-100 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800/40",
                      m.atual && "bg-emerald-50/60 dark:bg-emerald-500/5",
                      m.passado && "text-slate-500",
                    )}
                  >
                    <td className="px-4 py-3 font-medium">
                      <span className="flex items-center gap-2">
                        <ChevronDown size={15} className={cx("text-slate-400 transition", aberto === m.mes && "rotate-180")} />
                        {nomeMes(m.mes)}
                        {m.atual && <Selo cor="verde">atual</Selo>}
                      </span>
                    </td>
                    <td className="num px-3 py-3 text-right">{brl(m.recPrev)}</td>
                    <td className="num px-3 py-3 text-right">{brl(m.despPrev)}</td>
                    <td className={cx("num px-3 py-3 text-right font-medium", m.resultado < 0 ? "text-rose-600 dark:text-rose-400" : "text-emerald-600 dark:text-emerald-400")}>{brl(m.resultado)}</td>
                    <td className={cx("num px-3 py-3 text-right font-semibold", m.saldoFim < 0 && "text-rose-600 dark:text-rose-400")}>{brl(m.saldoFim)}</td>
                    <td className="px-4 py-3">
                      <Selo cor={corSituacao(m.situacao)}>
                        {m.situacao} · {isFinite(m.comprometido) ? pct(m.comprometido) : "—"}
                      </Selo>
                    </td>
                  </tr>
                  {aberto === m.mes && (
                    <tr className="border-b border-slate-100 bg-slate-50/70 dark:border-slate-800 dark:bg-slate-800/30">
                      <td colSpan={6} className="px-4 py-4">
                        <DetalheMes m={m} calc={calc} />
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </Cartao>
    </div>
  );
}

function DetalheMes({ m, calc }) {
  const linhas = m.passado
    ? [
        ["Saldo no início do mês", m.saldoInicio],
        ["+ Receitas recebidas", m.recReceb],
        ["− Despesas pagas", -m.despPagas],
        m.ajustes ? ["± Ajustes de saldo", m.ajustes] : null,
        ["= Saldo no fim do mês", m.saldoFim, true],
        m.aPagar > 0 ? ["Ficou em aberto (atrasado)", m.aPagar, false, "text-amber-600"] : null,
      ]
    : m.atual
      ? [
          ["Saldo em conta hoje", calc.saldoAtual],
          ["+ A receber neste mês", m.aReceber],
          calc.atrasadas.totalReceitas ? ["+ A receber de meses anteriores", calc.atrasadas.totalReceitas] : null,
          ["− A pagar neste mês", -m.aPagar],
          calc.atrasadas.totalDespesas ? ["− Atrasadas de meses anteriores", -calc.atrasadas.totalDespesas] : null,
          ["= Previsão para o fim do mês", m.saldoFim, true],
        ]
      : [
          ["Saldo previsto no início", m.saldoInicio],
          ["+ Receitas em aberto", m.aReceber],
          ["− Despesas em aberto", -m.aPagar],
          m.despPagas ? ["(já pagas antecipadamente)", m.despPagas, false, "text-slate-400"] : null,
          ["= Saldo previsto no fim", m.saldoFim, true],
        ];
  return (
    <div className="max-w-md space-y-1.5">
      {linhas.filter(Boolean).map(([r, v, forte, cor]) => (
        <div key={r} className={cx("flex justify-between gap-6", forte && "border-t border-slate-200 pt-1.5 font-semibold dark:border-slate-700", cor)}>
          <span>{r}</span>
          <span className="num">{brl(v)}</span>
        </div>
      ))}
    </div>
  );
}
