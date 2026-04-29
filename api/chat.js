/**
 * HireFlow — Vercel Serverless Proxy
 * POST /api/chat
 *
 * Keeps your AI API key server-side so users don't need their own.
 * Supports: Groq (default), Grok, Gemini, Anthropic — whichever key you set.
 *
 * Set ONE of these in Vercel → Settings → Environment Variables:
 *   GROQ_API_KEY      ← recommended (free tier, fast)
 *   GROK_API_KEY
 *   GEMINI_API_KEY
 *   ANTHROPIC_API_KEY
 */

const PROVIDERS = {
  groq: {
    url: 'https://api.groq.com/openai/v1/chat/completions',
    model: 'llama-3.3-70b-versatile',
    format: 'openai',
  },
  grok: {
    url: 'https://api.x.ai/v1/chat/completions',
    model: 'grok-3-mini',
    format: 'openai',
  },
  gemini: {
    url: 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions',
    model: 'gemini-2.0-flash',
    format: 'openai',
  },
  anthropic: {
    url: 'https://api.anthropic.com/v1/messages',
    model: 'claude-sonnet-4-20250514',
    format: 'anthropic',
  },
};

function getServerConfig() {
  if (process.env.GROQ_API_KEY)
    return { key: process.env.GROQ_API_KEY, ...PROVIDERS.groq };
  if (process.env.GROK_API_KEY)
    return { key: process.env.GROK_API_KEY, ...PROVIDERS.grok };
  if (process.env.GEMINI_API_KEY)
    return { key: process.env.GEMINI_API_KEY, ...PROVIDERS.gemini };
  if (process.env.ANTHROPIC_API_KEY)
    return { key: process.env.ANTHROPIC_API_KEY, ...PROVIDERS.anthropic };
  return null;
}

export default async function handler(req, res) {
  // CORS — allow same origin + localhost dev
  const origin = req.headers.origin || '';
  if (origin.includes('localhost') || origin.includes('vercel.app') || origin.includes('hireflow')) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const cfg = getServerConfig();
  if (!cfg) {
    return res.status(503).json({
      error: 'No API key configured on server. Add GROQ_API_KEY in Vercel → Settings → Environment Variables.',
    });
  }

  const { prompt, maxTokens = 800 } = req.body || {};
  if (!prompt || typeof prompt !== 'string' || prompt.length > 8000) {
    return res.status(400).json({ error: 'Invalid prompt' });
  }

  try {
    let response, text;

    if (cfg.format === 'openai') {
      response = await fetch(cfg.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${cfg.key}`,
        },
        body: JSON.stringify({
          model: cfg.model,
          max_tokens: Math.min(maxTokens, 1200),
          messages: [{ role: 'user', content: prompt }],
        }),
      });
      if (!response.ok) {
        const err = await response.text();
        return res.status(response.status).json({ error: `Provider error: ${err.slice(0, 200)}` });
      }
      const data = await response.json();
      text = data.choices[0].message.content;

    } else {
      // Anthropic format
      response = await fetch(cfg.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': cfg.key,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: cfg.model,
          max_tokens: Math.min(maxTokens, 1200),
          messages: [{ role: 'user', content: prompt }],
        }),
      });
      if (!response.ok) {
        const err = await response.text();
        return res.status(response.status).json({ error: `Provider error: ${err.slice(0, 200)}` });
      }
      const data = await response.json();
      text = data.content.map(c => c.text || '').join('');
    }

    return res.status(200).json({ text: text.replace(/```json|```/g, '').trim() });

  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
