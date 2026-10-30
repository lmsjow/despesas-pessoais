import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from "firebase/firestore";

// Configuração pública do app web (não é segredo: a proteção dos dados está nas
// regras do Firestore — veja firestore.rules).
const firebaseConfig = {
  apiKey: "AIzaSyA76Ajna_C3DkOya39mHsiABAVpyRN2x6I",
  authDomain: "despesas-pessoais-17116.firebaseapp.com",
  projectId: "despesas-pessoais-17116",
  storageBucket: "despesas-pessoais-17116.firebasestorage.app",
  messagingSenderId: "760869497313",
  appId: "1:760869497313:web:fa53eb2f8c9e2c4b6e8aa0",
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

// Cache local: o app abre e funciona sem internet, e o que for lançado offline
// é enviado quando a conexão voltar (mesmo que o app seja fechado antes).
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
  ignoreUndefinedProperties: true,
});
