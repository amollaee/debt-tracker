// app/_layout.tsx
import { DataProvider } from '@/contexts/DataContext';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { I18nManager } from 'react-native';

I18nManager.allowRTL(true);
I18nManager.forceRTL(true);

export default function RootLayout() {
  return (
    <>
      <StatusBar style="light" backgroundColor="#1e293b" translucent={false} />
      <DataProvider>
        <Stack
          screenOptions={{
            headerStyle: { backgroundColor: '#1e293b' },
            headerTintColor: '#ffffff',
            headerTitleStyle: { fontWeight: 'bold', fontSize: 18 },
            headerTitleAlign: 'center',
            contentStyle: { backgroundColor: '#f8f9fa' },
          }}
        >
          <Stack.Screen name="index" options={{ title: 'لیست اشخاص' }} />
          <Stack.Screen name="persons/[id]" options={{ title: 'جزئیات شخص' }} />
        </Stack>
      </DataProvider>
    </>
  );
}