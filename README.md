# Casa & Cofre — Controle financeiro da família

App de despesas pessoais (React + Firebase), publicado como um único `index.html`.

## O que tem nesta pasta

| Caminho | O que é |
| --- | --- |
| `index.html` | O app pronto. **É este arquivo que vai para o GitHub Pages.** |
| `fonte/` | Código-fonte (para alterar o app). |
| `backup-versao-antiga/` | Cópias da versão anterior. **Não enviar ao GitHub** (contém dados pessoais). |

## Abrir em modo demonstração

Acrescente `?demo` ao endereço (ex.: `https://.../index.html?demo`). Usa dados fictícios
guardados só no navegador — bom para testar sem mexer nos dados reais.

## Alterar o app

Requer Node.js. Dentro de `fonte/`:

```
npm install      (só na primeira vez)
npm run dev      (abre em http://localhost:5173 para testar)
npm run build    (roda os testes e gera o novo index.html na pasta de cima)
```

## Dados e Firebase

- Os dados ficam no Firestore em `households/{uid}`, no campo `v2`.
- Na primeira vez que a versão 2 abre, ela converte os dados da versão antiga (campo `state`),
  que **continua guardado** no mesmo documento como cópia de segurança.
- Cada lançamento é gravado separadamente: dois celulares podem editar ao mesmo tempo.
- O app funciona offline e envia as alterações quando a internet volta.
- Regras do Firestore recomendadas (Console do Firebase → Firestore → Regras):

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
