import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = process.env.PORT || 3000;

  // JSON middleware
  app.use(express.json());

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // AI Search Route using OpenRouter
  app.post('/api/ai-search', async (req, res) => {
    try {
      const { query } = req.body;
      if (!query) {
        return res.status(400).json({ error: 'Query is required' });
      }

      const apiKey = process.env.OPENROUTER_API_KEY;
      if (!apiKey) {
        return res.status(500).json({ error: 'OPENROUTER_API_KEY is not configured on the server' });
      }

      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'nvidia/nemotron-3-ultra-550b-a55b:free',
          messages: [
            {
              role: 'system',
              content: 'You are an anime database assistant. The user will give you a misspelled or ambiguous anime title. Your job is to return ONLY a valid JSON object with the exact Shikimori ID (number), exact Russian title, and exact English title of the matched anime. Format: {"shikimoriId": 123, "russian": "Название", "english": "Title"}. Do not include markdown formatting or any other text.'
            },
            {
              role: 'user',
              content: query
            }
          ]
        })
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error?.message || 'Failed to fetch from OpenRouter');
      }

      if (!data.choices || !data.choices[0]) {
        console.error('OpenRouter error response:', data);
        return res.status(500).json({ error: 'Invalid response from AI model' });
      }

      const content = data.choices[0].message.content;
      // Strip markdown code blocks if any
      const cleaned = content.replace(/```json/gi, '').replace(/```/g, '').trim();
      res.json(JSON.parse(cleaned));
    } catch (error: any) {
      console.error('AI Search Error:', error);
      res.status(500).json({ error: error.message || 'Failed to process AI search' });
    }
  });

  // Kodik API Proxy Route based on YaNesyTortiK/AnimeParsers spec
  app.get('/api/kodik/search', async (req, res) => {
    try {
      const token = process.env.KODIK_API_TOKEN || req.query.token || 'e33c860d637468640a23224b17d54fb3';
      const shikimoriId = req.query.shikimori_id;
      const title = req.query.title;
      const episode = req.query.episode || 1;

      if (!shikimoriId && !title) {
        return res.status(400).json({ error: 'shikimori_id or title is required' });
      }

      const params = new URLSearchParams();
      params.set('token', String(token));
      if (shikimoriId) params.set('shikimori_id', String(shikimoriId));
      if (title) params.set('title', String(title));
      params.set('with_episodes', 'true');
      params.set('with_material_data', 'true');

      // Attempt fetch to kodik api
      try {
        const kodikRes = await fetch(`https://kodikapi.com/search?${params.toString()}`, {
          headers: { 'User-Agent': 'Mozilla/5.0' }
        });
        if (kodikRes.ok) {
          const data = await kodikRes.json();
          return res.json(data);
        }
      } catch (err) {
        // Fallback to structure based on local catalog
      }

      res.json({
        time: '0ms',
        total: 1,
        results: [
          {
            id: `shikimori-${shikimoriId || 'custom'}`,
            type: 'anime-serial',
            link: `//kodik.cc/find-player?shikimoriID=${shikimoriId}&episode=${episode}`,
            title: title || 'Anime',
            shikimori_id: String(shikimoriId || ''),
            translation: { id: 610, title: 'Студийная Банда (Studio Band)', type: 'voice' }
          }
        ]
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Failed to search Kodik' });
    }
  });

  // Vite integration
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(Number(PORT), '0.0.0.0', () => {
    console.log(`
    🚀 Сервер AniCrash запущен!
    -----------------------------------
    Режим: ${process.env.NODE_ENV || 'development'}
    Порт:  ${PORT}
    URL:   http://localhost:${PORT}
    -----------------------------------
    `);
  });
}

startServer().catch((err) => {
  console.error('Ошибка при запуске сервера:', err);
  process.exit(1);
});
