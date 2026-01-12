import { useState, useEffect, useMemo, useRef } from "react";
import { Card } from "@/components/ui/card";
import { GlowCard } from "@/components/ui/spotlight-card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  type VideoIdeaSkeleton,
  type SkeletonSection,
  type SkeletonSectionType,
  type VideoPurposeType,
  createEmptySkeleton,
  validateSkeletonSection,
  calculateClarityScore,
  platformOptions,
  durationOptions,
  hookCategories,
  videoPurposes,
  viralHooks,
} from "@shared/schema";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  Sparkles,
  Lightbulb,
  AlertTriangle,
  Target,
  MessageSquare,
  Zap,
  ChevronRight,
  ChevronLeft,
  Lock,
  Unlock,
  Check,
  RefreshCw,
  HelpCircle,
  Users,
  Wand2,
  Loader2,
  PenLine,
  Crown,
  GraduationCap,
  BookOpen,
} from "lucide-react";

const purposeIcons: Record<VideoPurposeType, typeof Crown> = {
  authority: Crown,
  education: GraduationCap,
  storytelling: BookOpen,
};

type HookMode = "write" | "generate" | "browse";

interface GeneratedHook {
  id: string;
  hook: string;
  reasoning: string;
  style: string;
}

interface GeneratedSolution {
  id: string;
  headline: string;
  description: string;
  angle: string;
  selected: boolean;
  edited: boolean;
  customText?: string;
}

interface GeneratedCta {
  cta: string;
  category: string;
  rationale: string;
}

interface CtaTemplate {
  id: string;
  title: string;
  content: string;
  category: string | null;
  usageCount: string | null;
}

interface IdeaClarifierProps {
  onSkeletonComplete: (skeleton: VideoIdeaSkeleton) => void;
  onSkeletonChange?: (skeleton: VideoIdeaSkeleton) => void;
  initialIdea?: string;
  isGenerating?: boolean;
}

const sectionIcons: Record<SkeletonSectionType, typeof Sparkles> = {
  hook: Sparkles,
  problem: AlertTriangle,
  solution: Lightbulb,
  cta: Target,
};

const sectionColors: Record<SkeletonSectionType, string> = {
  hook: "text-amber-500",
  problem: "text-red-400",
  solution: "text-green-400",
  cta: "text-blue-400",
};

const sectionBgColors: Record<SkeletonSectionType, string> = {
  hook: "bg-amber-500/10 border-amber-500/30",
  problem: "bg-red-500/10 border-red-500/30",
  solution: "bg-green-500/10 border-green-500/30",
  cta: "bg-blue-500/10 border-blue-500/30",
};

const stepLabels: Record<SkeletonSectionType, string> = {
  problem: "Problem",
  solution: "Teaching",
  hook: "Hook",
  cta: "CTA",
};

const stepDescriptions: Record<SkeletonSectionType, string> = {
  problem: "What pain point does your audience face?",
  solution: "What's your golden nugget - the core insight?",
  hook: "How will you grab attention in the first 3 seconds?",
  cta: "What action should viewers take?",
};

// Detailed step-by-step guidance for each section
const stepGuidance: Record<SkeletonSectionType, { title: string; steps: string[]; tip: string }> = {
  problem: {
    title: "Define the Problem",
    steps: [
      "Think about what frustrates your audience right now",
      "Write it as a specific pain point (not vague)",
      "Make sure it's relatable - they should think 'that's me!'"
    ],
    tip: "Be specific! 'Struggling to grow on social media' is vague. 'Posting daily but getting zero engagement' is specific."
  },
  solution: {
    title: "Share Your Core Teaching",
    steps: [
      "What's the ONE insight that solves this problem?",
      "This is your 'golden nugget' - the real value of your video",
      "Write the complete teaching, not just a one-liner"
    ],
    tip: "60-70% of your video will be spent on this. Make it actionable and unique to you."
  },
  hook: {
    title: "Craft Your Hook",
    steps: [
      "Choose how you want to grab attention (AI Generate, Browse, or Write)",
      "Pick a hook style that matches your video purpose",
      "Select or write a hook that makes people stop scrolling"
    ],
    tip: "Great hooks sound spoken, not written. Read it out loud - does it sound natural?"
  },
  cta: {
    title: "Add Your Call to Action",
    steps: [
      "Decide what you want viewers to do after watching",
      "Generate AI suggestions or pick from examples",
      "Keep it simple - one clear action only"
    ],
    tip: "Match your CTA to your video purpose. Authority videos → Follow. Educational → Save. Story → Comment."
  }
};

// Wizard stage configuration
type WizardStage = 1 | 2 | 3;

const wizardStages = [
  { id: 1 as WizardStage, title: "Set Your Brief", description: "Choose your video settings" },
  { id: 2 as WizardStage, title: "Build Your Script", description: "Create your content skeleton" },
  { id: 3 as WizardStage, title: "Review & Generate", description: "Confirm and create your script" },
];

