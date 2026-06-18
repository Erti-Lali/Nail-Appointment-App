"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { formatPrice } from "@nailstudio/shared";
import { wallTime } from "@/lib/datetime";
import { toast } from "sonner";
import {
  Loader2, ArrowLeft, Users, Scissors, UserCheck, CalendarDays,
  TrendingUp, ExternalLink, Shield,
} from "lucide-react";

const STATUS_LABELS: Record<string, string> = {
  pending: "Bekliyor", confirmed: "Onaylı", in_progress: "Devam",
  completed: "Tamamlandı", canceled: "İptal", no_show: "Gelmedi",
};
const STATUS_CLS: Record<string, string> = {
  pending: "bg-amber-100 text-amber-700", confirmed: "bg-green-100 text-green-700",
  in_progress: "bg-blue-100 text-blue-700", completed: "bg-gray-100 text-gray-600",
  canceled: "bg-red-100 text-red-700", no_show: "bg-pink-100 text-pink-700",
};

export default function StudioDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [denied, setDenied] = useState(false);
  const [d, setD] = useState<any>(null);

  useEffect(() => {
    async function load() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.replace("/auth/login"); return; }
      const res = await fetch(`/api/admin/studio?id=${id}`, {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (res.status === 403) { setDenied(true); setLoading(false); return; }
      if (!res.ok) { toast.error("Veri alınamadı"); setLoading(false); return; }
      setD(await res.json());
      setLoading(false);
    }
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  if (loading) {
    return <div className="min-h-screen bg-[#FFF5F9] flex items-center justify-center"><Loader2 className="w-8 h-8 text-[#DB5E9B] animate-spin" /></div>;
  }
  if (denied || !d) {
    return (
      <div className="min-h-screen bg-[#FFF5F9] flex items-center justify-center p-6">
        <div className="bg-[#FFFFFF] border border-[#F3E0EB] rounded-2xl p-8 text-center max-w-sm">
          <Shield className="w-10 h-10 text-[#DB5E9B] mx-auto mb-3" />
          <h1 className="font-bold text-[#1A0A14]">Erişim yok</h1>
          <Link href="/admin" className="inline-flex items-center gap-2 mt-5 text-[#DB5E9B] font-semibold"><ArrowLeft className="w-4 h-4" /> Panele dön</Link>
        </div>
      </div>
    );
  }

  const { tenant, stats, statusBreakdown, monthly, staff, recent } = d;
  const maxRev = Math.max(...monthly.map((m: any) => m.revenue), 1);

  const KPIS = [
    { icon: UserCheck, label: "Personel", value: stats.staff },
    { icon: Scissors, label: "Hizmet", value: stats.services },
    { icon: Users, label: "Müşteri", value: stats.customers },
    { icon: CalendarDays, label: "Randevu", value: stats.appointments },
    { icon: TrendingUp, label: "Ciro", value: formatPrice(stats.revenue, "TRY") },
  ];

  return (
    <div className="min-h-screen bg-[#FFF5F9] text-[#1A0A14]">
      <header className="sticky top-0 z-20 bg-[#FFFFFF] border-b border-[#F3E0EB]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <Link href="/admin" className="text-[#6B1A45] hover:text-[#DB5E9B] shrink-0"><ArrowLeft className="w-5 h-5" /></Link>
            <div className="min-w-0">
              <p className="font-bold text-sm truncate">{tenant.name}</p>
              <p className="text-[#9CA3AF] text-xs truncate">/{tenant.slug} · {tenant.is_active ? "Aktif" : "Pasif"}</p>
            </div>
          </div>
          <a href={`/book/${tenant.slug}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-sm font-medium text-[#6B1A45] hover:text-[#DB5E9B] shrink-0">
            <span className="hidden sm:inline">Randevu Sayfası</span><ExternalLink className="w-4 h-4" />
          </a>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 sm:gap-4">
          {KPIS.map((k) => (
            <div key={k.label} className="bg-[#FFFFFF] border border-[#F3E0EB] rounded-2xl p-4">
              <div className="w-8 h-8 rounded-lg bg-[#DB5E9B]/10 flex items-center justify-center mb-2">
                <k.icon className="w-4 h-4 text-[#DB5E9B]" />
              </div>
              <p className="text-xl font-bold leading-tight">{k.value}</p>
              <p className="text-[#9CA3AF] text-xs mt-0.5">{k.label}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Monthly revenue */}
          <div className="bg-[#FFFFFF] border border-[#F3E0EB] rounded-2xl p-5">
            <h2 className="font-semibold mb-4">Son 6 Ay Ciro</h2>
            <div className="flex items-end justify-between gap-2 h-40">
              {monthly.map((m: any) => (
                <div key={m.label} className="flex-1 flex flex-col items-center gap-1.5">
                  <div className="w-full flex items-end justify-center" style={{ height: 120 }}>
                    <div
                      className="w-full max-w-[34px] rounded-t-lg bg-[#DB5E9B]/80"
                      style={{ height: `${(m.revenue / maxRev) * 100}%`, minHeight: m.revenue > 0 ? 4 : 0 }}
                      title={formatPrice(m.revenue, "TRY")}
                    />
                  </div>
                  <span className="text-[10px] text-[#9CA3AF]">{m.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Status breakdown */}
          <div className="bg-[#FFFFFF] border border-[#F3E0EB] rounded-2xl p-5">
            <h2 className="font-semibold mb-4">Randevu Durumları</h2>
            <div className="space-y-2.5">
              {Object.keys(STATUS_LABELS).map((s) => {
                const count = statusBreakdown[s] ?? 0;
                const pct = stats.appointments ? (count / stats.appointments) * 100 : 0;
                return (
                  <div key={s} className="flex items-center gap-3">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full w-24 text-center ${STATUS_CLS[s]}`}>{STATUS_LABELS[s]}</span>
                    <div className="flex-1 h-2 bg-[#FEF0F5] rounded-full overflow-hidden">
                      <div className="h-full bg-[#DB5E9B]/70" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="text-sm text-[#6B1A45] w-8 text-right">{count}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Staff */}
        <div className="bg-[#FFFFFF] border border-[#F3E0EB] rounded-2xl p-5">
          <h2 className="font-semibold mb-4">Personel ({staff.length})</h2>
          {staff.length === 0 ? (
            <p className="text-[#9CA3AF] text-sm">Personel yok.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {staff.map((m: any) => (
                <div key={m.id} className="flex items-center gap-2 bg-[#FFF5F9] border border-[#F3E0EB] rounded-xl px-3 py-2">
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-xs font-bold shrink-0" style={{ backgroundColor: m.color ?? "#DB5E9B" }}>
                    {m.display_name?.charAt(0)}
                  </div>
                  <span className="text-sm">{m.display_name}</span>
                  {!m.is_active && <span className="text-[10px] text-[#9CA3AF]">(pasif)</span>}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent appointments */}
        <div className="bg-[#FFFFFF] border border-[#F3E0EB] rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-[#F3E0EB]"><h2 className="font-semibold">Son Randevular</h2></div>
          {recent.length === 0 ? (
            <p className="text-[#9CA3AF] text-sm px-5 py-6">Henüz randevu yok.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[560px] text-sm">
                <thead>
                  <tr className="text-left text-xs text-[#9CA3AF] border-b border-[#F3E0EB]">
                    <th className="px-5 py-3 font-medium">Tarih</th>
                    <th className="px-3 py-3 font-medium">Müşteri</th>
                    <th className="px-3 py-3 font-medium">Hizmet</th>
                    <th className="px-3 py-3 font-medium">Personel</th>
                    <th className="px-3 py-3 font-medium">Durum</th>
                    <th className="px-5 py-3 font-medium text-right">Ücret</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F3E0EB]">
                  {recent.map((a: any) => (
                    <tr key={a.id} className="hover:bg-[#FFF5F9]">
                      <td className="px-5 py-3 whitespace-nowrap">{String(a.starts_at).slice(0, 10)} {wallTime(a.starts_at)}</td>
                      <td className="px-3 py-3">{a.customer_name}</td>
                      <td className="px-3 py-3">{a.service_name}</td>
                      <td className="px-3 py-3">{a.staff_name}</td>
                      <td className="px-3 py-3"><span className={`text-xs font-medium px-2 py-0.5 rounded-full ${STATUS_CLS[a.status]}`}>{STATUS_LABELS[a.status] ?? a.status}</span></td>
                      <td className="px-5 py-3 text-right text-[#DB5E9B] font-semibold whitespace-nowrap">{formatPrice(a.final_price, "TRY")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
