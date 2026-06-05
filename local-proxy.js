import express from 'express'
import fetch from 'node-fetch'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })
dotenv.config()

const app = express()
const PORT = process.env.PROXY_PORT || 3001

const TMDB_KEY = process.env.TMDB_API_KEY || process.env.VITE_TMDB_API_KEY

if (!TMDB_KEY) {
  console.warn('Warning: TMDB API key not found in environment. Set TMDB_API_KEY or VITE_TMDB_API_KEY in .env.local or shell.')
}

app.get('/api/movies', async (req, res) => {
  try {
    if (!TMDB_KEY) {
      return res.status(500).json({ error: 'Missing TMDB_API_KEY or VITE_TMDB_API_KEY' })
    }

    const query = req.query.query
    let endpoint = query
      ? `https://api.themoviedb.org/3/search/movie?query=${encodeURIComponent(query)}`
      : 'https://api.themoviedb.org/3/discover/movie?sort_by=popularity.desc'
    try {
      // retry helper for transient network errors
      const fetchWithRetry = async (url, options, attempts = 3) => {
        let lastErr
        for (let i = 0; i < attempts; i++) {
          try {
            return await fetch(url, options)
          } catch (e) {
            lastErr = e
            console.warn(`Fetch attempt ${i + 1} failed: ${e.message || e}`)
            await new Promise(r => setTimeout(r, 200 * (i + 1)))
          }
        }
        throw lastErr
      }

      // support v4 bearer tokens or v3 api_key query param
      const isV4 = TMDB_KEY && TMDB_KEY.includes('.')
      const headers = { accept: 'application/json' }
      if (isV4) headers['Authorization'] = `Bearer ${TMDB_KEY}`
      else endpoint = `${endpoint}${endpoint.includes('?') ? '&' : '?'}api_key=${encodeURIComponent(TMDB_KEY)}`

      const response = await fetchWithRetry(endpoint, {
        method: 'GET',
        headers,
      }, 3)

      const data = await response.json()
      res.status(response.status).json(data)
    } catch (fetchErr) {
      console.error('TMDB fetch error:', fetchErr && fetchErr.stack ? fetchErr.stack : fetchErr)
      console.error('TMDB endpoint:', endpoint)
      console.error('Request headers:', { Authorization: TMDB_KEY ? 'Bearer <redacted>' : undefined })
      res.status(500).json({ error: fetchErr.message || 'TMDB fetch failed' })
    }
  } catch (err) {
    console.error('Proxy handler error:', err)
    res.status(500).json({ error: err.message })
  }
})

app.listen(PORT, () => console.log(`Local TMDB proxy listening on http://localhost:${PORT}`))
