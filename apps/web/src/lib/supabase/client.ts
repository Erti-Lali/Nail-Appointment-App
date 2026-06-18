import { createClient as createSupabaseClient, SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";

// Typed singleton browser client — avoids multiple instances and gives full
// end-to-end type safety on every .from()/.select()/.insert() call.
let client: SupabaseClient<Database> | null = null;

export function createClient() {
  if (client) return client;
  client = createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  return client;
}
