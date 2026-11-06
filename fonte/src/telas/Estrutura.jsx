import { useState } from "react";
import { FormCtx } from "./formContexto.js";
import {
  LayoutDashboard,
  ArrowUpRight,
  ArrowDownLeft,
  Repeat,
  PieChart,
  TrendingUp,
  Target,
  Settings,
  Plus,
  Menu,
  Eye,
  EyeOff,
  Cloud,
  CloudOff,
  RefreshCw,
  LogOut,
  FlaskConical,
  ChevronRight,
} from "lucide-react";
import { useApp } from "../contexto.jsx";
import { brl } from "../lib/dinheiro.js";
import { BotaoIcone, Modal, cx } from "../ui/base.jsx";
import Logo from "../ui/Logo.jsx";
import { MenuTema } from "../ui/SeletorTema.jsx";
import Painel from "./Painel.jsx";
import Lancamentos from "./Lancamentos.jsx";
import FormLancamento from "./FormLancamento.jsx";
import Recorrentes from "./Recorrentes.jsx";
import Relatorios from "./Relatorios.jsx";
import Projecao from "./Projecao.jsx";
import Metas from "./Metas.jsx";
import Configuracoes from "./Configuracoes.jsx";

const TELAS = [
  { id: "painel", rotulo: "Painel", icone: LayoutDashboard, el: Painel, grupo: "Visão geral" },
  { id: "projecao", rotulo: "Projeção", icone: TrendingUp, el: Projecao, grupo: "Visão geral" },
  { id: "relatorios", rotulo: "Relatórios", icone: PieChart, el: Relatorios, grupo: "Visão geral" },
  { id: "despesas", rotulo: "Despesas", icone: ArrowUpRight, el: () => <Lancamentos colecao="despesas" />, grupo: "Lançamentos" },
  { id: "receitas", rotulo: "Receitas", icone: ArrowDownLeft, el: () => <Lancamentos colecao="receitas" />, grupo: "Lançamentos" },
  { id: "recorrentes", rotulo: "Contas fixas", icone: Repeat, el: Recorrentes, grupo: "Lançamentos" },
  { id: "metas", rotulo: "Reserva e metas", icone: Target, el: Metas, grupo: "Planejamento" },
  { id: "config", rotulo: "Configurações", icone: Settings, el: Configuracoes, grupo: null },
];
const GRUPOS = ["Visão geral", "Lançamentos", "Planejamento"];

export default function Estrutura() {
  const app = useApp();
  const [form, setForm] = useState(null);
  const [mais, setMais] = useState(false);
  const [escolherNovo, setEscolherNovo] = useState(false);
  const Tela = (TELAS.find((t) => t.id === app.tela) || TELAS[0]).el;
  const abrirForm = (colecao, item = null) => setForm({ colecao, item });

  return (
    <FormCtx.Provider value={abrirForm}>
      <div className="min-h-dvh lg:flex lg:gap-2 lg:p-2">
        <BarraLateral aoNovo={() => setEscolherNovo(true)} />
        <div className="flex min-w-0 flex-1 flex-col lg:overflow-clip lg:rounded-2xl lg:bg-white lg:shadow-[0_1px_3px_rgba(0,0,0,.05)] lg:ring-1 lg:ring-slate-900/[0.06] dark:lg:bg-slate-900/50 dark:lg:ring-white/[0.06]">
          <Topo aoMenu={() => setMais(true)} />
          {app.demo && (
            <div className="flex items-center justify-center gap-2 border-b border-amber-200/60 bg-amber-50 px-4 py-1.5 text-center text-xs font-medium text-amber-800 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-300">
              <FlaskConical size={13} /> Modo demonstração · dados fictícios, salvos só neste navegador
            </div>
          )}
          <main className="surgir mx-auto w-full max-w-6xl flex-1 px-4 pb-32 pt-5 sm:px-6 lg:px-10 lg:pb-12 lg:pt-7" key={app.tela}>
            <Tela />
          </main>
        </div>
      </div>

      <NavInferior aoNovo={() => setEscolherNovo(true)} aoMais={() => setMais(true)} />

      {escolherNovo && (
        <Modal titulo="Novo lançamento" aoFechar={() => setEscolherNovo(false)}>
          <div className="grid gap-2 pb-2">
            {[
              ["despesas", "Despesa", "Conta, compra ou gasto", ArrowUpRight, "bg-rose-500"],
              ["receitas", "Receita", "Salário, extra ou reembolso", ArrowDownLeft, "bg-emerald-500"],
            ].map(([c, r, sub, I, cor]) => (
              <button
                key={c}
                onClick={() => {
                  setEscolherNovo(false);
                  abrirForm(c);
                }}
                className="group flex items-center gap-4 rounded-2xl p-3 text-left ring-1 ring-inset ring-slate-900/[0.07] transition hover:bg-slate-50 dark:ring-white/10 dark:hover:bg-white/[0.04]"
              >
                <span className={cx("flex h-11 w-11 items-center justify-center rounded-xl text-white shadow-sm", cor)}>
                  <I size={20} strokeWidth={2.3} />
                </span>
                <span className="flex-1">
                  <span className="block text-[15px] font-semibold">{r}</span>
                  <span className="block text-[12.5px] text-slate-500">{sub}</span>
                </span>
                <ChevronRight size={18} className="text-slate-300 transition group-hover:translate-x-0.5" />
              </button>
            ))}
          </div>
        </Modal>
      )}

      {mais && (
        <Modal titulo="Menu" aoFechar={() => setMais(false)}>
          <div className="pb-2">
            {[...GRUPOS, null].map((g) => (
              <div key={g || "outros"} className="mb-3">
                {g && <div className="px-2 pb-1 text-[11px] font-medium uppercase tracking-wider text-slate-400">{g}</div>}
                {TELAS.filter((t) => t.grupo === g).map((t) => (
                  <button
                    key={t.id}
                    onClick={() => {
                      app.irPara(t.id);
                      setMais(false);
                    }}
                    className={cx(
                      "flex w-full items-center gap-3 rounded-xl px-2.5 py-2.5 text-left text-[15px] font-medium",
                      app.tela === t.id ? "bg-slate-900/[0.05] text-slate-900 dark:bg-white/[0.08] dark:text-white" : "text-slate-600 hover:bg-slate-900/[0.04] dark:text-slate-300 dark:hover:bg-white/[0.05]",
                    )}
                  >
                    <t.icone size={18} /> {t.rotulo}
                  </button>
                ))}
              </div>
            ))}
            <button onClick={app.aoSair} className="flex w-full items-center gap-3 rounded-xl px-2.5 py-2.5 text-left text-[15px] font-medium text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10">
              <LogOut size={18} /> Sair
            </button>
          </div>
        </Modal>
      )}

      {form && <FormLancamento colecao={form.colecao} item={form.item} aoFechar={() => setForm(null)} />}
    </FormCtx.Provider>
  );
}

