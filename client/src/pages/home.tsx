import { useState, useMemo } from "react";
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
import { apiRequest } from "@/lib/queryClient";
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
} from "@shared/schema";
import { ScriptOutput } from "@/components/script-output";
import { 
  Sparkles, 
  ArrowRight, 
  Zap,
  Lightbulb, 
  TrendingUp, 
  Cpu, 
  Heart,
  Search,
  ChevronDown,
  ChevronUp,
  Clock,
  Eye,
  RotateCcw,
  Target,
  BookOpen,
  Mic,
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
} from "lucide-react";

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

export default function Home() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [generatedScript, setGeneratedScript] = useState<GeneratedScript | null>(null);
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
  const [viralExamples, setViralExamples] = useState<ViralExamplesResult | null>(null);
  const [showViralExamples, setShowViralExamples] = useState(false);

  const [formData, setFormData] = useState<ScriptParameters>({
    topic: "",
    targetAudience: "",
    callToAction: "",
    selectedCtaId: "",
    customCta: "",
    keyFacts: "",
    platform: "tiktok",
    duration: "30",
    category: "content_creation",
    structure: "problem_solver",
    hook: "painful_past",
    deepResearch: false,
    videoType: "talking_head",
    creatorStyle: "default",
    referenceScript: "",
  });

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

  const generateMutation = useMutation({
    mutationFn: async (params: ScriptParameters) => {
      const res = await apiRequest("POST", "/api/scripts/generate", params);
      return res.json();
    },
    onSuccess: (data: GeneratedScript) => {
      setGeneratedScript(data);
      setExpandedBrief(null); // Clear brief after generating
      setShowBriefEditor(false);
      toast({
        title: "Script Generated",
        description: "Your video script is ready!",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to generate script. Please try again.",
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

  // Viral Examples - fetch top TikTok captions for inspiration
  const viralExamplesMutation = useMutation({
    mutationFn: async ({ topic, limit = 5 }: { topic: string; limit?: number }) => {
      const res = await apiRequest("POST", "/api/viral-examples", { topic, limit });
      return res.json();
    },
    onSuccess: (data: ViralExamplesResult & { success: boolean }) => {
      if (data.success) {
        setViralExamples(data);
        setShowViralExamples(true);
        toast({
          title: "Viral Examples Found",
          description: `Found ${data.examples.length} top-performing captions for inspiration.`,
        });
      }
    },
    onError: (error: any) => {
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

  const handleGenerate = () => {
    if (!formData.topic.trim()) {
      toast({
        title: "Topic Required",
        description: "Please enter a topic or video idea.",
        variant: "destructive",
      });
      return;
    }
    // Pass skeleton data when locked - filter out placeholder key moments
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
    generateMutation.mutate({ ...formData, deepResearch, useKnowledgeBase, ...skeletonData });
  };

  const currentHook = useMemo(() => {
    return viralHooks.find(h => h.id === formData.hook);
  }, [formData.hook]);

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
        <h1 className="text-xl md:text-2xl font-bold text-white mb-1" data-testid="text-page-title">
          What do you want to create today?
        </h1>
        <p className="text-sm text-muted-foreground">
          Generate scroll-stopping scripts in seconds
        </p>
      </div>

      {recentScripts.length > 0 && (
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
                className="flex-shrink-0 p-3 rounded-md bg-white/5 border border-white/10 text-left hover-elevate active-elevate-2 min-w-[200px] max-w-[250px]"
                data-testid={`recent-script-${script.id}`}
              >
                <p className="text-xs text-white font-medium line-clamp-2 mb-1">
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
                  duration: "30",
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

      <Card className="p-4 md:p-6 glass-card rounded-md mb-6" data-testid="card-script-parameters">
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-4 h-4 text-primary" />
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
                          : "bg-white/5 border border-white/10"
                      }`}
                      data-testid={`button-preset-${preset.id}`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <Icon className="w-4 h-4 text-primary" />
                        <span className="font-medium text-xs md:text-sm text-white">{preset.name}</span>
                      </div>
                      <p className="text-[10px] md:text-xs text-muted-foreground line-clamp-1">
                        {preset.description}
                      </p>
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="max-w-xs p-3">
                    <p className="text-xs font-medium text-white mb-1">Sample Hook:</p>
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
          <Textarea
            id="topic"
            value={formData.topic}
            onChange={(e) => {
              setFormData((prev) => ({ ...prev, topic: e.target.value }));
              // Clear research content when topic changes
              if (expandedBrief) setExpandedBrief(null);
              if (contentSkeleton) {
                setContentSkeleton(null);
                setIsSkeletonLocked(false);
              }
            }}
            placeholder="e.g., Why most people fail at content creation..."
            className="bg-white/5 border-white/10 min-h-[80px] text-base"
            data-testid="input-topic"
          />
        </div>

        <div className="mb-4 p-3 rounded-md bg-white/5 border border-white/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Search className="w-4 h-4 text-primary" />
              <div>
                <p className="text-sm font-medium text-white">Deep Research Mode</p>
                <p className="text-[10px] text-muted-foreground">
                  {deepResearch ? "AI expands your idea into a detailed brief first" : "Turn ON if your idea is raw/basic"}
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
            <div className="mt-3 pt-3 border-t border-white/10 space-y-3">
              <div className="flex items-center justify-between p-2 rounded bg-blue-500/10 border border-blue-500/20">
                <div className="flex items-center gap-2">
                  <Globe className="w-4 h-4 text-blue-400" />
                  <div>
                    <p className="text-xs font-medium text-white">Competitor Research</p>
                    <p className="text-[10px] text-muted-foreground">Analyze top TikTok posts for this topic</p>
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
                  {user && (user.plan === "pro" || user.plan === "ultimate") && (
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
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Viral Examples Panel */}
        {viralExamples && showViralExamples && (
          <div className="mb-4 p-4 rounded-lg bg-gradient-to-br from-pink-500/10 to-purple-500/10 border border-pink-500/30">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-pink-400" />
                <span className="text-sm font-bold text-pink-400 uppercase tracking-wider">Viral Examples</span>
                <Badge className="bg-pink-500/20 text-pink-300 border-pink-500/30">
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
              <div className="p-2 rounded bg-white/5 border border-white/10 text-center">
                <p className="text-[10px] text-muted-foreground uppercase">Avg Views</p>
                <p className="text-sm font-bold text-white">
                  {viralExamples.avgViews >= 1000000 
                    ? `${(viralExamples.avgViews / 1000000).toFixed(1)}M`
                    : viralExamples.avgViews >= 1000 
                      ? `${(viralExamples.avgViews / 1000).toFixed(0)}K`
                      : viralExamples.avgViews}
                </p>
              </div>
              <div className="p-2 rounded bg-white/5 border border-white/10 text-center">
                <p className="text-[10px] text-muted-foreground uppercase">Avg Engagement</p>
                <p className="text-sm font-bold text-white">{viralExamples.avgEngagement}%</p>
              </div>
              <div className="p-2 rounded bg-white/5 border border-white/10 text-center">
                <p className="text-[10px] text-muted-foreground uppercase">Best Duration</p>
                <p className="text-sm font-bold text-white">{viralExamples.bestPerformingDuration}</p>
              </div>
              <div className="p-2 rounded bg-white/5 border border-white/10 text-center">
                <p className="text-[10px] text-muted-foreground uppercase">Top Format</p>
                <p className="text-sm font-bold text-white capitalize">{viralExamples.dominantFormats[0] || "Mixed"}</p>
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
                      className="p-3 rounded-md bg-white/5 border border-white/10 hover-elevate cursor-pointer"
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
                      <p className="text-sm text-white leading-relaxed">{example.fullCaption}</p>
                      <div className="flex items-center gap-2 mt-2 text-[10px] text-muted-foreground">
                        <span>{example.estimatedWordCount} words</span>
                        <span className="capitalize">{example.formatType.replace("_", " ")}</span>
                        <span>{example.engagementRate}% engagement</span>
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
                <div className="p-3 rounded-md bg-white/5 border border-white/10">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Topic Summary</p>
                  {isSkeletonLocked ? (
                    <p className="text-sm text-white">{contentSkeleton.topicSummary}</p>
                  ) : (
                    <Textarea
                      value={contentSkeleton.topicSummary}
                      onChange={(e) => setContentSkeleton({ ...contentSkeleton, topicSummary: e.target.value })}
                      className="text-sm bg-transparent border-0 p-0 min-h-[60px] resize-none focus-visible:ring-0"
                    />
                  )}
                </div>
                <div className="p-3 rounded-md bg-white/5 border border-white/10">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Unique Angle</p>
                  {isSkeletonLocked ? (
                    <p className="text-sm text-white">{contentSkeleton.uniqueAngle}</p>
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
                            : "bg-white/5 border-white/10 opacity-50"
                        }`}
                      >
                        <div className="flex items-start gap-2">
                          {!isSkeletonLocked && (
                            <button
                              onClick={() => toggleFactUsed(fact.id)}
                              className={`mt-0.5 w-4 h-4 rounded border flex items-center justify-center ${
                                fact.isUsed ? "bg-primary border-primary" : "border-white/30"
                              }`}
                            >
                              {fact.isUsed && <Check className="w-3 h-3 text-white" />}
                            </button>
                          )}
                          <div className="flex-1">
                            <p className="text-sm text-white">{fact.fact}</p>
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
                      className="p-3 rounded-md bg-white/5 border border-white/10"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="w-6 h-6 rounded-full bg-primary/20 text-primary text-xs font-bold flex items-center justify-center">
                            {sectionIndex + 1}
                          </span>
                          {isSkeletonLocked ? (
                            <span className="font-medium text-sm text-white">{section.title}</span>
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
                                className="h-5 w-16 text-[10px] font-mono bg-transparent border border-white/20 px-1 focus-visible:ring-0"
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
                          className="text-xs text-muted-foreground bg-transparent border border-white/20 p-2 min-h-[40px] resize-none focus-visible:ring-0 mb-2"
                          placeholder="Section objective..."
                        />
                      )}
                      
                      <div className="space-y-1.5">
                        {section.keyMoments.map((moment, momentIndex) => (
                          <div key={momentIndex} className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground">-</span>
                            {isSkeletonLocked ? (
                              <span className="text-xs text-white/80">{moment}</span>
                            ) : (
                              <>
                                <Input
                                  value={moment}
                                  onChange={(e) => updateKeyMoment(section.id, momentIndex, e.target.value)}
                                  className="flex-1 h-6 text-xs bg-transparent border-0 p-0 focus-visible:ring-0 text-white/80"
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
                      <div key={i} className="p-2 rounded bg-white/5 border border-white/10">
                        {isSkeletonLocked ? (
                          <p className="text-xs text-white/80 italic">"{hook}"</p>
                        ) : (
                          <div className="flex items-center gap-2">
                            <Input
                              value={hook}
                              onChange={(e) => updateSuggestedHook(i, e.target.value)}
                              className="flex-1 h-6 text-xs bg-transparent border-0 p-0 focus-visible:ring-0 text-white/80 italic"
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
                      disabled={generateMutation.isPending}
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
                          <Sparkles className="w-4 h-4 mr-2" />
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
                  <span>Avg Views: <span className="text-white font-mono">{competitorInsights.avgViews.toLocaleString()}</span></span>
                  <span>Avg Likes: <span className="text-white font-mono">{competitorInsights.avgLikes.toLocaleString()}</span></span>
                </div>
                <p className="text-xs text-muted-foreground mb-1">Top hooks that worked:</p>
                <ul className="space-y-1">
                  {competitorInsights.topHooks.slice(0, 3).map((hook, i) => (
                    <li key={i} className="text-xs text-white/80 italic pl-2 border-l-2 border-blue-500/30">
                      "{hook.length > 80 ? hook.substring(0, 80) + "..." : hook}"
                    </li>
                  ))}
                </ul>
              </div>
            )}
            
            <div className="space-y-3 text-sm">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Core Message</p>
                <p className="text-white">{expandedBrief.coreMessage}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Target Viewer</p>
                <p className="text-white/80">{expandedBrief.targetViewer}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Unique Angle</p>
                <p className="text-white/80">{expandedBrief.uniqueAngle}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Key Proof Points</p>
                <ul className="list-disc list-inside text-white/80">
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
                disabled={generateMutation.isPending}
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
            <p className="text-sm text-white italic" data-testid="live-hook-preview">
              "{liveHookPreview}"
            </p>
            <p className="text-[10px] text-muted-foreground mt-1">
              Using: {currentHook.name} hook
            </p>
          </div>
        )}

        {formData.topic && (
          <div className="mb-4 p-3 rounded-md bg-white/5 border border-white/10">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4 text-muted-foreground" />
                <span className="text-xs font-medium text-muted-foreground">
                  {actualWordCount > 0 ? "Script Word Count" : "Target Word Range"}
                </span>
              </div>
              <span className="text-xs text-white font-mono">
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

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
          <div>
            <Label className="text-xs font-medium mb-2 block uppercase tracking-wider">Platform</Label>
            <Select
              value={formData.platform}
              onValueChange={(value) => setFormData((prev) => ({ ...prev, platform: value }))}
            >
              <SelectTrigger className="bg-white/5 border-white/10" data-testid="select-platform">
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
              <SelectTrigger className="bg-white/5 border-white/10" data-testid="select-duration">
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

          <div>
            <Label className="text-xs font-medium mb-2 block uppercase tracking-wider">Category</Label>
            <Select
              value={formData.category}
              onValueChange={(value) => setFormData((prev) => ({ ...prev, category: value }))}
            >
              <SelectTrigger className="bg-white/5 border-white/10" data-testid="select-category">
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
            <Label className="text-xs font-medium mb-2 block uppercase tracking-wider">Structure</Label>
            <Select
              value={formData.structure}
              onValueChange={(value) => setFormData((prev) => ({ ...prev, structure: value }))}
            >
              <SelectTrigger className="bg-white/5 border-white/10" data-testid="select-structure">
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
                      : "bg-white/5 border border-white/10"
                  }`}
                  data-testid={`button-video-type-${vt.id}`}
                >
                  <Icon className={`w-5 h-5 mx-auto mb-1 ${isSelected ? "text-primary" : "text-white/70"}`} />
                  <p className={`text-xs font-medium ${isSelected ? "text-white" : "text-white/80"}`}>{vt.name}</p>
                  <p className="text-[10px] text-muted-foreground">{vt.description}</p>
                </button>
              );
            })}
          </div>
        </div>

        <div className="mb-4">
          <Label className="text-xs font-medium mb-3 block uppercase tracking-wider">Hook Strategy (50 Viral Hooks)</Label>
          
          <Tabs defaultValue="personal_experience" className="w-full">
            <ScrollArea className="w-full">
              <TabsList className="w-full h-auto flex flex-wrap gap-1 bg-white/5 p-1.5 rounded-lg mb-3">
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
                              : "bg-white/5 border border-white/10"
                          }`}
                          data-testid={`button-hook-${hook.id}`}
                        >
                          <div className="flex items-start justify-between gap-2 mb-1.5">
                            <span className={`font-medium text-sm ${isSelected ? "text-primary" : "text-white"}`}>
                              {hook.name}
                            </span>
                            {isSelected && (
                              <Badge variant="outline" className="text-[10px] border-primary/50 text-primary shrink-0">
                                Selected
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-white/80 italic leading-relaxed mb-1.5">
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
              <p className="text-sm text-white/90 italic">"{currentHook.example}"</p>
              <p className="text-xs text-muted-foreground mt-2">Template: {currentHook.template}</p>
            </div>
          )}
        </div>

        <Collapsible open={showAdvanced} onOpenChange={setShowAdvanced}>
          <CollapsibleTrigger asChild>
            <Button 
              variant="outline" 
              size="sm" 
              className={`w-full mb-4 border-dashed ${showAdvanced ? "border-primary/50 text-primary" : "border-white/30 text-white/80 bg-white/5"}`}
              data-testid="button-toggle-advanced"
            >
              {showAdvanced ? (
                <>
                  <ChevronUp className="w-4 h-4 mr-2" />
                  Hide Advanced Options
                </>
              ) : (
                <>
                  <ChevronDown className="w-4 h-4 mr-2" />
                  Customize: Audience, CTA, Facts & Research
                </>
              )}
            </Button>
          </CollapsibleTrigger>
          
          <CollapsibleContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="audience" className="text-xs font-medium mb-2 block uppercase tracking-wider">Target Audience</Label>
                <Input
                  id="audience"
                  value={formData.targetAudience}
                  onChange={(e) => setFormData((prev) => ({ ...prev, targetAudience: e.target.value }))}
                  placeholder="e.g., Aspiring content creators..."
                  className="bg-white/5 border-white/10"
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
                  <SelectTrigger className="bg-white/5 border-white/10" data-testid="select-cta">
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
                  className="bg-white/5 border-white/10"
                  data-testid="input-custom-cta"
                />
              </div>
            )}

            {formData.selectedCtaId && (
              <div className="p-2 rounded bg-white/5 border border-white/10">
                <p className="text-[10px] text-muted-foreground mb-1">Selected CTA:</p>
                <p className="text-xs text-white">"{ctaOptions.find(c => c.id === formData.selectedCtaId)?.text}"</p>
              </div>
            )}

            <div>
              <Label htmlFor="facts" className="text-xs font-medium mb-2 block uppercase tracking-wider">Key Facts / Stats (Optional)</Label>
              <Textarea
                id="facts"
                value={formData.keyFacts}
                onChange={(e) => setFormData((prev) => ({ ...prev, keyFacts: e.target.value }))}
                placeholder="e.g., 10x growth, 50k followers, used by top creators..."
                className="bg-white/5 border-white/10 min-h-[60px]"
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
                className="bg-white/5 border-white/10 min-h-[100px]"
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
                <SelectTrigger className="bg-white/5 border-white/10" data-testid="select-creator-style">
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
                <div className="mt-2 p-2 rounded bg-white/5 border border-white/10">
                  <p className="text-[10px] text-muted-foreground mb-1">Style: {extendedCreatorStyles.find(c => c.id === formData.creatorStyle)?.tone}</p>
                  <p className="text-[10px] text-white/70 italic">
                    "{extendedCreatorStyles.find(c => c.id === formData.creatorStyle)?.exampleHook}"
                  </p>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between p-3 rounded-md bg-primary/10 border border-primary/20">
              <div className="flex items-center gap-3">
                <BookOpen className="w-4 h-4 text-primary" />
                <div>
                  <p className="text-sm font-medium text-white">Use Knowledge Base</p>
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
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
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

      {generatedScript && (
        <ScriptOutput 
          script={generatedScript} 
          onRegenerate={handleGenerate}
          isRegenerating={generateMutation.isPending}
        />
      )}

      <div className="fixed bottom-0 left-0 right-0 p-4 bg-background/95 backdrop-blur border-t border-white/10 md:hidden z-50">
        <Button
          onClick={handleGenerate}
          disabled={generateMutation.isPending || !formData.topic.trim()}
          className="w-full h-12 text-base font-semibold"
          data-testid="button-generate-mobile"
        >
          {generateMutation.isPending ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
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
    </div>
  );
}
