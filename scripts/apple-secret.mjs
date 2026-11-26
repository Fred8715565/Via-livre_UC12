// Gera o "Secret Key" (JWT) que o Supabase pede no provedor Apple. Sem dependências: só Node 18+.
//
// Uso:
//   APPLE_TEAM_ID=ABCDE12345 APPLE_KEY_ID=XYZ987WXYZ APPLE_SERVICES_ID=br.com.vialivre.web \
//   node scripts/apple-secret.mjs caminho/para/AuthKey_XYZ987WXYZ.p8
//
// A Apple limita a validade a 6 meses: gere outro antes de vencer e cole no painel do Supabase.
// Guarde o arquivo .p8 em local seguro e NUNCA o envie ao Git.
import { createPrivateKey, sign } from 'node:crypto'
import { readFileSync } from 'node:fs'

const { APPLE_TEAM_ID, APPLE_KEY_ID, APPLE_SERVICES_ID } = process.env
const keyPath = process.argv[2]
if (!APPLE_TEAM_ID || !APPLE_KEY_ID || !APPLE_SERVICES_ID || !keyPath) {
  console.error('Informe APPLE_TEAM_ID, APPLE_KEY_ID, APPLE_SERVICES_ID e o caminho do arquivo .p8.')
  process.exit(1)
}

const b64 = value => Buffer.from(typeof value === 'string' ? value : JSON.stringify(value)).toString('base64url')
const now = Math.floor(Date.now() / 1000)
const lifetime = 60 * 60 * 24 * 180 // 180 dias (o máximo da Apple é ~6 meses)

const header = { alg: 'ES256', kid: APPLE_KEY_ID }
const claims = { iss: APPLE_TEAM_ID, iat: now, exp: now + lifetime, aud: 'https://appleid.apple.com', sub: APPLE_SERVICES_ID }
const input = `${b64(header)}.${b64(claims)}`
const signature = sign('sha256', Buffer.from(input), { key: createPrivateKey(readFileSync(keyPath)), dsaEncoding: 'ieee-p1363' })

console.log(`${input}.${signature.toString('base64url')}`)
console.error(`\n✔ Secret gerado. Expira em ${new Date((now + lifetime) * 1000).toLocaleDateString('pt-BR')}. Marque esta data na agenda!`)
