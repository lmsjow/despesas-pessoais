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
  Moon,
  Sun,
  Cloud,
  CloudOff,
  RefreshCw,
  LogOut,
  FlaskConical,
} from "lucide-react";
import { useApp } from "../contexto.jsx";
import { brl } from "../lib/dinheiro.js";
import { BotaoIcone, Modal, cx } from "../ui/base.jsx";
import Logo from "../ui/Logo.jsx";
import Painel from "./Painel.jsx";
import Lancamentos from "./Lancamentos.jsx";
import FormLancamento from "./FormLancamento.jsx";
import Recorrentes from "./Recorrentes.jsx";
import Relatorios from "./Relatorios.jsx";
import Projecao from "./Projecao.jsx";
import Metas from "./Metas.jsx";
import Configuracoes from "./Configuracoes.jsx";

const TELAS = [
  { id: "painel", rotulo: "Painel", icone: LayoutDashboard, el: Painel },
  { id: "despesas", rotulo: "Despesas", icone: ArrowUpRight, el: () => <Lancamentos colecao="despesas" /> },
  { id: "receitas", rotulo: "Receitas", icone: ArrowDownLeft, el: () => <Lancamentos colecao="receitas" /> },
  { id: "recorrentes", rotulo: "Contas fixas", icone: Repeat, el: Recorrentes },
  { id: "relatorios", rotulo: "Relatórios", icone: PieChart, el: Relatorios },
  { id: "projecao", rotulo: "Projeção", icone: TrendingUp, el: Projecao },
  { id: "metas", rotulo: "Reserva e metas", icone: Target, el: Metas },
  { id: "config", rotulo: "Configurações", icone: Settings, el: Configuracoes },
];

export default function Estrutura() {
  const app = useApp();
  const [form, setForm] = useState(null);
  const [mais, setMais] = useState(false);
  const [escolherNovo, setEscolherNovo] = useState(false);
  const Tela = (TELAS.find((t) => t.id === app.tela) || TELAS[0]).el;
  const abrirForm = (colecao, item = null) => setForm({ colecao, item });

  return (
    <FormCtx.Provider value={abrirForm}>
      <div className="flex min-h-dvh">
        <BarraLateral />
        <div className="flex min-w-0 flex-1 flex-col">
          <Topo aoMenu={() => setMais(true)} />
          {app.demo && (
            <div className="flex items-center justify-center gap-2 bg-amber-100 px-4 py-1.5 text-center text-xs font-medium text-amber-800 dark:bg-amber-500/15 dark:text-amber-300">
              <FlaskConical size={14} /> Modo demonstração: dados fictícios, salvos só neste navegador.
            </div>
          )}
          <main className="mx-auto w-full max-w-6xl flex-1 px-4 pb-28 pt-4 sm:px-6 lg:px-8 lg:pb-10 lg:pt-6">
            <Tela />
          </main>
        </div>
      </div>

      <NavInferior aoNovo={() => setEscolherNovo(true)} aoMais={() => setMais(true)} />

      {escolherNovo && (
        <Modal titulo="Novo lançamento" aoFechar={() => setEscolherNovo(false)}>
          <div className="grid grid-cols-2 gap-3 pb-2">
            {[
              ["despesas", "Despesa", ArrowUpRight, "bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-300"],
              ["receitas", "Receita", ArrowDownLeft, "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-300"],
            ].map(([c, r, I, cor]) => (
              <button
                key={c}
                onClick={() => {
                  setEscolherNovo(false);
                  abrirForm(c);
                }}
                className="flex flex-col items-center gap-2 rounded-2xl border border-slate-200 p-5 font-medium hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800"
              >
                <span className={cx("rounded-2xl p-3", cor)}>
                  <I size={22} />
                </span>
                {r}
              </button>
            ))}
          </div>
        </Modal>
      )}

      {mais && (
        <Modal titulo="Menu" aoFechar={() => setMais(false)}>
          <div className="grid gap-1 pb-2">
            {TELAS.map((t) => (
              <button
                key={t.id}
                onClick={() => {
                  app.irPara(t.id);
                  setMais(false);
                }}
                className={cx(
                  "flex items-center gap-3 rounded-xl px-3 py-3 text-left text-[15px] font-medium",
                  app.tela === t.id ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300" : "hover:bg-slate-100 dark:hover:bg-slate-800",
                )}
              >
                <t.icone size={19} /> {t.rotulo}
              </button>
            ))}
            <button onClick={app.aoSair} className="mt-2 flex items-center gap-3 rounded-xl px-3 py-3 text-left text-[15px] font-medium text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10">
              <LogOut size={19} /> Sair
            </button>
          </div>
        </Modal>
      )}

      {form && <FormLancamento colecao={form.colecao} item={form.item} aoFechar={() => setForm(null)} />}
    </FormCtx.Provider>
  );
}

