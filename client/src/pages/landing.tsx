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
  Feather,
  Menu,
  X,
  Users,
  Briefcase,
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
    icon: Target,
    title: "Purpose-Driven Planning",
    description: "Choose Authority, Education, or Storytelling to guide your entire video",
    longDescription: "Every great video starts with a clear purpose. Choose between Authority (bold opinions), Education (teachable methods), or Storytelling (personal experiences). Your choice shapes every question and suggestion throughout the process.",
    highlights: ["3 video purposes", "Guided questions", "Strategic focus"],
    image: viralHooksImg
  },
  {
    icon: FileText,
    title: "Content Skeleton Method",
    description: "Structure your ideas before you script: Problem, Core Teaching, Hook, CTA",
    longDescription: "The Content Skeleton forces you to think clearly before writing. Define the problem, craft your core teaching (the golden nugget), create a conversational hook, and choose your call to action. Clear thinking leads to clear videos.",
    highlights: ["4-step structure", "Prevents rambling", "Clear video flow"],
    image: smartScriptImg
  },
  {
    icon: Zap,
    title: "AI-Generated Hooks",
    description: "Conversational hooks that sound spoken, not like headlines",
    longDescription: "Our AI creates hooks that sound like you're talking to a friend, not writing a news headline. Natural, conversational openers that capture attention without feeling clickbaity or forced.",
    highlights: ["Conversational tone", "Multiple options", "Sounds natural"],
    image: knowledgeBaseImg
  },
  {
    icon: BookOpen,
    title: "Core Teaching Focus",
    description: "The golden nugget - the real value your viewers will remember",
    longDescription: "Most videos fail because they lack a clear teaching. We help you define the single insight that makes your video worth watching. This becomes the heart of your script, taking up 60-70% of your video.",
    highlights: ["Single key insight", "Real value delivery", "Memorable content"],
    image: voiceDnaImg
  },
  {
    icon: TrendingUp,
    title: "Clarity Score",
    description: "Reach 70% clarity before generating your script",
    longDescription: "Our clarity score validates your content skeleton. It catches vague language and ensures each section is specific enough. You can't generate a script until your ideas are truly clear.",
    highlights: ["Prevents vague content", "70% threshold", "Quality control"],
    image: deepResearchImg
  },
  {
    icon: Mic,
    title: "CTA Templates",
    description: "Save and reuse your best calls to action",
    longDescription: "Generate AI-powered CTAs based on your content, or save your best performing ones as templates. Build a library of proven calls to action you can reuse across all your videos.",
    highlights: ["AI suggestions", "Save favorites", "Reuse templates"],
    image: hemingwayImg
  }
];

const stats = [
  { value: "1K+", label: "Creators" },
  { value: "10K+", label: "Videos Planned" },
  { value: "70%", label: "Clarity Threshold" },
  { value: "4", label: "Step Process" }
];

const howItWorks = [
  {
    step: "01",
    title: "Choose Your Purpose",
    description: "Pick Authority, Education, or Storytelling. This shapes your entire video strategy."
  },
  {
    step: "02",
    title: "Build Your Skeleton",
    description: "Define the problem, craft your core teaching, create a hook, and choose your CTA."
  },
  {
    step: "03",
    title: "Reach 70% Clarity",
    description: "Our validation ensures your ideas are specific and clear before generating your script."
  },
  {
    step: "04",
    title: "Generate & Record",
    description: "Get a polished script that focuses on your core teaching. Copy and start filming."
  }
];

