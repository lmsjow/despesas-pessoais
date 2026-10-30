import { useRef, useState } from "react";
import { Download, Upload, Plus, X, LogOut, Save, Trash2 } from "lucide-react";
import { useApp } from "../contexto.jsx";
import { salvarConfig } from "../dados/acoes.js";
import { lerBackup } from "../lib/migrar.js";
import { novoId } from "../lib/modelo.js";
import { brl, somar } from "../lib/dinheiro.js";
import { hoje } from "../lib/datas.js";
import { Botao, BotaoIcone, Campo, CampoValor, Cartao, Confirmar, Interruptor, classeEntrada, cx } from "../ui/base.jsx";

function baixarBackup(dados) {
  const blob = new Blob([JSON.stringify(dados, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `casa-e-cofre-backup-${hoje()}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export default function Configuracoes() {
  const { dados, gravar, armazenamento, avisar, usuario, aoSair } = useApp();
  const [c, setC] = useState(() => structuredClone(dados.config));
  const [aplicar, setAplicar] = useState(true);
  const [importar, setImportar] = useState(null);
  const arquivo = useRef();
  const alterado = JSON.stringify(c) !== JSON.stringify(dados.config);
  const set = (k, v) => setC((x) => ({ ...x, [k]: v }));

  const salariosMudaram = JSON.stringify(c.rendaFixa) !== JSON.stringify(dados.config.rendaFixa);
  const erroLimites = c.limiteAtencao >= c.limiteRisco ? "O limite de atenção deve ser menor que o de risco." : null;
  const erroRenda = c.rendaFixa.some((r) => !r.responsavel.trim() || !(r.valor > 0)) ? "Preencha nome e valor de cada salário." : null;

  function salvar() {
    if (erroLimites || erroRenda || !isFinite(c.saldoInicial)) return avisar(erroLimites || erroRenda || "Saldo inicial inválido.", { tipo: "erro" });
    const limpa = (l) => [...new Set(l.map((s) => s.trim()).filter(Boolean))];
    const cfg = {
      ...c,
      categoriasDespesa: limpa(c.categoriasDespesa),
      categoriasReceita: limpa(c.categoriasReceita),
      responsaveis: limpa(c.responsaveis),
      formasPagamento: limpa(c.formasPagamento),
      rendaFixa: c.rendaFixa.map((r) => ({ ...r, responsavel: r.responsavel.trim(), dia: Math.min(31, Math.max(1, parseInt(r.dia, 10) || 5)) })),
    };
    setC(cfg);
    gravar(salvarConfig(dados, cfg, salariosMudaram && aplicar), "Configurações salvas");
  }

  async function lerArquivo(e) {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (!f) return;
    try {
      const novos = lerBackup(await f.text());
      setImportar({ nome: f.name, dados: novos });
    } catch (x) {
      avisar(x.message, { tipo: "erro" });
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-4 pb-16">
      <Secao titulo="Saldo de partida" texto="O saldo da conta no dia em que vocês começaram a usar o app.">
        <div className="grid gap-3 sm:grid-cols-2">
          <Campo rotulo="Saldo inicial">
            <CampoValor valor={c.saldoInicial} aoMudar={(v) => set("saldoInicial", v)} />
          </Campo>
          <Campo rotulo="Data inicial">
            <input type="date" className={classeEntrada} value={c.dataInicial || ""} onChange={(e) => set("dataInicial", e.target.value)} />
          </Campo>
        </div>
      </Secao>

      <Secao titulo="Salários" texto="Usados para gerar as receitas de cada mês.">
        <div className="space-y-2">
          {c.rendaFixa.map((r, i) => (
            <div key={r.id} className="grid grid-cols-[1fr_4.5rem_auto] items-end gap-2 border-b border-slate-100 pb-3 last:border-0 sm:grid-cols-[1fr_8.5rem_4.5rem_auto] sm:border-0 sm:pb-0 dark:border-slate-800">
              <Campo rotulo={i === 0 ? "Nome" : ""} className="col-span-3 sm:col-span-1">
                <input
                  className={classeEntrada}
                  value={r.responsavel}
                  onChange={(e) => set("rendaFixa", c.rendaFixa.map((x) => (x.id === r.id ? { ...x, responsavel: e.target.value } : x)))}
                />
              </Campo>
              <Campo rotulo={i === 0 ? "Valor" : ""}>
                <CampoValor valor={r.valor} aoMudar={(v) => set("rendaFixa", c.rendaFixa.map((x) => (x.id === r.id ? { ...x, valor: v } : x)))} />
              </Campo>
              <Campo rotulo={i === 0 ? "Dia" : ""}>
                <input
                  type="number"
                  min={1}
                  max={31}
                  className={classeEntrada}
                  value={r.dia || 5}
                  onChange={(e) => set("rendaFixa", c.rendaFixa.map((x) => (x.id === r.id ? { ...x, dia: e.target.value } : x)))}
                />
              </Campo>
              <BotaoIcone titulo="Remover salário" className="mb-1 hover:!text-rose-600" onClick={() => set("rendaFixa", c.rendaFixa.filter((x) => x.id !== r.id))}>
                <Trash2 size={16} />
              </BotaoIcone>
            </div>
          ))}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
            <Botao variante="secundario" tamanho="sm" onClick={() => set("rendaFixa", [...c.rendaFixa, { id: novoId(), responsavel: "", valor: NaN, dia: 5 }])}>
              <Plus size={15} /> Adicionar salário
            </Botao>
            <span className="text-sm text-slate-500">
              Total: <b className="num text-slate-800 dark:text-slate-100">{brl(somar(c.rendaFixa.filter((r) => r.valor > 0)))}</b>
            </span>
          </div>
          {erroRenda && <p className="text-xs text-rose-600">{erroRenda}</p>}
          {salariosMudaram && (
            <div className="pt-2">
              <Interruptor marcado={aplicar} aoMudar={setAplicar} rotulo="Atualizar salários em aberto" descricao="Aplica os novos valores às receitas de salário ainda não recebidas, deste mês em diante." />
            </div>
          )}
        </div>
      </Secao>

      <Secao titulo="Alertas e metas">
        <div className="grid gap-3 sm:grid-cols-2">
          <Campo rotulo="Atenção quando as despesas passarem de" dica="% da renda do mês">
            <Porcentagem valor={c.limiteAtencao} aoMudar={(v) => set("limiteAtencao", v)} />
          </Campo>
          <Campo rotulo="Risco quando passarem de" erro={erroLimites}>
            <Porcentagem valor={c.limiteRisco} aoMudar={(v) => set("limiteRisco", v)} />
          </Campo>
          <Campo rotulo="Reserva de emergência" dica="meses de despesas">
            <input type="number" min={1} max={24} className={classeEntrada} value={c.metaReservaMeses} onChange={(e) => set("metaReservaMeses", Math.max(1, parseInt(e.target.value, 10) || 1))} />
          </Campo>
          <Campo rotulo="Meta de poupança" dica="% da renda por mês">
            <Porcentagem valor={c.metaPoupancaPct} aoMudar={(v) => set("metaPoupancaPct", v)} />
          </Campo>
        </div>
      </Secao>

      <Secao titulo="Listas">
        <div className="space-y-5">
          <Lista rotulo="Categorias de despesa" itens={c.categoriasDespesa} aoMudar={(v) => set("categoriasDespesa", v)} />
          <Lista rotulo="Categorias de receita" itens={c.categoriasReceita} aoMudar={(v) => set("categoriasReceita", v)} />
          <Lista rotulo="Responsáveis" itens={c.responsaveis} aoMudar={(v) => set("responsaveis", v)} />
          <Lista rotulo="Formas de pagamento" itens={c.formasPagamento} aoMudar={(v) => set("formasPagamento", v)} />
        </div>
      </Secao>

      <Secao titulo="Backup" texto="Baixe uma cópia de todos os dados de vez em quando. Ao restaurar, o app baixa antes um backup do que está salvo agora.">
        <div className="flex flex-wrap gap-2">
          <Botao variante="secundario" onClick={() => baixarBackup(dados)}>
            <Download size={16} /> Baixar backup
          </Botao>
          <Botao variante="secundario" onClick={() => arquivo.current.click()}>
            <Upload size={16} /> Restaurar backup
          </Botao>
          <input ref={arquivo} type="file" accept="application/json,.json" className="hidden" onChange={lerArquivo} />
        </div>
      </Secao>

      <Secao titulo="Conta">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <span className="text-sm text-slate-600 dark:text-slate-300">{usuario.email}</span>
          <Botao variante="perigoSuave" onClick={aoSair}>
            <LogOut size={16} /> Sair
          </Botao>
        </div>
      </Secao>

      <div className={cx("fixed inset-x-0 bottom-20 z-30 flex justify-center px-4 transition lg:bottom-6 lg:pl-64", alterado ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-4 opacity-0")}>
        <div className="flex items-center gap-3 rounded-2xl bg-slate-900 px-4 py-2.5 text-sm text-white shadow-xl dark:bg-slate-100 dark:text-slate-900">
          Alterações não salvas
          <Botao variante="fantasma" tamanho="sm" className="text-white/80 hover:bg-white/10 dark:text-slate-600" onClick={() => setC(structuredClone(dados.config))}>
            Descartar
          </Botao>
          <Botao tamanho="sm" onClick={salvar}>
            <Save size={15} /> Salvar
          </Botao>
        </div>
      </div>

      {importar && (
        <Confirmar
          titulo="Restaurar backup"
          perigo
          rotulo="Substituir dados"
          texto={`Todos os dados atuais serão substituídos pelo conteúdo de “${importar.nome}” (${Object.keys(importar.dados.despesas).length} despesas, ${
            Object.keys(importar.dados.receitas).length
          } receitas). Um backup dos dados atuais será baixado antes.`}
          aoConfirmar={async () => {
            baixarBackup(dados);
            try {
              await armazenamento.substituirTudo(importar.dados);
              setC(structuredClone(importar.dados.config));
              avisar("Backup restaurado");
            } catch {
              avisar("Não foi possível restaurar o backup.", { tipo: "erro" });
            }
          }}
          aoFechar={() => setImportar(null)}
        />
      )}
    </div>
  );
}

function Secao({ titulo, texto, children }) {
  return (
    <Cartao className="p-5">
      <h2 className="font-semibold">{titulo}</h2>
      {texto && <p className="mt-0.5 text-sm text-slate-500">{texto}</p>}
      <div className="mt-4">{children}</div>
    </Cartao>
  );
}

function Porcentagem({ valor, aoMudar }) {
  return (
    <div className="relative">
      <input
        type="number"
        min={0}
        max={100}
        className={cx(classeEntrada, "pr-8")}
        value={Math.round((valor || 0) * 100)}
        onChange={(e) => aoMudar(Math.min(100, Math.max(0, parseInt(e.target.value, 10) || 0)) / 100)}
      />
      <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">%</span>
    </div>
  );
}

function Lista({ rotulo, itens, aoMudar }) {
  const [novo, setNovo] = useState("");
  const adicionar = () => {
    const v = novo.trim();
    if (v && !itens.includes(v)) aoMudar([...itens, v]);
    setNovo("");
  };
  return (
    <div>
      <div className="mb-2 text-[13px] font-medium text-slate-600 dark:text-slate-300">{rotulo}</div>
      <div className="flex flex-wrap gap-1.5">
        {itens.map((i) => (
          <span key={i} className="inline-flex items-center gap-1 rounded-full bg-slate-100 py-1 pl-3 pr-1 text-[13px] dark:bg-slate-800">
            {i}
            <button aria-label={`Remover ${i}`} onClick={() => aoMudar(itens.filter((x) => x !== i))} className="rounded-full p-0.5 text-slate-400 hover:bg-slate-200 hover:text-rose-600 dark:hover:bg-slate-700">
              <X size={13} />
            </button>
          </span>
        ))}
        <span className="inline-flex items-center">
          <input
            className="w-32 rounded-full border border-dashed border-slate-300 bg-transparent px-3 py-1 text-[13px] outline-none focus:border-emerald-500 dark:border-slate-600"
            placeholder="+ adicionar"
            value={novo}
            onChange={(e) => setNovo(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), adicionar())}
            onBlur={adicionar}
          />
        </span>
      </div>
    </div>
  );
}
