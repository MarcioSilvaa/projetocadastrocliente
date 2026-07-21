// Importa a função de inicialização do Firebase Core SDK v12.16.0
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.16.0/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/12.16.0/firebase-auth.js";
import { getFirestore, collection, addDoc, getDocs, doc, getDoc, updateDoc, deleteDoc } from "https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js";
import { getStorage, ref, uploadString, getDownloadURL } from "https://www.gstatic.com/firebasejs/12.16.0/firebase-storage.js";

const firebaseConfig = {
    apiKey: "AIzaSyB2gDmwm3g5D2PTXY5wpOw9KaNr_TipNUA",
    authDomain: "projetosistemacadastro-6125b.firebaseapp.com",
    projectId: "projetosistemacadastro-6125b",
    storageBucket: "projetosistemacadastro-6125b.firebasestorage.app",
    messagingSenderId: "908779527154",
    appId: "1:908779527154:web:f7f1c4fc41522f82d2296b"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

const authScreen = document.getElementById('auth-screen');
const appScreen = document.getElementById('app-screen');
const loginForm = document.getElementById('login-form');
const loginEmailInput = document.getElementById('login-email');
const loginPasswordInput = document.getElementById('login-password');
const authErrorEl = document.getElementById('auth-error');
const logoutBtn = document.getElementById('logout-btn');

const clientForm = document.getElementById('client-form');
const clientIdInput = document.getElementById('client-id');
const clientNameInput = document.getElementById('client-name');
const clientEmailInput = document.getElementById('client-email');
const clientDocumentInput = document.getElementById('client-document');
const clientCepInput = document.getElementById('client-cep');
const clientStreetInput = document.getElementById('client-street');
const clientNumberInput = document.getElementById('client-number');
const clientComplementInput = document.getElementById('client-complement');
const clientNeighborhoodInput = document.getElementById('client-neighborhood');
const clientCityInput = document.getElementById('client-city');
const clientUfInput = document.getElementById('client-uf');

const docTypeButtons = document.querySelectorAll('.btn-doc');
let currentDocType = 'CPF';

const previewImg = document.getElementById('preview-img');
const uploadFileInput = document.getElementById('upload-file');
const btnWebcam = document.getElementById('btn-webcam');
const webcamContainer = document.getElementById('webcam-container');
const webcamVideo = document.getElementById('webcam-video');
const btnCapture = document.getElementById('btn-capture');
const webcamCanvas = document.getElementById('webcam-canvas');
let clientPhotoBase64 = '';
let mediaStream = null;

const btnSave = document.getElementById('btn-save');
const btnUpdate = document.getElementById('btn-update');
const btnDelete = document.getElementById('btn-delete');
const btnClear = document.getElementById('btn-clear');

const clientsTableBody = document.getElementById('clients-table-body');
const filterCityInput = document.getElementById('filter-city');
const filterUfInput = document.getElementById('filter-uf');
const btnPrintCity = document.getElementById('btn-print-city');
const btnPrintUf = document.getElementById('btn-print-uf');
const btnPrintAll = document.getElementById('btn-print-all');

onAuthStateChanged(auth, (user) => {
    if (user) {
        authScreen.classList.remove('active');
        appScreen.classList.add('active');
        loadClientsTable();
    } else {
        appScreen.classList.remove('active');
        authScreen.classList.add('active');
    }
});

loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    authErrorEl.textContent = '';
    try {
        await signInWithEmailAndPassword(auth, loginEmailInput.value, loginPasswordInput.value);
    } catch (error) {
        authErrorEl.textContent = 'Erro ao fazer login: ' + error.message;
    }
});

logoutBtn.addEventListener('click', async () => {
    try {
        await signOut(auth);
    } catch (error) {
        console.error('Erro ao sair:', error);
    }
});

docTypeButtons.forEach(button => {
    button.addEventListener('click', () => {
        docTypeButtons.forEach(btn => btn.classList.remove('active'));
        button.classList.add('active');
        currentDocType = button.getAttribute('data-type');
        clientDocumentInput.value = '';
        applyDocumentMask();
    });
});

function applyDocumentMask() {
    const value = clientDocumentInput.value.replace(/\D/g, '');
    if (currentDocType === 'CPF') {
        clientDocumentInput.setAttribute('maxlength', '14');
        clientDocumentInput.value = value.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
    } else if (currentDocType === 'RG') {
        clientDocumentInput.setAttribute('maxlength', '12');
        clientDocumentInput.value = value.replace(/(\d{2})(\d{3})(\d{3})(\d{1})/, '$1.$2.$3-$4');
    } else {
        clientDocumentInput.setAttribute('maxlength', '11');
        clientDocumentInput.value = value;
    }
}

clientDocumentInput.addEventListener('input', applyDocumentMask);

uploadFileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (uploadEvent) => {
            clientPhotoBase64 = uploadEvent.target.result;
            previewImg.src = clientPhotoBase64;
        };
        reader.readAsDataURL(file);
    }
});

