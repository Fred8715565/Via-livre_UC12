import dotenv from 'dotenv'
import express from 'express'
import cors from 'cors'
import { requireAuth } from './authMiddleware.js'

// Carrega .env.local para o servidor local. Em produção, configure as variáveis no host.
dotenv.config({ path: process.env.ENV_FILE || '.env.local' })

const app = express()
app.use(cors())
app.use(express.json())

let places = []
let history = []

app.get('/api/health', (_, res) => res.json({ ok: true }))

// Todos os endpoints de dados exigem um access token válido do Supabase.
app.use('/api/places', requireAuth)
app.get('/api/places', (req, res) => res.json(places.filter(place => place.ownerId === req.user.id)))
app.post('/api/places', (req, res) => {
  const { name, features = [] } = req.body || {}
  if (!name) return res.status(400).json({ error: 'name é obrigatório' })
  const place = { id: 'srv' + Date.now(), name, features, ownerId: req.user.id }
  places.push(place)
  return res.status(201).json(place)
})

app.use('/api/history', requireAuth)
app.get('/api/history', (req, res) => res.json(history.filter(item => item.ownerId === req.user.id)))
app.post('/api/history', (req, res) => {
  const item = { id: 'h' + Date.now(), ...req.body, ownerId: req.user.id }
  history.push(item)
  return res.status(201).json(item)
})
app.delete('/api/history/:id', (req, res) => {
  history = history.filter(item => !(item.id === req.params.id && item.ownerId === req.user.id))
  return res.status(204).end()
})

app.listen(3001, () => console.log('Via Livre API em http://localhost:3001'))
