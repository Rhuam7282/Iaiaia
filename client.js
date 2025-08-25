// Client.js modificado para não enviar informações de clima na primeira mensagem
        document.addEventListener("DOMContentLoaded", () => {
          const chatContainer = document.getElementById("chat-container");
          const messageInput = document.getElementById("message-input");
          const sendButton = document.getElementById("send-button");
          const resetButton = document.getElementById("reset-button");
          const historyButton = document.getElementById("history-button");
          const historyPanel = document.getElementById("history-panel");

          // Configuração
          const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:7281';
          let currentSessionId = null;
          let chatHistory = [];
          let isFirstMessage = true;

          // Funções auxiliares
          function addMessage(text, sender, extraData = null) {
            const msgDiv = document.createElement("div");
            msgDiv.className = `message ${sender}-message`;
            
            if (sender === 'bot' && extraData && !isFirstMessage) {
              let content = text;
              
              // Adicionar informações de clima se disponível
              if (extraData.weatherData) {
                const weather = extraData.weatherData;
                content += `\n\n🌤️ Informações do Clima - ${weather.cidade}, ${weather.pais}:
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
                  content += `\n\n⏰ Previsão próximas horas:`;
                  weather.previsao_proximas_horas.forEach(hora => {
                    content += `\n${hora.hora}: ${hora.temperatura}°C, ${hora.descricao} (${hora.probabilidade_chuva}% chuva)`;
                  });
                }
              }
              
              // Adicionar informações de horário se disponível
              if (extraData.timeData) {
                const time = extraData.timeData;
                content += `\n\n🕐 Informações de Horário:
📅 Data completa: ${time.data_completa}
⏰ Hora atual: ${time.hora_atual}
📆 Data: ${time.data_atual}
📅 Dia da semana: ${time.dia_semana}`;
              }
              
              msgDiv.innerHTML = content.replace(/\n/g, '<br>');
            } else {
              msgDiv.textContent = text;
            }
            
            chatContainer.appendChild(msgDiv);
            chatContainer.scrollTop = chatContainer.scrollHeight;
          }

          async function createNewSession() {
            try {
              const response = await fetch(`${backendUrl}/api/chat/nova-sessao`, {
                method: "POST",
                headers: { "Content-Type": "application/json" }
              });
              
              const data = await response.json();
              currentSessionId = data.sessionId;
              chatHistory = [];
              chatContainer.innerHTML = "";
              isFirstMessage = true;
              
              // Não mostrar informações de clima/horário na primeira mensagem
              addMessage(data.message.split('\n')[0], "bot");
              return data.sessionId;
            } catch (error) {
              console.error("Erro ao criar nova sessão:", error);
              currentSessionId = `sessao_${Date.now()}_${Math.random().toString(36).substr(2, 8)}`;
              chatHistory = [];
              chatContainer.innerHTML = "";
              isFirstMessage = true;
              addMessage("WRYYY! Eu sou Dio-sama! Faça sua pergunta, mortal!", "bot");
              return currentSessionId;
            }
          }

          async function loadSession(sessionId) {
            try {
              const response = await fetch(`${backendUrl}/api/chat/historico/${sessionId}`);
              const data = await response.json();
              
              chatContainer.innerHTML = "";
              if (data.messages && data.messages.length > 0) {
                data.messages.forEach(msg => {
                  addMessage(msg.parts[0].text, msg.role === 'user' ? 'user' : 'bot');
                });
              }
              
              currentSessionId = sessionId;
              chatHistory = data.messages || [];
              isFirstMessage = chatHistory.length === 0;
              historyPanel.classList.remove("show");
            } catch (error) {
              console.error("Erro ao carregar sessão:", error);
              addMessage("WRYYY! Erro ao carregar sessão!", "error");
            }
          }

          async function sendMessage() {
            const message = messageInput.value.trim();
            if (!message) return;
            
            // Se não há sessão atual, criar uma nova
            if (!currentSessionId) {
              await createNewSession();
            }
            
            addMessage(message, "user");
            messageInput.value = "";
            
            // Mostrar indicador de carregamento
            const loadingDiv = document.createElement("div");
            loadingDiv.className = "message bot-message loading";
            loadingDiv.textContent = "Dio-sama está pensando...";
            chatContainer.appendChild(loadingDiv);
            chatContainer.scrollTop = chatContainer.scrollHeight;
            
            try {
              const response = await fetch(`${backendUrl}/api/chat`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ 
                  message, 
                  chatHistory,
                  sessionId: currentSessionId
                })
              });
              
              const data = await response.json();
              
              // Remover indicador de carregamento
              chatContainer.removeChild(loadingDiv);
              
              addMessage(data.response, "bot", {
                weatherData: data.weatherData,
                timeData: data.timeData
              });
              
              chatHistory = data.historico;
              isFirstMessage = false;
              
            } catch (error) {
              console.error("Erro ao enviar mensagem:", error);
              chatContainer.removeChild(loadingDiv);
              addMessage("WRYYY! Erro ao contactar Dio-sama! Verifique sua conexão!", "error");
            }
          }

          async function resetChat() {
            await createNewSession();
          }

          async function showHistory() {
            try {
              const response = await fetch(`${backendUrl}/api/chat/sessoes`);
              const sessions = await response.json();
              
              if (sessions.length === 0) {
                historyPanel.innerHTML = '<div class="no-history">Nenhum histórico encontrado</div>';
              } else {
                historyPanel.innerHTML = sessions.map(session => {
                  const lastMessage = session.messages && session.messages.length > 0 
                    ? session.messages[session.messages.length - 1].parts[0].text.substring(0, 50)
                    : 'Nova conversa';
                  
                  return `
                    <div class="history-item" data-id="${session.sessionId}">
                      <div class="history-header">
                        <small>${new Date(session.lastUpdated).toLocaleString('pt-BR')}</small>
                        <button class="delete-session" data-id="${session.sessionId}">🗑️</button>
                      </div>
                      <p>${lastMessage}${lastMessage.length >= 50 ? '...' : ''}</p>
                    </div>
                  `;
                }).join("");
              }
              
              historyPanel.classList.toggle("show");
              
              // Adicionar event listeners para carregar sessões
              document.querySelectorAll('.history-item').forEach(item => {
                item.addEventListener('click', (e) => {
                  if (!e.target.classList.contains('delete-session')) {
                    loadSession(item.dataset.id);
                  }
                });
              });
              
              // Adicionar event listeners para deletar sessões
              document.querySelectorAll('.delete-session').forEach(button => {
                button.addEventListener('click', async (e) => {
                  e.stopPropagation();
                  const sessionId = button.dataset.id;
                  
                  if (confirm('Tem certeza que deseja deletar esta sessão?')) {
                    try {
                      await fetch(`${backendUrl}/api/chat/sessao/${sessionId}`, {
                        method: 'DELETE'
                      });
                      
                      // Remover da interface
                      button.closest('.history-item').remove();
                      
                      // Se a sessão deletada é a atual, criar uma nova
                      if (sessionId === currentSessionId) {
                        await createNewSession();
                      }
                    } catch (error) {
                      console.error('Erro ao deletar sessão:', error);
                      alert('Erro ao deletar sessão');
                    }
                  }
                });
              });
              
            } catch (error) {
              console.error("Erro ao carregar histórico:", error);
              historyPanel.innerHTML = '<div class="error">Erro ao carregar histórico</div>';
              historyPanel.classList.add("show");
            }
          }

          // Função para testar conexão com o backend
          async function testConnection() {
            try {
              const response = await fetch(`${backendUrl}/api/horario`);
              if (response.ok) {
                console.log('✅ Conexão com backend estabelecida');
                return true;
              }
            } catch (error) {
              console.error('❌ Erro de conexão com backend:', error);
              addMessage("⚠️ Erro de conexão com o servidor. Verifique se o backend está rodando.", "error");
              return false;
            }
          }

          // Event Listeners
          sendButton.addEventListener("click", sendMessage);
          resetButton.addEventListener("click", resetChat);
          historyButton.addEventListener("click", showHistory);
          
          messageInput.addEventListener("keypress", (e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              sendMessage();
            }
          });

          // Fechar painel de histórico ao clicar fora
          document.addEventListener('click', (e) => {
            if (!historyPanel.contains(e.target) && !historyButton.contains(e.target)) {
              historyPanel.classList.remove("show");
            }
          });

          // Inicialização
          async function init() {
            await testConnection();
            await createNewSession();
          }

          init();
        });