const faqs = [
  {
    question: "What makes this different from ChatGPT?",
    answer: "ChatGPT gives you a script. We help you think clearly first. Our Content Skeleton process ensures you know exactly what you're saying before you write it. The result is focused, valuable content instead of rambling AI-generated fluff."
  },
  {
    question: "What's the Content Skeleton?",
    answer: "It's a 4-part framework: Problem (what pain point you're addressing), Core Teaching (your golden nugget insight), Hook (conversational opener), and CTA (what you want viewers to do). Clear structure leads to clear videos."
  },
  {
    question: "What are the three video purposes?",
    answer: "Authority (bold opinions that position you as a thought leader), Education (teachable methods viewers can implement), and Storytelling (personal experiences with lessons). Each purpose guides the questions and suggestions you see."
  },
  {
    question: "What's the clarity score?",
    answer: "It's our validation system that checks if your content skeleton is specific enough. Vague ideas make vague videos. You need 70% clarity before generating a script."
  },
  {
    question: "Can I cancel anytime?",
    answer: "Yes, cancel anytime. No long-term contracts."
  }
];


const useCases = [
  {
    icon: Users,
    title: "Content Creators",
    description: "Stop rambling in your videos. Clarify your core teaching before you hit record.",
    benefit: "Clear, focused content"
  },
  {
    icon: Briefcase,
    title: "Business Owners",
    description: "Turn your expertise into structured videos. Choose Authority mode to share bold opinions that stand out.",
    benefit: "Thought leadership made easy"
  },
  {
    icon: Target,
    title: "Marketing Teams",
    description: "Give your team a framework for consistent video planning. Every video has a clear purpose and teaching.",
    benefit: "Consistent video strategy"
  },
  {
    icon: Mic,
    title: "Coaches & Consultants",
    description: "Use Education mode to create teachable content. Structure your frameworks so viewers can actually apply them.",
    benefit: "Actionable teaching"
  }
];

