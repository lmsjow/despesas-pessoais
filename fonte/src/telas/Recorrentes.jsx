import { useMemo, useState } from "react";
import { CalendarPlus, Plus, Repeat, Layers, Pencil, PauseCircle } from "lucide-react";
import { useApp } from "../contexto.jsx";
import { excluirRecorrente, gerar, salvarRecorrente } from "../dados/acoes.js";
import { brl, somar } from "../lib/dinheiro.js";
import { mesesEntre, nomeMes, somarMeses } from "../lib/datas.js";
import { gerarLancamentos, parcelaNoMes } from "../lib/gerar.js";
import { Abas, Botao, BotaoIcone, Campo, CampoValor, Cartao, Confirmar, Interruptor, Modal, Selecao, Selo, Vazio, classeEntrada } from "../ui/base.jsx";

export default function Recorrentes() {
  const { dados, calc } = useApp();
  const [editar, setEditar] = useState(null);
  const [gerarAberto, setGerarAberto] = useState(false);
  const lista = Object.values(dados.recorrentes).sort((a, b) => a.descricao.localeCompare(b.descricao));
  const fixas = lista.filter((r) => r.tipo !== "parcelada");
  const parceladas = lista.filter((r) => r.tipo === "parcelada");
  const ativasNoMes = lista.filter((r) => parcelaNoMes(r, calc.atual) !== null);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="max-w-xl text-sm text-slate-500">
          Contas que se repetem todo mês e compras parceladas. Use <b>Gerar meses</b> para criar os lançamentos — o app nunca duplica uma conta que já existe.
        </p>
        <div className="flex gap-2">
          <Botao variante="secundario" onClick={() => setGerarAberto(true)}>
            <CalendarPlus size={17} /> Gerar meses
          </Botao>
          <Botao onClick={() => setEditar({})}>
            <Plus size={17} /> Nova
          </Botao>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <Cartao className="p-4">
          <div className="text-xs text-slate-500">Fixas por mês</div>
          <div className="num mt-0.5 text-lg font-bold">{brl(somar(fixas.filter((r) => r.ativo !== false)))}</div>
        </Cartao>
        <Cartao className="p-4">
          <div className="text-xs text-slate-500">Parcelas em {nomeMes(calc.atual, true)}</div>
          <div className="num mt-0.5 text-lg font-bold">{brl(somar(parceladas.filter((r) => parcelaNoMes(r, calc.atual) !== null)))}</div>
        </Cartao>
        <Cartao className="col-span-2 p-4 sm:col-span-1">
          <div className="text-xs text-slate-500">Comprometido neste mês</div>
          <div className="num mt-0.5 text-lg font-bold">{brl(somar(ativasNoMes))}</div>
        </Cartao>
      </div>

      {lista.length === 0 ? (
        <Cartao>
          <Vazio icone={<Repeat size={24} />} titulo="Nenhuma conta fixa ainda" texto="Cadastre aluguel, escola, plano de saúde, parcelas…" acao={<Botao onClick={() => setEditar({})}>Cadastrar</Botao>} />
        </Cartao>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          <Grupo titulo="Fixas mensais" icone={<Repeat size={16} />} itens={fixas} aoEditar={setEditar} atual={calc.atual} />
          <Grupo titulo="Parceladas" icone={<Layers size={16} />} itens={parceladas} aoEditar={setEditar} atual={calc.atual} />
        </div>
      )}

      {editar && <FormRecorrente item={editar.id ? editar : null} aoFechar={() => setEditar(null)} />}
      {gerarAberto && <ModalGerar aoFechar={() => setGerarAberto(false)} />}
    </div>
  );
}

function Grupo({ titulo, icone, itens, aoEditar, atual }) {
  return (
    <Cartao className="overflow-hidden">
      <div className="flex items-center gap-2 border-b border-slate-100 px-4 py-3 text-sm font-semibold dark:border-slate-800">
        {icone} {titulo} <span className="font-normal text-slate-400">· {itens.length}</span>
      </div>
      {itens.length === 0 ? (
        <p className="px-4 py-6 text-center text-sm text-slate-500">Nenhuma.</p>
      ) : (
        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {itens.map((r) => {
            const p = r.tipo === "parcelada" ? parcelaNoMes(r, atual) : null;
            const terminou = r.tipo === "parcelada" && atual > somarMeses(r.inicio, (r.numParcelas || 1) - 1);
            const comecaDepois = r.inicio > atual;
            return (
              <button key={r.id} onClick={() => aoEditar(r)} className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-slate-50 dark:hover:bg-slate-800/40">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 truncate text-sm font-medium">
                    {r.descricao}
                    {r.ativo === false && (
                      <Selo>
                        <PauseCircle size={11} /> pausada
                      </Selo>
                    )}
                  </div>
                  <div className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                    <span>dia {r.diaVencimento || 5}</span>
                    <span>{r.categoria}</span>
                    {r.tipo === "parcelada" &&
                      (terminou ? (
                        <Selo cor="verde">quitada</Selo>
                      ) : comecaDepois ? (
                        <span>começa em {nomeMes(r.inicio, true)}</span>
                      ) : (
                        <Selo cor="azul">
                          {p}/{r.numParcelas} · faltam {r.numParcelas - p}
                        </Selo>
                      ))}
                  </div>
                  {r.tipo === "parcelada" && !comecaDepois && (
                    <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                      <div className="h-full rounded-full bg-sky-500" style={{ width: `${Math.min(100, ((terminou ? r.numParcelas : p) / r.numParcelas) * 100)}%` }} />
                    </div>
                  )}
                </div>
                <div className="num text-sm font-semibold">{brl(r.valor)}</div>
                <Pencil size={14} className="text-slate-400" />
              </button>
            );
          })}
        </div>
      )}
    </Cartao>
  );
}

