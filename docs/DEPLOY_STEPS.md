# Пошаговая инструкция по деплою Edge Functions

## Что нужно сделать

1. ✅ **Установить Supabase CLI** - Уже сделано (установлен локально через npm)
2. ⏳ **Получить Access Token из Supabase**
3. ⏳ **Задеплоить функции**
4. ⏳ **Настроить переменные окружения**
5. ⏳ **Настроить cron job для автосброса**

---

## Шаг 1: Получить Access Token

1. Открой https://supabase.com/dashboard/account/tokens
2. Нажми "Generate new token"
3. Дай токену имя (например, "CLI Token")
4. Скопируй токен (он показывается только один раз!)

## Шаг 2: Установить токен

В терминале (в папке проекта) выполни:

```bash
# Windows (PowerShell)
$env:SUPABASE_ACCESS_TOKEN="твой_токен_здесь"

# Или создай файл .env.local в корне проекта:
echo "SUPABASE_ACCESS_TOKEN=твой_токен_здесь" > .env.local
```

## Шаг 3: Связать проект

Найди твой Project Reference ID:
- Открой https://supabase.com/dashboard
- Выбери свой проект
- Settings → General → Reference ID

Затем выполни:

```bash
npx supabase link --project-ref твой-project-ref
```

## Шаг 4: Задеплоить функции

```bash
# Деплой всех функций сразу
npx supabase functions deploy

# Или по отдельности:
npx supabase functions deploy reset-daily-tasks
npx supabase functions deploy grant-reward
```

Если появляется ошибка с импортом JSON, нужно обновить файлы функций - они должны использовать относительные пути к JSON конфигам.

## Шаг 5: Настроить переменные окружения

1. Открой Supabase Dashboard → Edge Functions → Settings
2. Добавь следующие переменные:

```
SUPABASE_URL=https://твой-project-ref.supabase.co
SUPABASE_ANON_KEY=твой_anon_key
SUPABASE_SERVICE_ROLE_KEY=твой_service_role_key
```

Где взять ключи:
- Открой Supabase Dashboard → Settings → API
- SUPABASE_URL: Project URL
- SUPABASE_ANON_KEY: anon / public key
- SUPABASE_SERVICE_ROLE_KEY: service_role key (секретный!)

## Шаг 6: Настроить Cron Job для автосброса

### 6.1. Включить pg_cron

1. Открой Supabase Dashboard → Database → Extensions
2. Найди `pg_cron` и включи его

### 6.2. Создать расписание

1. Открой Supabase Dashboard → SQL Editor
2. Вставь следующий SQL (замени `твой-project-ref` и `твой_service_role_key`):

```sql
-- Создаем расписание для сброса ежедневных заданий
-- Запускается каждый день в 00:00 UTC (03:00 по МСК)
SELECT cron.schedule(
  'reset-daily-tasks',
  '0 0 * * *',
  $$
  SELECT
    net.http_post(
      url:='https://твой-project-ref.supabase.co/functions/v1/reset-daily-tasks',
      headers:='{"Content-Type": "application/json", "Authorization": "Bearer твой_service_role_key"}'::jsonb
    ) as request_id;
  $$
);
```

3. Выполни SQL (нажми Run)

### 6.3. Проверить расписание

```sql
-- Посмотреть все задания cron
SELECT * FROM cron.job;

-- Посмотреть историю выполнения
SELECT * FROM cron.job_run_details
ORDER BY start_time DESC
LIMIT 10;
```

## Шаг 7: Протестировать функции

### Тест 1: Проверить grant-reward вручную

1. Открой приложение
2. Выполни любое задание/привычку
3. Проверь консоль браузера - должен быть лог "Reward granted: ..."
4. Проверь, что XP и золото увеличились

### Тест 2: Проверить reset-daily-tasks вручную

Вызови функцию напрямую через curl:

```bash
curl -X POST \
  'https://твой-project-ref.supabase.co/functions/v1/reset-daily-tasks' \
  -H 'Authorization: Bearer твой_service_role_key' \
  -H 'Content-Type: application/json'
```

Должен вернуться ответ:
```json
{
  "success": true,
  "reset_count": X,
  "streak_reset_count": Y,
  "date": "2026-01-22"
}
```

### Тест 3: Проверить логи функций

1. Открой Supabase Dashboard → Edge Functions
2. Выбери функцию (grant-reward или reset-daily-tasks)
3. Перейди на вкладку "Logs"
4. Проверь, что нет ошибок

---

## Troubleshooting

### Ошибка: "Cannot find module"

Проблема: Edge Functions не могут импортировать JSON конфиги из `constants/generated/`.

**Решение:** Нужно либо скопировать конфиги в `supabase/functions/_shared/`, либо использовать hardcoded значения.

Создай файл `supabase/functions/_shared/rewards.json`:

```json
{
  "XP_REWARDS": {
    "habit_positive": 10,
    "habit_negative": -5,
    "daily_base": 15,
    "daily_streak_bonus": 5,
    "task_easy": 10,
    "task_medium": 20,
    "task_hard": 40
  },
  "GOLD_REWARDS": {
    "habit_positive": 2,
    "daily_base": 3,
    "daily_streak_bonus": 1,
    "task_easy": 5,
    "task_medium": 10,
    "task_hard": 20
  }
}
```

И обнови импорты в `gameConfig.ts`.

### Ошибка: "Unauthorized"

- Проверь, что передается правильный токен
- Для grant-reward - user JWT token (из session)
- Для reset-daily-tasks - service role key

### Ошибка: "Function not found"

- Проверь, что функция задеплоена: `npx supabase functions list`
- Задеплой снова: `npx supabase functions deploy grant-reward`

### Cron job не работает

1. Проверь, что pg_cron включен:
```sql
SELECT * FROM pg_extension WHERE extname = 'pg_cron';
```

2. Проверь расписание:
```sql
SELECT * FROM cron.job;
```

3. Проверь логи последнего запуска:
```sql
SELECT *
FROM cron.job_run_details
WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'reset-daily-tasks')
ORDER BY start_time DESC
LIMIT 5;
```

---

## Что дальше?

После успешного деплоя:

1. ✅ Функции защищают от читерства
2. ✅ Ежедневные задания автоматически сбрасываются
3. ✅ XP и золото начисляются через сервер

Можно переходить к:
- Добавлению системы монстров
- Созданию магазина
- Настройке push-уведомлений
