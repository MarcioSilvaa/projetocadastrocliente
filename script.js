document.addEventListener("DOMContentLoaded", () => {
    // Tela de Autenticação / Login Simples
    const loginForm = document.getElementById("login-form");
    const authScreen = document.getElementById("auth-screen");
    const appScreen = document.getElementById("app-screen");
    const logoutBtn = document.getElementById("logout-btn");

    if (loginForm) {
        loginForm.addEventListener("submit", (e) => {
            e.preventDefault();
            authScreen.classList.remove("active");
            appScreen.classList.add("active");
        });
    }

    if (logoutBtn) {
        logoutBtn.addEventListener("click", () => {
            appScreen.classList.remove("active");
            authScreen.classList.add("active");
        });
    }

    // Integração com a API ViaCEP para preenchimento automático
    const cepInput = document.getElementById("client-cep");
    if (cepInput) {
        cepInput.addEventListener("blur", async () => {
            let cep = cepInput.value.replace(/\D/g, ""); // Remove caracteres não numéricos

            if (cep.length === 8) {
                try {
                    const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
                    const data = await response.json();

                    if (!data.erro) {
                        document.getElementById("client-street").value = data.logradouro || "";
                        document.getElementById("client-neighborhood").value = data.bairro || "";
                        document.getElementById("client-city").value = data.localidade || "";
                        document.getElementById("client-uf").value = data.uf || "";
                    } else {
                        alert("CEP não encontrado.");
                    }
                } catch (error) {
                    console.error("Erro ao buscar o CEP:", error);
                }
            }
        });
    }

    // Gerenciamento de Fotos (Upload e Webcam)
    const uploadFile = document.getElementById("upload-file");
    const previewImg = document.getElementById("preview-img");
    const btnWebcam = document.getElementById("btn-webcam");
    const webcamContainer = document.getElementById("webcam-container");
    const webcamVideo = document.getElementById("webcam-video");
    const btnCapture = document.getElementById("btn-capture");
    const webcamCanvas = document.getElementById("webcam-canvas");
    const clientForm = document.getElementById("client-form");

    let mediaStream = null;

    // Converte upload local para Base64
    if (uploadFile) {
        uploadFile.addEventListener("change", (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = function(event) {
                    previewImg.src = event.target.result;
                };
                reader.readAsDataURL(file);
            }
        });
    }

    // Ativar/Desativar Webcam
    if (btnWebcam) {
        btnWebcam.addEventListener("click", async () => {
            webcamContainer.classList.toggle("hidden");
            try {
                if (!mediaStream) {
                    mediaStream = await navigator.mediaDevices.getUserMedia({ video: true });
                    webcamVideo.srcObject = mediaStream;
                }
            } catch (error) {
                alert("Erro ao acessar a webcam. Verifique as permissões do navegador.");
            }
        });
    }

    // Capturar foto da Webcam
    if (btnCapture) {
        btnCapture.addEventListener("click", () => {
            const context = webcamCanvas.getContext("2d");
            webcamCanvas.width = webcamVideo.videoWidth;
            webcamCanvas.height = webcamVideo.videoHeight;
            context.drawImage(webcamVideo, 0, 0, webcamCanvas.width, webcamCanvas.height);
            
            previewImg.src = webcamCanvas.toDataURL("image/png");

            // Desliga a câmera após tirar a foto
            if (mediaStream) {
                mediaStream.getTracks().forEach(track => track.stop());
                mediaStream = null;
            }
            webcamContainer.classList.add("hidden");
        });
    }

    // Validação e Envio do Formulário (Obrigatório com Foto)
    if (clientForm) {
        clientForm.addEventListener("submit", (e) => {
            e.preventDefault();

            // BLOQUEIO: Verifica se a imagem está vazia ou se manteve o estado sem foto
            if (!previewImg.src || previewImg.src === "" || previewImg.src.endsWith("/")) {
                alert("Atenção: É obrigatório adicionar uma foto ou imagem do cliente para realizar o cadastro!");
                return; 
            }

            // Coleta dos dados do formulário
            const nome = document.getElementById("client-name").value;
            const email = document.getElementById("client-email").value;
            const documento = document.getElementById("client-document").value;
            const cidade = document.getElementById("client-city").value;
            const uf = document.getElementById("client-uf").value;
            const fotoBase64 = previewImg.src;

            // Inserção dinâmica na tabela de relatórios/listagem
            const tableBody = document.getElementById("clients-table-body");
            const newRow = document.createElement("tr");

            newRow.innerHTML = `
                <td><img src="${fotoBase64}" alt="Foto" style="width: 40px; height: 40px; border-radius: 50%; object-fit: cover;"></td>
                <td>${nome}</td>
                <td>${documento}</td>
                <td>${email}</td>
                <td>${cidade}/${uf}</td>
                <td><button type="button" class="btn btn-danger btn-sm" onclick="this.closest('tr').remove()">Excluir</button></td>
            `;

            tableBody.appendChild(newRow);

            // Reseta o formulário e limpa a foto após o sucesso
            clientForm.reset();
            previewImg.src = "";
        });
    }

    // Botão Limpar
    const btnClear = document.getElementById("btn-clear");
    if (btnClear) {
        btnClear.addEventListener("click", () => {
            clientForm.reset();
            previewImg.src = "";
        });
    }
});