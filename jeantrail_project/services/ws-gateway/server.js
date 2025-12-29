import express from 'express'
import cors from 'cors'
import http from 'http'
import { WebSocketServer } from 'ws'

const app = express()
app.use(express.json())
const allow = process.env.ALLOW_ORIGIN || 'localhost'
app.use(cors({ origin: (o, cb) => cb(null, !!o && o.includes(allow)) }))

const server = http.createServer(app)
const wss = new WebSocketServer({ server, path: '/ws' })

const scheduled = []

app.get('/health', (req, res) => res.json({ ok: true }))
app.get('/api/info', (req, res) => res.json({ name: 'ws-gateway', version: '1.0.0' }))
app.post('/api/schedule', (req, res) => {
  const t = req.body || {}
  if (!t.name) return res.status(400).json({ error: 'name' })
  scheduled.push({ ...t, id: Date.now().toString() })
  res.json({ ok: true })
})
app.get('/api/schedule', (req, res) => res.json(scheduled))
app.get('/api/camera/list', (req, res) => res.json([{ id: 'front', name: 'Front' }, { id: 'back', name: 'Back' }]))
app.post('/api/camera/stream/start', (req, res) => res.json({ ok: true }))

wss.on('connection', (ws) => {
  ws.on('message', (msg) => {
    let data
    try { data = JSON.parse(msg.toString()) } catch { data = {} }
    if (data.type === 'schedule_task' && data.task) {
      scheduled.push({ ...data.task, id: Date.now().toString() })
      ws.send(JSON.stringify({ type: 'scheduled', ok: true }))
    } else {
      ws.send(JSON.stringify({ type: 'echo', payload: data }))
    }
  })
})

const port = 8787
server.listen(port, () => {})
