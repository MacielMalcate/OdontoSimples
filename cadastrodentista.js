 // cadastrodentista.js

// Importa as instâncias do Firebase e as funções necessárias
import { db, auth, storage } from "./firebase-init.js";
import { collection, addDoc, doc, updateDoc, getDoc } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";
import { ref, uploadBytes, getDownloadURL, deleteObject } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-storage.js";

document.addEventListener('DOMContentLoaded', () => {
    const dentistFormContainer = document.getElementById('dentistFormContainer');
    const dentistForm = document.getElementById('dentistForm');
    const formTitle = document.getElementById('formTitle');
    const submitButton = document.getElementById('submitButton');
    const messageDiv = document.getElementById('message');
    const fotoPerfilInput = document.getElementById('fotoPerfil');
    const currentFotoPreview = document.getElementById('currentFotoPreview');

    let currentUserId = null;
    let editingDentistId = null; // Armazena o ID do dentista se estiver em modo de edição
    let existingFotoURL = null; // Armazena a URL da foto existente para edição

    // --- Funções Auxiliares ---
    function showMessage(text, type) {
        messageDiv.textContent = text;
        messageDiv.className = `message ${type}`;
        messageDiv.style.display = 'block';
        setTimeout(() => {
            messageDiv.style.display = 'none';
        }, 5000);
    }

    function isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    function isValidCRO(cro) {
        // Exemplo: CRO-XX 12345 (CRO-SP 12345, CRO-MG 54321), ou apenas 12345. Ajuste conforme necessário.
        // Permite CRO-UF seguido de espaço e 5 a 10 dígitos, ou apenas 5 a 10 dígitos
        const croRegex = /^(CRO-[A-Z]{2}\s)?\d{5,10}$/i;
        return croRegex.test(cro);
    }

    // --- Lógica de Edição ---
    async function loadDentistForEdit(dentistId, userId) {
        try {
            const dentistRef = doc(db, "users", userId, "dentistas", dentistId);
            const dentistDoc = await getDoc(dentistRef);

            if (dentistDoc.exists()) {
                const data = dentistDoc.data();
                document.getElementById('nomeCompleto').value = data.nomeCompleto || '';
                document.getElementById('cro').value = data.cro || '';
                document.getElementById('email').value = data.email || '';
                document.getElementById('telefone').value = data.telefone || '';
                document.getElementById('especialidade').value = data.especialidade || '';
                document.getElementById('enderecoConsultorio').value = data.enderecoConsultorio || '';

                if (data.fotoPerfilURL) {
                    currentFotoPreview.src = data.fotoPerfilURL;
                    currentFotoPreview.style.display = 'block';
                    existingFotoURL = data.fotoPerfilURL; // Armazena a URL existente
                } else {
                    currentFotoPreview.style.display = 'none';
                    existingFotoURL = null;
                }

                formTitle.textContent = 'Editar Dentista';
                submitButton.textContent = 'Atualizar Dentista';
                editingDentistId = dentistId; // Define o ID do dentista que está sendo editado
            } else {
                showMessage("Dentista não encontrado para edição.", "error");
                // Opcional: redirecionar de volta para a lista
                // window.location.href = 'listardentistas.html';
            }
        } catch (e) {
            console.error("Erro ao carregar dentista para edição:", e);
            showMessage(`Erro ao carregar dentista: ${e.message}`, "error");
        }
    }

    // --- Monitoramento de Autenticação ---
    onAuthStateChanged(auth, async (user) => {
        if (user) {
            currentUserId = user.uid;
            console.log("Usuário logado:", currentUserId);
            dentistFormContainer.style.display = 'block'; // Mostra o formulário

            // Verifica se há um ID de dentista na URL para carregar dados de edição
            const urlParams = new URLSearchParams(window.location.search);
            const dentistIdFromUrl = urlParams.get('id');
            if (dentistIdFromUrl) {
                await loadDentistForEdit(dentistIdFromUrl, currentUserId);
            }
        } else {
            currentUserId = null;
            console.log("Nenhum usuário logado. Redirecionando ou desabilitando formulário.");
            dentistFormContainer.style.display = 'none'; // Esconde o formulário
            showMessage("Você precisa estar logado para cadastrar/editar dentistas. Redirecionando...", "error");
            // window.location.href = 'login.html'; // Redireciona para sua página de login
        }
    });

    // --- Lógica de Envio do Formulário ---
    dentistForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        if (!currentUserId) {
            showMessage("Erro: Nenhum usuário logado. Por favor, faça login.", "error");
            return;
        }

        // 1. Coleta de Dados
        const nomeCompleto = document.getElementById('nomeCompleto').value.trim();
        const cro = document.getElementById('cro').value.trim();
        const email = document.getElementById('email').value.trim();
        const telefone = document.getElementById('telefone').value.trim();
        const especialidade = document.getElementById('especialidade').value;
        const enderecoConsultorio = document.getElementById('enderecoConsultorio').value.trim();
        const fotoFile = fotoPerfilInput.files[0];

        // 2. Validação Cliente-Side
        if (!nomeCompleto || !cro || !email || !especialidade || !enderecoConsultorio) {
            showMessage("Por favor, preencha todos os campos obrigatórios.", "error");
            return;
        }
        if (!isValidEmail(email)) {
            showMessage("Por favor, insira um e-mail válido.", "error");
            return;
        }
        if (!isValidCRO(cro)) {
            showMessage("Por favor, insira um número de CRO válido (Ex: CRO-SP 12345 ou 12345).", "error");
            return;
        }
        if (telefone && !document.getElementById('telefone').checkValidity()) {
            showMessage(document.getElementById('telefone').title, "error");
            return;
        }

        try {
            // 3. Upload da Foto (se houver uma nova ou estiver editando uma existente)
            let fotoURL = existingFotoURL; // Mantém a URL existente por padrão

            if (fotoFile) { // Se um novo arquivo foi selecionado
                // Gera um nome único para o arquivo, especialmente útil para garantir unicidade
                const fileName = `${editingDentistId || 'novo'}-${Date.now()}-${fotoFile.name}`;
                const storageRef = ref(storage, `users/${currentUserId}/dentistas/${fileName}`);
                
                // Faz o upload
                const uploadTask = await uploadBytes(storageRef, fotoFile);
                fotoURL = await getDownloadURL(uploadTask.ref);
                console.log("Foto enviada, URL:", fotoURL);

                // Opcional: Se for edição e houver uma foto anterior, exclua a antiga do Storage
                if (existingFotoURL && existingFotoURL !== fotoURL) {
                    try {
                        const oldPhotoRef = ref(storage, existingFotoURL); // CUIDADO: Isso requer que a URL seja um path completo para o Storage!
                        await deleteObject(oldPhotoRef); // Exclui a foto antiga
                        console.log("Foto antiga excluída do Storage.");
                    } catch (deleteError) {
                        console.warn("Não foi possível excluir a foto antiga do Storage (pode não existir ou permissões).", deleteError);
                    }
                }
            }


            // 4. Preparar Dados para o Firestore
            const dentistData = {
                nomeCompleto: nomeCompleto,
                cro: cro,
                email: email,
                telefone: telefone,
                especialidade: especialidade,
                enderecoConsultorio: enderecoConsultorio,
                fotoPerfilURL: fotoURL || null // Salva a URL da foto ou null se não houver
            };

            // 5. Salvar/Atualizar no Firestore
            if (editingDentistId) {
                // Modo de Edição
                const dentistRef = doc(db, "users", currentUserId, "dentistas", editingDentistId);
                await updateDoc(dentistRef, dentistData); // Atualiza os campos
                showMessage("Dentista atualizado com sucesso!", "success");
            } else {
                // Modo de Cadastro
                dentistData.dataCadastro = new Date(); // Adiciona data de criação apenas para novos
                const docRef = await addDoc(collection(db, "users", currentUserId, "dentistas"), dentistData);
                console.log("Dentista cadastrado com ID: ", docRef.id);
                showMessage("Dentista cadastrado com sucesso!", "success");
            }

            dentistForm.reset(); // Limpa o formulário
            currentFotoPreview.src = ''; // Limpa a pré-visualização
            currentFotoPreview.style.display = 'none';
            existingFotoURL = null; // Limpa a URL existente

            // Redireciona para a lista de dentistas após o sucesso
            window.location.href = 'listardentistas.html';

        } catch (e) {
            console.error("Erro ao processar dentista:", e);
            showMessage(`Erro ao salvar dentista: ${e.message}`, "error");
        }
    });
});
