-- Life RPG Database Schema
-- Создание таблиц для серверного хранения данных персонажей

-- 1. Таблица персонажей (characters)
-- Хранит данные персонажа для мультиплеера и синхронизации
CREATE TABLE IF NOT EXISTS public.characters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,

  -- Основные характеристики
  level INTEGER NOT NULL DEFAULT 1,
  xp INTEGER NOT NULL DEFAULT 0,
  hp INTEGER NOT NULL DEFAULT 100,
  max_hp INTEGER NOT NULL DEFAULT 100,

  -- Валюта
  gold INTEGER NOT NULL DEFAULT 0,
  gems INTEGER NOT NULL DEFAULT 0,

  -- Атрибуты персонажа
  strength INTEGER NOT NULL DEFAULT 1,
  health INTEGER NOT NULL DEFAULT 1,
  intelligence INTEGER NOT NULL DEFAULT 1,
  creativity INTEGER NOT NULL DEFAULT 1,
  discipline INTEGER NOT NULL DEFAULT 1,

  -- Стрики атрибутов (для синхронизации прокачки)
  attribute_streaks JSONB DEFAULT '{
    "strength": 0,
    "health": 0,
    "intelligence": 0,
    "creativity": 0,
    "discipline": 0
  }'::jsonb,

  -- Метаданные
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Один персонаж на пользователя
  CONSTRAINT unique_user_character UNIQUE (user_id)
);

-- 2. Row Level Security (RLS)
-- Включаем RLS для безопасности
ALTER TABLE public.characters ENABLE ROW LEVEL SECURITY;

-- Политика: пользователь может видеть только своего персонажа
CREATE POLICY "Users can view own character"
  ON public.characters
  FOR SELECT
  USING (auth.uid() = user_id);

-- Политика: пользователь может создавать только своего персонажа
CREATE POLICY "Users can create own character"
  ON public.characters
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Политика: пользователь может обновлять только своего персонажа
CREATE POLICY "Users can update own character"
  ON public.characters
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Политика: пользователь может удалять только своего персонажа
CREATE POLICY "Users can delete own character"
  ON public.characters
  FOR DELETE
  USING (auth.uid() = user_id);

-- 3. Функция для автоматического обновления updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. Триггер для автоматического обновления updated_at
CREATE TRIGGER characters_updated_at
  BEFORE UPDATE ON public.characters
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- 5. Индексы для оптимизации запросов
CREATE INDEX IF NOT EXISTS idx_characters_user_id ON public.characters(user_id);
CREATE INDEX IF NOT EXISTS idx_characters_level ON public.characters(level);

-- 6. Комментарии к таблице
COMMENT ON TABLE public.characters IS 'Персонажи игроков для мультиплеера и синхронизации';
COMMENT ON COLUMN public.characters.attribute_streaks IS 'JSON с текущими стриками атрибутов для синхронизации прокачки';
