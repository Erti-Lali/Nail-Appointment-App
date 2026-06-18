"use client";

import { useState } from "react";
import { Plus, UserCheck, Mail, Scissors, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { DAY_LABELS, DAYS_ORDER } from "@nailstudio/shared";
import { StaffDetailPanel } from "./staff-detail-panel";
import { NewStaffModal } from "./new-staff-modal";

interface StaffClientProps {
  staff: any[];
  services: any[];
  tenantId: string;
}

export function StaffClient({ staff: initialStaff, services, tenantId }: StaffClientProps) {
  const [staff, setStaff] = useState(initialStaff);
  const [selected, setSelected] = useState<any | null>(null);
  const [showNewModal, setShowNewModal] = useState(false);

  return (
    <div className="flex gap-6 h-[calc(100vh-140px)] animate-fade-in">
      {/* Staff list */}
      <div className={cn("flex flex-col gap-4 transition-all duration-300 min-w-0", selected ? "flex-1 md:w-80 md:flex-none md:shrink-0" : "flex-1")}>
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-white/40 text-sm">{staff.length} personel</p>
          </div>
          <button
            onClick={() => setShowNewModal(true)}
            className="btn-gold flex items-center gap-2 text-sm py-2"
          >
            <Plus className="w-4 h-4" />
            Personel Ekle
          </button>
        </div>

        {/* Cards */}
        <div className={cn(
          "grid gap-4 overflow-y-auto pb-2",
          selected ? "grid-cols-1" : "grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
        )}>
          {staff.map((member) => {
            const workingDays = member.working_hours?.filter((h: any) => h.is_working).length ?? 0;
            const serviceCount = member.service_staff?.length ?? 0;

            return (
              <div
                key={member.id}
                onClick={() => setSelected(selected?.id === member.id ? null : member)}
                className={cn(
                  "card cursor-pointer transition-all duration-200 hover:border-gold-500/30",
                  selected?.id === member.id && "border-gold-500/50 bg-gold-500/5"
                )}
              >
                <div className="flex items-center gap-3 mb-4">
                  {/* Avatar */}
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center text-black font-bold text-lg shrink-0"
                    style={{ backgroundColor: member.color ?? "#C9A84C" }}
                  >
                    {member.display_name.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-semibold truncate">{member.display_name}</p>
                    <p className="text-white/40 text-xs capitalize">
                      {member.role === "owner" ? "Sahip" :
                       member.role === "manager" ? "Yönetici" :
                       member.role === "technician" ? "Teknisyen" : "Resepsiyon"}
                    </p>
                  </div>
                  <div className={cn(
                    "w-2 h-2 rounded-full shrink-0",
                    member.is_active ? "bg-green-400" : "bg-gray-600"
                  )} />
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-2 mb-3">
                  <div className="bg-black rounded-lg p-2 text-center">
                    <p className="text-white font-semibold text-sm">{workingDays}</p>
                    <p className="text-white/30 text-[10px]">Çalışma Günü</p>
                  </div>
                  <div className="bg-black rounded-lg p-2 text-center">
                    <p className="text-white font-semibold text-sm">{serviceCount}</p>
                    <p className="text-white/30 text-[10px]">Hizmet</p>
                  </div>
                </div>

                {/* Online booking */}
                <div className={cn(
                  "flex items-center gap-1.5 text-xs",
                  member.accepts_online_booking ? "text-green-400/80" : "text-white/30"
                )}>
                  <div className={cn("w-1.5 h-1.5 rounded-full", member.accepts_online_booking ? "bg-green-400" : "bg-gray-600")} />
                  {member.accepts_online_booking ? "Online randevu açık" : "Online randevu kapalı"}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Detail panel — full-screen overlay on mobile, side panel on desktop */}
      {selected && (
        <div className="fixed inset-0 z-40 p-4 bg-[#FFF5F9] overflow-y-auto animate-slide-up
                        md:static md:z-auto md:p-0 md:bg-transparent md:flex-1 md:overflow-hidden">
          <StaffDetailPanel
            staff={selected}
            services={services}
            tenantId={tenantId}
            onClose={() => setSelected(null)}
            onUpdate={(updated) => {
              setStaff((prev) => prev.map((s) => s.id === updated.id ? updated : s));
              setSelected(updated);
            }}
          />
        </div>
      )}

      {showNewModal && (
        <NewStaffModal
          tenantId={tenantId}
          onClose={() => setShowNewModal(false)}
          onSuccess={(s) => {
            setStaff((prev) => [...prev, s]);
            setShowNewModal(false);
          }}
        />
      )}
    </div>
  );
}
