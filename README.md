# Via Livre
Plataforma demonstrativa de acessibilidade urbana (React + Vite + React Router + Lucide + Leaflet/OpenStreetMap).
```
npm install
npm run dev        # site em http://localhost:5173
npm run server     # (opcional) API Express em :3001 para integrações futuras
```
Dados salvos no `localStorage` (chaves `vl_*`). Locais, avaliações, localização do usuário (Cariacica, ES) e o drone são **demonstrativos**; não há drone físico.
Estrutura: `src/components`, `pages`, `services`, `context`, `data`, `routes`, `styles`; `server/` = Express.