function FormRecorrente({ item, aoFechar }) {
  const { dados, calc, gravar } = useApp();
  const cfg = dados.config;
  const [f, setF] = useState(() => ({
    descricao: "",
    valor: NaN,
    categoria: "",
    responsavel: "",
    forma: "",
    tipo: "fixa",
    numParcelas: 2,
    inicio: calc.atual,
    fim: "",
    diaVencimento: 5,
    ativo: true,
    obs: "",
    ...(item || {}),
  }));
  const [atualizar, setAtualizar] = useState(true);
  const [erros, setErros] = useState({});
  const [excluirAberto, setExcluirAberto] = useState(false);
  const [excluirPendentes, setExcluirPendentes] = useState(true);
  const muda = (k) => (e) => setF((x) => ({ ...x, [k]: e?.target ? e.target.value : e }));

  function salvar() {
    const er = {};
    if (!f.descricao.trim()) er.descricao = "Informe uma descrição.";
    if (!(f.valor > 0)) er.valor = "Informe um valor maior que zero.";
    if (!/^\d{4}-\d{2}$/.test(f.inicio || "")) er.inicio = "Informe o mês.";
    const dia = parseInt(f.diaVencimento, 10);
    if (!(dia >= 1 && dia <= 31)) er.dia = "Entre 1 e 31.";
    const n = parseInt(f.numParcelas, 10);
    if (f.tipo === "parcelada" && !(n >= 1 && n <= 480)) er.parcelas = "Entre 1 e 480.";
    if (f.tipo === "fixa" && f.fim && f.fim < f.inicio) er.fim = "Antes do início.";
    setErros(er);
    if (Object.keys(er).length) return;
    const rec = {
      ...f,
      descricao: f.descricao.trim(),
      categoria: f.categoria || "Outros",
      diaVencimento: dia,
      numParcelas: f.tipo === "parcelada" ? n : null,
      fim: f.tipo === "fixa" && f.fim ? f.fim : null,
    };
    gravar(salvarRecorrente(dados, rec, !!item && atualizar), item ? "Conta fixa atualizada" : "Conta fixa cadastrada");
    aoFechar();
  }

  const pendentes = item ? Object.values(dados.despesas).filter((d) => d.recId === item.id && d.status !== "pago" && d.mes >= calc.atual).length : 0;

  return (
    <Modal
      titulo={item ? "Editar conta fixa" : "Nova conta fixa"}
      aoFechar={aoFechar}
      rodape={
        <>
          {item && (
            <Botao variante="perigoSuave" className="mr-auto" onClick={() => setExcluirAberto(true)}>
              Excluir
            </Botao>
          )}
          <Botao variante="secundario" onClick={aoFechar}>
            Cancelar
          </Botao>
          <Botao onClick={salvar}>Salvar</Botao>
        </>
      }
    >
      <div className="grid gap-4">
        <Abas
          className="flex w-full [&>button]:flex-1"
          abas={[
            ["fixa", "Fixa mensal"],
            ["parcelada", "Parcelada"],
          ]}
          valor={f.tipo}
          aoMudar={muda("tipo")}
        />
        <Campo rotulo="Descrição" erro={erros.descricao}>
          <input autoFocus className={classeEntrada} value={f.descricao} onChange={muda("descricao")} placeholder="Ex.: Escola" maxLength={80} />
        </Campo>
        <div className="grid grid-cols-2 gap-3">
          <Campo rotulo={f.tipo === "parcelada" ? "Valor da parcela" : "Valor mensal"} erro={erros.valor}>
            <CampoValor valor={f.valor} aoMudar={muda("valor")} />
          </Campo>
          <Campo rotulo="Dia do vencimento" erro={erros.dia}>
            <input type="number" min={1} max={31} inputMode="numeric" className={classeEntrada} value={f.diaVencimento} onChange={muda("diaVencimento")} />
          </Campo>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Campo rotulo={f.tipo === "parcelada" ? "Mês da 1ª parcela" : "A partir de"} erro={erros.inicio}>
            <input type="month" className={classeEntrada} value={f.inicio} onChange={muda("inicio")} />
          </Campo>
          {f.tipo === "parcelada" ? (
            <Campo rotulo="Nº de parcelas" erro={erros.parcelas} dica={f.inicio && parseInt(f.numParcelas, 10) > 0 ? `Última em ${nomeMes(somarMeses(f.inicio, parseInt(f.numParcelas, 10) - 1), true)}` : null}>
              <input type="number" min={1} inputMode="numeric" className={classeEntrada} value={f.numParcelas} onChange={muda("numParcelas")} />
            </Campo>
          ) : (
            <Campo rotulo="Até (opcional)" erro={erros.fim}>
              <input type="month" className={classeEntrada} value={f.fim || ""} onChange={muda("fim")} />
            </Campo>
          )}
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Campo rotulo="Categoria">
            <Selecao opcoes={cfg.categoriasDespesa} vazio="Escolha…" value={f.categoria} onChange={muda("categoria")} />
          </Campo>
          <Campo rotulo="Responsável">
            <Selecao opcoes={cfg.responsaveis} vazio="—" value={f.responsavel} onChange={muda("responsavel")} />
          </Campo>
        </div>
        <Campo rotulo="Forma de pagamento">
          <Selecao opcoes={cfg.formasPagamento} vazio="—" value={f.forma} onChange={muda("forma")} />
        </Campo>
        {f.tipo === "fixa" && <Interruptor marcado={f.ativo !== false} aoMudar={(v) => setF((x) => ({ ...x, ativo: v }))} rotulo="Ativa" descricao="Desligue para parar de gerar esta conta." />}
        {item && pendentes > 0 && (
          <Interruptor
            marcado={atualizar}
            aoMudar={setAtualizar}
            rotulo={`Atualizar as ${pendentes} conta(s) em aberto`}
            descricao={`Aplica valor, categoria e forma de pagamento às contas não pagas a partir de ${nomeMes(calc.atual, true)}.`}
          />
        )}
      </div>
      {excluirAberto && (
        <Confirmar
          titulo="Excluir conta fixa"
          perigo
          rotulo="Excluir"
          texto={`“${item.descricao}” deixará de ser gerada nos próximos meses. Contas já pagas continuam no histórico.`}
          aoConfirmar={() => {
            gravar(excluirRecorrente(dados, item.id, excluirPendentes), "Conta fixa excluída");
            aoFechar();
          }}
          aoFechar={() => setExcluirAberto(false)}
        >
          {pendentes > 0 && (
            <div className="mt-4">
              <Interruptor marcado={excluirPendentes} aoMudar={setExcluirPendentes} rotulo={`Excluir também as ${pendentes} conta(s) em aberto`} />
            </div>
          )}
        </Confirmar>
      )}
    </Modal>
  );
}

