// listarpacientes.js

import { db, auth, storage } from "./firebase-init.js";
import { collection, query, onSnapshot, doc, deleteDoc } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";
import { ref, deleteObject } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-storage.js";

document.addEventListener('DOMContentLoaded', () => {
    const patientListContainer = document.getElementById('patientListContainer');
    const patientsTableBody = document.querySelector('#patientsTable tbody');
    const messageDiv = document.getElementById('message');
    const noPatientsMessage = document.getElementById('noPatientsMessage');
    let currentUserId = null;

    // --- Funções Auxiliares ---
    function showMessage(text, type) {
        messageDiv.textContent = text;
        messageDiv.className = `message ${type}`;
        messageDiv.style.display = 'block';
        setTimeout(() => {
            messageDiv.style.display = 'none';
        }, 5000);
    }

    // --- Renderização da Tabela de Pacientes ---
    function renderPatientsTable(patients) {
        patientsTableBody.innerHTML = '';
        if (patients.length === 0) {
            noPatientsMessage.style.display = 'block';
            document.getElementById('patientsTable').style.display = 'none';
            return;
        } else {
            noPatientsMessage.style.display = 'none';
            document.getElementById('patientsTable').style.display = 'table';
        }

        patients.forEach(patient => {
            const row = patientsTableBody.insertRow();
            row.setAttribute('data-id', patient.id);

            // Coluna da Foto
            const photoCell = row.insertCell();
            if (patient.fotoPerfilURL) {
                const img = document.createElement('img');
                img.src = patient.fotoPerfilURL;
                img.alt = `Foto de ${patient.nomeCompleto}`;
                img.classList.add('patient-photo-small');
                photoCell.appendChild(img);
            } else {
                photoCell.textContent = 'Sem Foto';
            }

            // Outras colunas
            row.insertCell().textContent = patient.nomeCompleto || 'N/A';
            row.insertCell().textContent = patient.cpf || 'N/A';
            row.insertCell().textContent = patient.telefone || 'N/A';

            // Coluna de Ações (botões)
            const actionsCell = row.insertCell();
            actionsCell.classList.add('action-buttons-group');

            // Botão "Cadastro" (Editar Cadastro)
            const btnCadastro = document.createElement('button');
            btnCadastro.textContent = 'Cadastro';
            btnCadastro.classList.add('btn-cadastro');
            btnCadastro.addEventListener('click', () => handlePatientAction('cadastropaciente', patient.id));
            actionsCell.appendChild(btnCadastro);

            // Botão "Anamnese"
            const btnAnamnese = document.createElement('button');
            btnAnamnese.textContent = 'Anamnese';
            btnAnamnese.classList.add('btn-anamnese');
            btnAnamnese.addEventListener('click', () => handlePatientAction('anamnese', patient.id));
            actionsCell.appendChild(btnAnamnese);

            // Botão "Prontuário"
            const btnProntuario = document.createElement('button');
            btnProntuario.textContent = 'Prontuário';
            btnProntuario.classList.add('btn-prontuario');
            btnProntuario.addEventListener('click', () => handlePatientAction('prontuario', patient.id));
            actionsCell.appendChild(btnProntuario);

            // Botão "Financeiro"
            const btnFinanceiro = document.createElement('button');
            btnFinanceiro.textContent = 'Financeiro';
            btnFinanceiro.classList.add('btn-financeiro');
            btnFinanceiro.addEventListener('click', () => handlePatientAction('financeiro', patient.id));
            actionsCell.appendChild(btnFinanceiro);

            // Botão "Imagens"
            const btnImagens = document.createElement('button');
            btnImagens.textContent = 'Imagens';
            btnImagens.classList.add('btn-imagens');
            btnImagens.addEventListener('click', () => handlePatientAction('imagens', patient.id));
            actionsCell.appendChild(btnImagens);

            // Botão "Documentos"
            const btnDocumentos = document.createElement('button');
            btnDocumentos.textContent = 'Documentos';
            btnDocumentos.classList.add('btn-documentos');
            btnDocumentos.addEventListener('click', () => handlePatientAction('documentos', patient.id));
            actionsCell.appendChild(btnDocumentos);

            // Botão "Deletar"
            const btnDeletar = document.createElement('button');
            btnDeletar.textContent = 'Deletar';
            btnDeletar.classList.add('btn-deletar');
            btnDeletar.addEventListener('click', () => handleDelete(patient.id, patient.nomeCompleto, patient.fotoPerfilURL));
            actionsCell.appendChild(btnDeletar);
        });
    }

    // --- Lógica de Ações ---
    function handlePatientAction(page, patientId) {
        // Redireciona para a página específica, passando o patientId via URL
        window.location.href = `${page}.html?id=${patientId}`;
    }

    async function handleDelete(patientId, patientName, photoURL) {
        if (!currentUserId) {
            showMessage("Erro: Nenhum usuário logado.", "error");
            return;
        }

        if (confirm(`Tem certeza que deseja excluir o paciente ${patientName} e todos os seus registros (anamnese, prontuário, etc.)? Esta ação é irreversível.`)) {
            try {
                // 1. Excluir a foto de perfil do Storage (se existir)
                if (photoURL) {
                    try {
                        const photoRef = ref(storage, photoURL);
                        await deleteObject(photoRef);
                        console.log("Foto de perfil do paciente excluída do Storage.");
                    } catch (storageError) {
                        console.warn("Erro ao excluir foto de perfil do Storage (pode não existir ou permissões):", storageError);
                    }
                }

                // IMPORTANTE: Deletar um documento principal não deleta automaticamente suas subcoleções no Firestore.
                // Para deleção recursiva de subcoleções, uma Cloud Function é a forma mais robusta e segura.
                // Por agora, vamos apenas deletar o documento principal do paciente.
                // As subcoleções ficarão "órfãs" e precisarão ser limpas manualmente ou por uma função.

                const patientRef = doc(db, "users", currentUserId, "patients", patientId);
                await deleteDoc(patientRef);
                console.log("Paciente excluído com sucesso do Firestore:", patientId);
                showMessage("Paciente e seus dados básicos excluídos com sucesso!", "success");

            } catch (e) {
                console.error("Erro ao excluir paciente:", e);
                showMessage(`Erro ao excluir paciente: ${e.message}`, "error");
            }
        }
    }

    // --- Monitoramento de Autenticação e Carregamento de Dados ---
    onAuthStateChanged(auth, (user) => {
        if (user) {
            currentUserId = user.uid;
            console.log("Usuário logado:", currentUserId);
            patientListContainer.style.display = 'block'; // Mostra o conteúdo da lista

            const patientsCollectionRef = collection(db, "users", currentUserId, "patients");
            const q = query(patientsCollectionRef);

            // onSnapshot para atualizações em tempo real
            onSnapshot(q, (querySnapshot) => {
                const patients = [];
                querySnapshot.forEach((doc) => {
                    patients.push({ id: doc.id, ...doc.data() });
                });
                renderPatientsTable(patients);
            }, (error) => {
                console.error("Erro ao carregar pacientes:", error);
                showMessage(`Erro ao carregar pacientes: ${error.message}`, "error");
            });

        } else {
            currentUserId = null;
            console.log("Nenhum usuário logado. Redirecionando ou desabilitando lista.");
            patientListContainer.style.display = 'none'; // Esconde a lista
            showMessage("Você precisa estar logado para ver os pacientes. Redirecionando...", "error");
            // window.location.href = 'login.html'; // Redireciona para sua página de login
        }
    });
});
