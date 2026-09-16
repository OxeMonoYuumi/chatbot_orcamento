// ========================================
// CONFIGURAÇÕES DO SUPABASE
// ========================================

const SUPABASE_URL = "https://fwcjthjvvzfkbamduwsb.supabase.co";

const SUPABASE_KEY =
    "sb_publishable_9X3EpYORfe7FFwJ4Q3wO9A_HknBMuXp";


// ========================================
// INICIALIZAÇÃO DO SUPABASE
// ========================================

let supabaseClient = null;

try {

    if (!window.supabase) {
        throw new Error("Biblioteca do Supabase não foi carregada.");
    }

    supabaseClient = window.supabase.createClient(
        SUPABASE_URL,
        SUPABASE_KEY
    );

    console.log("Supabase inicializado com sucesso!");

} catch (error) {

    console.error(
        "Erro ao inicializar o Supabase:",
        error
    );

}


// ========================================
// ELEMENTOS DA INTERFACE
// ========================================

const chatMessages =
    document.getElementById("chat-messages");

const chatInput =
    document.getElementById("chat-input");

const sendBtn =
    document.getElementById("send-btn");


// ========================================
// HISTÓRICO DA CONVERSA
// ========================================

let conversationHistory = [

    {
        role: "system",

        content: `
Você é um assistente virtual gentil e prestativo
de uma empresa de pintura e reformas.

Seu objetivo é coletar os dados do cliente para
gerar um orçamento.

Faça UMA pergunta por vez.

Você precisa coletar EXATAMENTE estas 4 informações:

1. Nome do cliente
2. Telefone para contato
3. Serviço desejado

Os únicos serviços disponíveis são:

- Parede Lisa
- Parede Textura
- Teto

4. Quantidade de cômodos onde o serviço será realizado.

Quando tiver as 4 informações de forma clara,
faça um pequeno resumo para o cliente confirmar.

Depois diga que irá acionar o sistema para calcular
o valor e salvar o orçamento.

Seja curto, direto e amigável.
`
    }

];


// ========================================
// ADICIONAR MENSAGEM
// ========================================

function addMessage(text, sender) {

    const messageDiv =
        document.createElement("div");

    messageDiv.classList.add(
        "message",
        sender
    );

    messageDiv.textContent = text;

    chatMessages.appendChild(messageDiv);

    chatMessages.scrollTop =
        chatMessages.scrollHeight;
}


// ========================================
// INDICADOR "DIGITANDO"
// ========================================

function showTypingIndicator() {

    const indicator =
        document.createElement("div");

    indicator.classList.add(
        "typing-indicator"
    );

    indicator.id =
        "typing-indicator";

    indicator.innerHTML = `
        <div class="typing-dot"></div>
        <div class="typing-dot"></div>
        <div class="typing-dot"></div>
    `;

    chatMessages.appendChild(indicator);

    chatMessages.scrollTop =
        chatMessages.scrollHeight;
}


// ========================================
// REMOVER INDICADOR
// ========================================

function removeTypingIndicator() {

    const indicator =
        document.getElementById(
            "typing-indicator"
        );

    if (indicator) {
        indicator.remove();
    }
}


// ========================================
// CHAMAR EDGE FUNCTION
// ========================================

async function fetchGroqResponse(messages) {

    try {

        if (!supabaseClient) {
            throw new Error(
                "Supabase não foi inicializado."
            );
        }

        console.log(
            "Enviando conversa para Edge Function..."
        );

        const {
            data,
            error
        } =
            await supabaseClient.functions.invoke(
                "chat-groq",
                {
                    body: {
                        messages: messages
                    }
                }
            );


        if (error) {

            console.error(
                "Erro na Edge Function:",
                error
            );

            throw error;
        }


        if (
            !data ||
            !data.choices ||
            !data.choices[0] ||
            !data.choices[0].message
        ) {

            console.error(
                "Resposta inesperada:",
                data
            );

            throw new Error(
                "Resposta inválida da Edge Function."
            );
        }


        return data
            .choices[0]
            .message
            .content;


    } catch (error) {

        console.error(
            "Erro ao chamar Groq:",
            error
        );

        return "Desculpe, estou com instabilidade na conexão no momento. Tente novamente.";
    }
}


// ========================================
// ENVIAR MENSAGEM
// ========================================

async function handleSend() {

    const text =
        chatInput.value.trim();


    if (!text) {
        return;
    }


    // Mostra mensagem do usuário

    addMessage(
        text,
        "user"
    );


    // Limpa campo

    chatInput.value = "";


    // Adiciona ao histórico

    conversationHistory.push({

        role: "user",

        content: text

    });


    // Mostra digitando

    showTypingIndicator();


    // Chama IA

    const aiResponseText =
        await fetchGroqResponse(
            conversationHistory
        );


    // Remove digitando

    removeTypingIndicator();


    // Mostra resposta

    addMessage(
        aiResponseText,
        "bot"
    );


    // Salva no histórico

    conversationHistory.push({

        role: "assistant",

        content: aiResponseText

    });

}


// ========================================
// EVENTOS
// ========================================

sendBtn.addEventListener(
    "click",
    handleSend
);


chatInput.addEventListener(
    "keypress",
    (event) => {

        if (event.key === "Enter") {

            handleSend();

        }

    }
);


// ========================================
// MENSAGEM INICIAL
// ========================================

setTimeout(() => {

    const message =
        "Olá! Seja bem-vindo à nossa empresa de pinturas. Para podermos te dar um orçamento sob medida, com quem estou falando?";


    addMessage(
        message,
        "bot"
    );


    conversationHistory.push({

        role: "assistant",

        content: message

    });

}, 800);
