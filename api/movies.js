export default async function handler(req, res) {
  try {
    const apiKey = process.env.TMDB_API_KEY || process.env.VITE_TMDB_API_KEY;

    if (!apiKey) {
      return res.status(500).json({ error: 'Missing TMDB_API_KEY or VITE_TMDB_API_KEY' });
    }

    const requestUrl = new URL(req.url, 'http://localhost');
    const query = requestUrl.searchParams.get('query');

    // Build endpoint and include API key appropriately based on token type
    const base = query
      ? `https://api.themoviedb.org/3/search/movie?query=${encodeURIComponent(query)}`
      : 'https://api.themoviedb.org/3/discover/movie?sort_by=popularity.desc';

    // v4 tokens are JWT-like (contain dots), v3 keys are simple strings
    const isV4 = apiKey.includes('.')

    const headers = { accept: 'application/json' }
    let endpoint = base

    if (isV4) {
      headers['Authorization'] = `Bearer ${apiKey}`
    } else {
      // append api_key query param for v3 keys
      endpoint = `${base}${base.includes('?') ? '&' : '?'}api_key=${encodeURIComponent(apiKey)}`
    }

    const tmdbResponse = await fetch(endpoint, { method: 'GET', headers })

    if (!tmdbResponse.ok) {
      const text = await tmdbResponse.text().catch(() => '')
      return res.status(tmdbResponse.status).json({ error: 'TMDB request failed', detail: text })
    }

    const data = await tmdbResponse.json()
    return res.status(200).json(data)
  } catch (error) {
    return res.status(500).json({ error: 'Server error', detail: error.message });
  }
}