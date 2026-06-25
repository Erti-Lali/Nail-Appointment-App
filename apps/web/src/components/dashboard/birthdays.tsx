"use client";

import { Cake, Phone } from "lucide-react";

interface Birthday {
  id: string;
  first_name: string;
  last_name: string;
  phone: string | null;
  birth_date: string;
  daysUntil: number; // 0 = bugün
  age: number | null;
}

interface BirthdaysProps {
  birthdays: Birthday[];
}

function whenLabel(days: number): string {
  if (days === 0) return "Bugün 🎉";
  if (days === 1) return "Yarın";
  return `${days} gün sonra`;
}

export function Birthdays({ birthdays }: BirthdaysProps) {
  return (
    <div className="card">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 rounded-lg bg-brand-soft flex items-center justify-center">
          <Cake className="w-4 h-4 text-brand" />
        </div>
        <h3 className="font-display text-lg font-semibold text-ink">Bu Hafta Doğum Günleri</h3>
      </div>

      {birthdays.length === 0 ? (
        <div className="text-center py-8 text-ink-subtle">
          <Cake className="w-9 h-9 mx-auto mb-2 opacity-40" />
          <p className="text-sm">Bu hafta kutlanacak doğum günü yok.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {birthdays.map((c) => (
            <div
              key={c.id}
              className="flex items-center gap-3 p-2.5 rounded-xl bg-surface-soft border border-line"
            >
              <div className="w-9 h-9 rounded-full bg-brand/10 flex items-center justify-center text-brand font-semibold text-sm shrink-0">
                {c.first_name.charAt(0)}{c.last_name.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-ink font-medium text-sm truncate">
                  {c.first_name} {c.last_name}
                  {c.age !== null && <span className="text-ink-subtle font-normal"> · {c.age}</span>}
                </p>
                <p className={`text-xs ${c.daysUntil === 0 ? "text-brand font-medium" : "text-ink-muted"}`}>
                  {whenLabel(c.daysUntil)}
                </p>
              </div>
              {c.phone && (
                <a
                  href={`tel:${c.phone}`}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-ink-muted hover:text-brand hover:bg-brand/10 transition-colors shrink-0"
                  title={c.phone}
                >
                  <Phone className="w-4 h-4" />
                </a>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
