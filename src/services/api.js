// Ponto único para integrar o back-end Express no futuro (hoje o app usa localStorage).
export const api = (path, opts) => fetch('/api' + path, { headers: { 'Content-Type': 'application/json' }, ...opts }).then(r => (r.status === 204 ? null : r.json()))
