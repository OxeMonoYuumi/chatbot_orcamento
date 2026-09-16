// Configuração do Supabase
// Substitua pelas suas credenciais reais
const SUPABASE_URL = 'https://fwcjthjvvzfkbamduwsb.supabase.co';
const SUPABASE_ANON_KEY = 'SUA_CHAVE_ANONIMA_AQUI';

const chatMessages = document.getElementById('chat-messages');
const userInput = document.getElementById('user-input');
const sendButton = document.getElementById('send-button');

// Histórico de mensagens para enviar ao backend
let conversationHistory = [];

function addMessageToUI(message, sender) {
    const messageDiv = document.createElement('div');
    messageDiv.classList.add('message', sender);

    const bubbleDiv = document.createElement('div');
    bubbleDiv.classList.add('bubble');
    bubbleDiv.textContent = message;

    messageDiv.appendChild(bubbleDiv);
    chatMessages.appendChild(messageDiv);

    // Rola para a última mensagem
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

function addLoadingToUI() {
    const messageDiv = document.createElement('div');
    messageDiv.classList.add('message', 'bot');
    messageDiv.id = 'loading-message';

    const bubbleDiv = document.createElement('div');
    bubbleDiv.classList.add('bubble', 'loading-dots');

    for (let i = 0; i < 3; i++) {
        const dot = document.createElement('span');
        bubbleDiv.appendChild(dot);
    }

    messageDiv.appendChild(bubbleDiv);
    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

function removeLoadingFromUI() {
    const loadingMessage = document.getElementById('loading-message');
    if (loadingMessage) {
        loadingMessage.remove();
    }
}

async function sendMessageToBot(message) {
    addLoadingToUI();

    conversationHistory.push({ role: 'user', content: message });

    try {
        // Chamada para a Edge Function do Supabase
        const response = await fetch(`${SUPABASE_URL}/functions/v1/chat`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
            },
            body: JSON.stringify({
                messages: conversationHistory
            })
        });

        if (!response.ok) {
            throw new Error('Erro na comunicação com o servidor');
        }

        const data = await response.json();
        const botReply = data.reply;

        removeLoadingFromUI();
        addMessageToUI(botReply, 'bot');
        conversationHistory.push({ role: 'assistant', content: botReply });

    } catch (error) {
        console.error(error);
        removeLoadingFromUI();
        addMessageToUI('Desculpe, ocorreu um erro ao tentar processar sua mensagem. Tente novamente mais tarde.', 'bot');
    }
}

function handleSend() {
    const text = userInput.value.trim();
    if (text === '') return;

    addMessageToUI(text, 'user');
    userInput.value = '';

    sendMessageToBot(text);
}

sendButton.addEventListener('click', handleSend);

userInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        handleSend();
    }
});
