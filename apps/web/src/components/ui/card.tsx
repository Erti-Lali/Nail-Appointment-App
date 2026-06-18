import { cn } from "@/lib/utils";

export function Card({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("bg-surface border border-line rounded-2xl p-4 sm:p-6 shadow-card", className)} {...props}>
      {children}
    </div>
  );
}
