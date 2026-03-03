import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, Zap } from "lucide-react";

const features = [
  "Unlimited AI-powered script generation",
  "Clone Video Format from TikTok, Instagram, YouTube",
  "50 viral hooks library",
  "30+ CTA templates",
  "6 script structures",
  "Deep Research mode",
  "Knowledge Base",
  "Competitive Analysis",
  "Voice DNA / Style Import",
  "Hemingway readability analysis",
  "All platforms supported",
  "All video types & formats",
];

export default function Pricing() {
  return (
    <div className="min-h-full p-6 bg-background">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-12">
          <Badge className="mb-4" variant="secondary" data-testid="badge-free">
            100% Free
          </Badge>
          <h1 className="text-4xl font-bold mb-4" data-testid="text-pricing-title">
            Everything is Free
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto" data-testid="text-pricing-subtitle">
            All features are completely free with no limits. Create unlimited viral scripts.
          </p>
        </div>

        <Card className="relative" data-testid="card-pricing-free">
          <CardHeader className="text-center pb-4">
            <div className="mx-auto mb-4 p-3 rounded-full bg-muted">
              <Zap className="h-6 w-6" />
            </div>
            <CardTitle className="text-2xl" data-testid="text-tier-name">
              Free Plan
            </CardTitle>
            <CardDescription data-testid="text-tier-description">
              Full access to all features, no credit card required
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center mb-6">
              <span className="text-4xl font-bold" data-testid="text-tier-price">
                $0
              </span>
              <span className="text-muted-foreground"> forever</span>
            </div>
            <ul className="space-y-3 max-w-md mx-auto">
              {features.map((feature, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <Check className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                  <span className="text-sm">{feature}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
