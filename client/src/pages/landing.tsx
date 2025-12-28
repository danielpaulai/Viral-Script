import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Zap, 
  FileText, 
  Target, 
  Mic, 
  BookOpen, 
  TrendingUp,
  CheckCircle2,
  ArrowRight,
  Play,
  Star,
  ChevronDown,
  Sparkles,
  Clock,
  Users,
  BarChart3
} from "lucide-react";
import { Link } from "wouter";
import { pricingTiers } from "@shared/schema";
import { useState } from "react";

const features = [
  {
    icon: Zap,
    title: "50+ Viral Hooks",
    description: "Battle-tested hooks that stop the scroll and demand attention"
  },
  {
    icon: FileText,
    title: "Smart Script Generation",
    description: "AI writes punchy, grade 4-6 level scripts that convert viewers"
  },
  {
    icon: Target,
    title: "Knowledge Base",
    description: "Upload your ICP, brand voice, and messaging for personalized scripts"
  },
  {
    icon: Mic,
    title: "Voice DNA Matching",
    description: "Scripts that sound like you, not a robot"
  },
  {
    icon: BookOpen,
    title: "Deep Research Mode",
    description: "AI researches stats, quotes, and contrarian takes for your topic"
  },
  {
    icon: TrendingUp,
    title: "Hemingway Analysis",
    description: "Every script analyzed for readability and punch"
  }
];

const howItWorks = [
  {
    step: "1",
    title: "Set Your Parameters",
    description: "Choose your category, hook style, structure, and tone. Upload your brand documents to the Knowledge Base."
  },
  {
    step: "2",
    title: "Generate Your Script",
    description: "Our AI creates a punchy, scroll-stopping script optimized for your platform and duration."
  },
  {
    step: "3",
    title: "Review & Refine",
    description: "Get word count, grade level analysis, B-roll ideas, and production notes. Copy and post."
  }
];

const faqs = [
  {
    question: "What makes these scripts different from ChatGPT?",
    answer: "Our scripts are specifically optimized for short-form video. They're written at a grade 4-6 reading level, use proven viral hooks, and include production notes. No corporate jargon or AI-sounding phrases."
  },
  {
    question: "What's the Knowledge Base?",
    answer: "The Knowledge Base stores your brand documents - ICP profiles, messaging, positioning, voice DNA. The AI references these when writing scripts, so every script sounds like you."
  },
  {
    question: "What file types can I upload?",
    answer: "PDF, DOCX, images (with OCR text extraction), and plain text files. Upload up to 10 files at once."
  },
  {
    question: "How long are the scripts?",
    answer: "You choose! 15 seconds to 3 minutes. The AI targets the right word count for each duration and optimizes for your platform."
  },
  {
    question: "Can I cancel anytime?",
    answer: "Yes, cancel anytime. No long-term contracts."
  }
];

