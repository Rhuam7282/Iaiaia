document.addEventListener("DOMContentLoaded", () => {
  const chatContainer = document.getElementById("chat-container");
  const messageInput = document.getElementById("message-input");
  const sendButton = document.getElementById("send-button");
  const resetButton = document.getElementById("reset-button");
  const historyButton = document.getElementById("history-button");
  const historyPanel = document.getElementById("history-panel");

  // Configuração
  const backendUrl = 'https://aiaiai-ibk2.onrender.com';
  let currentSessionId = `sessao_${Date.now()}_${Math.random().toString(36).substr(2, 8)}`;
  let chatHistory = [];

  // Funções auxiliares
  function addMessage(text, sender) {
    const msgDiv = document.createElement("div");
    msgDiv.className = `message ${sender}-message`;
    msgDiv.textContent = text;
    chatContainer.appendChild(msgDiv);
    chatContainer.scrollTop = chatContainer.scrollHeight;
  }

  async function loadSession(sessionId) {
    try {
      const response = await fetch(`${backendUrl}/api/chat/historico/${sessionId}`);
      const data = await response.json();
      
      chatContainer.innerHTML = "";
      data.messages.forEach(msg => {
        addMessage(msg.parts[0].text, msg.role === 'user' ? 'user' : 'bot');
      });
      
      currentSessionId = sessionId;
      chatHistory = data.messages;
    } catch (error) {
      console.error("Erro ao carregar sessão:", error);
    }
  }

  async function sendMessage() {
    const message = messageInput.value.trim();
    if (!message) return;
    
    addMessage(message, "user");
    messageInput.value = "";
    
    try {
      const response = await fetch(`${backendUrl}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message, chatHistory })
      });
      
      const data = await response.json();
      addMessage(data.response, "bot");
      chatHistory = data.historico;
      
      // Salvar histórico
      await fetch(`${backendUrl}/api/chat/salvar-historico`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          sessionId: currentSessionId,
          messages: chatHistory 
        })
      });
    } catch (error) {
      addMessage("WRYYY! Erro ao contactar Dio-sama!", "error");
    }
  }

  async function resetChat() {
    currentSessionId = `sessao_${Date.now()}_${Math.random().toString(36).substr(2, 8)}`;
    chatHistory = [];
    chatContainer.innerHTML = "";
    addMessage("MUDA MUDA! Nova conversa com Dio-sama começada!", "bot");
  }

  async function showHistory() {
    try {
      const response = await fetch(`${backendUrl}/api/chat/historicos`);
      const sessions = await response.json();
      
      historyPanel.innerHTML = sessions.map(session => `
        <div class="history-item" data-id="${session.sessionId}">
          <small>${new Date(session.startTime).toLocaleString()}</small>
          <p>${session.messages[0]?.parts[0]?.text.substring(0, 50) || 'Nova conversa'}...</p>
        </div>
      `).join("");
      
      historyPanel.classList.toggle("show");
      
      // Adicionar event listeners
      document.querySelectorAll('.history-item').forEach(item => {
        item.addEventListener('click', () => {
          loadSession(item.dataset.id);
          historyPanel.classList.remove("show");
        });
      });
    } catch (error) {
      console.error("Erro ao carregar histórico:", error);
    }
  }

  // Event Listeners
  sendButton.addEventListener("click", sendMessage);
  resetButton.addEventListener("click", resetChat);
  historyButton.addEventListener("click", showHistory);
  messageInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") sendMessage();
  });

  // Inicialização
  addMessage("WRYYY! Eu sou Dio-sama! Faça sua pergunta, mortal!", "bot");
});