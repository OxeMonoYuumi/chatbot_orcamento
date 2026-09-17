export async function onRequest(context) {
    // context.env contém as variáveis de ambiente configuradas no Cloudflare Pages
    const supabaseUrl = context.env.SUPABASE_URL || 'https://fwcjthjvvzfkbamduwsb.supabase.co';
    const supabaseAnonKey = context.env.SUPABASE_ANON_KEY;

    if (!supabaseAnonKey) {
        return new Response(JSON.stringify({ error: 'Supabase Anon Key não configurada no Cloudflare' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        });
    }

    return new Response(JSON.stringify({
        SUPABASE_URL: supabaseUrl,
        SUPABASE_ANON_KEY: supabaseAnonKey
    }), {
        headers: {
            'Content-Type': 'application/json',
            // Adiciona cabeçalhos CORS se necessário, útil para Cloudflare Pages
            'Access-Control-Allow-Origin': '*'
        }
    });
}
