import { Button } from "@/components/ui/button";
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
  ChevronDown,
  Sparkles,
  Menu,
  X
} from "lucide-react";
import { Link } from "wouter";
import { pricingTiers } from "@shared/schema";
import { useState, useEffect, useCallback } from "react";

// Animated Typing Text Component
function TypingText({ words, className }: { words: string[]; className?: string }) {
  const [displayText, setDisplayText] = useState("");
  const [wordIndex, setWordIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);

  const typeSpeed = 100;
  const deleteSpeed = 50;
  const pauseTime = 2000;

  const tick = useCallback(() => {
    const currentWord = words[wordIndex];
    
    if (isDeleting) {
      setDisplayText(currentWord.substring(0, displayText.length - 1));
    } else {
      setDisplayText(currentWord.substring(0, displayText.length + 1));
    }
  }, [displayText, isDeleting, wordIndex, words]);

  useEffect(() => {
    const currentWord = words[wordIndex];
    let timeout: NodeJS.Timeout;

    if (!isDeleting && displayText === currentWord) {
      // Word complete, pause then start deleting
      timeout = setTimeout(() => setIsDeleting(true), pauseTime);
    } else if (isDeleting && displayText === "") {
      // Word deleted, move to next word
      setIsDeleting(false);
      setWordIndex((prev) => (prev + 1) % words.length);
    } else {
      // Continue typing or deleting
      timeout = setTimeout(tick, isDeleting ? deleteSpeed : typeSpeed);
    }

    return () => clearTimeout(timeout);
  }, [displayText, isDeleting, wordIndex, words, tick]);

  return (
    <span className={className}>
      {displayText}
      <span className="inline-block w-[3px] h-[1em] bg-current ml-1 animate-[blink-cursor_0.75s_step-end_infinite] align-middle" />
    </span>
  );
}

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

const stats = [
  { value: "1K+", label: "Creators" },
  { value: "50K+", label: "Scripts" },
  { value: "50+", label: "Hooks" },
  { value: "99%", label: "Uptime" }
];

