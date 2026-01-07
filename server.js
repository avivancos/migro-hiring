/* eslint-disable no-console */
const path = require('path')
const fs = require('fs')
const express = require('express')

const app = express()

const PORT = Number(process.env.PORT || 3000)
const DIST_DIR = path.join(__dirname, 'dist')

// Health check (Render)
app.get('/healthz', (_req, res) => {
  res.status(200).type('text/plain').send('ok\n')
})

// Cache headers for static assets (best-effort)
app.use(
  express.static(DIST_DIR, {
    maxAge: '365d',
    immutable: true,
    setHeaders: (res, filePath) => {
      if (filePath.endsWith('index.html')) {
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate')
        res.setHeader('Pragma', 'no-cache')
        res.setHeader('Expires', '0')
      }
    },
  })
)

// SPA fallback: cualquier ruta -> index.html
app.get('*', (req, res) => {
  const indexPath = path.join(DIST_DIR, 'index.html')
  if (!fs.existsSync(indexPath)) {
    return res
      .status(500)
      .type('text/plain')
      .send(
        'dist/index.html no existe. Ejecuta el build antes de arrancar el servicio (npm run build).\n'
      )
  }
  return res.sendFile(indexPath)
})

app.listen(PORT, '0.0.0.0', () => {
  console.log(`[migro-hiring] web listening on :${PORT}`)
})

