# Guia: Apple, celular, autenticador e painel de gestão

Este guia explica **o que foi adicionado ao Via Livre, como funciona e o que você precisa configurar** (quase tudo é no painel do Supabase e da Apple — o código já está pronto).

> Antes de começar: o login com e-mail/senha e Google (README) já precisa estar funcionando, com `.env.local` preenchido.

---

## 0. Como o login funciona agora

```
Entrar ──► e-mail/senha | Google | Apple | celular (SMS)      → sessão "aal1"
              │
              ├─ conta SEM autenticador ───────────────────────► app
              └─ conta COM autenticador ─► /verificar-2fa
                                            digita o código     → sessão "aal2" ► app
```

- **aal1** = a pessoa provou quem é com *um* fator (senha, SMS, Google ou Apple).
- **aal2** = provou também o *segundo* fator (código do app autenticador).

**Importante:** o autenticador **não substitui** o primeiro login — o Supabase só aceita TOTP como **segunda etapa**. Ou seja: a pessoa entra por um dos 4 métodos e *depois* digita o código do app. É o padrão de mercado (Google, GitHub, bancos).

### O que mudou no projeto

| Arquivo | Para quê |
|---|---|
| `src/pages/auth/Login.jsx` | botões **Entrar com Apple** e **Entrar com celular** |
| `src/pages/auth/PhoneLogin.jsx` | login por SMS (número → código de 6 dígitos) |
| `src/pages/auth/MfaChallenge.jsx` | tela do código do autenticador depois do login |
| `src/components/MfaSettings.jsx` | no **Perfil**: ativar/remover o autenticador (QR Code) |
| `src/auth/AuthContext.jsx` | expõe Apple, celular, nível `aal` e `isAdmin` |
| `src/auth/ProtectedRoute.jsx` | manda para o 2FA se a conta tiver autenticador |
| `src/auth/AdminRoute.jsx` | só deixa admin com 2FA entrar em `/admin` |
| `src/pages/admin/AdminPanel.jsx` | o painel de gestão |
| `server/admin.js` + `adminUtils.js` | API do painel (usa a chave `service_role`) |
| `scripts/apple-secret.mjs` | gera a chave secreta da Apple |
| `supabase/first-admin.sql` | cria o primeiro administrador |

---

## 1. Login com Apple

