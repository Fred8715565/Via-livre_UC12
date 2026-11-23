// Back-end de base (Node + Express) para futuras integrações. Dados em memória, apenas demonstrativos.
import express from 'express'
import cors from 'cors'
const app = express()
app.use(cors()); app.use(express.json())
let places = [], history = []
app.get('/api/health', (_, res) => res.json({ ok: true, demo: true }))
app.get('/api/places', (_, res) => res.json(places))
app.post('/api/places', (req, res) => { const { name, features = [] } = req.body || {}
  if (!name) return res.status(400).json({ error: 'name é obrigatório' })
  const p = { id: 'srv' + Date.now(), name, features }; places.push(p); res.status(201).json(p) })
app.get('/api/history', (_, res) => res.json(history))
app.post('/api/history', (req, res) => { const h = { id: 'h' + Date.now(), ...req.body }; history.push(h); res.status(201).json(h) })
app.delete('/api/history/:id', (req, res) => { history = history.filter(h => h.id !== req.params.id); res.status(204).end() })
app.listen(3001, () => console.log('Via Livre API em http://localhost:3001'))
