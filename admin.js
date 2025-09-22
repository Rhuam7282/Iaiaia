// admin.js
document.addEventListener('DOMContentLoaded', () => {
    const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:7281';
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
        alert('Você não está logado! Redirecionando...');
        window.location.href = '/';
        return;
    }

    // Carregar dados iniciais
    carregarDados();

    // Event Listeners
    salvarPersonalidadeBtn.addEventListener('click', salvarPersonalidade);
    excluirTodasBtn.addEventListener('click', excluirTodasConversas);
    logoutBtn.addEventListener('click', logout);
    refreshBtn.addEventListener('click', carregarDados);

    /*Carrega os dados do painel de administração*/
    async function carregarDados() {
        try {
            const response = await fetch(`${backendUrl}/api/admin/stats`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.status === 401 || response.status === 403) {
                alert('Sessão expirada!');
                logout();
                return;
            }

            const data = await response.json();

            totalConversasEl.textContent = data.totalConversas;
            totalMensagensEl.textContent = data.totalMensagens;

            // Listar últimas conversas
            listaConversasEl.innerHTML = data.ultimasConversas.map(conv => `
                <div class="conversa-item">
                    <div>
                        <strong>ID:</strong> ${conv.sessionId} <br>
                        <strong>Criada em:</strong> ${new Date(conv.createdAt).toLocaleString('pt-BR')} <br>
                        <strong>Última mensagem:</strong> ${conv.lastMessage}
                    </div>
                    <button class="excluir-conversa" data-id="${conv.sessionId}">Excluir</button>
                </div>
            `).join('');

            // Adicionar event listeners para os botões de excluir
            document.querySelectorAll('.excluir-conversa').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const sessionId = e.target.dataset.id;
                    excluirConversa(sessionId);
                });
            });

            // Carregar personalidade atual
            const personalidadeResponse = await fetch(`${backendUrl}/api/admin/personalidade`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            const personalidadeData = await personalidadeResponse.json();
            personalidadeTextarea.value = personalidadeData.personalidade;

        } catch (error) {
            console.error('Erro ao carregar dados:', error);
            alert('Erro ao carregar dados do painel');
        }
    }

    /*Salva a nova personalidade do chatbot*/
    async function salvarPersonalidade() {
        try {
            const response = await fetch(`${backendUrl}/api/admin/personalidade`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    novaPersonalidade: personalidadeTextarea.value
                })
            });

            if (response.ok) {
                alert('Personalidade atualizada com sucesso!');
            } else {
                alert('Erro ao atualizar personalidade');
            }
        } catch (error) {
            console.error('Erro ao salvar personalidade:', error);
            alert('Erro ao salvar personalidade');
        }
    }

    /*Exclui todas as conversas do banco de dados*/
    async function excluirTodasConversas() {
        if (!confirm('Tem certeza que deseja excluir TODAS as conversas? Esta ação não pode ser desfeita!')) {
            return;
        }

        try {
            const response = await fetch(`${backendUrl}/api/admin/conversas`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                alert('Todas as conversas foram excluídas!');
                carregarDados(); // Recarregar dados
            } else {
                alert('Erro ao excluir conversas');
            }
        } catch (error) {
            console.error('Erro ao excluir conversas:', error);
            alert('Erro ao excluir conversas');
        }
    }

    /*Exclui uma conversa específica*/
    async function excluirConversa(sessionId) {
        if (!confirm('Tem certeza que deseja excluir esta conversa?')) {
            return;
        }

        try {
            const response = await fetch(`${backendUrl}/api/admin/conversas/${sessionId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                alert('Conversa excluída!');
                carregarDados(); // Recarregar dados
            } else {
                alert('Erro ao excluir conversa');
            }
        } catch (error) {
            console.error('Erro ao excluir conversa:', error);
            alert('Erro ao excluir conversa');
        }
    }

    /*Realiza logout do painel de administração*/
    function logout() {
        localStorage.removeItem('adminToken');
        window.location.href = '/';
    }
});