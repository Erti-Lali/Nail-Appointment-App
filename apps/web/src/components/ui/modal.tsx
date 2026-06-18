"use client";

import { X } from "lucide-react";
import { cn } from "@/lib/utils";

const WIDTHS = { sm: "max-w-sm", md: "max-w-md", lg: "max-w-lg" } as const;

export function Modal({
  title,
  onClose,
  children,
  footer,
  size = "md",
}: {
  title?: string;
  onClose: () => void;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: keyof typeof WIDTHS;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Use explicit black overlay — bg-black is overridden to pink in this theme. */}
      <div className="absolute inset-0 bg-[#00000066] backdrop-blur-sm" onClick={onClose} />
      <div className={cn("relative w-full bg-surface border border-line rounded-2xl shadow-xl overflow-hidden animate-slide-up max-h-[90vh] flex flex-col", WIDTHS[size])}>
        {title && (
          <div className="flex items-center justify-between px-5 py-4 border-b border-line shrink-0">
            <h2 className="font-semibold text-ink">{title}</h2>
            <button onClick={onClose} className="text-ink-subtle hover:text-ink transition-colors"><X className="w-5 h-5" /></button>
          </div>
        )}
        <div className="p-5 overflow-y-auto">{children}</div>
        {footer && <div className="flex gap-3 p-5 pt-0 shrink-0">{footer}</div>}
      </div>
    </div>
  );
}
