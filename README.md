# Via Livre

Aplicação React + Vite de acessibilidade urbana. O projeto mantém as páginas existentes (Início, Mapa, Ir, Histórico, Perfil, Lugar e Sugerir) e agora inclui autenticação real com Supabase Auth.

## Requisitos e comandos

- Node.js 18 ou superior
- Projeto no Supabase
- Um provedor SMTP transacional para entrega de e-mails em produção

```bash
npm install
cp .env.example .env.local
npm run dev
npm test
npm run test:coverage
npm run build
```

No Windows PowerShell, copie o arquivo com `Copy-Item .env.example .env.local`.

## 1. Conectar ao Supabase

1. Crie um projeto no [Supabase](https://supabase.com/dashboard).
2. Em **Project Settings → API**, copie a Project URL e a chave pública `anon` (ou `publishable`).
3. Preencha `.env.local`:

```env
VITE_SUPABASE_URL=https://SEU-PROJETO.supabase.co
VITE_SUPABASE_ANON_KEY=SUA_CHAVE_PUBLICA
```

4. Reinicie `npm run dev` após alterar o `.env.local`.
5. Em **Authentication → URL Configuration**, configure `Site URL` e adicione URLs permitidas para desenvolvimento (`http://localhost:5173/**`) e para o domínio HTTPS de produção.
6. Em **Authentication → Sign In / Providers → Email**, habilite e-mail/senha e confirme os requisitos mínimos de senha. O projeto valida pelo menos 8 caracteres, com uma letra maiúscula, uma minúscula e um número.

A chave `anon`/`publishable` é pública e deve ser protegida por políticas adequadas no banco. Nunca use `service_role`, tokens administrativos ou segredos do SMTP em variáveis `VITE_` ou no navegador.

## 2. Configurar o login com Google

1. No Google Cloud Console, crie ou selecione um projeto e configure a tela de consentimento OAuth.
2. Crie um OAuth Client ID do tipo **Web application**.
3. No painel Supabase, abra **Authentication → Sign In / Providers → Google** e copie o **Callback URL** exibido pelo Supabase.
4. Adicione esse endereço como **Authorized redirect URI** no cliente OAuth do Google.
5. Copie o Client ID e Client Secret do Google para os campos do provedor Google no painel do Supabase e habilite o provedor.
6. Salve e teste o botão “Entrar com Google” em `http://localhost:5173` e no domínio de produção.

O Client Secret do Google fica somente no painel Supabase. O navegador recebe apenas a URL do projeto e a chave pública do Supabase.

## 3. Recuperação por código de 6 dígitos

O fluxo usa `resetPasswordForEmail`, `verifyOtp` com `type: 'recovery'` e `updateUser({ password })` no Supabase Auth. Não há código fixo, armazenamento de senha/código no navegador ou envio simulado.

1. Em **Authentication → Email Templates → Reset Password**, edite o conteúdo para incluir `{{ .Token }}` (em vez de depender somente do link). Exemplo:

```html
<h2>Redefinir senha - Via Livre</h2>
<p>Use este código para redefinir sua senha:</p>
<h1>{{ .Token }}</h1>
<p>Se você não solicitou a alteração, ignore este e-mail.</p>
```

2. Em **Authentication → Sign In / Providers → Email**, configure **Email OTP expiration** para `300` segundos (5 minutos). O Supabase usa outro valor por padrão, então a validade exibida na interface só corresponde aos 5 minutos depois dessa configuração.
3. Mantenha os limites de requisições/OTP do Supabase habilitados. A tela também aplica um intervalo visual de 60 segundos para reenvio; a proteção real contra abuso deve permanecer no servidor do Supabase.
4. O código é validado pelo endpoint de Auth do Supabase e a troca de senha ocorre somente depois que o serviço cria a sessão de recuperação.

## 4. Entrega de e-mail para Gmail

O Gmail do usuário pode ser o destinatário. Para entregar e-mails a qualquer pessoa em produção, configure um SMTP próprio em **Project Settings → Auth → SMTP Settings** (o caminho pode variar com a versão do painel). Use um provedor transacional que ofereça SMTP, por exemplo Resend, Postmark, Amazon SES ou SendGrid. Informe host, porta, usuário, senha e remetente verificado no painel Supabase. Não coloque credenciais SMTP no frontend.

O SMTP padrão de teste do Supabase é limitado e não é indicado para produção; a documentação informa que ele restringe destinatários e envio. Consulte os limites atuais antes de publicar.

## 5. Sessão e proteção

- Todas as rotas do aplicativo original estão dentro de `ProtectedRoute`.
- Usuários sem sessão são enviados para `/login`; a rota de origem fica guardada para retorno após login.
- A sessão é persistida pelo cliente Supabase. “Lembrar de mim” seleciona `localStorage`; desmarcado, usa `sessionStorage`.
- O botão **Sair da conta** fica em Perfil e encerra a sessão no Supabase.
- O servidor Express valida o Bearer token usando Supabase Auth e limita cada endpoint de dados ao usuário autenticado. Para `npm run server`, o `dotenv` carrega `.env.local`; em produção, configure as variáveis de ambiente diretamente no host.
- O endpoint `/api/health` permanece público; `/api/places` e `/api/history` exigem sessão válida; `/api/admin/*` exige administrador com 2FA.

Os dados demonstrativos de lugares, histórico, notificações e preferências continuam no `localStorage`, agora separados por ID da conta autenticada. Na primeira conta, os dados antigos do navegador são migrados uma única vez. Eles ainda não são sincronizados em nuvem entre dispositivos; a identidade e a sessão da conta ficam no Supabase.

## 6. Apple, celular, autenticador (2FA) e painel de gestão

Além de e-mail/senha e Google, o projeto tem **login com Apple**, **login por SMS**, **verificação em duas etapas por aplicativo autenticador (TOTP)** e um **painel de gestão** em `/admin`. O passo a passo de configuração está em **[GUIA-SUPABASE.md](GUIA-SUPABASE.md)**.

Resumo rápido:

- `SUPABASE_SERVICE_ROLE_KEY` (somente no servidor) habilita o painel; veja `.env.example`.
- O primeiro administrador é criado com `supabase/first-admin.sql`.
- A chave secreta da Apple é gerada com `node scripts/apple-secret.mjs` e vence a cada 6 meses.

## 7. Testes

Os testes existentes foram migrados de Vitest para Jest e foram adicionados testes para validação de e-mail/senha, cadastro, duplicidade, recuperação, OTP incorreto/expirado, limite de tentativas, redefinição e proteção de rotas.

```bash
npm test
npm run test:coverage
```

## Estrutura adicionada

(Apple, celular, 2FA e painel: veja a tabela de arquivos no [GUIA-SUPABASE.md](GUIA-SUPABASE.md).)


- `src/auth/AuthContext.jsx`: sessão global e ações de autenticação.
- `src/auth/ProtectedRoute.jsx`: bloqueio das rotas internas.
- `src/pages/auth/`: login, cadastro, recuperação, verificação OTP, nova senha e confirmação.
- `src/services/supabase.js`: inicialização do cliente Supabase e persistência de sessão.
- `src/services/authService.js`: chamadas Supabase usadas nos fluxos de autenticação.
- `src/services/authRules.js`: validações independentes e mensagens seguras.
- `src/services/auth.test.js`: testes automatizados do fluxo de autenticação.
- `.env.example`: modelo das variáveis públicas necessárias.

## Documentação oficial

- [Supabase: Login com Google](https://supabase.com/docs/guides/auth/social-sign-in/auth-google)
- [Supabase: Templates de e-mail](https://supabase.com/docs/guides/auth/auth-email-templates)
- [Supabase: SMTP personalizado](https://supabase.com/docs/guides/auth/auth-smtp)
- [Supabase: Limites de autenticação](https://supabase.com/docs/guides/auth/rate-limits)