**Você precisa de:** conta paga do [Apple Developer Program](https://developer.apple.com/programs/) (cerca de US$ 99/ano). Sem ela, não há como habilitar o Sign in with Apple.

### 1.1 No site da Apple (developer.apple.com → Certificates, Identifiers & Profiles)

1. **App ID** — *Identifiers → +* → **App IDs** → App. Dê um nome e um Bundle ID (ex.: `br.com.vialivre`). Em *Capabilities*, marque **Sign in with Apple**. Salve.
2. **Services ID** — *Identifiers → +* → **Services IDs**. Use um identificador como `br.com.vialivre.web` (**este é o seu "Client ID"**). Depois de criar, abra-o, marque **Sign in with Apple** e clique em **Configure**:
   - *Primary App ID*: o App ID do passo 1.
   - *Domains*: `SEU-PROJETO.supabase.co` (sem `https://`).
   - *Return URLs*: `https://SEU-PROJETO.supabase.co/auth/v1/callback`
3. **Key** — *Keys → +*. Marque **Sign in with Apple**, escolha o App ID e crie. **Baixe o arquivo `.p8` (só dá para baixar uma vez!)** e anote o **Key ID**.
4. Anote também o seu **Team ID** (canto superior direito do site, 10 caracteres).

> O "SEU-PROJETO" está na URL do Supabase (`Project Settings → API → Project URL`). O Callback URL exato também aparece no painel do Supabase, no provedor Apple.

### 1.2 Gerar o "Secret Key"

A Apple não entrega uma senha pronta: você gera um **JWT assinado com o arquivo `.p8`**. Use o script do projeto:

```bash
APPLE_TEAM_ID=SEU_TEAM_ID APPLE_KEY_ID=SEU_KEY_ID APPLE_SERVICES_ID=br.com.vialivre.web \
node scripts/apple-secret.mjs caminho/AuthKey_SEU_KEY_ID.p8
```

(No PowerShell: defina com `$env:APPLE_TEAM_ID="..."` e rode o `node` em seguida.) O texto longo que aparece é o **Secret Key**.

> ⚠️ **Esse segredo expira em no máximo 6 meses.** Quando vence, o botão da Apple para de funcionar para todo mundo, sem aviso. O script mostra a data de validade — **coloque um lembrete na agenda** e repita este passo antes disso.

### 1.3 No Supabase

1. **Authentication → Sign In / Providers → Apple**: ligue, em **Client IDs** coloque o *Services ID* e em **Secret Key** cole o JWT. Salve.
2. **Authentication → URL Configuration → Redirect URLs**: confirme que existem `http://localhost:5173/**` e o seu domínio de produção.

### 1.4 Testar

`npm run dev` → *Entrar com Apple*. Dicas:
- A Apple só informa o **nome** na *primeira* vez que a pessoa autoriza, e o Supabase não preenche o nome automaticamente. O app usa o e-mail quando não há nome.
- Se a pessoa escolher "ocultar e-mail", chega um endereço `@privaterelay.appleid.com`. Para enviar e-mails a esses endereços, registre seu remetente em *Services → Sign in with Apple for Email Communication* na Apple.
- Erro `invalid_client` = Services ID diferente do `sub` do JWT, ou secret vencido.

---

## 2. Login com celular (SMS)

O SMS é enviado por um **provedor externo** (o Supabase não envia SMS sozinho). Suportados: **Twilio**, **Twilio Verify**, **MessageBird** e **Vonage** (TextLocal é mantido pela comunidade).

### 2.1 Configurar

1. Crie conta no provedor (ex.: [Twilio](https://www.twilio.com)) e pegue as credenciais (no Twilio: *Account SID*, *Auth Token* e um *Message Service SID*).
2. No Supabase: **Authentication → Sign In / Providers → Phone**: ligue e escolha o provedor, preenchendo as credenciais.
3. Por padrão, o código tem 6 dígitos e só pode ser pedido a cada 60 segundos (o app já mostra o contador de reenvio).

### 2.2 Testar sem gastar SMS

Na própria configuração do provedor **Phone** há a opção de **números de teste com código fixo** (procure por *Test Phone Numbers and OTPs*). Cadastre, por exemplo, `5527999990000=123456` e use esse número no app: o SMS não é enviado e o código é sempre `123456`.

### 2.3 Cuidados de produção

- **Custo e abuso:** robôs podem disparar SMS e gerar cobrança ("SMS pumping"). Ative **CAPTCHA** (Authentication → Attack Protection) e mantenha os limites de requisições do Supabase.
- **Regras por país:** alguns países exigem cadastro de remetente. Confira as regras do seu provedor para o **Brasil** antes de publicar.
- O número é guardado em formato internacional (`+5527999990000`). O app aceita `(27) 99999-0000` e converte sozinho; para outros países digite `+` e o código do país.
- Contas criadas por celular **não têm e-mail** — por isso o Perfil e o painel mostram o telefone.

---

## 3. Autenticador (TOTP / 2FA)

Já vem **ligado por padrão** em todo projeto Supabase e não tem custo. Confira em *Authentication → Sign In / Providers* (ou *Multi-Factor*) que o **TOTP** está habilitado.

### Como a pessoa usa

1. Entra no app → **Perfil → Verificação em duas etapas → Ativar autenticador**.
2. Escaneia o **QR Code** com Google Authenticator, Microsoft Authenticator, Authy, 1Password etc. (ou digita a chave manualmente).
3. Digita o código de 6 dígitos → **Ativar**.
4. A partir daí, depois de qualquer login (senha, Google, Apple ou SMS) aparece a tela **Verificação em duas etapas** pedindo o código.

### O que o código faz (para você entender)

| Etapa | Chamada do Supabase |
|---|---|
| Gerar QR Code | `supabase.auth.mfa.enroll({ factorType: 'totp' })` |
| Confirmar/validar código | `supabase.auth.mfa.challengeAndVerify({ factorId, code })` |
| Saber se precisa pedir código | `supabase.auth.mfa.getAuthenticatorAssuranceLevel()` → `currentLevel` x `nextLevel` |
| Remover | `supabase.auth.mfa.unenroll({ factorId })` + `refreshSession()` |

Se `nextLevel === 'aal2'` e `currentLevel !== 'aal2'`, a pessoa tem autenticador mas ainda não digitou o código — é isso que `ProtectedRoute` checa.

### Perdeu o celular? (o Supabase não gera códigos de recuperação)

- **Prevenção:** no Perfil existe **Adicionar outro autenticador (backup)** — cadastre em dois aparelhos.
- **Usuário comum:** um admin abre o painel e usa o botão 🔑 **Resetar autenticador**. No próximo login a pessoa ativa um novo.
- **Admin:** outro admin faz o reset, ou use o SQL de emergência no fim de `supabase/first-admin.sql`.

> **Segurança de verdade fica no servidor/banco.** As telas só guiam a pessoa; quem protege os dados é o servidor (já exige `aal2` para o painel) e, se quiser, políticas RLS no banco, por exemplo `using ((auth.jwt() ->> 'aal') = 'aal2')`.

---

## 4. Painel de gestão (`/admin`)

### O que ele faz

- Resumo: usuários, novos e ativos nos últimos 7 dias, com autenticador, bloqueados, administradores, e **quantos entram por e-mail / Google / Apple / celular**.
- Lista com **busca** (nome, e-mail, celular, ID), **filtros** (admins, bloqueados, sem 2FA) e paginação.
- Ações por usuário: **bloquear/desbloquear**, **tornar/remover admin**, **resetar 2FA**, **excluir conta**.
- **Atividade recente**: registro de quem fez o quê (fica na memória do servidor e no console; em produção, grave em uma tabela).

### 4.1 Configurar

1. Em **Project Settings → API**, copie a chave **service_role** (ou *secret key*) e coloque no `.env.local`:
   ```env
   SUPABASE_SERVICE_ROLE_KEY=...
   ```
   ⚠️ **Sem `VITE_` no nome.** Essa chave dá poder total sobre o projeto; ela só deve existir no servidor. Nunca no Git, nunca no navegador.
2. Crie o primeiro administrador: abra `supabase/first-admin.sql`, troque o e-mail e rode no **SQL Editor** do Supabase.
3. Rode o servidor e o app (dois terminais):
   ```bash
   npm run server
   npm run dev
   ```
4. Entre com a conta admin, saia e entre de novo e acesse `/admin` (ou use o link **Painel de gestão (admin)** no Perfil). Então:
   - **Sem autenticador ainda:** o painel não abre; ele mostra o QR Code ali mesmo para você ativar. Ao confirmar o código, o painel libera.
   - **Com autenticador:** o painel pede o código de 6 dígitos que está aparecendo **naquele momento** no app (ele muda a cada 30 segundos). O código é pedido **toda vez que você abre o painel**: sair da página, recarregar, fechar a aba ou clicar em *Sair* trava o painel de novo. Não existe "janela de X minutos".

### 4.2 Como ele é protegido (3 camadas)

1. **Interface** (`AdminRoute`): esconde a página de quem não é admin e pede o código do autenticador. É só conforto — o navegador pode ser adulterado.
2. **Servidor** (`server/admin.js`): valida o token no Supabase e confere `app_metadata.role === 'admin'` e `aal2`. Para abrir o painel, o admin chama `POST /api/admin/session`, e o servidor só aceita se o código do autenticador foi digitado **no ciclo atual do app** (até 45 segundos: 30 s do código + 15 s de tolerância, lido do claim `amr` do token). Em troca, ele recebe uma **sessão do painel** guardada só na memória do servidor, que todas as outras rotas exigem. Ela é apagada ao sair do painel (ou ao reiniciar o servidor). Esta é a proteção real: mesmo que alguém burle a tela, a API recusa.
3. **Papel inalterável pelo usuário:** o papel mora em `app_metadata`, que só pode ser escrito com `service_role`. (`user_metadata` o próprio usuário consegue editar — **nunca** use para permissões.)

Regras de segurança embutidas: o admin não consegue bloquear, excluir ou rebaixar a si mesmo, e IDs são validados.

### 4.3 Bom saber

- Bloquear impede novos logins e renovação de sessão, mas o token já emitido vale até expirar (até ~1 hora).
- O servidor guarda a sessão do painel por até 8 horas só como trava contra aba esquecida aberta; na prática ela termina antes, quando você sai do painel.
- Mudar o papel de alguém só aparece para a pessoa depois que ela **sair e entrar de novo**; no servidor vale na hora.
- A coluna **2FA** mostra "—" se a API do Supabase não devolver os fatores na listagem; as demais funções não são afetadas.
- A lista carrega até 10 mil usuários. Acima disso, mova as consultas para SQL/uma tabela própria.

---

## 5. Checklist antes de publicar

- [ ] `Site URL` e `Redirect URLs` de produção (HTTPS) no Supabase
- [ ] Apple: Services ID, domínio e Return URL corretos + **lembrete de renovar o secret (6 meses)**
- [ ] SMS: provedor pago configurado, CAPTCHA ligado, limites revisados
- [ ] SMTP próprio configurado (README, seção 4)
- [ ] `SUPABASE_SERVICE_ROLE_KEY` só nas variáveis de ambiente do servidor
- [ ] Pelo menos 2 admins, cada um com autenticador em 2 aparelhos
- [ ] `npm test` e `npm run build` passando

## 6. Problemas comuns

| Sintoma | Causa provável |
|---|---|
| "Unsupported provider" ao clicar em Apple | provedor Apple não está habilitado no Supabase |
| Apple funcionava e parou | Secret Key (JWT) venceu — gere outro (seção 1.2) |
| "Não foi possível enviar o SMS" | provedor de SMS não configurado, saldo/remetente inválido |
| Código do autenticador sempre errado | relógio do celular fora de hora (ative "hora automática") |
| `/admin` volta para o início | a conta não é admin, ou ainda não saiu/entrou depois do SQL |
| Painel: "SUPABASE_SERVICE_ROLE_KEY não configurada" | falta a chave no `.env.local` ou o servidor não foi reiniciado |
| Painel: "Digite o código atual do autenticador" | o código digitado já passou de 45 s ou foi reaproveitado; espere o próximo código do app e digite de novo |
| Painel pede o código de novo do nada | o servidor foi reiniciado (as sessões do painel ficam na memória) ou você saiu da página |
| Painel nunca libera, mesmo com código certo | o token do seu projeto não traz o horário do código (claim `amr`); me avise para ajustar |
| Painel: "Ative e confirme o autenticador" | conta admin sem 2FA: ative pelo QR Code que o painel mostra |
