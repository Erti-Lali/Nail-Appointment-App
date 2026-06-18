import { Stack } from "expo-router";
import { Redirect } from "expo-router";
import { useAuth } from "../../lib/auth";

export default function AuthLayout() {
  const { session, loading } = useAuth();

  // Already signed in → skip auth screens
  if (!loading && session) return <Redirect href="/(tabs)" />;

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: "#0A0A0A" },
        animation: "slide_from_right",
      }}
    />
  );
}
