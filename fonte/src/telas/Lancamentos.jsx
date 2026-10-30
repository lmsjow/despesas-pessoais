import { useEffect, useMemo, useRef, useState } from "react";
import { Search, Plus, FileDown, CheckCheck, RotateCcw, Check, Copy, Trash2, Pencil, Inbox, Repeat, ListChecks, X, Wallet, ChevronDown } from "lucide-react";
import { useApp } from "../contexto.jsx";
import { useForm } from "./formContexto.js";
import { alternarStatus, excluir, marcarMes, salvarLancamento } from "../dados/acoes.js";
import { brl, somar } from "../lib/dinheiro.js";
import { dataCurta, hoje, nomeMes } from "../lib/datas.js";
import { PAGO, composicaoSaldo } from "../lib/calculos.js";
import { CORES } from "../lib/categorias.js";
import { gerarRelatorioPdf } from "../lib/relatorioPdf.js";
import { Botao, Cartao, Confirmar, Modal, SeletorMes, Selecao, Vazio, classeEntrada, cx } from "../ui/base.jsx";
import ModalPagamento from "./ModalPagamento.jsx";
import CalculoSaldo from "./CalculoSaldo.jsx";

// Livro-caixa: tabela densa com colunas alinhadas no computador e linhas de
// duas alturas no celular. Em telas médias "Forma" e as ações ficam ocultas
// para a descrição não ser espremida.
const GRADE = "md:grid-cols-[24px_56px_minmax(0,1fr)_130px_104px_108px] xl:grid-cols-[24px_56px_minmax(0,1fr)_140px_88px_104px_108px_72px]";
const SO_XL = "hidden xl:block";

