-- Torna uma conta administradora do painel de gestão (/admin).
-- Rode no Supabase: SQL Editor → New query → cole → Run.
-- O papel fica em app_metadata, que o usuário NÃO consegue editar pelo navegador.

update auth.users
set raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb) || '{"role": "admin"}'::jsonb
where email = 'fredericosouzamartins19@gmail.com';   -- troque pelo e-mail da conta (a conta precisa existir)

-- Conferir quem é admin:
select id, email, phone, raw_app_meta_data ->> 'role' as role
from auth.users
where raw_app_meta_data ->> 'role' = 'admin';

-- Depois de rodar: saia do app e entre de novo (o papel vem no token de login).

-- ---------------------------------------------------------------
-- EMERGÊNCIA: o admin perdeu o celular do autenticador e ninguém mais é admin.
-- Remove os autenticadores dessa conta (ela ativa um novo no próximo login):
-- delete from auth.mfa_factors
-- where user_id = (select id from auth.users where email = 'SEU-EMAIL@exemplo.com');
