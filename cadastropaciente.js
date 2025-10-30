// cadastropaciente.js

import { db, auth, storage } from "./firebase-init.js";
import { collection, addDoc, doc, updateDoc, getDoc } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";
import { ref, uploadBytes, getDownloadURL, deleteObject } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-storage.js";

document.addEventListener('DOMContentLoaded', () => {
    const patientFormContainer = document.getElementById('patientFormContainer');
    const patientForm = document.getElementById('patientForm');
    const formTitle = document.getElementById('formTitle');
    const submitButton = document.getElementById('submitButton');
    const messageDiv = document.getElementById('message');
    const fotoPerfilInput = document.getElementById('fotoPerfil');
    const currentFotoPreview = document.getElementById('currentFotoPreview');

    let currentUserId = null;
    let editingPatientId = null; // Armazena o ID do paciente se estiver em modo de edição
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

    function isValidCPF(cpf) {
        cpf = cpf.replace(/[^\d]+/g, ''); // Remove caracteres não numéricos
        if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) return false; // Verifica tamanho e CPF com todos os dígitos iguais
        let sum = 0;
        let remainder;

        // Validação do primeiro dígito
        for (let i = 1; i <= 9; i++) sum = sum + parseInt(cpf.substring(i - 1, i)) * (11 - i);
        remainder = (sum * 10) % 11;
        if ((remainder == 10) || (remainder == 11)) remainder = 0;
        if (remainder != parseInt(cpf.substring(9, 10))) return false;

        sum = 0;
        // Validação do segundo dígito
        for (let i = 1; i <= 10; i++) sum = sum + parseInt(cpf.substring(i - 1, i)) * (12 - i);
        remainder = (sum * 10) % 11;
        if ((remainder == 10) || (remainder == 11)) remainder = 0;
        if (remainder != parseInt(cpf.substring(10, 11))) return false;

        return true;
    }

    // --- Lógica de Edição ---
    async function loadPatientForEdit(patientId, userId) {
        try {
            const patientRef = doc(db, "users", userId, "patients", patientId);
            const patientDoc = await getDoc(patientRef);

            if (patientDoc.exists()) {
                const data = patientDoc.data();
                document.getElementById('nomeCompleto').value = data.nomeCompleto || '';
                document.getElementById('cpf').value = data.cpf || '';
                document.getElementById('dataNascimento').value = data.dataNascimento || '';
                document.getElementById('sexo').value = data.sexo || '';
                document.getElementById('email').value = data.email || '';
                document.getElementById('telefone').value = data.telefone || '';
                document.getElementById('enderecoCompleto').value = data.enderecoCompleto || '';

                if (data.fotoPerfilURL) {
                    currentFotoPreview.src = data.fotoPerfilURL;
                    currentFotoPreview.style.display = 'block';
                    existingFotoURL = data.fotoPerfilURL; // Armazena a URL existente
                } else {
                    currentFotoPreview.style.display = 'none';
                    existingFotoURL = null;
                }

                formTitle.textContent = 'Editar Paciente';
                submitButton.textContent = 'Atualizar Paciente';
                editingPatientId = patientId; // Define o ID do paciente que está sendo editado
            } else {
                showMessage("Paciente não encontrado para edição.", "error");
                // window.location.href = 'listarpacientes.html';
            }
        } catch (e) {
            console.error("Erro ao carregar paciente para edição:", e);
            showMessage(`Erro ao carregar paciente: ${e.message}`, "error");
        }
    }

    // --- Monitoramento de Autenticação ---
    onAuthStateChanged(auth, async (user) => {
        if (user) {
            currentUserId = user.uid;
            console.log("Usuário logado:", currentUserId);
            patientFormContainer.style.display = 'block'; // Mostra o formulário

            // Verifica se há um ID de paciente na URL para carregar dados de edição
            const urlParams = new URLSearchParams(window.location.search);
            const patientIdFromUrl = urlParams.get('id');
            if (patientIdFromUrl) {
                await loadPatientForEdit(patientIdFromUrl, currentUserId);
            }
        } else {
            currentUserId = null;
            console.log("Nenhum usuário logado. Redirecionando ou desabilitando formulário.");
            patientFormContainer.style.display = 'none'; // Esconde o formulário
            showMessage("Você precisa estar logado para cadastrar/editar pacientes. Redirecionando...", "error");
            // window.location.href = 'login.html'; // Redireciona para sua página de login
        }
    });

    // --- Lógica de Envio do Formulário ---
    patientForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        if (!currentUserId) {
            showMessage("Erro: Nenhum usuário logado. Por favor, faça login.", "error");
            return;
        }

        // 1. Coleta de Dados
        const nomeCompleto = document.getElementById('nomeCompleto').value.trim();
        const cpf = document.getElementById('cpf').value.trim();
        const dataNascimento = document.getElementById('dataNascimento').value;
        const sexo = document.getElementById('sexo').value;
        const email = document.getElementById('email').value.trim();
        const telefone = document.getElementById('telefone').value.trim();
        const enderecoCompleto = document.getElementById('enderecoCompleto').value.trim();
        const fotoFile = fotoPerfilInput.files[0];

        // 2. Validação Cliente-Side
        if (!nomeCompleto || !cpf || !dataNascimento || !sexo || !email || !enderecoCompleto) {
            showMessage("Por favor, preencha todos os campos obrigatórios.", "error");
            return;
        }
        if (!isValidEmail(email)) {
            showMessage("Por favor, insira um e-mail válido.", "error");
            return;
        }
        if (!isValidCPF(cpf)) {
            showMessage("Por favor, insira um CPF válido.", "error");
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
                const fileName = `${editingPatientId || 'novo'}-${Date.now()}-${fotoFile.name}`;
                const storageRef = ref(storage, `users/${currentUserId}/patients/${fileName}`);

                const uploadTask = await uploadBytes(storageRef, fotoFile);
                fotoURL = await getDownloadURL(uploadTask.ref);
                console.log("Foto do paciente enviada, URL:", fotoURL);

                // Opcional: Excluir a foto antiga do Storage se houver uma nova
                if (existingFotoURL && existingFotoURL !== fotoURL) {
                    try {
                        const oldPhotoRef = ref(storage, existingFotoURL);
                        await deleteObject(oldPhotoRef);
                        console.log("Foto antiga do paciente excluída do Storage.");
                    } catch (deleteError) {
                        console.warn("Não foi possível excluir a foto antiga do Storage (pode não existir ou permissões).", deleteError);
                    }
                }
            }


            // 4. Preparar Dados para o Firestore
            const patientData = {
                nomeCompleto: nomeCompleto,
                cpf: cpf,
                dataNascimento: dataNascimento,
                sexo: sexo,
                email: email,
                telefone: telefone,
                enderecoCompleto: enderecoCompleto,
                fotoPerfilURL: fotoURL || null
            };

            // 5. Salvar/Atualizar no Firestore
            if (editingPatientId) {
                // Modo de Edição
                const patientRef = doc(db, "users", currentUserId, "patients", editingPatientId);
                await updateDoc(patientRef, patientData);
                showMessage("Paciente atualizado com sucesso!", "success");
            } else {
                // Modo de Cadastro
                patientData.dataCadastro = new Date();
                const docRef = await addDoc(collection(db, "users", currentUserId, "patients"), patientData);
                console.log("Paciente cadastrado com ID: ", docRef.id);
                showMessage("Paciente cadastrado com sucesso!", "success");
            }

            patientForm.reset(); // Limpa o formulário
            currentFotoPreview.src = '';
            currentFotoPreview.style.display = 'none';
            existingFotoURL = null;

            // Redireciona para a lista de pacientes após o sucesso
            window.location.href = 'listarpacientes.html';

        } catch (e) {
            console.error("Erro ao processar paciente:", e);
            showMessage(`Erro ao salvar paciente: ${e.message}`, "error");
        }
    });
});