function ModalGerar({ aoFechar }) {
  const { dados, calc, gravar } = useApp();
  const [de, setDe] = useState(calc.atual);
  const [ate, setAte] = useState(somarMeses(calc.atual, 11));
  const valido = /^\d{4}-\d{2}$/.test(de) && /^\d{4}-\d{2}$/.test(ate) && ate >= de && mesesEntre(de, ate) <= 60;
  const previa = useMemo(() => (valido ? gerarLancamentos(dados, de, ate) : null), [dados, de, ate, valido]);
  const nd = previa ? Object.keys(previa.despesas).length : 0;
  const nr = previa ? Object.keys(previa.receitas).length : 0;

  return (
    <Modal
      titulo="Gerar lançamentos dos meses"
      aoFechar={aoFechar}
      rodape={
        <>
          <Botao variante="secundario" onClick={aoFechar}>
            Cancelar
          </Botao>
          <Botao
            disabled={!valido || nd + nr === 0}
            onClick={() => {
              gravar(gerar(dados, de, ate), `${nd + nr} lançamento(s) criados`);
              aoFechar();
            }}
          >
            Gerar {nd + nr > 0 ? nd + nr : ""}
          </Botao>
        </>
      }
    >
      <p className="mb-4 text-sm text-slate-600 dark:text-slate-300">Cria as contas fixas, parcelas e salários de cada mês do período. O que já existe não é duplicado.</p>
      <div className="grid grid-cols-2 gap-3">
        <Campo rotulo="De">
          <input type="month" className={classeEntrada} value={de} onChange={(e) => setDe(e.target.value)} />
        </Campo>
        <Campo rotulo="Até">
          <input type="month" className={classeEntrada} value={ate} onChange={(e) => setAte(e.target.value)} />
        </Campo>
      </div>
      <div className="mt-4 rounded-2xl bg-slate-50 p-4 text-sm dark:bg-slate-800/60">
        {!valido ? (
          <span className="text-rose-600">Escolha um período válido (até 5 anos).</span>
        ) : nd + nr === 0 ? (
          <span className="text-slate-500">Tudo já foi gerado nesse período.</span>
        ) : (
          <>
            Serão criadas <b>{nd}</b> despesa(s) somando <b className="num">{brl(somar(Object.values(previa.despesas)))}</b> e <b>{nr}</b> receita(s) de salário somando{" "}
            <b className="num">{brl(somar(Object.values(previa.receitas)))}</b>.
          </>
        )}
      </div>
    </Modal>
  );
}
