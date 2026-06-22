"use client";

import { useState } from "react";
import { toast } from "sonner";
import { AlertTriangle } from "lucide-react";
import { Modal, Button } from "@/components/ui";
import { wallTime } from "@/lib/datetime";

export function CancelModal({
  appointment,
  token,
  onClose,
  onSuccess,
}: {
  appointment: any;
  token: string;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [loading, setLoading] = useState(false);

  const confirm = async () => {
    setLoading(true);
    const res = await fetch("/api/customer/appointments/cancel", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ appointmentId: appointment.id }),
    });
    const d = await res.json().catch(() => ({}));
    setLoading(false);
    if (!res.ok) { toast.error(d.error ?? "İptal edilemedi"); return; }
    toast.success("Randevunuz iptal edildi");
    onSuccess();
    onClose();
  };

  return (
    <Modal title="Randevuyu İptal Et" onClose={onClose} size="sm"
      footer={
        <>
          <Button variant="ghost" className="flex-1" onClick={onClose} disabled={loading}>Vazgeç</Button>
          <Button variant="danger" className="flex-1 hover:bg-red-500 hover:text-surface hover:border-red-500" onClick={confirm} loading={loading}>
            Evet, iptal et
          </Button>
        </>
      }
    >
      <div className="text-center">
        <div className="w-12 h-12 rounded-2xl bg-red-50 flex items-center justify-center mx-auto mb-3">
          <AlertTriangle className="w-6 h-6 text-red-500" />
        </div>
        <p className="text-ink font-medium">Randevunuzu iptal etmek istediğinize emin misiniz?</p>
        <div className="bg-surface-soft border border-line rounded-xl px-3 py-2.5 mt-4 text-sm text-ink-muted">
          {String(appointment.starts_at).slice(0, 10)} · {wallTime(appointment.starts_at)}
          {appointment.tenant?.name && <> · {appointment.tenant.name}</>}
        </div>
        <p className="text-ink-subtle text-xs mt-3">Bu işlem geri alınamaz.</p>
      </div>
    </Modal>
  );
}
