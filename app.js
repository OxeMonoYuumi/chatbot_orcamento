// Configurações e Chaves
const SUPABASE_URL = "https://fwcjthjvvzfkbamduwsb.supabase.co";
const SUPABASE_KEY = "sb_publishable_9X3EpYORfe7FFwJ4Q3wO9A_HknBMuXp";

// Inicializa o cliente do Supabase
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// Elementos da UI
const chatMessages = document.getElementById('chat-messages');
const chatInput = document.getElementById('chat-input');
const sendBtn = document.getElementById('send-btn');

// Contexto do Bot para a API do Groq
let conversationHistory = [
    {
        role: "system",
        content: `Você é um assistente virtual gentil e prestativo de uma empresa de pintura/reformas.
Seu objetivo é coletar dados do cliente para gerar um orçamento final.
Sua comunicação deve ser direta, amigável, e fazer UMA pergunta por vez.

Você precisa coletar EXATAMENTE estas 4 informações:
1. Nome do cliente
2. Telefone para contato
3. Qual serviço o cliente deseja (As únicas opções que oferecemos são: 'Parede Lisa', 'Parede Textura' e 'Teto')
4. Quantidade de cômodos que o serviço será realizado

Quando você já tiver as 4 informações fornecidas de forma clara, crie um pequeno resumo para o cliente confirmar os dados e diga que irá acionar o sistema para calcular o valor e salvar o orçamento.
Responda de maneira curta, sem textos gigantes.`
    }
];

// Função para adicionar uma mensagem na tela
function addMessage(text, sender) {
    const messageDiv = document.createElement('div');
    messageDiv.classList.add('message', sender);
    messageDiv.textContent = text;
    chatMessages.appendChild(messageDiv);
    
    // Rola para a mensagem mais recente
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Mostra indicador visual que o robô está digitando
function showTypingIndicator() {
    const indicator = document.createElement('div');
    indicator.classList.add('typing-indicator');
    indicator.id = 'typing-indicator';
    indicator.innerHTML = `
        <div class="typing-dot"></div>
        <div class="typing-dot"></div>
        <div class="typing-dot"></div>
    `;
    chatMessages.appendChild(indicator);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Remove indicador visual
function removeTypingIndicator() {
    const indicator = document.getElementById('typing-indicator');
    if (indicator) {
        indicator.remove();
    }
}

// Faz requisição para a IA chamando nossa Edge Function segura no Supabase
async function fetchGroqResponse(messages) {
    try {
        // Chama a Edge Function 'chat-groq'
        const { data, error } = await supabaseClient.functions.invoke('chat-groq', {
            body: { messages: messages }
        });

        if (error) {
            console.error("Erro Edge Function:", error.message);
            throw new Error(error.message);
        }

        return data.choices[0].message.content;
    } catch (error) {
        console.error(error);
        return "Desculpe, estou com instabilidade na conexão no momento. Tente novamente!";
    }
}

// Ação de envio de mensagem
async function handleSend() {
    const text = chatInput.value.trim();
    if (!text) return;

    // Adiciona mensagem do usuário
    addMessage(text, 'user');
    chatInput.value = '';
    
    // Atualiza histórico do LLM
    conversationHistory.push({ role: "user", content: text });

    // Mostra "Digitando..."
    showTypingIndicator();

    // Aguarda processamento do Groq
    const aiResponseText = await fetchGroqResponse(conversationHistory);
    
    // Remove "Digitando..." e exibe a resposta
    removeTypingIndicator();
    addMessage(aiResponseText, 'bot');
    
    // Salva a resposta do robô no histórico
    conversationHistory.push({ role: "assistant", content: aiResponseText });
}

// Event Listeners
sendBtn.addEventListener('click', handleSend);
chatInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        handleSend();
    }
});

// Mensagem inicial de saudação do Bot
setTimeout(() => {
    const msg = "Olá! Seja bem-vindo à nossa empresa de pinturas. Para podermos te dar um orçamento sob medida, com quem estou falando?";
    addMessage(msg, 'bot');
    conversationHistory.push({ role: "assistant", content: msg });
}, 800);
