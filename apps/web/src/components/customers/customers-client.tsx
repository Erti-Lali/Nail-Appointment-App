"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Search, Plus, Users, TrendingUp, Star, Phone, Tag,
  MoreVertical, ArrowUpDown, ChevronRight,
} from "lucide-react";
import { formatDate, formatPrice } from "@nailstudio/shared";
import { cn } from "@/lib/utils";
import { NewCustomerModal } from "./new-customer-modal";

interface CustomersClientProps {
  customers: any[];
  tenantId: string;
  stats: { total: number; newThisMonth: number };
}

const SORT_OPTIONS = [
  { value: "created_at", label: "En Yeni" },
  { value: "total_visits", label: "En Çok Ziyaret" },
  { value: "total_spent", label: "En Çok Harcama" },
  { value: "first_name", label: "İsim A-Z" },
];

export function CustomersClient({ customers: initial, tenantId, stats }: CustomersClientProps) {
  const router = useRouter();
  const [customers, setCustomers] = useState(initial);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("created_at");
  const [showNewModal, setShowNewModal] = useState(false);

  const filtered = customers
    .filter((c) => {
      if (!search) return true;
      const q = search.toLowerCase();
      return (
        c.first_name.toLowerCase().includes(q) ||
        c.last_name.toLowerCase().includes(q) ||
        (c.phone && c.phone.includes(q)) ||
        (c.email && c.email.toLowerCase().includes(q))
      );
    })
    .sort((a, b) => {
      if (sort === "first_name") return a.first_name.localeCompare(b.first_name);
      if (sort === "total_visits") return b.total_visits - a.total_visits;
      if (sort === "total_spent") return b.total_spent - a.total_spent;
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            icon: Users,
            label: "Toplam Müşteri",
            value: stats.total.toLocaleString("tr-TR"),
            color: "text-purple-400",
            bg: "bg-purple-500/10",
          },
          {
            icon: TrendingUp,
            label: "Bu Ay Yeni",
            value: `+${stats.newThisMonth}`,
            color: "text-green-400",
            bg: "bg-green-500/10",
          },
          {
            icon: Star,
            label: "Sadakat Puanı",
            value: customers.reduce((s, c) => s + c.loyalty_points, 0).toLocaleString(),
            color: "text-gold-500",
            bg: "bg-gold-500/10",
          },
          {
            icon: TrendingUp,
            label: "Toplam Ciro",
            value: formatPrice(customers.reduce((s, c) => s + c.total_spent, 0), "TRY"),
            color: "text-blue-400",
            bg: "bg-blue-500/10",
          },
        ].map((stat) => (
          <div key={stat.label} className="card">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-white/50 text-xs mb-2">{stat.label}</p>
                <p className="text-xl font-bold text-white">{stat.value}</p>
              </div>
              <div className={`w-9 h-9 rounded-xl ${stat.bg} flex items-center justify-center`}>
                <stat.icon className={`w-4 h-4 ${stat.color}`} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="card p-0 overflow-hidden">
        {/* Toolbar */}
        <div className="flex items-center gap-3 p-4 border-b border-black-border flex-wrap">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="İsim, telefon veya e-posta ara..."
              className="input pl-9 py-2"
            />
          </div>

          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="bg-black-soft border border-black-border rounded-xl px-3 py-2 text-sm
                       text-white/70 outline-none focus:border-gold-500/50 cursor-pointer"
          >
            {SORT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>

          <button
            onClick={() => setShowNewModal(true)}
            className="btn-gold flex items-center gap-2 text-sm py-2"
          >
            <Plus className="w-4 h-4" />
            Yeni Müşteri
          </button>
        </div>

        {/* Table header (desktop only) */}
        <div className="hidden md:grid grid-cols-[2fr_1.5fr_1fr_1fr_1fr_80px] gap-4 px-4 py-2.5 text-xs font-medium text-white/30 border-b border-black-border uppercase tracking-wide">
          <span>Müşteri</span>
          <span>Telefon</span>
          <span className="text-center">Ziyaret</span>
          <span className="text-right">Harcama</span>
          <span className="text-center">Puan</span>
          <span />
        </div>

        {/* Rows */}
        {filtered.length === 0 ? (
          <div className="text-center py-16 text-white/20">
            <Users className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm">Müşteri bulunamadı</p>
          </div>
        ) : (
          <div className="divide-y divide-black-border">
            {filtered.map((customer) => (
              <div
                key={customer.id}
                onClick={() => router.push(`/customers/${customer.id}`)}
                className="flex md:grid md:grid-cols-[2fr_1.5fr_1fr_1fr_1fr_80px] gap-3 md:gap-4 px-4 py-3.5
                           hover:bg-black/40 cursor-pointer transition-colors items-center group"
              >
                {/* Name & avatar */}
                <div className="flex items-center gap-3 min-w-0 flex-1 md:flex-none">
                  <div className="w-9 h-9 rounded-full bg-gold-500/15 flex items-center justify-center shrink-0">
                    <span className="text-gold-500 text-xs font-bold">
                      {customer.first_name.charAt(0)}{customer.last_name.charAt(0)}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <p className="text-white font-medium text-sm truncate">
                      {customer.first_name} {customer.last_name}
                    </p>
                    <p className="text-white/40 text-xs md:hidden truncate">{customer.phone}</p>
                    {customer.tags?.length > 0 && (
                      <div className="flex items-center gap-1 mt-0.5">
                        {customer.tags.slice(0, 2).map((tag: string) => (
                          <span key={tag} className="text-[9px] bg-gold-500/10 text-gold-500/80 px-1.5 py-0.5 rounded-md">
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Phone (desktop column) */}
                <div className="hidden md:flex items-center gap-1.5">
                  <Phone className="w-3 h-3 text-white/20 shrink-0" />
                  <span className="text-white/60 text-sm">{customer.phone}</span>
                </div>

                {/* Visits */}
                <div className="hidden md:block text-center">
                  <span className="text-white font-semibold">{customer.total_visits}</span>
                </div>

                {/* Spent */}
                <div className="text-right shrink-0">
                  <span className="text-gold-500 font-semibold text-sm whitespace-nowrap">
                    {formatPrice(customer.total_spent, "TRY")}
                  </span>
                </div>

                {/* Points */}
                <div className="hidden md:block text-center">
                  <span className="text-white/60 text-sm">{customer.loyalty_points}</span>
                </div>

                {/* Arrow */}
                <div className="flex justify-end shrink-0">
                  <ChevronRight className="w-4 h-4 text-white/20 group-hover:text-white/50 transition-colors" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Footer */}
        <div className="px-4 py-3 border-t border-black-border">
          <p className="text-xs text-white/30">
            {filtered.length} müşteri gösteriliyor
          </p>
        </div>
      </div>

      {showNewModal && (
        <NewCustomerModal
          tenantId={tenantId}
          onClose={() => setShowNewModal(false)}
          onSuccess={(c) => {
            setCustomers((prev) => [c, ...prev]);
            setShowNewModal(false);
          }}
        />
      )}
    </div>
  );
}