function ItemMenu({ t }) {
  const app = useApp();
  const ativo = app.tela === t.id;
  return (
    <button
      onClick={() => app.irPara(t.id)}
      className={cx(
        "flex h-9 w-full items-center gap-2.5 rounded-[10px] px-2.5 text-left text-[13.5px] font-medium transition-colors",
        ativo
          ? "bg-white text-slate-900 shadow-[0_1px_2px_rgba(0,0,0,.06)] ring-1 ring-slate-900/[0.06] dark:bg-white/[0.08] dark:text-white dark:ring-white/[0.06]"
          : "text-slate-600 hover:bg-slate-900/[0.04] hover:text-slate-900 dark:text-slate-400 dark:hover:bg-white/[0.04] dark:hover:text-white",
      )}
    >
      <t.icone size={17} strokeWidth={ativo ? 2.2 : 1.9} className={ativo ? "text-slate-900 dark:text-white" : "text-slate-400"} />
      {t.rotulo}
    </button>
  );
}

function BarraLateral({ aoNovo }) {
  const app = useApp();
  return (
    <aside className="sticky top-2 hidden h-[calc(100dvh-1rem)] w-60 shrink-0 flex-col px-2 py-2 lg:flex">
      <div className="mb-5 flex items-center gap-2.5 px-1.5">
        <Logo className="h-8 w-8" />
        <div className="leading-tight">
          <div className="text-[14.5px] font-semibold tracking-tight">Casa & Cofre</div>
          <div className="text-[11.5px] text-slate-500">Finanças da família</div>
        </div>
      </div>
      <button
        onClick={aoNovo}
        className="mb-5 flex h-9 items-center justify-center gap-2 rounded-[10px] bg-slate-900 text-[13.5px] font-medium text-white shadow-[0_1px_2px_rgba(0,0,0,.15),inset_0_1px_0_rgba(255,255,255,.08)] transition hover:bg-slate-800 active:scale-[.98] dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200"
      >
        <Plus size={16} /> Novo lançamento
      </button>
      <nav className="flex flex-1 flex-col gap-4 overflow-y-auto">
        {GRUPOS.map((g) => (
          <div key={g}>
            <div className="px-2.5 pb-1.5 text-[11px] font-medium uppercase tracking-wider text-slate-400">{g}</div>
            <div className="space-y-0.5">
              {TELAS.filter((t) => t.grupo === g).map((t) => (
                <ItemMenu key={t.id} t={t} />
              ))}
            </div>
          </div>
        ))}
      </nav>
      <div className="space-y-2">
        <ItemMenu t={TELAS.find((t) => t.id === "config")} />
        <div className="rounded-xl bg-white p-3 shadow-[0_1px_2px_rgba(0,0,0,.05)] ring-1 ring-slate-900/[0.06] dark:bg-white/[0.04] dark:ring-white/[0.06]">
          <div className="flex items-center justify-between text-[11.5px] text-slate-500">
            Saldo em conta
            <span className="flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
          </div>
          <div className="num mt-0.5 text-[17px] font-semibold">{brl(app.calc.saldoAtual)}</div>
          <div className="mt-0.5 text-[11.5px] text-slate-500">
            fim do mês <span className="num font-medium text-slate-700 dark:text-slate-300">{brl(app.calc.mesAtual?.saldoFim)}</span>
          </div>
        </div>
        <div className="flex items-center gap-2 px-1">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-900/[0.06] text-[11px] font-semibold uppercase text-slate-600 dark:bg-white/[0.08] dark:text-slate-300">
            {(app.usuario.email || "?").slice(0, 2)}
          </span>
          <div className="min-w-0 flex-1 truncate text-[12px] text-slate-500" title={app.usuario.email}>
            {app.usuario.email}
          </div>
          <BotaoIcone titulo="Sair" onClick={app.aoSair} className="h-8 w-8">
            <LogOut size={15} />
          </BotaoIcone>
        </div>
      </div>
    </aside>
  );
}

