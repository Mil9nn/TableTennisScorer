import { Stack } from "expo-router";

export default function TournamentsLayout() {
  return (
    <Stack>
      <Stack.Screen
        name="create"
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="join"
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="[id]"
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="[id]/custom-matching"
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="[id]/manage-groups"
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="[id]/manage-participants"
        options={{
          headerShown: false,
        }}
      />
    </Stack>
  );
}

