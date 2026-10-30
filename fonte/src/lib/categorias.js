export const CATEGORIAS_DESPESA = [
  "Moradia",
  "Alimentação",
  "Transporte",
  "Saúde",
  "Educação",
  "Lazer",
  "Assinaturas",
  "Cartão de Crédito",
  "Cuidados Pessoais",
  "Vestuário",
  "Móveis / Casa",
  "Impostos",
  "Pets",
  "Imprevistos",
  "Outros",
];

export const CATEGORIAS_RECEITA = ["Salário", "Extra / Bônus", "Reembolso", "Investimentos", "Outros"];
export const FORMAS_PAGAMENTO = ["Pix", "Débito", "Crédito", "Dinheiro", "Boleto", "Transferência"];

const PALAVRAS = [
  { cat: "Moradia", kw: ["copel", "sanepar", "habita", "iptu", "aluguel", "condom", "gás", "botijão", "luz", "água", "agua", "energia"] },
  { cat: "Saúde", kw: ["plano de saúde", "plano de saude", "farmacia", "farmácia", "prever", "coren", "academia", "dentista", "médic", "medic", "unimed"] },
  { cat: "Educação", kw: ["escola", "curso", "faculdade", "aquarela", "material escolar", "mensalidade"] },
  { cat: "Transporte", kw: ["carro", "combust", "gasolina", "uber", "ônibus", "onibus", "ipva", "estacion", "pedágio"] },
  { cat: "Cartão de Crédito", kw: ["cartão", "cartao", "nubank", "cheque", "juros", "sicredi", "fomento", "fatura"] },
  { cat: "Cuidados Pessoais", kw: ["pé e mão", "pe e mao", "salão", "salao", "cabelo", "manicure", "barbe"] },
  { cat: "Vestuário", kw: ["calçado", "calcado", "kids", "hering", "moda", "roupa"] },
  { cat: "Assinaturas", kw: ["tim", "vivo", "claro", "netflix", "spotify", "internet", "streaming", "prime", "disney"] },
  { cat: "Móveis / Casa", kw: ["móveis", "moveis", "eletro", "magazine"] },
  { cat: "Impostos", kw: ["inss", "mei", "imposto", "tributo", "darf"] },
  { cat: "Alimentação", kw: ["mercado", "supermercado", "feira", "padaria", "açougue", "acougue", "ifood", "restaurante", "lanche"] },
];

/** Sugere uma categoria pela descrição (palavra inteira ou início de palavra). */
export function sugerirCategoria(descricao, categorias = CATEGORIAS_DESPESA) {
  const d = " " + (descricao || "").toLowerCase() + " ";
  for (const { cat, kw } of PALAVRAS) {
    if (!categorias.includes(cat)) continue;
    if (kw.some((k) => d.includes(" " + k.trim()))) return cat;
  }
  return null;
}

const NECESSIDADES = ["Moradia", "Saúde", "Educação", "Transporte", "Impostos", "Alimentação"];
const DIVIDAS = ["Cartão de Crédito", "Móveis / Casa"];
export const grupoDe = (cat) => (NECESSIDADES.includes(cat) ? "Necessidades" : DIVIDAS.includes(cat) ? "Dívidas" : "Desejos");

export const CORES = ["#10b981", "#6366f1", "#f43f5e", "#f59e0b", "#0ea5e9", "#8b5cf6", "#ec4899", "#14b8a6", "#f97316", "#64748b", "#84cc16", "#06b6d4", "#e11d48", "#a855f7", "#eab308", "#94a3b8"];
