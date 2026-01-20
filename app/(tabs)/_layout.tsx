import React from 'react';
import { Tabs } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';

function TabBarIcon(props: {
  name: React.ComponentProps<typeof MaterialCommunityIcons>['name'];
  color: string;
}) {
  return <MaterialCommunityIcons size={26} style={{ marginBottom: -3 }} {...props} />;
}

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
        tabBarStyle: {
          height: 60 + insets.bottom,
          paddingBottom: 8 + insets.bottom,
          paddingTop: 8,
        },
        headerStyle: {
          backgroundColor: Colors[colorScheme ?? 'light'].background,
        },
        headerTintColor: Colors[colorScheme ?? 'light'].text,
      }}
    >
      <Tabs.Screen
        name="habits"
        options={{
          title: 'Привычки',
          tabBarIcon: ({ color }) => <TabBarIcon name="checkbox-marked-circle-outline" color={color} />,
        }}
      />
      <Tabs.Screen
        name="dailies"
        options={{
          title: 'Ежедневные',
          tabBarIcon: ({ color }) => <TabBarIcon name="calendar-check" color={color} />,
        }}
      />
      <Tabs.Screen
        name="index"
        options={{
          title: 'Персонаж',
          tabBarIcon: ({ color }) => <TabBarIcon name="sword-cross" color={color} />,
        }}
      />
      <Tabs.Screen
        name="tasks"
        options={{
          title: 'Задачи',
          tabBarIcon: ({ color }) => <TabBarIcon name="format-list-checks" color={color} />,
        }}
      />
    </Tabs>
  );
}
