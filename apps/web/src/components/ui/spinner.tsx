import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export function Spinner({ className }: { className?: string }) {
  return <Loader2 className={cn("w-6 h-6 text-brand animate-spin", className)} />;
}

export function FullPageSpinner() {
  return (
    <div className="min-h-screen bg-canvas flex items-center justify-center">
      <Spinner className="w-8 h-8" />
    </div>
  );
}
