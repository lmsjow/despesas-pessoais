import { useState } from "react";
import { createUserWithEmailAndPassword, sendPasswordResetEmail, signInWithEmailAndPassword } from "firebase/auth";
import { AlertCircle, LogIn, UserPlus, Users } from "lucide-react";
import { auth } from "../dados/firebase.js";
import { Abas, Botao, Campo, Cartao, classeEntrada } from "../ui/base.jsx";
import Logo from "../ui/Logo.jsx";

const ERROS = {
  "auth/invalid-email": "E-mail inválido.",
  "auth/user-not-found": "Conta não encontrada. Toque em “Criar conta”.",
  "auth/wrong-password": "Senha incorreta.",
  "auth/invalid-credential": "E-mail ou senha incorretos.",
  "auth/email-already-in-use": "Este e-mail já tem conta. Use “Entrar”.",
  "auth/weak-password": "Senha muito fraca (mínimo 6 caracteres).",
  "auth/network-request-failed": "Sem conexão. Verifique a internet.",
  "auth/too-many-requests": "Muitas tentativas. Aguarde um instante.",
  "auth/missing-email": "Digite seu e-mail.",
};

export default function Login() {
  const [modo, setModo] = useState("entrar");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");
  const [info, setInfo] = useState("");
  const [ocupado, setOcupado] = useState(false);

  async function enviar(e) {
    e.preventDefault();
    setErro("");
    setInfo("");
    if (!email.trim() || !senha) return setErro("Preencha e-mail e senha.");
    if (senha.length < 6) return setErro("A senha precisa ter ao menos 6 caracteres.");
    setOcupado(true);
    try {
      if (modo === "entrar") await signInWithEmailAndPassword(auth, email.trim(), senha);
      else await createUserWithEmailAndPassword(auth, email.trim(), senha);
    } catch (x) {
      setErro(ERROS[x.code] || "Não foi possível concluir. Tente novamente.");
    }
    setOcupado(false);
  }

  async function esqueci() {
    setErro("");
    setInfo("");
    if (!email.trim()) return setErro("Digite seu e-mail acima para receber o link.");
    try {
      await sendPasswordResetEmail(auth, email.trim());
      setInfo("Se o e-mail tiver conta, você vai receber um link para criar uma nova senha.");
    } catch (x) {
      setErro(ERROS[x.code] || "Não foi possível enviar o e-mail agora.");
    }
  }

  return (
    <div className="flex min-h-dvh items-center justify-center bg-gradient-to-br from-emerald-50 via-slate-100 to-sky-50 p-5 dark:from-slate-950 dark:via-slate-950 dark:to-emerald-950/40">
      <div className="w-full max-w-sm">
        <div className="mb-7 flex flex-col items-center text-center">
          <Logo className="mb-4 h-14 w-14" />
          <h1 className="text-2xl font-bold tracking-tight">Casa & Cofre</h1>
          <p className="mt-1 text-sm text-slate-500">O dinheiro da família, organizado.</p>
        </div>
        <Cartao className="p-6">
          <Abas
            className="mb-5 flex w-full [&>button]:flex-1"
            abas={[
              ["entrar", "Entrar"],
              ["criar", "Criar conta"],
            ]}
            valor={modo}
            aoMudar={(m) => {
              setModo(m);
              setErro("");
            }}
          />
          <form onSubmit={enviar} className="grid gap-4">
            <Campo rotulo="E-mail">
              <input type="email" autoComplete="email" className={classeEntrada} value={email} onChange={(e) => setEmail(e.target.value)} placeholder="voces@email.com" />
            </Campo>
            <Campo rotulo="Senha">
              <input
                type="password"
                autoComplete={modo === "entrar" ? "current-password" : "new-password"}
                className={classeEntrada}
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                placeholder="mínimo 6 caracteres"
              />
            </Campo>
            {erro && (
              <div className="flex items-center gap-2 rounded-xl bg-rose-50 px-3 py-2.5 text-[13px] text-rose-700 dark:bg-rose-500/10 dark:text-rose-300">
                <AlertCircle size={16} className="shrink-0" />
                {erro}
              </div>
            )}
            {info && <div className="rounded-xl bg-emerald-50 px-3 py-2.5 text-[13px] text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300">{info}</div>}
            <Botao type="submit" disabled={ocupado} className="w-full py-3">
              {ocupado ? "Aguarde…" : modo === "entrar" ? <><LogIn size={17} /> Entrar</> : <><UserPlus size={17} /> Criar conta</>}
            </Botao>
            {modo === "entrar" && (
              <button type="button" onClick={esqueci} className="text-center text-[13px] font-medium text-marca-600 hover:underline dark:text-emerald-400">
                Esqueci minha senha
              </button>
            )}
          </form>
        </Cartao>
        <p className="mt-5 flex items-start justify-center gap-2 text-center text-xs leading-relaxed text-slate-500">
          <Users size={15} className="mt-0.5 shrink-0 text-sky-500" />
          <span>
            Usem <b className="text-slate-600 dark:text-slate-300">a mesma conta</b> nos dois celulares para ver os mesmos dados, sincronizados na hora.
          </span>
        </p>
      </div>
    </div>
  );
}
