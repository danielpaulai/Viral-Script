import { useAuth } from "@/hooks/use-auth";
import { Zap } from "lucide-react";

export function CreditsDisplay() {
  const { user } = useAuth();

  if (!user) return null;

  return (
    <div 
      className="fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-background/95 backdrop-blur px-4 py-2"
      data-testid="credits-display"
    >
      <div className="flex items-center justify-center gap-2 text-sm">
        <Zap className="w-4 h-4 text-primary" />
        <span className="text-muted-foreground">Scripts:</span>
        <span className="font-medium text-foreground" data-testid="credits-count">
          Unlimited
        </span>
        <span className="text-muted-foreground">
          (Free plan)
        </span>
      </div>
    </div>
  );
}
