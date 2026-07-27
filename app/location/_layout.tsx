import { Stack } from "expo-router";

export default function LocationLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="city-picker" />
      <Stack.Screen name="venue-picker" />
      <Stack.Screen name="add-venue" />
    </Stack>
  );
}
