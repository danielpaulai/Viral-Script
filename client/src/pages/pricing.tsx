import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Zap, Crown, Building2 } from "lucide-react";

const pricingTiers = [
  {
    id: "starter",
    name: "Starter",
    price: 19.99,
    description: "Perfect for beginners and solo creators",
    icon: Zap,
    features: [
      "50 viral hooks library",
      "30+ CTA templates",
      "6 script structures",
      "Deep research mode",
      "Hemingway readability analysis",
      "30 scripts per month",
      "All platforms supported",
    ],
    limitations: [
      "No Knowledge Base",
      "No competitor analysis",
    ],
    popular: false,
    buttonText: "Start Free Trial",
    trialDays: 7,
  },
  {
    id: "pro",
    name: "Pro",
    price: 29.99,
    description: "For creators who want brand-consistent scripts",
    icon: Crown,
    features: [
      "Everything in Starter",
      "Unlimited Knowledge Base",
      "ICP & Brand Positioning docs",
      "Voice DNA templates",
      "Messaging House pillars",
      "Rule of One framework",
      "AI learns your brand voice",
      "Unlimited scripts",
    ],
    limitations: [
      "No competitor analysis",
    ],
    popular: true,
    buttonText: "Start Free Trial",
    trialDays: 7,
  },
  {
    id: "agency",
    name: "Agency",
    price: 39.99,
    description: "Full content strategy for teams and agencies",
    icon: Building2,
    features: [
      "Everything in Pro",
      "Competitor script analysis",
      "Content strategy builder",
      "Funnel categories (TOFU/MOFU/BOFU)",
      "Personal stories framework",
      "Hot takes generator",
      "Team collaboration (coming soon)",
      "Priority support",
    ],
    limitations: [],
    popular: false,
    buttonText: "Start Free Trial",
    trialDays: 7,
  },
];

export default function Pricing() {
  return (
    <div className="min-h-full p-6 bg-background">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <Badge className="mb-4" variant="secondary" data-testid="badge-free-trial">
            7-Day Free Trial on All Plans
          </Badge>
          <h1 className="text-4xl font-bold mb-4" data-testid="text-pricing-title">
            Start Free, Go Viral
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto" data-testid="text-pricing-subtitle">
            Try any plan free for 7 days. No charge until your trial ends. Cancel anytime.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {pricingTiers.map((tier) => {
            const Icon = tier.icon;
            return (
              <Card 
                key={tier.id} 
                className={`relative flex flex-col ${tier.popular ? 'ring-2 ring-primary' : ''}`}
                data-testid={`card-pricing-${tier.id}`}
              >
                {tier.popular && (
                  <Badge 
                    className="absolute -top-3 left-1/2 -translate-x-1/2"
                    data-testid="badge-popular"
                  >
                    Most Popular
                  </Badge>
                )}
                <CardHeader className="text-center pb-4">
                  <div className="mx-auto mb-4 p-3 rounded-full bg-muted">
                    <Icon className="h-6 w-6" />
                  </div>
                  <CardTitle className="text-2xl" data-testid={`text-tier-name-${tier.id}`}>
                    {tier.name}
                  </CardTitle>
                  <CardDescription data-testid={`text-tier-description-${tier.id}`}>
                    {tier.description}
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex-1">
                  <div className="text-center mb-6">
                    <span className="text-4xl font-bold" data-testid={`text-tier-price-${tier.id}`}>
                      ${tier.price}
                    </span>
                    <span className="text-muted-foreground">/month</span>
                    <p className="text-sm text-primary font-medium mt-2" data-testid={`text-trial-${tier.id}`}>
                      7 days free
                    </p>
                  </div>
                  <ul className="space-y-3">
                    {tier.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <Check className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                    {tier.limitations.map((limitation, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-muted-foreground">
                        <span className="h-5 w-5 shrink-0 mt-0.5 text-center">-</span>
                        <span className="text-sm">{limitation}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
                <CardFooter>
                  <Button 
                    className="w-full" 
                    variant={tier.popular ? "default" : "outline"}
                    data-testid={`button-select-${tier.id}`}
                  >
                    {tier.buttonText}
                  </Button>
                </CardFooter>
              </Card>
            );
          })}
        </div>

        <div className="bg-muted rounded-lg p-8 text-center">
          <h2 className="text-2xl font-bold mb-4">Knowledge Base: Your Secret Weapon</h2>
          <p className="text-muted-foreground max-w-3xl mx-auto mb-6">
            Pro and Agency plans include unlimited Knowledge Base storage. Upload your ICP, 
            brand positioning, voice DNA, and messaging documents. The AI references these 
            during script generation to create content that sounds authentically like YOU.
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-2xl mx-auto">
            {["ICP Profile", "Voice DNA", "Brand Positioning", "Messaging House"].map((doc) => (
              <div key={doc} className="p-3 bg-background rounded-md">
                <span className="text-sm font-medium">{doc}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
