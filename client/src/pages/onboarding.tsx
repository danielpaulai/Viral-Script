import { useState } from "react";
import { useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest } from "@/lib/queryClient";
import { Check, CreditCard, Sparkles, Shield, Zap, Clock, ArrowRight } from "lucide-react";

export default function Onboarding() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [isLoading, setIsLoading] = useState(false);

  const startTrialMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/billing/create-checkout");
      return res.json();
    },
    onSuccess: (data: { url: string }) => {
      if (data.url) {
        window.location.href = data.url;
      }
    },
    onError: (error: Error) => {
      setIsLoading(false);
      toast({
        title: "Error",
        description: error.message || "Failed to start checkout. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleStartTrial = () => {
    setIsLoading(true);
    startTrialMutation.mutate();
  };

  const features = [
    { icon: Sparkles, text: "Generate 20 viral-ready scripts" },
    { icon: Zap, text: "AI-powered hook suggestions" },
    { icon: Shield, text: "Script Memory for voice consistency" },
    { icon: Clock, text: "7-day free trial, cancel anytime" },
  ];

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 p-4">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center space-y-2">
          <div className="flex justify-center mb-2">
            <Badge variant="secondary" className="text-xs">
              Welcome, {user?.username || "Creator"}!
            </Badge>
          </div>
          <CardTitle className="text-2xl font-bold">
            Start Your Free Trial
          </CardTitle>
          <CardDescription className="text-base">
            Get 7 days of full access with no charges today. We just need your card to start your subscription after the trial.
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <div className="bg-primary/5 rounded-lg p-4 border border-primary/10">
            <div className="flex items-center justify-between mb-3">
              <span className="font-semibold">Pro Plan</span>
              <div className="text-right">
                <span className="text-2xl font-bold">$19.99</span>
                <span className="text-muted-foreground text-sm">/month</span>
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <CreditCard className="w-4 h-4" />
              <span>$0 charged today • Billed after 7-day trial</span>
            </div>
          </div>

          <div className="space-y-3">
            {features.map((feature, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <feature.icon className="w-4 h-4 text-primary" />
                </div>
                <span className="text-sm">{feature.text}</span>
              </div>
            ))}
          </div>

          <div className="space-y-3">
            <Button 
              className="w-full h-12 text-base gap-2" 
              onClick={handleStartTrial}
              disabled={isLoading || startTrialMutation.isPending}
              data-testid="button-start-trial"
            >
              {isLoading || startTrialMutation.isPending ? (
                "Redirecting to checkout..."
              ) : (
                <>
                  Start 7-Day Free Trial
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </Button>
            
            <p className="text-center text-xs text-muted-foreground">
              By starting your trial, you agree to be charged $19.99/month after 7 days unless you cancel.
            </p>
          </div>

          <div className="border-t pt-4">
            <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <Check className="w-3 h-3 text-green-500" />
                <span>Cancel anytime</span>
              </div>
              <div className="flex items-center gap-1">
                <Check className="w-3 h-3 text-green-500" />
                <span>No charges for 7 days</span>
              </div>
              <div className="flex items-center gap-1">
                <Check className="w-3 h-3 text-green-500" />
                <span>Secure checkout</span>
              </div>
            </div>
            
            <p className="text-center text-xs text-muted-foreground mt-4">
              Need help?{" "}
              <a 
                href="mailto:admin@danielpaul.ai" 
                className="text-primary hover:underline"
                data-testid="link-contact-email"
              >
                admin@danielpaul.ai
              </a>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