function Topo({ aoMenu }) {
  const app = useApp();
  const tela = TELAS.find((t) => t.id === app.tela) || TELAS[0];
  return (
    <header className="pt-seguro sticky top-0 z-30 border-b border-slate-900/[0.06] bg-slate-100/80 backdrop-blur-xl lg:bg-white/80 dark:border-white/[0.06] dark:bg-slate-950/80 dark:lg:bg-slate-900/70">
      <div className="mx-auto flex h-14 max-w-6xl items-center gap-1.5 px-4 sm:px-6 lg:px-10">
        <Logo className="mr-1.5 h-7 w-7 lg:hidden" />
        <div className="flex min-w-0 flex-1 items-center gap-1.5 text-[15px]">
          {tela.grupo && <span className="hidden text-slate-400 sm:inline">{tela.grupo}</span>}
          {tela.grupo && <ChevronRight size={14} className="hidden text-slate-300 sm:inline dark:text-slate-600" />}
          <h1 className="truncate font-semibold tracking-tight">{tela.rotulo}</h1>
        </div>
        <IndicadorSincronia />
        <BotaoIcone titulo={app.ocultar ? "Mostrar valores" : "Esconder valores"} onClick={app.alternarOcultar}>
          {app.ocultar ? <EyeOff size={17} /> : <Eye size={17} />}
        </BotaoIcone>
        <MenuTema />
        <BotaoIcone titulo="Menu" onClick={aoMenu} className="lg:hidden">
          <Menu size={18} />
        </BotaoIcone>
      </div>
    </header>
  );
}

function IndicadorSincronia() {
  const { sincronia, demo } = useApp();
  if (demo) return null;
  let icone = <Cloud size={14} />,
    texto = "Salvo",
    cor = "text-slate-500";
  if (!sincronia.online) {
    icone = <CloudOff size={14} />;
    texto = sincronia.pendente ? "Offline · será enviado" : "Offline";
    cor = "text-amber-600 dark:text-amber-400";
  } else if (sincronia.pendente) {
    icone = <RefreshCw size={14} className="animate-spin" />;
    texto = "Salvando…";
  }
  return (
    <span className={cx("mr-1 flex items-center gap-1.5 rounded-full px-2 py-1 text-[12px] font-medium", cor)} title={texto}>
      {icone}
      <span className="hidden sm:inline">{texto}</span>
    </span>
  );
}

function NavInferior({ aoNovo, aoMais }) {
  const app = useApp();
  const item = (id, rotulo, I) => {
    const ativo = app.tela === id;
    return (
      <button onClick={() => app.irPara(id)} className={cx("flex flex-1 flex-col items-center gap-0.5 py-2 text-[10.5px] font-medium transition-colors", ativo ? "text-slate-900 dark:text-white" : "text-slate-400")}>
        <I size={20} strokeWidth={ativo ? 2.3 : 1.9} />
        {rotulo}
      </button>
    );
  };
  const noMenu = !["painel", "despesas", "receitas"].includes(app.tela);
  return (
    <nav className="fixed inset-x-3 bottom-3 z-40 mx-auto max-w-md lg:hidden" style={{ bottom: "calc(env(safe-area-inset-bottom) + 0.75rem)" }}>
      <div className="flex items-center rounded-[22px] bg-white/85 px-1.5 shadow-[0_12px_32px_-12px_rgba(0,0,0,.28)] ring-1 ring-slate-900/[0.08] backdrop-blur-xl dark:bg-slate-900/85 dark:ring-white/10">
        {item("painel", "Painel", LayoutDashboard)}
        {item("despesas", "Despesas", ArrowUpRight)}
        <div className="flex flex-1 justify-center">
          <button
            onClick={aoNovo}
            aria-label="Novo lançamento"
            className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-900 text-white shadow-[0_6px_16px_-6px_rgba(0,0,0,.5)] transition active:scale-95 dark:bg-white dark:text-slate-900"
          >
            <Plus size={22} strokeWidth={2.3} />
          </button>
        </div>
        {item("receitas", "Receitas", ArrowDownLeft)}
        <button onClick={aoMais} className={cx("flex flex-1 flex-col items-center gap-0.5 py-2 text-[10.5px] font-medium", noMenu ? "text-slate-900 dark:text-white" : "text-slate-400")}>
          <Menu size={20} />
          Mais
        </button>
      </div>
    </nav>
  );
}
