import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { pricingTiers } from "@shared/schema";
import { Zap } from "lucide-react";

interface UsageData {
  scriptsGenerated: number | string;
  deepResearchUsed: number | string;
  knowledgeBaseQueries: number | string;
}

interface SubscriptionData {
  plan: string;
  status: string;
}

export function CreditsDisplay() {
  const { user } = useAuth();

  const { data: usage } = useQuery<UsageData>({
    queryKey: ["/api/user/usage"],
    enabled: !!user,
  });

  const { data: subscription } = useQuery<SubscriptionData>({
    queryKey: ["/api/user/subscription"],
    enabled: !!user,
  });

  if (!user) return null;

  const currentPlan = pricingTiers.find(t => t.id === (subscription?.plan || "starter")) || pricingTiers[0];
  const scriptsLimit = currentPlan.limits.scriptsPerMonth;
  const scriptsUsed = typeof usage?.scriptsGenerated === 'string' 
    ? parseInt(usage.scriptsGenerated, 10) 
    : (usage?.scriptsGenerated || 0);
  
  const scriptsRemaining = scriptsLimit === -1 
    ? "Unlimited" 
    : Math.max(0, scriptsLimit - scriptsUsed);

  return (
    <div 
      className="fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-background/95 backdrop-blur px-4 py-2"
      data-testid="credits-display"
    >
      <div className="flex items-center justify-center gap-2 text-sm">
        <Zap className="w-4 h-4 text-primary" />
        <span className="text-muted-foreground">Credits remaining:</span>
        <span className="font-medium text-foreground" data-testid="credits-count">
          {scriptsRemaining === "Unlimited" ? "Unlimited" : `${scriptsRemaining} scripts`}
        </span>
        <span className="text-muted-foreground">
          ({currentPlan.name} plan)
        </span>
      </div>
    </div>
  );
}
