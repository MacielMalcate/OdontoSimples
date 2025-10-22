 // Importa os módulos necessários do Firebase
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-auth.js";

// Configuração do seu projeto Firebase
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
const auth = getAuth(app);

// Exporta para ser usado em outros arquivos
export { app, auth };
