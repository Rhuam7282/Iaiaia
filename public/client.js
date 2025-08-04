document.addEventListener("DOMContentLoaded", () => {
  // Elementos da splash screen
  const splashScreen = document.getElementById("splash-screen");
  const startChatButton = document.getElementById("start-chat-button");
  const appContainer = document.getElementById("app-container");

  // Elementos do chat
  const chatContainer = document.getElementById("chat-container");
  const messageInput = document.getElementById("message-input");
  const sendButton = document.getElementById("send-button");
  const resetButton = document.getElementById("reset-button");
  const statusArea = document.getElementById("status-area");

<<<<<<< HEAD
  // Elementos do histórico
  const chatHistorySidebar = document.getElementById("chat-history-sidebar");
  const historyList = document.getElementById("history-list");
  const refreshHistoryButton = document.getElementById("refresh-history-button");

=======
>>>>>>> 9d1c67de636a6c33e20de079e008e4ebe2f763a9
  // Configuração do backend
  const backendUrl = 'https://aiaiai-ibk2.onrender.com'; // URL do backend no Render

  // Variáveis para controle de sessão
  let currentSessionId = `sessao_${Date.now()}_${Math.random().toString(36).substring(7)}`;
  let chatStartTime = new Date();
  let chatHistory = [];
  let isLoadingHistory = false;

  // --- Funções da Splash Screen ---

  function showChatInterface() {
    splashScreen.style.display = "none";
    appContainer.style.display = "flex";
    
    // Carregar histórico de conversas
    loadChatHistory();
    
    // Mensagem de boas-vindas inicial
    addMessage("WRYYY! Você ousa se aproximar de mim, Dio-sama? Muito bem, mortal... Faça sua pergunta e talvez eu conceda minha sabedoria suprema! Posso até mesmo revelar os segredos do clima e do tempo de qualquer lugar do mundo!", "bot");
  }

  // --- Funções do Histórico ---

  async function loadChatHistory() {
    try {
      const response = await fetch(`${backendUrl}/api/chat/historicos?limit=10`);
      if (!response.ok) {
        throw new Error("Falha ao carregar histórico");
      }
      
      const data = await response.json();
      displayHistoryList(data.historicos);
    } catch (error) {
      console.error("Erro ao carregar histórico:", error);
      // Não mostrar erro para o usuário, apenas log
    }
  }

  function displayHistoryList(historicos) {
    historyList.innerHTML = "";
    
    if (historicos.length === 0) {
      const emptyItem = document.createElement("li");
      emptyItem.textContent = "Nenhuma conversa anterior";
      emptyItem.classList.add("empty-history");
      historyList.appendChild(emptyItem);
      return;
    }

    historicos.forEach(hist => {
      const listItem = document.createElement("li");
      listItem.classList.add("history-item");
      listItem.dataset.sessionId = hist.sessionId;
      
      const date = new Date(hist.startTime).toLocaleDateString('pt-BR');
      const time = new Date(hist.startTime).toLocaleTimeString('pt-BR', { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
      
      listItem.innerHTML = `
        <div class="history-preview">${hist.preview}</div>
        <div class="history-date">${date} ${time}</div>
      `;
      
      listItem.addEventListener("click", () => loadSpecificChat(hist.sessionId));
      historyList.appendChild(listItem);
    });
  }

  async function loadSpecificChat(sessionId) {
    if (isLoadingHistory) return;
    
    try {
      isLoadingHistory = true;
      statusArea.textContent = "Carregando conversa...";
      
      const response = await fetch(`${backendUrl}/api/chat/historico/${sessionId}`);
      if (!response.ok) {
        throw new Error("Falha ao carregar conversa específica");
      }
      
      const data = await response.json();
      
      // Limpar chat atual
      chatContainer.innerHTML = "";
      
      // Atualizar variáveis de sessão
      currentSessionId = data.sessionId;
      chatStartTime = new Date(data.startTime);
      chatHistory = data.messages;
      
      // Exibir mensagens da conversa carregada
      data.messages.forEach(msg => {
        const sender = msg.role === 'user' ? 'user' : 'bot';
        addMessage(msg.parts[0].text, sender);
      });
      
      statusArea.textContent = "Conversa carregada! Você pode continuar de onde parou.";
      setTimeout(() => {
        statusArea.textContent = "";
      }, 3000);
      
    } catch (error) {
      console.error("Erro ao carregar conversa específica:", error);
      statusArea.textContent = "Erro ao carregar conversa.";
      setTimeout(() => {
        statusArea.textContent = "";
      }, 3000);
    } finally {
      isLoadingHistory = false;
    }
  }

  // --- Funções Auxiliares do Chat (mantidas do código original) ---

  function addMessage(message, sender) {
    const messageDiv = document.createElement("div");
    messageDiv.classList.add("message", `${sender}-message`);

    // Sanitização básica
    const textNode = document.createTextNode(message);
    messageDiv.appendChild(textNode);

    chatContainer.appendChild(messageDiv);
    scrollToBottom();
  }

  function addErrorMessage(message) {
    const errorDiv = document.createElement("div");
    errorDiv.classList.add("message", "error-message");
    errorDiv.textContent = `Erro: ${message}`;
    chatContainer.appendChild(errorDiv);
    scrollToBottom();
  }

  function scrollToBottom() {
    chatContainer.scrollTop = chatContainer.scrollHeight;
  }

  function showTypingIndicator() {
    const typingDiv = document.createElement("div");
    typingDiv.classList.add("message", "bot-message", "typing-indicator");
    typingDiv.id = "typing-indicator";
    typingDiv.innerHTML = `
      <span></span>
      <span></span>
      <span></span>
      Dio-sama está pensando...
    `;
    chatContainer.appendChild(typingDiv);
    scrollToBottom();
  }

  function removeTypingIndicator() {
    const typingIndicator = document.getElementById("typing-indicator");
    if (typingIndicator) {
      typingIndicator.remove();
    }
  }

  // --- Funções de API (mantidas do código original) ---

  async function getUserInfo() {
    try {
      const response = await fetch(`${backendUrl}/api/user-info`);
      if (!response.ok) {
        throw new Error("Falha ao obter informações do usuário");
      }
      return await response.json();
    } catch (error) {
      console.error("Erro ao obter informações do usuário:", error);
      return { ip: "127.0.0.1", timestamp: new Date().toISOString() };
    }
  }

  async function registrarConexaoUsuario() {
    try {
      const userInfo = await getUserInfo();
      const logData = {
        ip: userInfo.ip,
        acao: "acesso_inicial_chatbot"
      };

      const response = await fetch(`${backendUrl}/api/log-connection`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(logData)
      });

      if (!response.ok) {
        console.error("Falha ao registrar conexão:", await response.text());
      } else {
        const result = await response.json();
        console.log("Conexão registrada:", result.message);
      }
    } catch (error) {
      console.error("Erro ao registrar conexão:", error);
    }
  }

  async function registrarAcessoBotParaRanking(botId, nomeBot) {
    try {
      const dataRanking = {
        botId: botId,
        nomeBot: nomeBot,
        timestampAcesso: new Date().toISOString()
      };

      const response = await fetch(`${backendUrl}/api/ranking/registrar-acesso-bot`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dataRanking)
      });

      if (!response.ok) {
        console.error("Falha ao registrar acesso para ranking:", await response.text());
      } else {
        const result = await response.json();
        console.log("Registro de ranking:", result.message);
      }
    } catch (error) {
      console.error("Erro ao registrar acesso para ranking:", error);
    }
  }

  async function salvarHistoricoSessao(sessionId, botId, startTime, endTime, messages) {
    try {
      const payload = {
        sessionId,
        botId,
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
        messages
      };

      const response = await fetch(`${backendUrl}/api/chat/salvar-historico`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error("Falha ao salvar histórico:", errorData.error || response.statusText);
      } else {
        const result = await response.json();
        console.log("Histórico de sessão enviado:", result.message);
        // Atualizar lista de históricos após salvar
        loadChatHistory();
      }
    } catch (error) {
      console.error("Erro ao enviar histórico de sessão:", error);
    }
  }

  // --- Lógica do Chat (mantida do código original) ---

  async function sendMessage() {
    const message = messageInput.value.trim();
    if (!message || isLoadingHistory) return;

    addMessage(message, "user");
    messageInput.value = "";
    showTypingIndicator();
    statusArea.textContent = "Dio-sama está formulando sua resposta...";

    try {
      const response = await fetch(`${backendUrl}/api/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          message,
          chatHistory 
        }),
      });

      removeTypingIndicator();

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Erro desconhecido da API");
      }

      const data = await response.json();
      addMessage(data.response, "bot");
      
      // Atualizar histórico
      chatHistory = data.historico || chatHistory;
      
      // Salvar histórico da sessão
      await salvarHistoricoSessao(
        currentSessionId, 
        "chatbotDioSama", 
        chatStartTime, 
        new Date(), 
        chatHistory
      );

    } catch (error) {
      removeTypingIndicator();
      console.error("Erro ao enviar mensagem:", error);
      addErrorMessage(error.message);
    } finally {
      statusArea.textContent = "";
    }
  }

  function resetChat() {
    chatContainer.innerHTML = "";
    chatHistory = [];
    currentSessionId = `sessao_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    chatStartTime = new Date();
    addMessage("MUDA MUDA MUDA! Você ousa falar com o grande Dio-sama! Faça sua pergunta, mortal insignificante! Posso até mesmo revelar informações sobre o clima e horário de qualquer lugar do mundo, se for digno da minha atenção!", "bot");
  }

  // --- Event Listeners ---

  // Splash screen
  startChatButton.addEventListener("click", showChatInterface);

  // Chat
  sendButton.addEventListener("click", sendMessage);

  messageInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
      sendMessage();
    }
  });

  resetButton.addEventListener("click", resetChat);

  // Histórico
  refreshHistoryButton.addEventListener("click", loadChatHistory);

  // --- Inicialização ---

  window.addEventListener("load", async () => {
    // Registrar conexão do usuário
    await registrarConexaoUsuario();
    
    // Registrar acesso ao bot para ranking
    await registrarAcessoBotParaRanking("chatbotDioSama", "Dio-Sama Chatbot");
<<<<<<< HEAD
=======
    
    // Mensagem de boas-vindas inicial
    addMessage("WRYYY! Você ousa se aproximar de mim, Dio-sama? Muito bem, mortal... Faça sua pergunta e talvez eu conceda minha sabedoria suprema! Posso até mesmo revelar os segredos do clima e do tempo de qualquer lugar do mundo!", "bot");
>>>>>>> 9d1c67de636a6c33e20de079e008e4ebe2f763a9
  });

  // Salvar histórico quando a página for fechada
  window.addEventListener("beforeunload", () => {
    if (chatHistory.length > 0) {
      // Usar sendBeacon para envio assíncrono
      const payload = {
        sessionId: currentSessionId,
        botId: "chatbotDioSama",
        startTime: chatStartTime.toISOString(),
        endTime: new Date().toISOString(),
        messages: chatHistory
      };
      
      navigator.sendBeacon(
        `${backendUrl}/api/chat/salvar-historico`,
        JSON.stringify(payload)
      );
    }
  });
});