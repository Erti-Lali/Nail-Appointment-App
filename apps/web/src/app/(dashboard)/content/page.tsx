"use client";

// ⏸️ İLK SÜRÜMDE GİZLENDİ — İçerik (galeri) yönetimi.
// Sayfa + /api/upload + tenant-content storage bucket çalışır durumda ama
// sidebar nav'dan link kaldırıldı (ilk sürümde istenmiyor). Doğrudan URL ile
// hâlâ açılır. Geri açmak için: sidebar.tsx NAV_ITEMS'a İçerik öğesini ekle.

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useUser } from "@/components/providers/user-provider";
import { Spinner } from "@/components/ui";
import { ContentClient } from "@/components/content/content-client";

export default function ContentPage() {
  const { tenantId, loading: userLoading } = useUser();
  const [loading, setLoading] = useState(true);
  const [content, setContent] = useState<any[]>([]);

  useEffect(() => {
    if (userLoading) return;
    if (!tenantId) { setLoading(false); return; }

    async function load() {
      const supabase = createClient();
      const { data } = await supabase
        .from("tenant_content")
        .select("*")
        .eq("tenant_id", tenantId)
        .order("sort_order")
        .order("created_at", { ascending: false });
      setContent(data ?? []);
      setLoading(false);
    }
    load();
  }, [userLoading, tenantId]);

  if (loading) {
    return <div className="flex items-center justify-center h-64"><Spinner className="w-8 h-8" /></div>;
  }
  return <ContentClient tenantId={tenantId!} initialContent={content} />;
}
