import { useMemo, useState } from "react";
import { Search, Plus, FileDown, CheckCheck, RotateCcw, Check, Copy, Trash2, Pencil, AlertTriangle, Inbox, Repeat } from "lucide-react";
import { useApp } from "../contexto.jsx";
import { useForm } from "./formContexto.js";
import { alternarStatus, excluir, marcarMes, salvarLancamento } from "../dados/acoes.js";
import { brl, somar } from "../lib/dinheiro.js";
import { dataCurta, hoje, nomeMes } from "../lib/datas.js";
import { PAGO } from "../lib/calculos.js";
import { gerarRelatorioPdf } from "../lib/relatorioPdf.js";
import { Abas, Botao, BotaoIcone, Cartao, Confirmar, SeletorMes, Selecao, Selo, Vazio, classeEntrada, cx } from "../ui/base.jsx";

export default function Lancamentos({ colecao }) {
  const app = useApp();
  const abrirForm = useForm();
  const despesa = colecao === "despesas";
  const campoData = despesa ? "vencimento" : "data";
  const [mes, setMes] = useState(app.calc.atual);
  const [status, setStatus] = useState("todos");
  const [busca, setBusca] = useState("");
  const [categoria, setCategoria] = useState("");
  const [confirmar, setConfirmar] = useState(null);

  const doMes = useMemo(
    () => Object.values(app.dados[colecao]).filter((x) => x.mes === mes).sort((a, b) => (a[campoData] || "").localeCompare(b[campoData] || "") || a.descricao.localeCompare(b.descricao)),
    [app.dados, colecao, mes, campoData],
  );
  const termo = busca.trim().toLowerCase();
  const lista = doMes.filter(
    (x) =>
      (status === "todos" || (status === "pago" ? x.status === PAGO : x.status !== PAGO)) &&
      (!categoria || x.categoria === categoria) &&
      (!termo || `${x.descricao} ${x.obs} ${x.responsavel} ${x.categoria}`.toLowerCase().includes(termo)),
  );

  const total = somar(doMes);
  const pago = somar(doMes.filter((x) => x.status === PAGO));
  const abertos = doMes.filter((x) => x.status !== PAGO).length;
  const atrasadas = despesa ? app.calc.atrasadas.despesas : app.calc.atrasadas.receitas;
  const categorias = despesa ? app.dados.config.categoriasDespesa : app.dados.config.categoriasReceita;
  const h = hoje();

  function pdf() {
    const r = gerarRelatorioPdf({
      itens: lista,
      mes,
      filtros: [status !== "todos" && (status === "pago" ? "Pagas" : "Em aberto"), categoria, termo && `busca “${busca.trim()}”`].filter(Boolean).join(" · "),
      saldoAtual: app.calc.saldoAtual,
      fimDoMes: app.calc.mesAtual?.saldoFim,
      ehMesAtual: mes === app.calc.atual,
    });
    if (r === "vazio") app.avisar("Não há despesas com esses filtros.", { tipo: "erro" });
    if (r === "bloqueado") app.avisar("O navegador bloqueou a janela do relatório. Permita pop-ups para este site.", { tipo: "erro" });
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <SeletorMes mes={mes} aoMudar={setMes} />
        <div className="flex gap-2">
          {despesa && (
            <Botao variante="secundario" onClick={pdf} title="Gerar relatório para imprimir ou salvar em PDF">
              <FileDown size={16} /> <span className="hidden sm:inline">PDF</span>
            </Botao>
          )}
          <span className="hidden lg:block">
            <Botao onClick={() => abrirForm(colecao, null)}>
              <Plus size={17} /> {despesa ? "Nova despesa" : "Nova receita"}
            </Botao>
          </span>
        </div>
      </div>

      {atrasadas.length > 0 && mes === app.calc.atual && (
        <Cartao className="border-amber-200 bg-amber-50/70 p-4 dark:border-amber-500/30 dark:bg-amber-500/5">
          <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-amber-800 dark:text-amber-300">
            <AlertTriangle size={17} /> {atrasadas.length} {despesa ? "conta(s) atrasada(s)" : "receita(s) não recebida(s)"} de meses anteriores ·{" "}
            {brl(despesa ? app.calc.atrasadas.totalDespesas : app.calc.atrasadas.totalReceitas)}
          </div>
          <div className="divide-y divide-amber-200/60 dark:divide-amber-500/20">
            {atrasadas.slice(0, 8).map((x) => (
              <Linha key={x.id} item={x} colecao={colecao} campoData={campoData} hoje={h} mostrarMes />
            ))}
          </div>
          {atrasadas.length > 8 && <p className="mt-2 text-xs text-amber-700">e mais {atrasadas.length - 8}…</p>}
        </Cartao>
      )}

      <div className="grid grid-cols-3 gap-3">
        <Resumo rotulo="Total do mês" valor={total} />
        <Resumo rotulo={despesa ? "Pago" : "Recebido"} valor={pago} cor="text-emerald-600 dark:text-emerald-400" />
        <Resumo rotulo={despesa ? "A pagar" : "A receber"} valor={total - pago} cor={despesa ? "text-rose-600 dark:text-rose-400" : "text-sky-600 dark:text-sky-400"} />
      </div>

      <Cartao className="overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-slate-100 p-3 sm:flex-row sm:items-center dark:border-slate-800">
          <div className="relative flex-1">
            <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input className={cx(classeEntrada, "py-2 pl-9")} placeholder="Buscar…" value={busca} onChange={(e) => setBusca(e.target.value)} />
          </div>
          <div className="flex flex-wrap gap-2">
            <Abas
              abas={[
                ["todos", "Todos"],
                ["aberto", "Em aberto"],
                ["pago", despesa ? "Pagos" : "Recebidos"],
              ]}
              valor={status}
              aoMudar={setStatus}
            />
            <Selecao className="py-1.5 text-sm sm:w-44" opcoes={categorias} vazio="Todas categorias" value={categoria} onChange={(e) => setCategoria(e.target.value)} />
          </div>
        </div>

        {lista.length === 0 ? (
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
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {lista.map((x) => (
              <Linha key={x.id} item={x} colecao={colecao} campoData={campoData} hoje={h} />
            ))}
          </div>
        )}

        {doMes.length > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 px-3 py-2.5 text-xs text-slate-500 dark:border-slate-800">
            <span>
              {lista.length} de {doMes.length} · filtrado: <b className="num text-slate-700 dark:text-slate-200">{brl(somar(lista))}</b>
            </span>
            <div className="flex gap-1">
              {abertos > 0 && (
                <Botao variante="fantasma" tamanho="sm" onClick={() => setConfirmar("pagar")}>
                  <CheckCheck size={15} /> {despesa ? "Pagar todas" : "Receber todas"}
                </Botao>
              )}
              {abertos < doMes.length && (
                <Botao variante="fantasma" tamanho="sm" onClick={() => setConfirmar("reabrir")}>
                  <RotateCcw size={15} /> Reabrir
                </Botao>
              )}
            </div>
          </div>
        )}
      </Cartao>

      {confirmar && (
        <Confirmar
          titulo={confirmar === "pagar" ? "Marcar tudo como " + (despesa ? "pago" : "recebido") : "Reabrir lançamentos"}
          texto={
            confirmar === "pagar"
              ? `${abertos} lançamento(s) em aberto de ${nomeMes(mes)} serão marcados como ${despesa ? "pagos" : "recebidos"} hoje.`
              : `${doMes.length - abertos} lançamento(s) de ${nomeMes(mes)} voltarão a ficar em aberto.`
          }
          aoConfirmar={() => app.gravar(marcarMes(app.dados, colecao, mes, confirmar === "pagar"), "Pronto!")}
          aoFechar={() => setConfirmar(null)}
        />
      )}
    </div>
  );
}

