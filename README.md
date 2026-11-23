# Via Livre
App demonstrativo de acessibilidade urbana (React + Vite + React Router + Lucide + Leaflet/OpenStreetMap), com o layout do design **Mobile** (coluna de 412 px). Os mapas com sua localização continuam os da base (Leaflet + OpenStreetMap).

```
npm install
npm run dev        # http://localhost:5173
npm test           # testes unitários (Vitest)
npm run build
npm run server     # (opcional) API Express em :3001
```
Telas: Início, Explorar (`/mapa`), Lugar (`/lugar/:id`), Sinal (`/drone`), Perfil, Histórico e Sugerir lugar. Dados em `localStorage` (`vl_*`); locais, avaliações, posição e drone são **demonstrativos**.
Estrutura: `src/components`, `pages`, `services` (regras puras + testes), `context`, `data`, `routes`, `styles`; `public/img` = imagens extraídas do design.