export default function Lancamentos({ colecao }) {
  const app = useApp();
  const abrirForm = useForm();
  const despesa = colecao === "despesas";
  const campoData = despesa ? "vencimento" : "data";
  const [mes, setMes] = useState(app.calc.atual);
  const [status, setStatus] = useState("todos");
  const [busca, setBusca] = useState("");
  const [categoria, setCategoria] = useState("");
  const [reabrir, setReabrir] = useState(false);
  const [pagando, setPagando] = useState(null); // { colecao, itens } da confirmação de pagamento
  const [verCalculo, setVerCalculo] = useState(null); // null | "balao" (computador) | "folha" (celular)
  const refResumo = useRef();
  const pagar = (itens, col = colecao) => setPagando({ colecao: col, itens });
  const alternarCalculo = () => setVerCalculo((v) => (v ? null : window.matchMedia("(max-width: 639px)").matches ? "folha" : "balao"));
  useEffect(() => {
    if (verCalculo !== "balao") return;
    const fora = (e) => !refResumo.current?.contains(e.target) && setVerCalculo(null);
    const esc = (e) => e.key === "Escape" && setVerCalculo(null);
    document.addEventListener("mousedown", fora);
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("mousedown", fora);
      document.removeEventListener("keydown", esc);
    };
  }, [verCalculo]);
  const [selecao, setSelecao] = useState(null); // null = fora do modo seleção; Set de ids dentro dele

  const doMes = useMemo(
    () => Object.values(app.dados[colecao]).filter((x) => x.mes === mes).sort((a, b) => (a[campoData] || "").localeCompare(b[campoData] || "") || a.descricao.localeCompare(b.descricao)),
    [app.dados, colecao, mes, campoData],
  );
  const termo = busca.trim().toLowerCase();
  const filtrar = (x) =>
    (status === "todos" || (status === "pago" ? x.status === PAGO : x.status !== PAGO)) &&
    (!categoria || x.categoria === categoria) &&
    (!termo || `${x.descricao} ${x.obs} ${x.responsavel} ${x.categoria}`.toLowerCase().includes(termo));
  const lista = doMes.filter(filtrar);

  const atual = mes === app.calc.atual;
  const atrasadas = atual ? (despesa ? app.calc.atrasadas.despesas : app.calc.atrasadas.receitas).filter(filtrar) : [];
  const total = somar(doMes);
  const pago = somar(doMes.filter((x) => x.status === PAGO));
  const emAberto = doMes.filter((x) => x.status !== PAGO);
  const categorias = despesa ? app.dados.config.categoriasDespesa : app.dados.config.categoriasReceita;
  const corCat = (c) => CORES[Math.max(0, categorias.indexOf(c)) % CORES.length];
  const infoMes = app.calc.meses.find((m) => m.mes === mes);
  const progresso = total ? pago / total : 0;
  const calculo = verCalculo && (
    <CalculoSaldo
      composicao={composicaoSaldo(app.dados, app.calc, mes)}
      mes={mes}
      aoPagar={(col, itens) => {
        setVerCalculo(null);
        pagar(itens, col);
      }}
    />
  );
  const h = hoje();

  const visiveis = [...atrasadas, ...lista];
  const selecionados = selecao ? visiveis.filter((x) => selecao.has(x.id)) : [];
  const abertosVisiveis = visiveis.filter((x) => x.status !== PAGO);

  function alternarSelecao(id) {
    setSelecao((s) => {
      const n = new Set(s);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  }

  /** Círculo: em aberto → pede a data; pago → reabre com opção de desfazer. */
  function aoMarcar(x) {
    if (selecao) return x.status !== PAGO && alternarSelecao(x.id);
    if (x.status !== PAGO) return pagar([x]);
    app.gravar(alternarStatus(colecao, x));
    app.avisar(`“${x.descricao}” voltou para em aberto`, {
      acao: { rotulo: "Desfazer", executar: () => app.gravar({ [`${colecao}.${x.id}`]: x }) },
    });
  }

  function pdf() {
    const r = gerarRelatorioPdf({
      itens: lista,
      mes,
      filtros: [status !== "todos" && (status === "pago" ? "Pagas" : "Em aberto"), categoria, termo && `busca “${busca.trim()}”`].filter(Boolean).join(" · "),
      saldoAtual: app.calc.saldoAtual,
      fimDoMes: app.calc.mesAtual?.saldoFim,
      ehMesAtual: atual,
    });
    if (r === "vazio") app.avisar("Não há despesas com esses filtros.", { tipo: "erro" });
    if (r === "bloqueado") app.avisar("O navegador bloqueou a janela do relatório. Permita pop-ups para este site.", { tipo: "erro" });
  }

  const propsLinha = { colecao, campoData, hoje: h, aoMarcar, selecao, corCat };
  const contagem = (f) => doMes.filter(f).length;

  return (
    <div className="space-y-3">
      {/* barra de ferramentas */}
      <div className="flex flex-wrap items-center gap-2">
        <SeletorMes
          mes={mes}
          aoMudar={(m) => {
            setMes(m);
            setSelecao(null);
          }}
        />
        <div className="relative min-w-40 flex-1 sm:max-w-64">
          <Search size={15} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input className={cx(classeEntrada, "py-1.5 pl-8 text-sm")} placeholder="Buscar" value={busca} onChange={(e) => setBusca(e.target.value)} />
        </div>
        <div className="ml-auto flex flex-wrap gap-2">
          {despesa && (
            <Botao variante="secundario" tamanho="sm" onClick={pdf} title="Gerar relatório para imprimir ou salvar em PDF">
              <FileDown size={15} /> <span className="hidden sm:inline">PDF</span>
            </Botao>
          )}
          {emAberto.length + atrasadas.length > 0 && (
            <Botao variante="secundario" tamanho="sm" onClick={() => setSelecao(selecao ? null : new Set())}>
              <ListChecks size={15} /> <span className="hidden sm:inline">{selecao ? "Cancelar seleção" : "Selecionar"}</span>
            </Botao>
          )}
          {emAberto.length > 0 && (
            <Botao variante="secundario" tamanho="sm" onClick={() => pagar(emAberto)}>
              <CheckCheck size={15} /> {despesa ? "Pagar todas" : "Receber todas"} <span className="text-slate-400">{emAberto.length}</span>
            </Botao>
          )}
          <span className="hidden lg:block">
            <Botao tamanho="sm" onClick={() => abrirForm(colecao, null)}>
              <Plus size={15} /> {despesa ? "Nova despesa" : "Nova receita"}
            </Botao>
          </span>
        </div>
      </div>

      {/* resumo */}
      <div ref={refResumo} className="relative">
      <Cartao className="overflow-hidden">
        <div className="grid grid-cols-2 gap-px bg-slate-100 sm:grid-cols-5 dark:bg-slate-800">
          <Numero rotulo={despesa ? "Despesas do mês" : "Receitas do mês"} valor={total} />
          <Numero rotulo={despesa ? "Pago" : "Recebido"} valor={pago} cor="text-emerald-600 dark:text-emerald-400" />
          <Numero rotulo={despesa ? "A pagar" : "A receber"} valor={total - pago} cor={despesa ? "text-rose-600 dark:text-rose-400" : "text-sky-600 dark:text-sky-400"} />
          {infoMes && (
            <Numero
              rotulo={despesa ? "A receber" : "A pagar"}
              valor={despesa ? infoMes.aReceber : infoMes.aPagar}
              cor={despesa ? "text-sky-600 dark:text-sky-400" : "text-rose-600 dark:text-rose-400"}
              dica={despesa ? "receitas do mês ainda não recebidas" : "despesas do mês ainda não pagas"}
            />
          )}
          {infoMes && <SaldoFim info={infoMes} aberto={!!verCalculo} aoAlternar={alternarCalculo} />}
        </div>
        <div className="flex items-center gap-3 border-t border-slate-100 px-3.5 py-2 dark:border-slate-800">
          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
            <div className="h-full rounded-full bg-emerald-500 transition-all" style={{ width: `${progresso * 100}%` }} />
          </div>
          <span className="num text-xs text-slate-500">
            {Math.round(progresso * 100)}% {despesa ? "pago" : "recebido"}
          </span>
        </div>
      </Cartao>
      {verCalculo === "balao" && (
        <div role="dialog" aria-label="Cálculo do saldo" className="animar-subir absolute right-2 top-[4.4rem] z-30 w-80 rounded-xl border border-slate-200 bg-white p-3 shadow-xl dark:border-slate-700 dark:bg-slate-900">
          {calculo}
        </div>
      )}
      </div>
      {verCalculo === "folha" && (
        <Modal titulo={infoMes?.passado ? "Como o mês fechou" : "Saldo previsto"} aoFechar={() => setVerCalculo(null)}>
          <div className="pb-2 [&>div]:text-[14px]">{calculo}</div>
        </Modal>
      )}

      {/* filtros */}
      <div className="flex flex-wrap items-center gap-1.5">
        {[
          ["todos", "Todas", doMes.length],
          ["aberto", "Em aberto", emAberto.length],
          ["pago", despesa ? "Pagas" : "Recebidas", contagem((x) => x.status === PAGO)],
        ].map(([v, r, n]) => (
          <button
            key={v}
            onClick={() => setStatus(v)}
            className={cx(
              "rounded-full px-3 py-1 text-[12.5px] font-medium transition",
              status === v ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900" : "text-slate-500 hover:bg-slate-200/70 dark:hover:bg-slate-800",
            )}
          >
            {r} <span className="opacity-60">{n}</span>
          </button>
        ))}
        <Selecao className="ml-auto w-auto py-1 pl-2.5 text-[13px] sm:w-48" opcoes={categorias} vazio="Todas as categorias" value={categoria} onChange={(e) => setCategoria(e.target.value)} />
      </div>

      {/* tabela */}
      <Cartao className="overflow-hidden">
        <div className={cx("hidden items-center gap-3 border-b border-slate-100 bg-slate-50/80 px-3 py-2 text-[11px] font-medium uppercase tracking-wide text-slate-400 md:grid dark:border-slate-800 dark:bg-slate-900", GRADE)}>
          <span />
          <span>{despesa ? "Venc." : "Data"}</span>
          <span>Descrição</span>
          <span>Categoria</span>
          <span className={SO_XL}>{despesa ? "Forma" : "Quem"}</span>
          <span>Situação</span>
          <span className="text-right">Valor</span>
          <span className={SO_XL} />
        </div>

        {selecao && (
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-emerald-100 bg-emerald-50/70 px-3 py-1.5 text-[12.5px] text-emerald-800 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-200">
            <span>Toque nas contas em aberto para selecionar.</span>
            <button
              className="font-semibold hover:underline"
              onClick={() => setSelecao(selecao.size === abertosVisiveis.length ? new Set() : new Set(abertosVisiveis.map((x) => x.id)))}
            >
              {selecao.size === abertosVisiveis.length && abertosVisiveis.length > 0 ? "Limpar" : "Selecionar todas"}
            </button>
          </div>
        )}

        {atrasadas.length > 0 && (
          <>
            <div className="flex items-center justify-between border-b border-rose-100 bg-rose-50/70 px-3 py-1.5 dark:border-rose-500/20 dark:bg-rose-500/5">
              <span className="text-[11px] font-semibold uppercase tracking-wide text-rose-600 dark:text-rose-400">
                De meses anteriores · {atrasadas.length}
              </span>
              <span className="flex items-center gap-3">
                <span className="num text-xs font-semibold text-rose-600 dark:text-rose-400">{brl(somar(atrasadas))}</span>
                {!selecao && atrasadas.length > 1 && (
                  <button onClick={() => pagar(atrasadas)} className="text-xs font-semibold text-rose-700 hover:underline dark:text-rose-300">
                    {despesa ? "Pagar todas" : "Receber todas"}
                  </button>
                )}
              </span>
            </div>
            {atrasadas.map((x) => (
              <Linha key={x.id} item={x} {...propsLinha} />
            ))}
            {lista.length > 0 && (
              <div className="border-b border-slate-100 bg-slate-50/80 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-400 dark:border-slate-800 dark:bg-slate-900">
                {nomeMes(mes)}
              </div>
            )}
          </>
        )}

        {visiveis.length === 0 ? (
          <Vazio
            icone={<Inbox size={24} />}
            titulo={doMes.length ? "Nada com esses filtros" : `Nenhuma ${despesa ? "despesa" : "receita"} em ${nomeMes(mes)}`}
            texto={doMes.length ? null : "Lance manualmente ou gere os meses a partir das contas fixas."}
            acao={
              !doMes.length && (
                <Botao variante="secundario" onClick={() => app.irPara("recorrentes")}>
                  <Repeat size={16} /> Contas fixas
                </Botao>
              )
            }
          />
        ) : (
          lista.map((x) => <Linha key={x.id} item={x} {...propsLinha} />)
        )}

        {doMes.length > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 bg-slate-50/80 px-3 py-2 text-xs text-slate-500 dark:border-slate-800 dark:bg-slate-900">
            <span>
              {lista.length} de {doMes.length} lançamentos · <b className="num text-slate-700 dark:text-slate-200">{brl(somar(lista))}</b>
            </span>
            {emAberto.length < doMes.length && (
              <button onClick={() => setReabrir(true)} className="inline-flex items-center gap-1 font-medium hover:text-slate-800 dark:hover:text-slate-200">
                <RotateCcw size={13} /> Reabrir o mês
              </button>
            )}
          </div>
        )}
      </Cartao>

      {selecao && (
        <div className="fixed inset-x-0 bottom-20 z-30 flex justify-center px-4 lg:bottom-6 lg:pl-64">
          <div className="animar-subir flex w-full max-w-lg items-center gap-3 rounded-2xl bg-slate-900 px-4 py-3 text-sm text-white shadow-xl dark:bg-slate-100 dark:text-slate-900">
            <div className="min-w-0 flex-1">
              <div className="font-semibold">{selecionados.length} selecionada(s)</div>
              <div className="num text-xs opacity-75">{brl(somar(selecionados))}</div>
            </div>
            <Botao tamanho="sm" disabled={!selecionados.length} onClick={() => pagar(selecionados)}>
              <CheckCheck size={15} /> {despesa ? "Pagar" : "Receber"}
            </Botao>
            <button aria-label="Cancelar seleção" className="rounded-lg p-1.5 opacity-70 hover:opacity-100" onClick={() => setSelecao(null)}>
              <X size={18} />
            </button>
          </div>
        </div>
      )}

      {pagando && <ModalPagamento colecao={pagando.colecao} itens={pagando.itens} aoFechar={() => setPagando(null)} aoConcluir={() => setSelecao(null)} />}

      {reabrir && (
        <Confirmar
          titulo="Reabrir lançamentos"
          texto={`${doMes.length - emAberto.length} lançamento(s) de ${nomeMes(mes)} voltarão a ficar em aberto.`}
          aoConfirmar={() => app.gravar(marcarMes(app.dados, colecao, mes, false), "Lançamentos reabertos")}
          aoFechar={() => setReabrir(false)}
        />
      )}
    </div>
  );
}

