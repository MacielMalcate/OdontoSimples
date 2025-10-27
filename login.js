// --- IMPORTANTE: SUBSTITUA OS DADOS ABAIXO COM A CONFIGURAÇÃO DO SEU PROJETO FIREBASE ---
// Você pode encontrar essas informações nas configurações do seu projeto no Firebase Console.
// (Engrenagem ao lado de "Project overview" -> "Configurações do projeto" -> "Seus apps" -> Selecione seu app web -> "Config")
//const firebaseConfig = {
   // apiKey: "SUA_API_KEY",
    //authDomain: "odontosimples-79c77.firebaseapp.com",
    //projectId: "odontosimples-79c77",
   // storageBucket: "odontosimples-79c77.appspot.com",
  //  messagingSenderId: "SEU_SENDER_ID",
  //  appId: "SEU_APP_ID"
//};

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

// Obtém a instância do Authentication
const auth = firebase.auth();

// Pega os elementos do formulário
const loginForm = document.getElementById('loginForm');
const emailInput = document.getElementById('email');
const senhaInput = document.getElementById('senha');
const messageDiv = document.getElementById('message');

// Função para exibir mensagens
function showMessage(msg, type) {
    messageDiv.textContent = msg;
    messageDiv.className = `message ${type}`;
    messageDiv.style.display = 'block';
}

// Event listener para o envio do formulário de login
loginForm.addEventListener('submit', async (e) => {
    e.preventDefault(); // Impede o recarregamento da página

    messageDiv.style.display = 'none'; // Esconde mensagens anteriores

    const email = emailInput.value.trim();
    const senha = senhaInput.value;

    // Validação básica
    if (!email || !senha) {
        showMessage('Por favor, preencha todos os campos.', 'error');
        return;
    }

    try {
        // Tenta fazer o login com e-mail e senha
        await auth.signInWithEmailAndPassword(email, senha);
        
        showMessage('Login realizado com sucesso! Redirecionando para o dashboard...', 'success');
        
        // Redireciona o usuário para o dashboard após um pequeno atraso
        setTimeout(() => {
            window.location.href = '/dashboard'; // MUDE PARA O CAMINHO REAL DO SEU DASHBOARD
        }, 1500);

    } catch (error) {
        console.error("Erro durante o login:", error);
        let errorMessage = 'Ocorreu um erro ao fazer login. Verifique seu e-mail e senha.';

        // Mensagens de erro mais amigáveis do Firebase Auth
        if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
            errorMessage = 'E-mail ou senha inválidos. Tente novamente.';
        } else if (error.code === 'auth/invalid-email') {
            errorMessage = 'O formato do e-mail é inválido.';
        }

        showMessage(errorMessage, 'error');
    }
});

// Opcional: Manter o estado de autenticação para redirecionar usuários já logados
auth.onAuthStateChanged(user => {
    if (user) {
        // Se o usuário já estiver logado e tentar acessar a página de login, redirecione-o
        console.log("Usuário já logado:", user.email);
        window.location.href = '/dashboard.html'; // Redireciona para o dashboard
    }
    // Se não houver usuário, a página de login permanece
});
