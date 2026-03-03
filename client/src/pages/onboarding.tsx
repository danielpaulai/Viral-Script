import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/use-auth";
import { Check, Sparkles, Zap, Shield, ArrowRight } from "lucide-react";

export default function Onboarding() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();

  const features = [
    { icon: Sparkles, text: "Unlimited AI-powered script generation" },
    { icon: Zap, text: "Clone Video Format from any platform" },
    { icon: Shield, text: "Deep Research & Knowledge Base" },
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
            You're All Set
          </CardTitle>
          <CardDescription className="text-base">
            Everything is completely free. Start creating viral scripts right away.
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
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

          <Button 
            className="w-full h-12 text-base gap-2" 
            onClick={() => setLocation("/")}
            data-testid="button-get-started"
          >
            Start Creating Scripts
            <ArrowRight className="w-4 h-4" />
          </Button>

          <div className="border-t pt-4">
            <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <Check className="w-3 h-3 text-green-500" />
                <span>No credit card needed</span>
              </div>
              <div className="flex items-center gap-1">
                <Check className="w-3 h-3 text-green-500" />
                <span>Unlimited access</span>
              </div>
              <div className="flex items-center gap-1">
                <Check className="w-3 h-3 text-green-500" />
                <span>All features included</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
