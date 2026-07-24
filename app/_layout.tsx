import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Colors } from '@/constants/theme';
import { PlayersProvider } from '@/context/PlayersContext';

export default function RootLayout() {
  return (
    <PlayersProvider>
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: Colors.cream },
          headerShadowVisible: false,
          headerTintColor: Colors.ink,
          headerTitle: '',
          contentStyle: { backgroundColor: Colors.cream },
        }}
      >
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="ledger" options={{ headerShown: false }} />
        <Stack.Screen name="(game)" options={{ headerShown: false }} />
        <Stack.Screen
          name="gamedetail"
          options={{
            headerShown: true,
            title: 'Game Summary',
            headerStyle: { backgroundColor: Colors.paper },
            headerTintColor: Colors.ink,
            headerShadowVisible: false,
          }}
        />
        <Stack.Screen name="endnight" options={{ headerShown: false }} />
      </Stack>
      <StatusBar style="dark" backgroundColor={Colors.cream} />
    </PlayersProvider>
  );
}
