import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { DarkColors, Spacing } from '@/constants/tokens';
import { SafeScreen } from '@/components/SafeScreen';
import { Typography } from '@/components/Typography';
import { DionButton } from '@/components/DionButton';
import { Spacer } from '@/components/Spacer';
import { getHome } from '@/services/api';
import { useChildStore } from '@/store/index';

export default function PersonalizedHomeScreen() {
  const [loading, setLoading] = useState(true);
  const [greeting, setGreeting] = useState('');
  const activeChild = useChildStore((s) => s.activeChild);

  useEffect(() => {
    if (!activeChild) {
      setLoading(false);
      return;
    }
    getHome(activeChild.id)
      .then((content) => setGreeting(content.contextual_greeting))
      .catch(() => setGreeting(`Welcome, ${activeChild.name}.`))
      .finally(() => setLoading(false));
  }, [activeChild]);

  return (
    <SafeScreen dark>
      <View style={styles.container}>
        <Spacer size="xxl" />
        {loading ? (
          <ActivityIndicator color={DarkColors.accent} size="large" />
        ) : (
          <>
            <Typography variant="body" color={DarkColors.textMuted}>
              Dion says:
            </Typography>
            <Spacer size="sm" />
            <Typography variant="subheading" color={DarkColors.textPrimary}>
              {greeting}
            </Typography>
          </>
        )}

        <Spacer size="xxxl" />
        <Typography variant="body" color={DarkColors.textSecondary}>
          Dion is ready. It will surface what matters — quietly, when it counts.
        </Typography>

        <Spacer size="xl" />
        <DionButton
          label="Go to home"
          variant="olive"
          dark
          fullWidth
          onPress={() => router.replace('/(tabs)/home')}
        />
        <Spacer size="md" />
      </View>
    </SafeScreen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
