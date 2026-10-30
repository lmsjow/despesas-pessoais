import { useMemo, useState } from "react";
import { Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useApp } from "../contexto.jsx";
import { brl, pct, somar } from "../lib/dinheiro.js";
import { dataCurta, nomeMes, somarMeses, listaMeses } from "../lib/datas.js";
import { CORES, grupoDe } from "../lib/categorias.js";
import { Abas, Cartao, SeletorMes, Titulo, cx } from "../ui/base.jsx";
import { DicaGrafico, eixo, formatoEixo, useCoresGrafico } from "../ui/graficos.jsx";

const PERIODOS = [
  ["mes", "Mês"],
  ["3", "3 meses"],
  ["6", "6 meses"],
  ["12", "12 meses"],
];

const agrupar = (lista, chave) => {
  const m = {};
  for (const x of lista) {
    const k = chave(x) || "—";
    m[k] = (m[k] || 0) + x.valor;
  }
  return Object.entries(m)
    .map(([nome, valor]) => ({ nome, valor }))
    .sort((a, b) => b.valor - a.valor);
};

export default function Relatorios() {
  const { dados, calc } = useApp();
  const cores = useCoresGrafico();
  const [periodo, setPeriodo] = useState("mes");
  const [mes, setMes] = useState(calc.atual);

  const meses = periodo === "mes" ? [mes] : listaMeses(somarMeses(mes, -(parseInt(periodo, 10) - 1)), mes);
  const conjunto = new Set(meses);
  const desp = useMemo(() => Object.values(dados.despesas).filter((d) => conjunto.has(d.mes)), [dados.despesas, meses.join()]); // eslint-disable-line react-hooks/exhaustive-deps
  const rec = useMemo(() => Object.values(dados.receitas).filter((d) => conjunto.has(d.mes)), [dados.receitas, meses.join()]); // eslint-disable-line react-hooks/exhaustive-deps

  const totalDesp = somar(desp);
  const totalRec = somar(rec);
  const resultado = totalRec - totalDesp;
  const poupanca = totalRec > 0 ? resultado / totalRec : null;

  const porCat = agrupar(desp, (d) => d.categoria);
  const porResp = agrupar(desp, (d) => d.responsavel || "Sem responsável");
  const grupos = ["Necessidades", "Desejos", "Dívidas"].map((g) => ({ nome: g, valor: somar(desp.filter((d) => grupoDe(d.categoria) === g)) }));
  const metas = { Necessidades: 0.5, Desejos: 0.3, Dívidas: 0.2 };
  const maiores = [...desp].sort((a, b) => b.valor - a.valor).slice(0, 8);

  const topCats = porCat.slice(0, 5).map((c) => c.nome);
  const evolucao = listaMeses(somarMeses(mes, -5), mes).map((m) => {
    const linha = { nome: nomeMes(m, true) };
    const doMes = Object.values(dados.despesas).filter((d) => d.mes === m);
    for (const c of topCats) linha[c] = somar(doMes.filter((d) => d.categoria === c));
    linha.Outras = somar(doMes.filter((d) => !topCats.includes(d.categoria)));
    return linha;
  });

  const corCat = (nome) => CORES[porCat.findIndex((c) => c.nome === nome) % CORES.length];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <Abas abas={PERIODOS} valor={periodo} aoMudar={setPeriodo} />
        <SeletorMes mes={mes} aoMudar={setMes} />
        {periodo !== "mes" && (
          <span className="text-xs text-slate-500">
            {nomeMes(meses[0], true)} a {nomeMes(mes, true)}
          </span>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Numero rotulo="Receitas" valor={brl(totalRec)} cor="text-emerald-600 dark:text-emerald-400" />
        <Numero rotulo="Despesas" valor={brl(totalDesp)} cor="text-rose-600 dark:text-rose-400" />
        <Numero rotulo="Resultado" valor={brl(resultado)} cor={resultado >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"} />
        <Numero
          rotulo="Taxa de poupança"
          valor={poupanca == null ? "—" : pct(poupanca)}
          sub={`meta ${pct(dados.config.metaPoupancaPct)}`}
          cor={poupanca != null && poupanca >= dados.config.metaPoupancaPct ? "text-emerald-600 dark:text-emerald-400" : ""}
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-5">
        <Cartao className="p-4 sm:p-5 xl:col-span-3">
          <Titulo>Despesas por categoria</Titulo>
          {porCat.length === 0 ? (
            <p className="py-10 text-center text-sm text-slate-500">Sem despesas no período.</p>
          ) : (
            <div className="flex flex-col items-center gap-4 sm:flex-row">
              <div className="h-52 w-52 shrink-0">
                <ResponsiveContainer>
                  <PieChart>
                    <Pie data={porCat} dataKey="valor" nameKey="nome" innerRadius="62%" outerRadius="100%" paddingAngle={1.5} stroke="none">
                      {porCat.map((c) => (
                        <Cell key={c.nome} fill={corCat(c.nome)} />
                      ))}
                    </Pie>
                    <Tooltip content={({ active, payload }) => (active && payload?.length ? <DicaGrafico active label={payload[0].name} payload={[{ ...payload[0], name: "Total", color: payload[0].payload.fill }]} /> : null)} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="w-full min-w-0 flex-1 space-y-1.5">
                {porCat.map((c) => (
                  <div key={c.nome} className="flex items-center gap-2 text-sm">
                    <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: corCat(c.nome) }} />
                    <span className="flex-1 truncate">{c.nome}</span>
                    <span className="num text-xs text-slate-400">{pct(c.valor / totalDesp)}</span>
                    <span className="num shrink-0 text-right font-medium">{brl(c.valor)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Cartao>

        <Cartao className="p-4 sm:p-5 xl:col-span-2">
          <Titulo>Regra 50 / 30 / 20</Titulo>
          <p className="mb-4 text-xs leading-relaxed text-slate-500">Quanto da renda vai para necessidades, desejos e dívidas, comparado ao recomendado.</p>
          <div className="space-y-4">
            {grupos.map((g) => {
              const p = totalRec > 0 ? g.valor / totalRec : 0;
              const acima = p > metas[g.nome];
              return (
                <div key={g.nome}>
                  <div className="mb-1 flex items-baseline justify-between text-sm">
                    <span className="font-medium">{g.nome}</span>
                    <span className="num">
                      <b className={cx(acima && "text-rose-600 dark:text-rose-400")}>{pct(p)}</b> <span className="text-xs text-slate-400">/ {pct(metas[g.nome])}</span>
                    </span>
                  </div>
                  <div className="relative h-2.5 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                    <div className={cx("h-full rounded-full", acima ? "bg-rose-500" : "bg-emerald-500")} style={{ width: `${Math.min(100, p * 100)}%` }} />
                    <div className="absolute inset-y-0 w-0.5 bg-slate-500/60" style={{ left: `${metas[g.nome] * 100}%` }} />
                  </div>
                  <div className="num mt-1 text-xs text-slate-500">{brl(g.valor)}</div>
                </div>
              );
            })}
          </div>
        </Cartao>
      </div>

      <Cartao className="p-4 sm:p-5">
        <Titulo>Categorias nos últimos 6 meses</Titulo>
        <div className="h-64">
          <ResponsiveContainer>
            <BarChart data={evolucao} margin={{ left: -8, right: 4, top: 4 }}>
              <CartesianGrid vertical={false} stroke={cores.grade} />
              <XAxis dataKey="nome" {...eixo(cores)} />
              <YAxis {...eixo(cores)} tickFormatter={formatoEixo} width={48} />
              <Tooltip content={<DicaGrafico />} cursor={{ fill: cores.cursor }} />
              <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
              {topCats.map((c) => (
                <Bar key={c} dataKey={c} stackId="a" fill={corCat(c)} maxBarSize={36} />
              ))}
              <Bar dataKey="Outras" stackId="a" fill="#94a3b8" radius={[5, 5, 0, 0]} maxBarSize={36} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Cartao>

      <div className="grid gap-4 lg:grid-cols-2">
        <Cartao className="p-4 sm:p-5">
          <Titulo>Maiores despesas</Titulo>
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {maiores.map((d) => (
              <div key={d.id} className="flex items-center gap-3 py-2 text-sm">
                <span className="w-12 shrink-0 text-xs text-slate-500">{dataCurta(d.vencimento)}</span>
                <span className="min-w-0 flex-1 truncate">{d.descricao}</span>
                <span className="num font-semibold">{brl(d.valor)}</span>
              </div>
            ))}
            {!maiores.length && <p className="py-6 text-center text-sm text-slate-500">Sem despesas.</p>}
          </div>
        </Cartao>
        <Cartao className="p-4 sm:p-5">
          <Titulo>Por responsável</Titulo>
          <div className="space-y-3">
            {porResp.map((r, i) => (
              <div key={r.nome}>
                <div className="mb-1 flex justify-between text-sm">
                  <span>{r.nome}</span>
                  <span className="num font-medium">{brl(r.valor)}</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                  <div className="h-full rounded-full" style={{ width: `${(r.valor / (porResp[0]?.valor || 1)) * 100}%`, background: CORES[(i + 4) % CORES.length] }} />
                </div>
              </div>
            ))}
            {!porResp.length && <p className="py-6 text-center text-sm text-slate-500">Sem despesas.</p>}
          </div>
        </Cartao>
      </div>
    </div>
  );
}

function Numero({ rotulo, valor, sub, cor }) {
  return (
    <Cartao className="p-4">
      <div className="text-[13px] text-slate-500">{rotulo}</div>
      <div className={cx("num mt-0.5 truncate text-xl font-bold", cor)}>{valor}</div>
      {sub && <div className="text-xs text-slate-400">{sub}</div>}
    </Cartao>
  );
}
