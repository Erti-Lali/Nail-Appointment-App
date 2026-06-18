import { forwardRef, InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export const inputClass =
  "w-full bg-surface-soft border border-line rounded-xl px-4 py-2.5 text-sm text-ink placeholder:text-ink-subtle outline-none focus:border-brand focus:ring-2 focus:ring-brand/20 transition-all";

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input ref={ref} className={cn(inputClass, className)} {...props} />
  ),
);
Input.displayName = "Input";

export const Textarea = forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, ...props }, ref) => (
    <textarea ref={ref} className={cn(inputClass, "resize-none", className)} {...props} />
  ),
);
Textarea.displayName = "Textarea";
