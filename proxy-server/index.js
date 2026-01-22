const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');

const app = express();
const PORT = process.env.PORT || 3001;

// Supabase configuration
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://vrfabgvwrracgeirmptm.supabase.co';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Enable CORS for all origins (в production можно ограничить)
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Life RPG Proxy is running' });
});

// Proxy для Edge Functions
app.all('/functions/v1/:functionName', async (req, res) => {
  const { functionName } = req.params;
  const targetUrl = `${SUPABASE_URL}/functions/v1/${functionName}`;

  try {
    // Получаем токен из заголовка Authorization
    const authHeader = req.headers.authorization;

    // Определяем какой ключ использовать
    let supabaseKey = SUPABASE_ANON_KEY;

    // Если функция требует service_role (например reset-daily-tasks)
    if (functionName === 'reset-daily-tasks') {
      supabaseKey = SUPABASE_SERVICE_ROLE_KEY;
    }

    const headers = {
      'Content-Type': 'application/json',
      'apikey': supabaseKey,
    };

    // Передаем Authorization если есть (для grant-reward)
    if (authHeader) {
      headers['Authorization'] = authHeader;
    }

    console.log(`Proxying ${req.method} request to ${targetUrl}`);

    const response = await fetch(targetUrl, {
      method: req.method,
      headers: headers,
      body: req.method !== 'GET' && req.method !== 'HEAD' ? JSON.stringify(req.body) : undefined,
    });

    const data = await response.text();

    // Передаем статус и заголовки от Supabase
    res.status(response.status);

    // Копируем важные заголовки
    ['content-type'].forEach(header => {
      const value = response.headers.get(header);
      if (value) res.setHeader(header, value);
    });

    res.send(data);
  } catch (error) {
    console.error('Proxy error:', error);
    res.status(500).json({
      error: 'Proxy error',
      message: error.message
    });
  }
});

// Proxy для REST API (для авторизации и базы данных)
app.all('/rest/v1/*', async (req, res) => {
  const path = req.path.replace('/rest/v1', '');
  const targetUrl = `${SUPABASE_URL}/rest/v1${path}${req.url.includes('?') ? req.url.substring(req.url.indexOf('?')) : ''}`;

  try {
    const authHeader = req.headers.authorization;

    const headers = {
      'Content-Type': 'application/json',
      'apikey': SUPABASE_ANON_KEY,
      'Prefer': req.headers.prefer || '',
    };

    if (authHeader) {
      headers['Authorization'] = authHeader;
    }

    console.log(`Proxying ${req.method} request to ${targetUrl}`);

    const response = await fetch(targetUrl, {
      method: req.method,
      headers: headers,
      body: req.method !== 'GET' && req.method !== 'HEAD' ? JSON.stringify(req.body) : undefined,
    });

    const data = await response.text();

    res.status(response.status);

    ['content-type', 'content-range'].forEach(header => {
      const value = response.headers.get(header);
      if (value) res.setHeader(header, value);
    });

    res.send(data);
  } catch (error) {
    console.error('Proxy error:', error);
    res.status(500).json({
      error: 'Proxy error',
      message: error.message
    });
  }
});

// Proxy для Auth API
app.all('/auth/v1/*', async (req, res) => {
  const path = req.path.replace('/auth/v1', '');
  const targetUrl = `${SUPABASE_URL}/auth/v1${path}${req.url.includes('?') ? req.url.substring(req.url.indexOf('?')) : ''}`;

  try {
    const headers = {
      'Content-Type': 'application/json',
      'apikey': SUPABASE_ANON_KEY,
    };

    if (req.headers.authorization) {
      headers['Authorization'] = req.headers.authorization;
    }

    console.log(`Proxying ${req.method} request to ${targetUrl}`);

    const response = await fetch(targetUrl, {
      method: req.method,
      headers: headers,
      body: req.method !== 'GET' && req.method !== 'HEAD' ? JSON.stringify(req.body) : undefined,
    });

    const data = await response.text();

    res.status(response.status);

    ['content-type', 'set-cookie'].forEach(header => {
      const value = response.headers.get(header);
      if (value) res.setHeader(header, value);
    });

    res.send(data);
  } catch (error) {
    console.error('Proxy error:', error);
    res.status(500).json({
      error: 'Proxy error',
      message: error.message
    });
  }
});

app.listen(PORT, () => {
  console.log(`Proxy server is running on port ${PORT}`);
  console.log(`Proxying requests to: ${SUPABASE_URL}`);
});
