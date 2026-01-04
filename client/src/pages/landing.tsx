import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
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
  X,
  Users,
  Briefcase,
  Quote,
  Check,
  XCircle,
  Star,
  Moon,
  Sun
} from "lucide-react";
import { Link } from "wouter";
import { pricingTiers } from "@shared/schema";
import { useState, useEffect, useCallback } from "react";
import { useTheme } from "@/components/theme-provider";

// Feature images - Gemini generated hyper-realistic visuals
import viralHooksImg from "@assets/Gemini_Generated_Image_l5rfhel5rfhel5rf_1766959322314.jpeg";
import smartScriptImg from "@assets/Gemini_Generated_Image_33o45v33o45v33o4_(1)_1766959353422.jpeg";
import knowledgeBaseImg from "@assets/Gemini_Generated_Image_zqsvjzqsvjzqsvjz_1766959397993.jpeg";
import voiceDnaImg from "@assets/Gemini_Generated_Image_do72nvdo72nvdo72_(1)_1766959412860.jpeg";
import deepResearchImg from "@assets/Gemini_Generated_Image_c69af2c69af2c69a_1766959451509.jpeg";
import hemingwayImg from "@assets/generated_images/hemingway_script_analysis_visualization.png";
import { SiTiktok, SiYoutube, SiInstagram, SiLinkedin, SiFacebook } from "react-icons/si";

