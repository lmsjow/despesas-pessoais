# Casa & Cofre — Controle Financeiro (com login e sincronização)

App React + Vite. Login por e-mail/senha e dados sincronizados em tempo real
entre os aparelhos, usando **Firebase (Auth + Firestore)**.

> Ideia central para ficar simples: criem **UMA única conta** (um e-mail e uma
> senha) e usem nos dois celulares. Mesma conta = mesmos dados, na hora.

---

## Parte 1 — Configurar o Firebase (uma vez, ~5 min)

1. Acesse https://console.firebase.google.com e clique em **Adicionar projeto**
   (pode usar o mesmo projeto do romaneios ou criar um novo, ex.: `casa-cofre`).
2. No menu **Criação → Authentication → Começar → Sign-in method**, ative
   **E-mail/senha**.
3. No menu **Criação → Firestore Database → Criar banco de dados** →
   escolha o modo de produção → região `southamerica-east1` (São Paulo).
4. Ainda no Firestore, aba **Regras**, cole exatamente isto e publique:

   ```
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       match /households/{uid} {
         allow read, write: if request.auth != null && request.auth.uid == uid;
       }
     }
   }
   ```
   (Isso garante que cada conta só acessa os próprios dados.)

5. Vá em **Configurações do projeto** (engrenagem) → seção **Seus apps** →
   ícone **Web `</>`** → registre um app (ex.: `casa-cofre-web`). O Firebase
   mostra um objeto `firebaseConfig` com apiKey, authDomain, projectId, etc.
6. Abra o arquivo **`src/firebase.js`** deste projeto e cole esses valores no
   lugar dos `COLE_SUA_...`.

---

## Parte 2 — Publicar no Cloudflare Pages

### Opção A — Conectar ao GitHub (recomendada, atualiza sozinho)

1. Suba esta pasta para um repositório no GitHub.
2. Cloudflare → **Workers & Pages → Create → Pages → Connect to Git**.
3. Configure:
   - **Framework preset:** None
   - **Build command:** `npm run build`
   - **Build output directory:** `dist`
4. **Save and Deploy**. A cada `git push`, ele recompila e publica.

### Opção B — Upload manual da pasta pronta

1. No seu computador: `npm install` e depois `npm run build` (gera `dist/`).
2. Cloudflare → **Pages → Create → Upload assets** → arraste a pasta `dist`.

> Importante: só faça o upload/deploy DEPOIS de preencher o `src/firebase.js`.
> A pasta `dist` inclusa aqui foi compilada com valores de exemplo e não vai
> conectar até você colocar a sua config e recompilar.

### Domínio próprio
Projeto no Cloudflare → **Custom domains** → aponte, por exemplo,
`financas.portalfull7.com.br`.

---

## Como vocês vão usar

1. Abram o site. Na primeira vez, toquem em **Criar conta**, definam e-mail e
   senha e pronto — os dados da planilha já aparecem carregados.
2. No outro celular, toquem em **Entrar** com o **mesmo** e-mail e senha.
3. Tudo que um lançar aparece no aparelho do outro automaticamente.

Se os dois editarem exatamente ao mesmo tempo, vale a última alteração salva
(não é problema no dia a dia). O botão **Exportar backup** em Configurações
continua disponível como cópia de segurança.

---

## Rodar no seu computador (opcional)

```bash
npm install
npm run dev      # http://localhost:5173
```
