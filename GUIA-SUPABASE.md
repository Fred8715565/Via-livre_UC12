# Guia: autenticador (2FA) e painel de gestão

Este guia explica **o que foi adicionado ao Via Livre, como funciona e o que você precisa configurar** (quase tudo é no painel do Supabase — o código já está pronto).

> Antes de começar: o login com e-mail/senha e Google (README) já precisa estar funcionando, com `.env.local` preenchido.

---

## 0. Como o login funciona agora

```
Entrar ──► e-mail/senha | Google                           → sessão "aal1"
              │
              ├─ conta SEM autenticador ───────────────────────► app
              └─ conta COM autenticador ─► /verificar-2fa
                                            digita o código     → sessão "aal2" ► app
```

- **aal1** = a pessoa provou quem é com *um* fator (senha ou Google).
- **aal2** = provou também o *segundo* fator (código do app autenticador).

**Importante:** o autenticador **não substitui** o primeiro login — o Supabase só aceita TOTP como **segunda etapa**. Ou seja: a pessoa entra por um dos 2 métodos e *depois* digita o código do app. É o padrão de mercado (Google, GitHub, bancos).

### O que mudou no projeto

| Arquivo | Para quê |
|---|---|
| `src/pages/auth/MfaChallenge.jsx` | tela do código do autenticador depois do login |
| `src/components/MfaSettings.jsx` | no **Perfil**: ativar/remover o autenticador (QR Code) |
| `src/auth/AuthContext.jsx` | expõe nível `aal` e `isAdmin` |
| `src/auth/ProtectedRoute.jsx` | manda para o 2FA se a conta tiver autenticador |
| `src/auth/AdminRoute.jsx` | tela **Acesso do administrador** (código de 6 dígitos): só deixa admin com 2FA entrar na gestão |
| `src/pages/admin/AdminLayout.jsx` | moldura da gestão: cabeçalho, abas (Usuários / Lugares sugeridos) e **Bloquear painel** |
| `src/pages/admin/AdminPanel.jsx` | página **Usuários** (`/admin`) |
| `src/pages/admin/AdminSuggestions.jsx` | página **Lugares sugeridos** (`/admin/lugares`) |
| `src/pages/admin/useAdminCall.js` | envia a sessão do painel em toda chamada da gestão |
| `server/admin.js` + `adminUtils.js` | API da gestão (usuários usam a chave `service_role`) |
| `server/suggestions.js` | guarda e valida as sugestões de lugares |
| `supabase/first-admin.sql` | cria o primeiro administrador |

---

## 1. Desativar Apple e celular no Supabase

O app não mostra mais o login com Apple nem por celular (SMS), mas **tirar o botão não desliga o provedor no servidor**: enquanto estiverem ligados, alguém ainda consegue chamar a API do Supabase direto com a chave pública. No caso do SMS isso também pode gerar **cobrança** do provedor de mensagens.

1. No Supabase: **Authentication → Sign In / Providers → Apple** → desligue e salve.
2. **Authentication → Sign In / Providers → Phone** → desligue e salve (e, se quiser, apague as credenciais do provedor de SMS).
3. Opcional: apague a chave `.p8` e o *Services ID* no painel da Apple, se não forem mais usados.

> Contas criadas antes por Apple ou só por celular continuam existindo no Supabase, mas **a pessoa não consegue mais entrar** por esses caminhos. Quem tinha e-mail real pode usar **Esqueci minha senha** para criar uma senha; contas só de celular (sem e-mail) ficam sem acesso e podem ser excluídas no painel de gestão.

---

## 2. Autenticador (TOTP / 2FA)

Já vem **ligado por padrão** em todo projeto Supabase e não tem custo. Confira em *Authentication → Sign In / Providers* (ou *Multi-Factor*) que o **TOTP** está habilitado.

### Como a pessoa usa

1. Entra no app → **Perfil → Verificação em duas etapas → Ativar autenticador**.
2. Escaneia o **QR Code** com Google Authenticator, Microsoft Authenticator, Authy, 1Password etc. (ou digita a chave manualmente).
3. Digita o código de 6 dígitos → **Ativar**.
4. A partir daí, depois de qualquer login (senha ou Google) aparece a tela **Verificação em duas etapas** pedindo o código.

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

## 3. Painel de gestão (`/admin`)

A gestão tem **duas páginas**, com abas no topo: **Usuários** (`/admin`) e **Lugares sugeridos** (`/admin/lugares`). Você digita o código do autenticador **uma vez** na tela *Acesso do administrador*; ele vale para as duas páginas. O botão **Bloquear painel** encerra essa liberação na hora (sem sair da conta) e volta a pedir o código; **Sair da conta** faz logout de verdade.

### O que ele faz

