import { useEffect } from "react";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useFonts, Playfair_Display_700Bold } from "@expo-google-fonts/playfair-display";
import * as SplashScreen from "expo-splash-screen";
import * as Notifications from "expo-notifications";
import { AuthProvider, useAuth } from "../lib/auth";
import { registerPushToken } from "../lib/push";

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 60 * 1000, retry: 1 },
  },
});

// Registers the device's push token once the user is authenticated, and keeps a
// foreground listener so notifications received while the app is open still show.
function PushManager() {
  const { session } = useAuth();

  useEffect(() => {
    if (session) registerPushToken();
  }, [session]);

  useEffect(() => {
    const sub = Notifications.addNotificationReceivedListener(() => {});
    return () => sub.remove();
  }, []);

  return null;
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({ Playfair_Display_700Bold });

  useEffect(() => {
    if (fontsLoaded) SplashScreen.hideAsync();
  }, [fontsLoaded]);

  if (!fontsLoaded) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: "#0A0A0A" }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <PushManager />
            <StatusBar style="light" backgroundColor="#0A0A0A" />
            <Stack
              screenOptions={{
                headerStyle: { backgroundColor: "#0A0A0A" },
                headerTintColor: "#FAFAFA",
                headerTitleStyle: { fontWeight: "600" },
                contentStyle: { backgroundColor: "#0A0A0A" },
                animation: "slide_from_right",
              }}
            >
              <Stack.Screen name="index" options={{ headerShown: false }} />
              <Stack.Screen name="(auth)" options={{ headerShown: false }} />
              <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
              <Stack.Screen name="booking/[studioSlug]" options={{ title: "Randevu Al" }} />
            </Stack>
          </AuthProvider>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
