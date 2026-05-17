import { Stack } from 'expo-router';

export default function AppLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="trip" />
      <Stack.Screen name="mileage" />
      <Stack.Screen
        name="incident"
        options={{
          presentation: 'transparentModal',
          animation: 'slide_from_bottom',
        }}
      />
    </Stack>
  );
}
