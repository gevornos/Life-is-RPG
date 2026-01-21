-- Функция для удаления текущего пользователя
-- Используется для debug/тестирования

CREATE OR REPLACE FUNCTION delete_own_account()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_user_id UUID;
BEGIN
  -- Получаем ID текущего пользователя
  current_user_id := auth.uid();

  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'User not authenticated';
  END IF;

  -- Удаляем персонажа (каскадно удалятся связанные данные благодаря ON DELETE CASCADE)
  DELETE FROM public.characters WHERE user_id = current_user_id;

  -- Удаляем самого пользователя из auth.users
  DELETE FROM auth.users WHERE id = current_user_id;
END;
$$;

-- Даем права на выполнение функции аутентифицированным пользователям
GRANT EXECUTE ON FUNCTION delete_own_account() TO authenticated;

COMMENT ON FUNCTION delete_own_account() IS 'Позволяет пользователю удалить свой собственный аккаунт и все связанные данные';