// Image with loading skeleton
function ImageWithSkeleton({ src, alt, className }: { src: string; alt: string; className?: string }) {
  const [isLoaded, setIsLoaded] = useState(false);
  
  return (
    <>
      {!isLoaded && (
        <Skeleton className="absolute inset-0 w-full h-full bg-white/5" />
      )}
      <img 
        src={src}
        alt={alt}
        className={`${className} ${isLoaded ? 'opacity-100' : 'opacity-0'} transition-opacity duration-300`}
        onLoad={() => setIsLoaded(true)}
      />
    </>
  );
}

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
    description: "Battle-tested hooks that stop the scroll and demand attention",
    longDescription: "Access our library of 50+ proven hook templates across 7 categories: Personal Experience, Case Study, Secret Reveal, Contrarian, Question, List, and Education. Each hook is battle-tested on millions of views and optimized to capture attention in the first 3 seconds.",
    highlights: ["7 hook categories", "Tested on millions of views", "3-second attention capture"],
    image: viralHooksImg
  },
  {
    icon: FileText,
    title: "Smart Script Generation",
    description: "AI writes punchy, grade 4-6 level scripts that convert viewers",
    longDescription: "Our AI generates scripts at a 4th-6th grade reading level - the sweet spot for maximum engagement. No corporate jargon, no AI-sounding phrases. Just punchy, conversational scripts that feel authentic and convert viewers into followers.",
    highlights: ["Grade 4-6 reading level", "No AI-sounding phrases", "Optimized for conversion"],
    image: smartScriptImg
  },
  {
    icon: Target,
    title: "Knowledge Base",
    description: "Upload your ICP, brand voice, and messaging for personalized scripts",
    longDescription: "Upload your brand guidelines, ideal customer profile, and messaging documents. Our AI learns your unique voice and creates scripts that sound like you wrote them. Supports PDF, DOCX, and images with OCR - up to 10 files for Pro users.",
    highlights: ["PDF, DOCX & image support", "OCR for screenshots", "Up to 10 files"],
    image: knowledgeBaseImg
  },
  {
    icon: Mic,
    title: "Voice DNA Matching",
    description: "Scripts that sound like you, not a robot",
    longDescription: "Feed the AI examples of your best content and it learns your unique speaking patterns, vocabulary, and personality. Every script generated matches your authentic voice - your audience won't know the difference.",
    highlights: ["Learns your patterns", "Matches your vocabulary", "Authentic personality"],
    image: voiceDnaImg
  },
  {
    icon: BookOpen,
    title: "Deep Research Mode",
    description: "AI researches stats, quotes, and contrarian takes for your topic",
    longDescription: "Toggle Deep Research to have AI dig up relevant statistics, expert quotes, and contrarian angles for your topic. Add credibility and authority to your scripts with real data points that make viewers stop and save.",
    highlights: ["Real statistics", "Expert quotes", "Contrarian angles"],
    image: deepResearchImg
  },
  {
    icon: TrendingUp,
    title: "Hemingway Analysis",
    description: "Every script analyzed for readability and punch",
    longDescription: "Every script is analyzed using Hemingway-style metrics. See your grade level, sentence complexity, and get specific suggestions to make your writing punchier. Aim for that sweet spot that keeps viewers hooked.",
    highlights: ["Grade level scoring", "Sentence analysis", "Actionable suggestions"],
    image: hemingwayImg
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

const testimonials = [
  {
    name: "Sarah Chen",
    handle: "@sarahcreates",
    role: "Content Creator",
    followers: "1.2M followers",
    avatar: "SC",
    quote: "Went from struggling for hours to write one script to generating 10 viral-worthy hooks in minutes. My engagement tripled in the first month.",
    metric: "3x engagement"
  },
  {
    name: "Marcus Johnson",
    handle: "@marcusjfit",
    role: "Fitness Coach",
    followers: "450K followers",
    avatar: "MJ",
    quote: "The Hemingway analysis is a game-changer. Every script reads at the perfect level for social. My save rate is through the roof.",
    metric: "5x save rate"
  },
  {
    name: "Elena Rodriguez",
    handle: "@elenavlogs",
    role: "Travel Creator",
    followers: "890K followers",
    avatar: "ER",
    quote: "Finally, an AI that actually sounds like ME. The Voice DNA feature learned my style perfectly. My audience can't tell the difference.",
    metric: "2x posting frequency"
  }
];

const useCases = [
  {
    icon: Users,
    title: "Content Creators",
    description: "Generate scroll-stopping scripts that match your voice. Post more consistently without burning out.",
    benefit: "10x faster content creation"
  },
  {
    icon: Briefcase,
    title: "Business Owners",
    description: "Create thought leadership content that builds authority. Turn expertise into engaging short-form videos.",
    benefit: "Build audience on autopilot"
  },
  {
    icon: Target,
    title: "Marketing Teams",
    description: "Scale video content production while maintaining brand voice. Knowledge Base ensures consistency across creators.",
    benefit: "Consistent brand messaging"
  },
  {
    icon: Mic,
    title: "Coaches & Consultants",
    description: "Share your expertise in bite-sized, engaging formats. Deep Research adds credibility with real stats.",
    benefit: "Position as thought leader"
  }
];

const comparisonFeatures = [
  { feature: "Short-form video optimized", scriptPro: true, chatgpt: false, other: false },
  { feature: "50+ proven viral hooks", scriptPro: true, chatgpt: false, other: false },
  { feature: "Grade 4-6 readability", scriptPro: true, chatgpt: false, other: false },
  { feature: "Voice DNA matching", scriptPro: true, chatgpt: false, other: false },
  { feature: "Knowledge Base (brand docs)", scriptPro: true, chatgpt: false, other: true },
  { feature: "Production notes & B-roll", scriptPro: true, chatgpt: false, other: false },
  { feature: "Hemingway analysis", scriptPro: true, chatgpt: false, other: false },
  { feature: "Platform-specific targeting", scriptPro: true, chatgpt: false, other: true },
  { feature: "Deep research mode", scriptPro: true, chatgpt: true, other: false },
  { feature: "CTA library (30+)", scriptPro: true, chatgpt: false, other: false },
];

// Scroll animation hook
function useScrollAnimation() {
  const [visibleSections, setVisibleSections] = useState<Set<string>>(new Set());
  
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setVisibleSections((prev) => new Set(Array.from(prev).concat([entry.target.id])));
          }
        });
      },
      { threshold: 0.1, rootMargin: "0px 0px -50px 0px" }
    );
    
    const sections = document.querySelectorAll('[data-animate]');
    sections.forEach((section) => observer.observe(section));
    
    return () => observer.disconnect();
  }, []);
  
  return visibleSections;
}

