# Supabase Edge Functions

## Установка Supabase CLI

```bash
# Windows (через Scoop)
scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
scoop install supabase

# macOS (через Homebrew)
brew install supabase/tap/supabase

# Linux
brew install supabase/tap/supabase
```

## Авторизация

```bash
supabase login
```

## Деплой функций

### Деплой всех функций
```bash
supabase functions deploy
```

### Деплой конкретной функции
```bash
supabase functions deploy reset-daily-tasks
supabase functions deploy grant-reward
```

## Настройка переменных окружения

В Supabase Dashboard → Edge Functions → Settings добавьте:

```
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

## Настройка Cron Jobs

Для автоматического сброса ежедневных заданий нужно настроить pg_cron в Supabase.

1. Перейдите в Supabase Dashboard → Database → Extensions
2. Включите расширение `pg_cron`
3. Выполните SQL:

```sql
-- Создаем расписание для сброса ежедневных заданий (каждый день в полночь UTC)
SELECT cron.schedule(
  'reset-daily-tasks',
  '0 0 * * *', -- Каждый день в 00:00 UTC
  $$
  SELECT
    net.http_post(
      url:='https://your-project-ref.supabase.co/functions/v1/reset-daily-tasks',
      headers:='{"Content-Type": "application/json", "Authorization": "Bearer YOUR_SERVICE_ROLE_KEY"}'::jsonb
    ) as request_id;
  $$
);

-- Проверить расписание
SELECT * FROM cron.job;
```

**ВАЖНО:** Замените:
- `your-project-ref` на ваш project reference
- `YOUR_SERVICE_ROLE_KEY` на ваш service role key (из Settings → API)

## Локальная разработка

### Запуск локально

```bash
# Запуск локального Supabase
supabase start

# Запуск конкретной функции локально
supabase functions serve reset-daily-tasks --env-file ./supabase/.env.local

# Запуск всех функций
supabase functions serve
```

### Тестирование локально

```bash
# Тест функции сброса ежедневных заданий
curl -i --location --request POST 'http://localhost:54321/functions/v1/reset-daily-tasks' \
  --header 'Authorization: Bearer YOUR_ANON_KEY' \
  --header 'Content-Type: application/json'

# Тест функции начисления наград
curl -i --location --request POST 'http://localhost:54321/functions/v1/grant-reward' \
  --header 'Authorization: Bearer YOUR_USER_JWT_TOKEN' \
  --header 'Content-Type: application/json' \
  --data '{"action_type":"task","difficulty":"medium","attribute":"strength","item_id":"task-uuid"}'
```

## Описание функций

### reset-daily-tasks
**Назначение:** Автоматический сброс ежедневных заданий в полночь

**Когда вызывается:** По расписанию (cron) каждый день в 00:00 UTC

**Что делает:**
- Сбрасывает `completed_today` для всех заданий
- Обнуляет `streak` для заданий, пропущенных вчера

**Требуемые права:** Service Role Key (автоматически через cron)

### grant-reward
**Назначение:** Безопасное начисление наград за выполнение заданий

**Когда вызывается:** С клиента при выполнении задания

**Параметры:**
```typescript
{
  action_type: 'habit' | 'daily' | 'task',
  difficulty?: 'easy' | 'medium' | 'hard' | 'positive' | 'negative',
  attribute: 'strength' | 'health' | 'intelligence' | 'creativity' | 'discipline',
  streak?: number,
  item_id?: string // для валидации
}
```

**Что делает:**
- Валидирует, что задание принадлежит пользователю
- Рассчитывает XP и золото согласно конфигу
- Обновляет персонажа (XP, золото, уровень, атрибуты)
- Проверяет повышение уровня
- Начисляет атрибуты за серии (каждые 3 дня)

**Требуемые права:** User JWT Token

**Возвращает:**
```typescript
{
  xp_gained: number,
  gold_gained: number,
  attribute_gained?: number,
  level_up?: boolean,
  new_level?: number
}
```

## Мониторинг

Логи функций доступны в Supabase Dashboard → Edge Functions → Logs

## Troubleshooting

### Функция не запускается по расписанию
- Проверьте, что pg_cron включен
- Проверьте расписание: `SELECT * FROM cron.job;`
- Проверьте логи: `SELECT * FROM cron.job_run_details ORDER BY start_time DESC LIMIT 10;`

### Ошибка авторизации
- Убедитесь, что передаете правильный токен
- Для reset-daily-tasks используйте Service Role Key
- Для grant-reward используйте User JWT Token

### Функция возвращает 500
- Проверьте логи в Dashboard
- Проверьте, что все переменные окружения установлены
- Убедитесь, что JSON конфиги доступны
