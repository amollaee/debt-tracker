// src/app/_layout.tsx
import { DataProvider } from '@/contexts/DataContext';
import { Stack } from 'expo-router';
import { I18nManager } from 'react-native';

// اعمال راست‌چینی سراسری
I18nManager.allowRTL(true);
I18nManager.forceRTL(true);

export default function RootLayout() {
  return (
    <DataProvider>
      <Stack>
        <Stack.Screen name="index" options={{ title: 'لیست اشخاص', headerTitleAlign: 'center' }} />
        <Stack.Screen name="person/[id]" options={{ title: 'جزئیات شخص', headerTitleAlign: 'center' }} />
      </Stack>
    </DataProvider>
  );
}