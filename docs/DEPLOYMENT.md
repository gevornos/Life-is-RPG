# Инструкция по деплою Edge Functions

## Что мы сделали

Реализованы серверные функции для защиты от читерства и автоматизации игровой логики:

1. **reset-daily-tasks** - автоматический сброс ежедневных заданий в полночь
2. **grant-reward** - защищенное начисление XP и золота за выполнение заданий

## Шаги для деплоя

### 1. Установка Supabase CLI

**Windows (через Scoop):**
```bash
scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
scoop install supabase
```

**macOS (через Homebrew):**
```bash
brew install supabase/tap/supabase
```

### 2. Авторизация в Supabase

```bash
supabase login
```

Это откроет браузер для авторизации. Войдите с вашим аккаунтом Supabase.

### 3. Связь с проектом

```bash
supabase link --project-ref your-project-ref
```

Найти `project-ref` можно в Supabase Dashboard → Settings → General → Reference ID

### 4. Деплой функций

```bash
cd "d:\Code\Life if RPG\Life-is-RPG"
supabase functions deploy reset-daily-tasks
supabase functions deploy grant-reward
```

Или задеплоить все сразу:
```bash
supabase functions deploy
```

### 5. Настройка переменных окружения

Перейдите в Supabase Dashboard → Edge Functions → Settings и добавьте:

```
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_ANON_KEY=ваш_anon_key
SUPABASE_SERVICE_ROLE_KEY=ваш_service_role_key
```

Найти ключи: Supabase Dashboard → Settings → API

### 6. Настройка автоматического сброса (Cron Job)

1. Перейдите в Supabase Dashboard → Database → Extensions
2. Включите расширение `pg_cron`
3. Перейдите в SQL Editor и выполните:

```sql
-- Создаем расписание для сброса ежедневных заданий (каждый день в полночь UTC)
SELECT cron.schedule(
  'reset-daily-tasks',
  '0 0 * * *', -- Каждый день в 00:00 UTC (03:00 по МСК)
  $$
  SELECT
    net.http_post(
      url:='https://ваш-project-ref.supabase.co/functions/v1/reset-daily-tasks',
      headers:='{"Content-Type": "application/json", "Authorization": "Bearer ВАШ_SERVICE_ROLE_KEY"}'::jsonb
    ) as request_id;
  $$
);
```

**ВАЖНО:** Замените:
- `ваш-project-ref` на ваш project reference ID
- `ВАШ_SERVICE_ROLE_KEY` на ваш service role key

4. Проверьте, что расписание создано:
```sql
SELECT * FROM cron.job;
```

### 7. Проверка работы

**Проверить функцию grant-reward:**
1. Откройте приложение
2. Выполните любую задачу/привычку
3. Проверьте, что XP и золото начислились
4. Проверьте логи в Dashboard → Edge Functions → grant-reward → Logs

**Проверить функцию reset-daily-tasks:**
1. Дождитесь полуночи UTC (или вызовите вручную)
2. Проверьте, что `completed_today` сбросилось для всех ежедневных заданий
3. Проверьте логи в Dashboard → Edge Functions → reset-daily-tasks → Logs

**Вызвать reset-daily-tasks вручную (для теста):**
```bash
curl -i --location --request POST \
  'https://ваш-project-ref.supabase.co/functions/v1/reset-daily-tasks' \
  --header 'Authorization: Bearer ВАШ_SERVICE_ROLE_KEY' \
  --header 'Content-Type: application/json'
```

## Что изменилось в коде

### Защита от читерства

Раньше награды начислялись прямо на клиенте:
```typescript
// ❌ Старый код - можно обмануть
characterStore.addXP(100);
characterStore.addGold(10);
```

Теперь все награды начисляются через серверную функцию:
```typescript
// ✅ Новый код - защищено на сервере
const reward = await rewardsService.grantHabitReward(habitId, true, 'strength');
await characterStore.loadFromServer(); // Обновляем с сервера
```

### Автоматический сброс ежедневных

Раньше ежедневные задания сбрасывались только когда пользователь открывал приложение.

Теперь они автоматически сбрасываются каждый день в полночь через cron job.

## Troubleshooting

### Ошибка "Function not found"
- Проверьте, что функции задеплоены: `supabase functions list`
- Задеплойте снова: `supabase functions deploy grant-reward`

### Ошибка "Unauthorized" в grant-reward
- Убедитесь, что передается токен пользователя
- Проверьте, что пользователь авторизован

### Cron job не работает
- Проверьте расписание: `SELECT * FROM cron.job;`
- Проверьте логи: `SELECT * FROM cron.job_run_details ORDER BY start_time DESC LIMIT 10;`
- Убедитесь, что pg_cron включен в Extensions

### Награды не начисляются
- Проверьте логи функции в Dashboard
- Убедитесь, что переменные окружения установлены
- Проверьте, что JSON конфиги (xp-rewards.json, level-progression.json) доступны

## Мониторинг

Логи всех функций доступны в:
- Supabase Dashboard → Edge Functions → [имя функции] → Logs

Там можно увидеть:
- Успешные вызовы
- Ошибки
- Время выполнения
- Параметры запросов

## Следующие шаги

После успешного деплоя можно:
1. Добавить функцию для появления монстров за пропущенные задания
2. Добавить функцию для начисления штрафов за неактивность
3. Настроить push-уведомления
4. Добавить систему магазина с серверной валидацией покупок
