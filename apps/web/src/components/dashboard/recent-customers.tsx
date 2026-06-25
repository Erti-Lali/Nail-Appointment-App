"use client";

import Link from "next/link";
import { formatDate } from "@nailstudio/shared";
import { Users, ChevronRight } from "lucide-react";

interface RecentCustomersProps {
  customers: any[];
}

export function RecentCustomers({ customers }: RecentCustomersProps) {
  return (
    <div className="card h-full">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-display text-lg font-semibold text-ink">Son Müşteriler</h3>
        <Link
          href="/customers"
          className="text-brand text-xs hover:text-brand-dark transition-colors flex items-center gap-1"
        >
          Tümü <ChevronRight className="w-3 h-3" />
        </Link>
      </div>

      {customers.length === 0 ? (
        <div className="text-center py-8">
          <Users className="w-10 h-10 mx-auto mb-2 text-ink-subtle opacity-40" />
          <p className="text-sm text-ink-muted">Henüz müşteri yok.</p>
          <Link href="/customers?new=1" className="inline-block mt-2 text-sm font-medium text-brand hover:text-brand-dark transition-colors">
            İlk müşteriyi ekle
          </Link>
        </div>
      ) : (
        <div className="space-y-2">
          {customers.map((customer) => (
            <Link
              key={customer.id}
              href={`/customers/${customer.id}`}
              className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-surface-soft transition-colors group"
            >
              {/* Avatar */}
              <div className="w-9 h-9 rounded-full bg-brand/10 flex items-center justify-center shrink-0">
                <span className="text-brand text-xs font-bold">
                  {customer.first_name.charAt(0)}{customer.last_name.charAt(0)}
                </span>
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="text-ink text-sm font-medium truncate">
                  {customer.first_name} {customer.last_name}
                </p>
                <p className="text-ink-subtle text-xs">
                  {customer.total_visits} ziyaret · {formatDate(customer.created_at, "d MMM")}
                </p>
              </div>

              <ChevronRight className="w-3.5 h-3.5 text-ink-subtle group-hover:text-brand transition-colors" />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
