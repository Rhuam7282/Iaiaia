// Client.js melhorado com UX aprimorada
document.addEventListener("DOMContentLoaded", () => {
  // Elementos da interface
  const chatContainer = document.getElementById("chat-container");
  const messageInput = document.getElementById("message-input");
  const sendButton = document.getElementById("send-button");
  const resetButton = document.getElementById("reset-button");
  const historyButton = document.getElementById("history-button");
  const historyPanel = document.getElementById("history-panel");
  const closeHistoryBtn = document.getElementById("close-history");
  const adminLoginButton = document.getElementById("admin-login-button");
  const loginModal = document.getElementById("login-modal");
  const adminPasswordInput = document.getElementById("admin-password");
  const loginSubmitButton = document.getElementById("login-submit");
  const loginCancelButton = document.querySelector(".close");
  const loginMessage = document.getElementById("login-message");
  const charCountEl = document.getElementById("char-count");
  const loadingOverlay = document.getElementById("loading-overlay");
  const toast = document.getElementById("toast");

  // Configuração
  const backendUrl = process.env.REACT_APP_BACKEND_URL || "http://localhost:3000";
  let currentSessionId = null;
  let chatHistory = [];
  let isFirstMessage = true;
  let isProcessing = false;

  // --- FUNÇÕES DE UTILIDADE ---

  // Mostrar toast de notificação
  function showToast(message, type = "info") {
    toast.textContent = message;
    toast.className = `toast toast-${type} show`;
    setTimeout(() => {
      toast.classList.remove("show");
    }, 3000);
  }

  // Mostrar/esconder loading overlay
  function toggleLoading(show) {
    loadingOverlay.style.display = show ? "flex" : "none";
  }

  // Validar mensagem
  function validateMessage(msg) {
    if (!msg || msg.trim().length === 0) {
      showToast("Digite uma mensagem!", "warning");
      return false;
    }
    if (msg.length > 500) {
      showToast("Mensagem muito longa! Máximo 500 caracteres.", "error");
      return false;
    }
    return true;
  }

  // Atualizar contador de caracteres
  messageInput.addEventListener("input", () => {
    const count = messageInput.value.length;
    charCountEl.textContent = count;
    if (count > 450) {
      charCountEl.style.color = "var(--blood-red)";
    } else {
      charCountEl.style.color = "var(--jojo-sand)";
    }
  });

  // --- AÇÕES RÁPIDAS ---
  document.querySelectorAll(".quick-action-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const action = btn.dataset.action;
      let message = "";
      
      switch(action) {
        case "clima":
          message = "Qual o clima hoje em São Paulo?";
          break;
        case "hora":
          message = "Que horas são agora?";
          break;
        case "apresentacao":
          message = "Quem é você?";
          break;
      }
      
      messageInput.value = message;
      messageInput.focus();
    });
  });

  // --- FUNÇÕES DE CHAT ---

  function addMessage(text, sender, extraData = null) {
    // Remover mensagem de boas-vindas na primeira interação
    const welcomeMsg = document.querySelector(".welcome-message");
    if (welcomeMsg && sender === "user") {
      welcomeMsg.remove();
    }

    const msgDiv = document.createElement("div");
    msgDiv.className = `message ${sender}-message`;
    
    // Animação de entrada
    msgDiv.style.opacity = "0";
    msgDiv.style.transform = "translateY(10px)";

    if (sender === "bot" && extraData && !isFirstMessage) {
      let content = text;

      // Adicionar informações de clima se disponível
      if (extraData.weatherData) {
        const weather = extraData.weatherData;
        content += `\n\n🌤️ <strong>Informações do Clima - ${weather.cidade}, ${weather.pais}:</strong>
📊 Temperatura: ${weather.temperatura}°C (sensação ${weather.sensacao_termica}°C)
🌦️ Condição: ${weather.descricao}
💧 Umidade: ${weather.umidade}%
💨 Vento: ${weather.vento} km/h
🔽 Pressão: ${weather.pressao} hPa
👁️ Visibilidade: ${weather.visibilidade} km
☀️ Índice UV: ${weather.uv_index}
🌅 Nascer do sol: ${weather.nascer_sol}
🌇 Pôr do sol: ${weather.por_sol}`;

        if (weather.previsao_proximas_horas && weather.previsao_proximas_horas.length > 0) {
          content += `\n\n⏰ <strong>Previsão próximas horas:</strong>`;
          weather.previsao_proximas_horas.forEach((hora) => {
            content += `\n${hora.hora}: ${hora.temperatura}°C, ${hora.descricao} (${hora.probabilidade_chuva}% chuva)`;
          });
        }
      }

      // Adicionar informações de horário se disponível
      if (extraData.timeData) {
        const time = extraData.timeData;
        content += `\n\n🕐 <strong>Informações de Horário:</strong>
📅 Data completa: ${time.data_completa}
⏰ Hora atual: ${time.hora_atual}
📆 Data: ${time.data_atual}
📅 Dia da semana: ${time.dia_semana}`;
      }

      msgDiv.innerHTML = content.replace(/\n/g, "<br>");
    } else {
      msgDiv.textContent = text;
    }

    chatContainer.appendChild(msgDiv);
    
    // Animar entrada
    setTimeout(() => {
      msgDiv.style.transition = "all 0.3s ease";
      msgDiv.style.opacity = "1";
      msgDiv.style.transform = "translateY(0)";
    }, 10);
    
    chatContainer.scrollTop = chatContainer.scrollHeight;
  }

  async function createNewSession() {
    try {
      toggleLoading(true);
      const response = await fetch(`${backendUrl}/api/chat/nova-sessao`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      currentSessionId = data.sessionId;
      chatHistory = [];
      chatContainer.innerHTML = `
        <div class="welcome-message">
          <h2>🧛‍♂️ KONO DIO DA!</h2>
          <p>Bem-vindo à presença do grande Dio-sama! Como ousa me questionar, mortal?</p>
          <div class="quick-actions">
            <button class="quick-action-btn" data-action="clima">🌤️ Ver Clima</button>
            <button class="quick-action-btn" data-action="hora">🕐 Ver Horário</button>
            <button class="quick-action-btn" data-action="apresentacao">👋 Apresentação</button>
          </div>
        </div>
      `;
      isFirstMessage = true;
      
      // Reativar ações rápidas
      document.querySelectorAll(".quick-action-btn").forEach(btn => {
        btn.addEventListener("click", () => {
          const action = btn.dataset.action;
          let message = "";
          
          switch(action) {
            case "clima":
              message = "Qual o clima hoje em São Paulo?";
              break;
            case "hora":
              message = "Que horas são agora?";
              break;
            case "apresentacao":
              message = "Quem é você?";
              break;
          }
          
          messageInput.value = message;
          messageInput.focus();
        });
      });

      showToast("Nova conversa iniciada! WRYYY!", "success");
      toggleLoading(false);
      return data.sessionId;
    } catch (error) {
      console.error("Erro ao criar nova sessão:", error);
      toggleLoading(false);
      showToast("Erro ao criar nova sessão. Verifique sua conexão!", "error");
      
      // Fallback
      currentSessionId = `sessao_${Date.now()}_${Math.random().toString(36).substr(2, 8)}`;
      chatHistory = [];
      isFirstMessage = true;
      return currentSessionId;
    }
  }

  async function loadSession(sessionId) {
    try {
      toggleLoading(true);
      const response = await fetch(`${backendUrl}/api/chat/historico/${sessionId}`);
      
      if (!response.ok) {
        throw new Error("Erro ao carregar sessão");
      }
      
      const data = await response.json();

      chatContainer.innerHTML = "";
      if (data.messages && data.messages.length > 0) {
        data.messages.forEach((msg) => {
          addMessage(msg.parts[0].text, msg.role === "user" ? "user" : "bot");
        });
      }

      currentSessionId = sessionId;
      chatHistory = data.messages || [];
      isFirstMessage = chatHistory.length === 0;
      historyPanel.classList.remove("show");
      
      showToast("Conversa carregada!", "success");
      toggleLoading(false);
    } catch (error) {
      console.error("Erro ao carregar sessão:", error);
      showToast("Erro ao carregar sessão!", "error");
      toggleLoading(false);
    }
  }

  async function sendMessage() {
    const message = messageInput.value.trim();
    
    if (!validateMessage(message)) return;
    if (isProcessing) {
      showToast("Aguarde a resposta anterior!", "warning");
      return;
    }

    // Se não há sessão atual, criar uma nova
    if (!currentSessionId) {
      await createNewSession();
    }

    isProcessing = true;
    sendButton.disabled = true;
    sendButton.textContent = "⏳ Enviando...";

    addMessage(message, "user");
    messageInput.value = "";
    charCountEl.textContent = "0";

    // Mostrar indicador de digitação
    const typingDiv = document.createElement("div");
    typingDiv.className = "message bot-message typing-indicator";
    typingDiv.innerHTML = `
      <span class="typing-dot"></span>
      <span class="typing-dot"></span>
      <span class="typing-dot"></span>
      <span style="margin-left: 10px;">Dio-sama está pensando...</span>
    `;
    chatContainer.appendChild(typingDiv);
    chatContainer.scrollTop = chatContainer.scrollHeight;

    try {
      const response = await fetch(`${backendUrl}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message,
          chatHistory,
          sessionId: currentSessionId,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      // Remover indicador de digitação
      chatContainer.removeChild(typingDiv);

      addMessage(data.response, "bot", {
        weatherData: data.weatherData,
        timeData: data.timeData,
      });

      chatHistory = data.historico;
      isFirstMessage = false;
    } catch (error) {
      console.error("Erro ao enviar mensagem:", error);
      chatContainer.removeChild(typingDiv);
      addMessage(
        "WRYYY! Erro ao contactar Dio-sama! Verifique sua conexão e tente novamente!",
        "error"
      );
      showToast("Erro de conexão com o servidor!", "error");
    } finally {
      isProcessing = false;
      sendButton.disabled = false;
      sendButton.textContent = "📤 Enviar";
      messageInput.focus();
    }
  }

  async function resetChat() {
    if (isProcessing) {
      showToast("Aguarde o processamento atual!", "warning");
      return;
    }
    await createNewSession();
  }

  async function showHistory() {
    try {
      toggleLoading(true);
      const response = await fetch(`${backendUrl}/api/chat/sessoes`);
      
      if (!response.ok) {
        throw new Error("Erro ao carregar histórico");
      }
      
      const sessions = await response.json();
      const historyContent = document.getElementById("history-content");

      if (sessions.length === 0) {
        historyContent.innerHTML = '<div class="no-history">📭 Nenhum histórico encontrado</div>';
      } else {
        historyContent.innerHTML = sessions
          .map((session) => {
            const lastMessage =
              session.messages && session.messages.length > 0
                ? session.messages[session.messages.length - 1].parts[0].text.substring(0, 50)
                : "Nova conversa";

            return `
              <div class="history-item" data-id="${session.sessionId}">
                <div class="history-header">
                  <small>📅 ${new Date(session.lastUpdated).toLocaleString("pt-BR")}</small>
                  <button class="delete-session" data-id="${session.sessionId}" title="Deletar conversa">🗑️</button>
                </div>
                <p>${lastMessage}${lastMessage.length >= 50 ? "..." : ""}</p>
              </div>
            `;
          })
          .join("");
      }

      historyPanel.classList.add("show");
      toggleLoading(false);

      // Event listeners para carregar sessões
      document.querySelectorAll(".history-item").forEach((item) => {
        item.addEventListener("click", (e) => {
          if (!e.target.classList.contains("delete-session")) {
            loadSession(item.dataset.id);
          }
        });
      });

      // Event listeners para deletar sessões
      document.querySelectorAll(".delete-session").forEach((button) => {
        button.addEventListener("click", async (e) => {
          e.stopPropagation();
          const sessionId = button.dataset.id;

          if (confirm("Tem certeza que deseja deletar esta conversa?")) {
            try {
              const deleteResponse = await fetch(`${backendUrl}/api/chat/sessao/${sessionId}`, {
                method: "DELETE",
              });

              if (deleteResponse.ok) {
                button.closest(".history-item").remove();
                showToast("Conversa deletada!", "success");

                if (sessionId === currentSessionId) {
                  await createNewSession();
                }
              } else {
                throw new Error("Erro ao deletar");
              }
            } catch (error) {
              console.error("Erro ao deletar sessão:", error);
              showToast("Erro ao deletar sessão!", "error");
            }
          }
        });
      });
    } catch (error) {
      console.error("Erro ao carregar histórico:", error);
      const historyContent = document.getElementById("history-content");
      historyContent.innerHTML = '<div class="error">❌ Erro ao carregar histórico</div>';
      historyPanel.classList.add("show");
      toggleLoading(false);
      showToast("Erro ao carregar histórico!", "error");
    }
  }

  // Testar conexão com o backend
  async function testConnection() {
    try {
      const response = await fetch(`${backendUrl}/api/horario`);
      if (response.ok) {
        console.log("✅ Conexão com backend estabelecida");
        return true;
      }
    } catch (error) {
      console.error("❌ Erro de conexão com backend:", error);
      showToast("⚠️ Erro de conexão com o servidor!", "error");
      return false;
    }
  }

  // --- EVENT LISTENERS ---

  sendButton.addEventListener("click", sendMessage);
  resetButton.addEventListener("click", resetChat);
  historyButton.addEventListener("click", showHistory);
  closeHistoryBtn.addEventListener("click", () => {
    historyPanel.classList.remove("show");
  });

  messageInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  });

  // Fechar painel de histórico ao clicar fora
  document.addEventListener("click", (e) => {
    if (!historyPanel.contains(e.target) && !historyButton.contains(e.target)) {
      historyPanel.classList.remove("show");
    }
  });

  // --- MODAL DE LOGIN ADMIN ---

  adminLoginButton.addEventListener("click", () => {
    loginModal.style.display = "block";
    adminPasswordInput.focus();
  });

  loginCancelButton.addEventListener("click", () => {
    loginModal.style.display = "none";
    adminPasswordInput.value = "";
    loginMessage.textContent = "";
  });

  loginSubmitButton.addEventListener("click", async () => {
    const password = adminPasswordInput.value;

    if (!password) {
      loginMessage.textContent = "Digite a senha!";
      loginMessage.style.color = "var(--blood-red)";
      return;
    }

    try {
      loginSubmitButton.disabled = true;
      loginSubmitButton.textContent = "Verificando...";

      const response = await fetch(`${backendUrl}/api/admin/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      if (response.ok) {
        const data = await response.json();
        localStorage.setItem("adminToken", data.token);
        showToast("Login bem-sucedido! WRYYY!", "success");
        setTimeout(() => {
          window.location.href = "/admin.html";
        }, 500);
      } else {
        const errorData = await response.json();
        loginMessage.textContent = errorData.error || "Senha incorreta!";
        loginMessage.style.color = "var(--blood-red)";
      }
    } catch (error) {
      console.error("Erro no login:", error);
      loginMessage.textContent = "Erro ao conectar com o servidor";
      loginMessage.style.color = "var(--blood-red)";
    } finally {
      loginSubmitButton.disabled = false;
      loginSubmitButton.textContent = "Entrar";
    }
  });

  // Enter no campo de senha
  adminPasswordInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
      loginSubmitButton.click();
    }
  });

  // Fechar modal ao clicar fora
  window.addEventListener("click", (e) => {
    if (e.target === loginModal) {
      loginModal.style.display = "none";
      adminPasswordInput.value = "";
      loginMessage.textContent = "";
    }
  });

  // --- INICIALIZAÇÃO ---
  async function init() {
    toggleLoading(true);
    const connected = await testConnection();
    if (connected) {
      await createNewSession();
      showToast("Bem-vindo ao poder do Dio-sama! WRYYY!", "success");
    }
    toggleLoading(false);
    messageInput.focus();
  }

  init();
});
