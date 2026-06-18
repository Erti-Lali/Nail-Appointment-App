"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

interface UserContextValue {
  user: any;
  profile: any;
  tenantId: string | null;
  loading: boolean;
}

const UserContext = createContext<UserContextValue>({
  user: null,
  profile: null,
  tenantId: null,
  loading: true,
});

export function useUser() {
  return useContext(UserContext);
}

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<UserContextValue>({
    user: null,
    profile: null,
    tenantId: null,
    loading: true,
  });

  useEffect(() => {
    const supabase = createClient();

    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) {
        setState({ user: null, profile: null, tenantId: null, loading: false });
        return;
      }
      const { data: profile } = await supabase
        .from("profiles")
        .select("*, tenants(*)")
        .eq("id", user.id)
        .single();

      setState({
        user,
        profile,
        tenantId: profile?.tenant_id ?? null,
        loading: false,
      });
    });
  }, []);

  return <UserContext.Provider value={state}>{children}</UserContext.Provider>;
}
