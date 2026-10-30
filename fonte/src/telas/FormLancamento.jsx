import { useState } from "react";
import { Trash2 } from "lucide-react";
import { useApp } from "../contexto.jsx";
import { salvarLancamento, excluir } from "../dados/acoes.js";
import { sugerirCategoria } from "../lib/categorias.js";
import { hoje } from "../lib/datas.js";
import { PAGO, PENDENTE } from "../lib/calculos.js";
import { Abas, Botao, Campo, CampoValor, Modal, Selecao, classeEntrada } from "../ui/base.jsx";

const MAXIMO = 10_000_000;

export default function FormLancamento({ colecao, item, aoFechar }) {
  const { dados, gravar, excluirComDesfazer } = useApp();
  const despesa = colecao === "despesas";
  const cfg = dados.config;
  const categorias = despesa ? cfg.categoriasDespesa : cfg.categoriasReceita;
  const campoData = despesa ? "vencimento" : "data";
  const campoPago = despesa ? "pagoEm" : "recebidoEm";

  const [f, setF] = useState(() => ({
    descricao: "",
    categoria: "",
    responsavel: "",
    valor: NaN,
    status: PENDENTE,
    forma: "",
    obs: "",
    [campoData]: hoje(),
    [campoPago]: "",
    ...(item || {}),
  }));
  const [catManual, setCatManual] = useState(!!item);
  const [erros, setErros] = useState({});
  const muda = (k) => (e) => setF((x) => ({ ...x, [k]: e?.target ? e.target.value : e }));

  function aoDescrever(e) {
    const descricao = e.target.value;
    setF((x) => {
      const n = { ...x, descricao };
      if (despesa && !catManual) n.categoria = sugerirCategoria(descricao, categorias) || x.categoria;
      return n;
    });
  }

  function salvar() {
    const er = {};
    if (!f.descricao.trim()) er.descricao = "Informe uma descrição.";
    if (!(f.valor > 0)) er.valor = "Informe um valor maior que zero.";
    else if (f.valor > MAXIMO) er.valor = "Valor alto demais — confira os dígitos.";
    if (!/^\d{4}-\d{2}-\d{2}$/.test(f[campoData] || "")) er.data = "Informe uma data válida.";
    setErros(er);
    if (Object.keys(er).length) return;
    const final = { ...f, descricao: f.descricao.trim(), categoria: f.categoria || "Outros" };
    gravar(salvarLancamento(colecao, final), item ? "Alterações salvas" : despesa ? "Despesa adicionada" : "Receita adicionada");
    aoFechar();
  }

  return (
    <Modal
      titulo={(item ? "Editar " : "Nova ") + (despesa ? "despesa" : "receita")}
      aoFechar={aoFechar}
      rodape={
        <>
          {item && (
            <Botao
              variante="perigoSuave"
              className="mr-auto"
              onClick={() => {
                excluirComDesfazer(excluir(colecao, item.id), `“${item.descricao}” excluída`);
                aoFechar();
              }}
            >
              <Trash2 size={16} /> Excluir
            </Botao>
          )}
          <Botao variante="secundario" onClick={aoFechar}>
            Cancelar
          </Botao>
          <Botao onClick={salvar}>Salvar</Botao>
        </>
      }
    >
      <form
        className="grid gap-4"
        onSubmit={(e) => {
          e.preventDefault();
          salvar();
        }}
      >
        <Abas
          className="flex w-full [&>button]:flex-1"
          abas={[
            [PENDENTE, despesa ? "A pagar" : "A receber"],
            [PAGO, despesa ? "Paga" : "Recebida"],
          ]}
          valor={f.status}
          aoMudar={(s) => setF((x) => ({ ...x, status: s, [campoPago]: s === PAGO ? x[campoPago] || hoje() : "" }))}
        />
        <Campo rotulo="Descrição" erro={erros.descricao}>
          <input autoFocus className={classeEntrada} value={f.descricao} onChange={aoDescrever} placeholder={despesa ? "Ex.: Conta de luz" : "Ex.: Salário"} maxLength={120} />
        </Campo>
        <div className="grid grid-cols-2 gap-3">
          <Campo rotulo="Valor" erro={erros.valor}>
            <CampoValor valor={f.valor} aoMudar={muda("valor")} />
          </Campo>
          <Campo rotulo={despesa ? "Vencimento" : "Data"} erro={erros.data}>
            <input type="date" className={classeEntrada} value={f[campoData]} onChange={muda(campoData)} />
          </Campo>
        </div>
        {f.status === PAGO && (
          <Campo rotulo={despesa ? "Pago em" : "Recebido em"}>
            <input type="date" className={classeEntrada} value={f[campoPago]} onChange={muda(campoPago)} />
          </Campo>
        )}
        <div className="grid grid-cols-2 gap-3">
          <Campo rotulo="Categoria" dica={despesa && !catManual && f.categoria ? "Sugerida pela descrição" : null}>
            <Selecao
              opcoes={categorias.includes(f.categoria) || !f.categoria ? categorias : [...categorias, f.categoria]}
              vazio="Escolha…"
              value={f.categoria}
              onChange={(e) => {
                setCatManual(true);
                muda("categoria")(e);
              }}
            />
          </Campo>
          <Campo rotulo="Responsável">
            <Selecao opcoes={cfg.responsaveis} vazio="—" value={f.responsavel} onChange={muda("responsavel")} />
          </Campo>
        </div>
        {despesa && (
          <Campo rotulo="Forma de pagamento">
            <Selecao opcoes={cfg.formasPagamento} vazio="—" value={f.forma} onChange={muda("forma")} />
          </Campo>
        )}
        <Campo rotulo="Observação">
          <textarea rows={2} className={classeEntrada} value={f.obs} onChange={muda("obs")} maxLength={500} />
        </Campo>
        <button type="submit" className="hidden" />
      </form>
    </Modal>
  );
}
