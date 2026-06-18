import { cn } from "@/lib/utils";

export function Label({ children, className }: { children: React.ReactNode; className?: string }) {
  return <label className={cn("block text-sm font-medium text-ink-muted mb-1.5", className)}>{children}</label>;
}

export function Field({ label, hint, children }: { label?: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      {label && <Label>{label}</Label>}
      {children}
      {hint && <p className="text-[11px] text-ink-subtle mt-1">{hint}</p>}
    </div>
  );
}
