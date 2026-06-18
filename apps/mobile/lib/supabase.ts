import { createClient } from "@supabase/supabase-js";
import * as SecureStore from "expo-secure-store";
import { AppState } from "react-native";

// SecureStore caps each value at ~2KB, but Supabase sessions can exceed that.
// This adapter transparently chunks values across multiple SecureStore keys.
const CHUNK_SIZE = 1800;

function sanitize(key: string) {
  // SecureStore keys must be alphanumeric + ".-_"
  return key.replace(/[^a-zA-Z0-9.\-_]/g, "_");
}

const ChunkedSecureStore = {
  async getItem(key: string): Promise<string | null> {
    const k = sanitize(key);
    const countStr = await SecureStore.getItemAsync(`${k}__n`);
    if (countStr == null) {
      // non-chunked fallback
      return SecureStore.getItemAsync(k);
    }
    const count = parseInt(countStr, 10);
    let result = "";
    for (let i = 0; i < count; i++) {
      const part = await SecureStore.getItemAsync(`${k}__${i}`);
      if (part == null) return null;
      result += part;
    }
    return result;
  },
  async setItem(key: string, value: string): Promise<void> {
    const k = sanitize(key);
    if (value.length <= CHUNK_SIZE) {
      await SecureStore.setItemAsync(k, value);
      await SecureStore.deleteItemAsync(`${k}__n`);
      return;
    }
    const chunks = Math.ceil(value.length / CHUNK_SIZE);
    for (let i = 0; i < chunks; i++) {
      await SecureStore.setItemAsync(`${k}__${i}`, value.slice(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE));
    }
    await SecureStore.setItemAsync(`${k}__n`, String(chunks));
    await SecureStore.deleteItemAsync(k);
  },
  async removeItem(key: string): Promise<void> {
    const k = sanitize(key);
    const countStr = await SecureStore.getItemAsync(`${k}__n`);
    if (countStr != null) {
      const count = parseInt(countStr, 10);
      for (let i = 0; i < count; i++) await SecureStore.deleteItemAsync(`${k}__${i}`);
      await SecureStore.deleteItemAsync(`${k}__n`);
    }
    await SecureStore.deleteItemAsync(k);
  },
};

export const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL!,
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!,
  {
    auth: {
      storage: ChunkedSecureStore,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  }
);

// Refresh the session automatically while the app is in the foreground.
AppState.addEventListener("change", (state) => {
  if (state === "active") supabase.auth.startAutoRefresh();
  else supabase.auth.stopAutoRefresh();
});
