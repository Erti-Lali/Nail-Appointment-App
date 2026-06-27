"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Loader2 } from "lucide-react";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const supabase = createClient();

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) {
        router.replace("/auth/login");
        return;
      }
      const { data: profile } = await supabase
        .from("profiles")
        .select("role, tenant_id")
        .eq("id", session.user.id)
        .single();
      // Stüdyo bağlamak zorunlu: tenant'ı olmayan yönetici onboarding'e gider.
      if (profile?.role !== "customer" && !profile?.tenant_id) {
        router.replace("/studyo-olustur");
        return;
      }
      setChecking(false);
    });
  }, [router]);

  if (checking) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-gold-500 animate-spin" />
      </div>
    );
  }

  return <>{children}</>;
}
