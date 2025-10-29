// firebase-init.js

// Importa as funções necessárias dos SDKs do Firebase
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-storage.js";


// ============================================================================================
// ATENÇÃO MUITO IMPORTANTE: SUBSTITUA OS VALORES ABAIXO PELAS CREDENCIAIS REAIS DO SEU PROJETO!
// Você as encontra no Firebase Console > Configurações do projeto (ícone de engrenagem)
// > "Seus apps" (role para baixo) > "Config"
// ============================================================================================

const firebaseConfig = {
  apiKey: "AIzaSyDX4pqS_kmHY7k06f0nxDMyMWE9pKNRM5Y",
  authDomain: "odontosimples-79c77.firebaseapp.com",
  projectId: "odontosimples-79c77",
  storageBucket: "odontosimples-79c77.firebasestorage.app",
  messagingSenderId: "52839350003",
  appId: "1:52839350003:web:d4418f6955e0e50c7d4186"
};


// Inicializa o Firebase
const app = initializeApp(firebaseConfig);

// Exporta as instâncias dos serviços que você vai usar
export const db = getFirestore(app);      // Para Cloud Firestore
export const auth = getAuth(app);    // Para Firebase Authentication
export const storage = getStorage(app);  // Para Cloud Storage for Firebase

console.log("Firebase, Firestore, Auth e Storage inicializados e exportados com sucesso!");
