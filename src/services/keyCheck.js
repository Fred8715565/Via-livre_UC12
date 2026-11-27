// Confere se a chave colocada em VITE_SUPABASE_ANON_KEY pode ser usada no navegador.
// O Supabase bloqueia chaves SECRETAS (sb_secret_… ou o JWT antigo "service_role") em requisições
// vindas de navegador (erro 401), então o login simplesmente não funciona com elas — e, como toda
// variável VITE_ vai dentro do JavaScript do site, essa chave ficaria pública.
export function classifyBrowserKey(key) {
  const value = String(key ?? '').trim()
  if (!value) return 'missing'
  if (value.startsWith('sb_secret_')) return 'secret'
  if (value.startsWith('sb_publishable_')) return 'ok'
  const payload = value.split('.')[1] // chave antiga: um JWT cujo papel é "anon" ou "service_role"
  if (payload) {
    try {
      const { role } = JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')))
      if (role === 'service_role') return 'secret'
    } catch { /* não é um JWT legível: deixa passar e o Supabase avisa se for inválida */ }
  }
  return 'ok'
}

export const CONFIG_MESSAGES = {
  missing: 'O serviço de autenticação ainda não foi configurado. Preencha VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY no arquivo .env.local e reinicie o "npm run dev".',
  secret: 'A chave em VITE_SUPABASE_ANON_KEY é uma chave SECRETA, e o Supabase bloqueia esse tipo de chave no navegador — por isso entrar não funciona. Troque pela chave PUBLICÁVEL (sb_publishable_…) em Project Settings → API Keys, salve o .env.local e reinicie o "npm run dev".'
}

// Texto do aviso na tela de login, ou null quando está tudo certo.
export function configProblem(url, key) {
  const status = classifyBrowserKey(key)
  if (status === 'secret') return CONFIG_MESSAGES.secret
  if (!String(url ?? '').trim() || status === 'missing') return CONFIG_MESSAGES.missing
  return null
}
