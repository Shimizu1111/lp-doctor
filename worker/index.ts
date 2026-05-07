const ALLOWED_ORIGINS = [
  'https://shimizu1111.github.io',
  'http://localhost:5173',
  'http://localhost:5174',
]

function corsHeaders(origin: string): Record<string, string> {
  const allowedOrigin = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0]
  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
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

    if (request.method !== 'POST') {
      return new Response('Method not allowed', { status: 405 })
    }

    const url = new URL(request.url)
    if (url.pathname !== '/v1/messages') {
      return new Response('Not found', { status: 404 })
    }

    const apiKey = request.headers.get('x-api-key')
    if (!apiKey) {
      return new Response(JSON.stringify({ error: { message: 'API key required' } }), {
        status: 401,
        headers: { ...corsHeaders(origin), 'Content-Type': 'application/json' },
      })
    }

    const body = await request.text()

    const anthropicResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body,
    })

    const responseBody = await anthropicResponse.text()

    return new Response(responseBody, {
      status: anthropicResponse.status,
      headers: {
        ...corsHeaders(origin),
        'Content-Type': 'application/json',
      },
    })
  },
}
