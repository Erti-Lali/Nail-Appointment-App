"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Loader2 } from "lucide-react";
import { BookingClient } from "./booking-client";

export default function PublicBookingPage() {
  const params = useParams<{ studioSlug: string }>();
  const slug = params.studioSlug;
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    async function load() {
      const supabase = createClient();

      const { data: tenant } = await supabase
        .from("tenants")
        .select("id, name, slug, logo_url, cover_url, phone, address, city, instagram_handle, currency")
        .eq("slug", slug)
        .eq("is_active", true)
        .maybeSingle();

      if (!tenant) {
        setNotFound(true);
        setLoading(false);
        return;
      }

      const [{ data: categories }, { data: services }, { data: staff }] = await Promise.all([
        supabase.from("service_categories").select("id, name, icon, color, sort_order")
          .eq("tenant_id", tenant.id).eq("is_active", true).order("sort_order"),
        supabase.from("services").select("id, name, description, duration_minutes, price, price_max, category_id, is_active")
          .eq("tenant_id", tenant.id).eq("is_active", true).order("sort_order"),
        supabase.from("staff").select("id, display_name, bio, avatar_url, specialties, color")
          .eq("tenant_id", tenant.id).eq("is_active", true).eq("accepts_online_booking", true),
      ]);

      setData({
        tenant,
        categories: categories ?? [],
        services: services ?? [],
        staff: staff ?? [],
      });
      setLoading(false);
    }
    load();
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FFF5F9]">
        <Loader2 className="w-8 h-8 text-[#DB5E9B] animate-spin" />
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#FFF5F9] px-6 text-center">
        <div className="text-5xl mb-4">💅</div>
        <h1 className="text-xl font-bold text-[#1A0A14]">Stüdyo bulunamadı</h1>
        <p className="text-[#9CA3AF] mt-2">
          &ldquo;{slug}&rdquo; adresinde aktif bir stüdyo yok.
        </p>
      </div>
    );
  }

  return <BookingClient {...data} />;
}
