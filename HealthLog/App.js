import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { initDatabase } from './src/db/database';
import useStore from './src/store/useStore';
import AppNavigator from './src/navigation/AppNavigator';
import { colors } from './src/constants/theme';

export default function App() {
  const [ready, setReady] = useState(false);
  const loadSettings = useStore(s => s.loadSettings);

  useEffect(() => {
    (async () => {
      await initDatabase();
      await loadSettings();
      setReady(true);
    })();
  }, []);

  if (!ready) {
    return (
      <View style={styles.splash}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AppNavigator />
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  splash: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
