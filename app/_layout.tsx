import FontAwesome from '@expo/vector-icons/FontAwesome';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from 'react';
import 'react-native-reanimated';
import 'react-native-gesture-handler';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { useColorScheme } from '@/components/useColorScheme';
import { useDailyResetStore } from '@/store';
import { AuthScreen } from '@/components/AuthScreen';
import { supabase } from '@/lib/supabase';
import { useCharacterStore } from '@/store/characterStore';

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary,
} from 'expo-router';

export const unstable_settings = {
  // Ensure that reloading on `/modal` keeps a back button present.
  initialRouteName: '(tabs)',
};

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
    ...FontAwesome.font,
  });

  // Expo Router uses Error Boundaries to catch errors in the navigation tree.
  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return <RootLayoutNav />;
}

function RootLayoutNav() {
  const { checkAndResetIfNeeded } = useDailyResetStore();
  const { loadFromServer } = useCharacterStore();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [shouldShowAuth, setShouldShowAuth] = useState(false);

  // Очистка старых битых данных и проверка сброса
  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Проверяем, была ли уже миграция
        const migrationKey = 'persist_migration_v2';
        const migrated = await AsyncStorage.getItem(migrationKey);

        if (!migrated) {
          console.log('Clearing old persisted data...');
          // Очищаем старые данные со сломанными функциями
          await AsyncStorage.multiRemove([
            'habits-storage_v1',
            'tasks-storage_v1',
            'dailies-storage_v1',
            'character-storage_v1',
          ]);
          // Помечаем, что миграция выполнена
          await AsyncStorage.setItem(migrationKey, 'true');
          console.log('Migration completed');
        }

        // Проверяем необходимость сброса
        checkAndResetIfNeeded();

        // Проверяем, пропускал ли пользователь авторизацию ранее
        const skippedAuth = await AsyncStorage.getItem('auth_skipped');

        // Проверяем авторизацию
        const { data: { session } } = await supabase.auth.getSession();

        if (session) {
          setIsAuthenticated(true);
          // Загружаем персонажа с сервера
          await loadFromServer();
        } else if (skippedAuth === 'true') {
          // Пользователь ранее пропустил авторизацию
          setIsAuthenticated(false);
          setShouldShowAuth(false);
        } else {
          // Показываем экран авторизации
          setIsAuthenticated(false);
          setShouldShowAuth(true);
        }
      } catch (error) {
        console.error('Error during app initialization:', error);
        setIsAuthenticated(false);
      }
    };

    initializeApp();
  }, []);

  // Подписка на изменения авторизации
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session) {
        setIsAuthenticated(true);
        setShouldShowAuth(false);
        await loadFromServer();
      } else {
        setIsAuthenticated(false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const handleAuthSuccess = async () => {
    setShouldShowAuth(false);
    // Если пользователь пропустил, сохраняем флаг
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      await AsyncStorage.setItem('auth_skipped', 'true');
    }
  };

  // Показываем загрузку пока проверяем авторизацию
  if (isAuthenticated === null) {
    return null;
  }

  // Показываем экран авторизации если нужно
  if (shouldShowAuth) {
    return <AuthScreen onAuthSuccess={handleAuthSuccess} />;
  }

  return (
    <ThemeProvider value={DarkTheme}>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
      </Stack>
    </ThemeProvider>
  );
}
