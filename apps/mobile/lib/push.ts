import { Platform } from "react-native";
import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import Constants from "expo-constants";
import { supabase } from "./supabase";

// Show notifications even while the app is foregrounded.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

// Web backend base URL (Vercel). Mobile posts the push token here.
const API_URL = process.env.EXPO_PUBLIC_API_URL;

function getProjectId(): string | undefined {
  return (
    (Constants.expoConfig as any)?.extra?.eas?.projectId ??
    (Constants as any)?.easConfig?.projectId ??
    undefined
  );
}

// Android needs a channel for notifications to display.
export async function setupAndroidChannel() {
  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "Hatırlatmalar",
      importance: Notifications.AndroidImportance.DEFAULT,
      lightColor: "#C9A84C",
    });
  }
}

// Requests permission, fetches the Expo push token and registers it with the
// backend for the logged-in user. Safe to call on every app open / after login —
// fails quietly on simulators, missing config, or when not signed in.
export async function registerPushToken(): Promise<void> {
  try {
    if (!Device.isDevice) return; // push tokens aren't available on simulators

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const existing = await Notifications.getPermissionsAsync();
    let granted = existing.granted || existing.status === "granted";
    if (!granted) {
      const req = await Notifications.requestPermissionsAsync();
      granted = req.granted || req.status === "granted";
    }
    if (!granted) return;

    await setupAndroidChannel();

    const projectId = getProjectId();
    const tokenResp = await Notifications.getExpoPushTokenAsync(projectId ? { projectId } : undefined);
    const token = tokenResp?.data;
    if (!token) return;

    if (!API_URL) {
      // eslint-disable-next-line no-console
      console.warn("EXPO_PUBLIC_API_URL ayarlı değil — push token gönderilemedi.");
      return;
    }

    await fetch(`${API_URL}/api/push-token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ token, platform: Platform.OS }),
    });
  } catch (e) {
    // eslint-disable-next-line no-console
    console.warn("registerPushToken hatası:", e);
  }
}
