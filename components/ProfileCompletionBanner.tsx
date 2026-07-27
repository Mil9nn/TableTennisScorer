import { useThemeColors } from '@/hooks/useThemeColors';
import { useAuthStore } from '@/hooks/useAuthStore';
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

export function ProfileCompletionBanner() {
  const theme = useThemeColors();
  const user = useAuthStore((s) => s.user);
  const [dismissed, setDismissed] = useState(false);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        banner: {
          marginHorizontal: theme.spacing[4],
          marginBottom: theme.spacing[3],
          padding: theme.spacing[4],
          borderRadius: theme.borderRadius.md,
          backgroundColor: theme.colors.primary[50],
          borderWidth: 1,
          borderColor: theme.colors.primary[200],
          flexDirection: 'row',
          alignItems: 'flex-start',
          gap: theme.spacing[3],
        },
        content: { flex: 1 },
        title: {
          fontSize: theme.typography.fontSize.lg,
          fontWeight: theme.typography.fontWeight.bold,
          color: theme.colors.primary[800],
          marginBottom: theme.spacing[1],
        },
        body: {
          fontSize: theme.typography.fontSize.sm,
          color: theme.colors.primary[700],
          lineHeight: theme.typography.fontSize.sm * 1.45,
        },
        actions: {
          flexDirection: 'row',
          gap: theme.spacing[4],
          marginTop: theme.spacing[3],
        },
        link: {
          fontSize: theme.typography.fontSize.sm,
          fontWeight: theme.typography.fontWeight.semibold,
          color: theme.colors.primary[600],
        },
        dismiss: {
          padding: theme.spacing[1],
        },
      }),
    [theme],
  );

  if (!user || user.isProfileComplete || dismissed) {
    return null;
  }

  return (
    <View style={styles.banner}>
      <View style={styles.content}>
        <Text style={styles.title}>Complete your profile</Text>
        <Text style={styles.body}>
          Add a few details so opponents and tournaments can find you.
        </Text>
        <View style={styles.actions}>
          <Pressable
            onPress={() => router.push('/complete-profile')}
            accessibilityRole="button"
            accessibilityLabel="Complete profile"
          >
            <Text style={styles.link}>Complete now</Text>
          </Pressable>
          <Pressable
            onPress={() => setDismissed(true)}
            accessibilityRole="button"
            accessibilityLabel="Dismiss profile reminder"
          >
            <Text style={[styles.link, { color: theme.colors.text.tertiary }]}>Not now</Text>
          </Pressable>
        </View>
      </View>
      <Pressable
        onPress={() => setDismissed(true)}
        style={styles.dismiss}
        accessibilityRole="button"
        accessibilityLabel="Dismiss"
        hitSlop={8}
      >
        <Feather name="x" size={18} color={theme.colors.text.tertiary} />
      </Pressable>
    </View>
  );
}
