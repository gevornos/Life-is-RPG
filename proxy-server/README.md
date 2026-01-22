# Life RPG Proxy Server

Proxy server для доступа к Supabase из России.

## Зачем нужен?

Supabase заблокирован в России. Этот proxy позволяет приложению обращаться к Supabase через промежуточный сервер, развернутый на Vercel.

## Как работает?

```
Приложение (РФ) → Proxy (Vercel) → Supabase
```

## Деплой на Vercel

### Шаг 1: Установить Vercel CLI

```bash
npm install -g vercel
```

### Шаг 2: Логин

```bash
vercel login
```

### Шаг 3: Деплой

```bash
cd proxy-server
vercel
```

При первом деплое Vercel спросит:
- **Set up and deploy?** → Yes
- **Which scope?** → Выбери свой аккаунт
- **Link to existing project?** → No
- **What's your project's name?** → life-rpg-proxy (или любое другое)
- **In which directory is your code located?** → ./

### Шаг 4: Настроить переменные окружения

После деплоя, добавь переменные окружения в Vercel Dashboard:

1. Открой https://vercel.com/dashboard
2. Найди проект `life-rpg-proxy`
3. Settings → Environment Variables
4. Добавь:
   - `SUPABASE_URL` = `https://vrfabgvwrracgeirmptm.supabase.co`
   - `SUPABASE_ANON_KEY` = `твой_anon_key`
   - `SUPABASE_SERVICE_ROLE_KEY` = `твой_service_role_key`

5. Redeploy проект:

```bash
vercel --prod
```

### Шаг 5: Получить URL

После деплоя Vercel выдаст URL типа:
```
https://life-rpg-proxy.vercel.app
```

Этот URL нужно будет использовать в приложении вместо прямого обращения к Supabase.

## Локальная разработка

```bash
cd proxy-server
npm install
npm run dev
```

Сервер запустится на http://localhost:3001

## Endpoints

- `GET /health` - проверка работоспособности
- `POST /functions/v1/:functionName` - proxy для Edge Functions
- `ALL /rest/v1/*` - proxy для REST API
- `ALL /auth/v1/*` - proxy для Auth API

## Использование в приложении

После деплоя обнови `lib/supabase.ts`:

```typescript
const PROXY_URL = "https://твой-proxy.vercel.app";
const SUPABASE_URL = PROXY_URL; // Вместо прямого URL Supabase
```

Все запросы будут автоматически проксироваться через Vercel.
