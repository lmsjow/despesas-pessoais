import { useEffect, useMemo, useState } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth, db } from "./dados/firebase.js";
import { criarArmazenamentoFirestore, criarArmazenamentoLocal } from "./dados/armazenamento.js";
import { dadosDemo } from "./dados/demo.js";
import { ProvedorAvisos } from "./ui/avisos.jsx";
import { ProvedorApp } from "./contexto.jsx";
import { Botao } from "./ui/base.jsx";
import Login from "./telas/Login.jsx";
import Estrutura from "./telas/Estrutura.jsx";
import Logo from "./ui/Logo.jsx";

const DEMO = new URLSearchParams(location.search).has("demo");

// aplica o tema salvo antes do primeiro desenho (evita piscar claro→escuro)
try {
  const t = JSON.parse(localStorage.getItem("cc-tema") || "null");
  if (t === "escuro" || (t === null && matchMedia("(prefers-color-scheme: dark)").matches)) document.documentElement.classList.add("dark");
} catch {}

export default function App() {
  return <ProvedorAvisos>{DEMO ? <ModoDemo /> : <ComLogin />}</ProvedorAvisos>;
}

function ModoDemo() {
  const armazenamento = useMemo(() => criarArmazenamentoLocal(dadosDemo), []);
  return <Sessao armazenamento={armazenamento} usuario={{ email: "Modo demonstração" }} aoSair={() => (location.href = location.pathname)} demo />;
}

function ComLogin() {
  const [usuario, setUsuario] = useState(undefined);
  useEffect(() => onAuthStateChanged(auth, (u) => setUsuario(u || null)), []);
  const armazenamento = useMemo(() => (usuario ? criarArmazenamentoFirestore(db, usuario.uid) : null), [usuario]);
  if (usuario === undefined) return <Carregando texto="Carregando…" />;
  if (!usuario) return <Login />;
  return <Sessao key={usuario.uid} armazenamento={armazenamento} usuario={usuario} aoSair={() => signOut(auth)} />;
}

function Sessao({ armazenamento, usuario, aoSair, demo }) {
  const [estado, setEstado] = useState({ dados: null, pendente: false, doCache: false, erro: null });
  useEffect(
    () =>
      armazenamento.assinar(
        (r) => setEstado({ ...r, erro: null }),
        (e) => {
          console.error(e);
          setEstado((s) => ({ ...s, erro: e }));
        },
      ),
    [armazenamento],
  );

  if (estado.erro && !estado.dados) return <ErroAcesso erro={estado.erro} aoSair={aoSair} />;
  if (!estado.dados) return <Carregando texto="Sincronizando seus dados…" />;
  return (
    <ProvedorApp
      armazenamento={armazenamento}
      dados={estado.dados}
      sincronia={{ pendente: estado.pendente, doCache: estado.doCache }}
      usuario={usuario}
      aoSair={aoSair}
      demo={demo}
    >
      <Estrutura />
    </ProvedorApp>
  );
}

function Carregando({ texto }) {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-4 text-sm text-slate-500">
      <Logo className="h-12 w-12 animate-pulse" />
      {texto}
    </div>
  );
}

function ErroAcesso({ erro, aoSair }) {
  const c = erro?.code || erro?.message || "";
  const texto = c.includes("offline-primeiro-acesso")
    ? "Para o primeiro acesso neste aparelho é preciso estar conectado à internet. Depois disso o app funciona offline."
    : c.includes("permission-denied")
      ? "O Firebase recusou o acesso aos dados. Confira se as regras do Firestore permitem que cada usuário leia e grave o próprio documento em households/{uid}."
      : "Não foi possível carregar seus dados agora. Verifique a conexão e tente novamente.";
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-4 p-6 text-center">
      <Logo className="h-12 w-12" />
      <p className="max-w-md text-sm leading-relaxed text-slate-600 dark:text-slate-300">{texto}</p>
      <div className="flex gap-2">
        <Botao variante="secundario" onClick={() => location.reload()}>
          Tentar de novo
        </Botao>
        <Botao variante="fantasma" onClick={aoSair}>
          Sair
        </Botao>
      </div>
    </div>
  );
}
