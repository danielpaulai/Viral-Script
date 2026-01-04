import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectGroup,
  SelectLabel,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { viralHooks, hookCategories, type GeneratedScript } from "@shared/schema";
import { shotPresets, musicResources, getShotRecommendations } from "@/data/shot-presets";
import {
  Copy,
  RefreshCw,
  Save,
  FolderPlus,
  Shuffle,
  Check,
  FileText,
  Video,
  BarChart3,
  ChevronDown,
  ChevronUp,
  Lightbulb,
  Zap,
  Camera,
  Music,
  Type,
  Gauge,
  Lightbulb as LightbulbIcon,
  Film,
  Clapperboard,
  Timer,
  Sparkles,
  ExternalLink,
  Image,
  Wand2,
  BookOpen,
  TrendingUp,
  MessageSquare,
  Target,
} from "lucide-react";

interface ScriptOutputProps {
  script: GeneratedScript;
  onRegenerate: () => void;
  isRegenerating: boolean;
}

export function ScriptOutput({ script, onRegenerate, isRegenerating }: ScriptOutputProps) {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [showHookSelector, setShowHookSelector] = useState(false);
  const [selectedHook, setSelectedHook] = useState<string | null>(null);
  const [customHookLine, setCustomHookLine] = useState<string | null>(null);
  const [expandedShot, setExpandedShot] = useState<string | null>(null);
  const [showResearch, setShowResearch] = useState(false);
  const [enhancedScript, setEnhancedScript] = useState<string | null>(null);
  const [showEnhanceOptions, setShowEnhanceOptions] = useState(false);

  const [enhancedMetrics, setEnhancedMetrics] = useState<{wordCount: number, gradeLevel: number} | null>(null);
  const [boostSuggestions, setBoostSuggestions] = useState<Array<{area: string, issue: string, fix: string}> | null>(null);
  const [boostImprovements, setBoostImprovements] = useState<{gradeLevelBefore: number, gradeLevelAfter: number, hookStrengthBefore: number, hookStrengthAfter: number, weakAreasFixed: number} | null>(null);
  const [showBoostPanel, setShowBoostPanel] = useState(false);

  const boostViralityMutation = useMutation({
    mutationFn: async () => {
      const currentScript = enhancedScript || script.script;
      const res = await apiRequest("POST", "/api/scripts/boost", {
        script: currentScript,
        parameters: script.parameters,
      });
      return res.json();
    },
    onSuccess: (data) => {
      setEnhancedScript(data.boostedScript);
      setEnhancedMetrics({ wordCount: data.wordCount, gradeLevel: data.gradeLevel });
      setBoostSuggestions(data.suggestions);
      setBoostImprovements(data.improvements);
      setShowBoostPanel(true);
      toast({
        title: "Virality Boosted",
        description: `Fixed ${data.improvements.weakAreasFixed} weak areas. Grade level: ${data.gradeLevel}`,
      });
    },
    onError: () => {
      toast({
        title: "Boost Failed",
        description: "Could not boost script virality. Please try again.",
        variant: "destructive",
      });
    },
  });
  
  const enhanceScriptMutation = useMutation({
    mutationFn: async (enhancementType: string) => {
      const currentScript = enhancedScript || script.script;
      const res = await apiRequest("POST", "/api/scripts/enhance", {
        script: currentScript,
        enhancementType,
        parameters: script.parameters,
      });
      return res.json();
    },
    onSuccess: (data) => {
      setEnhancedScript(data.enhancedScript);
      setEnhancedMetrics({ wordCount: data.wordCount, gradeLevel: data.gradeLevel });
      toast({
        title: "Script Enhanced",
        description: `Your script has been improved. Word count: ${data.wordCount}, Grade level: ${data.gradeLevel}`,
      });
      setShowEnhanceOptions(false);
    },
    onError: () => {
      toast({
        title: "Enhancement Failed",
        description: "Could not enhance the script. Please try again.",
        variant: "destructive",
      });
    },
  });

  const saveToVaultMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/vault", {
        scriptId: script.id,
        name: script.parameters.topic.slice(0, 50),
      });
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Saved to Vault",
        description: "Script has been saved to your vault.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/vault"] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to save to vault.",
        variant: "destructive",
      });
    },
  });

  const addToProjectMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/projects/scripts", {
        scriptId: script.id,
      });
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Added to Project",
        description: "Script has been added to your project.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to add to project.",
        variant: "destructive",
      });
    },
  });

  const handleCopy = async () => {
    const scriptToCopy = customHookLine 
      ? script.script.replace(/^[^\n]+/, customHookLine)
      : script.script;
    await navigator.clipboard.writeText(scriptToCopy);
    setCopied(true);
    toast({
      title: "Copied",
      description: "Script copied to clipboard.",
    });
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopySection = async (section: "hook" | "body" | "cta") => {
    const displayScript = getDisplayScript();
    const lines = displayScript.split('\n').filter(Boolean);
    let textToCopy = "";
    
    if (section === "hook") {
      textToCopy = lines[0] || "";
    } else if (section === "body") {
      textToCopy = lines.slice(1, -1).join('\n');
    } else if (section === "cta") {
      textToCopy = lines[lines.length - 1] || "";
    }
    
    await navigator.clipboard.writeText(textToCopy);
    toast({
      title: "Copied",
      description: `${section.charAt(0).toUpperCase() + section.slice(1)} copied to clipboard.`,
    });
  };

  const handleHookChange = (hookId: string) => {
    const hook = viralHooks.find(h => h.id === hookId);
    if (hook) {
      setSelectedHook(hookId);
      setCustomHookLine(hook.example);
      toast({
        title: "Hook Changed",
        description: `Now using "${hook.name}" hook style.`,
      });
    }
  };

  const getDisplayScript = () => {
    const baseScript = enhancedScript || script.script;
    if (customHookLine) {
      const lines = baseScript.split('\n');
      lines[0] = customHookLine;
      return lines.join('\n');
    }
    return baseScript;
  };

  const currentHook = selectedHook 
    ? viralHooks.find(h => h.id === selectedHook)
    : null;

  // Use enhanced metrics if available, otherwise original
  const displayWordCount = enhancedMetrics?.wordCount || script.wordCount;
  const displayGradeLevel = enhancedMetrics?.gradeLevel || script.gradeLevel;
  
  const gradeColor = displayGradeLevel <= 6 
    ? "text-green-500" 
    : displayGradeLevel <= 8 
    ? "text-yellow-500" 
    : "text-red-500";

  const gradeLabel = displayGradeLevel <= 6 
    ? "Easy" 
    : displayGradeLevel <= 8 
    ? "Moderate" 
    : "Complex";

  // Calculate viral score based on multiple factors - uses current displayed script
  const calculateViralScore = () => {
    let score = 0;
    const currentScript = getDisplayScript();
    const scriptLower = currentScript.toLowerCase();
    const firstLine = currentScript.split('\n')[0] || '';
    const currentGrade = displayGradeLevel;
    const currentWordCount = displayWordCount;
    
    // Grade level score (max 25 points - lower is better for virality)
    if (currentGrade <= 5) score += 25;
    else if (currentGrade <= 6) score += 20;
    else if (currentGrade <= 7) score += 15;
    else if (currentGrade <= 8) score += 10;
    else score += 5;
    
    // Hook strength score (max 25 points - check first line for strong opening patterns)
    const hookPatterns = [
      /^stop\b/i, /^wait\b/i, /^here'?s? (why|how|what)/i, /^nobody/i, /^the truth/i,
      /^i (used to|was|made|spent)/i, /^what if/i, /^most people/i, /^this (is|will)/i,
      /\d+\s*(million|billion|k|\$|%|years|days|hours)/i, /^don'?t\b/i
    ];
    const hookMatches = hookPatterns.filter(p => p.test(firstLine)).length;
    score += Math.min(25, hookMatches * 12 + (firstLine.length < 60 ? 5 : 0));
    
    // Structure score (max 25 points - based on script length and word count target)
    const hasGoodLength = currentWordCount >= 30 && currentWordCount <= 300;
    const hasMultipleParagraphs = currentScript.split('\n').filter(l => l.trim()).length >= 3;
    const hasCta = /follow|comment|share|save|link|subscribe|like/i.test(scriptLower);
    if (hasGoodLength) score += 12;
    if (hasMultipleParagraphs) score += 8;
    if (hasCta) score += 5;
    
    // Engagement indicators score (max 25 points) - unique word presence
    const engagementPatterns = [
      /\byou\b/i, /\byour\b/i, /\bbecause\b/i, /\bnow\b/i, /\btoday\b/i, /\bfree\b/i, /\beasy\b/i
    ];
    const uniqueMatches = new Set(engagementPatterns.filter(p => p.test(scriptLower)));
    score += Math.min(25, uniqueMatches.size * 4);
    
    return Math.min(100, Math.max(0, score));
  };
  
  const viralScore = calculateViralScore();
  const viralScoreColor = viralScore >= 75 ? "text-green-500" : viralScore >= 50 ? "text-yellow-500" : "text-red-500";
  const viralScoreLabel = viralScore >= 75 ? "High" : viralScore >= 50 ? "Medium" : "Needs Work";

  const groupedHooks = hookCategories.map(cat => ({
    ...cat,
    hooks: viralHooks.filter(h => h.category === cat.id)
  }));

  return (
    <Card className="p-6 glass-card rounded-md" data-testid="card-script-output">
      <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
        <div>
          <h2 className="text-lg font-semibold mb-1 text-white" data-testid="text-output-title">Generated Script</h2>
          <div className="flex items-center gap-3 text-sm text-muted-foreground flex-wrap">
            <span data-testid="text-word-count">{displayWordCount} words</span>
            <span className="hidden sm:inline">|</span>
            <span className={gradeColor} data-testid="text-grade-level">
              Grade {displayGradeLevel.toFixed(1)} ({gradeLabel})
            </span>
            <span className="hidden sm:inline">|</span>
            <span className={viralScoreColor} data-testid="text-viral-score">
              Viral Score: {viralScore}% ({viralScoreLabel})
            </span>
            {viralScore < 75 && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => boostViralityMutation.mutate()}
                disabled={boostViralityMutation.isPending}
                className="ml-2 bg-gradient-to-r from-orange-500/20 to-red-500/20 border-orange-500/50 text-orange-400 hover:text-orange-300"
                data-testid="button-boost-virality"
              >
                {boostViralityMutation.isPending ? (
                  <div className="w-3 h-3 border-2 border-orange-400/30 border-t-orange-400 rounded-full animate-spin mr-1" />
                ) : (
                  <TrendingUp className="w-3 h-3 mr-1" />
                )}
                Boost Score
              </Button>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-2 flex-wrap">
          {script.research && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowResearch(!showResearch)}
              className="bg-white/5 border-white/10"
              data-testid="button-show-research"
            >
              <BookOpen className="w-4 h-4 mr-1 text-blue-400" />
              {showResearch ? "Hide" : "View"} Research
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowEnhanceOptions(!showEnhanceOptions)}
            className="bg-white/5 border-white/10"
            data-testid="button-enhance-script"
            disabled={enhanceScriptMutation.isPending}
          >
            <Wand2 className="w-4 h-4 mr-1 text-purple-400" />
            {enhanceScriptMutation.isPending ? "Enhancing..." : "Enhance"}
            {showEnhanceOptions ? <ChevronUp className="w-4 h-4 ml-1" /> : <ChevronDown className="w-4 h-4 ml-1" />}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowHookSelector(!showHookSelector)}
            className="bg-white/5 border-white/10"
            data-testid="button-change-hook"
          >
            <Zap className="w-4 h-4 mr-1 text-primary" />
            Change Hook
            {showHookSelector ? <ChevronUp className="w-4 h-4 ml-1" /> : <ChevronDown className="w-4 h-4 ml-1" />}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowAnalysis(!showAnalysis)}
            className="bg-white/5 border-white/10"
            data-testid="button-show-analysis"
          >
            <BarChart3 className="w-4 h-4 mr-1" />
            {showAnalysis ? "Hide" : "Show"} Analysis
          </Button>
        </div>
      </div>

      {/* Enhanced Script Indicator */}
      {enhancedScript && (
        <div className="mb-4 p-3 rounded-md bg-purple-500/10 border border-purple-500/20 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-purple-400" />
          <span className="text-sm text-purple-300">Script enhanced with AI</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => { 
              setEnhancedScript(null); 
              setEnhancedMetrics(null); 
              setBoostSuggestions(null);
              setBoostImprovements(null);
              setShowBoostPanel(false);
            }}
            className="ml-auto text-xs text-muted-foreground"
            data-testid="button-revert-enhancement"
          >
            Revert to original
          </Button>
        </div>
      )}

      {/* Boost Virality Panel */}
      {showBoostPanel && boostSuggestions && boostSuggestions.length > 0 && (
        <div className="mb-4 p-4 rounded-md bg-gradient-to-br from-orange-500/10 to-red-500/10 border border-orange-500/30">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-orange-400" />
              <span className="text-sm font-medium text-orange-400">Virality Improvements Applied</span>
              {boostImprovements && (
                <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                  {boostImprovements.weakAreasFixed} fixes
                </Badge>
              )}
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowBoostPanel(false)}
              className="text-xs text-muted-foreground"
            >
              Hide
            </Button>
          </div>
          
          {boostImprovements && (
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div className="p-2 rounded bg-white/5 border border-white/10">
                <p className="text-[10px] text-muted-foreground uppercase mb-1">Grade Level</p>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-red-400">{boostImprovements.gradeLevelBefore}</span>
                  <span className="text-xs text-muted-foreground">→</span>
                  <span className="text-sm text-green-400 font-bold">{boostImprovements.gradeLevelAfter}</span>
                </div>
              </div>
              <div className="p-2 rounded bg-white/5 border border-white/10">
                <p className="text-[10px] text-muted-foreground uppercase mb-1">Hook Strength</p>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-red-400">{boostImprovements.hookStrengthBefore}/10</span>
                  <span className="text-xs text-muted-foreground">→</span>
                  <span className="text-sm text-green-400 font-bold">{boostImprovements.hookStrengthAfter}/10</span>
                </div>
              </div>
            </div>
          )}
          
          <div className="space-y-2">
            {boostSuggestions.map((suggestion, i) => (
              <div key={i} className="flex items-start gap-2 text-xs">
                <Check className="w-3 h-3 text-green-400 mt-0.5 flex-shrink-0" />
                <div>
                  <span className="font-medium text-white">{suggestion.area}:</span>{" "}
                  <span className="text-muted-foreground">{suggestion.fix}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Research Panel */}
      {showResearch && script.research && (
        <div className="mb-6 p-4 rounded-md bg-blue-500/10 border border-blue-500/20">
          <div className="flex items-center gap-2 mb-3">
            <BookOpen className="w-4 h-4 text-blue-400" />
            <h3 className="text-sm font-medium text-white">Research Findings</h3>
          </div>
          <div className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">
            {script.research}
          </div>
        </div>
      )}

      {/* Enhance Options Panel */}
      {showEnhanceOptions && (
        <div className="mb-6 p-4 rounded-md bg-purple-500/10 border border-purple-500/20">
          <div className="flex items-center gap-2 mb-3">
            <Wand2 className="w-4 h-4 text-purple-400" />
            <h3 className="text-sm font-medium text-white">Enhance Your Script</h3>
          </div>
          <p className="text-xs text-muted-foreground mb-4">
            Choose how you want AI to improve your script
          </p>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
            <button
              onClick={() => enhanceScriptMutation.mutate('punchier')}
              disabled={enhanceScriptMutation.isPending}
              className="p-3 rounded-md bg-white/5 border border-white/10 text-left hover-elevate active-elevate-2"
              data-testid="button-enhance-punchier"
            >
              <Zap className="w-4 h-4 text-yellow-400 mb-1" />
              <p className="text-xs font-medium text-white">Punchier</p>
              <p className="text-[10px] text-muted-foreground">More energy</p>
            </button>
            <button
              onClick={() => enhanceScriptMutation.mutate('clearer')}
              disabled={enhanceScriptMutation.isPending}
              className="p-3 rounded-md bg-white/5 border border-white/10 text-left hover-elevate active-elevate-2"
              data-testid="button-enhance-clearer"
            >
              <Target className="w-4 h-4 text-green-400 mb-1" />
              <p className="text-xs font-medium text-white">Clearer</p>
              <p className="text-[10px] text-muted-foreground">Simpler words</p>
            </button>
            <button
              onClick={() => enhanceScriptMutation.mutate('storytelling')}
              disabled={enhanceScriptMutation.isPending}
              className="p-3 rounded-md bg-white/5 border border-white/10 text-left hover-elevate active-elevate-2"
              data-testid="button-enhance-storytelling"
            >
              <MessageSquare className="w-4 h-4 text-blue-400 mb-1" />
              <p className="text-xs font-medium text-white">Story Mode</p>
              <p className="text-[10px] text-muted-foreground">More narrative</p>
            </button>
            <button
              onClick={() => enhanceScriptMutation.mutate('engagement')}
              disabled={enhanceScriptMutation.isPending}
              className="p-3 rounded-md bg-white/5 border border-white/10 text-left hover-elevate active-elevate-2"
              data-testid="button-enhance-engagement"
            >
              <TrendingUp className="w-4 h-4 text-red-400 mb-1" />
              <p className="text-xs font-medium text-white">Engagement</p>
              <p className="text-[10px] text-muted-foreground">More hooks</p>
            </button>
            <button
              onClick={() => enhanceScriptMutation.mutate('general')}
              disabled={enhanceScriptMutation.isPending}
              className="p-3 rounded-md bg-white/5 border border-white/10 text-left hover-elevate active-elevate-2"
              data-testid="button-enhance-general"
            >
              <Sparkles className="w-4 h-4 text-purple-400 mb-1" />
              <p className="text-xs font-medium text-white">Auto Improve</p>
              <p className="text-[10px] text-muted-foreground">Best of all</p>
            </button>
          </div>
        </div>
      )}

      {showHookSelector && (
        <div className="mb-6 p-4 rounded-md bg-white/5 border border-white/10">
          <div className="flex items-center gap-2 mb-3">
            <Lightbulb className="w-4 h-4 text-primary" />
            <h3 className="text-sm font-medium text-white">Select a Viral Hook Style</h3>
          </div>
          <p className="text-xs text-muted-foreground mb-4">
            Choose from 50 proven viral hooks to change how your script opens
          </p>
          
          <Select value={selectedHook || ""} onValueChange={handleHookChange}>
            <SelectTrigger className="bg-white/5 border-white/10 mb-4" data-testid="select-hook-style">
              <SelectValue placeholder="Browse 50 viral hooks..." />
            </SelectTrigger>
            <SelectContent className="max-h-80">
              {groupedHooks.map((group) => (
                <SelectGroup key={group.id}>
                  <SelectLabel className="text-primary font-semibold">{group.name}</SelectLabel>
                  {group.hooks.map((hook) => (
                    <SelectItem key={hook.id} value={hook.id} className="py-2">
                      <div className="flex flex-col">
                        <span className="font-medium">{hook.name}</span>
                        <span className="text-xs text-muted-foreground truncate max-w-xs">{hook.template}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectGroup>
              ))}
            </SelectContent>
          </Select>

          {currentHook && (
            <div className="space-y-3 p-3 rounded-md bg-primary/10 border border-primary/20">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-primary border-primary/30">
                  {hookCategories.find(c => c.id === currentHook.category)?.name}
                </Badge>
                <span className="text-sm font-medium text-white">{currentHook.name}</span>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">TEMPLATE</p>
                <p className="text-sm text-white/80 italic">"{currentHook.template}"</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">EXAMPLE</p>
                <p className="text-sm text-white font-medium">"{currentHook.example}"</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">WHY IT WORKS</p>
                <p className="text-xs text-muted-foreground">{currentHook.why}</p>
              </div>
            </div>
          )}

          {!currentHook && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {hookCategories.slice(0, 4).map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => {
                    const firstHook = viralHooks.find(h => h.category === cat.id);
                    if (firstHook) handleHookChange(firstHook.id);
                  }}
                  className="p-3 rounded-md bg-white/5 border border-white/10 text-left hover-elevate active-elevate-2"
                  data-testid={`button-hook-category-${cat.id}`}
                >
                  <p className="text-xs font-medium text-white">{cat.name}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    {viralHooks.filter(h => h.category === cat.id).length} hooks
                  </p>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {showAnalysis && (
        <div className="mb-6 p-4 rounded-md bg-white/5 border border-white/10">
          <h3 className="text-sm font-medium mb-3 text-white">Readability Analysis</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-xs text-muted-foreground mb-1">Grade Level</p>
              <p className={`text-2xl font-bold ${gradeColor}`} data-testid="stat-grade">
                {script.gradeLevel.toFixed(1)}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Word Count</p>
              <p className="text-2xl font-bold text-white" data-testid="stat-words">{script.wordCount}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Est. Duration</p>
              <p className="text-2xl font-bold text-white" data-testid="stat-duration">
                {Math.round(script.wordCount / 2.5)}s
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Status</p>
              <Badge variant={script.gradeLevel <= 6 ? "default" : "secondary"} data-testid="badge-status">
                {gradeLabel}
              </Badge>
            </div>
          </div>
        </div>
      )}

      <Tabs defaultValue="script" className="mb-6">
        <TabsList className="bg-white/5 border border-white/10">
          <TabsTrigger value="script" className="gap-2" data-testid="tab-script">
            <FileText className="w-4 h-4" />
            Script
          </TabsTrigger>
          <TabsTrigger value="production" className="gap-2" data-testid="tab-production">
            <Video className="w-4 h-4" />
            Production Notes
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="script" className="mt-4">
          {/* Hook Metadata Header */}
          {(currentHook || script.parameters.hook) && (
            <div className="mb-4 p-4 rounded-md bg-primary/10 border border-primary/20 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-primary" />
                  <span className="text-sm font-semibold text-white">
                    HOOK #{viralHooks.findIndex(h => h.id === (selectedHook || script.parameters.hook)) + 1}: {(currentHook || viralHooks.find(h => h.id === script.parameters.hook))?.name}
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleCopySection("hook")}
                  className="text-xs h-7"
                  data-testid="button-copy-hook"
                >
                  <Copy className="w-3 h-3 mr-1" />
                  Copy Hook
                </Button>
              </div>
              <div className="text-xs text-muted-foreground">
                <span className="font-medium text-white/80">Template:</span> "{(currentHook || viralHooks.find(h => h.id === script.parameters.hook))?.template}"
              </div>
              <div className="text-xs text-muted-foreground">
                <span className="font-medium text-white/80">Applied:</span> "{customHookLine || script.script.split('\n')[0]}"
              </div>
            </div>
          )}

          {/* Script Sections with Individual Copy */}
          <div className="space-y-4">
            {(() => {
              const displayScript = getDisplayScript();
              const lines = displayScript.split('\n').filter(Boolean);
              const hookLine = lines[0] || "";
              const bodyLines = lines.slice(1, -1).join('\n');
              const ctaLine = lines[lines.length - 1] || "";
              
              return (
                <>
                  {/* Hook Section */}
                  <div className="p-4 rounded-md bg-white/5 border border-white/10">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-semibold text-primary uppercase tracking-wider">Hook</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleCopySection("hook")}
                        className="text-xs h-6 px-2"
                        data-testid="button-copy-hook-section"
                      >
                        <Copy className="w-3 h-3" />
                      </Button>
                    </div>
                    <p className="font-mono text-sm text-white/90 leading-relaxed">{hookLine}</p>
                  </div>

                  {/* Body Section */}
                  <div className="p-4 rounded-md bg-white/5 border border-white/10">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Body</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleCopySection("body")}
                        className="text-xs h-6 px-2"
                        data-testid="button-copy-body"
                      >
                        <Copy className="w-3 h-3" />
                      </Button>
                    </div>
                    <p className="font-mono text-sm text-white/90 whitespace-pre-wrap leading-relaxed">{bodyLines}</p>
                  </div>

                  {/* CTA Section */}
                  <div className="p-4 rounded-md bg-white/5 border border-white/10">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-semibold text-green-500 uppercase tracking-wider">Call to Action</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleCopySection("cta")}
                        className="text-xs h-6 px-2"
                        data-testid="button-copy-cta"
                      >
                        <Copy className="w-3 h-3" />
                      </Button>
                    </div>
                    <p className="font-mono text-sm text-white/90 leading-relaxed">{ctaLine}</p>
                  </div>
                </>
              );
            })()}
          </div>
        </TabsContent>
        
        <TabsContent value="production" className="mt-4">
          <div className="space-y-4">
            {/* Scene Breakdown */}
            {script.scenes && script.scenes.length > 0 && (
              <div className="p-4 rounded-md bg-white/5 border border-white/10">
                <div className="flex items-center gap-2 mb-4">
                  <Clapperboard className="w-4 h-4 text-primary" />
                  <h4 className="text-sm font-semibold text-white uppercase tracking-wider">Scene Breakdown</h4>
                </div>
                <div className="space-y-3">
                  {script.scenes.map((scene, index) => (
                    <div key={index} className="p-3 rounded-md bg-white/5 border-l-2 border-primary" data-testid={`scene-${index}`}>
                      <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
                        <div className="flex items-center gap-2">
                          <Badge className="bg-primary/20 text-primary border-0">{scene.section}</Badge>
                          <span className="text-xs text-muted-foreground font-mono">{scene.duration}</span>
                        </div>
                        <Badge variant="outline" className="text-xs border-white/20">{scene.energy}</Badge>
                      </div>
                      <p className="text-sm text-white/80 mb-2 line-clamp-2 leading-relaxed">{scene.lines}</p>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Camera className="w-3 h-3" />
                        <span>{scene.camera}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Quick Reference Cards */}
            <div className="grid md:grid-cols-2 gap-4">
              {/* Music & Audio */}
              <div className="p-4 rounded-md bg-white/5 border border-white/10">
                <div className="flex items-center gap-2 mb-3">
                  <Music className="w-4 h-4 text-primary" />
                  <h4 className="text-sm font-semibold text-white">Music & Audio</h4>
                </div>
                <p className="text-sm text-muted-foreground" data-testid="text-music-mood">
                  {script.musicMood || "Modern lo-fi or chill beat - 80-100 BPM. Not distracting."}
                </p>
              </div>

              {/* Pacing */}
              <div className="p-4 rounded-md bg-white/5 border border-white/10">
                <div className="flex items-center gap-2 mb-3">
                  <Gauge className="w-4 h-4 text-primary" />
                  <h4 className="text-sm font-semibold text-white">Pacing</h4>
                </div>
                <p className="text-sm text-muted-foreground" data-testid="text-pacing">
                  {script.pacing || "Medium pace - let key points breathe for 1s"}
                </p>
              </div>

              {/* Caption Style */}
              <div className="p-4 rounded-md bg-white/5 border border-white/10">
                <div className="flex items-center gap-2 mb-3">
                  <Type className="w-4 h-4 text-primary" />
                  <h4 className="text-sm font-semibold text-white">Caption Style</h4>
                </div>
                <p className="text-sm text-muted-foreground" data-testid="text-caption-style">
                  {script.captionStyle || "Bold, centered captions with 3-4 words max per line."}
                </p>
              </div>

              {/* Lighting */}
              <div className="p-4 rounded-md bg-white/5 border border-white/10">
                <div className="flex items-center gap-2 mb-3">
                  <LightbulbIcon className="w-4 h-4 text-primary" />
                  <h4 className="text-sm font-semibold text-white">Lighting</h4>
                </div>
                <p className="text-sm text-muted-foreground" data-testid="text-lighting">
                  {script.lighting || "Ring light or soft box at 45-degree angle. Avoid harsh shadows."}
                </p>
              </div>
            </div>

            {/* Camera Angles */}
            {script.cameraAngles && script.cameraAngles.length > 0 && (
              <div className="p-4 rounded-md bg-white/5 border border-white/10">
                <div className="flex items-center gap-2 mb-3">
                  <Camera className="w-4 h-4 text-primary" />
                  <h4 className="text-sm font-semibold text-white">Camera Angles</h4>
                </div>
                <div className="grid md:grid-cols-2 gap-2">
                  {script.cameraAngles.map((angle, index) => (
                    <div key={index} className="flex items-center gap-2 p-2 rounded bg-white/5" data-testid={`camera-angle-${index}`}>
                      <span className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-xs text-primary font-medium">
                        {index + 1}
                      </span>
                      <span className="text-sm text-muted-foreground">{angle}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Transitions */}
            {script.transitions && script.transitions.length > 0 && (
              <div className="p-4 rounded-md bg-white/5 border border-white/10">
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles className="w-4 h-4 text-primary" />
                  <h4 className="text-sm font-semibold text-white">Transitions & Effects</h4>
                </div>
                <div className="flex flex-wrap gap-2">
                  {script.transitions.map((transition, index) => (
                    <Badge 
                      key={index} 
                      variant="outline" 
                      className="border-primary/30 bg-primary/10 text-white/80"
                      data-testid={`transition-${index}`}
                    >
                      {transition}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* B-Roll Ideas */}
            {script.bRollIdeas && script.bRollIdeas.length > 0 && (
              <div className="p-4 rounded-md bg-white/5 border border-white/10">
                <div className="flex items-center gap-2 mb-3">
                  <Film className="w-4 h-4 text-primary" />
                  <h4 className="text-sm font-semibold text-white">B-Roll Ideas</h4>
                </div>
                <div className="grid gap-2">
                  {script.bRollIdeas.map((idea, index) => (
                    <div key={index} className="flex items-start gap-3 p-2 rounded bg-white/5" data-testid={`text-broll-${index}`}>
                      <div className="w-5 h-5 rounded bg-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Video className="w-3 h-3 text-primary" />
                      </div>
                      <span className="text-sm text-muted-foreground">{idea}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* On-Screen Text Overlay Options */}
            {script.onScreenText && Array.isArray(script.onScreenText) && script.onScreenText.length > 0 && (
              <div className="p-4 rounded-md bg-white/5 border border-white/10">
                <div className="flex items-center gap-2 mb-3">
                  <Type className="w-4 h-4 text-primary" />
                  <h4 className="text-sm font-semibold text-white">On-Screen Text Overlay Options</h4>
                </div>
                <p className="text-xs text-muted-foreground mb-4">
                  Choose from these attention-grabbing text overlays for each section of your video
                </p>
                <div className="space-y-4">
                  {script.onScreenText[0] && typeof script.onScreenText[0] === 'object' && 'section' in script.onScreenText[0] ? (
                    (script.onScreenText as unknown as { section: string; options: string[] }[]).map((sectionData, sectionIndex) => {
                      if (!sectionData || typeof sectionData !== 'object') return null;
                      const options = Array.isArray(sectionData.options) 
                        ? sectionData.options.filter((x: any) => typeof x === 'string')
                        : [];
                      
                      return (
                        <div key={sectionIndex} className="space-y-2">
                          <div className="flex items-center gap-2">
                            <Badge 
                              variant="outline" 
                              className={`text-xs ${
                                sectionData.section === 'Hook' ? 'border-primary text-primary' :
                                sectionData.section === 'CTA' ? 'border-green-500 text-green-500' :
                                'border-white/30 text-white/70'
                              }`}
                            >
                              {sectionData.section || 'Section'}
                            </Badge>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                            {options.map((text: string, optIndex: number) => (
                              <button
                                key={optIndex}
                                onClick={async () => {
                                  await navigator.clipboard.writeText(text);
                                  toast({
                                    title: "Copied",
                                    description: `"${text}" copied to clipboard`,
                                  });
                                }}
                                className="p-3 rounded-md bg-black border border-white/20 text-center hover-elevate active-elevate-2 cursor-pointer group"
                                data-testid={`overlay-${(sectionData.section || 'section').toLowerCase()}-${optIndex}`}
                              >
                                <span className="text-white font-bold text-sm tracking-wide">{text}</span>
                                <div className="text-xs text-muted-foreground mt-1 invisible group-hover:visible">Click to copy</div>
                              </button>
                            ))}
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                      {(script.onScreenText as string[]).filter((x: any) => typeof x === 'string').map((text, index) => (
                        <div 
                          key={index} 
                          className="p-3 rounded-md bg-black border border-white/20 text-center"
                          data-testid={`badge-onscreen-${index}`}
                        >
                          <span className="text-white font-bold text-sm tracking-wide">{text}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Shot Gallery */}
            <div className="p-4 rounded-md bg-white/5 border border-white/10">
              <div className="flex items-center gap-2 mb-3">
                <Image className="w-4 h-4 text-primary" />
                <h4 className="text-sm font-semibold text-white">Shot Gallery</h4>
              </div>
              <p className="text-xs text-muted-foreground mb-4">
                Click on any shot to see camera angle and setup instructions
              </p>
              
              {/* Hook Shots */}
              <div className="mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="outline" className="border-primary text-primary text-xs">Hook Shots</Badge>
                </div>
                <div className="space-y-3">
                  <div className="flex gap-3 overflow-x-auto pb-2">
                    {getShotRecommendations("hook").map((shot) => (
                      <div 
                        key={shot.id} 
                        className="flex-shrink-0 w-40 cursor-pointer"
                        onClick={() => setExpandedShot(expandedShot === `hook-${shot.id}` ? null : `hook-${shot.id}`)}
                        data-testid={`shot-hook-${shot.id}`}
                      >
                        <div className={`relative rounded-md overflow-hidden mb-2 ring-2 transition-all ${expandedShot === `hook-${shot.id}` ? 'ring-primary' : 'ring-transparent hover:ring-white/30'}`}>
                          <img 
                            src={shot.image} 
                            alt={shot.name}
                            className="w-40 h-28 object-cover"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent flex flex-col items-start justify-end p-2">
                            <span className="text-xs font-medium text-white">{shot.name}</span>
                            <span className="text-[10px] text-primary">{shot.angle}</span>
                          </div>
                          <div className="absolute top-2 right-2">
                            <ChevronDown className={`w-4 h-4 text-white transition-transform ${expandedShot === `hook-${shot.id}` ? 'rotate-180' : ''}`} />
                          </div>
                        </div>
                        <p className="text-[10px] text-muted-foreground line-clamp-2">{shot.whenToUse}</p>
                      </div>
                    ))}
                  </div>
                  {/* Expanded Shot Details for Hook */}
                  {expandedShot?.startsWith('hook-') && (
                    <div className="p-4 rounded-md bg-black border border-primary/30 animate-in slide-in-from-top-2 duration-200">
                      {(() => {
                        const shotId = expandedShot.replace('hook-', '');
                        const shot = getShotRecommendations("hook").find(s => s.id === shotId);
                        if (!shot) return null;
                        return (
                          <div className="space-y-4">
                            <div className="flex items-center justify-between">
                              <h5 className="font-semibold text-white">{shot.name} Setup Guide</h5>
                              <Badge className="bg-primary/20 text-primary border-0">{shot.angle}</Badge>
                            </div>
                            <div className="grid md:grid-cols-2 gap-4">
                              <div>
                                <p className="text-xs text-muted-foreground mb-1">Camera Height</p>
                                <p className="text-sm text-white">{shot.setup.cameraHeight}</p>
                              </div>
                              <div>
                                <p className="text-xs text-muted-foreground mb-1">Distance from Subject</p>
                                <p className="text-sm text-white">{shot.setup.distance}</p>
                              </div>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground mb-2">Equipment Needed</p>
                              <div className="flex flex-wrap gap-2">
                                {shot.setup.equipment.map((item, i) => (
                                  <Badge key={i} variant="outline" className="border-white/20 text-white/80 text-xs">{item}</Badge>
                                ))}
                              </div>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground mb-2">Pro Tips</p>
                              <ul className="space-y-1">
                                {shot.setup.tips.map((tip, i) => (
                                  <li key={i} className="text-sm text-white/80 flex items-start gap-2">
                                    <Lightbulb className="w-3 h-3 text-primary mt-1 flex-shrink-0" />
                                    {tip}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  )}
                </div>
              </div>

              {/* Body Shots */}
              <div className="mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="outline" className="border-white/30 text-white/70 text-xs">Body Shots</Badge>
                </div>
                <div className="space-y-3">
                  <div className="flex gap-3 overflow-x-auto pb-2">
                    {getShotRecommendations("body").map((shot) => (
                      <div 
                        key={shot.id} 
                        className="flex-shrink-0 w-40 cursor-pointer"
                        onClick={() => setExpandedShot(expandedShot === `body-${shot.id}` ? null : `body-${shot.id}`)}
                        data-testid={`shot-body-${shot.id}`}
                      >
                        <div className={`relative rounded-md overflow-hidden mb-2 ring-2 transition-all ${expandedShot === `body-${shot.id}` ? 'ring-white/50' : 'ring-transparent hover:ring-white/30'}`}>
                          <img 
                            src={shot.image} 
                            alt={shot.name}
                            className="w-40 h-28 object-cover"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent flex flex-col items-start justify-end p-2">
                            <span className="text-xs font-medium text-white">{shot.name}</span>
                            <span className="text-[10px] text-white/60">{shot.angle}</span>
                          </div>
                          <div className="absolute top-2 right-2">
                            <ChevronDown className={`w-4 h-4 text-white transition-transform ${expandedShot === `body-${shot.id}` ? 'rotate-180' : ''}`} />
                          </div>
                        </div>
                        <p className="text-[10px] text-muted-foreground line-clamp-2">{shot.whenToUse}</p>
                      </div>
                    ))}
                  </div>
                  {/* Expanded Shot Details for Body */}
                  {expandedShot?.startsWith('body-') && (
                    <div className="p-4 rounded-md bg-black border border-white/20 animate-in slide-in-from-top-2 duration-200">
                      {(() => {
                        const shotId = expandedShot.replace('body-', '');
                        const shot = getShotRecommendations("body").find(s => s.id === shotId);
                        if (!shot) return null;
                        return (
                          <div className="space-y-4">
                            <div className="flex items-center justify-between">
                              <h5 className="font-semibold text-white">{shot.name} Setup Guide</h5>
                              <Badge className="bg-white/10 text-white/80 border-0">{shot.angle}</Badge>
                            </div>
                            <div className="grid md:grid-cols-2 gap-4">
                              <div>
                                <p className="text-xs text-muted-foreground mb-1">Camera Height</p>
                                <p className="text-sm text-white">{shot.setup.cameraHeight}</p>
                              </div>
                              <div>
                                <p className="text-xs text-muted-foreground mb-1">Distance from Subject</p>
                                <p className="text-sm text-white">{shot.setup.distance}</p>
                              </div>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground mb-2">Equipment Needed</p>
                              <div className="flex flex-wrap gap-2">
                                {shot.setup.equipment.map((item, i) => (
                                  <Badge key={i} variant="outline" className="border-white/20 text-white/80 text-xs">{item}</Badge>
                                ))}
                              </div>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground mb-2">Pro Tips</p>
                              <ul className="space-y-1">
                                {shot.setup.tips.map((tip, i) => (
                                  <li key={i} className="text-sm text-white/80 flex items-start gap-2">
                                    <Lightbulb className="w-3 h-3 text-primary mt-1 flex-shrink-0" />
                                    {tip}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  )}
                </div>
              </div>

              {/* CTA Shots */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="outline" className="border-green-500 text-green-500 text-xs">CTA Shots</Badge>
                </div>
                <div className="space-y-3">
                  <div className="flex gap-3 overflow-x-auto pb-2">
                    {getShotRecommendations("cta").map((shot) => (
                      <div 
                        key={shot.id} 
                        className="flex-shrink-0 w-40 cursor-pointer"
                        onClick={() => setExpandedShot(expandedShot === `cta-${shot.id}` ? null : `cta-${shot.id}`)}
                        data-testid={`shot-cta-${shot.id}`}
                      >
                        <div className={`relative rounded-md overflow-hidden mb-2 ring-2 transition-all ${expandedShot === `cta-${shot.id}` ? 'ring-green-500' : 'ring-transparent hover:ring-white/30'}`}>
                          <img 
                            src={shot.image} 
                            alt={shot.name}
                            className="w-40 h-28 object-cover"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent flex flex-col items-start justify-end p-2">
                            <span className="text-xs font-medium text-white">{shot.name}</span>
                            <span className="text-[10px] text-green-400">{shot.angle}</span>
                          </div>
                          <div className="absolute top-2 right-2">
                            <ChevronDown className={`w-4 h-4 text-white transition-transform ${expandedShot === `cta-${shot.id}` ? 'rotate-180' : ''}`} />
                          </div>
                        </div>
                        <p className="text-[10px] text-muted-foreground line-clamp-2">{shot.whenToUse}</p>
                      </div>
                    ))}
                  </div>
                  {/* Expanded Shot Details for CTA */}
                  {expandedShot?.startsWith('cta-') && (
                    <div className="p-4 rounded-md bg-black border border-green-500/30 animate-in slide-in-from-top-2 duration-200">
                      {(() => {
                        const shotId = expandedShot.replace('cta-', '');
                        const shot = getShotRecommendations("cta").find(s => s.id === shotId);
                        if (!shot) return null;
                        return (
                          <div className="space-y-4">
                            <div className="flex items-center justify-between">
                              <h5 className="font-semibold text-white">{shot.name} Setup Guide</h5>
                              <Badge className="bg-green-500/20 text-green-400 border-0">{shot.angle}</Badge>
                            </div>
                            <div className="grid md:grid-cols-2 gap-4">
                              <div>
                                <p className="text-xs text-muted-foreground mb-1">Camera Height</p>
                                <p className="text-sm text-white">{shot.setup.cameraHeight}</p>
                              </div>
                              <div>
                                <p className="text-xs text-muted-foreground mb-1">Distance from Subject</p>
                                <p className="text-sm text-white">{shot.setup.distance}</p>
                              </div>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground mb-2">Equipment Needed</p>
                              <div className="flex flex-wrap gap-2">
                                {shot.setup.equipment.map((item, i) => (
                                  <Badge key={i} variant="outline" className="border-white/20 text-white/80 text-xs">{item}</Badge>
                                ))}
                              </div>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground mb-2">Pro Tips</p>
                              <ul className="space-y-1">
                                {shot.setup.tips.map((tip, i) => (
                                  <li key={i} className="text-sm text-white/80 flex items-start gap-2">
                                    <Lightbulb className="w-3 h-3 text-green-400 mt-1 flex-shrink-0" />
                                    {tip}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Music Resources */}
            <div className="p-4 rounded-md bg-white/5 border border-white/10">
              <div className="flex items-center gap-2 mb-3">
                <Music className="w-4 h-4 text-primary" />
                <h4 className="text-sm font-semibold text-white">Music Resources</h4>
              </div>
              <p className="text-xs text-muted-foreground mb-4">
                Find royalty-free music for your video
              </p>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {musicResources.map((resource, index) => (
                  <a
                    key={index}
                    href={resource.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 p-2 rounded-md bg-white/5 border border-white/10 hover-elevate active-elevate-2"
                    data-testid={`music-resource-${index}`}
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate">{resource.name}</p>
                      <p className="text-xs text-muted-foreground">{resource.type}</p>
                    </div>
                    <ExternalLink className="w-3 h-3 text-muted-foreground flex-shrink-0" />
                  </a>
                ))}
              </div>
            </div>

            {/* Filming Notes / Pro Tips */}
            <div className="p-4 rounded-md bg-primary/10 border border-primary/20">
              <div className="flex items-center gap-2 mb-3">
                <Lightbulb className="w-4 h-4 text-primary" />
                <h4 className="text-sm font-semibold text-primary">Pro Tips</h4>
              </div>
              {typeof script.productionNotes === 'object' && script.productionNotes !== null ? (
                <div className="space-y-3">
                  <p className="text-sm text-white/80" data-testid="text-production-notes">
                    {(script.productionNotes as any).filming || "Film close-up, direct to camera. High energy on the hook."}
                  </p>
                  {Array.isArray((script.productionNotes as any).tips) && (script.productionNotes as any).tips.length > 0 && (
                    <ul className="space-y-1">
                      {(script.productionNotes as any).tips
                        .filter((tip: any) => typeof tip === 'string')
                        .map((tip: string, index: number) => (
                          <li key={index} className="text-xs text-white/70 flex items-start gap-2">
                            <span className="text-primary mt-0.5">-</span>
                            {tip}
                          </li>
                        ))}
                    </ul>
                  )}
                </div>
              ) : (
                <p className="text-sm text-white/80" data-testid="text-production-notes">
                  {typeof script.productionNotes === 'string' ? script.productionNotes : "Film close-up, direct to camera. High energy on the hook."}
                </p>
              )}
            </div>
          </div>
        </TabsContent>
      </Tabs>

      <div className="flex flex-wrap items-center gap-2">
        <Button onClick={handleCopy} variant="outline" size="sm" className="bg-white/5 border-white/10" data-testid="button-copy">
          {copied ? <Check className="w-4 h-4 mr-1" /> : <Copy className="w-4 h-4 mr-1" />}
          {copied ? "Copied" : "Copy Script"}
        </Button>
        
        <Button
          onClick={onRegenerate}
          variant="outline"
          size="sm"
          disabled={isRegenerating}
          className="bg-white/5 border-white/10"
          data-testid="button-regenerate"
        >
          <RefreshCw className={`w-4 h-4 mr-1 ${isRegenerating ? "animate-spin" : ""}`} />
          Regenerate
        </Button>
        
        <Button
          onClick={() => saveToVaultMutation.mutate()}
          variant="outline"
          size="sm"
          disabled={saveToVaultMutation.isPending}
          className="bg-white/5 border-white/10"
          data-testid="button-save-vault"
        >
          <Save className="w-4 h-4 mr-1" />
          Save to Vault
        </Button>
        
        <Button
          onClick={() => addToProjectMutation.mutate()}
          variant="outline"
          size="sm"
          disabled={addToProjectMutation.isPending}
          className="bg-white/5 border-white/10"
          data-testid="button-add-project"
        >
          <FolderPlus className="w-4 h-4 mr-1" />
          Add to Project
        </Button>
        
        <Button 
          variant="outline" 
          size="sm" 
          className="bg-white/5 border-white/10"
          onClick={() => {
            const randomHook = viralHooks[Math.floor(Math.random() * viralHooks.length)];
            handleHookChange(randomHook.id);
            setShowHookSelector(true);
          }}
          data-testid="button-remix"
        >
          <Shuffle className="w-4 h-4 mr-1" />
          Random Hook
        </Button>
      </div>
    </Card>
  );
}