function Numero({ rotulo, valor, cor, dica }) {
  return (
    <div className="bg-white px-3.5 py-2.5 dark:bg-slate-900" title={dica}>
      <div className="text-[11px] font-medium uppercase tracking-wide text-slate-400">{rotulo}</div>
      <div className={cx("num truncate text-[15px] font-semibold sm:text-base", cor)}>{brl(valor)}</div>
    </div>
  );
}

/** Saldo da conta ao final do mês exibido (real nos meses passados, previsto nos demais), com o cálculo sob demanda. */
function SaldoFim({ info, aberto, aoAlternar }) {
  const negativo = info.saldoFim < 0;
  return (
    <button
      onClick={aoAlternar}
      aria-expanded={aberto}
      className={cx(
        "col-span-2 px-3.5 py-2.5 text-left transition sm:col-span-1",
        negativo ? "bg-rose-50 hover:bg-rose-100/70 dark:bg-rose-950/40" : "bg-emerald-50 hover:bg-emerald-100/70 dark:bg-emerald-950/40",
      )}
    >
      <div className={cx("flex items-center gap-1 text-[11px] font-medium uppercase tracking-wide", negativo ? "text-rose-600 dark:text-rose-400" : "text-emerald-700 dark:text-emerald-400")}>
        <Wallet size={12} /> {info.passado ? "Saldo no fim do mês" : "Saldo previsto no fim"}
      </div>
      <div className={cx("num truncate text-[15px] font-bold sm:text-base", negativo ? "text-rose-600 dark:text-rose-400" : "text-emerald-700 dark:text-emerald-300")}>{brl(info.saldoFim)}</div>
      <div className={cx("flex items-center gap-0.5 text-[11.5px] font-medium", negativo ? "text-rose-600/80" : "text-emerald-700/80 dark:text-emerald-400/80")}>
        {aberto ? "ocultar cálculo" : "ver cálculo"} <ChevronDown size={13} className={cx("transition", aberto && "rotate-180")} />
      </div>
    </button>
  );
}