export default function Landing() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [selectedFeature, setSelectedFeature] = useState<number | null>(null);
  const visibleSections = useScrollAnimation();
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close modal on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSelectedFeature(null);
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
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
              <button
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                className="p-2 rounded-md text-[#b8bec1] hover:text-white hover:bg-white/10 transition-colors"
                data-testid="button-theme-toggle-landing"
              >
                {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </button>
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
      <section className="relative z-20 -mt-24 px-6 mb-16">
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

      {/* Platform Logos */}
      <section 
        id="platforms" 
        data-animate
        className={`py-12 relative z-20 transition-all duration-700 ${visibleSections.has('platforms') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
      >
        <div className="max-w-4xl mx-auto px-6">
          <p className="text-center text-xs uppercase tracking-widest text-[#b8bec1]/60 mb-6">
            Optimized for all platforms
          </p>
          <div className="flex items-center justify-center gap-8 md:gap-12 flex-wrap">
            <div className="flex items-center gap-2 text-[#b8bec1]/60 hover:text-primary transition-colors" data-testid="platform-tiktok">
              <SiTiktok className="w-5 h-5 md:w-6 md:h-6" />
              <span className="text-sm font-medium">TikTok</span>
            </div>
            <div className="flex items-center gap-2 text-[#b8bec1]/60 hover:text-primary transition-colors" data-testid="platform-youtube">
              <SiYoutube className="w-5 h-5 md:w-6 md:h-6" />
              <span className="text-sm font-medium">Shorts</span>
            </div>
            <div className="flex items-center gap-2 text-[#b8bec1]/60 hover:text-primary transition-colors" data-testid="platform-instagram">
              <SiInstagram className="w-5 h-5 md:w-6 md:h-6" />
              <span className="text-sm font-medium">Reels</span>
            </div>
            <div className="flex items-center gap-2 text-[#b8bec1]/60 hover:text-primary transition-colors" data-testid="platform-linkedin">
              <SiLinkedin className="w-5 h-5 md:w-6 md:h-6" />
              <span className="text-sm font-medium">LinkedIn</span>
            </div>
            <div className="flex items-center gap-2 text-[#b8bec1]/60 hover:text-primary transition-colors" data-testid="platform-facebook">
              <SiFacebook className="w-5 h-5 md:w-6 md:h-6" />
              <span className="text-sm font-medium">Facebook</span>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section - Fanned Cards */}
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

          {/* Mobile: Grid Layout */}
          <div className="md:hidden grid grid-cols-1 sm:grid-cols-2 gap-6">
            {features.map((feature, idx) => (
              <div 
                key={idx}
                onClick={() => setSelectedFeature(idx)}
                className="aspect-[4/5] rounded-2xl bg-neutral-900/40 ring-1 ring-white/10 overflow-hidden shadow-2xl cursor-pointer group relative"
                data-testid={`feature-card-mobile-${idx}`}
              >
                <ImageWithSkeleton 
                  alt={feature.title}
                  className="absolute inset-0 size-full object-cover w-full h-full group-hover:scale-110 transition-transform duration-500"
                  src={feature.image}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
                <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="w-8 h-8 rounded-full bg-primary/80 flex items-center justify-center animate-pulse">
                    <ArrowRight className="w-4 h-4 text-white" />
                  </div>
                </div>
                <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between gap-2">
                  <div>
                    <p className="text-sm font-medium tracking-tight text-white">{feature.title}</p>
                    <p className="text-xs text-neutral-300">{feature.description}</p>
                  </div>
                  <div className="inline-flex items-center gap-1 rounded-full bg-primary/20 px-2 py-1 text-[10px] text-primary ring-1 ring-primary/30 flex-shrink-0">
                    <feature.icon className="h-3.5 w-3.5" />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop: Fanned Cards Row 1 */}
          <div className="hidden md:flex h-[500px] relative items-center justify-center mb-8" style={{ perspective: '1200px' }}>
            {features.slice(0, 3).map((feature, idx) => {
              const transforms = [
                'translateX(-220px) translateY(0px) rotateZ(-12deg) scale(0.95)',
                'translateX(0px) translateY(0px) rotateZ(0deg) scale(1.05)',
                'translateX(220px) translateY(0px) rotateZ(12deg) scale(0.95)'
              ];
              const zIndexes = [1, 3, 2];
              const shadows = [
                'rgba(0, 0, 0, 0.3) 0px 15px 30px -10px',
                'rgba(0, 0, 0, 0.5) 0px 25px 50px -12px',
                'rgba(0, 0, 0, 0.3) 0px 15px 30px -10px'
              ];
              
              return (
                <div 
                  key={idx}
                  onClick={() => setSelectedFeature(idx)}
                  className="absolute w-72 aspect-[3/4] rounded-2xl bg-neutral-900/40 ring-1 ring-white/10 overflow-hidden shadow-2xl hover:scale-105 transition-transform duration-300 cursor-pointer group"
                  style={{ 
                    transform: transforms[idx], 
                    zIndex: zIndexes[idx],
                    boxShadow: shadows[idx]
                  }}
                  data-testid={`feature-card-${idx}`}
                >
                  <ImageWithSkeleton 
                    alt={feature.title}
                    className="absolute inset-0 size-full object-cover w-full h-auto group-hover:scale-110 transition-transform duration-500"
                    src={feature.image}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
                  <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="w-8 h-8 rounded-full bg-primary/80 flex items-center justify-center animate-pulse">
                      <ArrowRight className="w-4 h-4 text-white" />
                    </div>
                  </div>
                  <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between gap-2">
                    <div>
                      <p className="text-sm font-medium tracking-tight text-white">{feature.title}</p>
                      <p className="text-xs text-neutral-300">{feature.description}</p>
                    </div>
                    <div className="inline-flex items-center gap-1 rounded-full bg-primary/20 px-2 py-1 text-[10px] text-primary ring-1 ring-primary/30 flex-shrink-0">
                      <feature.icon className="h-3.5 w-3.5" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Desktop: Fanned Cards Row 2 */}
          <div className="hidden md:flex h-[500px] relative items-center justify-center" style={{ perspective: '1200px' }}>
            {features.slice(3, 6).map((feature, idx) => {
              const transforms = [
                'translateX(-220px) translateY(0px) rotateZ(-12deg) scale(0.95)',
                'translateX(0px) translateY(0px) rotateZ(0deg) scale(1.05)',
                'translateX(220px) translateY(0px) rotateZ(12deg) scale(0.95)'
              ];
              const zIndexes = [1, 3, 2];
              const shadows = [
                'rgba(0, 0, 0, 0.3) 0px 15px 30px -10px',
                'rgba(0, 0, 0, 0.5) 0px 25px 50px -12px',
                'rgba(0, 0, 0, 0.3) 0px 15px 30px -10px'
              ];
              
              return (
                <div 
                  key={idx + 3}
                  onClick={() => setSelectedFeature(idx + 3)}
                  className="absolute w-72 aspect-[3/4] rounded-2xl bg-neutral-900/40 ring-1 ring-white/10 overflow-hidden shadow-2xl hover:scale-105 transition-transform duration-300 cursor-pointer group"
                  style={{ 
                    transform: transforms[idx], 
                    zIndex: zIndexes[idx],
                    boxShadow: shadows[idx]
                  }}
                  data-testid={`feature-card-${idx + 3}`}
                >
                  <ImageWithSkeleton 
                    alt={feature.title}
                    className="absolute inset-0 size-full object-cover w-full h-auto group-hover:scale-110 transition-transform duration-500"
                    src={feature.image}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
                  <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="w-8 h-8 rounded-full bg-primary/80 flex items-center justify-center animate-pulse">
                      <ArrowRight className="w-4 h-4 text-white" />
                    </div>
                  </div>
                  <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between gap-2">
                    <div>
                      <p className="text-sm font-medium tracking-tight text-white">{feature.title}</p>
                      <p className="text-xs text-neutral-300">{feature.description}</p>
                    </div>
                    <div className="inline-flex items-center gap-1 rounded-full bg-primary/20 px-2 py-1 text-[10px] text-primary ring-1 ring-primary/30 flex-shrink-0">
                      <feature.icon className="h-3.5 w-3.5" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Feature Modal */}
      {selectedFeature !== null && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          onClick={() => setSelectedFeature(null)}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm animate-[fadeIn_0.2s_ease-out]" />
          
          {/* Modal Content */}
          <div 
            onClick={(e) => e.stopPropagation()}
            className="relative max-w-2xl w-full bg-[#111] rounded-3xl overflow-hidden border border-white/10 shadow-2xl animate-[scaleIn_0.3s_ease-out]"
            style={{
              animation: 'scaleIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)'
            }}
          >
            {/* Close button */}
            <button 
              onClick={() => setSelectedFeature(null)}
              className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center text-white/70 hover:text-white hover:bg-black/70 transition-colors"
              data-testid="button-close-modal"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Feature Image */}
            <div className="relative h-48 overflow-hidden">
              <ImageWithSkeleton 
                src={features[selectedFeature].image}
                alt={features[selectedFeature].title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#111] via-transparent to-transparent" />
            </div>

            {/* Content */}
            <div className="p-8 -mt-8 relative">
              {/* Icon and Title */}
              <div className="flex items-start gap-4 mb-6">
                <div className="w-14 h-14 rounded-2xl bg-primary/20 flex items-center justify-center flex-shrink-0 ring-1 ring-primary/30">
                  {(() => {
                    const Icon = features[selectedFeature].icon;
                    return <Icon className="w-7 h-7 text-primary" />;
                  })()}
                </div>
                <div>
                  <h3 className="text-2xl font-semibold text-white mb-1">{features[selectedFeature].title}</h3>
                  <p className="text-sm text-[#b8bec1]">{features[selectedFeature].description}</p>
                </div>
              </div>

              {/* Long Description */}
              <p className="text-white/80 leading-relaxed mb-6">
                {features[selectedFeature].longDescription}
              </p>

              {/* Highlights */}
              <div className="flex flex-wrap gap-2 mb-6">
                {features[selectedFeature].highlights.map((highlight, idx) => (
                  <span 
                    key={idx}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-sm ring-1 ring-primary/20"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    {highlight}
                  </span>
                ))}
              </div>

              {/* CTA */}
              <Link href="/login">
                <Button className="w-full gap-2 shadow-[0_0_20px_-5px_rgba(233,13,65,0.3)]" data-testid="button-modal-cta">
                  Try {features[selectedFeature].title}
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Add animation keyframes */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes scaleIn {
          from { 
            opacity: 0; 
            transform: scale(0.9) translateY(20px); 
          }
          to { 
            opacity: 1; 
            transform: scale(1) translateY(0); 
          }
        }
      `}</style>

      {/* Testimonials Section */}
      <section 
        id="testimonials" 
        data-animate
        className={`py-24 relative overflow-hidden transition-all duration-700 ${visibleSections.has('testimonials') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
      >
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex items-center gap-2 mb-4 justify-center">
            <span className="h-px w-8 bg-primary" />
            <h2 className="text-xs font-semibold text-primary tracking-widest uppercase">Testimonials</h2>
            <span className="h-px w-8 bg-primary" />
          </div>
          <h3 className="text-3xl md:text-4xl font-semibold text-white mb-12 tracking-tight text-center">
            Creators love Script.Pro
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map((testimonial, idx) => (
              <div 
                key={idx}
                className="p-6 rounded-2xl bg-[rgba(20,20,22,0.4)] backdrop-blur-lg border border-white/[0.06] hover:border-primary/30 transition-all"
                data-testid={`testimonial-${idx}`}
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-semibold text-sm">
                    {testimonial.avatar}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">{testimonial.name}</p>
                    <p className="text-xs text-[#b8bec1]">{testimonial.handle}</p>
                  </div>
                </div>
                <Quote className="w-6 h-6 text-primary/30 mb-2" />
                <p className="text-sm text-[#b8bec1] leading-relaxed mb-4">
                  {testimonial.quote}
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-[#b8bec1]">{testimonial.followers}</span>
                  <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-green-500/10 text-green-400 text-xs font-medium">
                    <TrendingUp className="w-3 h-3" />
                    {testimonial.metric}
                  </span>
                </div>
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

      {/* Use Cases Section */}
      <section 
        id="use-cases" 
        data-animate
        className={`py-24 relative overflow-hidden transition-all duration-700 ${visibleSections.has('use-cases') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
      >
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex items-center gap-2 mb-4 justify-center">
            <span className="h-px w-8 bg-primary" />
            <h2 className="text-xs font-semibold text-primary tracking-widest uppercase">Use Cases</h2>
            <span className="h-px w-8 bg-primary" />
          </div>
          <h3 className="text-3xl md:text-4xl font-semibold text-white mb-6 tracking-tight text-center">
            How creators use Script.Pro
          </h3>
          <p className="text-[#b8bec1] text-sm leading-relaxed mb-12 text-center max-w-xl mx-auto">
            Whether you're building a personal brand or scaling content for clients.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {useCases.map((useCase, idx) => (
              <div 
                key={idx}
                className="p-6 rounded-2xl bg-[rgba(20,20,22,0.4)] backdrop-blur-lg border border-white/[0.06] hover:border-primary/30 transition-all group"
                data-testid={`usecase-${idx}`}
              >
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                  <useCase.icon className="w-5 h-5 text-primary" />
                </div>
                <h4 className="text-sm font-semibold text-white mb-2">{useCase.title}</h4>
                <p className="text-xs text-[#b8bec1] leading-relaxed mb-4">{useCase.description}</p>
                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-primary/10 text-primary text-xs">
                  <Zap className="w-3 h-3" />
                  {useCase.benefit}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-24 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-4xl sm:text-5xl font-medium text-white tracking-tight mb-6">
              Pricing Plans
            </h2>
            <p className="text-[#b8bec1] text-sm leading-relaxed mb-12">
              Start free. Upgrade when you're ready to scale.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {pricingTiers.map((tier) => (
              tier.popular ? (
                /* Featured Pro Card */
                <div 
                  key={tier.id}
                  className="border-primary/30 border ring-1 ring-primary/20 rounded-3xl p-2 relative backdrop-blur-xl bg-[#111]"
                  data-testid={`pricing-card-${tier.id}`}
                >
                  <div className="overflow-hidden bg-gradient-to-b from-white/[0.08] to-transparent rounded-2xl relative h-full flex flex-col">
                    {/* Radial glow */}
                    <div className="absolute inset-0">
                      <div className="absolute inset-0 bg-[radial-gradient(60%_80%_at_80%_0%,rgba(233,13,65,0.15),transparent_60%)]" />
                    </div>

                    <div className="p-6 relative flex flex-col h-full">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="text-xs font-bold uppercase tracking-[0.2em] text-primary">
                            {tier.name}
                          </div>
                          <div className="mt-2 flex items-end gap-2">
                            <div className="text-4xl font-medium tracking-tight text-white">
                              ${tier.price}
                            </div>
                            <div className="text-sm text-white/60">/mo</div>
                          </div>
                        </div>
                        <span className="inline-flex items-center gap-1 rounded-full bg-primary/20 px-2 py-1 text-[10px] font-medium text-primary ring-1 ring-primary/40">
                          <Sparkles className="w-3 h-3" />
                          Popular
                        </span>
                      </div>

                      <p className="text-white/60 text-xs mt-2">{tier.description}</p>

                      <Link href="/login" className="mt-6">
                        <Button 
                          className="w-full shadow-[0_4px_20px_rgba(233,13,65,0.3)] hover:scale-[1.02] transition-all"
                          data-testid={`button-pricing-${tier.id}`}
                        >
                          Upgrade to {tier.name}
                        </Button>
                      </Link>

                      <ul className="mt-8 space-y-4 text-sm text-white/80">
                        {tier.features.map((feature, idx) => (
                          <li key={idx} className="flex items-start gap-3">
                            <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0" />
                            <span>{feature}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              ) : (
                /* Standard Card */
                <div 
                  key={tier.id}
                  className="bg-[radial-gradient(circle_at_top_left,var(--tw-gradient-stops))] from-white/10 to-white/0 rounded-3xl p-6 backdrop-blur-xl relative border border-white/[0.06] hover:border-white/[0.12] transition-all"
                  data-testid={`pricing-card-${tier.id}`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-xs font-bold uppercase tracking-[0.2em] text-white/40">
                        {tier.name}
                      </div>
                      <div className="mt-2 flex items-end gap-2">
                        <div className="text-4xl font-medium tracking-tight text-white">
                          ${tier.price}
                        </div>
                        <div className="text-sm text-white/50">/mo</div>
                      </div>
                    </div>
                  </div>

                  <p className="text-white/50 text-xs mt-2">{tier.description}</p>

                  <Link href="/login" className="block mt-6">
                    <button className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-sm font-medium tracking-tight text-white hover:bg-white/10 transition-all">
                      Get Started
                    </button>
                  </Link>

                  <ul className="mt-6 space-y-3 text-sm text-white/60">
                    {tier.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-3">
                        <CheckCircle2 className="w-4 h-4 text-white/40 flex-shrink-0" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )
            ))}
          </div>
        </div>
      </section>

      {/* Comparison Table */}
      <section 
        id="comparison" 
        data-animate
        className={`py-24 relative overflow-hidden transition-all duration-700 ${visibleSections.has('comparison') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
      >
        <div className="max-w-4xl mx-auto px-6">
          <div className="flex items-center gap-2 mb-4 justify-center">
            <span className="h-px w-8 bg-primary" />
            <h2 className="text-xs font-semibold text-primary tracking-widest uppercase">Compare</h2>
            <span className="h-px w-8 bg-primary" />
          </div>
          <h3 className="text-3xl md:text-4xl font-semibold text-white mb-6 tracking-tight text-center">
            Why Script.Pro vs ChatGPT?
          </h3>
          <p className="text-[#b8bec1] text-sm leading-relaxed mb-12 text-center max-w-xl mx-auto">
            Generic AI isn't built for short-form video. We are.
          </p>

          <div className="rounded-2xl border border-white/[0.06] overflow-hidden bg-[rgba(20,20,22,0.4)] backdrop-blur-lg">
            {/* Table Header */}
            <div className="grid grid-cols-4 gap-4 p-4 border-b border-white/[0.06] bg-white/5">
              <div className="text-xs font-medium text-[#b8bec1]">Feature</div>
              <div className="text-xs font-medium text-primary text-center">Script.Pro</div>
              <div className="text-xs font-medium text-[#b8bec1] text-center">ChatGPT</div>
              <div className="text-xs font-medium text-[#b8bec1] text-center">Other Tools</div>
            </div>
            
            {/* Table Rows */}
            {comparisonFeatures.map((row, idx) => (
              <div 
                key={idx}
                className={`grid grid-cols-4 gap-4 p-4 ${idx !== comparisonFeatures.length - 1 ? 'border-b border-white/[0.06]' : ''}`}
                data-testid={`comparison-row-${idx}`}
              >
                <div className="text-sm text-white">{row.feature}</div>
                <div className="flex justify-center">
                  {row.scriptPro ? (
                    <Check className="w-5 h-5 text-green-400" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-400/50" />
                  )}
                </div>
                <div className="flex justify-center">
                  {row.chatgpt ? (
                    <Check className="w-5 h-5 text-green-400" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-400/50" />
                  )}
                </div>
                <div className="flex justify-center">
                  {row.other ? (
                    <Check className="w-5 h-5 text-green-400" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-400/50" />
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 text-center">
            <Link href="/login">
              <Button className="gap-2 shadow-[0_0_20px_-5px_rgba(233,13,65,0.3)]" data-testid="button-compare-cta">
                Try Script.Pro Free
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
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
