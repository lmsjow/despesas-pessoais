import { createContext, useContext } from "react";

export const FormCtx = createContext(null);
/** abrirForm("despesas" | "receitas", item?) abre o formulário de lançamento. */
export const useForm = () => useContext(FormCtx);