btnWebcam.addEventListener('click', async () => {
    webcamContainer.classList.remove('hidden');
    try {
        mediaStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        webcamVideo.srcObject = mediaStream;
    } catch (error) {
        alert('Não foi possível acessar a webcam: ' + error.message);
        webcamContainer.classList.add('hidden');
    }
});

btnCapture.addEventListener('click', () => {
    const width = webcamVideo.videoWidth;
    const height = webcamVideo.videoHeight;
    webcamCanvas.width = width;
    webcamCanvas.height = height;
    const context = webcamCanvas.getContext('2d');
    context.drawImage(webcamVideo, 0, 0, width, height);
    clientPhotoBase64 = webcamCanvas.toDataURL('image/png');
    previewImg.src = clientPhotoBase64;

    if (mediaStream) {
        mediaStream.getTracks().forEach(track => track.stop());
    }
    webcamContainer.classList.add('hidden');
});

clientCepInput.addEventListener('blur', async () => {
    const cep = clientCepInput.value.replace(/\D/g, '');
    if (cep.length === 8) {
        try {
            const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
            const data = await response.json();
            if (!data.erro) {
                clientStreetInput.value = data.logradouro;
                clientNeighborhoodInput.value = data.bairro;
                clientCityInput.value = data.localidade;
                clientUfInput.value = data.uf;
                clientNumberInput.focus();
            } else {
                alert('CEP não encontrado.');
            }
        } catch (error) {
            console.error('Erro ao buscar CEP:', error);
        }
    }
});

async function uploadPhotoToStorage(clientId) {
    const storageRef = ref(storage, `clients_photos/${clientId}.png`);
    await uploadString(storageRef, clientPhotoBase64, 'data_url');
    const downloadURL = await getDownloadURL(storageRef);
    return downloadURL;
}

clientForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    // VALIDAÇÃO OBRIGATÓRIA: Bloqueia o cadastro se não houver foto
    if (!clientPhotoBase64) {
        alert('A foto é obrigatória! Por favor, faça o upload ou capture uma imagem.');
        return;
    }

    try {
        const clientData = {
            name: clientNameInput.value,
            email: clientEmailInput.value,
            docType: currentDocType,
            document: clientDocumentInput.value,
            cep: clientCepInput.value,
            street: clientStreetInput.value,
            number: clientNumberInput.value,
            complement: clientComplementInput.value || '',
            neighborhood: clientNeighborhoodInput.value,
            city: clientCityInput.value,
            uf: clientUfInput.value.toUpperCase(),
            photoUrl: '',
            createdAt: new Date().toISOString()
        };

        // 1. Salva o documento no Firestore primeiro para obter o ID
        const docRef = await addDoc(collection(db, "clients"), clientData);
        
        // 2. Faz o upload da foto usando o ID do documento gerado
        const photoUrl = await uploadPhotoToStorage(docRef.id);
        
        // 3. Atualiza o registro com o link definitivo da imagem no Storage
        await updateDoc(docRef, { photoUrl: photoUrl });

        alert('Cliente cadastrado com sucesso!');
        clearForm();
        loadClientsTable();
    } catch (error) {
        alert('Erro ao cadastrar cliente: ' + error.message);
    }
});