- Resumo: usuários, novos e ativos nos últimos 7 dias, com autenticador, bloqueados, administradores, e **quantos entram por e-mail / Google** (contas antigas de Apple ou celular, se existirem, aparecem à parte).
- Lista com **busca** (nome, e-mail, celular, ID), **filtros** (admins, bloqueados, sem 2FA) e paginação.
- Ações por usuário: **bloquear/desbloquear**, **tornar/remover admin**, **resetar 2FA**, **excluir conta**.
- **Atividade recente**: registro de quem fez o quê (fica na memória do servidor e no console; em produção, grave em uma tabela).

### Lugares sugeridos (`/admin/lugares`)

Quando alguém envia um lugar na tela **Sugerir lugar**, o app continua salvando no próprio aparelho **e também envia a sugestão ao servidor** (`POST /api/suggestions`, exige login). Na gestão, o admin vê a fila e pode **aprovar**, **recusar**, **voltar para análise** ou **excluir**, com busca e filtro por status. O servidor valida e limpa os textos de novo (tamanho, recursos repetidos), ignora campos extras como `status` e limita cada pessoa a 20 sugestões aguardando.

Importante: **aprovar só muda o status** — por enquanto a sugestão aprovada não entra sozinha no mapa dos outros usuários. As sugestões ficam **na memória do servidor** (reiniciar apaga a lista); para guardar de forma permanente, troque `server/suggestions.js` por uma tabela do Supabase mantendo as mesmas funções. Esta página **não precisa** da chave `service_role`.

### 3.1 Configurar

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

### 3.2 Como ele é protegido (3 camadas)

1. **Interface** (`AdminRoute`): esconde a página de quem não é admin e pede o código do autenticador. É só conforto — o navegador pode ser adulterado.
2. **Servidor** (`server/admin.js`): valida o token no Supabase e confere `app_metadata.role === 'admin'` e `aal2`. Para abrir a gestão, o admin chama `POST /api/admin/session`, e o servidor só aceita se o código do autenticador foi digitado **no ciclo atual do app** (até 45 segundos: 30 s do código + 15 s de tolerância, lido do claim `amr` do token). Em troca, ele recebe uma **sessão do painel** guardada só na memória do servidor, que todas as outras rotas exigem. Ela é apagada ao sair do painel (ou ao reiniciar o servidor). Esta é a proteção real: mesmo que alguém burle a tela, a API recusa.
3. **Papel inalterável pelo usuário:** o papel mora em `app_metadata`, que só pode ser escrito com `service_role`. (`user_metadata` o próprio usuário consegue editar — **nunca** use para permissões.)

Regras de segurança embutidas: o admin não consegue bloquear, excluir ou rebaixar a si mesmo, e IDs são validados.

### 3.3 Bom saber

- Bloquear impede novos logins e renovação de sessão, mas o token já emitido vale até expirar (até ~1 hora).
- O servidor guarda a sessão do painel por até 8 horas só como trava contra aba esquecida aberta; na prática ela termina antes, quando você sai do painel.
- Mudar o papel de alguém só aparece para a pessoa depois que ela **sair e entrar de novo**; no servidor vale na hora.
- A coluna **2FA** mostra "—" se a API do Supabase não devolver os fatores na listagem; as demais funções não são afetadas.
- A lista carrega até 10 mil usuários. Acima disso, mova as consultas para SQL/uma tabela própria.

---

## 4. Checklist antes de publicar

- [ ] `Site URL` e `Redirect URLs` de produção (HTTPS) no Supabase
- [ ] Provedores **Apple** e **Phone** desligados no Supabase (seção 1)
- [ ] SMTP próprio configurado (README, seção 4)
- [ ] `SUPABASE_SERVICE_ROLE_KEY` só nas variáveis de ambiente do servidor
- [ ] Pelo menos 2 admins, cada um com autenticador em 2 aparelhos
- [ ] `npm test` e `npm run build` passando

## 5. Problemas comuns

| Sintoma | Causa provável |
|---|---|
| Entrar (e-mail ou Google) não faz nada, ou aparece o aviso de chave secreta | `VITE_SUPABASE_ANON_KEY` está com a chave **secreta** (`sb_secret_…`). Use a **publicável** (`sb_publishable_…`) ali e mova a secreta para `SUPABASE_SERVICE_ROLE_KEY` (sem `VITE_`); reinicie o `npm run dev` |
| Código do autenticador sempre errado | relógio do celular fora de hora (ative "hora automática") |
| `/admin` volta para o início | a conta não é admin, ou ainda não saiu/entrou depois do SQL |
| Painel: "SUPABASE_SERVICE_ROLE_KEY não configurada" | falta a chave no `.env.local` ou o servidor não foi reiniciado |
| Painel: "Digite o código atual do autenticador" | o código digitado já passou de 45 s ou foi reaproveitado; espere o próximo código do app e digite de novo |
| Painel pede o código de novo do nada | o servidor foi reiniciado (as sessões do painel ficam na memória) ou você saiu da página |
| Painel nunca libera, mesmo com código certo | o token do seu projeto não traz o horário do código (claim `amr`); me avise para ajustar |
| Painel: "Ative e confirme o autenticador" | conta admin sem 2FA: ative pelo QR Code que o painel mostra |
