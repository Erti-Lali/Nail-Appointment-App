import { cn } from "@/lib/utils";
import { APPOINTMENT_STATUS } from "@/lib/constants";
import type { Enum } from "@/lib/database.types";

export function Badge({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <span className={cn("inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium", className)}>
      {children}
    </span>
  );
}

export function StatusBadge({ status }: { status: Enum<"appointment_status"> | string }) {
  const s = APPOINTMENT_STATUS[status as Enum<"appointment_status">] ?? { label: status, badge: "bg-gray-100 text-gray-600" };
  return <Badge className={s.badge}>{s.label}</Badge>;
}