const CORES_SITUACAO = {
  pago: "text-emerald-700 bg-emerald-50 ring-emerald-600/15 dark:text-emerald-300 dark:bg-emerald-500/10",
  atrasado: "text-rose-700 bg-rose-50 ring-rose-600/15 dark:text-rose-300 dark:bg-rose-500/10",
  hoje: "text-amber-700 bg-amber-50 ring-amber-600/20 dark:text-amber-300 dark:bg-amber-500/10",
  aberto: "text-slate-600 bg-slate-100 ring-slate-500/10 dark:text-slate-300 dark:bg-slate-800",
};

function Linha({ item: x, colecao, campoData, hoje: h, aoMarcar, selecao, corCat }) {
  const app = useApp();
  const abrirForm = useForm();
  const despesa = colecao === "despesas";
  const pago = x.status === PAGO;
  const data = x[campoData];
  const dataPago = despesa ? x.pagoEm : x.recebidoEm;
  const selecionando = !!selecao;
  const marcado = selecionando && selecao.has(x.id);
  const sit = pago
    ? ["pago", `${despesa ? "Pago" : "Recebido"} ${dataCurta(dataPago)}`]
    : data < h
      ? ["atrasado", "Atrasado"]
      : data === h
        ? ["hoje", "Vence hoje"]
        : ["aberto", "Em aberto"];
  const abrir = () => (selecionando ? aoMarcar(x) : abrirForm(colecao, x));

  return (
    <div
      className={cx(
        "group grid grid-cols-[24px_minmax(0,1fr)_auto] items-center gap-3 border-b border-slate-100 px-3 py-2 text-[13.5px] last:border-0 dark:border-slate-800/70",
        GRADE,
        marcado ? "bg-emerald-50/80 dark:bg-emerald-500/10" : "hover:bg-slate-50 dark:hover:bg-slate-800/40",
        selecionando && pago && "opacity-50",
      )}
    >
      <button
        onClick={() => aoMarcar(x)}
        disabled={selecionando && pago}
        title={selecionando ? "Selecionar" : pago ? "Voltar para em aberto" : despesa ? "Registrar pagamento" : "Registrar recebimento"}
        aria-label={selecionando ? `Selecionar ${x.descricao}` : pago ? "Voltar para em aberto" : despesa ? "Registrar pagamento" : "Registrar recebimento"}
        aria-pressed={selecionando ? marcado : undefined}
        className={cx(
          "flex h-5 w-5 items-center justify-center border transition",
          selecionando ? "rounded-md" : "rounded-full",
          pago || marcado ? "border-emerald-500 bg-emerald-500 text-white" : "border-slate-300 text-transparent hover:border-emerald-500 hover:text-emerald-500 dark:border-slate-600",
        )}
      >
        <Check size={12} strokeWidth={3.2} />
      </button>

      <span className={cx("num hidden text-slate-500 md:block", sit[0] === "atrasado" && "font-medium text-rose-600 dark:text-rose-400")}>{dataCurta(data)}</span>

      <button onClick={abrir} className="min-w-0 text-left">
        <div className={cx("flex items-center gap-1.5 truncate font-medium", pago && "text-slate-400 dark:text-slate-500")}>
          <span className="truncate">{x.descricao}</span>
          {x.recId && <Repeat size={11} className="shrink-0 text-slate-400" aria-label="Conta fixa" />}
        </div>
        <div className="truncate text-[11.5px] text-slate-400 md:hidden">
          <span className={cx(sit[0] === "atrasado" && "font-medium text-rose-500")}>{pago ? sit[1].toLowerCase() : (sit[0] === "atrasado" ? "venceu " : "vence ") + dataCurta(data)}</span>
          {" · "}
          {x.categoria}
        </div>
      </button>

      <span className="hidden min-w-0 items-center gap-2 text-slate-600 md:flex dark:text-slate-300">
        <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: corCat(x.categoria) }} />
        <span className="truncate">{x.categoria}</span>
      </span>
      <span className={cx(SO_XL, "truncate text-slate-500")}>{(despesa ? x.forma : x.responsavel) || "—"}</span>
      <span className="hidden md:block">
        <span className={cx("inline-flex max-w-full truncate rounded-md px-1.5 py-0.5 text-[11px] font-medium ring-1 ring-inset", CORES_SITUACAO[sit[0]])}>{sit[1]}</span>
      </span>

      <span className={cx("num text-right font-semibold", pago ? "text-slate-400 dark:text-slate-500" : despesa ? "" : "text-emerald-600 dark:text-emerald-400")}>{brl(x.valor)}</span>

      <span className="hidden justify-end gap-0.5 opacity-0 transition group-hover:opacity-100 xl:flex">
        {!selecionando && (
          <>
            <AcaoIcone titulo="Editar" onClick={() => abrirForm(colecao, x)}>
              <Pencil size={13.5} />
            </AcaoIcone>
            <AcaoIcone titulo="Duplicar" onClick={() => app.gravar(salvarLancamento(colecao, { ...x, id: null, status: "pendente", recId: null, rendaId: null, criadoEm: null }), "Duplicado")}>
              <Copy size={13.5} />
            </AcaoIcone>
            <AcaoIcone titulo="Excluir" perigo onClick={() => app.excluirComDesfazer(excluir(colecao, x.id), `“${x.descricao}” excluída`)}>
              <Trash2 size={13.5} />
            </AcaoIcone>
          </>
        )}
      </span>
    </div>
  );
}

function AcaoIcone({ titulo, perigo, children, ...p }) {
  return (
    <button
      type="button"
      title={titulo}
      aria-label={titulo}
      className={cx("rounded-md p-1 text-slate-400 hover:bg-slate-200/70 dark:hover:bg-slate-700", perigo ? "hover:text-rose-600" : "hover:text-slate-700 dark:hover:text-slate-200")}
      {...p}
    >
      {children}
    </button>
  );
}