export default function Landing() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border bg-background/80 backdrop-blur-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="font-bold text-xl">Script Writer Pro</span>
            </div>
            <div className="flex items-center gap-4">
              <Link href="/login">
                <Button variant="ghost" data-testid="button-nav-login">Log In</Button>
              </Link>
              <Link href="/login">
                <Button data-testid="button-nav-signup">Get Started</Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-4xl mx-auto mb-12">
            <Badge variant="secondary" className="mb-4">
              AI-Powered Script Generation
            </Badge>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
              Create <span className="text-primary">viral short-form</span><br />
              scripts in seconds
            </h1>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Stop staring at blank pages. Generate scroll-stopping scripts with proven hooks, 
              optimized for readability, and personalized to your brand voice.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/login">
                <Button size="lg" className="gap-2" data-testid="button-hero-start">
                  Start Writing Scripts
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
              <Button size="lg" variant="outline" className="gap-2" data-testid="button-hero-demo">
                <Play className="w-4 h-4" />
                Watch Demo
              </Button>
            </div>
          </div>

          {/* Product Preview */}
          <div className="relative max-w-5xl mx-auto">
            <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent z-10 pointer-events-none" />
            <div className="rounded-xl border border-border bg-card p-2 shadow-2xl">
              <div className="rounded-lg bg-background border border-border overflow-hidden">
                <div className="flex items-center gap-2 px-4 py-3 border-b border-border">
                  <div className="w-3 h-3 rounded-full bg-destructive/60" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500/60" />
                  <div className="w-3 h-3 rounded-full bg-green-500/60" />
                </div>
                <div className="p-6 space-y-4">
                  <div className="flex items-center gap-3 flex-wrap">
                    <Badge>Content Creation</Badge>
                    <Badge variant="outline">Personal Experience Hook</Badge>
                    <Badge variant="secondary">60 seconds</Badge>
                  </div>
                  <div className="bg-muted/50 rounded-lg p-4 font-mono text-sm leading-relaxed">
                    <p className="text-primary font-medium mb-3">I made $47,000 in 30 days.</p>
                    <p className="text-muted-foreground mb-2">And it started with a single video.</p>
                    <p className="text-muted-foreground mb-2">Here's what nobody tells you about going viral.</p>
                    <p className="text-muted-foreground">The algorithm doesn't care about perfection...</p>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <FileText className="w-4 h-4" /> 142 words
                    </span>
                    <span className="flex items-center gap-1">
                      <BarChart3 className="w-4 h-4" /> Grade 5
                    </span>
                    <span className="flex items-center gap-1">
                      <CheckCircle2 className="w-4 h-4 text-green-500" /> Ready to record
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 border-t border-border">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Everything you need to create<br />
              winning short-form videos
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              From hook to CTA, we handle the script. You handle the camera.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, idx) => (
              <Card key={idx} className="bg-card border-card-border">
                <CardContent className="p-6">
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                    <feature.icon className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="font-semibold text-lg mb-2">{feature.title}</h3>
                  <p className="text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 px-4 bg-card/50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">How it works</h2>
            <p className="text-muted-foreground text-lg">
              Scripts are simple. Here's how to get one in under a minute.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {howItWorks.map((step, idx) => (
              <div key={idx} className="text-center">
                <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold text-primary">{step.step}</span>
                </div>
                <h3 className="font-semibold text-lg mb-2">{step.title}</h3>
                <p className="text-muted-foreground">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Social Proof */}
      <section className="py-20 px-4 border-t border-border">
        <div className="max-w-7xl mx-auto text-center">
          <div className="flex items-center justify-center gap-1 mb-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <Star key={i} className="w-5 h-5 fill-yellow-500 text-yellow-500" />
            ))}
          </div>
          <p className="text-muted-foreground mb-8">Trusted by creators and brands</p>
          <div className="flex items-center justify-center gap-8 flex-wrap opacity-60">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              <span className="font-medium">1000+ creators</span>
            </div>
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              <span className="font-medium">50,000+ scripts</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              <span className="font-medium">Hours saved daily</span>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-20 px-4 bg-card/50" id="pricing">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">Scalable pricing</h2>
            <p className="text-muted-foreground text-lg">
              Start free. Upgrade when you're ready.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {pricingTiers.map((tier) => (
              <Card 
                key={tier.id} 
                className={`relative ${tier.popular ? 'border-primary ring-1 ring-primary' : 'border-card-border'}`}
              >
                {tier.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="bg-primary">Most Popular</Badge>
                  </div>
                )}
                <CardContent className="p-6">
                  <h3 className="font-semibold text-lg mb-1">{tier.name}</h3>
                  <p className="text-muted-foreground text-sm mb-4">{tier.description}</p>
                  <div className="mb-6">
                    <span className="text-4xl font-bold">${tier.price}</span>
                    <span className="text-muted-foreground">/mo</span>
                  </div>
                  <Link href="/login">
                    <Button 
                      className="w-full mb-6" 
                      variant={tier.popular ? "default" : "outline"}
                      data-testid={`button-pricing-${tier.id}`}
                    >
                      Get Started
                    </Button>
                  </Link>
                  <ul className="space-y-3">
                    {tier.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm">
                        <CheckCircle2 className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 px-4 border-t border-border">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">Still have questions?</h2>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, idx) => (
              <div 
                key={idx}
                className="border border-border rounded-lg overflow-hidden"
              >
                <button
                  className="w-full flex items-center justify-between p-4 text-left hover-elevate"
                  onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                  data-testid={`button-faq-${idx}`}
                >
                  <span className="font-medium">{faq.question}</span>
                  <ChevronDown className={`w-5 h-5 transition-transform ${openFaq === idx ? 'rotate-180' : ''}`} />
                </button>
                {openFaq === idx && (
                  <div className="px-4 pb-4 text-muted-foreground">
                    {faq.answer}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 px-4 bg-gradient-to-b from-card/50 to-background">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            Ready to create viral scripts?
          </h2>
          <p className="text-muted-foreground text-lg mb-8">
            Join thousands of creators who save hours every week.
          </p>
          <Link href="/login">
            <Button size="lg" className="gap-2" data-testid="button-final-cta">
              Start Writing Scripts
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 border-t border-border">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-primary flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-medium">Script Writer Pro</span>
          </div>
          <p className="text-sm text-muted-foreground">
            Built for content creators who want to grow.
          </p>
        </div>
      </footer>
    </div>
  );
}