function BarraLateral() {
  const app = useApp();
  return (
    <aside className="sticky top-0 hidden h-dvh w-64 shrink-0 flex-col border-r border-slate-200 bg-white px-4 py-5 lg:flex dark:border-slate-800 dark:bg-slate-900">
      <div className="mb-7 flex items-center gap-3 px-2">
        <Logo />
        <div>
          <div className="font-bold leading-tight tracking-tight">Casa & Cofre</div>
          <div className="text-xs text-slate-500">Controle financeiro</div>
        </div>
      </div>
      <nav className="flex flex-1 flex-col gap-0.5">
        {TELAS.map((t) => {
          const ativo = app.tela === t.id;
          return (
            <button
              key={t.id}
              onClick={() => app.irPara(t.id)}
              className={cx(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium transition-colors",
                ativo ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300" : "text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800",
              )}
            >
              <t.icone size={18} strokeWidth={ativo ? 2.3 : 2} /> {t.rotulo}
            </button>
          );
        })}
      </nav>
      <div className="mt-4 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 p-4 text-white">
        <div className="text-xs font-medium opacity-85">Saldo em conta</div>
        <div className="num mt-0.5 text-lg font-bold">{brl(app.calc.saldoAtual)}</div>
      </div>
      <div className="mt-3 flex items-center gap-2 px-1">
        <div className="min-w-0 flex-1 truncate text-xs text-slate-500" title={app.usuario.email}>
          {app.usuario.email}
        </div>
        <BotaoIcone titulo="Sair" onClick={app.aoSair}>
          <LogOut size={17} />
        </BotaoIcone>
      </div>
    </aside>
  );
}

function Topo({ aoMenu }) {
  const app = useApp();
  const titulo = (TELAS.find((t) => t.id === app.tela) || TELAS[0]).rotulo;
  return (
    <header className="pt-seguro sticky top-0 z-30 border-b border-slate-200/70 bg-slate-100/85 backdrop-blur-md dark:border-slate-800/70 dark:bg-slate-950/85">
      <div className="mx-auto flex h-14 max-w-6xl items-center gap-2 px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-2.5 lg:hidden">
          <Logo className="h-8 w-8" />
        </div>
        <h1 className="flex-1 truncate text-[17px] font-semibold tracking-tight">{titulo}</h1>
        <IndicadorSincronia />
        <BotaoIcone titulo={app.ocultar ? "Mostrar valores" : "Esconder valores"} onClick={app.alternarOcultar}>
          {app.ocultar ? <EyeOff size={18} /> : <Eye size={18} />}
        </BotaoIcone>
        <BotaoIcone titulo={app.tema === "escuro" ? "Tema claro" : "Tema escuro"} onClick={app.alternarTema}>
          {app.tema === "escuro" ? <Sun size={18} /> : <Moon size={18} />}
        </BotaoIcone>
        <BotaoIcone titulo="Menu" onClick={aoMenu} className="lg:hidden">
          <Menu size={19} />
        </BotaoIcone>
      </div>
    </header>
  );
}

function IndicadorSincronia() {
  const { sincronia, demo } = useApp();
  if (demo) return null;
  let icone = <Cloud size={15} />,
    texto = "Salvo",
    cor = "text-emerald-600 dark:text-emerald-400";
  if (!sincronia.online) {
    icone = <CloudOff size={15} />;
    texto = sincronia.pendente ? "Offline · será enviado" : "Offline";
    cor = "text-amber-600 dark:text-amber-400";
  } else if (sincronia.pendente) {
    icone = <RefreshCw size={15} className="animate-spin" />;
    texto = "Salvando…";
    cor = "text-slate-500";
  }
  return (
    <span className={cx("flex items-center gap-1.5 rounded-full px-2 py-1 text-xs font-medium", cor)} title={texto}>
      {icone}
      <span className="hidden sm:inline">{texto}</span>
    </span>
  );
}

function NavInferior({ aoNovo, aoMais }) {
  const app = useApp();
  const item = (id, rotulo, I) => (
    <button
      onClick={() => app.irPara(id)}
      className={cx("flex flex-1 flex-col items-center gap-0.5 py-2 text-[11px] font-medium", app.tela === id ? "text-emerald-600 dark:text-emerald-400" : "text-slate-500")}
    >
      <I size={21} strokeWidth={app.tela === id ? 2.3 : 1.9} />
      {rotulo}
    </button>
  );
  const noMenu = !["painel", "despesas", "receitas"].includes(app.tela);
  return (
    <nav className="pb-seguro fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 backdrop-blur-md lg:hidden dark:border-slate-800 dark:bg-slate-900/95">
      <div className="mx-auto flex max-w-md items-end">
        {item("painel", "Painel", LayoutDashboard)}
        {item("despesas", "Despesas", ArrowUpRight)}
        <div className="flex flex-1 justify-center">
          <button
            onClick={aoNovo}
            aria-label="Novo lançamento"
            className="-mt-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-600/30 active:scale-95"
          >
            <Plus size={26} />
          </button>
        </div>
        {item("receitas", "Receitas", ArrowDownLeft)}
        <button onClick={aoMais} className={cx("flex flex-1 flex-col items-center gap-0.5 py-2 text-[11px] font-medium", noMenu ? "text-emerald-600 dark:text-emerald-400" : "text-slate-500")}>
          <Menu size={21} />
          Mais
        </button>
      </div>
    </nav>
  );
}
