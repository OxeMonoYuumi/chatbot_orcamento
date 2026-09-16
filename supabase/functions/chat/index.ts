import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Trata a preflight request do CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { messages } = await req.json()

    // Configurações do ambiente
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    const groqApiKey = Deno.env.get('GROQ_API_KEY') ?? ''

    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey)

    // Busca os serviços disponíveis
    const { data: servicos, error } = await supabase
      .from('servicos')
      .select('nome_servico, preco_comodo')
    
    if (error) throw error

    // Formata a lista de serviços para o prompt
    const listaServicos = servicos.map(s => `- ${s.nome_servico} (R$ ${s.preco_comodo}/cômodo)`).join('\n')

    const systemPrompt = `Você é um assistente virtual de uma empresa de pintura.
Sua função é coletar as seguintes informações do cliente de forma natural, uma por vez:
1. Nome
2. Telefone
3. Qual serviço deseja
4. Quantidade de cômodos

Serviços disponíveis e valores:
${listaServicos}

Regras:
- Seja educado e direto.
- Pergunte uma coisa de cada vez se ainda não souber a informação.
- Quando o cliente escolher o serviço e informar a quantidade de cômodos, diga o valor total do orçamento.
- Após passar o orçamento, pergunte se ele deseja confirmar e enviar o orçamento para a empresa.
- Ao final, se o cliente confirmar, avise que a equipe entrará em contato.`

    const apiMessages = [
      { role: 'system', content: systemPrompt },
      ...messages
    ]

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${groqApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'llama3-70b-8192',
        messages: apiMessages,
        temperature: 0.7,
        max_tokens: 1000
      })
    })

    const groqData = await response.json()
    
    if (groqData.error) {
        throw new Error(groqData.error.message)
    }

    const botReply = groqData.choices[0].message.content

    return new Response(
      JSON.stringify({ reply: botReply }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error(error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )
  }
})
