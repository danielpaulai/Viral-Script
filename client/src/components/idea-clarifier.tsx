import { useState, useEffect, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  type VideoIdeaSkeleton,
  type SkeletonSection,
  type SkeletonSectionType,
  createEmptySkeleton,
  validateSkeletonSection,
  calculateClarityScore,
  platformOptions,
  durationOptions,
  hookCategories,
} from "@shared/schema";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
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
} from "lucide-react";

type HookMode = "write" | "generate";

interface GeneratedHook {
  id: string;
  hook: string;
  reasoning: string;
  style: string;
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

export function IdeaClarifier({
  onSkeletonComplete,
  onSkeletonChange,
  initialIdea = "",
  isGenerating = false,
}: IdeaClarifierProps) {
  const [skeleton, setSkeleton] = useState<VideoIdeaSkeleton>(() =>
    createEmptySkeleton(initialIdea)
  );
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [showAllSections, setShowAllSections] = useState(false);
  
  // Hook generation mode
  const [hookMode, setHookMode] = useState<HookMode>("generate");
  const [selectedHookStyle, setSelectedHookStyle] = useState<string>("question");
  const [generatedHooks, setGeneratedHooks] = useState<GeneratedHook[]>([]);
  const [selectedHookId, setSelectedHookId] = useState<string | null>(null);

  // Hook generation mutation
  const generateHooksMutation = useMutation({
    mutationFn: async (params: {
      hookStyle: string;
      problem: string;
      solution: string;
      targetAudience: string;
      platform: string;
      duration: string;
    }) => {
      const response = await apiRequest("POST", "/api/hooks/generate", params);
      return await response.json() as { hooks: GeneratedHook[]; style: string; styleName: string };
    },
    onSuccess: (data) => {
      setGeneratedHooks(data.hooks);
      setSelectedHookId(null);
    },
  });

  const steps: SkeletonSectionType[] = ["hook", "problem", "solution", "cta"];
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
    });
  };

  // Check if we can generate hooks (need problem or solution content)
  const canGenerateHooks = skeleton.problem.content.length > 10 || skeleton.solution.content.length > 10;

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
          <div className="flex items-center gap-1">
            <Button
              size="sm"
              variant={hookMode === "generate" ? "default" : "ghost"}
              onClick={() => setHookMode("generate")}
              className="text-xs h-7"
              data-testid="button-hook-mode-generate"
            >
              <Wand2 className="w-3 h-3 mr-1" />
              AI Generate
            </Button>
            <Button
              size="sm"
              variant={hookMode === "write" ? "default" : "ghost"}
              onClick={() => setHookMode("write")}
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
            <p className="text-sm text-muted-foreground">
              Select a hook style, then fill in your Problem & Solution below. We'll generate options for you.
            </p>

            {/* Hook Style Selector */}
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
                    Generating hooks...
                  </>
                ) : (
                  <>
                    <Wand2 className="w-4 h-4 mr-2" />
                    Generate Hook Options
                  </>
                )}
              </Button>
            </div>

            {!canGenerateHooks && (
              <p className="text-xs text-amber-400 flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" />
                Fill in Problem or Solution first to generate hooks
              </p>
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
                          ? "bg-primary/20 border-primary"
                          : "bg-background/50 border-border hover-elevate"
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

            {/* Selected hook preview */}
            {section.content && (
              <div className="p-3 rounded bg-green-500/10 border border-green-500/30">
                <p className="text-xs text-green-400 mb-1 font-medium">Selected Hook:</p>
                <p className="text-sm">{section.content}</p>
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

  const renderSectionEditor = (type: SkeletonSectionType) => {
    // Special handling for hook section
    if (type === "hook") {
      const isActive = currentSectionType === type || showAllSections;
      if (!isActive && !showAllSections) return null;
      return renderHookSection();
    }

    const section = skeleton[type];
    const Icon = sectionIcons[type];
    const colorClass = sectionColors[type];
    const bgClass = sectionBgColors[type];
    const isActive = currentSectionType === type || showAllSections;

    if (!isActive && !showAllSections) return null;

    return (
      <div
        key={type}
        className={`p-4 rounded-lg border ${bgClass} transition-all`}
        data-testid={`section-${type}`}
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

        <Textarea
          value={section.content}
          onChange={(e) => updateSection(type, e.target.value)}
          placeholder={`Write your ${section.title.toLowerCase()} here...`}
          className="min-h-[100px] bg-background/50 border-border mb-2"
          disabled={skeleton.isLocked}
          data-testid={`input-${type}`}
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
                onClick={() => !skeleton.isLocked && updateSection(type, example)}
                className="text-xs px-2 py-1 rounded bg-muted/50 text-muted-foreground hover-elevate cursor-pointer border border-border"
                disabled={skeleton.isLocked}
                data-testid={`example-${type}-${i}`}
              >
                "{example}"
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  };

  return (
    <Card className="p-4 md:p-6" data-testid="card-idea-clarifier">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Zap className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-bold text-foreground">Clarify Your Video Idea</h2>
        </div>
        <div className="flex items-center gap-2">
          {skeleton.isLocked ? (
            <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
              <Lock className="w-3 h-3 mr-1" />
              Locked
            </Badge>
          ) : (
            <Badge variant="outline" className="text-muted-foreground">
              <MessageSquare className="w-3 h-3 mr-1" />
              Step {currentStep + 1} of {steps.length}
            </Badge>
          )}
        </div>
      </div>

      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-muted-foreground">Clarity Score</span>
          <span className={`text-sm font-mono font-bold ${skeleton.clarityScore >= 70 ? "text-green-400" : skeleton.clarityScore >= 40 ? "text-amber-400" : "text-muted-foreground"}`}>
            {skeleton.clarityScore}%
          </span>
        </div>
        <Progress value={skeleton.clarityScore} className="h-2" />
        <p className="text-xs text-muted-foreground mt-1">
          {skeleton.clarityScore < 70 ? "Complete all sections to unlock script generation" : "Your idea is clear enough to generate a script!"}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-4">
        <div>
          <Label className="text-xs font-medium mb-1 block">Platform</Label>
          <Select
            value={skeleton.platform}
            onValueChange={(value) => setSkeleton({ ...skeleton, platform: value })}
            disabled={skeleton.isLocked}
          >
            <SelectTrigger className="bg-muted/50" data-testid="select-platform">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {platformOptions.map((opt) => (
                <SelectItem key={opt.id} value={opt.id}>{opt.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-xs font-medium mb-1 block">Duration</Label>
          <Select
            value={skeleton.duration}
            onValueChange={(value) => setSkeleton({ ...skeleton, duration: value })}
            disabled={skeleton.isLocked}
          >
            <SelectTrigger className="bg-muted/50" data-testid="select-duration">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {durationOptions.map((opt) => (
                <SelectItem key={opt.id} value={opt.id}>{opt.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="mb-4">
        <Label className="text-xs font-medium mb-1 block flex items-center gap-1">
          <Users className="w-3 h-3" />
          Target Audience (optional but recommended)
        </Label>
        <Input
          value={skeleton.targetAudience}
          onChange={(e) => setSkeleton({ ...skeleton, targetAudience: e.target.value })}
          placeholder="e.g., entrepreneurs who struggle with productivity"
          className="bg-muted/50"
          disabled={skeleton.isLocked}
          data-testid="input-audience"
        />
      </div>

      <div className="flex items-center justify-between mb-4">
        <div className="flex gap-1">
          {steps.map((step, i) => {
            const section = skeleton[step];
            const Icon = sectionIcons[step];
            const isActive = i === currentStep;
            const isComplete = section.isValid;
            return (
              <button
                key={step}
                onClick={() => !skeleton.isLocked && setCurrentStep(i)}
                className={`p-2 rounded-md transition-all ${
                  isActive ? "bg-primary/20 text-primary" : isComplete ? "bg-green-500/20 text-green-400" : "bg-muted/50 text-muted-foreground"
                } hover-elevate`}
                disabled={skeleton.isLocked}
                data-testid={`step-${step}`}
              >
                <Icon className="w-4 h-4" />
              </button>
            );
          })}
        </div>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => setShowAllSections(!showAllSections)}
          className="text-xs"
          data-testid="button-toggle-all"
        >
          {showAllSections ? "Focus Mode" : "Show All"}
        </Button>
      </div>

      <div className="space-y-4">
        {showAllSections
          ? steps.map((step) => renderSectionEditor(step))
          : renderSectionEditor(currentSectionType)}
      </div>

      <div className="flex items-center justify-between mt-6 pt-4 border-t border-border">
        {!skeleton.isLocked ? (
          <>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handlePrev}
                disabled={currentStep === 0}
                data-testid="button-prev"
              >
                <ChevronLeft className="w-4 h-4 mr-1" />
                Back
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleReset}
                data-testid="button-reset"
              >
                <RefreshCw className="w-4 h-4 mr-1" />
                Reset
              </Button>
            </div>
            <div className="flex gap-2">
              {currentStep < steps.length - 1 ? (
                <Button
                  onClick={handleNext}
                  disabled={!canProceedToNext}
                  data-testid="button-next"
                >
                  Next
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              ) : (
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
            </div>
          </>
        ) : (
          <div className="flex gap-2 w-full">
            <Button
              variant="outline"
              onClick={handleUnlock}
              className="flex-1"
              data-testid="button-unlock"
            >
              <Unlock className="w-4 h-4 mr-2" />
              Unlock & Edit
            </Button>
            <Button
              onClick={() => onSkeletonComplete(skeleton)}
              disabled={isGenerating}
              className="flex-1"
              data-testid="button-generate"
            >
              {isGenerating ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
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
    </Card>
  );
}
