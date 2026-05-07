const ALLOWED_ORIGINS = [
  'https://shimizu1111.github.io',
  'http://localhost:5173',
  'http://localhost:5174',
]

const ALLOWED_PATHS = ['/v1/messages', '/v1/models']

function corsHeaders(origin: string): Record<string, string> {
  const allowedOrigin = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0]
  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, x-api-key, anthropic-version, anthropic-dangerous-direct-browser-access',
    'Access-Control-Max-Age': '86400',
  }
}

export default {
  async fetch(request: Request): Promise<Response> {
    const origin = request.headers.get('Origin') || ''

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders(origin) })
    }

    const url = new URL(request.url)
    if (!ALLOWED_PATHS.includes(url.pathname)) {
      return new Response('Not found', { status: 404 })
    }

    const apiKey = request.headers.get('x-api-key')
    if (!apiKey) {
      return new Response(JSON.stringify({ error: { message: 'API key required' } }), {
        status: 401,
        headers: { ...corsHeaders(origin), 'Content-Type': 'application/json' },
      })
    }

    // /v1/models は GET、/v1/messages は POST
    if (url.pathname === '/v1/models' && request.method !== 'GET') {
      return new Response('Method not allowed', { status: 405 })
    }
    if (url.pathname === '/v1/messages' && request.method !== 'POST') {
      return new Response('Method not allowed', { status: 405 })
    }

    const fetchOptions: RequestInit = {
      method: request.method,
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
    }

    if (request.method === 'POST') {
      fetchOptions.body = await request.text()
    }

    const anthropicResponse = await fetch(`https://api.anthropic.com${url.pathname}`, fetchOptions)

    return new Response(anthropicResponse.body, {
      status: anthropicResponse.status,
      headers: {
        ...corsHeaders(origin),
        'Content-Type': anthropicResponse.headers.get('Content-Type') || 'application/json',
      },
    })
  },
}
