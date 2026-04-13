import { useState, useMemo, useEffect, useRef } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  scriptCategories,
  viralHooks,
  hookCategories,
  structureFormats,
  platformOptions,
  durationOptions,
  quickPresets,
  ctaCategories,
  ctaOptions,
  videoTypes,
  creatorStyles,
  creatorNiches,
  extendedCreatorStyles,
  allCreatorStyles,
  ctaLibrary,
  funnelStages,
  type ScriptParameters,
  type GeneratedScript,
  type ContentSkeleton,
  type ContentSection,
  type ResearchFact,
  type VideoIdeaSkeleton,
} from "@shared/schema";
import { ScriptOutput } from "@/components/script-output";
import { GenerationProgress, type StreamProgress } from "@/components/generation-progress";
import { IdeaClarifier } from "@/components/idea-clarifier";
import { SkeletonEnhancer } from "@/components/skeleton-enhancer";
import type { EnhancedSkeleton } from "@shared/schema";
import { useVoiceCommand } from "@/hooks/use-voice-command";
import { useStream, useDraftAutoSave, getSavedDraft, clearSavedDraft } from "@/hooks/use-stream";
import { 
  Wand2, 
  ArrowRight, 
  Zap,
  Lightbulb, 
  TrendingUp, 
  Cpu, 
  Heart,
  Search,
  ChevronDown,
  ChevronUp,
  ChevronRight,
  Clock,
  Eye,
  RotateCcw,
  Target,
  BookOpen,
  Mic,
  MicOff,
  Film,
  Type,
  Bot,
  Monitor,
  Layers,
  Globe,
  Gamepad2,
  DollarSign,
  Flame,
  Building2,
  MessageCircle,
  FileText,
  Briefcase,
  GraduationCap,
  Wallet,
  Dumbbell,
  Users,
  Star,
  Lock,
  Unlock,
  Plus,
  X,
  Check,
  Edit3,
  Trash2,
  Loader2,
  ExternalLink,
  ChevronLeft,
  Sparkles,
  CheckCircle,
  Quote,
  ArrowDown,
  Volume2,
} from "lucide-react";
import { SiTiktok, SiInstagram, SiYoutube } from "react-icons/si";

const presetIcons: Record<string, typeof Zap> = {
  business_growth: TrendingUp,
  ai_tech: Cpu,
  viral_growth: Zap,
  personal_brand: Heart,
};

const videoTypeIcons: Record<string, typeof Mic> = {
  talking_head: Mic,
  broll_voiceover: Film,
  text_on_screen: Type,
  ai_avatar: Bot,
  screen_recording: Monitor,
  mixed_format: Layers,
};

const creatorStyleIcons: Record<string, typeof Target> = {
  default: Target,
  nas_daily: Globe,
  mrbeast: Gamepad2,
  alex_hormozi: DollarSign,
  gary_vee: Flame,
  ali_abdaal: BookOpen,
  codie_sanchez: Building2,
  steven_bartlett: MessageCircle,
  hormozi: DollarSign,
  garyvee: Flame,
  codie: Building2,
  bartlett: MessageCircle,
  nasdaily: Globe,
  aliabdaal: BookOpen,
  jayshetty: Star,
  ramit: Wallet,
  viviantu: Wallet,
  humphrey: Wallet,
  chrisheria: Dumbbell,
  jeffnippard: Dumbbell,
  chloeting: Dumbbell,
  joeyswoll: Dumbbell,
  simonsinek: Users,
  melrobbins: Flame,
};

const nicheIcons: Record<string, typeof Briefcase> = {
  business: Briefcase,
  education: GraduationCap,
  finance: Wallet,
  fitness: Dumbbell,
  lifestyle: Star,
};

const platformWordTargets: Record<string, { min: number; max: number; label: string }> = {
  "15": { min: 30, max: 45, label: "15s" },
  "30": { min: 60, max: 90, label: "30s" },
  "60": { min: 120, max: 180, label: "60s" },
  "90": { min: 180, max: 270, label: "90s" },
  "180": { min: 360, max: 540, label: "3min" },
};

// Expanded Brief interface for Deep Research
interface ExpandedBrief {
  coreMessage: string;
  targetViewer: string;
  uniqueAngle: string;
  keyProofPoints: string[];
  actionableTakeaway: string;
}

interface CompetitorInsights {
  topHooks: string[];
  avgViews: number;
  avgLikes: number;
  postsAnalyzed: number;
}

// Viral Examples from TikTok
interface ViralExample {
  id: string;
  fullCaption: string;
  hookLine: string;
  views: number;
  likes: number;
  comments: number;
  shares: number;
  engagementRate: number;
  author: string;
  estimatedWordCount: number;
  formatType: string;
  hookType: string;
  videoUrl: string;
}

interface ViralExamplesResult {
  examples: ViralExample[];
  topicKeyword: string;
  avgViews: number;
  avgEngagement: number;
  dominantFormats: string[];
  dominantHookTypes: string[];
  bestPerformingDuration: string;
}

interface ScriptTemplateSummary {
  id: string;
  name: string;
  description?: string | null;
  platform: string;
  duration: string;
  category: string;
  structure: string;
  hook: string;
  tone?: string | null;
  voice?: string | null;
  pacing?: string | null;
  videoType?: string | null;
  creatorStyle?: string | null;
  defaultTargetAudience?: string | null;
  defaultCta?: string | null;
}

