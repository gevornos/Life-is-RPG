# Настройка Production окружения

## ✅ Что уже сделано:

1. **Edge Functions задеплоены:**
   - `reset-daily-tasks` ✅
   - `grant-reward` ✅

   Проверить можно здесь: https://supabase.com/dashboard/project/vrfabgvwrracgeirmptm/functions

---

## 📝 Что нужно сделать:

### Шаг 1: Настроить переменные окружения

1. Открой https://supabase.com/dashboard/project/vrfabgvwrracgeirmptm/settings/functions
2. Перейди в раздел "Environment Variables"
3. Добавь следующие переменные:

```
SUPABASE_URL=https://vrfabgvwrracgeirmptm.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZyZmFiZ3Z3cnJhY2dlaXJtcHRtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkwMDQ2ODcsImV4cCI6MjA4NDU4MDY4N30.JjsQUvfMWhdtXXANdn-LIpDRB6oj5BAVgg-LlteJT64
```

**ВАЖНО:** Также нужно добавить `SUPABASE_SERVICE_ROLE_KEY`. Его можно найти здесь:
- Открой https://supabase.com/dashboard/project/vrfabgvwrracgeirmptm/settings/api
- Скопируй "service_role" key (секретный!)
- Добавь как переменную окружения:
```
SUPABASE_SERVICE_ROLE_KEY=твой_service_role_key_здесь
```

---

### Шаг 2: Включить pg_cron

1. Открой https://supabase.com/dashboard/project/vrfabgvwrracgeirmptm/database/extensions
2. Найди расширение `pg_cron`
3. Включи его (кнопка Enable)

---

### Шаг 3: Настроить автоматический сброс ежедневных заданий

1. Открой https://supabase.com/dashboard/project/vrfabgvwrracgeirmptm/sql/new
2. Вставь следующий SQL (НЕ ЗАБУДЬ заменить `YOUR_SERVICE_ROLE_KEY`):

```sql
-- Создаем расписание для автоматического сброса ежедневных заданий
-- Запускается каждый день в 00:00 UTC (03:00 по МСК)
SELECT cron.schedule(
  'reset-daily-tasks',           -- Название задания
  '0 0 * * *',                   -- Каждый день в полночь UTC
  $$
  SELECT
    net.http_post(
      url:='https://vrfabgvwrracgeirmptm.supabase.co/functions/v1/reset-daily-tasks',
      headers:='{"Content-Type": "application/json", "Authorization": "Bearer YOUR_SERVICE_ROLE_KEY"}'::jsonb
    ) as request_id;
  $$
);
```

**ВАЖНО:** Замени `YOUR_SERVICE_ROLE_KEY` на твой service_role key из Settings → API!

3. Нажми "Run" чтобы выполнить SQL

---

### Шаг 4: Проверить что cron job создан

Выполни этот SQL:

```sql
-- Посмотреть все задания cron
SELECT
  jobid,
  jobname,
  schedule,
  active,
  command
FROM cron.job;
```

Должна появиться запись с `jobname = 'reset-daily-tasks'`

---

### Шаг 5: Протестировать функцию grant-reward

1. Открой приложение
2. Выполни любое задание/привычку
3. Проверь логи в консоли - должен быть лог "Reward granted: ..."
4. Проверь, что XP и золото увеличились
5. Проверь логи функции:
   - Открой https://supabase.com/dashboard/project/vrfabgvwrracgeirmptm/functions/grant-reward/logs
   - Должны быть записи без ошибок

---

### Шаг 6: Протестировать функцию reset-daily-tasks вручную

Можно вызвать её вручную для теста. Выполни в терминале (замени YOUR_SERVICE_ROLE_KEY):

```bash
curl -X POST \
  'https://vrfabgvwrracgeirmptm.supabase.co/functions/v1/reset-daily-tasks' \
  -H 'Authorization: Bearer YOUR_SERVICE_ROLE_KEY' \
  -H 'Content-Type: application/json'
```

Должен вернуться ответ:
```json
{
  "success": true,
  "reset_count": 0,
  "streak_reset_count": 0,
  "date": "2026-01-22"
}
```

Или проверь логи:
https://supabase.com/dashboard/project/vrfabgvwrracgeirmptm/functions/reset-daily-tasks/logs

---

### Шаг 7: Проверить историю выполнения cron

Через день после настройки, проверь что cron job выполнился:

```sql
-- Посмотреть последние 10 запусков
SELECT
  runid,
  jobid,
  job_pid,
  database,
  username,
  command,
  status,
  return_message,
  start_time,
  end_time
FROM cron.job_run_details
WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'reset-daily-tasks')
ORDER BY start_time DESC
LIMIT 10;
```

---

## 🎉 Готово!

После выполнения всех шагов:

✅ Функции задеплоены и работают
✅ Переменные окружения настроены
✅ Cron job настроен для автосброса
✅ Награды начисляются через защищенный сервер
✅ Ежедневные задания автоматически сбрасываются в полночь

---

## 📊 Мониторинг

**Логи функций:**
- grant-reward: https://supabase.com/dashboard/project/vrfabgvwrracgeirmptm/functions/grant-reward/logs
- reset-daily-tasks: https://supabase.com/dashboard/project/vrfabgvwrracgeirmptm/functions/reset-daily-tasks/logs

**База данных:**
- Extensions: https://supabase.com/dashboard/project/vrfabgvwrracgeirmptm/database/extensions
- SQL Editor: https://supabase.com/dashboard/project/vrfabgvwrracgeirmptm/sql/new

---

## 🐛 Troubleshooting

### Ошибка "Unauthorized" в grant-reward
- Убедись, что пользователь авторизован в приложении
- Проверь, что передается токен из session

### Ошибка "Function not found"
- Проверь что функция задеплоена: https://supabase.com/dashboard/project/vrfabgvwrracgeirmptm/functions
- Перезадеплой: `npx supabase functions deploy grant-reward`

### Cron job не работает
- Проверь что pg_cron включен
- Проверь логи: `SELECT * FROM cron.job_run_details ORDER BY start_time DESC LIMIT 10;`
- Проверь что service_role_key правильный

### Награды не начисляются
- Проверь логи grant-reward в Dashboard
- Проверь console.log в приложении
- Проверь что переменные окружения установлены
