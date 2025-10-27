// --- IMPORTANTE: SUBSTITUA OS DADOS ABAIXO COM A CONFIGURAÇÃO DO SEU PROJETO FIREBASE ---

const firebaseConfig = {
  apiKey: "AIzaSyDX4pqS_kmHY7k06f0nxDMyMWE9pKNRM5Y",
  authDomain: "odontosimples-79c77.firebaseapp.com",
  projectId: "odontosimples-79c77",
  storageBucket: "odontosimples-79c77.firebasestorage.app",
  messagingSenderId: "52839350003",
  appId: "1:52839350003:web:d4418f6955e0e50c7d4186"
};


// Inicializa o Firebase
firebase.initializeApp(firebaseConfig);

// Obtém as instâncias do Authentication e Firestore
const auth = firebase.auth();
const db = firebase.firestore();

// Pega os elementos onde as informações do usuário serão exibidas
const userNameSpan = document.getElementById('userName');
const userEmailSpan = document.getElementById('userEmail');
const logoutBtn = document.getElementById('logoutBtn');

// --- PROTEÇÃO DA PÁGINA E EXIBIÇÃO DOS DADOS DO USUÁRIO ---
auth.onAuthStateChanged(async (user) => {
    if (user) {
        // Usuário está logado
        console.log("Usuário logado:", user.uid);
        userEmailSpan.textContent = user.email; // O e-mail já vem do auth

        try {
            // Tenta buscar os dados adicionais do usuário no Firestore
            const userDoc = await db.collection('users').doc(user.uid).get();

            if (userDoc.exists) {
                const userData = userDoc.data();
                userNameSpan.textContent = userData.nome || user.email; // Exibe o nome ou o e-mail se não encontrar
            } else {
                console.log("Documento do usuário não encontrado no Firestore.");
                userNameSpan.textContent = user.email;
            }
        } catch (error) {
            console.error("Erro ao buscar dados do usuário no Firestore:", error);
            userNameSpan.textContent = user.email;
        }

    } else {
        // Usuário não está logado, redireciona para a página de login
        console.log("Nenhum usuário logado. Redirecionando para login.");
        window.location.href = '/login'; // Ajuste o caminho se necessário
    }
});

// --- FUNCIONALIDADE DE LOGOUT ---
logoutBtn.addEventListener('click', async () => {
    try {
        await auth.signOut();
        console.log("Usuário deslogado com sucesso.");
        window.location.href = '/login'; // Redireciona para a página de login após o logout
    } catch (error) {
        console.error("Erro ao fazer logout:", error);
        alert("Erro ao fazer logout. Tente novamente.");
    }
});
