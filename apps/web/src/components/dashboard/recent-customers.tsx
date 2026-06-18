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
        <h3 className="font-semibold text-white">Son Müşteriler</h3>
        <Link
          href="/customers"
          className="text-gold-500 text-xs hover:text-gold-400 transition-colors flex items-center gap-1"
        >
          Tümü <ChevronRight className="w-3 h-3" />
        </Link>
      </div>

      {customers.length === 0 ? (
        <div className="text-center py-8 text-white/30">
          <Users className="w-10 h-10 mx-auto mb-2 opacity-30" />
          <p className="text-xs">Henüz müşteri yok</p>
        </div>
      ) : (
        <div className="space-y-2">
          {customers.map((customer) => (
            <Link
              key={customer.id}
              href={`/customers/${customer.id}`}
              className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-black transition-colors group"
            >
              {/* Avatar */}
              <div className="w-9 h-9 rounded-full bg-gold-500/20 flex items-center justify-center shrink-0">
                <span className="text-gold-500 text-xs font-bold">
                  {customer.first_name.charAt(0)}{customer.last_name.charAt(0)}
                </span>
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="text-white text-sm font-medium truncate">
                  {customer.first_name} {customer.last_name}
                </p>
                <p className="text-white/30 text-xs">
                  {customer.total_visits} ziyaret · {formatDate(customer.created_at, "d MMM")}
                </p>
              </div>

              <ChevronRight className="w-3.5 h-3.5 text-white/20 group-hover:text-white/50 transition-colors" />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
