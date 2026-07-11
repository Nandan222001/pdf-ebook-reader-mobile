// app/_layout.tsx
// Root layout — initializes database, loads profile, sets up navigation

import { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView, ActivityIndicator, View, Text } from 'react-native';
import { useStore } from '../src/store/useStore';
import { initDatabase } from '../src/db/database';
import { bookRepo, profileRepo } from '../src/db/repositories';
import { getThemeColors } from '../src/lib/utils';
import '../src/global.css';

export default function RootLayout() {
  const [isReady, setIsReady] = useState(false);
  const { profile, setProfile, setBooks, setStats, theme, setTheme, refreshStats } = useStore();
  const colors = getThemeColors(theme);

  useEffect(() => {
    async function init() {
      try {
        await initDatabase();
        const userProfile = await profileRepo.get();
        setProfile(userProfile);
        setTheme(userProfile.preferences.theme);
        const books = await bookRepo.getAll();
        setBooks(books);
        await refreshStats();
      } catch (error) {
        console.error('Failed to initialize app:', error);
      } finally {
        setIsReady(true);
      }
    }
    init();
  }, []);

  if (!isReady) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={colors.accent} />
        <Text style={{ color: colors.muted, marginTop: 16, fontFamily: 'Georgia' }}>
          Loading your library...
        </Text>
        <StatusBar style="light" />
      </View>
    );
  }

  return (
    <>
      <StatusBar style={theme === 'dark' ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.bg },
          animation: 'slide_from_right',
        }}
      >
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="reader" />
      </Stack>
    </>
  );
}
