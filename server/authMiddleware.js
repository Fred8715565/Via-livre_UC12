import { createClient } from '@supabase/supabase-js'

let authClient
function getAuthClient() {
  // Criado na primeira requisição, depois que dotenv já carregou as variáveis no servidor.
  if (authClient === undefined) {
    const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL
    const publicKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY
    authClient = url && publicKey
      ? createClient(url, publicKey, { auth: { persistSession: false, autoRefreshToken: false } })
      : null
  }
  return authClient
}

export async function requireAuth(req, res, next) {
  const client = getAuthClient()
  if (!client) return res.status(503).json({ error: 'Autenticação do servidor não configurada.' })

  const authorization = req.get('authorization') || ''
  const token = authorization.match(/^Bearer\s+(.+)$/i)?.[1]
  if (!token) return res.status(401).json({ error: 'Autenticação necessária.' })

  try {
    // getUser consulta o serviço Auth para validar o token, em vez de confiar no conteúdo enviado.
    const { data, error } = await client.auth.getUser(token)
    if (error || !data?.user) return res.status(401).json({ error: 'Sessão inválida ou expirada.' })
    req.user = data.user
    req.accessToken = token
    return next()
  } catch {
    return res.status(401).json({ error: 'Não foi possível validar a sessão.' })
  }
}