const comparisonFeatures = [
  { feature: "Purpose-driven planning", scriptPro: true, chatgpt: false, other: false },
  { feature: "Content Skeleton structure", scriptPro: true, chatgpt: false, other: false },
  { feature: "Clarity validation", scriptPro: true, chatgpt: false, other: false },
  { feature: "AI-generated conversational hooks", scriptPro: true, chatgpt: false, other: false },
  { feature: "Core teaching focus", scriptPro: true, chatgpt: false, other: false },
  { feature: "CTA generation & templates", scriptPro: true, chatgpt: false, other: false },
  { feature: "Short-form video optimized", scriptPro: true, chatgpt: false, other: true },
  { feature: "Platform-specific targeting", scriptPro: true, chatgpt: false, other: true },
  { feature: "Prevents vague content", scriptPro: true, chatgpt: false, other: false },
  { feature: "Teaches video strategy", scriptPro: true, chatgpt: false, other: false },
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
                  <Feather className="w-4 h-4 text-primary-foreground" />
                </div>
                <span className="text-sm font-semibold tracking-tight text-white">Viral Script Writer</span>
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
            <span className="text-[11px] font-medium text-[#b8bec1]">Clarity Creates Virality</span>
          </div>
          
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-semibold tracking-tight text-white mb-6 leading-[1.05]">
            <TypingText 
              words={["Clarify", "Structure", "Plan", "Focus"]} 
              className="text-primary"
            />
            {" "}Your Ideas<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-b from-white to-[#b8bec1]">Create Viral Scripts</span>
          </h1>
          
          <p className="mt-6 text-base md:text-lg text-[#b8bec1] max-w-xl mx-auto font-normal mb-10 leading-relaxed">
            Viral videos start with clear ideas. Our Content Skeleton process helps you think before you script, so every video delivers real value.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link href="/login">
              <Button size="lg" className="w-full sm:w-auto gap-2 shadow-[0_0_25px_-5px_rgba(233,13,65,0.4)]" data-testid="button-hero-start">
                Create Your Viral Script
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
            Think clearly before<br />
            <span className="text-[#b8bec1]">you start scripting</span>
          </h3>
          <p className="text-[#b8bec1] text-sm leading-relaxed mb-16 text-center max-w-xl mx-auto">
            The Content Skeleton process ensures every video delivers real value.
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
          <div className="hidden md:flex h-[550px] relative items-center justify-center mb-8" style={{ perspective: '1200px' }}>
            {features.slice(0, 3).map((feature, idx) => {
              const transforms = [
                'translateX(-280px) translateY(0px) rotateZ(-15deg) scale(0.92)',
                'translateX(0px) translateY(-20px) rotateZ(0deg) scale(1.08)',
                'translateX(280px) translateY(0px) rotateZ(15deg) scale(0.92)'
              ];
              const zIndexes = [1, 3, 2];
              const shadows = [
                'rgba(0, 0, 0, 0.4) 0px 20px 40px -10px',
                'rgba(233, 13, 65, 0.2) 0px 30px 60px -15px, rgba(0, 0, 0, 0.5) 0px 25px 50px -12px',
                'rgba(0, 0, 0, 0.4) 0px 20px 40px -10px'
              ];
              const floatAnimations = [
                'animate-[float-left_8s_linear_infinite]',
                'animate-[float-center_9s_linear_infinite]',
                'animate-[float-right_10s_linear_infinite]'
              ];
              
              return (
                <div 
                  key={idx}
                  onClick={() => setSelectedFeature(idx)}
                  className={`absolute w-80 aspect-[3/4] rounded-2xl bg-neutral-900/40 ring-1 ring-white/10 overflow-hidden shadow-2xl hover:scale-110 hover:rotate-0 transition-all duration-500 cursor-pointer group ${floatAnimations[idx]}`}
                  style={{ 
                    transform: transforms[idx], 
                    zIndex: zIndexes[idx],
                    boxShadow: shadows[idx]
                  }}
                  data-testid={`feature-card-${idx}`}
                >
                  <ImageWithSkeleton 
                    alt={feature.title}
                    className="absolute inset-0 size-full object-cover w-full h-auto group-hover:scale-115 transition-transform duration-700"
                    src={feature.image}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent" />
                  <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="w-10 h-10 rounded-full bg-primary/80 flex items-center justify-center animate-pulse">
                      <ArrowRight className="w-5 h-5 text-white" />
                    </div>
                  </div>
                  <div className="absolute bottom-5 left-5 right-5 flex items-end justify-between gap-3">
                    <div>
                      <p className="text-base font-semibold tracking-tight text-white mb-1">{feature.title}</p>
                      <p className="text-sm text-neutral-200 leading-snug">{feature.description}</p>
                    </div>
                    <div className="inline-flex items-center gap-1 rounded-full bg-primary/20 px-3 py-1.5 text-xs text-primary ring-1 ring-primary/30 flex-shrink-0">
                      <feature.icon className="h-4 w-4" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Desktop: Fanned Cards Row 2 */}
          <div className="hidden md:flex h-[550px] relative items-center justify-center" style={{ perspective: '1200px' }}>
            {features.slice(3, 6).map((feature, idx) => {
              const transforms = [
                'translateX(-280px) translateY(0px) rotateZ(-15deg) scale(0.92)',
                'translateX(0px) translateY(-20px) rotateZ(0deg) scale(1.08)',
                'translateX(280px) translateY(0px) rotateZ(15deg) scale(0.92)'
              ];
              const zIndexes = [1, 3, 2];
              const shadows = [
                'rgba(0, 0, 0, 0.4) 0px 20px 40px -10px',
                'rgba(233, 13, 65, 0.2) 0px 30px 60px -15px, rgba(0, 0, 0, 0.5) 0px 25px 50px -12px',
                'rgba(0, 0, 0, 0.4) 0px 20px 40px -10px'
              ];
              const floatAnimations = [
                'animate-[float-right_10s_linear_infinite]',
                'animate-[float-center_9s_linear_infinite]',
                'animate-[float-left_8s_linear_infinite]'
              ];
              
              return (
                <div 
                  key={idx + 3}
                  onClick={() => setSelectedFeature(idx + 3)}
                  className={`absolute w-80 aspect-[3/4] rounded-2xl bg-neutral-900/40 ring-1 ring-white/10 overflow-hidden shadow-2xl hover:scale-110 hover:rotate-0 transition-all duration-500 cursor-pointer group ${floatAnimations[idx]}`}
                  style={{ 
                    transform: transforms[idx], 
                    zIndex: zIndexes[idx],
                    boxShadow: shadows[idx]
                  }}
                  data-testid={`feature-card-${idx + 3}`}
                >
                  <ImageWithSkeleton 
                    alt={feature.title}
                    className="absolute inset-0 size-full object-cover w-full h-auto group-hover:scale-115 transition-transform duration-700"
                    src={feature.image}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent" />
                  <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="w-10 h-10 rounded-full bg-primary/80 flex items-center justify-center animate-pulse">
                      <ArrowRight className="w-5 h-5 text-white" />
                    </div>
                  </div>
                  <div className="absolute bottom-5 left-5 right-5 flex items-end justify-between gap-3">
                    <div>
                      <p className="text-base font-semibold tracking-tight text-white mb-1">{feature.title}</p>
                      <p className="text-sm text-neutral-200 leading-snug">{feature.description}</p>
                    </div>
                    <div className="inline-flex items-center gap-1 rounded-full bg-primary/20 px-3 py-1.5 text-xs text-primary ring-1 ring-primary/30 flex-shrink-0">
                      <feature.icon className="h-4 w-4" />
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
                Clear ideas in <br /> <span className="text-[#b8bec1]">4 simple steps.</span>
              </h3>
              <p className="text-[#b8bec1] text-sm leading-relaxed mb-8">
                We help you think before you write. The Content Skeleton process ensures every video has a clear purpose and delivers real value.
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
                      <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-primary/20 text-primary">Education</span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-medium border border-white/10 text-[#b8bec1]">Core Teaching</span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-white/5 text-[#b8bec1]">78% Clarity</span>
                    </div>
                    <div className="bg-white/5 rounded-md p-4 font-mono text-sm leading-relaxed">
                      <p className="text-primary font-medium mb-3">Problem: Creators ramble without a clear point</p>
                      <p className="text-[#b8bec1] mb-2">Core Teaching: Every video needs ONE golden nugget</p>
                      <p className="text-[#b8bec1] mb-2">Hook: You know why most videos don't work?</p>
                      <p className="text-[#b8bec1]">CTA: Save this for your next video...</p>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-[#b8bec1]">
                      <span className="flex items-center gap-1">
                        <Target className="w-3 h-3" /> 4 sections
                      </span>
                      <span className="flex items-center gap-1">
                        <TrendingUp className="w-3 h-3" /> 78% clarity
                      </span>
                      <span className="flex items-center gap-1 text-green-500">
                        <CheckCircle2 className="w-3 h-3" /> Ready to script
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
            How creators use Viral Script Writer
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
                          <Star className="w-3 h-3" />
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
            Why Viral Script Writer vs ChatGPT?
          </h3>
          <p className="text-[#b8bec1] text-sm leading-relaxed mb-12 text-center max-w-xl mx-auto">
            ChatGPT writes scripts. We help you think first.
          </p>

          <div className="rounded-2xl border border-white/[0.06] overflow-hidden bg-[rgba(20,20,22,0.4)] backdrop-blur-lg">
            {/* Table Header */}
            <div className="grid grid-cols-4 gap-4 p-4 border-b border-white/[0.06] bg-white/5">
              <div className="text-xs font-medium text-[#b8bec1]">Feature</div>
              <div className="text-xs font-medium text-primary text-center">Viral Script Writer</div>
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
                Try Viral Script Writer Free
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
            Ready to create your next viral video?
          </h2>
          <p className="text-[#b8bec1] text-base mb-10 max-w-xl mx-auto">
            Clear ideas create viral content. Start with the skeleton.
          </p>
          <Link href="/login">
            <Button size="lg" className="gap-2 shadow-[0_0_25px_-5px_rgba(233,13,65,0.4)]" data-testid="button-final-cta">
              Create Your Viral Script
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
              <Feather className="w-3 h-3 text-primary-foreground" />
            </div>
            <span className="text-sm font-medium text-white">Viral Script Writer</span>
          </div>
          <p className="text-xs text-[#b8bec1]">
            Clarity creates virality.
          </p>
        </div>
      </footer>
    </div>
  );
}
