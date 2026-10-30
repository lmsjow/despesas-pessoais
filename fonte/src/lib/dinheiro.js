// Valores são guardados em reais com no máximo 2 casas, mas toda soma é feita
// em centavos inteiros para não acumular erro de ponto flutuante.

export const centavos = (v) => Math.round((Number(v) || 0) * 100);
export const reais = (c) => c / 100;
export const arred = (v) => reais(centavos(v));

/** Soma em centavos e devolve em reais. */
export function somar(lista, campo = "valor") {
  let c = 0;
  for (const item of lista) c += centavos(typeof campo === "function" ? campo(item) : item[campo]);
  return reais(c);
}

/**
 * Lê um valor digitado no padrão brasileiro.
 * "1.500" → 1500 · "1.500,90" → 1500.9 · "150,5" → 150.5 · "R$ 20" → 20 · "1500.75" → 1500.75
 * Retorna NaN quando não dá para entender o valor.
 */
export function lerValor(entrada) {
  if (typeof entrada === "number") return isFinite(entrada) ? arred(entrada) : NaN;
  if (entrada == null) return NaN;
  let s = String(entrada).trim().replace(/R\$|\s/gi, "");
  if (!s) return NaN;
  const negativo = s.startsWith("-");
  if (negativo) s = s.slice(1);
  if (s.includes(",")) {
    // vírgula é decimal; pontos são milhar
    s = s.replace(/\./g, "").replace(",", ".");
  } else if (/^\d{1,3}(\.\d{3})+$/.test(s)) {
    // só pontos em grupos de 3 → separador de milhar
    s = s.replace(/\./g, "");
  }
  if (!/^\d+(\.\d+)?$/.test(s)) return NaN;
  const n = parseFloat(s);
  return isFinite(n) ? arred(negativo ? -n : n) : NaN;
}

/** Formata número para campo de edição: 1500.5 → "1.500,50" */
export const paraCampo = (v) =>
  v === "" || v == null || !isFinite(v) ? "" : Number(v).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

let ocultar = false;
export const definirOcultar = (v) => {
  ocultar = v;
};

export const brl = (v) =>
  ocultar ? "R$ •••••" : (isFinite(v) ? Number(v) : 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export const brlCurto = (v) => {
  if (ocultar) return "•••";
  const n = isFinite(v) ? Number(v) : 0;
  if (Math.abs(n) >= 1000) return "R$ " + (n / 1000).toLocaleString("pt-BR", { maximumFractionDigits: 1 }) + " mil";
  return brl(n);
};

export const pct = (v) => (v == null || !isFinite(v) ? "—" : (v * 100).toLocaleString("pt-BR", { maximumFractionDigits: 0 }) + "%");
