import { brl, brlCurto } from "../lib/dinheiro.js";
import { useApp } from "../contexto.jsx";

/** Cores de eixo/grade que funcionam nos dois temas. */
export function useCoresGrafico() {
  const { tema } = useApp();
  const escuro = tema === "escuro";
  return {
    grade: escuro ? "#27272a" : "#ececee",
    texto: escuro ? "#a1a1aa" : "#71717a",
    receita: "#10b981",
    despesa: escuro ? "#fb7185" : "#f43f5e",
    projetado: escuro ? "#818cf8" : "#6366f1",
    realizado: "#10b981",
    cursor: escuro ? "rgba(148,163,184,.08)" : "rgba(15,23,42,.04)",
  };
}

export const eixo = (cores) => ({ tick: { fontSize: 11, fill: cores.texto }, axisLine: false, tickLine: false });
export const formatoEixo = (v) => {
  const curto = brlCurto(v);
  if (curto.includes("•")) return curto;
  return Math.abs(v) >= 1000 ? curto.replace(/^R\$\s/, "").replace(" mil", "k") : Math.round(v).toLocaleString("pt-BR");
};

export function DicaGrafico({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs shadow-lg dark:border-slate-700 dark:bg-slate-900">
      <div className="mb-1 font-semibold">{label}</div>
      {payload
        .filter((p) => p.value != null)
        .map((p) => (
          <div key={p.dataKey} className="flex justify-between gap-4">
            <span style={{ color: p.color || p.stroke }}>{p.name}</span>
            <span className="num font-semibold">{brl(p.value)}</span>
          </div>
        ))}
    </div>
  );
}
