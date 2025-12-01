// admin.js - Versão melhorada com feedback visual aprimorado
document.addEventListener('DOMContentLoaded', () => {
    const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:3000';
    const token = localStorage.getItem('adminToken');

    // Elementos da interface
    const totalConversasEl = document.getElementById('total-conversas');
    const totalMensagensEl = document.getElementById('total-mensagens');
    const listaConversasEl = document.getElementById('lista-conversas');
    const personalidadeTextarea = document.getElementById('personalidade-textarea');
    const salvarPersonalidadeBtn = document.getElementById('salvar-personalidade');
    const excluirTodasBtn = document.getElementById('excluir-todas');
    const logoutBtn = document.getElementById('logout-button');
    const refreshBtn = document.getElementById('refresh-button');

    // Verificar se está logado
    if (!token) {
        showNotification('Você não está logado! Redirecionando...', 'error');
        setTimeout(() => {
            window.location.href = '/';
        }, 2000);
        return;
    }

    // Função para mostrar notificações
    function showNotification(message, type = 'info') {
        // Criar elemento de notificação
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 15px 20px;
            background: ${type === 'success' ? '#2d5016' : type === 'error' ? '#8a0303' : '#8b6914'};
            color: white;
            border: 2px solid ${type === 'success' ? '#7fc94a' : type === 'error' ? '#ff4444' : 'var(--dio-yellow)'};
            border-radius: 5px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);
            z-index: 10000;
            animation: slideInRight 0.3s ease;
        `;

        document.body.appendChild(notification);

        // Remover após 3 segundos
        setTimeout(() => {
            notification.style.animation = 'slideOutRight 0.3s ease';
            setTimeout(() => {
                document.body.removeChild(notification);
            }, 300);
        }, 3000);
    }

    // Função para mostrar loading
    function showLoading(show, element = null) {
        if (element) {
            if (show) {
                element.disabled = true;
                element.dataset.originalText = element.textContent;
                element.textContent = '⏳ Carregando...';
            } else {
                element.disabled = false;
                element.textContent = element.dataset.originalText || element.textContent;
            }
        }
    }

    // Função para formatar números
    function formatNumber(num) {
        return new Intl.NumberFormat('pt-BR').format(num);
    }

    // Carregar dados iniciais
    carregarDados();

    // Event Listeners
    salvarPersonalidadeBtn.addEventListener('click', salvarPersonalidade);
    excluirTodasBtn.addEventListener('click', excluirTodasConversas);
    logoutBtn.addEventListener('click', logout);
    refreshBtn.addEventListener('click', () => {
        showLoading(true, refreshBtn);
        carregarDados();
    });

    // Auto-save para personalidade (debounced)
    let saveTimeout;
    personalidadeTextarea.addEventListener('input', () => {
        clearTimeout(saveTimeout);
        saveTimeout = setTimeout(() => {
            showNotification('Alterações detectadas. Clique em "Salvar" para confirmar.', 'info');
        }, 2000);
    });

    /*Carrega os dados do painel de administração*/
    async function carregarDados() {
        try {
            // Adicionar indicador visual de carregamento
            totalConversasEl.innerHTML = '<span class="loading-text">⏳</span>';
            totalMensagensEl.innerHTML = '<span class="loading-text">⏳</span>';
            listaConversasEl.innerHTML = '<div style="text-align: center; padding: 20px;">Carregando conversas...</div>';

            const response = await fetch(`${backendUrl}/api/admin/stats`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.status === 401 || response.status === 403) {
                showNotification('Sessão expirada! Redirecionando...', 'error');
                setTimeout(() => logout(), 2000);
                return;
            }

            if (!response.ok) {
                throw new Error('Erro ao carregar dados');
            }

            const data = await response.json();

            // Animar números
            animateNumber(totalConversasEl, data.totalConversas);
            animateNumber(totalMensagensEl, data.totalMensagens);

            // Listar últimas conversas
            if (data.ultimasConversas.length === 0) {
                listaConversasEl.innerHTML = '<div style="text-align: center; padding: 20px; opacity: 0.7;">Nenhuma conversa encontrada</div>';
            } else {
                listaConversasEl.innerHTML = data.ultimasConversas.map((conv, index) => `
                    <div class="conversa-item" style="animation: fadeIn 0.3s ease ${index * 0.1}s both;">
                        <div>
                            <strong>ID:</strong> <code>${conv.sessionId.substring(0, 12)}...</code><br>
                            <strong>Criada em:</strong> ${new Date(conv.createdAt).toLocaleString('pt-BR')}<br>
                            <strong>Última mensagem:</strong> ${conv.lastMessage}
                        </div>
                        <button class="excluir-conversa" data-id="${conv.sessionId}" title="Excluir conversa">🗑️</button>
                    </div>
                `).join('');

                // Adicionar event listeners para os botões de excluir
                document.querySelectorAll('.excluir-conversa').forEach(btn => {
                    btn.addEventListener('click', (e) => {
                        const sessionId = e.target.dataset.id;
                        excluirConversa(sessionId, e.target);
                    });
                });
            }

            // Carregar personalidade atual
            const personalidadeResponse = await fetch(`${backendUrl}/api/admin/personalidade`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            if (personalidadeResponse.ok) {
                const personalidadeData = await personalidadeResponse.json();
                personalidadeTextarea.value = personalidadeData.personalidade;
            }

            showLoading(false, refreshBtn);
            showNotification('Dados carregados com sucesso!', 'success');

        } catch (error) {
            console.error('Erro ao carregar dados:', error);
            showLoading(false, refreshBtn);
            showNotification('Erro ao carregar dados do painel', 'error');
            
            // Mostrar mensagem de erro na interface
            totalConversasEl.textContent = '—';
            totalMensagensEl.textContent = '—';
            listaConversasEl.innerHTML = '<div style="text-align: center; padding: 20px; color: #ff4444;">❌ Erro ao carregar conversas</div>';
        }
    }

    // Animar números
    function animateNumber(element, targetValue) {
        const duration = 1000; // 1 segundo
        const steps = 30;
        const increment = targetValue / steps;
        let current = 0;
        let step = 0;

        const timer = setInterval(() => {
            step++;
            current = Math.min(Math.floor(increment * step), targetValue);
            element.textContent = formatNumber(current);

            if (step >= steps) {
                clearInterval(timer);
                element.textContent = formatNumber(targetValue);
            }
        }, duration / steps);
    }

    /*Salva a nova personalidade do chatbot*/
    async function salvarPersonalidade() {
        const novaPersonalidade = personalidadeTextarea.value.trim();

        if (!novaPersonalidade) {
            showNotification('A personalidade não pode estar vazia!', 'error');
            return;
        }

        if (novaPersonalidade.length < 50) {
            showNotification('A personalidade deve ter pelo menos 50 caracteres!', 'error');
            return;
        }

        showLoading(true, salvarPersonalidadeBtn);

        try {
            const response = await fetch(`${backendUrl}/api/admin/personalidade`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    novaPersonalidade: novaPersonalidade
                })
            });

            if (response.ok) {
                showNotification('✨ Personalidade atualizada com sucesso!', 'success');
                
                // Efeito visual de sucesso
                personalidadeTextarea.style.borderColor = '#7fc94a';
                setTimeout(() => {
                    personalidadeTextarea.style.borderColor = '';
                }, 2000);
            } else {
                throw new Error('Erro ao atualizar personalidade');
            }
        } catch (error) {
            console.error('Erro ao salvar personalidade:', error);
            showNotification('❌ Erro ao atualizar personalidade', 'error');
        } finally {
            showLoading(false, salvarPersonalidadeBtn);
        }
    }

    /*Exclui todas as conversas do banco de dados*/
    async function excluirTodasConversas() {
        // Modal de confirmação personalizado
        const confirmacao = confirm(
            '⚠️ ATENÇÃO!\n\n' +
            'Tem certeza que deseja excluir TODAS as conversas?\n\n' +
            'Esta ação NÃO pode ser desfeita e todos os dados serão perdidos permanentemente!\n\n' +
            'Digite "CONFIRMAR" para continuar.'
        );

        if (!confirmacao) {
            return;
        }

        // Segunda confirmação
        const confirmacaoFinal = prompt('Digite "EXCLUIR TUDO" para confirmar:');
        if (confirmacaoFinal !== 'EXCLUIR TUDO') {
            showNotification('Operação cancelada', 'info');
            return;
        }

        showLoading(true, excluirTodasBtn);

        try {
            const response = await fetch(`${backendUrl}/api/admin/conversas`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                showNotification('🔥 Todas as conversas foram excluídas!', 'success');
                
                // Recarregar dados após exclusão
                setTimeout(() => {
                    carregarDados();
                }, 1000);
            } else {
                throw new Error('Erro ao excluir conversas');
            }
        } catch (error) {
            console.error('Erro ao excluir conversas:', error);
            showNotification('❌ Erro ao excluir conversas', 'error');
        } finally {
            showLoading(false, excluirTodasBtn);
        }
    }

    /*Exclui uma conversa específica*/
    async function excluirConversa(sessionId, buttonElement) {
        if (!confirm('Tem certeza que deseja excluir esta conversa?')) {
            return;
        }

        // Desabilitar botão e mostrar feedback
        buttonElement.disabled = true;
        buttonElement.textContent = '⏳';

        try {
            const response = await fetch(`${backendUrl}/api/admin/conversas/${sessionId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                showNotification('Conversa excluída!', 'success');
                
                // Remover visualmente com animação
                const conversaItem = buttonElement.closest('.conversa-item');
                conversaItem.style.animation = 'fadeOut 0.3s ease';
                setTimeout(() => {
                    conversaItem.remove();
                    
                    // Atualizar contador
                    const currentTotal = parseInt(totalConversasEl.textContent.replace(/\./g, ''));
                    animateNumber(totalConversasEl, currentTotal - 1);
                }, 300);
            } else {
                throw new Error('Erro ao excluir conversa');
            }
        } catch (error) {
            console.error('Erro ao excluir conversa:', error);
            showNotification('❌ Erro ao excluir conversa', 'error');
            buttonElement.disabled = false;
            buttonElement.textContent = '🗑️';
        }
    }

    /*Realiza logout do painel de administração*/
    function logout() {
        localStorage.removeItem('adminToken');
        showNotification('Logout realizado! Até breve, administrador.', 'info');
        setTimeout(() => {
            window.location.href = '/';
        }, 1000);
    }

    // Adicionar estilos para animações
    const style = document.createElement('style');
    style.textContent = `
        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeOut {
            from { opacity: 1; transform: translateY(0); }
            to { opacity: 0; transform: translateY(-10px); }
        }
        @keyframes slideInRight {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
        @keyframes slideOutRight {
            from { transform: translateX(0); opacity: 1; }
            to { transform: translateX(100%); opacity: 0; }
        }
        .loading-text {
            animation: pulse 1s infinite;
        }
        @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
        }
        code {
            background: rgba(0, 0, 0, 0.3);
            padding: 2px 6px;
            border-radius: 3px;
            font-family: 'Courier New', monospace;
            font-size: 0.9em;
            color: var(--dio-yellow);
        }
    `;
    document.head.appendChild(style);
});
