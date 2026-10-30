import { useState } from "react";
import { Trash2 } from "lucide-react";
import { useApp } from "../contexto.jsx";
import { ajustarSaldo, excluir } from "../dados/acoes.js";
import { brl } from "../lib/dinheiro.js";
import { dataBR } from "../lib/datas.js";
import { Botao, BotaoIcone, Campo, CampoValor, Modal, classeEntrada, cx } from "../ui/base.jsx";

export default function ModalAjuste({ aoFechar }) {
  const { calc, dados, gravar, excluirComDesfazer } = useApp();
  const [novo, setNovo] = useState(calc.saldoAtual);
  const [obs, setObs] = useState("");
  const dif = isFinite(novo) ? novo - calc.saldoAtual : 0;
  const historico = Object.values(dados.ajustes).sort((a, b) => (b.data || "").localeCompare(a.data || "") || (b.criadoEm || 0) - (a.criadoEm || 0));

  return (
    <Modal
      titulo="Ajustar saldo em conta"
      aoFechar={aoFechar}
      rodape={
        <>
          <Botao variante="secundario" onClick={aoFechar}>
            Cancelar
          </Botao>
          <Botao
            disabled={!isFinite(novo) || Math.abs(dif) < 0.005}
            onClick={() => {
              gravar(ajustarSaldo(calc.saldoAtual, novo, obs.trim()), "Saldo ajustado");
              aoFechar();
            }}
          >
            Salvar ajuste
          </Botao>
        </>
      }
    >
      <p className="mb-4 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
        Informe quanto há hoje na conta do banco. A diferença fica registrada como ajuste (não entra como receita nem despesa).
      </p>
      <div className="mb-4 rounded-2xl bg-slate-50 p-3 text-sm dark:bg-slate-800/60">
        Saldo calculado pelo app: <b className="num">{brl(calc.saldoAtual)}</b>
      </div>
      <div className="grid gap-3">
        <Campo rotulo="Saldo real no banco">
          <CampoValor valor={novo} aoMudar={setNovo} autoFocus />
        </Campo>
        {Math.abs(dif) >= 0.005 && (
          <div className={cx("text-sm font-medium", dif > 0 ? "text-emerald-600" : "text-rose-600")}>
            Ajuste de {dif > 0 ? "+" : "−"}
            {brl(Math.abs(dif))}
          </div>
        )}
        <Campo rotulo="Observação (opcional)">
          <input className={classeEntrada} value={obs} onChange={(e) => setObs(e.target.value)} placeholder="Ex.: conferido no app do banco" maxLength={120} />
        </Campo>
      </div>
      {historico.length > 0 && (
        <div className="mt-6">
          <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">Ajustes anteriores</div>
          <div className="divide-y divide-slate-100 rounded-2xl border border-slate-100 dark:divide-slate-800 dark:border-slate-800">
            {historico.slice(0, 12).map((a) => (
              <div key={a.id} className="flex items-center gap-3 px-3 py-2 text-sm">
                <span className="w-20 shrink-0 text-xs text-slate-500">{dataBR(a.data)}</span>
                <span className="min-w-0 flex-1 truncate text-xs text-slate-500">{a.obs || (a.saldoNovo != null ? `saldo: ${brl(a.saldoNovo)}` : "")}</span>
                <span className={cx("num font-semibold", a.valor >= 0 ? "text-emerald-600" : "text-rose-600")}>
                  {a.valor >= 0 ? "+" : "−"}
                  {brl(Math.abs(a.valor))}
                </span>
                <BotaoIcone titulo="Excluir ajuste" className="h-7 w-7" onClick={() => excluirComDesfazer(excluir("ajustes", a.id), "Ajuste excluído")}>
                  <Trash2 size={14} />
                </BotaoIcone>
              </div>
            ))}
          </div>
        </div>
      )}
    </Modal>
  );
}