function Resumo({ rotulo, valor, cor }) {
  return (
    <Cartao className="px-3.5 py-3">
      <div className="text-xs text-slate-500">{rotulo}</div>
      <div className={cx("num mt-0.5 truncate text-[15px] font-semibold sm:text-lg", cor)}>{brl(valor)}</div>
    </Cartao>
  );
}

function Linha({ item: x, colecao, campoData, hoje: h, mostrarMes }) {
  const app = useApp();
  const abrirForm = useForm();
  const pago = x.status === PAGO;
  const vencida = !pago && x[campoData] && x[campoData] < h;
  const despesa = colecao === "despesas";
  return (
    <div className="group flex items-center gap-3 px-3 py-2.5 hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
      <button
        onClick={() => app.gravar(alternarStatus(colecao, x))}
        title={pago ? "Marcar como em aberto" : despesa ? "Marcar como paga" : "Marcar como recebida"}
        aria-label={pago ? "Marcar como em aberto" : "Marcar como paga"}
        className={cx(
          "flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 transition",
          pago ? "border-emerald-500 bg-emerald-500 text-white" : "border-slate-300 text-transparent hover:border-emerald-500 hover:text-emerald-500 dark:border-slate-600",
        )}
      >
        <Check size={16} strokeWidth={3} />
      </button>
      <button className="min-w-0 flex-1 text-left" onClick={() => abrirForm(colecao, x)}>
        <div className={cx("truncate text-[14.5px] font-medium", pago && "text-slate-500 line-through decoration-slate-300 dark:decoration-slate-600")}>{x.descricao}</div>
        <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-500">
          <span className={cx(vencida && "font-semibold text-rose-600 dark:text-rose-400")}>
            {mostrarMes ? nomeMes(x.mes, true) + " · " : ""}
            {vencida ? "venceu " : ""}
            {dataCurta(x[campoData])}
          </span>
          {x.categoria && <Selo>{x.categoria}</Selo>}
          {x.responsavel && <span className="hidden sm:inline">{x.responsavel}</span>}
          {x.recId && <Repeat size={12} className="text-slate-400" aria-label="Conta fixa" />}
        </div>
      </button>
      <div className={cx("num shrink-0 text-right text-[15px] font-semibold", despesa ? "text-slate-800 dark:text-slate-100" : "text-emerald-600 dark:text-emerald-400")}>{brl(x.valor)}</div>
      <div className="hidden shrink-0 gap-0.5 opacity-0 transition group-hover:opacity-100 sm:flex">
        <BotaoIcone titulo="Editar" onClick={() => abrirForm(colecao, x)} className="h-8 w-8">
          <Pencil size={15} />
        </BotaoIcone>
        <BotaoIcone
          titulo="Duplicar"
          className="h-8 w-8"
          onClick={() => app.gravar(salvarLancamento(colecao, { ...x, id: null, status: "pendente", recId: null, rendaId: null, criadoEm: null }), "Duplicado")}
        >
          <Copy size={15} />
        </BotaoIcone>
        <BotaoIcone titulo="Excluir" className="h-8 w-8 hover:!text-rose-600" onClick={() => app.excluirComDesfazer(excluir(colecao, x.id), `“${x.descricao}” excluída`)}>
          <Trash2 size={15} />
        </BotaoIcone>
      </div>
    </div>
  );
}