function VoiceInputButton({ onTranscript }: { onTranscript: (text: string) => void }) {
  const { isListening, isSupported, transcript, toggleListening } = useVoiceCommand({
    onResult: (text) => {
      onTranscript(text.trim());
    },
  });

  if (!isSupported) return null;

  return (
    <Button
      type="button"
      size="icon"
      variant="ghost"
      onClick={toggleListening}
      className={`absolute right-2 top-2 ${isListening ? "text-red-500 animate-pulse" : "text-muted-foreground"}`}
      title={isListening ? "Stop listening" : "Speak your idea"}
      data-testid="button-voice-input"
    >
      {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
    </Button>
  );
}

export default function Home() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [generatedScript, setGeneratedScript] = useState<GeneratedScript | null>(null);
  const [batchScripts, setBatchScripts] = useState<GeneratedScript[]>([]);
  const [activePreset, setActivePreset] = useState<string | null>(null);
  const [deepResearch, setDeepResearch] = useState(false);
  const [includeCompetitorResearch, setIncludeCompetitorResearch] = useState(false);
  const [useKnowledgeBase, setUseKnowledgeBase] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [hoveredPreset, setHoveredPreset] = useState<string | null>(null);
  const [expandedBrief, setExpandedBrief] = useState<ExpandedBrief | null>(null);
  const [showBriefEditor, setShowBriefEditor] = useState(false);
  const [competitorInsights, setCompetitorInsights] = useState<CompetitorInsights | null>(null);
  const [contentSkeleton, setContentSkeleton] = useState<ContentSkeleton | null>(null);
  const [isSkeletonLocked, setIsSkeletonLocked] = useState(false);
  const [viralExamples, setViralExamples] = useState<ViralExamplesResult & { platform?: string } | null>(null);
  const [showViralExamples, setShowViralExamples] = useState(false);
  const [viralSearchPlatform, setViralSearchPlatform] = useState<"tiktok" | "instagram" | null>(null);
  
  // New 3-step flow: Viral Script Writer
  // Step 1: Build skeleton, Step 2: Enhance with research, Step 3: Generate script
  type FlowStep = "skeleton" | "enhance" | "script";
  const [currentStep, setCurrentStep] = useState<FlowStep>("skeleton");
  const [videoSkeleton, setVideoSkeleton] = useState<VideoIdeaSkeleton | null>(null);
  const [enhancedSkeleton, setEnhancedSkeleton] = useState<EnhancedSkeleton | null>(null);
  const [showLegacyFlow, setShowLegacyFlow] = useState(false);
  
  const proxyImageUrl = (url: string) => {
    if (!url) return "";
    if (url.startsWith("/") || url.startsWith("data:")) return url;
    return `/api/image-proxy?url=${encodeURIComponent(url)}`;
  };

  // Video Clone Feature - Step 1 Method Selection
  type CreationMethod = "choose" | "scratch" | "clone";
  const [creationMethod, setCreationMethod] = useState<CreationMethod>("choose");
  const [cloneVideoUrl, setCloneVideoUrl] = useState("");
  const [clonedStructure, setClonedStructure] = useState<any>(null);
  const [isAnalyzingClone, setIsAnalyzingClone] = useState(false);
  
  // Clone Template Flow - simplified 2-step process
  type CloneStep = "template" | "generate";
  const [cloneStep, setCloneStep] = useState<CloneStep>("template");
  const [cloneTemplateTopic, setCloneTemplateTopic] = useState("");
  const [cloneSectionInputs, setCloneSectionInputs] = useState<Record<string, string>>({});
  const [showOriginalTranscript, setShowOriginalTranscript] = useState(false);
  const [cloneGeneratedHooks, setCloneGeneratedHooks] = useState<Array<{id: string, hook: string, reasoning: string}>>([]);
  const [isGeneratingCloneHooks, setIsGeneratingCloneHooks] = useState(false);
  const [selectedCloneHookId, setSelectedCloneHookId] = useState<string | null>(null);
  const [cloneGeneratedCtas, setCloneGeneratedCtas] = useState<Array<{cta: string, category: string, rationale: string}>>([]);
  const [isGeneratingCloneCtas, setIsGeneratingCloneCtas] = useState(false);
  const [selectedCloneCtaIndex, setSelectedCloneCtaIndex] = useState<number | null>(null);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("");
  const [batchSortMode, setBatchSortMode] = useState<"quality" | "duration" | "words">("quality");
  const [lockedVoiceReference, setLockedVoiceReference] = useState<{ scriptId: string; scriptText: string; label: string } | null>(null);

  const [formData, setFormData] = useState<ScriptParameters>({
    topic: "",
    targetAudience: "",
    callToAction: "",
    selectedCtaId: "",
    customCta: "",
    keyFacts: "",
    platform: "tiktok",
    duration: "90",
    category: "content_creation",
    structure: "problem_solver",
    hook: "painful_past",
    deepResearch: false,
    videoType: "talking_head",
    creatorStyle: "default",
    referenceScript: "",
  });

  // Load template settings from sessionStorage when navigating from Templates page
  useEffect(() => {
    const storedSettings = sessionStorage.getItem("templateSettings");
    if (storedSettings) {
      try {
        const settings = JSON.parse(storedSettings);
        setFormData(prev => ({
          ...prev,
          platform: settings.platform || prev.platform,
          duration: settings.duration || prev.duration,
          category: settings.category || prev.category,
          structure: settings.structure || prev.structure,
          hook: settings.hook || prev.hook,
          videoType: settings.videoType || prev.videoType,
          creatorStyle: settings.creatorStyle || prev.creatorStyle,
          targetAudience: settings.targetAudience || prev.targetAudience,
          callToAction: settings.callToAction || prev.callToAction,
        }));
        // Clear after loading
        sessionStorage.removeItem("templateSettings");
      } catch (e) {
        console.error("Failed to parse template settings:", e);
      }
    }
  }, []);

  const { data: recentScripts = [] } = useQuery<any>({
    queryKey: ["/api/scripts"],
    select: (data) => {
      const scriptsArray = Array.isArray(data) ? data : ((data as any)?.items ?? []);
      if (!Array.isArray(scriptsArray)) return [];
      return scriptsArray.slice(0, 3).map((script: any) => {
        let parsedParams = script.parameters;
        if (typeof parsedParams === 'string') {
          try {
            parsedParams = JSON.parse(parsedParams);
          } catch {
            parsedParams = {};
          }
        }
        return {
          ...script,
          wordCount: typeof script.wordCount === 'string' ? parseInt(script.wordCount, 10) || 0 : (script.wordCount ?? 0),
          gradeLevel: typeof script.gradeLevel === 'string' ? parseFloat(script.gradeLevel) || 0 : (script.gradeLevel ?? 0),
          parameters: parsedParams ?? {},
        };
      });
    },
  });

  const { data: knowledgeBaseDocs = [] } = useQuery<any[]>({
    queryKey: ["/api/knowledge-base"],
    enabled: !!user, // Only fetch if authenticated
  });

  const { data: subscriptionData } = useQuery<{ plan: string; status: string }>({
    queryKey: ["/api/user/subscription"],
    enabled: !!user,
  });
  const userPlan = subscriptionData?.plan || "starter";

  const { data: templates = [] } = useQuery<ScriptTemplateSummary[]>({
    queryKey: ["/api/templates"],
    enabled: !!user,
  });

  // Streaming state
  const { stream, isStreaming, cancel: cancelStream } = useStream();
  const [streamProgress, setStreamProgress] = useState<StreamProgress | null>(null);

  // Draft auto-save: save formData + deepResearch every 5s
  const draftData = useMemo(
    () => ({ formData, deepResearch, useKnowledgeBase } as Record<string, unknown>),
    [formData, deepResearch, useKnowledgeBase]
  );
  useDraftAutoSave("script_form", draftData, 5000);

  // Restore draft on first load
  useEffect(() => {
    const draft = getSavedDraft("script_form") as { formData?: ScriptParameters; deepResearch?: boolean; useKnowledgeBase?: boolean } | null;
    if (draft?.formData && draft.formData.topic) {
      setFormData(prev => ({ ...prev, ...draft.formData }));
      if (typeof draft.deepResearch === "boolean") setDeepResearch(draft.deepResearch);
      if (typeof draft.useKnowledgeBase === "boolean") setUseKnowledgeBase(draft.useKnowledgeBase);
    }
  // Only run once on mount
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Wrapper for backward-compat with generateMutation pattern
  const [hasGenerationError, setHasGenerationError] = useState(false);
  const generateMutation = {
    isPending: isStreaming,
    isError: hasGenerationError,
    mutate: (params: ScriptParameters) => {
      setHasGenerationError(false);
      setStreamProgress({ event: "start", message: "Starting...", progress: 5 });
      stream("/api/scripts/generate-stream", params as unknown as Record<string, unknown>, {
        onProgress: (update) => {
          setStreamProgress({ event: update.event, message: update.message, progress: update.progress });
        },
        onComplete: (data) => {
          const script = data as unknown as GeneratedScript;
          setGeneratedScript(script);
          setExpandedBrief(null);
          setShowBriefEditor(false);
          setStreamProgress(null);
          setHasGenerationError(false);
          clearSavedDraft("script_form");
          queryClient.invalidateQueries({ queryKey: ['/api/user/trial-status'] });
          queryClient.invalidateQueries({ queryKey: ['/api/user/usage'] });
          toast({ title: "Script Ready!", description: "Your video script has been generated." });
        },
        onError: (error) => {
          setStreamProgress(null);
          setHasGenerationError(true);
          const errorMessages: Record<string, string> = {
            AI_RATE_LIMITED: "AI is overloaded right now. Wait a few seconds and try again.",
            AI_TOKEN_LIMIT: "Your topic is too complex. Try a simpler topic or shorter duration.",
            GENERATION_TIMEOUT: "Generation timed out. Try a shorter script duration.",
            INVALID_TOPIC: "Please enter a topic of at least 5 characters.",
            QUOTA_EXCEEDED: "You've hit your monthly limit. Upgrade to Pro for more scripts.",
          };
          toast({
            title: "Generation Failed",
            description: errorMessages[error.code] || error.message || "Failed to generate script. Please try again.",
            variant: "destructive",
          });
        },
        onCancel: () => {
          setStreamProgress(null);
          setHasGenerationError(false);
          toast({ title: "Cancelled", description: "Script generation was cancelled." });
        },
      });
    },
  };

  const batchGenerateMutation = useMutation({
    mutationFn: async (params: ScriptParameters) => {
      const res = await apiRequest("POST", "/api/scripts/generate-batch", params);
      return res.json();
    },
    onSuccess: (data: { count: number; scripts: GeneratedScript[] }) => {
      const scripts = data?.scripts || [];
      setBatchScripts(scripts);
      setStreamProgress(null);
      if (scripts.length > 0) {
        const bestScript = [...scripts].sort((a, b) => (b.qualityReport?.overallScore || 0) - (a.qualityReport?.overallScore || 0))[0];
        setGeneratedScript(bestScript || scripts[0]);
      }
      queryClient.invalidateQueries({ queryKey: ['/api/user/trial-status'] });
      queryClient.invalidateQueries({ queryKey: ['/api/user/usage'] });
      toast({
        title: "Batch Ready",
        description: `Generated ${scripts.length} script variations.`,
      });
    },
    onError: (error: any) => {
      setStreamProgress(null);
      const msg = error?.message || "Failed to generate script variations.";
      toast({
        title: "Batch Generation Failed",
        description: msg,
        variant: "destructive",
      });
    },
  });

  const saveTemplateMutation = useMutation({
    mutationFn: async () => {
      const templateName = `${formData.category.replace(/_/g, " ")} • ${formData.duration}s • ${formData.platform}`;
      const res = await apiRequest("POST", "/api/templates", {
        name: templateName,
        description: `Quick-saved from generator (${new Date().toLocaleDateString()})`,
        platform: formData.platform,
        duration: formData.duration,
        category: formData.category,
        structure: formData.structure,
        hook: formData.hook,
        tone: formData.tone || null,
        voice: formData.voice || null,
        pacing: formData.pacing || null,
        videoType: formData.videoType || "talking_head",
        creatorStyle: formData.creatorStyle || "default",
        defaultTargetAudience: formData.targetAudience || null,
        defaultCta: formData.customCta || formData.callToAction || null,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/templates"] });
      toast({ title: "Template Saved", description: "Current settings were saved as a reusable template." });
    },
    onError: () => {
      toast({
        title: "Save Failed",
        description: "Could not save this template right now.",
        variant: "destructive",
      });
    },
  });

  // Topic expansion for Deep Research mode
  const expandTopicMutation = useMutation({
    mutationFn: async ({ topic, targetAudience, includeCompetitorResearch }: { topic: string; targetAudience?: string; includeCompetitorResearch?: boolean }) => {
      const res = await apiRequest("POST", "/api/scripts/expand-topic", { topic, targetAudience, includeCompetitorResearch });
      return res.json();
    },
    onSuccess: (data: { expandedBrief: ExpandedBrief; competitorInsights?: CompetitorInsights }) => {
      setExpandedBrief(data.expandedBrief);
      setShowBriefEditor(true);
      if (data.competitorInsights) {
        setCompetitorInsights(data.competitorInsights);
      }
      toast({
        title: data.competitorInsights ? "Research Complete" : "Topic Expanded",
        description: data.competitorInsights 
          ? `Analyzed ${data.competitorInsights.postsAnalyzed} competitor posts.`
          : "Review your video brief below.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to expand topic. Try again.",
        variant: "destructive",
      });
    },
  });

  // Content Skeleton generation for enhanced Deep Research mode
  const skeletonMutation = useMutation({
    mutationFn: async ({ topic, targetAudience, includeCompetitorResearch, viralExamplesData }: { 
      topic: string; 
      targetAudience?: string; 
      includeCompetitorResearch?: boolean;
      viralExamplesData?: ViralExamplesResult | null;
    }) => {
      const res = await apiRequest("POST", "/api/scripts/generate-skeleton", { 
        topic, 
        targetAudience, 
        includeCompetitorResearch,
        viralExamples: viralExamplesData,
      });
      return res.json();
    },
    onSuccess: (data: { skeleton: ContentSkeleton; originalTopic: string }) => {
      setContentSkeleton(data.skeleton);
      setIsSkeletonLocked(false);
      toast({
        title: "Outline Generated",
        description: "Review and edit your content skeleton below.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to generate outline. Try again.",
        variant: "destructive",
      });
    },
  });

  // Viral Examples - fetch top TikTok/Instagram captions for inspiration
  const viralExamplesMutation = useMutation({
    mutationFn: async ({ topic, limit = 5, platform = "tiktok" }: { topic: string; limit?: number; platform?: "tiktok" | "instagram" }) => {
      setViralSearchPlatform(platform);
      const endpoint = platform === "instagram" ? "/api/viral-examples/instagram" : "/api/viral-examples";
      const res = await apiRequest("POST", endpoint, { topic, limit });
      return res.json();
    },
    onSuccess: (data: ViralExamplesResult & { success: boolean; platform?: string }) => {
      setViralSearchPlatform(null);
      if (data.success) {
        setViralExamples(data);
        setShowViralExamples(true);
        toast({
          title: `${data.platform === "instagram" ? "Instagram" : "TikTok"} Viral Examples Found`,
          description: `Found ${data.examples.length} top-performing captions for inspiration.`,
        });
      }
    },
    onError: (error: any) => {
      setViralSearchPlatform(null);
      toast({
        title: "Error",
        description: error?.message || "Failed to fetch viral examples.",
        variant: "destructive",
      });
    },
  });

  // Update a section in the skeleton
  const updateSkeletonSection = (sectionId: string, updates: Partial<ContentSection>) => {
    if (!contentSkeleton) return;
    setContentSkeleton({
      ...contentSkeleton,
      sections: contentSkeleton.sections.map(s => 
        s.id === sectionId ? { ...s, ...updates } : s
      ),
    });
  };

  // Toggle a fact's usage status
  const toggleFactUsed = (factId: string) => {
    if (!contentSkeleton) return;
    setContentSkeleton({
      ...contentSkeleton,
      researchFacts: contentSkeleton.researchFacts.map(f =>
        f.id === factId ? { ...f, isUsed: !f.isUsed } : f
      ),
    });
  };

  // Add a key moment to a section
  const addKeyMoment = (sectionId: string) => {
    if (!contentSkeleton) return;
    setContentSkeleton({
      ...contentSkeleton,
      sections: contentSkeleton.sections.map(s => 
        s.id === sectionId ? { ...s, keyMoments: [...s.keyMoments, "New key point..."] } : s
      ),
    });
  };

  // Remove a key moment from a section
  const removeKeyMoment = (sectionId: string, momentIndex: number) => {
    if (!contentSkeleton) return;
    setContentSkeleton({
      ...contentSkeleton,
      sections: contentSkeleton.sections.map(s => 
        s.id === sectionId ? { ...s, keyMoments: s.keyMoments.filter((_, i) => i !== momentIndex) } : s
      ),
    });
  };

  // Update a key moment
  const updateKeyMoment = (sectionId: string, momentIndex: number, value: string) => {
    if (!contentSkeleton) return;
    setContentSkeleton({
      ...contentSkeleton,
      sections: contentSkeleton.sections.map(s => 
        s.id === sectionId ? { 
          ...s, 
          keyMoments: s.keyMoments.map((m, i) => i === momentIndex ? value : m) 
        } : s
      ),
    });
  };

  // Add a new section
  const addSection = () => {
    if (!contentSkeleton) return;
    const newSection: ContentSection = {
      id: `section-${Date.now()}`,
      title: "New Section",
      objective: "Define the objective for this section",
      suggestedDuration: "15s",
      keyMoments: ["Add key points here"],
    };
    setContentSkeleton({
      ...contentSkeleton,
      sections: [...contentSkeleton.sections, newSection],
    });
  };

  // Remove a section
  const removeSection = (sectionId: string) => {
    if (!contentSkeleton || contentSkeleton.sections.length <= 1) return;
    setContentSkeleton({
      ...contentSkeleton,
      sections: contentSkeleton.sections.filter(s => s.id !== sectionId),
    });
  };

  // Update a suggested hook
  const updateSuggestedHook = (index: number, value: string) => {
    if (!contentSkeleton) return;
    setContentSkeleton({
      ...contentSkeleton,
      suggestedHooks: contentSkeleton.suggestedHooks.map((h, i) => i === index ? value : h),
    });
  };

  // Add a suggested hook
  const addSuggestedHook = () => {
    if (!contentSkeleton) return;
    setContentSkeleton({
      ...contentSkeleton,
      suggestedHooks: [...contentSkeleton.suggestedHooks, "New hook idea..."],
    });
  };

  // Remove a suggested hook
  const removeSuggestedHook = (index: number) => {
    if (!contentSkeleton) return;
    setContentSkeleton({
      ...contentSkeleton,
      suggestedHooks: contentSkeleton.suggestedHooks.filter((_, i) => i !== index),
    });
  };

  const handlePresetClick = (presetId: string) => {
    const preset = quickPresets.find((p) => p.id === presetId);
    if (preset) {
      setActivePreset(presetId);
      // Preserve videoType, creatorStyle, and referenceScript when applying presets
      setFormData(prev => ({
        ...prev,
        topic: preset.sampleTopic,
        targetAudience: preset.sampleAudience,
        callToAction: preset.sampleCta,
        keyFacts: preset.sampleFacts,
        platform: "tiktok",
        duration: "90",
        category: preset.category,
        hook: preset.hook,
        structure: preset.structure,
        tone: preset.tone,
        voice: preset.voice,
        deepResearch: false,
      }));
    }
  };

  // New: Handle skeleton completion from IdeaClarifier - Move to Step 2 (Enhancement)
  const handleSkeletonComplete = (skeleton: VideoIdeaSkeleton) => {
    setVideoSkeleton(skeleton);
    setCurrentStep("enhance"); // Go to enhancement step instead of direct generation
  };

  // Handle going back from enhancement to skeleton editing
  const handleBackToSkeleton = () => {
    setCurrentStep("skeleton");
  };

  // Handle enhancement completion - now generate the script
  const handleEnhancementComplete = (enhanced: EnhancedSkeleton) => {
    setEnhancedSkeleton(enhanced);
    setCurrentStep("script");
    
    // Convert enhanced skeleton to formData and generate
    const skeleton = enhanced.baseSkeleton;
    setFormData(prev => ({
      ...prev,
      topic: `${skeleton.hook.content}\n\n${skeleton.problem.content}\n\n${skeleton.solution.content}`,
      targetAudience: skeleton.targetAudience,
      callToAction: skeleton.cta.content,
      platform: skeleton.platform,
      duration: skeleton.duration,
      structure: "problem_solver",
    }));
    
    // Generate with enhanced data
    generateFromEnhancedSkeleton(enhanced);
  };

  // Generate script from enhanced skeleton with research data
  const generateFromEnhancedSkeleton = (enhanced: EnhancedSkeleton) => {
    const skeleton = enhanced.baseSkeleton;
    const params: ScriptParameters = {
      topic: skeleton.rawIdea || skeleton.hook.content,
      targetAudience: skeleton.targetAudience,
      callToAction: skeleton.cta.content,
      platform: skeleton.platform,
      duration: skeleton.duration,
      category: "content_creation",
      structure: "problem_solver",
      hook: "custom",
      deepResearch: !!enhanced.research, // Enable if we have research
      includeCompetitorResearch,
      videoType: formData.videoType || "talking_head",
      creatorStyle: formData.creatorStyle || "default",
    };
    
    // Include the enhanced skeleton data with research and insights
    const enhancedPayload = {
      videoIdeaSkeleton: {
        hook: skeleton.hook.content,
        problem: skeleton.problem.content,
        solution: skeleton.solution.content,
        cta: skeleton.cta.content,
        targetAudience: skeleton.targetAudience,
        isLocked: true,
      },
      researchInsights: enhanced.research ? {
        coreMessage: enhanced.research.coreMessage,
        uniqueAngle: enhanced.research.uniqueAngle,
        keyProofPoints: enhanced.research.keyProofPoints,
        actionableTakeaway: enhanced.research.actionableTakeaway,
      } : undefined,
      selectedInsights: enhanced.selectedInsights,
      additionalNotes: enhanced.additionalNotes,
      competitorData: enhanced.competitorAnalysis ? {
        topHooks: enhanced.competitorAnalysis.topHooks.slice(0, 3),
        avgViews: enhanced.competitorAnalysis.engagementStats.avgViews,
      } : undefined,
      // Include cloned video structure if user analyzed a video
      clonedVideoStructure: clonedStructure?.analysis || undefined,
    };
    
    generateMutation.mutate({ ...params, ...enhancedPayload });
  };

  // Generate script from locked skeleton
  const generateFromSkeleton = (skeleton: VideoIdeaSkeleton) => {
    const params: ScriptParameters = {
      topic: skeleton.rawIdea || skeleton.hook.content,
      targetAudience: skeleton.targetAudience,
      callToAction: skeleton.cta.content,
      platform: skeleton.platform,
      duration: skeleton.duration,
      category: "content_creation",
      structure: "problem_solver",
      hook: "custom",
      deepResearch: false,
      includeCompetitorResearch,
      videoType: formData.videoType || "talking_head",
      creatorStyle: formData.creatorStyle || "default",
    };
    
    // Include the locked skeleton data
    const skeletonPayload = {
      videoIdeaSkeleton: {
        hook: skeleton.hook.content,
        problem: skeleton.problem.content,
        solution: skeleton.solution.content,
        cta: skeleton.cta.content,
        targetAudience: skeleton.targetAudience,
        isLocked: true,
      },
      // Include cloned video structure if user analyzed a video
      clonedVideoStructure: clonedStructure?.analysis || undefined,
    };
    
    generateMutation.mutate({ ...params, ...skeletonPayload });
  };

  const buildGenerationPayload = (): ScriptParameters => {
    const skeletonData = isSkeletonLocked && contentSkeleton ? {
      contentSkeleton: {
        topicSummary: contentSkeleton.topicSummary,
        targetAudience: formData.targetAudience || "",
        uniqueAngle: contentSkeleton.uniqueAngle,
        sections: contentSkeleton.sections.map(s => ({
          id: s.id,
          title: s.title,
          objective: s.objective,
          suggestedDuration: s.suggestedDuration,
          keyMoments: s.keyMoments.filter(m => m.trim() && m !== "New key point..."),
        })),
        researchFacts: contentSkeleton.researchFacts.filter(f => f.isUsed),
        suggestedHooks: contentSkeleton.suggestedHooks,
        isLocked: true,
      }
    } : {};

    const cloneData = clonedStructure?.analysis ? {
      clonedVideoStructure: clonedStructure.analysis,
    } : {};

    const voiceReferenceData = lockedVoiceReference ? {
      voiceReferenceScript: lockedVoiceReference.scriptText,
    } : {};

    return { ...formData, deepResearch, includeCompetitorResearch, useKnowledgeBase, ...skeletonData, ...cloneData, ...voiceReferenceData };
  };

  const handleGenerate = () => {
    if (!formData.topic.trim()) {
      toast({
        title: "Topic Required",
        description: "Please enter a topic or video idea.",
        variant: "destructive",
      });
      return;
    }

    setBatchScripts([]);
    generateMutation.mutate(buildGenerationPayload());
  };

  const handleGenerateBatch = () => {
    if (!formData.topic.trim()) {
      toast({
        title: "Topic Required",
        description: "Please enter a topic or video idea.",
        variant: "destructive",
      });
      return;
    }

    setStreamProgress({ event: "generation_progress", message: "Generating 3 variations...", progress: 25 });
    batchGenerateMutation.mutate({
      ...buildGenerationPayload(),
      batchCount: 3,
    });
  };

  const applySelectedTemplate = () => {
    if (!selectedTemplateId) return;
    const template = templates.find(t => t.id === selectedTemplateId);
    if (!template) return;

    setFormData(prev => ({
      ...prev,
      platform: template.platform || prev.platform,
      duration: template.duration || prev.duration,
      category: template.category || prev.category,
      structure: template.structure || prev.structure,
      hook: template.hook || prev.hook,
      tone: template.tone || prev.tone,
      voice: template.voice || prev.voice,
      pacing: template.pacing || prev.pacing,
      videoType: template.videoType || prev.videoType,
      creatorStyle: template.creatorStyle || prev.creatorStyle,
      targetAudience: template.defaultTargetAudience || prev.targetAudience,
      callToAction: template.defaultCta || prev.callToAction,
      customCta: template.defaultCta || prev.customCta,
    }));

    toast({ title: "Template Applied", description: `${template.name} is now active.` });
  };

  const currentHook = useMemo(() => {
    return viralHooks.find(h => h.id === formData.hook);
  }, [formData.hook]);

  const sortedBatchScripts = useMemo(() => {
    const scripts = [...batchScripts];
    if (batchSortMode === "duration") {
      const target = Number(formData.duration) || 60;
      return scripts.sort((a, b) => {
        const aDelta = Math.abs((a.qualityReport?.estimatedSeconds || target) - target);
        const bDelta = Math.abs((b.qualityReport?.estimatedSeconds || target) - target);
        return aDelta - bDelta;
      });
    }

    if (batchSortMode === "words") {
      return scripts.sort((a, b) => b.wordCount - a.wordCount);
    }

    return scripts.sort((a, b) => (b.qualityReport?.overallScore || 0) - (a.qualityReport?.overallScore || 0));
  }, [batchScripts, batchSortMode, formData.duration]);

  const liveHookPreview = useMemo(() => {
    if (!currentHook) return null;
    let preview: string = currentHook.example;
    if (formData.topic && formData.topic.length > 10) {
      const shortTopic = formData.topic.split(" ").slice(0, 5).join(" ");
      preview = currentHook.template.replace(/\[.*?\]/g, shortTopic);
    }
    return preview;
  }, [currentHook, formData.topic]);

  const wordTarget = platformWordTargets[formData.duration] || platformWordTargets["60"];
  const actualWordCount = generatedScript?.wordCount || 0;
  const wordProgress = actualWordCount > 0 ? Math.min(100, (actualWordCount / wordTarget.max) * 100) : 0;

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto pb-24 md:pb-6">
      <div className="mb-6 text-center">
        <h1 className="text-xl md:text-2xl font-bold text-foreground mb-1" data-testid="text-page-title">
          Clarify Your Video Idea
        </h1>
        <p className="text-sm text-muted-foreground">
          Better inputs = Better scripts. Structure your idea first.
        </p>
      </div>

      {!!user && (
        <Card className="mb-4 p-3 border-border bg-muted/30">
          <div className="flex flex-col md:flex-row items-stretch md:items-end gap-2">
            <div className="flex-1">
              <Label className="text-xs font-medium mb-1 block uppercase tracking-wider">Quick Template</Label>
              <Select value={selectedTemplateId || "none"} onValueChange={(value) => setSelectedTemplateId(value === "none" ? "" : value)}>
                <SelectTrigger data-testid="select-home-template">
                  <SelectValue placeholder={templates.length ? "Choose a saved template..." : "No templates yet"} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {templates.map((template) => (
                    <SelectItem key={template.id} value={template.id}>
                      {template.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={applySelectedTemplate}
                disabled={!selectedTemplateId}
                data-testid="button-apply-home-template"
              >
                Apply
              </Button>
              <Button
                variant="outline"
                onClick={() => saveTemplateMutation.mutate()}
                disabled={saveTemplateMutation.isPending}
                data-testid="button-save-home-template"
              >
                {saveTemplateMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4 mr-2" />
                    Save Current as Template
                  </>
                )}
              </Button>
            </div>
          </div>
        </Card>
      )}

      {lockedVoiceReference && (
        <Card className="mb-4 p-3 border-primary/30 bg-primary/5">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div>
              <p className="text-xs font-semibold text-primary uppercase tracking-wider">Using Winning Voice</p>
              <p className="text-sm text-foreground">New scripts will follow the feel of {lockedVoiceReference.label}.</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setLockedVoiceReference(null)}
              data-testid="button-clear-locked-voice"
            >
              <X className="w-4 h-4 mr-2" />
              Clear Voice Lock
            </Button>
          </div>
        </Card>
      )}

      {/* New: 3-Step Video Idea Flow */}
      {!showLegacyFlow && !generatedScript && (
        <div className="mb-6">
          {/* Step 0: Choose Creation Method */}
          {creationMethod === "choose" && (
            <div className="max-w-2xl mx-auto">
              <div className="text-center mb-6">
                <h2 className="text-xl font-bold mb-2">How do you want to create your script?</h2>
                <p className="text-sm text-muted-foreground">Choose your starting point</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Option 1: Create from Scratch */}
                <button
                  onClick={() => setCreationMethod("scratch")}
                  className="p-6 rounded-xl border-2 border-border bg-card hover-elevate text-left transition-all group"
                  data-testid="button-method-scratch"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                      <Wand2 className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg">Create from Scratch</h3>
                      <p className="text-xs text-muted-foreground">Build your own unique script</p>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Start with your idea and let the AI guide you through building a complete video script with hooks, structure, and CTA.
                  </p>
                </button>

                {/* Option 2: Clone Video Format */}
                <button
                  onClick={() => {
                    // Reset all clone-related state for fresh start
                    setClonedStructure(null);
                    setCloneVideoUrl("");
                    setCloneStep("template");
                    setCloneTemplateTopic("");
                    setCloneSectionInputs({});
                    setShowOriginalTranscript(false);
                    setCreationMethod("clone");
                  }}
                  className="p-6 rounded-xl border-2 border-primary bg-primary/10 hover-elevate text-left transition-all group relative overflow-visible shadow-lg shadow-primary/20"
                  data-testid="button-method-clone"
                >
                  <div className="absolute -top-2 -right-2 px-2 py-0.5 bg-primary rounded-full text-[10px] font-bold text-primary-foreground uppercase tracking-wider">
                    Hot
                  </div>
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-14 h-14 rounded-full bg-primary flex items-center justify-center">
                      <ExternalLink className="w-7 h-7 text-primary-foreground" />
                    </div>
                    <div>
                      <h3 className="font-bold text-xl text-foreground">Clone Video Format</h3>
                      <p className="text-xs text-primary">Copy what's already working</p>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Paste a viral TikTok, Instagram, or YouTube video URL. The AI will analyze its structure and create your script in the same format.
                  </p>
                </button>
              </div>
            </div>
          )}

          {/* Clone Video Flow */}
          {creationMethod === "clone" && !clonedStructure && (
            <div className="max-w-xl mx-auto">
              <div className="text-center mb-6">
                <button
                  onClick={() => {
                    setCreationMethod("choose");
                    setCloneVideoUrl("");
                    setClonedStructure(null);
                  }}
                  className="text-xs text-muted-foreground hover:text-foreground mb-4 inline-flex items-center gap-1"
                >
                  <ChevronLeft className="w-3 h-3" /> Back to options
                </button>
                <h2 className="text-xl font-bold mb-2">Clone a Viral Video</h2>
                <p className="text-sm text-muted-foreground">Paste a TikTok, Instagram, or YouTube video URL to analyze its format</p>
              </div>
              
              <div className="p-6 rounded-xl border-2 border-purple-500/30 bg-gradient-to-br from-purple-500/5 to-pink-500/5">
                <Label className="text-sm font-medium mb-2 block">Video URL</Label>
                <div className="flex gap-2 mb-4">
                  <Input
                    placeholder="Paste TikTok, Instagram, or YouTube URL..."
                    value={cloneVideoUrl}
                    onChange={(e) => setCloneVideoUrl(e.target.value)}
                    className="flex-1"
                    data-testid="input-clone-video-url-step1"
                  />
                  <Button
                    onClick={async () => {
                      if (!cloneVideoUrl.trim()) {
                        toast({ title: "Enter a video URL", variant: "destructive" });
                        return;
                      }
                      setIsAnalyzingClone(true);
                      try {
                        const res = await apiRequest("POST", "/api/video-clone/analyze", { videoUrl: cloneVideoUrl.trim() });
                        const data = await res.json();
                        if (data.error) {
                          toast({ title: "Error", description: data.error, variant: "destructive" });
                        } else {
                          setClonedStructure(data);
                          // Store in formData for script generation
                          setFormData(prev => ({ ...prev, clonedVideoStructure: data.analysis }));
                          toast({ title: "Video Analyzed!", description: `Format: ${data.analysis?.format?.replace(/_/g, " ") || 'detected'}` });
                        }
                      } catch (err: any) {
                        toast({ title: "Failed to analyze video", description: err.message, variant: "destructive" });
                      } finally {
                        setIsAnalyzingClone(false);
                      }
                    }}
                    disabled={isAnalyzingClone || !cloneVideoUrl.trim()}
                    className="shrink-0"
                    data-testid="button-analyze-clone-step1"
                  >
                    {isAnalyzingClone ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                        Analyzing...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 mr-1" />
                        Analyze
                      </>
                    )}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  We'll extract the video's structure, hook style, pacing, and format to guide your script generation.
                </p>
              </div>
            </div>
          )}

          {/* After clone analysis - Full structure breakdown page */}
          {creationMethod === "clone" && clonedStructure && !clonedStructure.applied && (
            <div className="max-w-4xl mx-auto mb-6">
              {/* Header */}
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => {
                      setClonedStructure(null);
                      setCloneVideoUrl("");
                      setFormData(prev => ({ ...prev, clonedVideoStructure: undefined }));
                      setCloneStep("template");
                      setCloneTemplateTopic("");
                      setCloneSectionInputs({});
                      setShowOriginalTranscript(false);
                    }}
                    className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
                    data-testid="button-back-to-clone-input"
                  >
                    <ChevronLeft className="w-3 h-3" /> Try different video
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span className="text-sm font-medium text-green-600 dark:text-green-400">Analysis Complete</span>
                </div>
              </div>

              {/* Step label */}
              <div className="text-center mb-6">
                <h2 className="text-xl font-bold mb-1">Step 1: Review the Original Format</h2>
                <p className="text-sm text-muted-foreground">Study the structure below, then apply it to your own topic</p>
              </div>

              {/* Video meta info */}
              {(clonedStructure.author || clonedStructure.views) && (
                <div className="flex flex-wrap items-center gap-3 mb-4 justify-center">
                  {clonedStructure.platform && (
                    <Badge variant="secondary" className="capitalize">{clonedStructure.platform}</Badge>
                  )}
                  {clonedStructure.author && (
                    <span className="text-sm text-muted-foreground">@{clonedStructure.author}</span>
                  )}
                  {clonedStructure.views && (
                    <span className="text-sm text-muted-foreground flex items-center gap-1">
                      <Eye className="w-3.5 h-3.5" /> {typeof clonedStructure.views === 'number' ? clonedStructure.views.toLocaleString() : clonedStructure.views} views
                    </span>
                  )}
                  {clonedStructure.duration && (
                    <span className="text-sm text-muted-foreground flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" /> {clonedStructure.duration}s
                    </span>
                  )}
                </div>
              )}

              {/* Format overview badges */}
              <div className="flex flex-wrap justify-center gap-2 mb-6">
                <Badge variant="outline" className="capitalize">{String(clonedStructure.analysis?.format || "detected").replace(/_/g, " ")}</Badge>
                <Badge variant="outline" className="capitalize">{String(clonedStructure.analysis?.hookAnalysis?.style || clonedStructure.analysis?.hookStyle || "detected").replace(/_/g, " ")} hook</Badge>
                <Badge variant="outline" className="capitalize">{String(typeof clonedStructure.analysis?.pacing === 'object' ? clonedStructure.analysis?.pacing?.overall : clonedStructure.analysis?.pacing || "moderate").replace(/_/g, " ")} pacing</Badge>
                <Badge variant="outline" className="capitalize">{String(clonedStructure.analysis?.ctaAnalysis?.style || clonedStructure.analysis?.ctaStyle || "soft ask").replace(/_/g, " ")} CTA</Badge>
                <Badge variant="outline">{clonedStructure.analysis?.sections?.length || 0} sections</Badge>
                {clonedStructure.analysis?.wordCount && (
                  <Badge variant="outline">{clonedStructure.analysis.wordCount} words</Badge>
                )}
              </div>

              {/* Frames filmstrip OR cover image */}
              {clonedStructure.analysis?.frames && clonedStructure.analysis.frames.length > 0 ? (
                <div className="mb-6">
                  <p className="text-xs text-muted-foreground mb-2 font-medium flex items-center gap-1.5 justify-center">
                    <Film className="w-3.5 h-3.5" />
                    Video Frames Timeline
                  </p>
                  <div className="flex gap-2 overflow-x-auto pb-2 justify-center">
                    {clonedStructure.analysis.frames.map((frame: any, i: number) => {
                      const totalDuration = clonedStructure.analysis?.estimatedDurationSeconds || clonedStructure.duration || 60;
                      const sections = clonedStructure.analysis?.sections || [];
                      let sectionLabel = "";
                      let cumulativePercent = 0;
                      const framePercent = totalDuration > 0 ? (frame.timestamp / totalDuration) * 100 : 0;
                      for (const section of sections) {
                        cumulativePercent += section.durationPercent || 0;
                        if (framePercent <= cumulativePercent) {
                          sectionLabel = section.name;
                          break;
                        }
                      }
                      return (
                        <div key={i} className="flex-shrink-0" data-testid={`frame-thumbnail-${i}`}>
                          <div className="relative rounded-md overflow-hidden border border-border w-[100px] h-[133px]">
                            <img src={proxyImageUrl(frame.thumbnailUrl)} alt={`Frame at ${frame.timestamp}s`} className="w-full h-full object-cover" loading="lazy" />
                            <div className="absolute bottom-0 left-0 right-0 bg-black/70 px-1.5 py-0.5">
                              <p className="text-[10px] text-white font-mono">{frame.timestamp}s</p>
                            </div>
                          </div>
                          {sectionLabel && (
                            <p className="text-[10px] text-muted-foreground mt-1 text-center truncate w-[100px]">{sectionLabel}</p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : clonedStructure.analysis?.coverImageUrl ? (
                <div className="mb-6 flex flex-col items-center">
                  <p className="text-xs text-muted-foreground mb-2 font-medium flex items-center gap-1.5">
                    <Film className="w-3.5 h-3.5" />
                    Video Cover
                  </p>
                  <div className="relative rounded-md overflow-hidden border border-border w-[140px]" data-testid="cover-image">
                    <img src={proxyImageUrl(clonedStructure.analysis.coverImageUrl)} alt="Video cover" className="w-full aspect-[9/16] object-cover" loading="lazy" />
                    {clonedStructure.duration && (
                      <div className="absolute bottom-0 left-0 right-0 bg-black/70 px-1.5 py-0.5">
                        <p className="text-[10px] text-white font-mono text-center">{clonedStructure.duration}s</p>
                      </div>
                    )}
                  </div>
                </div>
              ) : null}

              {/* Main content: Original Script + Structure Breakdown */}
              <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 mb-6">
                
                {/* LEFT: Original Transcript with section annotations */}
                <div className="lg:col-span-3">
                  <Card className="p-5">
                    <div className="flex items-center gap-2 mb-4">
                      <FileText className="w-4 h-4 text-primary" />
                      <h3 className="font-semibold">Original Script</h3>
                      {clonedStructure.analysis?.estimatedDurationSeconds && (
                        <Badge variant="secondary" className="ml-auto text-[10px]">
                          ~{clonedStructure.analysis.estimatedDurationSeconds}s
                        </Badge>
                      )}
                    </div>

                    {/* Structure bar */}
                    {clonedStructure.analysis?.sections && clonedStructure.analysis.sections.length > 0 && (
                      <div className="mb-4">
                        <div className="flex gap-0.5 h-2 rounded-full overflow-hidden bg-muted">
                          {clonedStructure.analysis.sections.map((section: any, i: number) => {
                            const sectionColors = ['bg-primary', 'bg-blue-500', 'bg-indigo-500', 'bg-violet-500', 'bg-purple-500', 'bg-pink-500', 'bg-green-500'];
                            return (
                              <div 
                                key={i}
                                className={`h-full ${sectionColors[i % sectionColors.length]}`}
                                style={{ width: `${section.durationPercent || 33}%` }}
                                title={`${section.name}: ${section.durationPercent}%`}
                              />
                            );
                          })}
                        </div>
                        <div className="flex flex-wrap gap-x-3 gap-y-0 mt-1.5">
                          {clonedStructure.analysis.sections.map((section: any, i: number) => {
                            const sectionColors = ['text-primary', 'text-blue-500', 'text-indigo-500', 'text-violet-500', 'text-purple-500', 'text-pink-500', 'text-green-500'];
                            const dotColors = ['bg-primary', 'bg-blue-500', 'bg-indigo-500', 'bg-violet-500', 'bg-purple-500', 'bg-pink-500', 'bg-green-500'];
                            return (
                              <span key={i} className={`text-[10px] ${sectionColors[i % sectionColors.length]} flex items-center gap-1`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${dotColors[i % dotColors.length]}`} />
                                {section.name} ({section.durationPercent}%)
                              </span>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Annotated transcript - sections with example lines */}
                    {clonedStructure.analysis?.sections && clonedStructure.analysis.sections.length > 0 ? (
                      <div className="space-y-4" data-testid="annotated-transcript">
                        {clonedStructure.analysis.sections.map((section: any, i: number) => {
                          const sectionBorders = ['border-l-primary', 'border-l-blue-500', 'border-l-indigo-500', 'border-l-violet-500', 'border-l-purple-500', 'border-l-pink-500', 'border-l-green-500'];
                          const sectionBgs = ['bg-primary/5', 'bg-blue-500/5', 'bg-indigo-500/5', 'bg-violet-500/5', 'bg-purple-500/5', 'bg-pink-500/5', 'bg-green-500/5'];
                          return (
                            <div key={i} className={`border-l-2 ${sectionBorders[i % sectionBorders.length]} pl-4 py-2 ${sectionBgs[i % sectionBgs.length]} rounded-r-md`} data-testid={`transcript-section-${i}`}>
                              <div className="flex items-center gap-2 mb-2">
                                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{section.name}</span>
                                <span className="text-[10px] text-muted-foreground">({section.durationPercent}%{section.sentenceCount ? ` · ${section.sentenceCount} sentences` : ''})</span>
                                {section.emotionalTone && (
                                  <Badge variant="secondary" className="text-[10px] ml-auto">{section.emotionalTone}</Badge>
                                )}
                              </div>
                              {section.exampleLines && section.exampleLines.length > 0 ? (
                                <div className="space-y-1.5">
                                  {section.exampleLines.map((line: string, j: number) => (
                                    <p key={j} className="text-sm leading-relaxed text-foreground italic">
                                      "{line}"
                                    </p>
                                  ))}
                                </div>
                              ) : section.exampleLine ? (
                                <p className="text-sm leading-relaxed text-foreground italic">
                                  "{section.exampleLine}"
                                </p>
                              ) : (
                                <p className="text-sm leading-relaxed text-muted-foreground">
                                  {section.description}
                                </p>
                              )}
                              {section.purpose && (
                                <p className="text-xs text-muted-foreground mt-1.5 flex items-center gap-1">
                                  <Target className="w-3 h-3" /> {section.purpose}
                                </p>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    ) : clonedStructure.analysis?.originalTranscript ? (
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">
                        {clonedStructure.analysis.originalTranscript}
                      </p>
                    ) : clonedStructure.transcript ? (
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed" data-testid="text-raw-transcript">
                        {clonedStructure.transcript}
                      </p>
                    ) : (
                      <p className="text-sm text-muted-foreground italic" data-testid="text-no-transcript">
                        Transcript could not be extracted. The AI analysis above still captures the video's format and structure.
                      </p>
                    )}

                    {/* Full raw transcript (collapsible) */}
                    {(clonedStructure.analysis?.originalTranscript || clonedStructure.transcript) && clonedStructure.analysis?.sections?.length > 0 && (
                      <div className="mt-4 pt-4 border-t border-border">
                        <button
                          onClick={() => setShowOriginalTranscript(!showOriginalTranscript)}
                          className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground w-full"
                          data-testid="button-toggle-raw-transcript"
                        >
                          <Quote className="w-3.5 h-3.5" />
                          <span>View full raw transcript</span>
                          {showOriginalTranscript ? <ChevronUp className="w-3 h-3 ml-auto" /> : <ChevronDown className="w-3 h-3 ml-auto" />}
                        </button>
                        {showOriginalTranscript && (
                          <div className="mt-3 p-3 rounded-md bg-muted/30 border border-border max-h-[500px] overflow-y-auto">
                            <div className="text-xs text-muted-foreground whitespace-pre-wrap leading-relaxed break-words">
                              {clonedStructure.analysis?.originalTranscript || clonedStructure.transcript}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </Card>
                </div>

                {/* RIGHT: Structure Details Panel */}
                <div className="lg:col-span-2 space-y-4">

                  {/* Emotional Arc */}
                  {clonedStructure.analysis?.emotionalArc && (
                    <Card className="p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <Heart className="w-4 h-4 text-primary" />
                        <h4 className="text-sm font-semibold">Emotional Arc</h4>
                      </div>
                      <p className="text-sm text-muted-foreground leading-relaxed" data-testid="text-emotional-arc">
                        {clonedStructure.analysis.emotionalArc}
                      </p>
                    </Card>
                  )}

                  {/* Voice & Tone */}
                  {clonedStructure.analysis?.toneProfile && (
                    <Card className="p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <Volume2 className="w-4 h-4 text-primary" />
                        <h4 className="text-sm font-semibold">Voice & Tone</h4>
                      </div>
                      <div className="space-y-2">
                        {clonedStructure.analysis.toneProfile.energy && (
                          <div>
                            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Energy</p>
                            <p className="text-sm">{clonedStructure.analysis.toneProfile.energy}</p>
                          </div>
                        )}
                        {clonedStructure.analysis.toneProfile.attitude && (
                          <div>
                            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Attitude</p>
                            <p className="text-sm">{clonedStructure.analysis.toneProfile.attitude}</p>
                          </div>
                        )}
                        {clonedStructure.analysis.toneProfile.personality && (
                          <div>
                            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Personality</p>
                            <p className="text-sm">{clonedStructure.analysis.toneProfile.personality}</p>
                          </div>
                        )}
                        {clonedStructure.analysis.toneProfile.vocabulary && (
                          <div>
                            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Vocabulary</p>
                            <p className="text-sm">{clonedStructure.analysis.toneProfile.vocabulary}</p>
                          </div>
                        )}
                      </div>
                    </Card>
                  )}

                  {/* Retention Mechanics */}
                  {clonedStructure.analysis?.retentionMechanics && clonedStructure.analysis.retentionMechanics.length > 0 && (
                    <Card className="p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <Eye className="w-4 h-4 text-primary" />
                        <h4 className="text-sm font-semibold">Why It Keeps You Watching</h4>
                      </div>
                      <ul className="space-y-1.5">
                        {clonedStructure.analysis.retentionMechanics.map((mechanic: string, i: number) => (
                          <li key={i} className="text-xs text-muted-foreground flex items-start gap-2">
                            <span className="text-primary mt-0.5 flex-shrink-0">-</span>
                            {mechanic}
                          </li>
                        ))}
                      </ul>
                    </Card>
                  )}

                  {/* Transition Phrases */}
                  {clonedStructure.analysis?.transitionPhrases && clonedStructure.analysis.transitionPhrases.length > 0 && (
                    <Card className="p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <ArrowRight className="w-4 h-4 text-primary" />
                        <h4 className="text-sm font-semibold">Transition Phrases</h4>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {clonedStructure.analysis.transitionPhrases.map((phrase: string, i: number) => (
                          <span key={i} className="px-2 py-1 rounded-md bg-muted text-xs text-muted-foreground italic">
                            "{phrase}"
                          </span>
                        ))}
                      </div>
                    </Card>
                  )}

                  {/* Pacing & Sentence Style */}
                  {(clonedStructure.analysis?.pacing || clonedStructure.analysis?.sentenceStructure) && (
                    <Card className="p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <Zap className="w-4 h-4 text-primary" />
                        <h4 className="text-sm font-semibold">Pacing & Rhythm</h4>
                      </div>
                      <div className="space-y-2">
                        {typeof clonedStructure.analysis?.pacing === 'object' && (
                          <>
                            {clonedStructure.analysis.pacing.sentenceRhythm && (
                              <div>
                                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Cadence</p>
                                <p className="text-sm">{clonedStructure.analysis.pacing.sentenceRhythm}</p>
                              </div>
                            )}
                            {clonedStructure.analysis.pacing.pausePattern && (
                              <div>
                                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Pauses</p>
                                <p className="text-sm">{clonedStructure.analysis.pacing.pausePattern}</p>
                              </div>
                            )}
                          </>
                        )}
                        {clonedStructure.analysis?.sentenceStructure?.pattern && (
                          <div>
                            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Sentence Pattern</p>
                            <p className="text-sm">{clonedStructure.analysis.sentenceStructure.pattern}</p>
                          </div>
                        )}
                      </div>
                    </Card>
                  )}

                  {/* Power Words */}
                  {clonedStructure.analysis?.powerWords && clonedStructure.analysis.powerWords.length > 0 && (
                    <Card className="p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <Flame className="w-4 h-4 text-primary" />
                        <h4 className="text-sm font-semibold">Power Words</h4>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {clonedStructure.analysis.powerWords.map((word: string, i: number) => (
                          <Badge key={i} variant="secondary" className="text-xs">{word}</Badge>
                        ))}
                      </div>
                    </Card>
                  )}

                  {/* Unique Style Notes */}
                  {clonedStructure.analysis?.uniqueStyleNotes && (
                    <Card className="p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <Star className="w-4 h-4 text-primary" />
                        <h4 className="text-sm font-semibold">What Makes It Unique</h4>
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed" data-testid="text-unique-style">
                        {clonedStructure.analysis.uniqueStyleNotes}
                      </p>
                    </Card>
                  )}
                </div>
              </div>

              {/* Apply button - prominent at bottom */}
              <div className="text-center">
                <Button
                  onClick={() => {
                    setCloneStep("template");
                    setCloneTemplateTopic("");
                    setCloneSectionInputs({});
                    setShowOriginalTranscript(false);
                    setCloneGeneratedHooks([]);
                    setSelectedCloneHookId(null);
                    setIsGeneratingCloneHooks(false);
                    setCloneGeneratedCtas([]);
                    setSelectedCloneCtaIndex(null);
                    setIsGeneratingCloneCtas(false);
                    setClonedStructure({ ...clonedStructure, applied: true });
                  }}
                  className="px-8"
                  size="lg"
                  data-testid="button-apply-clone-format"
                >
                  <ArrowDown className="w-4 h-4 mr-2" />
                  Use This Format for My Script
                </Button>
                <p className="text-xs text-muted-foreground mt-2">
                  Next: Enter your topic and we'll generate a script matching this exact format
                </p>
              </div>
            </div>
          )}

          {/* TEMPLATE-DRIVEN CLONE FLOW - Simplified 2-step process */}
          {creationMethod === "clone" && clonedStructure?.applied && (
            <div className="max-w-3xl mx-auto">
              {/* Back button */}
              <div className="text-center mb-4">
                <button
                  onClick={() => {
                    setClonedStructure({ ...clonedStructure, applied: false });
                    setCloneStep("template");
                    setCloneSectionInputs({});
                    setCloneTemplateTopic("");
                  }}
                  className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
                  data-testid="button-back-to-analysis"
                >
                  <ChevronLeft className="w-3 h-3" /> Back to video analysis
                </button>
              </div>

              {/* Step 2 header */}
              <div className="text-center mb-6">
                <h2 className="text-xl font-bold mb-1">Step 2: Apply the Format to Your Topic</h2>
                <p className="text-sm text-muted-foreground">
                  {cloneStep === "template" 
                    ? "Enter your topic and fill in each section — we'll match the original structure" 
                    : "Review and generate your cloned script"}
                </p>
              </div>
              
              {/* Clone step indicator */}
              <div className="flex items-center justify-center gap-2 mb-6">
                <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium ${
                  cloneStep === "template" 
                    ? "bg-primary text-primary-foreground" 
                    : "bg-muted text-muted-foreground"
                }`}>
                  <span className="w-5 h-5 rounded-full bg-background/20 flex items-center justify-center text-[10px]">1</span>
                  Fill Template
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
                <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium ${
                  cloneStep === "generate" 
                    ? "bg-primary text-primary-foreground" 
                    : "bg-muted text-muted-foreground"
                }`}>
                  <span className="w-5 h-5 rounded-full bg-background/20 flex items-center justify-center text-[10px]">2</span>
                  Generate
                </div>
              </div>

              {/* Template Step - Fill in your content */}
              {cloneStep === "template" && (
                <Card className="p-6">
                  {/* Header with format info */}
                  <div className="flex items-center justify-between mb-6 pb-4 border-b border-border">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                        <Sparkles className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <h2 className="font-semibold text-lg">Fill in Your Version</h2>
                        <p className="text-sm text-muted-foreground">
                          Cloning: <span className="capitalize">{String(clonedStructure.analysis?.format || "").replace(/_/g, " ")}</span> • 
                          {String(clonedStructure.analysis?.hookAnalysis?.style || clonedStructure.analysis?.hookStyle || "").replace(/_/g, " ")} hook • 
                          {String(typeof clonedStructure.analysis?.pacing === 'object' ? clonedStructure.analysis?.pacing?.overall : clonedStructure.analysis?.pacing || "moderate")} pacing
                        </p>
                      </div>
                    </div>
                    <Badge variant="secondary">{clonedStructure.analysis?.sections?.length || 0} sections</Badge>
                  </div>

                  {/* Topic input */}
                  <div className="mb-6">
                    <Label className="text-sm font-medium mb-2 block">What's your topic?</Label>
                    <Input
                      placeholder="e.g., Why most people fail at saving money"
                      value={cloneTemplateTopic}
                      onChange={(e) => {
                        setCloneTemplateTopic(e.target.value);
                        if (cloneGeneratedHooks.length > 0) {
                          setCloneGeneratedHooks([]);
                          setSelectedCloneHookId(null);
                        }
                      }}
                      className="text-base"
                      data-testid="input-clone-topic"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Your main subject - we'll adapt the cloned format to this
                    </p>
                  </div>

                  {/* Reference: original structure at a glance */}
                  {clonedStructure.analysis?.sections && clonedStructure.analysis.sections.length > 0 && (
                    <div className="mb-6 p-3 rounded-md bg-muted/30 border border-border">
                      <p className="text-xs text-muted-foreground mb-2 font-medium">Structure you're cloning:</p>
                      <div className="flex flex-wrap gap-1.5">
                        {clonedStructure.analysis.sections.map((section: any, i: number) => (
                          <Badge key={i} variant="secondary" className="text-[10px]">
                            {section.name} ({section.durationPercent}%)
                          </Badge>
                        ))}
                      </div>
                      <button
                        onClick={() => {
                          setClonedStructure({ ...clonedStructure, applied: false });
                        }}
                        className="text-xs text-primary hover:underline mt-2 inline-flex items-center gap-1"
                        data-testid="link-review-analysis"
                      >
                        <Eye className="w-3 h-3" /> Review full analysis
                      </button>
                    </div>
                  )}

                  {/* AI Hook Generation */}
                  <div className="mb-6">
                    <div className="flex items-center justify-between mb-3">
                      <Label className="text-sm font-medium flex items-center gap-2">
                        <Zap className="w-4 h-4 text-primary" />
                        Hook
                      </Label>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={async () => {
                          if (!cloneTemplateTopic.trim()) {
                            toast({ title: "Enter your topic first", variant: "destructive" });
                            return;
                          }
                          setIsGeneratingCloneHooks(true);
                          try {
                            const hookStyle = clonedStructure.analysis?.hookAnalysis?.style || clonedStructure.analysis?.hookStyle || "bold_statement";
                            const res = await apiRequest("POST", "/api/hooks/generate", {
                              hookStyle: hookStyle.replace(/\s+/g, "_"),
                              problem: cloneTemplateTopic,
                              solution: cloneTemplateTopic,
                              targetAudience: "general audience",
                              platform: formData.platform || "tiktok",
                              duration: formData.duration || "60",
                              videoPurpose: "education",
                            });
                            const data = await res.json();
                            setCloneGeneratedHooks(data.hooks || []);
                          } catch (err) {
                            toast({ title: "Failed to generate hooks", variant: "destructive" });
                          } finally {
                            setIsGeneratingCloneHooks(false);
                          }
                        }}
                        disabled={isGeneratingCloneHooks || !cloneTemplateTopic.trim()}
                        data-testid="button-generate-clone-hooks"
                      >
                        {isGeneratingCloneHooks ? (
                          <>
                            <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                            Generating...
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-3 h-3 mr-1" />
                            Generate AI Hooks
                          </>
                        )}
                      </Button>
                    </div>

                    {/* Generated hook options */}
                    {cloneGeneratedHooks.length > 0 && (
                      <div className="space-y-2 mb-3">
                        <p className="text-xs text-muted-foreground">Choose a hook or write your own below:</p>
                        {cloneGeneratedHooks.map((hook) => {
                          const hookSectionName = clonedStructure.analysis?.sections?.find(
                            (s: any) => s.name.toLowerCase().includes('hook') || s.name.toLowerCase().includes('intro') || s.name.toLowerCase().includes('opening')
                          )?.name || "Hook";
                          return (
                            <button
                              key={hook.id}
                              onClick={() => {
                                setSelectedCloneHookId(hook.id);
                                setCloneSectionInputs(prev => ({
                                  ...prev,
                                  [hookSectionName]: hook.hook,
                                }));
                              }}
                              className={`w-full text-left p-3 rounded-lg border transition-all ${
                                selectedCloneHookId === hook.id
                                  ? "bg-primary/20 border-primary"
                                  : "bg-background/50 border-border hover-elevate"
                              }`}
                              data-testid={`clone-hook-option-${hook.id}`}
                            >
                              <p className="text-sm font-medium mb-1">"{hook.hook}"</p>
                              <p className="text-xs text-muted-foreground">{hook.reasoning}</p>
                            </button>
                          );
                        })}
                      </div>
                    )}

                    {/* Hook text input (for manual entry or editing selected hook) */}
                    {(() => {
                      const hookSectionName = clonedStructure.analysis?.sections?.find(
                        (s: any) => s.name.toLowerCase().includes('hook') || s.name.toLowerCase().includes('intro') || s.name.toLowerCase().includes('opening')
                      )?.name || "Hook";
                      return (
                        <Textarea
                          placeholder={`Your hook (${String(clonedStructure.analysis?.hookAnalysis?.style || clonedStructure.analysis?.hookStyle || "bold").replace(/_/g, " ")} style)... or use Generate AI Hooks above`}
                          value={cloneSectionInputs[hookSectionName] || ""}
                          onChange={(e) => {
                            setCloneSectionInputs(prev => ({
                              ...prev,
                              [hookSectionName]: e.target.value,
                            }));
                            setSelectedCloneHookId(null);
                          }}
                          className="min-h-[80px] resize-none"
                          data-testid="textarea-clone-hook-input"
                        />
                      );
                    })()}
                  </div>

                  {/* Remaining sections to fill in */}
                  <div className="space-y-4 mb-6">
                    <Label className="text-sm font-medium">Fill in remaining sections:</Label>
                    
                    {clonedStructure.analysis?.sections?.filter((section: any) => {
                      const name = section.name.toLowerCase();
                      return !name.includes('hook') && !name.includes('intro') && !name.includes('opening');
                    }).map((section: any, index: number) => {
                      const isCta = section.name.toLowerCase().includes('cta') || section.name.toLowerCase().includes('call') || section.name.toLowerCase().includes('close');
                      return (
                        <div key={index} className="relative">
                          <div className="flex items-center justify-between gap-2 mb-2 flex-wrap">
                            <div className="flex items-center gap-2">
                              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                                isCta ? 'bg-green-500 text-white' : 'bg-blue-500 text-white'
                              }`}>
                                {index + 2}
                              </div>
                              <span className="font-medium capitalize">{section.name}</span>
                              <span className="text-xs text-muted-foreground">({section.durationPercent}% of video)</span>
                            </div>
                            {isCta && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={async () => {
                                  if (!cloneTemplateTopic.trim()) {
                                    toast({ title: "Enter your topic first", variant: "destructive" });
                                    return;
                                  }
                                  setIsGeneratingCloneCtas(true);
                                  try {
                                    const hookSectionName = clonedStructure.analysis?.sections?.find(
                                      (s: any) => s.name.toLowerCase().includes('hook') || s.name.toLowerCase().includes('intro') || s.name.toLowerCase().includes('opening')
                                    )?.name || "Hook";
                                    const res = await apiRequest("POST", "/api/cta/generate", {
                                      topic: cloneTemplateTopic,
                                      hook: cloneSectionInputs[hookSectionName] || "",
                                      platform: formData.platform || "tiktok",
                                      originalCtaStyle: clonedStructure.analysis?.ctaAnalysis?.style || clonedStructure.analysis?.ctaStyle || "",
                                      originalCtaLine: clonedStructure.analysis?.ctaAnalysis?.exactLine || "",
                                    });
                                    const data = await res.json();
                                    setCloneGeneratedCtas(data.suggestions || []);
                                  } catch (err) {
                                    toast({ title: "Failed to generate CTAs", variant: "destructive" });
                                  } finally {
                                    setIsGeneratingCloneCtas(false);
                                  }
                                }}
                                disabled={isGeneratingCloneCtas || !cloneTemplateTopic.trim()}
                                data-testid="button-generate-clone-ctas"
                              >
                                {isGeneratingCloneCtas ? (
                                  <>
                                    <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                                    Generating...
                                  </>
                                ) : (
                                  <>
                                    <Sparkles className="w-3 h-3 mr-1" />
                                    Generate AI CTAs
                                  </>
                                )}
                              </Button>
                            )}
                          </div>

                          {isCta && cloneGeneratedCtas.length > 0 && (
                            <div className="space-y-2 mb-3">
                              <p className="text-xs text-muted-foreground">Choose a CTA or write your own below:</p>
                              {cloneGeneratedCtas.map((ctaOption, ctaIdx) => (
                                <button
                                  key={ctaIdx}
                                  onClick={() => {
                                    setSelectedCloneCtaIndex(ctaIdx);
                                    setCloneSectionInputs(prev => ({
                                      ...prev,
                                      [section.name]: ctaOption.cta,
                                    }));
                                  }}
                                  className={`w-full text-left p-3 rounded-lg border transition-all ${
                                    selectedCloneCtaIndex === ctaIdx
                                      ? "bg-primary/20 border-primary"
                                      : "bg-background/50 border-border hover-elevate"
                                  }`}
                                  data-testid={`clone-cta-option-${ctaIdx}`}
                                >
                                  <p className="text-sm font-medium mb-1">"{ctaOption.cta}"</p>
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <Badge variant="outline" className="text-[10px] capitalize">{ctaOption.category}</Badge>
                                    <p className="text-xs text-muted-foreground">{ctaOption.rationale}</p>
                                  </div>
                                </button>
                              ))}
                            </div>
                          )}

                          <Textarea
                            placeholder={`Your ${section.name.toLowerCase()}...${
                              isCta
                                ? ` (${String(clonedStructure.analysis?.ctaAnalysis?.style || clonedStructure.analysis?.ctaStyle || "soft ask").replace(/_/g, " ")} style) or use Generate AI CTAs above`
                                : ''
                            }`}
                            value={cloneSectionInputs[section.name] || ""}
                            onChange={(e) => {
                              setCloneSectionInputs(prev => ({
                                ...prev,
                                [section.name]: e.target.value
                              }));
                              if (isCta) setSelectedCloneCtaIndex(null);
                            }}
                            className="min-h-[80px] resize-none"
                            data-testid={`textarea-clone-section-${index}`}
                          />
                          {section.purpose && (
                            <p className="text-xs text-muted-foreground mt-1 ml-8">
                              Purpose: {section.purpose}
                            </p>
                          )}
                        </div>
                      );
                    })}

                    {/* If no sections, show generic remaining inputs */}
                    {(!clonedStructure.analysis?.sections || clonedStructure.analysis.sections.length === 0) && (
                      <>
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center text-xs font-bold text-white">2</div>
                            <span className="font-medium">Main Content</span>
                          </div>
                          <Textarea
                            placeholder="Your main teaching or points..."
                            value={cloneSectionInputs["Main Content"] || ""}
                            onChange={(e) => setCloneSectionInputs(prev => ({ ...prev, "Main Content": e.target.value }))}
                            className="min-h-[100px] resize-none"
                            data-testid="textarea-clone-main"
                          />
                        </div>
                        <div>
                          <div className="flex items-center justify-between gap-2 mb-2 flex-wrap">
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center text-xs font-bold text-white">3</div>
                              <span className="font-medium">Call to Action</span>
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={async () => {
                                if (!cloneTemplateTopic.trim()) {
                                  toast({ title: "Enter your topic first", variant: "destructive" });
                                  return;
                                }
                                setIsGeneratingCloneCtas(true);
                                try {
                                  const res = await apiRequest("POST", "/api/cta/generate", {
                                    topic: cloneTemplateTopic,
                                    hook: cloneSectionInputs["Hook"] || "",
                                    platform: formData.platform || "tiktok",
                                    originalCtaStyle: clonedStructure.analysis?.ctaAnalysis?.style || clonedStructure.analysis?.ctaStyle || "",
                                    originalCtaLine: clonedStructure.analysis?.ctaAnalysis?.exactLine || "",
                                  });
                                  const data = await res.json();
                                  setCloneGeneratedCtas(data.suggestions || []);
                                } catch (err) {
                                  toast({ title: "Failed to generate CTAs", variant: "destructive" });
                                } finally {
                                  setIsGeneratingCloneCtas(false);
                                }
                              }}
                              disabled={isGeneratingCloneCtas || !cloneTemplateTopic.trim()}
                              data-testid="button-generate-clone-ctas-generic"
                            >
                              {isGeneratingCloneCtas ? (
                                <>
                                  <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                                  Generating...
                                </>
                              ) : (
                                <>
                                  <Sparkles className="w-3 h-3 mr-1" />
                                  Generate AI CTAs
                                </>
                              )}
                            </Button>
                          </div>

                          {cloneGeneratedCtas.length > 0 && (
                            <div className="space-y-2 mb-3">
                              <p className="text-xs text-muted-foreground">Choose a CTA or write your own below:</p>
                              {cloneGeneratedCtas.map((ctaOption, ctaIdx) => (
                                <button
                                  key={ctaIdx}
                                  onClick={() => {
                                    setSelectedCloneCtaIndex(ctaIdx);
                                    setCloneSectionInputs(prev => ({
                                      ...prev,
                                      CTA: ctaOption.cta,
                                    }));
                                  }}
                                  className={`w-full text-left p-3 rounded-lg border transition-all ${
                                    selectedCloneCtaIndex === ctaIdx
                                      ? "bg-primary/20 border-primary"
                                      : "bg-background/50 border-border hover-elevate"
                                  }`}
                                  data-testid={`clone-cta-option-generic-${ctaIdx}`}
                                >
                                  <p className="text-sm font-medium mb-1">"{ctaOption.cta}"</p>
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <Badge variant="outline" className="text-[10px] capitalize">{ctaOption.category}</Badge>
                                    <p className="text-xs text-muted-foreground">{ctaOption.rationale}</p>
                                  </div>
                                </button>
                              ))}
                            </div>
                          )}

                          <Textarea
                            placeholder={`Your CTA (${String(clonedStructure.analysis?.ctaAnalysis?.style || clonedStructure.analysis?.ctaStyle || "soft ask").replace(/_/g, " ")} style)... or use Generate AI CTAs above`}
                            value={cloneSectionInputs["CTA"] || ""}
                            onChange={(e) => {
                              setCloneSectionInputs(prev => ({ ...prev, CTA: e.target.value }));
                              setSelectedCloneCtaIndex(null);
                            }}
                            className="min-h-[60px] resize-none"
                            data-testid="textarea-clone-cta"
                          />
                        </div>
                      </>
                    )}
                  </div>

                  {/* Generate button */}
                  <Button
                    onClick={() => {
                      if (!cloneTemplateTopic.trim()) {
                        toast({ title: "Please enter your topic", variant: "destructive" });
                        return;
                      }
                      const sectionContent = Object.entries(cloneSectionInputs)
                        .map(([name, content]) => `${name}: ${content}`)
                        .join("\n\n");
                      
                      setFormData(prev => ({
                        ...prev,
                        topic: cloneTemplateTopic,
                        referenceScript: sectionContent,
                        clonedVideoStructure: clonedStructure.analysis,
                      }));
                      setCloneStep("generate");
                    }}
                    className="w-full"
                    size="lg"
                    disabled={!cloneTemplateTopic.trim()}
                    data-testid="button-clone-continue"
                  >
                    Continue to Generate
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Card>
              )}

              {/* Generate Step - Visual Storyboard */}
              {cloneStep === "generate" && (() => {
                const sections = clonedStructure.analysis?.sections || [];
                const frames = clonedStructure.analysis?.frames || [];
                const totalDuration = clonedStructure.analysis?.estimatedDurationSeconds || clonedStructure.duration || 60;
                const sectionColors = ['bg-primary', 'bg-blue-500', 'bg-indigo-500', 'bg-violet-500', 'bg-purple-500', 'bg-pink-500', 'bg-green-500'];
                const sectionBorders = ['border-primary', 'border-blue-500', 'border-indigo-500', 'border-violet-500', 'border-purple-500', 'border-pink-500', 'border-green-500'];
                const sectionTextColors = ['text-primary', 'text-blue-500', 'text-indigo-500', 'text-violet-500', 'text-purple-500', 'text-pink-500', 'text-green-500'];

                const getFramesForSection = (sectionIndex: number) => {
                  if (frames.length === 0 || sections.length === 0) return [];
                  const totalPercent = sections.reduce((sum: number, s: any) => sum + (s.durationPercent || 0), 0);
                  const hasValidPercents = totalPercent > 0;

                  if (!hasValidPercents) {
                    const perSection = Math.ceil(frames.length / sections.length);
                    const start = sectionIndex * perSection;
                    return frames.slice(start, start + perSection);
                  }

                  let startPercent = 0;
                  for (let i = 0; i < sectionIndex; i++) {
                    startPercent += sections[i].durationPercent || 0;
                  }
                  const endPercent = startPercent + (sections[sectionIndex].durationPercent || 0);
                  const startTime = (startPercent / 100) * totalDuration;
                  const endTime = (endPercent / 100) * totalDuration;
                  return frames.filter((f: any) => f.timestamp >= startTime - 1 && f.timestamp <= endTime + 1);
                };

                const allSections = sections.length > 0 ? sections : [
                  { name: "Hook", durationPercent: 15 },
                  { name: "Main Content", durationPercent: 70 },
                  { name: "CTA", durationPercent: 15 },
                ];

                return (
                <Card className="p-6">
                  <div className="mb-6">
                    <h2 className="font-semibold text-lg mb-1">Script Storyboard</h2>
                    <p className="text-sm text-muted-foreground">
                      Your content mapped to the cloned format — review before generating
                    </p>
                  </div>

                  {/* Topic banner */}
                  <div className="flex flex-wrap items-center gap-3 p-3 rounded-md bg-primary/10 dark:bg-primary/5 border border-primary/20 mb-6" data-testid="storyboard-topic-banner">
                    <Target className="w-4 h-4 text-primary flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Topic</p>
                      <p className="text-sm font-medium truncate">{cloneTemplateTopic}</p>
                    </div>
                    <div className="flex flex-wrap justify-end gap-1.5 flex-shrink-0">
                      <Badge variant="secondary" className="text-[10px] capitalize">{String(clonedStructure.analysis?.format || "").replace(/_/g, " ")}</Badge>
                      <Badge variant="secondary" className="text-[10px] capitalize">{String(typeof clonedStructure.analysis?.pacing === 'object' ? clonedStructure.analysis?.pacing?.overall : clonedStructure.analysis?.pacing || "moderate")} pacing</Badge>
                    </div>
                  </div>

                  {/* Visual Storyboard - Frames + Sections side by side */}
                  <div className="space-y-3 mb-6" data-testid="storyboard-sections">
                    {allSections.map((section: any, i: number) => {
                      const sectionFrames = getFramesForSection(i);
                      const userContent = cloneSectionInputs[section.name] || "";
                      const isHook = section.name.toLowerCase().includes('hook') || section.name.toLowerCase().includes('intro') || section.name.toLowerCase().includes('opening');
                      const isCta = section.name.toLowerCase().includes('cta') || section.name.toLowerCase().includes('call') || section.name.toLowerCase().includes('close');

                      return (
                        <div
                          key={i}
                          className={`flex flex-wrap sm:flex-nowrap gap-3 p-3 rounded-md border ${sectionBorders[i % sectionBorders.length]} bg-card`}
                          data-testid={`storyboard-section-${i}`}
                        >
                          {/* Frame thumbnail(s) */}
                          <div className="flex-shrink-0 w-[90px]">
                            {sectionFrames.length > 0 ? (
                              <div className="space-y-1.5">
                                {sectionFrames.slice(0, 2).map((frame: any, j: number) => (
                                  <div key={j} className="relative rounded-md overflow-hidden border border-border">
                                    <img
                                      src={proxyImageUrl(frame.thumbnailUrl)}
                                      alt={`${section.name} at ${frame.timestamp}s`}
                                      className="w-full aspect-[9/16] object-cover"
                                      loading="lazy"
                                    />
                                    <div className="absolute bottom-0 left-0 right-0 bg-black/70 px-1 py-0.5">
                                      <p className="text-[9px] text-white font-mono text-center">{frame.timestamp}s</p>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : clonedStructure.analysis?.coverImageUrl ? (
                              <div>
                                <div className="relative rounded-md overflow-hidden border border-border">
                                  <img
                                    src={proxyImageUrl(clonedStructure.analysis.coverImageUrl)}
                                    alt={`${section.name} preview`}
                                    className="w-full aspect-[9/16] object-cover"
                                    loading="lazy"
                                  />
                                  <div className="absolute bottom-0 left-0 right-0 bg-black/70 px-1 py-0.5">
                                    <p className="text-[9px] text-white text-center">{section.durationPercent}%</p>
                                  </div>
                                </div>
                                {i === 0 && <p className="text-[9px] text-muted-foreground mt-1 text-center">Video cover</p>}
                              </div>
                            ) : (
                              <div className="w-full aspect-[9/16] rounded-md bg-muted/50 border border-border flex flex-col items-center justify-center">
                                <div className={`w-8 h-8 rounded-full ${sectionColors[i % sectionColors.length]} flex items-center justify-center mb-1`}>
                                  {isHook ? <Zap className="w-4 h-4 text-white" /> : isCta ? <ArrowRight className="w-4 h-4 text-white" /> : <FileText className="w-4 h-4 text-white" />}
                                </div>
                                <p className="text-[9px] text-muted-foreground">{section.durationPercent}%</p>
                              </div>
                            )}
                          </div>

                          {/* Section content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1.5 flex-wrap gap-y-1">
                              <span className={`text-xs font-bold uppercase tracking-wider ${sectionTextColors[i % sectionTextColors.length]}`}>
                                {section.name}
                              </span>
                              <span className="text-[10px] text-muted-foreground">({section.durationPercent}%)</span>
                              {section.emotionalTone && (
                                <Badge variant="secondary" className="text-[10px] ml-auto">{section.emotionalTone}</Badge>
                              )}
                            </div>

                            {userContent ? (
                              <p className="text-sm leading-relaxed" data-testid={`storyboard-content-${i}`}>
                                {userContent}
                              </p>
                            ) : (
                              <p className="text-sm text-muted-foreground italic" data-testid={`storyboard-content-${i}`}>
                                AI will generate this section matching the original {section.name.toLowerCase()} style
                              </p>
                            )}

                            {section.purpose && (
                              <p className="text-[10px] text-muted-foreground mt-1.5 flex items-center gap-1">
                                <Target className="w-2.5 h-2.5 flex-shrink-0" /> {section.purpose}
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Platform/Duration selection */}
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div>
                      <Label className="text-sm font-medium mb-2 block">Platform</Label>
                      <Select 
                        value={formData.platform} 
                        onValueChange={(value) => setFormData(prev => ({ ...prev, platform: value }))}
                      >
                        <SelectTrigger data-testid="select-clone-platform">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {platformOptions.map(opt => (
                            <SelectItem key={opt.id} value={opt.id}>{opt.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-sm font-medium mb-2 block">Duration</Label>
                      <Select 
                        value={formData.duration} 
                        onValueChange={(value) => setFormData(prev => ({ ...prev, duration: value }))}
                      >
                        <SelectTrigger data-testid="select-clone-duration">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {durationOptions.map(opt => (
                            <SelectItem key={opt.id} value={opt.id}>{opt.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div className="flex gap-3">
                    <Button
                      variant="outline"
                      onClick={() => setCloneStep("template")}
                      data-testid="button-clone-back"
                    >
                      <ChevronLeft className="w-4 h-4 mr-1" />
                      Back
                    </Button>
                    <Button
                      onClick={() => {
                        const sectionContent = Object.entries(cloneSectionInputs)
                          .filter(([_, v]) => v.trim())
                          .map(([name, content]) => `${name}: ${content}`)
                          .join("\n\n");
                        
                        generateMutation.mutate({
                          ...formData,
                          topic: cloneTemplateTopic,
                          referenceScript: sectionContent,
                          clonedVideoStructure: clonedStructure.analysis,
                        } as any);
                      }}
                      className="flex-1"
                      size="lg"
                      disabled={generateMutation.isPending}
                      data-testid="button-generate-clone-script"
                    >
                      {generateMutation.isPending ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Generating...
                        </>
                      ) : (
                        <>
                          <Wand2 className="w-4 h-4 mr-2" />
                          Generate Script
                        </>
                      )}
                    </Button>
                  </div>
                </Card>
                );
              })()}
            </div>
          )}

          {/* Show regular CREATE FROM SCRATCH flow - only for scratch mode */}
          {creationMethod === "scratch" && (
            <>
              {/* Back button for scratch mode */}
              {currentStep === "skeleton" && (
                <div className="text-center mb-4">
                  <button
                    onClick={() => setCreationMethod("choose")}
                    className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
                  >
                    <ChevronLeft className="w-3 h-3" /> Back to options
                  </button>
                </div>
              )}
              
              {/* Step indicator */}
              <div className="flex items-center justify-center gap-2 mb-6">
                <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium ${
                  currentStep === "skeleton" 
                    ? "bg-primary text-primary-foreground" 
                    : "bg-muted text-muted-foreground"
                }`}>
                  <span className="w-5 h-5 rounded-full bg-background/20 flex items-center justify-center text-[10px]">1</span>
                  Build Skeleton
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
                <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium ${
                  currentStep === "enhance" 
                    ? "bg-primary text-primary-foreground" 
                    : "bg-muted text-muted-foreground"
                }`}>
                  <span className="w-5 h-5 rounded-full bg-background/20 flex items-center justify-center text-[10px]">2</span>
                  Enhance
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
                <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium ${
                  currentStep === "script" 
                    ? "bg-primary text-primary-foreground" 
                    : "bg-muted text-muted-foreground"
                }`}>
                  <span className="w-5 h-5 rounded-full bg-background/20 flex items-center justify-center text-[10px]">3</span>
                  Generate
                </div>
              </div>

          {/* Step 1: Build Skeleton */}
          {currentStep === "skeleton" && (
            <>
              <IdeaClarifier
                onSkeletonComplete={handleSkeletonComplete}
                onSkeletonChange={setVideoSkeleton}
                isGenerating={generateMutation.isPending}
              />
              <div className="mt-4 text-center">
                <button
                  onClick={() => setShowLegacyFlow(true)}
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors underline"
                  data-testid="button-show-legacy"
                >
                  Switch to advanced mode (all options)
                </button>
              </div>
            </>
          )}

          {/* Step 2: Enhance with Research */}
          {currentStep === "enhance" && videoSkeleton && (
            <SkeletonEnhancer
              skeleton={videoSkeleton}
              onSkeletonChange={setVideoSkeleton}
              onEnhancementComplete={handleEnhancementComplete}
              onBack={handleBackToSkeleton}
              userPlan={userPlan}
            />
          )}

          {/* Step 3: Generating - show progress or error */}
          {currentStep === "script" && (
            <div className="text-center py-8">
              {generateMutation.isPending && (
                <div className="inline-flex items-center gap-3 px-6 py-3 bg-primary/10 rounded-lg">
                  <Loader2 className="w-5 h-5 animate-spin text-primary" />
                  <span className="text-sm font-medium">Generating your script...</span>
                </div>
              )}
              {generateMutation.isError && !generatedScript && (
                <div className="space-y-4">
                  <div className="inline-flex items-center gap-3 px-6 py-3 bg-destructive/10 rounded-lg">
                    <X className="w-5 h-5 text-destructive" />
                    <span className="text-sm font-medium text-destructive">
                      Script generation failed. Please try again.
                    </span>
                  </div>
                  <div className="flex items-center justify-center gap-3">
                    <Button
                      variant="outline"
                      onClick={() => setCurrentStep("enhance")}
                      data-testid="button-back-to-enhance"
                    >
                      <ChevronRight className="w-4 h-4 rotate-180 mr-2" />
                      Back to Enhance
                    </Button>
                    <Button
                      onClick={() => enhancedSkeleton && generateFromEnhancedSkeleton(enhancedSkeleton)}
                      data-testid="button-retry-generation"
                    >
                      <RotateCcw className="w-4 h-4 mr-2" />
                      Retry Generation
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
            </>
          )}
        </div>
      )}

      {/* Toggle back to new flow */}
      {showLegacyFlow && !generatedScript && (
        <div className="mb-4">
          <button
            onClick={() => setShowLegacyFlow(false)}
            className="text-xs text-primary hover:text-primary/80 transition-colors flex items-center gap-1"
            data-testid="button-show-clarifier"
          >
            <ArrowRight className="w-3 h-3 rotate-180" />
            Use guided idea clarifier
          </button>
        </div>
      )}

      {recentScripts.length > 0 && showLegacyFlow && (
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <Clock className="w-4 h-4 text-muted-foreground" />
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Recent Scripts</span>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 md:mx-0 md:px-0">
            {recentScripts.map((script: any) => (
              <button
                key={script.id}
                onClick={() => setGeneratedScript(script)}
                className="flex-shrink-0 p-3 rounded-md bg-muted/50 border border-border text-left hover-elevate active-elevate-2 min-w-[200px] max-w-[250px]"
                data-testid={`recent-script-${script.id}`}
              >
                <p className="text-xs text-foreground font-medium line-clamp-2 mb-1">
                  {script.title || script.parameters?.topic?.slice(0, 40) || "Untitled"}
                </p>
                <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                  <span>{script.wordCount} words</span>
                  <span>Grade {script.gradeLevel}</span>
                </div>
              </button>
            ))}
            <button
              onClick={() => {
                setGeneratedScript(null);
                setFormData({
                  topic: "",
                  targetAudience: "",
                  callToAction: "",
                  keyFacts: "",
                  platform: "tiktok",
                  duration: "90",
                  category: "content_creation",
                  structure: "problem_solver",
                  hook: "painful_past",
                  deepResearch: false,
                });
                setActivePreset(null);
              }}
              className="flex-shrink-0 p-3 rounded-md bg-primary/10 border border-primary/30 text-center hover-elevate active-elevate-2 min-w-[120px] flex flex-col items-center justify-center"
              data-testid="button-new-script"
            >
              <RotateCcw className="w-4 h-4 text-primary mb-1" />
              <span className="text-xs text-primary font-medium">New Script</span>
            </button>
          </div>
        </div>
      )}

      {/* Legacy Flow - Advanced Options */}
      {showLegacyFlow && (
      <Card className="p-4 md:p-6 glass-card rounded-md mb-6" data-testid="card-script-parameters">
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-3">
            <Wand2 className="w-4 h-4 text-primary" />
            <span className="text-xs font-semibold text-primary tracking-widest uppercase">Quick Start</span>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3">
            {quickPresets.map((preset) => {
              const Icon = presetIcons[preset.id] || Zap;
              const presetHook = viralHooks.find(h => h.id === preset.hook);
              const isHovered = hoveredPreset === preset.id;
              
              return (
                <Tooltip key={preset.id}>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => handlePresetClick(preset.id)}
                      onMouseEnter={() => setHoveredPreset(preset.id)}
                      onMouseLeave={() => setHoveredPreset(null)}
                      className={`p-3 rounded-md text-left transition-all hover-elevate active-elevate-2 relative ${
                        activePreset === preset.id
                          ? "bg-primary/20 border border-primary/50"
                          : "bg-muted/50 border border-border"
                      }`}
                      data-testid={`button-preset-${preset.id}`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <Icon className="w-4 h-4 text-primary" />
                        <span className="font-medium text-xs md:text-sm text-foreground">{preset.name}</span>
                      </div>
                      <p className="text-[10px] md:text-xs text-muted-foreground line-clamp-1">
                        {preset.description}
                      </p>
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="max-w-xs p-3">
                    <p className="text-xs font-medium text-foreground mb-1">Sample Hook:</p>
                    <p className="text-xs text-muted-foreground italic">"{presetHook?.example}"</p>
                  </TooltipContent>
                </Tooltip>
              );
            })}
          </div>
        </div>

        <div className="mb-4">
          <Label htmlFor="topic" className="text-xs font-medium mb-2 block uppercase tracking-wider">
            Topic / Video Idea <span className="text-primary">*</span>
          </Label>
          <div className="relative">
            <Textarea
              id="topic"
              value={formData.topic}
              onChange={(e) => {
                setFormData((prev) => ({ ...prev, topic: e.target.value }));
                if (expandedBrief) setExpandedBrief(null);
                if (contentSkeleton) {
                  setContentSkeleton(null);
                  setIsSkeletonLocked(false);
                }
              }}
              placeholder="e.g., Why most people fail at content creation..."
              className="bg-background border-input min-h-[80px] text-base pr-12"
              data-testid="input-topic"
            />
            <VoiceInputButton 
              onTranscript={(text) => setFormData(prev => ({ ...prev, topic: prev.topic + " " + text }))}
            />
          </div>
          
          {/* Viral Examples buttons - TikTok & Instagram */}
          {formData.topic.trim().length >= 3 && (
            <div className="mt-2 flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => viralExamplesMutation.mutate({ topic: formData.topic, limit: 8, platform: "tiktok" })}
                disabled={viralSearchPlatform !== null}
                className="bg-pink-500/10 border-pink-500/30 text-pink-400"
                data-testid="button-viral-examples-tiktok"
              >
                {viralSearchPlatform === "tiktok" ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Searching TikTok...
                  </>
                ) : (
                  <>
                    <SiTiktok className="w-3 h-3 mr-2" />
                    TikTok Viral
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => viralExamplesMutation.mutate({ topic: formData.topic, limit: 8, platform: "instagram" })}
                disabled={viralSearchPlatform !== null}
                className="bg-purple-500/10 border-purple-500/30 text-purple-400"
                data-testid="button-viral-examples-instagram"
              >
                {viralSearchPlatform === "instagram" ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Searching Instagram...
                  </>
                ) : (
                  <>
                    <SiInstagram className="w-3 h-3 mr-2" />
                    Instagram Viral
                  </>
                )}
              </Button>
            </div>
          )}
        </div>

        <div className="mb-4 p-3 rounded-md bg-muted/50 border border-border">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Search className="w-4 h-4 text-primary" />
              <div>
                <p className="text-sm font-medium text-foreground">Help Me Build This Out</p>
                <p className="text-[10px] text-muted-foreground">
                  {deepResearch ? "AI turns your rough idea into a clearer outline first" : "Turn this on if your idea is still rough"}
                </p>
              </div>
            </div>
            <Switch
              checked={deepResearch}
              onCheckedChange={(checked) => {
                setDeepResearch(checked);
                if (!checked) {
                  setExpandedBrief(null);
                  setShowBriefEditor(false);
                  setCompetitorInsights(null);
                  setContentSkeleton(null);
                  setIsSkeletonLocked(false);
                }
              }}
              data-testid="switch-deep-research"
            />
          </div>
          
          {deepResearch && (
            <div className="mt-3 pt-3 border-t border-border space-y-3">
              <div className="flex items-center justify-between p-2 rounded bg-blue-500/10 border border-blue-500/20">
                <div className="flex items-center gap-2">
                  <Globe className="w-4 h-4 text-blue-400" />
                  <div>
                    <p className="text-xs font-medium text-foreground">Competitor Examples</p>
                    <p className="text-[10px] text-muted-foreground">Look at top posts on this topic first</p>
                  </div>
                </div>
                <Switch
                  checked={includeCompetitorResearch}
                  onCheckedChange={setIncludeCompetitorResearch}
                  data-testid="switch-competitor-research"
                />
              </div>
              
              {formData.topic.trim().length >= 5 && !contentSkeleton && (
                <div className="flex gap-2">
                  <Button
                    onClick={() => skeletonMutation.mutate({ 
                      topic: formData.topic, 
                      targetAudience: formData.targetAudience,
                      includeCompetitorResearch,
                      viralExamplesData: viralExamples,
                    })}
                    disabled={skeletonMutation.isPending || viralExamplesMutation.isPending}
                    className="flex-1"
                    data-testid="button-generate-outline"
                  >
                    {skeletonMutation.isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        {includeCompetitorResearch ? "Researching..." : "Building outline..."}
                      </>
                    ) : (
                      <>
                        <FileText className="w-4 h-4 mr-2" />
                        Generate Outline
                      </>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => viralExamplesMutation.mutate({ topic: formData.topic, limit: 5 })}
                    disabled={viralExamplesMutation.isPending || skeletonMutation.isPending}
                    data-testid="button-viral-examples"
                  >
                    {viralExamplesMutation.isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <TrendingUp className="w-4 h-4 mr-1" />
                        Viral Examples
                      </>
                    )}
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Viral Examples Panel */}
        {viralExamples && showViralExamples && (
          <div className={`mb-4 p-4 rounded-lg border ${viralExamples.platform === "instagram" ? "bg-gradient-to-br from-purple-500/10 to-pink-500/10 border-purple-500/30" : "bg-gradient-to-br from-pink-500/10 to-purple-500/10 border-pink-500/30"}`}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                {viralExamples.platform === "instagram" ? (
                  <SiInstagram className="w-5 h-5 text-purple-400" />
                ) : (
                  <SiTiktok className="w-5 h-5 text-pink-400" />
                )}
                <span className={`text-sm font-bold uppercase tracking-wider ${viralExamples.platform === "instagram" ? "text-purple-400" : "text-pink-400"}`}>
                  {viralExamples.platform === "instagram" ? "Instagram" : "TikTok"} Viral Examples
                </span>
                <Badge className={viralExamples.platform === "instagram" ? "bg-purple-500/20 text-purple-300 border-purple-500/30" : "bg-pink-500/20 text-pink-300 border-pink-500/30"}>
                  {viralExamples.examples.length} found
                </Badge>
              </div>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setShowViralExamples(false)}
                className="text-xs"
              >
                <X className="w-3 h-3" />
              </Button>
            </div>

            {/* Insights Summary */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4">
              <div className="p-2 rounded bg-muted/50 border border-border text-center">
                <p className="text-[10px] text-muted-foreground uppercase">Avg Views</p>
                <p className="text-sm font-bold text-foreground">
                  {viralExamples.avgViews >= 1000000 
                    ? `${(viralExamples.avgViews / 1000000).toFixed(1)}M`
                    : viralExamples.avgViews >= 1000 
                      ? `${(viralExamples.avgViews / 1000).toFixed(0)}K`
                      : viralExamples.avgViews}
                </p>
              </div>
              <div className="p-2 rounded bg-muted/50 border border-border text-center">
                <p className="text-[10px] text-muted-foreground uppercase">Avg Engagement</p>
                <p className="text-sm font-bold text-foreground">{viralExamples.avgEngagement}%</p>
              </div>
              <div className="p-2 rounded bg-muted/50 border border-border text-center">
                <p className="text-[10px] text-muted-foreground uppercase">Best Duration</p>
                <p className="text-sm font-bold text-foreground">{viralExamples.bestPerformingDuration}</p>
              </div>
              <div className="p-2 rounded bg-muted/50 border border-border text-center">
                <p className="text-[10px] text-muted-foreground uppercase">Top Format</p>
                <p className="text-sm font-bold text-foreground capitalize">{viralExamples.dominantFormats[0] || "Mixed"}</p>
              </div>
            </div>

            {/* Viral Captions */}
            <div className="space-y-3">
              <p className="text-xs font-semibold text-pink-400 uppercase tracking-wider">Top Performing Captions</p>
              <ScrollArea className="h-[300px]">
                <div className="space-y-3 pr-4">
                  {viralExamples.examples.map((example, i) => (
                    <div
                      key={example.id}
                      className="p-3 rounded-md bg-muted/50 border border-border hover-elevate cursor-pointer"
                      onClick={() => {
                        navigator.clipboard.writeText(example.fullCaption);
                        toast({
                          title: "Copied",
                          description: "Caption copied to clipboard",
                        });
                      }}
                    >
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-pink-400">#{i + 1}</span>
                          <Badge variant="secondary" className="text-[10px]">
                            @{example.author}
                          </Badge>
                          <Badge variant="outline" className="text-[10px] capitalize">
                            {example.hookType}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Eye className="w-3 h-3" />
                            {example.views >= 1000000 
                              ? `${(example.views / 1000000).toFixed(1)}M`
                              : `${(example.views / 1000).toFixed(0)}K`}
                          </span>
                          <span className="flex items-center gap-1">
                            <Heart className="w-3 h-3" />
                            {example.likes >= 1000 
                              ? `${(example.likes / 1000).toFixed(0)}K`
                              : example.likes}
                          </span>
                        </div>
                      </div>
                      <p className="text-sm text-foreground leading-relaxed">{example.fullCaption}</p>
                      <div className="flex items-center justify-between gap-2 mt-2">
                        <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                          <span>{example.estimatedWordCount} words</span>
                          <span className="capitalize">{example.formatType.replace("-", " ")}</span>
                          <span>{example.engagementRate}% engagement</span>
                        </div>
                        <a
                          href={example.videoUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="flex items-center gap-1 text-[10px] text-pink-400 hover:text-pink-300 transition-colors"
                          data-testid={`link-viral-example-${example.id}`}
                        >
                          <ExternalLink className="w-3 h-3" />
                          View on TikTok
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          </div>
        )}

        {contentSkeleton && (
          <div className="mb-4 p-4 rounded-lg bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/30">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary" />
                <span className="text-sm font-bold text-primary uppercase tracking-wider">Content Skeleton</span>
                {isSkeletonLocked ? (
                  <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                    <Lock className="w-3 h-3 mr-1" />
                    Locked
                  </Badge>
                ) : (
                  <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30">
                    <Edit3 className="w-3 h-3 mr-1" />
                    Editing Mode
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-2">
                {!isSkeletonLocked && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setContentSkeleton(null);
                      setIsSkeletonLocked(false);
                    }}
                    className="text-xs"
                  >
                    <RotateCcw className="w-3 h-3 mr-1" />
                    Reset
                  </Button>
                )}
              </div>
            </div>

            <div className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="p-3 rounded-md bg-muted/50 border border-border">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Topic Summary</p>
                  {isSkeletonLocked ? (
                    <p className="text-sm text-foreground">{contentSkeleton.topicSummary}</p>
                  ) : (
                    <Textarea
                      value={contentSkeleton.topicSummary}
                      onChange={(e) => setContentSkeleton({ ...contentSkeleton, topicSummary: e.target.value })}
                      className="text-sm bg-transparent border-0 p-0 min-h-[60px] resize-none focus-visible:ring-0"
                    />
                  )}
                </div>
                <div className="p-3 rounded-md bg-muted/50 border border-border">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Unique Angle</p>
                  {isSkeletonLocked ? (
                    <p className="text-sm text-foreground">{contentSkeleton.uniqueAngle}</p>
                  ) : (
                    <Textarea
                      value={contentSkeleton.uniqueAngle}
                      onChange={(e) => setContentSkeleton({ ...contentSkeleton, uniqueAngle: e.target.value })}
                      className="text-sm bg-transparent border-0 p-0 min-h-[60px] resize-none focus-visible:ring-0"
                    />
                  )}
                </div>
              </div>

              {contentSkeleton.researchFacts.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-primary uppercase tracking-wider mb-2">Research Facts</p>
                  <div className="grid gap-2">
                    {contentSkeleton.researchFacts.map((fact) => (
                      <div
                        key={fact.id}
                        className={`p-2 rounded-md border transition-all ${
                          fact.isUsed
                            ? "bg-primary/10 border-primary/30"
                            : "bg-muted/50 border-border opacity-50"
                        }`}
                      >
                        <div className="flex items-start gap-2">
                          {!isSkeletonLocked && (
                            <button
                              onClick={() => toggleFactUsed(fact.id)}
                              className={`mt-0.5 w-4 h-4 rounded border flex items-center justify-center ${
                                fact.isUsed ? "bg-primary border-primary" : "border-border"
                              }`}
                            >
                              {fact.isUsed && <Check className="w-3 h-3 text-white" />}
                            </button>
                          )}
                          <div className="flex-1">
                            <p className="text-sm text-foreground">{fact.fact}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge 
                                variant="outline" 
                                className={`text-[10px] ${
                                  fact.credibility === "high" ? "border-green-500/50 text-green-400" :
                                  fact.credibility === "medium" ? "border-yellow-500/50 text-yellow-400" :
                                  "border-red-500/50 text-red-400"
                                }`}
                              >
                                {fact.credibility}
                              </Badge>
                              {fact.source && (
                                <span className="text-[10px] text-muted-foreground">{fact.source}</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-semibold text-primary uppercase tracking-wider">Video Sections</p>
                  {!isSkeletonLocked && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={addSection}
                      className="h-6 text-xs"
                      data-testid="button-add-section"
                    >
                      <Plus className="w-3 h-3 mr-1" />
                      Add Section
                    </Button>
                  )}
                </div>
                <div className="space-y-3">
                  {contentSkeleton.sections.map((section, sectionIndex) => (
                    <div
                      key={section.id}
                      className="p-3 rounded-md bg-muted/50 border border-border"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="w-6 h-6 rounded-full bg-primary/20 text-primary text-xs font-bold flex items-center justify-center">
                            {sectionIndex + 1}
                          </span>
                          {isSkeletonLocked ? (
                            <span className="font-medium text-sm text-foreground">{section.title}</span>
                          ) : (
                            <Input
                              value={section.title}
                              onChange={(e) => updateSkeletonSection(section.id, { title: e.target.value })}
                              className="h-7 text-sm font-medium bg-transparent border-0 p-0 focus-visible:ring-0"
                            />
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          {isSkeletonLocked ? (
                            <span className="text-[10px] text-muted-foreground font-mono">{section.suggestedDuration}</span>
                          ) : (
                            <>
                              <Input
                                value={section.suggestedDuration}
                                onChange={(e) => updateSkeletonSection(section.id, { suggestedDuration: e.target.value })}
                                className="h-5 w-16 text-[10px] font-mono bg-transparent border border-input px-1 focus-visible:ring-0"
                                placeholder="10s"
                              />
                              {contentSkeleton.sections.length > 1 && (
                                <button
                                  onClick={() => removeSection(section.id)}
                                  className="text-red-400/70 hover:text-red-400"
                                  title="Remove section"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </>
                          )}
                        </div>
                      </div>
                      
                      {isSkeletonLocked ? (
                        <p className="text-xs text-muted-foreground mb-2">{section.objective}</p>
                      ) : (
                        <Textarea
                          value={section.objective}
                          onChange={(e) => updateSkeletonSection(section.id, { objective: e.target.value })}
                          className="text-xs text-muted-foreground bg-transparent border border-input p-2 min-h-[40px] resize-none focus-visible:ring-0 mb-2"
                          placeholder="Section objective..."
                        />
                      )}
                      
                      <div className="space-y-1.5">
                        {section.keyMoments.map((moment, momentIndex) => (
                          <div key={momentIndex} className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground">-</span>
                            {isSkeletonLocked ? (
                              <span className="text-xs text-foreground/80">{moment}</span>
                            ) : (
                              <>
                                <Input
                                  value={moment}
                                  onChange={(e) => updateKeyMoment(section.id, momentIndex, e.target.value)}
                                  className="flex-1 h-6 text-xs bg-transparent border-0 p-0 focus-visible:ring-0 text-foreground/80"
                                />
                                <button
                                  onClick={() => removeKeyMoment(section.id, momentIndex)}
                                  className="text-red-400/70 hover:text-red-400"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </>
                            )}
                          </div>
                        ))}
                        {!isSkeletonLocked && (
                          <button
                            onClick={() => addKeyMoment(section.id)}
                            className="flex items-center gap-1 text-xs text-primary/70 hover:text-primary mt-1"
                          >
                            <Plus className="w-3 h-3" />
                            Add point
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {(contentSkeleton.suggestedHooks.length > 0 || !isSkeletonLocked) && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-semibold text-primary uppercase tracking-wider">Suggested Hooks</p>
                    {!isSkeletonLocked && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={addSuggestedHook}
                        className="h-6 text-xs"
                        data-testid="button-add-hook"
                      >
                        <Plus className="w-3 h-3 mr-1" />
                        Add Hook
                      </Button>
                    )}
                  </div>
                  <div className="space-y-2">
                    {contentSkeleton.suggestedHooks.map((hook, i) => (
                      <div key={i} className="p-2 rounded bg-muted/50 border border-border">
                        {isSkeletonLocked ? (
                          <p className="text-xs text-muted-foreground italic">"{hook}"</p>
                        ) : (
                          <div className="flex items-center gap-2">
                            <Input
                              value={hook}
                              onChange={(e) => updateSuggestedHook(i, e.target.value)}
                              className="flex-1 h-6 text-xs bg-transparent border-0 p-0 focus-visible:ring-0 text-muted-foreground italic"
                            />
                            <button
                              onClick={() => removeSuggestedHook(i)}
                              className="text-red-400/70 hover:text-red-400"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="pt-3 border-t border-primary/20">
                {!isSkeletonLocked ? (
                  <Button
                    onClick={() => setIsSkeletonLocked(true)}
                    className="w-full"
                    data-testid="button-lock-skeleton"
                  >
                    <Lock className="w-4 h-4 mr-2" />
                    Lock In & Continue to Script Options
                  </Button>
                ) : (
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() => setIsSkeletonLocked(false)}
                      className="flex-1"
                      data-testid="button-unlock-skeleton"
                    >
                      <Unlock className="w-4 h-4 mr-2" />
                      Unlock & Edit
                    </Button>
                    <Button
                      onClick={handleGenerate}
                      disabled={generateMutation.isPending || isAnalyzingClone}
                      className="flex-1"
                      data-testid="button-generate-from-skeleton"
                    >
                      {generateMutation.isPending ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Generating...
                        </>
                      ) : (
                        <>
                          <Wand2 className="w-4 h-4 mr-2" />
                          Generate Script
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {expandedBrief && showBriefEditor && (
          <div className="mb-4 p-4 rounded-md bg-primary/5 border border-primary/20">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-primary" />
                <span className="text-sm font-semibold text-primary uppercase tracking-wider">Expanded Video Brief</span>
              </div>
              <Button 
                size="sm" 
                variant="ghost" 
                onClick={() => setShowBriefEditor(false)}
                className="text-xs"
              >
                Hide
              </Button>
            </div>

            {competitorInsights && competitorInsights.topHooks.length > 0 && (
              <div className="mb-4 p-3 rounded-md bg-blue-500/10 border border-blue-500/20">
                <div className="flex items-center gap-2 mb-2">
                  <Globe className="w-4 h-4 text-blue-400" />
                  <span className="text-xs font-semibold text-blue-400 uppercase tracking-wider">Competitor Insights</span>
                  <Badge className="text-[10px] bg-blue-500/20 text-blue-300 border-0">
                    {competitorInsights.postsAnalyzed} posts analyzed
                  </Badge>
                </div>
                <div className="flex gap-4 text-xs text-muted-foreground mb-2">
                  <span>Avg Views: <span className="text-foreground font-mono">{competitorInsights.avgViews.toLocaleString()}</span></span>
                  <span>Avg Likes: <span className="text-foreground font-mono">{competitorInsights.avgLikes.toLocaleString()}</span></span>
                </div>
                <p className="text-xs text-muted-foreground mb-1">Top hooks that worked:</p>
                <ul className="space-y-1">
                  {competitorInsights.topHooks.slice(0, 3).map((hook, i) => (
                    <li key={i} className="text-xs text-muted-foreground italic pl-2 border-l-2 border-blue-500/30">
                      "{hook.length > 80 ? hook.substring(0, 80) + "..." : hook}"
                    </li>
                  ))}
                </ul>
              </div>
            )}
            
            <div className="space-y-3 text-sm">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Core Message</p>
                <p className="text-foreground">{expandedBrief.coreMessage}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Target Viewer</p>
                <p className="text-muted-foreground">{expandedBrief.targetViewer}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Unique Angle</p>
                <p className="text-muted-foreground">{expandedBrief.uniqueAngle}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Key Proof Points</p>
                <ul className="list-disc list-inside text-muted-foreground">
                  {expandedBrief.keyProofPoints.map((point, i) => (
                    <li key={i}>{point}</li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Actionable Takeaway</p>
                <p className="text-primary font-medium">{expandedBrief.actionableTakeaway}</p>
              </div>
            </div>
            
            <div className="flex gap-2 mt-4 pt-3 border-t border-primary/20">
              <Button
                onClick={handleGenerate}
                disabled={generateMutation.isPending || isAnalyzingClone}
                className="flex-1"
                data-testid="button-generate-from-brief"
              >
                {generateMutation.isPending ? "Generating..." : "Generate Script from Brief"}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setExpandedBrief(null);
                  setShowBriefEditor(false);
                  setCompetitorInsights(null);
                }}
                data-testid="button-edit-brief"
              >
                Edit Topic
              </Button>
            </div>
          </div>
        )}

        {currentHook && formData.topic && (
          <div className="mb-4 p-3 rounded-md bg-primary/10 border border-primary/20">
            <div className="flex items-center gap-2 mb-2">
              <Eye className="w-4 h-4 text-primary" />
              <span className="text-xs font-medium text-primary uppercase tracking-wider">Live Hook Preview</span>
            </div>
            <p className="text-sm text-foreground italic" data-testid="live-hook-preview">
              "{liveHookPreview}"
            </p>
            <p className="text-[10px] text-muted-foreground mt-1">
              Using: {currentHook.name} hook
            </p>
          </div>
        )}

        {formData.topic && (
          <div className="mb-4 p-3 rounded-md bg-muted/50 border border-border">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4 text-muted-foreground" />
                <span className="text-xs font-medium text-muted-foreground">
                  {actualWordCount > 0 ? "Script Word Count" : "Target Word Range"}
                </span>
              </div>
              <span className="text-xs text-foreground font-mono">
                {actualWordCount > 0 ? `${actualWordCount} words` : `${wordTarget.min}-${wordTarget.max} words`}
              </span>
            </div>
            <Progress value={wordProgress} className="h-2" />
            <p className="text-[10px] text-muted-foreground mt-1">
              {actualWordCount > 0 
                ? `${actualWordCount < wordTarget.min ? "Below" : actualWordCount > wordTarget.max ? "Above" : "Within"} optimal range for ${formData.platform}`
                : `Awaiting generation - optimized for ${wordTarget.label} ${formData.platform} format`
              }
            </p>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3 mb-4">
          <div>
            <Label className="text-xs font-medium mb-2 block uppercase tracking-wider">Platform</Label>
            <Select
              value={formData.platform}
              onValueChange={(value) => setFormData((prev) => ({ ...prev, platform: value }))}
            >
              <SelectTrigger className="bg-muted/50 border-border" data-testid="select-platform">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {platformOptions.map((opt) => (
                  <SelectItem key={opt.id} value={opt.id}>
                    {opt.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-xs font-medium mb-2 block uppercase tracking-wider">Duration</Label>
            <Select
              value={formData.duration}
              onValueChange={(value) => setFormData((prev) => ({ ...prev, duration: value }))}
            >
              <SelectTrigger className="bg-muted/50 border-border" data-testid="select-duration">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {durationOptions.map((opt) => (
                  <SelectItem key={opt.id} value={opt.id}>
                    {opt.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

        </div>

        <Collapsible open={showAdvanced} onOpenChange={setShowAdvanced}>
          <CollapsibleTrigger asChild>
            <Button 
              variant="outline" 
              size="sm" 
              className={`w-full mb-4 border-dashed ${showAdvanced ? "border-primary/50 text-primary" : "border-border text-foreground/80 bg-muted/50"}`}
              data-testid="button-toggle-advanced"
            >
              {showAdvanced ? (
                <>
                  <ChevronUp className="w-4 h-4 mr-2" />
                  Hide Optional Extras
                </>
              ) : (
                <>
                  <ChevronDown className="w-4 h-4 mr-2" />
                  Optional Extras (most people skip this)
                </>
              )}
            </Button>
          </CollapsibleTrigger>
          
          <CollapsibleContent className="space-y-4">

          <div className="grid grid-cols-2 gap-3 mb-4">

          <div>
            <Label className="text-xs font-medium mb-2 block uppercase tracking-wider">Content Angle</Label>
            <Select
              value={formData.category}
              onValueChange={(value) => setFormData((prev) => ({ ...prev, category: value }))}
            >
              <SelectTrigger className="bg-muted/50 border-border" data-testid="select-category">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {scriptCategories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-xs font-medium mb-2 block uppercase tracking-wider">Format</Label>
            <Select
              value={formData.structure}
              onValueChange={(value) => setFormData((prev) => ({ ...prev, structure: value }))}
            >
              <SelectTrigger className="bg-muted/50 border-border" data-testid="select-structure">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {structureFormats.map((fmt) => (
                  <SelectItem key={fmt.id} value={fmt.id}>
                    {fmt.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="mb-4">
          <Label className="text-xs font-medium mb-2 block uppercase tracking-wider">Video Type</Label>
          <div className="grid grid-cols-3 gap-2">
            {videoTypes.map((vt) => {
              const Icon = videoTypeIcons[vt.id] || Mic;
              const isSelected = (formData.videoType || "talking_head") === vt.id;
              return (
                <button
                  key={vt.id}
                  onClick={() => setFormData((prev) => ({ ...prev, videoType: vt.id }))}
                  className={`p-3 rounded-md text-center transition-all hover-elevate ${
                    isSelected
                      ? "bg-primary/20 border border-primary/50"
                      : "bg-muted/50 border border-border"
                  }`}
                  data-testid={`button-video-type-${vt.id}`}
                >
                  <Icon className={`w-5 h-5 mx-auto mb-1 ${isSelected ? "text-primary" : "text-muted-foreground"}`} />
                  <p className={`text-xs font-medium ${isSelected ? "text-foreground" : "text-muted-foreground"}`}>{vt.name}</p>
                  <p className="text-[10px] text-muted-foreground">{vt.description}</p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Video Clone Feature */}
        <div className="mb-4 p-4 rounded-lg bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/20">
          <div className="flex items-center gap-2 mb-2">
            <ExternalLink className="w-4 h-4 text-purple-400" />
            <Label className="text-xs font-medium uppercase tracking-wider text-purple-300">Clone Video Format</Label>
            <Badge variant="outline" className="text-[10px] border-purple-500/50 text-purple-300">New</Badge>
          </div>
          <p className="text-xs text-muted-foreground mb-3">
            Paste a TikTok, Instagram, or YouTube video URL to clone its format. The AI will analyze the structure and generate your script in that style.
          </p>
          <div className="flex gap-2">
            <Input
              placeholder="Paste TikTok, Instagram, or YouTube URL..."
              value={cloneVideoUrl}
              onChange={(e) => setCloneVideoUrl(e.target.value)}
              className="flex-1 text-sm"
              data-testid="input-clone-video-url"
            />
            <Button
              variant="outline"
              size="sm"
              onClick={async () => {
                if (!cloneVideoUrl.trim()) {
                  toast({ title: "Enter a video URL", variant: "destructive" });
                  return;
                }
                setIsAnalyzingClone(true);
                try {
                  const res = await apiRequest("POST", "/api/video-clone/analyze", { videoUrl: cloneVideoUrl.trim() });
                  const data = await res.json();
                  if (data.error) {
                    toast({ title: "Error", description: data.error, variant: "destructive" });
                  } else {
                    setClonedStructure(data);
                    toast({ title: "Video Analyzed!", description: `Format: ${data.analysis?.format || 'detected'}. Your script will follow this structure.` });
                  }
                } catch (err: any) {
                  toast({ title: "Failed to analyze video", description: err.message, variant: "destructive" });
                } finally {
                  setIsAnalyzingClone(false);
                }
              }}
              disabled={isAnalyzingClone || !cloneVideoUrl.trim()}
              className="shrink-0"
              data-testid="button-analyze-clone"
            >
              {isAnalyzingClone ? (
                <>
                  <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Search className="w-4 h-4 mr-1" />
                  Analyze
                </>
              )}
            </Button>
          </div>
          
          {clonedStructure && (
            <div className="mt-3 p-3 bg-background/50 rounded-md border border-purple-500/30">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-purple-300">Structure Detected</span>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-6 px-2 text-xs text-muted-foreground"
                  onClick={() => { setClonedStructure(null); setCloneVideoUrl(""); }}
                >
                  <X className="w-3 h-3 mr-1" />
                  Clear
                </Button>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-muted-foreground">Format:</span>{" "}
                  <span className="text-foreground font-medium">{clonedStructure.analysis?.format?.replace(/_/g, " ")}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Hook:</span>{" "}
                  <span className="text-foreground font-medium">{String(clonedStructure.analysis?.hookAnalysis?.style || clonedStructure.analysis?.hookStyle || "").replace(/_/g, " ")}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Pacing:</span>{" "}
                  <span className="text-foreground font-medium">{String(typeof clonedStructure.analysis?.pacing === 'object' ? clonedStructure.analysis?.pacing?.overall : clonedStructure.analysis?.pacing || "").replace(/_/g, " ")}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Sections:</span>{" "}
                  <span className="text-foreground font-medium">{clonedStructure.analysis?.sections?.length || 0}</span>
                </div>
              </div>
              {clonedStructure.analysis?.keyPatterns?.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {clonedStructure.analysis.keyPatterns.slice(0, 4).map((pattern: string, idx: number) => (
                    <Badge key={idx} variant="secondary" className="text-[10px]">{pattern}</Badge>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="mb-4">
          <Label className="text-xs font-medium mb-3 block uppercase tracking-wider">Hook Strategy (50 Viral Hooks)</Label>
          
          <Tabs defaultValue="personal_experience" className="w-full">
            <ScrollArea className="w-full">
              <TabsList className="w-full h-auto flex flex-wrap gap-1 bg-muted/50 p-1.5 rounded-lg mb-3">
                {hookCategories.map((category) => (
                  <TabsTrigger 
                    key={category.id} 
                    value={category.id}
                    className="text-xs px-3 py-1.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                  >
                    {category.name}
                  </TabsTrigger>
                ))}
              </TabsList>
            </ScrollArea>
            
            {hookCategories.map((category) => (
              <TabsContent key={category.id} value={category.id} className="mt-0">
                <p className="text-xs text-muted-foreground mb-3">{category.description}</p>
                <div className="grid gap-2 max-h-[280px] overflow-y-auto pr-1">
                  {viralHooks
                    .filter((h) => h.category === category.id)
                    .map((hook) => {
                      const isSelected = formData.hook === hook.id;
                      return (
                        <button
                          key={hook.id}
                          onClick={() => setFormData((prev) => ({ ...prev, hook: hook.id }))}
                          className={`w-full text-left p-3 rounded-lg transition-all hover-elevate ${
                            isSelected
                              ? "bg-primary/20 border-2 border-primary/60"
                              : "bg-muted/50 border border-border"
                          }`}
                          data-testid={`button-hook-${hook.id}`}
                        >
                          <div className="flex items-start justify-between gap-2 mb-1.5">
                            <span className={`font-medium text-sm ${isSelected ? "text-primary" : "text-foreground"}`}>
                              {hook.name}
                            </span>
                            {isSelected && (
                              <Badge variant="outline" className="text-[10px] border-primary/50 text-primary shrink-0">
                                Selected
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground italic leading-relaxed mb-1.5">
                            "{hook.example}"
                          </p>
                          <p className="text-[11px] text-muted-foreground leading-relaxed">
                            {hook.why}
                          </p>
                        </button>
                      );
                    })}
                </div>
              </TabsContent>
            ))}
          </Tabs>

          {currentHook && (
            <div className="mt-3 p-3 rounded-lg bg-primary/10 border border-primary/30">
              <div className="flex items-center gap-2 mb-2">
                <Zap className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium text-primary">Your Hook</span>
              </div>
              <p className="text-sm text-muted-foreground italic">"{currentHook.example}"</p>
              <p className="text-xs text-muted-foreground mt-2">Template: {currentHook.template}</p>
            </div>
          )}
        </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="audience" className="text-xs font-medium mb-2 block uppercase tracking-wider">Target Audience</Label>
                <Input
                  id="audience"
                  value={formData.targetAudience}
                  onChange={(e) => setFormData((prev) => ({ ...prev, targetAudience: e.target.value }))}
                  placeholder="e.g., Aspiring content creators..."
                  className="bg-muted/50 border-border"
                  data-testid="input-audience"
                />
              </div>
              <div>
                <Label className="text-xs font-medium mb-2 block uppercase tracking-wider">Call to Action</Label>
                <Select
                  value={formData.selectedCtaId || "custom"}
                  onValueChange={(value) => {
                    if (value === "custom") {
                      setFormData((prev) => ({ ...prev, selectedCtaId: "", customCta: prev.customCta }));
                    } else {
                      const selectedCta = ctaOptions.find(c => c.id === value);
                      setFormData((prev) => ({ 
                        ...prev, 
                        selectedCtaId: value, 
                        callToAction: selectedCta?.text || "",
                        customCta: "" 
                      }));
                    }
                  }}
                >
                  <SelectTrigger className="bg-muted/50 border-border" data-testid="select-cta">
                    <SelectValue placeholder="Choose a CTA..." />
                  </SelectTrigger>
                  <SelectContent className="max-h-72">
                    <SelectItem value="custom">
                      <span className="text-muted-foreground">Write Custom CTA</span>
                    </SelectItem>
                    {ctaCategories.map((category) => (
                      <div key={category.id}>
                        <div className="px-2 py-1.5 text-xs font-semibold text-primary">{category.name}</div>
                        {ctaOptions
                          .filter((cta) => cta.category === category.id)
                          .map((cta) => (
                            <SelectItem key={cta.id} value={cta.id}>
                              {cta.short}
                            </SelectItem>
                          ))}
                      </div>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {(!formData.selectedCtaId) && (
              <div>
                <Label htmlFor="customCta" className="text-xs font-medium mb-2 block uppercase tracking-wider">Custom CTA</Label>
                <Input
                  id="customCta"
                  value={formData.customCta || ""}
                  onChange={(e) => setFormData((prev) => ({ ...prev, customCta: e.target.value }))}
                  placeholder="e.g., Follow for more tips..."
                  className="bg-muted/50 border-border"
                  data-testid="input-custom-cta"
                />
              </div>
            )}

            {formData.selectedCtaId && (
              <div className="p-2 rounded bg-muted/50 border border-border">
                <p className="text-[10px] text-muted-foreground mb-1">Selected CTA:</p>
                <p className="text-xs text-foreground">"{ctaOptions.find(c => c.id === formData.selectedCtaId)?.text}"</p>
              </div>
            )}

            <div>
              <Label htmlFor="facts" className="text-xs font-medium mb-2 block uppercase tracking-wider">Key Facts / Stats (Optional)</Label>
              <Textarea
                id="facts"
                value={formData.keyFacts}
                onChange={(e) => setFormData((prev) => ({ ...prev, keyFacts: e.target.value }))}
                placeholder="e.g., 10x growth, 50k followers, used by top creators..."
                className="bg-muted/50 border-border min-h-[60px]"
                data-testid="input-facts"
              />
            </div>

            <div>
              <Label htmlFor="referenceScript" className="text-xs font-medium mb-2 block uppercase tracking-wider">
                <div className="flex items-center gap-2">
                  <FileText className="w-3 h-3 text-primary" />
                  Reference Script (Optional)
                </div>
              </Label>
              <Textarea
                id="referenceScript"
                value={formData.referenceScript || ""}
                onChange={(e) => setFormData((prev) => ({ ...prev, referenceScript: e.target.value }))}
                placeholder="Paste a viral script you want to learn from... The AI will analyze its structure, hook style, pacing, and tone to generate a similar script for your topic."
                className="bg-muted/50 border-border min-h-[100px]"
                maxLength={5000}
                data-testid="input-reference-script"
              />
              <p className="text-[10px] text-muted-foreground mt-1">
                {formData.referenceScript 
                  ? `${formData.referenceScript.length}/5000 characters${formData.referenceScript.length < 50 ? " (min 50 chars for AI analysis)" : " - AI will analyze this script"}` 
                  : "Paste 50+ chars for AI to analyze hook type, structure, tone, pacing, and unique patterns"}
              </p>
            </div>

            <div>
              <Label className="text-xs font-medium mb-2 block uppercase tracking-wider">Creator Style (16 Famous Creators)</Label>
              <Select
                value={formData.creatorStyle || "default"}
                onValueChange={(value) => setFormData((prev) => ({ ...prev, creatorStyle: value }))}
              >
                <SelectTrigger className="bg-muted/50 border-border" data-testid="select-creator-style">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="max-h-96">
                  <SelectItem value="default">
                    <div className="flex items-center gap-2">
                      <Target className="w-4 h-4" />
                      <span>Default - Optimized for Virality</span>
                    </div>
                  </SelectItem>
                  {creatorNiches.map((niche) => {
                    const NicheIcon = nicheIcons[niche.id] || Target;
                    const nicheCreators = extendedCreatorStyles.filter(c => c.nicheId === niche.id);
                    return (
                      <div key={niche.id}>
                        <div className="px-2 py-1.5 text-xs font-semibold text-primary flex items-center gap-2">
                          <NicheIcon className="w-3 h-3" />
                          {niche.name}
                        </div>
                        {nicheCreators.map((cs) => {
                          const Icon = creatorStyleIcons[cs.id] || Target;
                          return (
                            <SelectItem key={cs.id} value={cs.id}>
                              <div className="flex items-center gap-2">
                                <Icon className="w-4 h-4" />
                                <span>{cs.name}</span>
                                <span className="text-muted-foreground text-xs">{cs.followers}</span>
                              </div>
                            </SelectItem>
                          );
                        })}
                      </div>
                    );
                  })}
                </SelectContent>
              </Select>
              {formData.creatorStyle && formData.creatorStyle !== "default" && (
                <div className="mt-2 p-2 rounded bg-muted/50 border border-border">
                  <p className="text-[10px] text-muted-foreground mb-1">Style: {extendedCreatorStyles.find(c => c.id === formData.creatorStyle)?.tone}</p>
                  <p className="text-[10px] text-muted-foreground italic">
                    "{extendedCreatorStyles.find(c => c.id === formData.creatorStyle)?.exampleHook}"
                  </p>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between p-3 rounded-md bg-primary/10 border border-primary/20">
              <div className="flex items-center gap-3">
                <BookOpen className="w-4 h-4 text-primary" />
                <div>
                  <p className="text-sm font-medium text-foreground">Use Knowledge Base</p>
                  <p className="text-[10px] text-muted-foreground">
                    {!user 
                      ? "Sign in to use your personalized Knowledge Base"
                      : knowledgeBaseDocs.length > 0 
                        ? `${knowledgeBaseDocs.length} docs loaded - AI uses your brand voice`
                        : "Add docs in Knowledge Base to enable"
                    }
                  </p>
                </div>
              </div>
              {!user ? (
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={() => window.location.href = "/login"}
                  data-testid="button-login-kb-toggle"
                >
                  Sign In
                </Button>
              ) : (
                <Switch
                  checked={useKnowledgeBase}
                  onCheckedChange={setUseKnowledgeBase}
                  disabled={knowledgeBaseDocs.length === 0}
                  data-testid="switch-knowledge-base"
                />
              )}
            </div>

          </CollapsibleContent>
        </Collapsible>

        <Button
          onClick={handleGenerate}
          disabled={generateMutation.isPending || !formData.topic.trim()}
          className="w-full h-11 text-sm font-semibold hidden md:flex"
          data-testid="button-generate"
        >
          {generateMutation.isPending ? (
            <>
              <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin mr-2" />
              Generating...
            </>
          ) : (
            <>
              GENERATE SCRIPT
              <ArrowRight className="w-4 h-4 ml-2" />
            </>
          )}
        </Button>
      </Card>
      )}

      <GenerationProgress 
        isGenerating={generateMutation.isPending}
        streamProgress={streamProgress}
        onCancel={cancelStream}
        hasResearch={deepResearch}
      />

      {!generateMutation.isPending && !batchGenerateMutation.isPending && formData.topic.trim().length > 0 && !generatedScript && (
        <div className="mb-4 flex justify-center">
          <Button
            variant="outline"
            onClick={handleGenerateBatch}
            data-testid="button-generate-batch"
          >
            <Sparkles className="w-4 h-4 mr-2" />
            Generate 3 Options
          </Button>
        </div>
      )}

      {batchGenerateMutation.isPending && (
        <div className="mb-4 flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="w-4 h-4 animate-spin" />
          Generating multiple script variations...
        </div>
      )}

      {batchScripts.length > 1 && (
        <Card className="mb-4 p-4 border-primary/20 bg-primary/5">
          <div className="flex items-center justify-between mb-3 gap-3 flex-wrap">
            <div>
              <h3 className="text-sm font-semibold">Compare Options</h3>
              <p className="text-xs text-muted-foreground">Pick the version you want to keep.</p>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="outline">{batchScripts.length} options</Badge>
              <Select value={batchSortMode} onValueChange={(value: "quality" | "duration" | "words") => setBatchSortMode(value)}>
                <SelectTrigger className="w-[170px] h-8 text-xs" data-testid="select-batch-sort">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="quality">Sort by Quality</SelectItem>
                  <SelectItem value="duration">Sort by Duration Fit</SelectItem>
                  <SelectItem value="words">Sort by Word Count</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-3 lg:grid-cols-3">
            {sortedBatchScripts.map((script, idx) => {
              const lines = script.script.split("\n").filter(Boolean);
              const preview = lines.slice(0, 3).join(" ");
              const selected = generatedScript?.id === script.id;
              const quality = script.qualityReport;
              const isTop = idx === 0 && batchSortMode === "quality";

              return (
                <div
                  key={script.id}
                  className={`p-4 rounded-md border transition ${selected ? "border-primary bg-primary/10" : "border-border bg-background"}`}
                  data-testid={`card-variation-${idx + 1}`}
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-medium text-primary">Variation {idx + 1}</span>
                      {isTop && <Badge className="bg-green-500/20 text-green-400 border-0">Recommended</Badge>}
                      {selected && <Badge className="bg-primary/20 text-primary border-0">Selected</Badge>}
                    </div>
                    <span className="text-[10px] text-muted-foreground">{script.wordCount} words</span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 mb-3 text-[10px]">
                    <div className="p-2 rounded bg-muted/40 border border-border">
                      <p className="text-muted-foreground">Quality</p>
                      <p className="font-semibold text-foreground">{quality?.overallScore ?? "-"}</p>
                    </div>
                    <div className="p-2 rounded bg-muted/40 border border-border">
                      <p className="text-muted-foreground">Runtime</p>
                      <p className="font-semibold text-foreground">{quality?.estimatedSeconds ?? "-"}s</p>
                    </div>
                  </div>

                  <div className="mb-3">
                    <p className="text-[10px] text-muted-foreground mb-1">Hook Preview</p>
                    <p className="text-xs font-medium text-foreground">{lines[0] || "No hook generated"}</p>
                  </div>

                  <p className="text-xs text-muted-foreground mb-3">{preview}</p>

                  <div className="flex gap-2">
                    <Button
                      variant={selected ? "default" : "outline"}
                      size="sm"
                      className="flex-1"
                      onClick={() => setGeneratedScript(script)}
                      data-testid={`button-select-variation-${idx + 1}`}
                    >
                      {selected ? "Using This" : "Use This"}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setGeneratedScript(script);
                        setLockedVoiceReference({
                          scriptId: script.id,
                          scriptText: script.script,
                          label: `Variation ${idx + 1}`,
                        });
                        toast({ title: "Voice Locked", description: `Future generations will follow Variation ${idx + 1}'s voice.` });
                      }}
                      data-testid={`button-lock-variation-voice-${idx + 1}`}
                    >
                      <Lock className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}
      
      {generatedScript && (
        <ScriptOutput 
          script={generatedScript} 
          onRegenerate={handleGenerate}
          isRegenerating={generateMutation.isPending}
        />
      )}

      {showLegacyFlow && (
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-background/95 backdrop-blur border-t border-border md:hidden z-50">
        <Button
          onClick={handleGenerate}
          disabled={generateMutation.isPending || !formData.topic.trim()}
          className="w-full h-12 text-base font-semibold"
          data-testid="button-generate-mobile"
        >
          {generateMutation.isPending ? (
            <>
              <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin mr-2" />
              Generating...
            </>
          ) : (
            <>
              GENERATE SCRIPT
              <ArrowRight className="w-4 h-4 ml-2" />
            </>
          )}
        </Button>
      </div>
      )}
    </div>
  );
}
