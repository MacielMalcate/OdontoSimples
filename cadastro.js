// --- IMPORTANTE: SUBSTITUA OS DADOS ABAIXO COM A CONFIGURAÇÃO DO SEU PROJETO FIREBASE ---
// Você pode encontrar essas informações nas configurações do seu projeto no Firebase Console.
// (Engrenagem ao lado de "Project overview" -> "Configurações do projeto" -> "Seus apps" -> Selecione seu app web -> "Config")

//const firebaseConfig = {
  //  apiKey: "SUA_API_KEY",
    //authDomain: "odontosimples-79c77.firebaseapp.com",
    //projectId: "odontosimples-79c77",
    //storageBucket: "odontosimples-79c77.appspot.com",
    //messagingSenderId: "SEU_SENDER_ID",
    //appId: "SEU_APP_ID"
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

// Obtém as instâncias do Authentication e Firestore
const auth = firebase.auth();
const db = firebase.firestore();

// Pega os elementos do formulário
const cadastroForm = document.getElementById('cadastroForm');
const nomeCompletoInput = document.getElementById('nomeCompleto');
const emailInput = document.getElementById('email');
const senhaInput = document.getElementById('senha');
const confirmarSenhaInput = document.getElementById('confirmarSenha');
const messageDiv = document.getElementById('message');

// Função para exibir mensagens
function showMessage(msg, type) {
    messageDiv.textContent = msg;
    messageDiv.className = `message ${type}`;
    messageDiv.style.display = 'block';
}

// Event listener para o envio do formulário
cadastroForm.addEventListener('submit', async (e) => {
    e.preventDefault(); // Impede o recarregamento da página

    messageDiv.style.display = 'none'; // Esconde mensagens anteriores

    const nomeCompleto = nomeCompletoInput.value.trim();
    const email = emailInput.value.trim();
    const senha = senhaInput.value;
    const confirmarSenha = confirmarSenhaInput.value;

    // Validações básicas
    if (!nomeCompleto || !email || !senha || !confirmarSenha) {
        showMessage('Por favor, preencha todos os campos.', 'error');
        return;
    }

    if (senha.length < 6) {
        showMessage('A senha deve ter no mínimo 6 caracteres.', 'error');
        return;
    }

    if (senha !== confirmarSenha) {
        showMessage('As senhas não coincidem.', 'error');
        return;
    }

    try {
        // 1. Criar o usuário com E-mail e Senha usando Firebase Authentication
        const userCredential = await auth.createUserWithEmailAndPassword(email, senha);
        const user = userCredential.user;
        
        // 2. Salvar dados adicionais do usuário no Cloud Firestore
        // Usamos o UID do usuário como ID do documento para fácil referência
        await db.collection('users').doc(user.uid).set({
            nome: nomeCompleto,
            email: user.email,
            createdAt: firebase.firestore.FieldValue.serverTimestamp() // Para registrar a data de criação
            // Você pode adicionar mais campos aqui, como telefone, cargo, etc.
        });

        showMessage('Cadastro realizado com sucesso! Redirecionando para o painel...', 'success');
        
        // Redireciona o usuário para o dashboard após um pequeno atraso
        setTimeout(() => {
            window.location.href = '/dashboard.html'; // Altere para o caminho real do seu dashboard
        }, 2000);

    } catch (error) {
        console.error("Erro durante o cadastro:", error);
        let errorMessage = 'Ocorreu um erro ao cadastrar. Tente novamente.';

        // Mensagens de erro mais amigáveis do Firebase Auth
        if (error.code === 'auth/email-already-in-use') {
            errorMessage = 'Este e-mail já está em uso.';
        } else if (error.code === 'auth/invalid-email') {
            errorMessage = 'O formato do e-mail é inválido.';
        } else if (error.code === 'auth/weak-password') {
            errorMessage = 'A senha é muito fraca. Escolha uma senha mais forte.';
        }

        showMessage(errorMessage, 'error');
    }
});