async function loadClientsTable() {
    clientsTableBody.innerHTML = '';
    try {
        const querySnapshot = await getDocs(collection(db, "clients"));
        querySnapshot.forEach((docSnap) => {
            const client = docSnap.data();
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><img src="${client.photoUrl || 'https://via.placeholder.com/40'}" alt="Foto" class="table-avatar"></td>
                <td>${client.name}</td>
                <td>${client.docType}: ${client.document}</td>
                <td>${client.email}</td>
                <td>${client.city} / ${client.uf}</td>
                <td>
                    <button type="button" class="btn btn-warning btn-sm" onclick="window.editClient('${docSnap.id}')">Editar</button>
                </td>
            `;
            clientsTableBody.appendChild(tr);
        });
    } catch (error) {
        console.error('Erro ao carregar clientes:', error);
    }
}

window.editClient = async function(id) {
    try {
        const docRef = doc(db, "clients", id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            const client = docSnap.data();
            clientIdInput.value = docSnap.id;
            clientNameInput.value = client.name;
            clientEmailInput.value = client.email;
            
            currentDocType = client.docType;
            docTypeButtons.forEach(btn => {
                if (btn.getAttribute('data-type') === currentDocType) {
                    btn.classList.add('active');
                } else {
                    btn.classList.remove('active');
                }
            });

            clientDocumentInput.value = client.document;
            clientCepInput.value = client.cep;
            clientStreetInput.value = client.street;
            clientNumberInput.value = client.number;
            clientComplementInput.value = client.complement || '';
            clientNeighborhoodInput.value = client.neighborhood;
            clientCityInput.value = client.city;
            clientUfInput.value = client.uf;
            
            clientPhotoBase64 = client.photoUrl || '';
            previewImg.src = client.photoUrl || 'https://via.placeholder.com/120';

            btnSave.disabled = true;
            btnUpdate.disabled = false;
            btnDelete.disabled = false;
        }
    } catch (error) {
        alert('Erro ao carregar dados para edição: ' + error.message);
    }
};

btnUpdate.addEventListener('click', async () => {
    const id = clientIdInput.value;
    if (!id) return;

    if (!clientPhotoBase64) {
        alert('A foto é obrigatória para atualizar o cliente.');
        return;
    }

    try {
        const clientData = {
            name: clientNameInput.value,
            email: clientEmailInput.value,
            docType: currentDocType,
            document: clientDocumentInput.value,
            cep: clientCepInput.value,
            street: clientStreetInput.value,
            number: clientNumberInput.value,
            complement: clientComplementInput.value || '',
            neighborhood: clientNeighborhoodInput.value,
            city: clientCityInput.value,
            uf: clientUfInput.value.toUpperCase(),
        };

        if (!clientPhotoBase64.startsWith('http')) {
            const photoUrl = await uploadPhotoToStorage(id);
            clientData.photoUrl = photoUrl;
        }

        const docRef = doc(db, "clients", id);
        await updateDoc(docRef, clientData);
        alert('Cliente atualizado com sucesso!');
        clearForm();
        loadClientsTable();
    } catch (error) {
        alert('Erro ao atualizar cliente: ' + error.message);
    }
});

btnDelete.addEventListener('click', async () => {
    const id = clientIdInput.value;
    if (!id) return;
    if (confirm('Tem certeza que deseja excluir este cliente?')) {
        try {
            await deleteDoc(doc(db, "clients", id));
            alert('Cliente excluído com sucesso!');
            clearForm();
            loadClientsTable();
        } catch (error) {
            alert('Erro ao excluir cliente: ' + error.message);
        }
    }
});

btnClear.addEventListener('click', clearForm);

function clearForm() {
    clientForm.reset();
    clientIdInput.value = '';
    clientPhotoBase64 = '';
    previewImg.src = 'https://via.placeholder.com/120';
    currentDocType = 'CPF';
    docTypeButtons.forEach((btn, index) => {
        if (index === 0) btn.classList.add('active');
        else btn.classList.remove('active');
    });
    btnSave.disabled = false;
    btnUpdate.disabled = true;
    btnDelete.disabled = true;
}

btnPrintAll.addEventListener('click', () => {
    window.print();
});

btnPrintCity.addEventListener('click', async () => {
    const cityFilter = filterCityInput.value.trim().toLowerCase();
    if (!cityFilter) {
        alert('Digite uma cidade para filtrar.');
        return;
    }
    try {
        const querySnapshot = await getDocs(collection(db, "clients"));
        clientsTableBody.innerHTML = '';
        let found = false;
        querySnapshot.forEach((docSnap) => {
            const client = docSnap.data();
            if (client.city && client.city.toLowerCase().includes(cityFilter)) {
                found = true;
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td><img src="${client.photoUrl || 'https://via.placeholder.com/40'}" alt="Foto" class="table-avatar"></td>
                    <td>${client.name}</td>
                    <td>${client.docType}: ${client.document}</td>
                    <td>${client.email}</td>
                    <td>${client.city} / ${client.uf}</td>
                    <td><button type="button" class="btn btn-warning btn-sm" onclick="window.editClient('${docSnap.id}')">Editar</button></td>
                `;
                clientsTableBody.appendChild(tr);
            }
        });
        if (found) {
            window.print();
        } else {
            alert('Nenhum cliente encontrado para esta cidade.');
        }
        loadClientsTable();
    } catch (error) {
        console.error('Erro ao filtrar por cidade:', error);
    }
});

btnPrintUf.addEventListener('click', async () => {
    const ufFilter = filterUfInput.value.trim().toUpperCase();
    if (!ufFilter) {
        alert('Digite uma UF para filtrar.');
        return;
    }
    try {
        const querySnapshot = await getDocs(collection(db, "clients"));
        clientsTableBody.innerHTML = '';
        let found = false;
        querySnapshot.forEach((docSnap) => {
            const client = docSnap.data();
            if (client.uf && client.uf.toUpperCase() === ufFilter) {
                found = true;
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td><img src="${client.photoUrl || 'https://via.placeholder.com/40'}" alt="Foto" class="table-avatar"></td>
                    <td>${client.name}</td>
                    <td>${client.docType}: ${client.document}</td>
                    <td>${client.email}</td>
                    <td>${client.city} / ${client.uf}</td>
                    <td><button type="button" class="btn btn-warning btn-sm" onclick="window.editClient('${docSnap.id}')">Editar</button></td>
                `;
                clientsTableBody.appendChild(tr);
            }
        });
        if (found) {
            window.print();
        } else {
            alert('Nenhum cliente encontrado para esta UF.');
        }
        loadClientsTable();
    } catch (error) {
        console.error('Erro ao filtrar por UF:', error);
    }
});