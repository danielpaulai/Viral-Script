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
import { useToast } from "@/hooks/use-toast";
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
  type ScriptParameters,
  type GeneratedScript,
} from "@shared/schema";
import { ScriptOutput } from "@/components/script-output";
import { 
  Sparkles, 
  ArrowRight, 
  Zap, 
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
  Lightbulb,
  BookOpen,
} from "lucide-react";

const presetIcons: Record<string, typeof Zap> = {
  business_growth: TrendingUp,
  ai_tech: Cpu,
  viral_growth: Zap,
  personal_brand: Heart,
};

const platformWordTargets: Record<string, { min: number; max: number; label: string }> = {
  "15": { min: 30, max: 45, label: "15s" },
  "30": { min: 60, max: 90, label: "30s" },
  "60": { min: 120, max: 180, label: "60s" },
  "90": { min: 180, max: 270, label: "90s" },
  "180": { min: 360, max: 540, label: "3min" },
};

export default function Home() {
  const { toast } = useToast();
  const [generatedScript, setGeneratedScript] = useState<GeneratedScript | null>(null);
  const [activePreset, setActivePreset] = useState<string | null>(null);
  const [deepResearch, setDeepResearch] = useState(false);
  const [useKnowledgeBase, setUseKnowledgeBase] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [hoveredPreset, setHoveredPreset] = useState<string | null>(null);

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
  });

  const { data: recentScripts = [] } = useQuery<any[]>({
    queryKey: ["/api/scripts"],
    select: (data) => {
      const scriptsArray = Array.isArray(data) ? data : (data?.items ?? []);
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
  });

  const generateMutation = useMutation({
    mutationFn: async (params: ScriptParameters) => {
      const res = await apiRequest("POST", "/api/scripts/generate", params);
      return res.json();
    },
    onSuccess: (data: GeneratedScript) => {
      setGeneratedScript(data);
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

  const handlePresetClick = (presetId: string) => {
    const preset = quickPresets.find((p) => p.id === presetId);
    if (preset) {
      setActivePreset(presetId);
      setFormData({
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
      });
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
    generateMutation.mutate({ ...formData, deepResearch, useKnowledgeBase });
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
            onChange={(e) => setFormData((prev) => ({ ...prev, topic: e.target.value }))}
            placeholder="e.g., Why most people fail at content creation..."
            className="bg-white/5 border-white/10 min-h-[80px] text-base"
            data-testid="input-topic"
          />
        </div>

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
          <Label className="text-xs font-medium mb-2 block uppercase tracking-wider">Hook Strategy (50 Viral Hooks)</Label>
          <Select
            value={formData.hook}
            onValueChange={(value) => setFormData((prev) => ({ ...prev, hook: value }))}
          >
            <SelectTrigger className="bg-white/5 border-white/10" data-testid="select-hook">
              <SelectValue placeholder="Select a viral hook..." />
            </SelectTrigger>
            <SelectContent className="max-h-80">
              {hookCategories.map((category) => (
                <div key={category.id}>
                  <div className="px-2 py-1.5 text-xs font-semibold text-primary">{category.name}</div>
                  {viralHooks
                    .filter((h) => h.category === category.id)
                    .map((hook) => (
                      <SelectItem key={hook.id} value={hook.id}>
                        {hook.name}
                      </SelectItem>
                    ))}
                </div>
              ))}
            </SelectContent>
          </Select>
          {currentHook && (
            <div className="mt-2 p-2 rounded bg-white/5 border border-white/10">
              <p className="text-[10px] text-muted-foreground mb-1">Template: "{currentHook.template}"</p>
              <p className="text-[10px] text-white/70">"{currentHook.example}"</p>
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

            <div className="flex items-center justify-between p-3 rounded-md bg-white/5 border border-white/10">
              <div className="flex items-center gap-3">
                <Search className="w-4 h-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium text-white">Deep Research Mode</p>
                  <p className="text-[10px] text-muted-foreground">
                    AI researches your topic before generating
                  </p>
                </div>
              </div>
              <Switch
                checked={deepResearch}
                onCheckedChange={setDeepResearch}
                data-testid="switch-deep-research"
              />
            </div>

            <div className="flex items-center justify-between p-3 rounded-md bg-primary/10 border border-primary/20">
              <div className="flex items-center gap-3">
                <BookOpen className="w-4 h-4 text-primary" />
                <div>
                  <p className="text-sm font-medium text-white">Use Knowledge Base</p>
                  <p className="text-[10px] text-muted-foreground">
                    {knowledgeBaseDocs.length > 0 
                      ? `${knowledgeBaseDocs.length} docs loaded - AI uses your brand voice`
                      : "Add docs in Knowledge Base to enable"
                    }
                  </p>
                </div>
              </div>
              <Switch
                checked={useKnowledgeBase}
                onCheckedChange={setUseKnowledgeBase}
                disabled={knowledgeBaseDocs.length === 0}
                data-testid="switch-knowledge-base"
              />
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
