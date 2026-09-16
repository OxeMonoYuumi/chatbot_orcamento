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
    const { nome, telefone, servico, quantidade_comodos, valor_total } = await req.json()

    // Validação básica
    if (!nome || !telefone || !servico || !quantidade_comodos || !valor_total) {
      return new Response(
        JSON.stringify({ error: 'Todos os campos são obrigatórios' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    // Configurações do ambiente
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''

    // Utiliza Service Role Key para ignorar o RLS e salvar diretamente o lead
    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey)

    // Insere o lead no banco de dados
    const { data, error } = await supabase
      .from('leads')
      .insert([
        { 
          nome, 
          telefone, 
          servico, 
          quantidade_comodos: parseInt(quantidade_comodos, 10), 
          valor_total: parseFloat(valor_total) 
        }
      ])
      .select()
    
    if (error) throw error

    return new Response(
      JSON.stringify({ success: true, lead: data[0] }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 201 }
    )

  } catch (error) {
    console.error(error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )
  }
})