const howItWorks = [
  {
    step: "01",
    title: "Set Your Parameters",
    description: "Choose your category, hook style, structure, and tone. Upload your brand documents to the Knowledge Base."
  },
  {
    step: "02",
    title: "Generate Your Script",
    description: "Our AI creates a punchy, scroll-stopping script optimized for your platform and duration."
  },
  {
    step: "03",
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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-[hsl(0,0%,4%)] text-[#b8bec1] font-sans overflow-x-hidden">
      {/* Ambient Background Glow */}
      <div className="fixed top-0 left-0 right-0 h-[600px] bg-[radial-gradient(circle_at_50%_0%,rgba(233,13,65,0.08),transparent_70%)] pointer-events-none z-0" />

      {/* Navigation */}
      <nav className={`fixed w-full z-50 transition-all duration-300 ${scrolled ? 'bg-[hsl(0,0%,4%)]/75 backdrop-blur-lg border-b border-white/[0.08]' : 'bg-transparent'}`}>
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link href="/">
              <div className="flex items-center gap-2 cursor-pointer group">
                <div className="w-7 h-7 rounded-md bg-primary flex items-center justify-center shadow-[0_0_15px_-3px_rgba(233,13,65,0.4)]">
                  <Sparkles className="w-4 h-4 text-primary-foreground" />
                </div>
                <span className="text-sm font-semibold tracking-tight text-white">Script<span className="text-primary">.</span>Pro</span>
              </div>
            </Link>
            
            {/* Desktop Menu */}
            <div className="hidden md:flex items-center gap-8">
              <a href="#features" className="text-xs font-medium text-[#b8bec1] hover:text-white transition-colors" data-testid="link-nav-features">Features</a>
              <a href="#method" className="text-xs font-medium text-[#b8bec1] hover:text-white transition-colors" data-testid="link-nav-method">Method</a>
              <a href="#pricing" className="text-xs font-medium text-[#b8bec1] hover:text-white transition-colors" data-testid="link-nav-pricing">Pricing</a>
              <a href="#faq" className="text-xs font-medium text-[#b8bec1] hover:text-white transition-colors" data-testid="link-nav-faq">FAQ</a>
            </div>

            {/* CTA */}
            <div className="hidden md:flex items-center gap-4">
              <Link href="/login">
                <span className="text-xs font-medium text-white hover:text-[#b8bec1] transition-colors cursor-pointer" data-testid="button-nav-login">Log in</span>
              </Link>
              <Link href="/login">
                <Button size="sm" className="shadow-[0_0_20px_-5px_rgba(233,13,65,0.3)]" data-testid="button-nav-start">
                  Start Free
                </Button>
              </Link>
            </div>

            {/* Mobile menu button */}
            <button 
              className="md:hidden text-[#b8bec1] hover:text-white"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              data-testid="button-mobile-menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-[hsl(0,0%,4%)] border-b border-white/5">
            <div className="px-4 pt-2 pb-4 space-y-1">
              <a href="#features" className="block px-3 py-2 text-sm font-medium text-white" data-testid="link-mobile-features">Features</a>
              <a href="#method" className="block px-3 py-2 text-sm font-medium text-[#b8bec1]" data-testid="link-mobile-method">Method</a>
              <a href="#pricing" className="block px-3 py-2 text-sm font-medium text-[#b8bec1]" data-testid="link-mobile-pricing">Pricing</a>
              <Link href="/login">
                <span className="block px-3 py-2 text-sm font-medium text-primary" data-testid="link-mobile-start">Start Free</span>
              </Link>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center pt-20 overflow-hidden">
        <div className="relative z-20 max-w-7xl mx-auto px-6 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/10 bg-white/5 backdrop-blur-sm mb-8 hover:border-primary/50 transition-colors cursor-default">
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-primary" />
            </span>
            <span className="text-[11px] font-medium text-[#b8bec1]">AI-Powered Script Generation</span>
          </div>
          
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-semibold tracking-tight text-white mb-6 leading-[1.05]">
            <TypingText 
              words={["Create", "Write", "Generate", "Craft"]} 
              className="text-primary"
            />
            {" "}Viral Scripts<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-b from-white to-[#b8bec1]">In Seconds</span>
          </h1>
          
          <p className="mt-6 text-base md:text-lg text-[#b8bec1] max-w-xl mx-auto font-normal mb-10 leading-relaxed">
            Stop staring at blank pages. Generate scroll-stopping scripts with proven hooks, optimized for readability, and personalized to your brand voice.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link href="/login">
              <Button size="lg" className="w-full sm:w-auto gap-2 shadow-[0_0_25px_-5px_rgba(233,13,65,0.4)]" data-testid="button-hero-start">
                Start Writing Scripts
                <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </Button>
            </Link>
            <Button size="lg" variant="outline" className="w-full sm:w-auto gap-2 bg-white/5 backdrop-blur-md border-white/10 hover:bg-white/10" data-testid="button-hero-demo">
              <Play className="w-4 h-4" />
              Watch Demo
            </Button>
          </div>
        </div>
        
        {/* Bottom Fade */}
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[hsl(0,0%,4%)] to-transparent z-10" />
      </section>

      {/* Stats Section */}
      <section className="relative z-20 -mt-24 px-6 mb-24">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {stats.map((stat, idx) => (
              <div 
                key={idx} 
                className="p-6 rounded-md text-center bg-[rgba(20,20,22,0.4)] backdrop-blur-lg border border-white/[0.06] hover:border-primary/30 hover:bg-[rgba(20,20,22,0.6)] transition-all"
                data-testid={`stat-card-${idx}`}
              >
                <h3 className="text-3xl md:text-4xl font-semibold text-white tracking-tight">{stat.value}</h3>
                <p className="text-[10px] text-[#b8bec1] uppercase tracking-widest mt-1 group-hover:text-primary transition-colors">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex items-center gap-2 mb-4 justify-center">
            <span className="h-px w-8 bg-primary" />
            <h2 className="text-xs font-semibold text-primary tracking-widest uppercase">Features</h2>
            <span className="h-px w-8 bg-primary" />
          </div>
          <h3 className="text-3xl md:text-4xl font-semibold text-white mb-6 tracking-tight text-center leading-tight">
            Everything you need to create<br />
            <span className="text-[#b8bec1]">winning short-form videos</span>
          </h3>
          <p className="text-[#b8bec1] text-sm leading-relaxed mb-16 text-center max-w-xl mx-auto">
            From hook to CTA, we handle the script. You handle the camera.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {features.map((feature, idx) => (
              <div 
                key={idx} 
                className="p-6 rounded-md bg-[rgba(20,20,22,0.4)] backdrop-blur-lg border border-white/[0.06] hover:border-primary/30 hover:bg-[rgba(20,20,22,0.6)] transition-all group"
                data-testid={`feature-card-${idx}`}
              >
                <div className="w-10 h-10 rounded-md bg-primary/10 flex items-center justify-center mb-4">
                  <feature.icon className="w-5 h-5 text-primary" />
                </div>
                <h4 className="font-semibold text-white mb-2">{feature.title}</h4>
                <p className="text-sm text-[#b8bec1]">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="method" className="py-24 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <span className="h-px w-8 bg-primary" />
                <h2 className="text-xs font-semibold text-primary tracking-widest uppercase">The Method</h2>
              </div>
              <h3 className="text-3xl md:text-4xl font-semibold text-white mb-6 tracking-tight leading-tight">
                Scripts in under <br /> <span className="text-[#b8bec1]">60 seconds.</span>
              </h3>
              <p className="text-[#b8bec1] text-sm leading-relaxed mb-8">
                We've engineered a system that turns your ideas into viral-ready scripts. No more writer's block. No more wasted hours.
              </p>
              
              <div className="space-y-6">
                {howItWorks.map((step, idx) => (
                  <div key={idx} className="flex items-start gap-4 group" data-testid={`step-${idx}`}>
                    <span className="text-primary bg-primary/10 px-2 py-1 rounded text-xs font-semibold">{step.step}</span>
                    <div>
                      <h4 className="text-sm font-semibold text-white mb-1">{step.title}</h4>
                      <p className="text-xs text-[#b8bec1] leading-relaxed">{step.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Preview Card */}
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-t from-[hsl(0,0%,4%)] via-transparent to-transparent z-10 pointer-events-none" />
              <div className="rounded-lg border border-white/[0.06] bg-[rgba(20,20,22,0.4)] backdrop-blur-lg p-2">
                <div className="rounded-md bg-[hsl(0,0%,4%)] border border-white/[0.06] overflow-hidden">
                  <div className="flex items-center gap-2 px-4 py-3 border-b border-white/[0.06]">
                    <div className="w-3 h-3 rounded-full bg-red-500/60" />
                    <div className="w-3 h-3 rounded-full bg-yellow-500/60" />
                    <div className="w-3 h-3 rounded-full bg-green-500/60" />
                  </div>
                  <div className="p-6 space-y-4">
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-primary/20 text-primary">Content Creation</span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-medium border border-white/10 text-[#b8bec1]">Personal Hook</span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-white/5 text-[#b8bec1]">60 seconds</span>
                    </div>
                    <div className="bg-white/5 rounded-md p-4 font-mono text-sm leading-relaxed">
                      <p className="text-primary font-medium mb-3">I made $47,000 in 30 days.</p>
                      <p className="text-[#b8bec1] mb-2">And it started with a single video.</p>
                      <p className="text-[#b8bec1] mb-2">Here's what nobody tells you about going viral.</p>
                      <p className="text-[#b8bec1]">The algorithm doesn't care about perfection...</p>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-[#b8bec1]">
                      <span className="flex items-center gap-1">
                        <FileText className="w-3 h-3" /> 142 words
                      </span>
                      <span className="flex items-center gap-1">
                        <TrendingUp className="w-3 h-3" /> Grade 5
                      </span>
                      <span className="flex items-center gap-1 text-green-500">
                        <CheckCircle2 className="w-3 h-3" /> Ready
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-24 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex items-center gap-2 mb-4 justify-center">
            <span className="h-px w-8 bg-primary" />
            <h2 className="text-xs font-semibold text-primary tracking-widest uppercase">Pricing</h2>
            <span className="h-px w-8 bg-primary" />
          </div>
          <h3 className="text-3xl md:text-4xl font-semibold text-white mb-6 tracking-tight text-center leading-tight">
            Scalable pricing
          </h3>
          <p className="text-[#b8bec1] text-sm leading-relaxed mb-16 text-center">
            Start free. Upgrade when you're ready.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-5xl mx-auto">
            {pricingTiers.map((tier) => (
              <div 
                key={tier.id} 
                className={`relative p-6 rounded-md backdrop-blur-lg border transition-all ${
                  tier.popular 
                    ? 'bg-[rgba(233,13,65,0.05)] border-primary/50 ring-1 ring-primary/20' 
                    : 'bg-[rgba(20,20,22,0.4)] border-white/[0.06] hover:border-primary/30'
                }`}
                data-testid={`pricing-card-${tier.id}`}
              >
                {tier.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="px-3 py-1 rounded-full text-[10px] font-semibold bg-primary text-white">Most Popular</span>
                  </div>
                )}
                <h4 className="font-semibold text-white mb-1">{tier.name}</h4>
                <p className="text-[#b8bec1] text-xs mb-4">{tier.description}</p>
                <div className="mb-6">
                  <span className="text-4xl font-semibold text-white">${tier.price}</span>
                  <span className="text-[#b8bec1] text-sm">/mo</span>
                </div>
                <Link href="/login">
                  <Button 
                    className={`w-full mb-6 ${tier.popular ? 'shadow-[0_0_20px_-5px_rgba(233,13,65,0.3)]' : ''}`}
                    variant={tier.popular ? "default" : "outline"}
                    data-testid={`button-pricing-${tier.id}`}
                  >
                    Get Started
                  </Button>
                </Link>
                <ul className="space-y-3">
                  {tier.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-xs text-[#b8bec1]">
                      <CheckCircle2 className="w-3 h-3 text-primary mt-0.5 flex-shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-24 relative overflow-hidden">
        <div className="max-w-3xl mx-auto px-6">
          <div className="flex items-center gap-2 mb-4 justify-center">
            <span className="h-px w-8 bg-primary" />
            <h2 className="text-xs font-semibold text-primary tracking-widest uppercase">FAQ</h2>
            <span className="h-px w-8 bg-primary" />
          </div>
          <h3 className="text-3xl md:text-4xl font-semibold text-white mb-12 tracking-tight text-center">
            Still have questions?
          </h3>

          <div className="space-y-3">
            {faqs.map((faq, idx) => (
              <div 
                key={idx}
                className="rounded-md border border-white/[0.06] overflow-hidden bg-[rgba(20,20,22,0.4)] backdrop-blur-lg"
              >
                <button
                  className="w-full flex items-center justify-between p-4 text-left hover:bg-white/5 transition-colors"
                  onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                  data-testid={`button-faq-${idx}`}
                >
                  <span className="text-sm font-medium text-white">{faq.question}</span>
                  <ChevronDown className={`w-4 h-4 text-[#b8bec1] transition-transform ${openFaq === idx ? 'rotate-180' : ''}`} />
                </button>
                {openFaq === idx && (
                  <div className="px-4 pb-4 text-sm text-[#b8bec1] leading-relaxed">
                    {faq.answer}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(233,13,65,0.08),transparent_70%)] pointer-events-none" />
        <div className="max-w-4xl mx-auto px-6 text-center relative z-10">
          <h2 className="text-3xl md:text-5xl font-semibold text-white mb-6 tracking-tight">
            Ready to create viral scripts?
          </h2>
          <p className="text-[#b8bec1] text-base mb-10 max-w-xl mx-auto">
            Join thousands of creators who save hours every week.
          </p>
          <Link href="/login">
            <Button size="lg" className="gap-2 shadow-[0_0_25px_-5px_rgba(233,13,65,0.4)]" data-testid="button-final-cta">
              Start Writing Scripts
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6 border-t border-white/[0.06]">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-primary flex items-center justify-center">
              <Sparkles className="w-3 h-3 text-primary-foreground" />
            </div>
            <span className="text-sm font-medium text-white">Script<span className="text-primary">.</span>Pro</span>
          </div>
          <p className="text-xs text-[#b8bec1]">
            Built for content creators who want to grow.
          </p>
        </div>
      </footer>
    </div>
  );
}
