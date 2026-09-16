import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Tratamento de requisições preflight do CORS (necessário para chamar pelo frontend)
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { messages } = await req.json()
    
    // Pega a chave da API do Groq das variáveis de ambiente secretas do Supabase
    const GROQ_API_KEY = Deno.env.get('GROQ_API_KEY')
    
    if (!GROQ_API_KEY) {
      throw new Error('A chave da API do Groq não está configurada no servidor.')
    }

    // Faz a requisição para a API do Groq de forma segura no backend
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${GROQ_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "llama-3.1-70b-versatile",
        messages: messages,
        temperature: 0.6,
        max_tokens: 512
      })
    })

    if (!response.ok) {
      throw new Error(`Erro na API Groq: ${response.status} - ${response.statusText}`)
    }

    const data = await response.json()
    
    // Retorna a resposta da IA para o frontend
    return new Response(
      JSON.stringify(data),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    )
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    })
  }
})
