 // listardentistas.js

// Importa as instâncias do Firebase e as funções necessárias
import { db, auth, storage } from "./firebase-init.js";
import { collection, query, onSnapshot, doc, deleteDoc } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";
import { ref, deleteObject } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-storage.js";

document.addEventListener('DOMContentLoaded', () => {
    const listContainer = document.getElementById('listContainer');
    const dentistsTableBody = document.querySelector('#dentistsTable tbody');
    const messageDiv = document.getElementById('message');
    const noDentistsMessage = document.getElementById('noDentistsMessage');
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

    // --- Renderização da Tabela ---
    function renderDentistsTable(dentists) {
        dentistsTableBody.innerHTML = ''; // Limpa a tabela antes de renderizar
        if (dentists.length === 0) {
            noDentistsMessage.style.display = 'block';
            document.getElementById('dentistsTable').style.display = 'none'; // Esconde a tabela vazia
            return;
        } else {
            noDentistsMessage.style.display = 'none';
            document.getElementById('dentistsTable').style.display = 'table'; // Mostra a tabela
        }

        dentists.forEach(dentist => {
            const row = dentistsTableBody.insertRow();
            row.setAttribute('data-id', dentist.id); // Armazena o ID do documento para ações

            // Coluna da Foto
            const photoCell = row.insertCell();
            if (dentist.fotoPerfilURL) {
                const img = document.createElement('img');
                img.src = dentist.fotoPerfilURL;
                img.alt = `Foto de ${dentist.nomeCompleto}`;
                img.classList.add('dentist-photo-small');
                photoCell.appendChild(img);
            } else {
                photoCell.textContent = 'Sem Foto';
            }

            // Outras colunas
            row.insertCell().textContent = dentist.nomeCompleto;
            row.insertCell().textContent = dentist.cro;
            row.insertCell().textContent = dentist.email;
            row.insertCell().textContent = dentist.telefone || 'N/A';
            row.insertCell().textContent = dentist.especialidade;
            row.insertCell().textContent = dentist.enderecoConsultorio;

            // Coluna de Ações
            const actionsCell = row.insertCell();
            actionsCell.classList.add('action-buttons');

            const editButton = document.createElement('button');
            editButton.textContent = 'Editar';
            editButton.classList.add('edit-button');
            editButton.addEventListener('click', () => handleEdit(dentist.id));
            actionsCell.appendChild(editButton);

            const deleteButton = document.createElement('button');
            deleteButton.textContent = 'Excluir';
            deleteButton.classList.add('delete-button');
            deleteButton.addEventListener('click', () => handleDelete(dentist.id, dentist.nomeCompleto, dentist.fotoPerfilURL));
            actionsCell.appendChild(deleteButton);
        });
    }

    // --- Lógica de Ações ---
    function handleEdit(dentistId) {
        // Redireciona para a página de cadastro/edição, passando o ID
        window.location.href = `cadastrodentista.html?id=${dentistId}`;
    }

    async function handleDelete(dentistId, dentistName, photoURL) {
        if (!currentUserId) {
            showMessage("Erro: Nenhum usuário logado.", "error");
            return;
        }

        if (confirm(`Tem certeza que deseja excluir o dentista ${dentistName}? Esta ação é irreversível.`)) {
            try {
                // 1. Excluir a foto do Storage (se existir)
                if (photoURL) {
                    try {
                        const photoRef = ref(storage, photoURL);
                        await deleteObject(photoRef);
                        console.log("Foto do dentista excluída do Storage.");
                    } catch (storageError) {
                        // Se a foto não for encontrada ou houver erro, apenas loga e continua
                        console.warn("Erro ao excluir foto do Storage (pode não existir ou permissões):", storageError);
                    }
                }

                // 2. Excluir o documento do Firestore
                const dentistRef = doc(db, "users", currentUserId, "dentistas", dentistId);
                await deleteDoc(dentistRef);
                console.log("Dentista excluído com sucesso do Firestore:", dentistId);
                showMessage("Dentista excluído com sucesso!", "success");

            } catch (e) {
                console.error("Erro ao excluir dentista:", e);
                showMessage(`Erro ao excluir dentista: ${e.message}`, "error");
            }
        }
    }

    // --- Monitoramento de Autenticação e Carregamento de Dados ---
    onAuthStateChanged(auth, (user) => {
        if (user) {
            currentUserId = user.uid;
            console.log("Usuário logado:", currentUserId);
            listContainer.style.display = 'block'; // Mostra o conteúdo da lista

            const dentistsCollectionRef = collection(db, "users", currentUserId, "dentistas");
            const q = query(dentistsCollectionRef);

            // onSnapshot para atualizações em tempo real
            onSnapshot(q, (querySnapshot) => {
                const dentists = [];
                querySnapshot.forEach((doc) => {
                    dentists.push({ id: doc.id, ...doc.data() });
                });
                renderDentistsTable(dentists);
            }, (error) => {
                console.error("Erro ao carregar dentistas:", error);
                showMessage(`Erro ao carregar dentistas: ${error.message}`, "error");
            });

        } else {
            currentUserId = null;
            console.log("Nenhum usuário logado. Redirecionando ou desabilitando lista.");
            listContainer.style.display = 'none'; // Esconde a lista
            showMessage("Você precisa estar logado para ver os dentistas. Redirecionando...", "error");
            // window.location.href = 'login.html'; // Redireciona para sua página de login
        }
    });
});