export function IdeaClarifier({
  onSkeletonComplete,
  onSkeletonChange,
  initialIdea = "",
  isGenerating = false,
}: IdeaClarifierProps) {
  const { toast } = useToast();
  const [skeleton, setSkeleton] = useState<VideoIdeaSkeleton>(() =>
    createEmptySkeleton(initialIdea)
  );
  const [wizardStage, setWizardStage] = useState<WizardStage>(1);
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [showAllSections, setShowAllSections] = useState(false);
  
  // Hook generation mode
  const [hookMode, setHookMode] = useState<HookMode>("generate");
  const [selectedHookStyle, setSelectedHookStyle] = useState<string>("question");
  const [generatedHooks, setGeneratedHooks] = useState<GeneratedHook[]>([]);
  const [selectedHookId, setSelectedHookId] = useState<string | null>(null);
  const [isEditingHook, setIsEditingHook] = useState(false);
  const [browseCategoryFilter, setBrowseCategoryFilter] = useState<string>("personal_experience");
  
  // Problem ideas
  const [generatedProblems, setGeneratedProblems] = useState<Array<{
    id: string;
    problem: string;
    why: string;
    hookPotential: string;
  }>>([]);
  
  // Solution suggestions
  const [generatedSolutions, setGeneratedSolutions] = useState<GeneratedSolution[]>([]);
  const [editingSolutionId, setEditingSolutionId] = useState<string | null>(null);
  
  // CTA suggestions and templates
  const [generatedCtas, setGeneratedCtas] = useState<GeneratedCta[]>([]);
  const [savingCtaIndex, setSavingCtaIndex] = useState<number | null>(null);

  // Clear generated hooks when problem or solution changes
  const lastProblemRef = useRef(skeleton.problem.content);
  const lastSolutionRef = useRef(skeleton.solution.content);
  
  useEffect(() => {
    if (
      skeleton.problem.content !== lastProblemRef.current ||
      skeleton.solution.content !== lastSolutionRef.current
    ) {
      lastProblemRef.current = skeleton.problem.content;
      lastSolutionRef.current = skeleton.solution.content;
      // Clear stale hooks when inputs change
      if (generatedHooks.length > 0) {
        setGeneratedHooks([]);
        setSelectedHookId(null);
      }
    }
  }, [skeleton.problem.content, skeleton.solution.content, generatedHooks.length]);

  // Handle hook mode change
  const handleHookModeChange = (mode: HookMode) => {
    setHookMode(mode);
    setIsEditingHook(false); // Reset edit state when switching modes
    // Clear generated hooks when switching to write mode
    if (mode === "write") {
      setGeneratedHooks([]);
      setSelectedHookId(null);
    }
  };

  // Handle video purpose change - updates guiding questions based on purpose
  const handleVideoPurposeChange = (purposeId: VideoPurposeType) => {
    const purpose = videoPurposes.find(p => p.id === purposeId);
    if (!purpose) return;
    
    setSkeleton(prev => ({
      ...prev,
      videoPurpose: purposeId,
      problem: {
        ...prev.problem,
        guidingQuestion: purpose.problemGuidance,
      },
      solution: {
        ...prev.solution,
        guidingQuestion: purpose.solutionGuidance,
      },
      hook: {
        ...prev.hook,
        guidingQuestion: purpose.hookGuidance,
      },
    }));
    // Clear generated content when purpose changes
    setGeneratedSolutions([]);
    setGeneratedHooks([]);
    setSelectedHookId(null);
  };

  // Hook generation mutation
  const generateHooksMutation = useMutation({
    mutationFn: async (params: {
      hookStyle: string;
      problem: string;
      solution: string;
      targetAudience: string;
      platform: string;
      duration: string;
      videoPurpose: string;
    }) => {
      console.log("Calling /api/hooks/generate with params:", params);
      const response = await apiRequest("POST", "/api/hooks/generate", params);
      return await response.json() as { hooks: GeneratedHook[]; style: string; styleName: string };
    },
    onSuccess: (data) => {
      console.log("Hooks generated successfully:", data);
      setGeneratedHooks(data.hooks);
      setSelectedHookId(null);
    },
    onError: (error) => {
      console.error("Hook generation failed:", error);
    },
  });

  // Hook adaptation mutation - adapts viral hook templates to specific problem/solution
  const [adaptingHookId, setAdaptingHookId] = useState<string | null>(null);
  const adaptHookMutation = useMutation({
    mutationFn: async (params: {
      hookTemplate: string;
      hookName: string;
      problem: string;
      solution: string;
      targetAudience: string;
      videoPurpose: string;
    }) => {
      const response = await apiRequest("POST", "/api/hooks/adapt", params);
      return await response.json() as { adaptedHook: string; originalTemplate: string; hookName: string };
    },
    onSuccess: (data) => {
      updateSection("hook", data.adaptedHook);
      setIsEditingHook(false);
      setAdaptingHookId(null);
    },
    onError: () => {
      setAdaptingHookId(null);
    },
  });

  // Handle selecting a viral hook from browse mode - adapts it to context
  const handleAdaptViralHook = (hook: { id: string; template: string; name: string; example: string }) => {
    // Only adapt if we have problem/solution context
    if (skeleton.problem.content.length < 10 || skeleton.solution.content.length < 10) {
      // No context to adapt - just use the template directly
      updateSection("hook", hook.example);
      setIsEditingHook(false);
      return;
    }
    
    setAdaptingHookId(hook.id);
    adaptHookMutation.mutate({
      hookTemplate: hook.template,
      hookName: hook.name,
      problem: skeleton.problem.content,
      solution: skeleton.solution.content,
      targetAudience: skeleton.targetAudience,
      videoPurpose: skeleton.videoPurpose,
    });
  };

  // Problem ideas generation mutation
  const generateProblemsMutation = useMutation({
    mutationFn: async (params: {
      targetAudience: string;
      platform: string;
      videoPurpose: string;
      niche: string;
    }) => {
      console.log("Calling /api/problems/generate with params:", params);
      const response = await apiRequest("POST", "/api/problems/generate", params);
      return await response.json() as { problems: Array<{ id: string; problem: string; why: string; hookPotential: string }>; targetAudience: string };
    },
    onSuccess: (data) => {
      console.log("Problems generated successfully:", data);
      setGeneratedProblems(data.problems);
    },
    onError: (error) => {
      console.error("Problem generation failed:", error);
    },
  });

  // Trigger problem generation
  const handleGenerateProblems = () => {
    console.log("handleGenerateProblems clicked! Skeleton state:", {
      targetAudience: skeleton.targetAudience,
      platform: skeleton.platform,
      videoPurpose: skeleton.videoPurpose,
      niche: skeleton.rawIdea || "content creation",
      isLocked: skeleton.isLocked,
      isPending: generateProblemsMutation.isPending,
    });
    generateProblemsMutation.mutate({
      targetAudience: skeleton.targetAudience,
      platform: skeleton.platform,
      videoPurpose: skeleton.videoPurpose,
      niche: skeleton.rawIdea || "content creation",
    });
  };

  // Handle selecting a generated problem
  const handleSelectProblem = (problem: string) => {
    updateSection("problem", problem);
    setGeneratedProblems([]); // Clear after selection
  };

  // Solution generation mutation
  const generateSolutionsMutation = useMutation({
    mutationFn: async (params: {
      problem: string;
      targetAudience: string;
      platform: string;
      videoPurpose: string;
    }) => {
      console.log("Calling /api/solutions/generate with params:", params);
      const response = await apiRequest("POST", "/api/solutions/generate", params);
      const data = await response.json() as { solutions: GeneratedSolution[]; problem: string };
      console.log("Solutions API response:", data);
      return data;
    },
    onSuccess: (data) => {
      console.log("Solutions generated successfully:", data);
      setGeneratedSolutions(data.solutions);
      toast({
        title: "Solutions Generated",
        description: `${data.solutions.length} solution ideas ready for review`,
      });
    },
    onError: (error: Error) => {
      console.error("Solution generation failed:", error);
      toast({
        title: "Generation Failed",
        description: error.message || "Failed to generate solutions. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Trigger solution generation
  const handleGenerateSolutions = () => {
    generateSolutionsMutation.mutate({
      problem: skeleton.problem.content,
      targetAudience: skeleton.targetAudience,
      platform: skeleton.platform,
      videoPurpose: skeleton.videoPurpose,
    });
  };

  // CTA templates query
  const ctaTemplatesQuery = useQuery<CtaTemplate[]>({
    queryKey: ["/api/cta/templates"],
  });

  // CTA generation mutation
  const generateCtasMutation = useMutation({
    mutationFn: async (params: {
      hook: string;
      problem: string;
      solution: string;
      videoPurpose: string;
      targetAudience: string;
    }) => {
      console.log("Calling /api/cta/generate with params:", params);
      const response = await apiRequest("POST", "/api/cta/generate", params);
      return await response.json() as { suggestions: GeneratedCta[] };
    },
    onSuccess: (data) => {
      console.log("CTAs generated successfully:", data);
      setGeneratedCtas(data.suggestions);
    },
    onError: (error) => {
      console.error("CTA generation failed:", error);
    },
  });

  // Save CTA template mutation
  const saveCtaTemplateMutation = useMutation({
    mutationFn: async (params: { title: string; content: string; category?: string }) => {
      const response = await apiRequest("POST", "/api/cta/templates", params);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cta/templates"] });
      setSavingCtaIndex(null);
    },
  });

  // Handle CTA generation
  const handleGenerateCtas = () => {
    generateCtasMutation.mutate({
      hook: skeleton.hook.content,
      problem: skeleton.problem.content,
      solution: skeleton.solution.content,
      videoPurpose: skeleton.videoPurpose,
      targetAudience: skeleton.targetAudience,
    });
  };

  // Handle saving a CTA as template
  const handleSaveCtaTemplate = (cta: GeneratedCta, index: number) => {
    setSavingCtaIndex(index);
    const title = cta.cta.length > 30 ? cta.cta.slice(0, 30) + "..." : cta.cta;
    saveCtaTemplateMutation.mutate({
      title,
      content: cta.cta,
      category: cta.category,
    });
  };

  // Handle selecting a generated CTA
  const handleSelectCta = (ctaText: string) => {
    updateSection("cta", ctaText);
  };

  // Check if we can generate CTAs
  const canGenerateCtas = skeleton.hook.content.length >= 10 && 
    skeleton.problem.content.length >= 15 && 
    skeleton.solution.content.length >= 20;

  // Toggle solution selection
  const handleToggleSolution = (id: string) => {
    setGeneratedSolutions((prev) =>
      prev.map((sol) =>
        sol.id === id ? { ...sol, selected: !sol.selected } : sol
      )
    );
  };

  // Edit solution text
  const handleEditSolution = (id: string, newText: string) => {
    setGeneratedSolutions((prev) =>
      prev.map((sol) =>
        sol.id === id ? { ...sol, customText: newText, edited: true } : sol
      )
    );
  };

  // Add selected solutions to Solution section
  const handleAddSolutionsToSkeleton = () => {
    const selectedSols = generatedSolutions.filter((s) => s.selected);
    if (selectedSols.length === 0) return;
    
    const combinedText = selectedSols
      .map((s) => s.customText || `${s.headline}: ${s.description}`)
      .join("\n\n");
    
    const currentContent = skeleton.solution.content;
    const newContent = currentContent
      ? `${currentContent}\n\n${combinedText}`
      : combinedText;
    
    updateSection("solution", newContent);
  };

  // Check if problem has enough content to generate solutions
  const canGenerateSolutions = skeleton.problem.content.length >= 15;

  // Reordered: Problem & Solution first, then Hook (AI-generated), then CTA
  const steps: SkeletonSectionType[] = ["problem", "solution", "hook", "cta"];
  const currentSectionType = steps[currentStep];

  useEffect(() => {
    if (initialIdea && initialIdea !== skeleton.rawIdea) {
      setSkeleton((prev) => ({ ...prev, rawIdea: initialIdea }));
    }
  }, [initialIdea]);

  useEffect(() => {
    const newScore = calculateClarityScore(skeleton);
    if (newScore !== skeleton.clarityScore) {
      const updated = { ...skeleton, clarityScore: newScore };
      setSkeleton(updated);
      onSkeletonChange?.(updated);
    }
  }, [skeleton.hook, skeleton.problem, skeleton.solution, skeleton.cta, skeleton.targetAudience]);

  const updateSection = (type: SkeletonSectionType, content: string) => {
    const section = skeleton[type];
    const validation = validateSkeletonSection({ ...section, content });
    const updated: VideoIdeaSkeleton = {
      ...skeleton,
      [type]: {
        ...section,
        content,
        isValid: validation.isValid,
        validationMessage: validation.message,
      },
    };
    setSkeleton(updated);
    onSkeletonChange?.(updated);
  };

  // Handle hook selection from generated options
  const handleSelectHook = (hook: GeneratedHook) => {
    setSelectedHookId(hook.id);
    setIsEditingHook(false); // Reset edit state when selecting a new hook
    updateSection("hook", hook.hook);
  };

  // Trigger hook generation
  const handleGenerateHooks = () => {
    generateHooksMutation.mutate({
      hookStyle: selectedHookStyle,
      problem: skeleton.problem.content,
      solution: skeleton.solution.content,
      targetAudience: skeleton.targetAudience,
      platform: skeleton.platform,
      duration: skeleton.duration,
      videoPurpose: skeleton.videoPurpose,
    });
  };

  // Check if we can generate hooks (need BOTH problem AND solution content)
  const canGenerateHooks = skeleton.problem.content.length > 10 && skeleton.solution.content.length > 10;
  const problemSolutionReady = skeleton.problem.isValid && skeleton.solution.isValid;

  const canProceedToNext = useMemo(() => {
    const section = skeleton[currentSectionType];
    return section.isValid;
  }, [skeleton, currentSectionType]);

  const canLockSkeleton = useMemo(() => {
    return (
      skeleton.hook.isValid &&
      skeleton.problem.isValid &&
      skeleton.solution.isValid &&
      skeleton.cta.isValid &&
      skeleton.clarityScore >= 70
    );
  }, [skeleton]);

  // Stage 1 validation - check if brief settings are complete
  const isStage1Complete = useMemo(() => {
    return skeleton.videoPurpose && skeleton.platform && skeleton.duration;
  }, [skeleton.videoPurpose, skeleton.platform, skeleton.duration]);

  // Stage 2 validation - check if content skeleton is complete
  const isStage2Complete = useMemo(() => {
    return (
      skeleton.problem.isValid &&
      skeleton.solution.isValid &&
      skeleton.hook.isValid &&
      skeleton.cta.isValid
    );
  }, [skeleton]);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  // Navigate between wizard stages
  const handleNextStage = () => {
    if (wizardStage === 1 && isStage1Complete) {
      setWizardStage(2);
      setCurrentStep(0);
    } else if (wizardStage === 2 && isStage2Complete) {
      setWizardStage(3);
    }
  };

  const handlePrevStage = () => {
    if (wizardStage === 2) {
      setWizardStage(1);
    } else if (wizardStage === 3) {
      setWizardStage(2);
    }
  };

  const handleLock = () => {
    const locked = { ...skeleton, isLocked: true };
    setSkeleton(locked);
    onSkeletonComplete(locked);
  };

  const handleUnlock = () => {
    setSkeleton({ ...skeleton, isLocked: false });
  };

  const handleReset = () => {
    setSkeleton(createEmptySkeleton(skeleton.rawIdea, skeleton.platform, skeleton.duration));
    setCurrentStep(0);
    setWizardStage(1);
  };

  // Render the problem section with AI problem idea suggestions
  const renderProblemSection = () => {
    const section = skeleton.problem;
    const bgClass = sectionBgColors.problem;
    const colorClass = sectionColors.problem;

    return (
      <div
        className={`p-4 rounded-lg border ${bgClass} transition-all`}
        data-testid="section-problem"
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className={`w-5 h-5 ${colorClass}`} />
            <span className={`font-semibold ${colorClass}`}>{section.title}</span>
            {section.isValid && (
              <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                <Check className="w-3 h-3 mr-1" />
                Ready
              </Badge>
            )}
          </div>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button size="icon" variant="ghost" className="h-6 w-6">
                <HelpCircle className="w-4 h-4 text-muted-foreground" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="left" className="max-w-xs">
              <p className="text-sm">{section.guidingQuestion}</p>
            </TooltipContent>
          </Tooltip>
        </div>

        <p className="text-sm text-muted-foreground mb-3 italic">
          {section.guidingQuestion}
        </p>

        {/* Generate Problem Ideas - shown when problem is empty or short */}
        {!section.isValid && (
          <div className="mb-4 p-3 rounded-lg bg-primary/10 border border-primary/30">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-primary flex items-center gap-2">
                <Wand2 className="w-4 h-4" />
                Need inspiration? Generate problem ideas
              </p>
            </div>
            <Button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                alert("Button clicked! Starting generation...");
                handleGenerateProblems();
              }}
              disabled={generateProblemsMutation.isPending || skeleton.isLocked}
              className="w-full"
              data-testid="button-generate-problems"
              type="button"
            >
              {generateProblemsMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Generating problem ideas...
                </>
              ) : (
                <>
                  <Wand2 className="w-4 h-4 mr-2" />
                  Generate Problem Ideas
                </>
              )}
            </Button>

            {/* Generated Problems */}
            {generatedProblems.length > 0 && (
              <div className="mt-3 space-y-2">
                <Label className="text-xs font-medium">Click to use a problem:</Label>
                {generatedProblems.map((prob) => (
                  <button
                    key={prob.id}
                    onClick={() => handleSelectProblem(prob.problem)}
                    className="w-full text-left p-3 rounded-lg bg-background/80 border border-border hover:border-primary/50 hover:shadow-md hover:scale-[1.01] hover-elevate transition-all duration-200"
                    disabled={skeleton.isLocked}
                    data-testid={`problem-idea-${prob.id}`}
                  >
                    <p className="text-sm font-medium mb-1">{prob.problem}</p>
                    <p className="text-xs text-muted-foreground">{prob.why}</p>
                    <Badge variant="outline" className="mt-2 text-xs">
                      Hook Potential: {prob.hookPotential}
                    </Badge>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        <Textarea
          value={section.content}
          onChange={(e) => updateSection("problem", e.target.value)}
          placeholder="Describe the problem or pain point your audience faces..."
          className="min-h-[100px] bg-background/50 border-border mb-2"
          disabled={skeleton.isLocked}
          data-testid="input-problem"
        />

        {section.validationMessage && !section.isValid && section.content && (
          <p className="text-xs text-amber-400 mb-2 flex items-center gap-1">
            <AlertTriangle className="w-3 h-3" />
            {section.validationMessage}
          </p>
        )}

        <div className="mt-3">
          <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
            <Lightbulb className="w-3 h-3" />
            Examples that work:
          </p>
          <div className="flex flex-wrap gap-2">
            {section.examples.map((example, i) => (
              <button
                key={i}
                onClick={() => !skeleton.isLocked && updateSection("problem", example)}
                className="text-xs px-2 py-1 rounded bg-muted/50 text-muted-foreground hover:text-foreground hover:border-primary/50 hover:scale-105 hover-elevate cursor-pointer border border-border transition-all duration-200"
                disabled={skeleton.isLocked}
                data-testid={`example-problem-${i}`}
              >
                "{example}"
              </button>
            ))}
          </div>
        </div>

      </div>
    );
  };

  // Render the solution section with AI generation
  const renderSolutionSection = () => {
    const section = skeleton.solution;
    const bgClass = sectionBgColors.solution;
    const colorClass = sectionColors.solution;
    const selectedCount = generatedSolutions.filter((s) => s.selected).length;

    return (
      <div
        className={`p-4 rounded-lg border ${bgClass} transition-all`}
        data-testid="section-solution"
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Lightbulb className={`w-5 h-5 ${colorClass}`} />
            <span className={`font-semibold ${colorClass}`}>{section.title}</span>
            {section.isValid && (
              <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                <Check className="w-3 h-3 mr-1" />
                Ready
              </Badge>
            )}
          </div>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button size="icon" variant="ghost" className="h-6 w-6">
                <HelpCircle className="w-4 h-4 text-muted-foreground" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="left" className="max-w-xs">
              <p className="text-sm">{section.guidingQuestion}</p>
            </TooltipContent>
          </Tooltip>
        </div>

        <p className="text-sm text-muted-foreground mb-3 italic">
          {section.guidingQuestion}
        </p>

        <Textarea
          value={section.content}
          onChange={(e) => updateSection("solution", e.target.value)}
          placeholder={`Write your ${section.title.toLowerCase()} here...`}
          className="min-h-[100px] bg-background/50 border-border mb-2"
          disabled={skeleton.isLocked}
          data-testid="input-solution"
        />

        {section.validationMessage && !section.isValid && section.content && (
          <p className="text-xs text-amber-400 mb-2 flex items-center gap-1">
            <AlertTriangle className="w-3 h-3" />
            {section.validationMessage}
          </p>
        )}

        <div className="mt-3">
          <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
            <Lightbulb className="w-3 h-3" />
            Examples that work:
          </p>
          <div className="flex flex-wrap gap-2">
            {section.examples.map((example, i) => (
              <button
                key={i}
                onClick={() => !skeleton.isLocked && updateSection("solution", example)}
                className="text-xs px-2 py-1 rounded bg-muted/50 text-muted-foreground hover:text-foreground hover:border-primary/50 hover:scale-105 hover-elevate cursor-pointer border border-border transition-all duration-200"
                disabled={skeleton.isLocked}
                data-testid={`example-solution-${i}`}
              >
                "{example}"
              </button>
            ))}
          </div>
        </div>

        {/* AI Generate Solution - Show when problem is ready */}
        {canGenerateSolutions && (
          <div className="mt-4 p-4 rounded-lg bg-green-500/10 border-2 border-green-500/40">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-medium text-green-400 flex items-center gap-2">
                <Wand2 className="w-4 h-4" />
                Generate Solution Ideas
              </p>
              {generatedSolutions.length > 0 && selectedCount > 0 && (
                <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                  {selectedCount} selected
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground mb-3">
              Generate AI-powered solution ideas based on your problem. Select ideas to add to your core teaching.
            </p>
            <div className="space-y-3">
              <Button
                size="sm"
                variant="outline"
                onClick={handleGenerateSolutions}
                disabled={generateSolutionsMutation.isPending || skeleton.isLocked}
                className="w-full"
                data-testid="button-generate-solutions"
              >
                {generateSolutionsMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Generating solutions...
                  </>
                ) : generatedSolutions.length > 0 ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Regenerate Solutions
                  </>
                ) : (
                  <>
                    <Wand2 className="w-4 h-4 mr-2" />
                    Generate Solution Ideas
                  </>
                )}
              </Button>

              {/* Solution cards */}
              {generatedSolutions.length > 0 && (
                <div className="space-y-2">
                  {generatedSolutions.map((sol) => (
                    <div
                      key={sol.id}
                      className={`p-3 rounded-lg border transition-all cursor-pointer ${
                        sol.selected
                          ? "bg-green-500/20 border-green-500/50 scale-[1.01] shadow-md"
                          : "bg-background/50 border-border hover:border-green-500/40 hover:shadow-md hover:scale-[1.01] hover-elevate"
                      }`}
                      onClick={() => !skeleton.isLocked && handleToggleSolution(sol.id)}
                      data-testid={`solution-card-${sol.id}`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`w-4 h-4 rounded border flex items-center justify-center ${
                              sol.selected ? "bg-green-500 border-green-500" : "border-muted-foreground"
                            }`}>
                              {sol.selected && <Check className="w-3 h-3 text-white" />}
                            </span>
                            <span className="font-medium text-sm">{sol.headline}</span>
                            <Badge variant="outline" className="text-xs">
                              {sol.angle}
                            </Badge>
                          </div>
                          
                          {editingSolutionId === sol.id ? (
                            <Textarea
                              value={sol.customText || `${sol.headline}: ${sol.description}`}
                              onChange={(e) => {
                                e.stopPropagation();
                                handleEditSolution(sol.id, e.target.value);
                              }}
                              onClick={(e) => e.stopPropagation()}
                              onBlur={() => setEditingSolutionId(null)}
                              className="text-xs mt-2 min-h-[60px] bg-background/80"
                              autoFocus
                              data-testid={`solution-edit-${sol.id}`}
                            />
                          ) : (
                            <p className="text-xs text-muted-foreground ml-6">
                              {sol.customText || sol.description}
                              {sol.edited && (
                                <span className="text-green-400 ml-1">(edited)</span>
                              )}
                            </p>
                          )}
                        </div>
                        
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-6 w-6 shrink-0"
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingSolutionId(editingSolutionId === sol.id ? null : sol.id);
                          }}
                          disabled={skeleton.isLocked}
                          data-testid={`button-edit-solution-${sol.id}`}
                        >
                          <PenLine className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  ))}

                  {/* Add to Solution button */}
                  {selectedCount > 0 && (
                    <Button
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAddSolutionsToSkeleton();
                      }}
                      disabled={skeleton.isLocked}
                      className="w-full"
                      data-testid="button-add-solutions"
                    >
                      <Check className="w-4 h-4 mr-2" />
                      Add {selectedCount} Solution{selectedCount > 1 ? "s" : ""} to Core Teaching
                    </Button>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Show message when problem not ready */}
        {!canGenerateSolutions && (
          <div className="mt-4 p-3 rounded-lg bg-amber-500/10 border border-amber-500/30">
            <p className="text-xs text-amber-400 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              Complete the Problem section first to unlock AI solution generation
            </p>
          </div>
        )}
      </div>
    );
  };

  // Render the hook section with style selector and AI generation
  const renderHookSection = () => {
    const section = skeleton.hook;
    const bgClass = sectionBgColors.hook;
    const colorClass = sectionColors.hook;

    return (
      <div
        className={`p-4 rounded-lg border ${bgClass} transition-all`}
        data-testid="section-hook"
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Sparkles className={`w-5 h-5 ${colorClass}`} />
            <span className={`font-semibold ${colorClass}`}>{section.title}</span>
            {section.isValid && (
              <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                <Check className="w-3 h-3 mr-1" />
                Ready
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-1 flex-wrap">
            <Button
              size="sm"
              variant={hookMode === "generate" ? "default" : "ghost"}
              onClick={() => handleHookModeChange("generate")}
              className="text-xs h-7"
              data-testid="button-hook-mode-generate"
            >
              <Wand2 className="w-3 h-3 mr-1" />
              AI Generate
            </Button>
            <Button
              size="sm"
              variant={hookMode === "browse" ? "default" : "ghost"}
              onClick={() => handleHookModeChange("browse")}
              className="text-xs h-7"
              data-testid="button-hook-mode-browse"
            >
              <Sparkles className="w-3 h-3 mr-1" />
              50 Hooks
            </Button>
            <Button
              size="sm"
              variant={hookMode === "write" ? "default" : "ghost"}
              onClick={() => handleHookModeChange("write")}
              className="text-xs h-7"
              data-testid="button-hook-mode-write"
            >
              <PenLine className="w-3 h-3 mr-1" />
              Write
            </Button>
          </div>
        </div>

        {hookMode === "generate" ? (
          <div className="space-y-4">
            {!problemSolutionReady ? (
              <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/30 text-center">
                <AlertTriangle className="w-6 h-6 text-amber-400 mx-auto mb-2" />
                <p className="text-sm text-amber-400 font-medium mb-1">
                  Complete Problem & Solution First
                </p>
                <p className="text-xs text-muted-foreground">
                  Fill in your Problem and Solution sections above to unlock AI hook generation
                </p>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Your Problem & Solution are ready! Select a hook style and generate options.
              </p>
            )}

            {/* Hook Style Selector - only enabled when problem/solution are ready */}
            {problemSolutionReady && (
              <>
                <div>
                  <Label className="text-xs font-medium mb-2 block">Hook Style</Label>
                  <Select
                    value={selectedHookStyle}
                    onValueChange={setSelectedHookStyle}
                    disabled={skeleton.isLocked}
                  >
                    <SelectTrigger className="bg-background/50" data-testid="select-hook-style">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {hookCategories.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id}>
                          <div className="flex flex-col items-start">
                            <span className="font-medium">{cat.name}</span>
                            <span className="text-xs text-muted-foreground">{cat.description}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Generate Button */}
                <div className="flex items-center gap-2">
                  <Button
                    onClick={handleGenerateHooks}
                    disabled={!canGenerateHooks || generateHooksMutation.isPending || skeleton.isLocked}
                    className="flex-1"
                    data-testid="button-generate-hooks"
                  >
                    {generateHooksMutation.isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Researching & generating hooks...
                      </>
                    ) : (
                      <>
                        <Wand2 className="w-4 h-4 mr-2" />
                        Generate Hook Options
                      </>
                    )}
                  </Button>
                </div>
              </>
            )}

            {/* Generated Hooks */}
            {generatedHooks.length > 0 && (
              <div className="space-y-2">
                <Label className="text-xs font-medium">Choose a hook:</Label>
                <div className="space-y-2">
                  {generatedHooks.map((hook) => (
                    <button
                      key={hook.id}
                      onClick={() => handleSelectHook(hook)}
                      className={`w-full text-left p-3 rounded-lg border transition-all ${
                        selectedHookId === hook.id
                          ? "bg-primary/20 border-primary scale-[1.01] shadow-md"
                          : "bg-background/50 border-border hover:border-primary/50 hover:shadow-md hover:scale-[1.01] hover-elevate"
                      }`}
                      disabled={skeleton.isLocked}
                      data-testid={`hook-option-${hook.id}`}
                    >
                      <p className="text-sm font-medium mb-1">"{hook.hook}"</p>
                      <p className="text-xs text-muted-foreground">{hook.reasoning}</p>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Selected hook preview - now editable */}
            {section.content && (
              <div className="p-3 rounded bg-green-500/10 border border-green-500/30">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs text-green-400 font-medium">Selected Hook:</p>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setIsEditingHook(!isEditingHook)}
                    className="text-xs h-6 text-green-400 hover:text-green-300"
                    data-testid="button-edit-hook"
                  >
                    <PenLine className="w-3 h-3 mr-1" />
                    {isEditingHook ? "Done" : "Edit"}
                  </Button>
                </div>
                {isEditingHook ? (
                  <Textarea
                    value={section.content}
                    onChange={(e) => updateSection("hook", e.target.value)}
                    placeholder="Edit your hook..."
                    className="min-h-[80px] bg-background/50 border-green-500/30"
                    disabled={skeleton.isLocked}
                    data-testid="input-hook-edit"
                  />
                ) : (
                  <p className="text-sm">{section.content}</p>
                )}
              </div>
            )}
          </div>
        ) : hookMode === "browse" ? (
          // Browse mode - 50 viral hooks database
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Browse 50 viral hook templates. Click any template and AI will adapt it to your problem and solution.
            </p>
            {(skeleton.problem.content.length < 10 || skeleton.solution.content.length < 10) && (
              <p className="text-xs text-amber-400 flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" />
                Add Problem and Solution first for AI to adapt hooks to your content
              </p>
            )}
            
            <Tabs value={browseCategoryFilter} onValueChange={setBrowseCategoryFilter} className="w-full">
              <ScrollArea className="w-full">
                <TabsList className="w-full h-auto flex flex-wrap gap-1 bg-muted/50 p-1.5 rounded-lg mb-3">
                  {hookCategories.map((category) => (
                    <TabsTrigger 
                      key={category.id} 
                      value={category.id}
                      className="text-xs px-2 py-1.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
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
                        const isAdapting = adaptingHookId === hook.id;
                        const isSelected = !isAdapting && section.content.length > 0 && section.content !== hook.example;
                        return (
                          <button
                            key={hook.id}
                            onClick={() => handleAdaptViralHook(hook)}
                            className={`w-full text-left p-3 rounded-lg transition-all hover-elevate ${
                              isAdapting
                                ? "bg-primary/30 border-2 border-primary animate-pulse"
                                : "bg-background/50 border border-border"
                            }`}
                            disabled={skeleton.isLocked || isAdapting}
                            data-testid={`button-viral-hook-${hook.id}`}
                          >
                            <div className="flex items-start justify-between gap-2 mb-1.5">
                              <span className={`font-medium text-sm ${isAdapting ? "text-primary" : "text-foreground"}`}>
                                {hook.name}
                              </span>
                              {isAdapting && (
                                <Badge variant="outline" className="text-[10px] border-primary/50 text-primary shrink-0 flex items-center gap-1">
                                  <Loader2 className="w-3 h-3 animate-spin" />
                                  Adapting...
                                </Badge>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground leading-relaxed mb-1.5">
                              <span className="font-medium">Template:</span> "{hook.template}"
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

            {/* Selected hook preview - editable */}
            {section.content && (
              <div className="p-3 rounded bg-green-500/10 border border-green-500/30">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs text-green-400 font-medium">Your Hook:</p>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setIsEditingHook(!isEditingHook)}
                    className="text-xs h-6 text-green-400 hover:text-green-300"
                    data-testid="button-edit-hook-browse"
                  >
                    <PenLine className="w-3 h-3 mr-1" />
                    {isEditingHook ? "Done" : "Edit"}
                  </Button>
                </div>
                {isEditingHook ? (
                  <Textarea
                    value={section.content}
                    onChange={(e) => updateSection("hook", e.target.value)}
                    placeholder="Customize your hook..."
                    className="min-h-[80px] bg-background/50 border-green-500/30"
                    disabled={skeleton.isLocked}
                    data-testid="input-hook-edit-browse"
                  />
                ) : (
                  <p className="text-sm">{section.content}</p>
                )}
              </div>
            )}
          </div>
        ) : (
          // Write mode - original textarea
          <>
            <p className="text-sm text-muted-foreground mb-3 italic">
              {section.guidingQuestion}
            </p>

            <Textarea
              value={section.content}
              onChange={(e) => updateSection("hook", e.target.value)}
              placeholder="Write your hook here..."
              className="min-h-[100px] bg-background/50 border-border mb-2"
              disabled={skeleton.isLocked}
              data-testid="input-hook"
            />

            {section.validationMessage && !section.isValid && section.content && (
              <p className="text-xs text-amber-400 mb-2 flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" />
                {section.validationMessage}
              </p>
            )}

            <div className="mt-3">
              <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
                <Lightbulb className="w-3 h-3" />
                Examples that work:
              </p>
              <div className="flex flex-wrap gap-2">
                {section.examples.map((example, i) => (
                  <button
                    key={i}
                    onClick={() => !skeleton.isLocked && updateSection("hook", example)}
                    className="text-xs px-2 py-1 rounded bg-muted/50 text-muted-foreground hover-elevate cursor-pointer border border-border"
                    disabled={skeleton.isLocked}
                    data-testid={`example-hook-${i}`}
                  >
                    "{example}"
                  </button>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    );
  };

  // CTA section with AI generation and templates
  const renderCtaSection = () => {
    const section = skeleton.cta;
    const Icon = sectionIcons.cta;
    const colorClass = sectionColors.cta;
    const bgClass = sectionBgColors.cta;

    return (
      <div
        className={`p-4 rounded-lg border ${bgClass} transition-all`}
        data-testid="section-cta"
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Icon className={`w-5 h-5 ${colorClass}`} />
            <span className={`font-semibold ${colorClass}`}>{section.title}</span>
            {section.isValid && (
              <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                <Check className="w-3 h-3 mr-1" />
                Ready
              </Badge>
            )}
          </div>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button size="icon" variant="ghost" className="h-6 w-6">
                <HelpCircle className="w-4 h-4 text-muted-foreground" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="left" className="max-w-xs">
              <p className="text-sm">{section.guidingQuestion}</p>
            </TooltipContent>
          </Tooltip>
        </div>

        <p className="text-sm text-muted-foreground mb-3 italic">
          {section.guidingQuestion}
        </p>

        {/* CTA Textarea */}
        <Textarea
          value={section.content}
          onChange={(e) => updateSection("cta", e.target.value)}
          placeholder="Write your call to action here..."
          className="min-h-[80px] bg-background/50 border-border mb-3"
          disabled={skeleton.isLocked}
          data-testid="input-cta"
        />

        {section.validationMessage && !section.isValid && section.content && (
          <p className="text-xs text-amber-400 mb-3 flex items-center gap-1">
            <AlertTriangle className="w-3 h-3" />
            {section.validationMessage}
          </p>
        )}

        {/* AI Generate CTAs Button */}
        <div className="mb-4">
          <Button
            onClick={handleGenerateCtas}
            disabled={!canGenerateCtas || generateCtasMutation.isPending || skeleton.isLocked}
            variant="outline"
            size="sm"
            className="w-full"
            data-testid="button-generate-ctas"
          >
            {generateCtasMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Generating CTAs...
              </>
            ) : (
              <>
                <Wand2 className="w-4 h-4 mr-2" />
                Generate CTAs Based on Your Content
              </>
            )}
          </Button>
          {!canGenerateCtas && (
            <p className="text-xs text-muted-foreground mt-1">
              Complete hook, problem, and solution first
            </p>
          )}
        </div>

        {/* Generated CTAs */}
        {generatedCtas.length > 0 && (
          <div className="space-y-2 mb-4">
            <Label className="text-xs font-medium">AI Suggestions:</Label>
            <div className="space-y-2">
              {generatedCtas.map((cta, index) => (
                <div
                  key={index}
                  className={`p-3 rounded-lg border transition-all ${
                    section.content === cta.cta
                      ? "bg-primary/20 border-primary"
                      : "bg-background/50 border-border"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <button
                      onClick={() => handleSelectCta(cta.cta)}
                      className="flex-1 text-left hover-elevate rounded p-1 -m-1"
                      disabled={skeleton.isLocked}
                      data-testid={`cta-suggestion-${index}`}
                    >
                      <p className="text-sm font-medium mb-1">"{cta.cta}"</p>
                      <p className="text-xs text-muted-foreground">{cta.rationale}</p>
                    </button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleSaveCtaTemplate(cta, index)}
                      disabled={saveCtaTemplateMutation.isPending && savingCtaIndex === index}
                      className="text-xs shrink-0"
                      data-testid={`button-save-cta-${index}`}
                    >
                      {saveCtaTemplateMutation.isPending && savingCtaIndex === index ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <>
                          <Check className="w-3 h-3 mr-1" />
                          Save
                        </>
                      )}
                    </Button>
                  </div>
                  <Badge variant="secondary" className="mt-2 text-xs">
                    {cta.category}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Saved CTA Templates */}
        {ctaTemplatesQuery.data && ctaTemplatesQuery.data.length > 0 && (
          <div className="space-y-2 mb-4">
            <Label className="text-xs font-medium flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              Your Saved CTAs:
            </Label>
            <div className="flex flex-wrap gap-2">
              {ctaTemplatesQuery.data.map((template) => (
                <button
                  key={template.id}
                  onClick={() => handleSelectCta(template.content)}
                  className={`text-xs px-3 py-2 rounded border transition-all ${
                    section.content === template.content
                      ? "bg-primary/20 border-primary text-foreground scale-105 shadow-sm"
                      : "bg-muted/50 text-muted-foreground border-border hover:border-primary/50 hover:text-foreground hover:scale-105 hover-elevate"
                  }`}
                  disabled={skeleton.isLocked}
                  data-testid={`cta-template-${template.id}`}
                >
                  "{template.content.length > 40 ? template.content.slice(0, 40) + "..." : template.content}"
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Examples */}
        <div className="mt-3">
          <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
            <Lightbulb className="w-3 h-3" />
            Examples that work:
          </p>
          <div className="flex flex-wrap gap-2">
            {section.examples.map((example, i) => (
              <button
                key={i}
                onClick={() => !skeleton.isLocked && updateSection("cta", example)}
                className="text-xs px-2 py-1 rounded bg-muted/50 text-muted-foreground hover-elevate cursor-pointer border border-border"
                disabled={skeleton.isLocked}
                data-testid={`example-cta-${i}`}
              >
                "{example}"
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const renderSectionEditor = (type: SkeletonSectionType) => {
    // Special handling for hook section
    if (type === "hook") {
      const isActive = currentSectionType === type || showAllSections;
      if (!isActive && !showAllSections) return null;
      return renderHookSection();
    }

    // Special handling for problem section (with AI problem suggestions)
    if (type === "problem") {
      const isActive = currentSectionType === type || showAllSections;
      if (!isActive && !showAllSections) return null;
      return renderProblemSection();
    }

    // Special handling for solution section (with AI solution generation)
    if (type === "solution") {
      const isActive = currentSectionType === type || showAllSections;
      if (!isActive && !showAllSections) return null;
      return renderSolutionSection();
    }

    // Special handling for CTA section (with AI suggestions and templates)
    if (type === "cta") {
      const isActive = currentSectionType === type || showAllSections;
      if (!isActive && !showAllSections) return null;
      return renderCtaSection();
    }

    // All section types are now handled explicitly above
    return null;
  };

  // Render Stage 1: Set Your Brief
  const renderStage1 = () => (
    <div className="space-y-6">
      {/* How It Works - Step by Step Guide */}
      <div className="p-4 rounded-lg bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20">
        <h3 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
          <Lightbulb className="w-4 h-4 text-primary" />
          How to Create Your Viral Script
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div className="flex items-start gap-2">
            <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary flex-shrink-0">1</div>
            <div>
              <p className="font-medium text-foreground">Set Your Brief</p>
              <p className="text-muted-foreground">Choose video type, platform & duration</p>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary flex-shrink-0">2</div>
            <div>
              <p className="font-medium text-foreground">Build Content</p>
              <p className="text-muted-foreground">Problem, Solution, Hook & CTA</p>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary flex-shrink-0">3</div>
            <div>
              <p className="font-medium text-foreground">Generate Script</p>
              <p className="text-muted-foreground">AI creates your viral-ready script</p>
            </div>
          </div>
        </div>
      </div>

      {/* Video Purpose Selector */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary">1</div>
          <Label className="text-sm font-medium">What type of video is this?</Label>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {videoPurposes.map((purpose) => {
            const Icon = purposeIcons[purpose.id];
            const isSelected = skeleton.videoPurpose === purpose.id;
            return (
              <button
                key={purpose.id}
                onClick={() => handleVideoPurposeChange(purpose.id)}
                className={`p-3 rounded-lg border text-left transition-all duration-200 ${
                  isSelected
                    ? "bg-primary/20 border-primary scale-[1.02] shadow-md"
                    : "bg-muted/30 border-border hover:scale-[1.02] hover:border-primary/50 hover:shadow-sm hover-elevate"
                }`}
                data-testid={`purpose-${purpose.id}`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <Icon className={`w-4 h-4 transition-colors duration-200 ${isSelected ? "text-primary" : "text-muted-foreground group-hover:text-primary"}`} />
                  <span className={`text-sm font-medium transition-colors duration-200 ${isSelected ? "text-primary" : ""}`}>
                    {purpose.name}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground leading-tight">
                  {purpose.description}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Platform & Duration */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary">2</div>
            <Label className="text-sm font-medium">Platform</Label>
          </div>
          <Select
            value={skeleton.platform}
            onValueChange={(value) => setSkeleton({ ...skeleton, platform: value })}
          >
            <SelectTrigger className="bg-muted/50" data-testid="select-platform">
              <SelectValue placeholder="Select platform" />
            </SelectTrigger>
            <SelectContent>
              {platformOptions.map((opt) => (
                <SelectItem key={opt.id} value={opt.id}>{opt.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary">3</div>
            <Label className="text-sm font-medium">Duration</Label>
          </div>
          <Select
            value={skeleton.duration}
            onValueChange={(value) => setSkeleton({ ...skeleton, duration: value })}
          >
            <SelectTrigger className="bg-muted/50" data-testid="select-duration">
              <SelectValue placeholder="Select duration" />
            </SelectTrigger>
            <SelectContent>
              {durationOptions.map((opt) => (
                <SelectItem key={opt.id} value={opt.id}>{opt.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Target Audience */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <div className="w-6 h-6 rounded-full bg-muted/50 flex items-center justify-center text-xs font-medium text-muted-foreground">
            <Users className="w-3 h-3" />
          </div>
          <Label className="text-sm font-medium">Target Audience <span className="text-muted-foreground font-normal">(optional)</span></Label>
        </div>
        <Input
          value={skeleton.targetAudience}
          onChange={(e) => setSkeleton({ ...skeleton, targetAudience: e.target.value })}
          placeholder="e.g., entrepreneurs who struggle with productivity"
          className="bg-muted/50"
          data-testid="input-audience"
        />
      </div>
    </div>
  );

  // Render Stage 2: Build Your Script (Content Skeleton)
  const renderStage2 = () => (
    <div>
      {/* Visual Step Progress for Content Skeleton */}
      {!showAllSections && (
        <div className="mb-6">
          <div className="flex items-center justify-between">
            {steps.map((step, i) => {
              const section = skeleton[step];
              const Icon = sectionIcons[step];
              const isActive = i === currentStep;
              const isComplete = section.isValid;
              const isPast = i < currentStep;
              
              return (
                <div key={step} className="flex items-center flex-1">
                  <button
                    onClick={() => !skeleton.isLocked && setCurrentStep(i)}
                    disabled={skeleton.isLocked}
                    className="flex flex-col items-center group relative"
                    data-testid={`step-${step}`}
                  >
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${
                        isComplete
                          ? "bg-green-500/20 border-2 border-green-500 text-green-400 group-hover:shadow-lg group-hover:shadow-green-500/20"
                          : isActive
                          ? "bg-primary/20 border-2 border-primary text-primary scale-110 shadow-lg shadow-primary/20"
                          : "bg-muted/50 border-2 border-muted-foreground/30 text-muted-foreground group-hover:border-primary/50 group-hover:shadow-md"
                      } ${!skeleton.isLocked ? "group-hover:scale-110" : ""}`}
                    >
                      {isComplete ? (
                        <Check className="w-5 h-5" />
                      ) : (
                        <Icon className="w-5 h-5" />
                      )}
                    </div>
                    <span
                      className={`mt-2 text-xs font-medium transition-colors ${
                        isActive ? "text-primary" : isComplete ? "text-green-400" : "text-muted-foreground"
                      }`}
                    >
                      {stepLabels[step]}
                    </span>
                    {isActive && (
                      <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 whitespace-nowrap">
                        <span className="text-[10px] text-muted-foreground">
                          Step {i + 1} of {steps.length}
                        </span>
                      </div>
                    )}
                  </button>
                  
                  {i < steps.length - 1 && (
                    <div className="flex-1 h-0.5 mx-2 relative">
                      <div className="absolute inset-0 bg-muted-foreground/20 rounded" />
                      <div
                        className={`absolute inset-y-0 left-0 rounded transition-all duration-500 ${
                          isComplete || isPast ? "bg-green-500 w-full" : isActive ? "bg-primary/50 w-1/2" : "w-0"
                        }`}
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Current Step Guidance - Enhanced with numbered steps */}
      {!showAllSections && !skeleton.isLocked && (
        <div className="mb-4 p-4 rounded-lg bg-primary/5 border border-primary/10">
          <div className="flex items-start gap-3 mb-3">
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0 text-primary-foreground font-bold text-sm">
              {currentStep + 1}
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">
                {stepGuidance[currentSectionType].title}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {stepDescriptions[currentSectionType]}
              </p>
            </div>
          </div>
          
          {/* Numbered action steps */}
          <div className="ml-11 space-y-2">
            {stepGuidance[currentSectionType].steps.map((step, i) => (
              <div key={i} className="flex items-start gap-2">
                <div className="w-5 h-5 rounded-full bg-muted/50 flex items-center justify-center flex-shrink-0 text-xs font-medium text-muted-foreground mt-0.5">
                  {i + 1}
                </div>
                <p className="text-sm text-foreground">{step}</p>
              </div>
            ))}
          </div>
          
          {/* Pro tip */}
          <div className="ml-11 mt-3 p-2 rounded bg-amber-100 dark:bg-amber-500/10 border border-amber-300 dark:border-amber-500/20">
            <p className="text-xs text-amber-700 dark:text-amber-400 flex items-start gap-1">
              <Lightbulb className="w-3 h-3 mt-0.5 flex-shrink-0" />
              <span><strong>Tip:</strong> {stepGuidance[currentSectionType].tip}</span>
            </p>
          </div>
        </div>
      )}

      <div className="flex items-center justify-end mb-4">
        <Button
          size="sm"
          variant="outline"
          onClick={() => setShowAllSections(!showAllSections)}
          className="text-xs"
          data-testid="button-toggle-all"
        >
          {showAllSections ? (
            <>
              <Zap className="w-3 h-3 mr-1" />
              Wizard Mode
            </>
          ) : (
            <>
              <Sparkles className="w-3 h-3 mr-1" />
              Show All Sections
            </>
          )}
        </Button>
      </div>

      <div className="space-y-4">
        {showAllSections
          ? steps.map((step) => <div key={step}>{renderSectionEditor(step)}</div>)
          : (
            <div 
              key={currentSectionType}
              className="animate-in fade-in slide-in-from-right-4 duration-300"
            >
              {renderSectionEditor(currentSectionType)}
            </div>
          )}
      </div>

      <div className="flex items-center justify-between mt-6 pt-4 border-t border-border">
        {!skeleton.isLocked ? (
          <>
            <div className="flex items-center gap-2">
              {currentStep > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handlePrev}
                  data-testid="button-prev"
                >
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  Back
                </Button>
              )}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleReset}
                    data-testid="button-reset"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Start over</TooltipContent>
              </Tooltip>
            </div>
            
            <div className="flex items-center gap-3">
              {/* Progress indicator */}
              {!showAllSections && (
                <span className="text-xs text-muted-foreground">
                  {skeleton[currentSectionType].isValid ? (
                    <span className="text-green-400 flex items-center gap-1">
                      <Check className="w-3 h-3" /> Complete
                    </span>
                  ) : (
                    "Fill in this section to continue"
                  )}
                </span>
              )}
              
              {currentStep < steps.length - 1 ? (
                <Button
                  onClick={handleNext}
                  disabled={!canProceedToNext}
                  className="min-w-[100px]"
                  data-testid="button-next"
                >
                  Continue
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              ) : (
                <Button
                  onClick={handleNextStage}
                  disabled={!isStage2Complete}
                  className="bg-green-600 hover:bg-green-700 min-w-[160px]"
                  data-testid="button-review"
                >
                  Review & Generate
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              )}
            </div>
          </>
        ) : null}
      </div>
    </div>
  );

  // Render Stage 3: Review & Generate
  const renderStage3 = () => {
    const purposeLabel = videoPurposes.find(p => p.id === skeleton.videoPurpose)?.name || "Not selected";
    const platformLabel = platformOptions.find(p => p.id === skeleton.platform)?.name || skeleton.platform;
    const durationLabel = durationOptions.find(d => d.id === skeleton.duration)?.name || skeleton.duration;

    return (
      <div className="space-y-6">
        {/* Summary Card */}
        <div className="p-4 rounded-lg bg-muted/30 border border-border">
          <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
            <Check className="w-4 h-4 text-green-400" />
            Your Script Summary
          </h3>
          
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <p className="text-xs text-muted-foreground mb-1">Video Type</p>
              <p className="text-sm font-medium">{purposeLabel}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Platform</p>
              <p className="text-sm font-medium">{platformLabel}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Duration</p>
              <p className="text-sm font-medium">{durationLabel}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Target Audience</p>
              <p className="text-sm font-medium">{skeleton.targetAudience || "General audience"}</p>
            </div>
          </div>

          <div className="space-y-3 pt-4 border-t border-border">
            <div>
              <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                <AlertTriangle className="w-3 h-3 text-red-400" /> Problem
              </p>
              <p className="text-sm">{skeleton.problem.content || "Not set"}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                <Lightbulb className="w-3 h-3 text-green-400" /> Core Teaching
              </p>
              <p className="text-sm">{skeleton.solution.content || "Not set"}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-amber-400" /> Hook
              </p>
              <p className="text-sm">{skeleton.hook.content || "Not set"}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                <Target className="w-3 h-3 text-blue-400" /> Call to Action
              </p>
              <p className="text-sm">{skeleton.cta.content || "Not set"}</p>
            </div>
          </div>
        </div>

        {/* Clarity Score */}
        <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/30">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-green-400">Clarity Score</span>
            <span className="text-lg font-bold text-green-400">{skeleton.clarityScore}%</span>
          </div>
          <Progress value={skeleton.clarityScore} className="h-2" />
          <p className="text-xs text-green-400/80 mt-2">
            Your script is ready to generate!
          </p>
        </div>
      </div>
    );
  };

  return (
    <GlowCard className="p-4 md:p-6" glowColor="pink" data-testid="card-idea-clarifier">
      {/* Wizard Stage Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-bold text-foreground">Create Your Script</h2>
          </div>
          {skeleton.isLocked && (
            <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
              <Lock className="w-3 h-3 mr-1" />
              Ready to Generate
            </Badge>
          )}
        </div>

        {/* Stage Progress Indicator */}
        <div className="flex items-center justify-between">
          {wizardStages.map((stage, index) => {
            const isActive = wizardStage === stage.id;
            const isComplete = 
              (stage.id === 1 && isStage1Complete && wizardStage > 1) ||
              (stage.id === 2 && isStage2Complete && wizardStage > 2);
            const isPast = wizardStage > stage.id;
            
            // Can only navigate to completed stages or current stage (not future ones)
            const canNavigate = 
              stage.id <= wizardStage || // Can go back
              (stage.id === 2 && isStage1Complete) || // Can go to stage 2 if stage 1 is complete
              (stage.id === 3 && isStage1Complete && isStage2Complete); // Can go to stage 3 if both are complete
            
            return (
              <div key={stage.id} className="flex items-center flex-1">
                <button
                  onClick={() => !skeleton.isLocked && canNavigate && setWizardStage(stage.id)}
                  disabled={skeleton.isLocked || !canNavigate}
                  className={`flex flex-col items-center group ${!canNavigate ? "opacity-50 cursor-not-allowed" : ""}`}
                  data-testid={`stage-${stage.id}`}
                >
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 ${
                      isComplete
                        ? "bg-green-500 text-white"
                        : isActive
                        ? "bg-primary text-primary-foreground scale-110"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {isComplete ? <Check className="w-5 h-5" /> : stage.id}
                  </div>
                  <span
                    className={`mt-2 text-xs font-medium text-center ${
                      isActive ? "text-primary" : isComplete ? "text-green-400" : "text-muted-foreground"
                    }`}
                  >
                    {stage.title}
                  </span>
                </button>
                
                {index < wizardStages.length - 1 && (
                  <div className="flex-1 h-1 mx-3 rounded-full bg-muted overflow-hidden">
                    <div
                      className={`h-full transition-all duration-500 ${
                        isPast || isComplete ? "bg-green-500 w-full" : isActive ? "bg-primary/50 w-1/2" : "w-0"
                      }`}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Stage Content */}
      <div className="animate-in fade-in duration-300">
        {wizardStage === 1 && renderStage1()}
        {wizardStage === 2 && renderStage2()}
        {wizardStage === 3 && renderStage3()}
      </div>

      {/* Stage Navigation */}
      <div className="flex items-center justify-between mt-6 pt-4 border-t border-border">
        <div className="flex items-center gap-2">
          {wizardStage > 1 && !skeleton.isLocked && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handlePrevStage}
              data-testid="button-prev-stage"
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              Back
            </Button>
          )}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleReset}
                data-testid="button-reset"
              >
                <RefreshCw className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Start over</TooltipContent>
          </Tooltip>
        </div>
        
        <div className="flex items-center gap-3">
          {wizardStage === 1 && (
            <Button
              onClick={handleNextStage}
              disabled={!isStage1Complete}
              data-testid="button-next-stage"
            >
              Continue to Script
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          )}
          {wizardStage === 3 && !skeleton.isLocked && (
            <Button
              onClick={handleLock}
              disabled={!canLockSkeleton}
              className="bg-green-600 hover:bg-green-700"
              data-testid="button-lock"
            >
              <Lock className="w-4 h-4 mr-2" />
              Lock & Generate Script
            </Button>
          )}
          {skeleton.isLocked && (
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={handleUnlock}
                data-testid="button-unlock"
              >
                <Unlock className="w-4 h-4 mr-2" />
                Edit
              </Button>
              <Button
                onClick={() => onSkeletonComplete(skeleton)}
                disabled={isGenerating}
                data-testid="button-generate"
              >
                {isGenerating ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Creating your script...
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
    </GlowCard>
  );
}
