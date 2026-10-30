import { useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { useApp } from "../contexto.jsx";
import { pagar } from "../dados/acoes.js";
import { brl, somar } from "../lib/dinheiro.js";
import { dataBR, dataCurta, hoje } from "../lib/datas.js";
import { Botao, Campo, CampoValor, Modal, classeEntrada, cx } from "../ui/base.jsx";

const ontem = () => {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return hoje(d);
};

/**
 * Confirma o pagamento (ou recebimento) de um ou vários lançamentos.
 * A data começa em hoje e pode ser ajustada; com um item só, o valor também.
 */
export default function ModalPagamento({ colecao, itens, aoFechar, aoConcluir }) {
  const { gravar } = useApp();
  const despesa = colecao === "despesas";
  const unico = itens.length === 1 ? itens[0] : null;
  const vencimento = unico ? (despesa ? unico.vencimento : unico.data) : null;
  const [data, setData] = useState(hoje());
  const [valor, setValor] = useState(unico ? unico.valor : NaN);
  const [erro, setErro] = useState("");

  const atalhos = [
    ["Hoje", hoje()],
    ["Ontem", ontem()],
    ...(vencimento && vencimento !== hoje() && vencimento !== ontem() && vencimento <= hoje() ? [[`No vencimento (${dataCurta(vencimento)})`, vencimento]] : []),
  ];

  function confirmar() {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(data)) return setErro("Informe a data.");
    if (data > hoje()) return setErro("A data não pode ser no futuro.");
    if (unico && !(valor > 0)) return setErro("Informe um valor maior que zero.");
    const texto = unico
      ? `“${unico.descricao}” ${despesa ? "paga" : "recebida"} em ${dataBR(data)}`
      : `${itens.length} ${despesa ? "contas pagas" : "receitas recebidas"} em ${dataBR(data)}`;
    gravar(pagar(colecao, itens, data, unico ? { [unico.id]: valor } : {}), texto);
    aoConcluir?.();
    aoFechar();
  }

  return (
    <Modal
      titulo={despesa ? (unico ? "Registrar pagamento" : `Pagar ${itens.length} contas`) : unico ? "Registrar recebimento" : `Receber ${itens.length} lançamentos`}
      aoFechar={aoFechar}
      rodape={
        <>
          <Botao variante="secundario" onClick={aoFechar}>
            Cancelar
          </Botao>
          <Botao onClick={confirmar}>
            <CheckCircle2 size={17} /> {despesa ? "Confirmar pagamento" : "Confirmar recebimento"}
          </Botao>
        </>
      }
    >
      <form
        className="grid gap-4"
        onSubmit={(e) => {
          e.preventDefault();
          confirmar();
        }}
      >
        {unico ? (
          <div className="rounded-2xl bg-slate-50 p-3 dark:bg-slate-800/60">
            <div className="font-medium">{unico.descricao}</div>
            <div className="text-xs text-slate-500">
              {despesa ? "Vencimento" : "Data prevista"}: {dataBR(vencimento)} · previsto {brl(unico.valor)}
            </div>
          </div>
        ) : (
          <div className="max-h-40 overflow-y-auto rounded-2xl bg-slate-50 p-3 text-sm dark:bg-slate-800/60">
            {itens.map((i) => (
              <div key={i.id} className="flex justify-between gap-3 py-0.5">
                <span className="truncate">{i.descricao}</span>
                <span className="num shrink-0">{brl(i.valor)}</span>
              </div>
            ))}
            <div className="mt-1 flex justify-between border-t border-slate-200 pt-1.5 font-semibold dark:border-slate-700">
              <span>Total</span>
              <span className="num">{brl(somar(itens))}</span>
            </div>
          </div>
        )}

        <Campo rotulo={despesa ? "Data do pagamento" : "Data do recebimento"}>
          <input type="date" max={hoje()} className={classeEntrada} value={data} onChange={(e) => setData(e.target.value)} />
        </Campo>
        <div className="-mt-2 flex flex-wrap gap-1.5">
          {atalhos.map(([r, d]) => (
            <button
              key={r}
              type="button"
              onClick={() => setData(d)}
              className={cx(
                "rounded-full px-3 py-1 text-xs font-medium ring-1 ring-inset transition",
                data === d ? "bg-emerald-600 text-white ring-emerald-600" : "text-slate-600 ring-slate-200 hover:bg-slate-100 dark:text-slate-300 dark:ring-slate-700 dark:hover:bg-slate-800",
              )}
            >
              {r}
            </button>
          ))}
        </div>

        {unico && (
          <Campo rotulo={despesa ? "Valor pago" : "Valor recebido"} dica={valor !== unico.valor && valor > 0 ? `Diferente do previsto (${brl(unico.valor)})` : null}>
            <CampoValor valor={valor} aoMudar={setValor} />
          </Campo>
        )}
        {erro && <p className="text-sm text-rose-600">{erro}</p>}
        <button type="submit" className="hidden" />
      </form>
    </Modal>
  );
}
