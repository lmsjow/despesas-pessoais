// Datas como texto "AAAA-MM-DD" e meses como "AAAA-MM", sempre no fuso local
// (o app antigo usava UTC e, depois das 21h, gravava o dia seguinte).

const MESES = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
const MESES_CURTOS = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

const dois = (n) => String(n).padStart(2, "0");

export function hoje(agora = new Date()) {
  return `${agora.getFullYear()}-${dois(agora.getMonth() + 1)}-${dois(agora.getDate())}`;
}

export const mesDe = (data) => (data && /^\d{4}-\d{2}/.test(data) ? data.slice(0, 7) : null);
export const mesAtual = (agora = new Date()) => mesDe(hoje(agora));

export function somarMeses(mes, n) {
  const [a, m] = mes.split("-").map(Number);
  const total = a * 12 + (m - 1) + n;
  return `${Math.floor(total / 12)}-${dois((total % 12) + 1)}`;
}

export function mesesEntre(de, ate) {
  const [a1, m1] = de.split("-").map(Number);
  const [a2, m2] = ate.split("-").map(Number);
  return a2 * 12 + m2 - (a1 * 12 + m1);
}

export function listaMeses(de, ate) {
  const out = [];
  for (let m = de; m <= ate; m = somarMeses(m, 1)) out.push(m);
  return out;
}

export const diasNoMes = (mes) => {
  const [a, m] = mes.split("-").map(Number);
  return new Date(a, m, 0).getDate();
};

/** Data dentro do mês com o dia pedido, limitado ao último dia (31 → 28/29/30). */
export const dataNoMes = (mes, dia) => `${mes}-${dois(Math.min(Math.max(1, dia || 1), diasNoMes(mes)))}`;

export function nomeMes(mes, curto = false) {
  if (!mes) return "—";
  const [a, m] = mes.split("-").map(Number);
  return curto ? `${MESES_CURTOS[m - 1]}/${String(a).slice(-2)}` : `${MESES[m - 1]} de ${a}`;
}

export function dataBR(data) {
  if (!data) return "—";
  const [a, m, d] = data.split("-");
  return d ? `${d}/${m}/${a}` : data;
}

export const dataCurta = (data) => {
  if (!data) return "—";
  const [, m, d] = data.split("-");
  return `${d}/${m}`;
};

/** Converte "Out/26" (formato do app antigo) em "2026-10". */
export function mesAntigoParaNovo(mesAno) {
  if (!mesAno) return null;
  const [mm, aa] = String(mesAno).split("/");
  const idx = MESES_CURTOS.indexOf(mm);
  const ano = 2000 + parseInt(aa, 10);
  return idx < 0 || isNaN(ano) ? null : `${ano}-${dois(idx + 1)}`;
}
