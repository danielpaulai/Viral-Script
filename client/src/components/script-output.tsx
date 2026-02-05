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
import { VersionHistory } from "@/components/version-history";
import { CollaborativeEditor } from "@/components/collaborative-editor";
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
  ExternalLink,
  Image,
  Wand2,
  BookOpen,
  TrendingUp,
  MessageSquare,
  Target,
  History,
  Users,
  Mail,
  Send,
  Sparkles,
  Loader2,
  Bot,
  User,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

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
  const [showVersionHistory, setShowVersionHistory] = useState(false);
  const [showCollabEditor, setShowCollabEditor] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  
  // AI Chat Refinement
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [showAiChat, setShowAiChat] = useState(true);

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

  const saveScriptMutation = useMutation({
    mutationFn: async () => {
      const currentScript = enhancedScript || script.script;
      const res = await apiRequest("PATCH", `/api/scripts/${script.id}`, {
        script: currentScript,
      });
      return res.json();
    },
    onSuccess: () => {
      setHasUnsavedChanges(false);
      toast({
        title: "Saved",
        description: "Your edits have been saved. Script Memory will learn from your changes.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/scripts"] });
    },
    onError: () => {
      toast({
        title: "Save Failed",
        description: "Could not save your edits. Please try again.",
        variant: "destructive",
      });
    },
  });

  // AI Chat Refinement mutation
  const refineScriptMutation = useMutation({
    mutationFn: async (userRequest: string) => {
      const currentScript = enhancedScript || script.script;
      const res = await apiRequest("POST", "/api/scripts/refine", {
        script: currentScript,
        userRequest,
        parameters: script.parameters,
        chatHistory: chatMessages.slice(-6), // Send last 6 messages for context
      });
      return res.json();
    },
    onSuccess: (data, userRequest) => {
      // Add assistant response to chat
      setChatMessages(prev => [
        ...prev,
        {
          role: "assistant",
          content: data.explanation || "I've updated the script based on your request.",
          timestamp: new Date(),
        }
      ]);
      // Update the script
      setEnhancedScript(data.refinedScript);
      setEnhancedMetrics({ wordCount: data.wordCount, gradeLevel: data.gradeLevel });
      setHasUnsavedChanges(true);
    },
    onError: () => {
      // Remove the pending user message on error
      setChatMessages(prev => prev.slice(0, -1));
      toast({
        title: "Refinement Failed",
        description: "Could not refine the script. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSendChat = () => {
    if (!chatInput.trim() || refineScriptMutation.isPending) return;
    
    const userMessage = chatInput.trim();
    setChatInput("");
    
    // Add user message to chat
    setChatMessages(prev => [
      ...prev,
      {
        role: "user",
        content: userMessage,
        timestamp: new Date(),
      }
    ]);
    
    // Trigger refinement
    refineScriptMutation.mutate(userMessage);
  };

  const emailScriptMutation = useMutation({
    mutationFn: async () => {
      if (!script.id) throw new Error("Script must be saved first");
      const res = await apiRequest("POST", `/api/scripts/${script.id}/email`, {});
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Email Sent",
        description: "Script has been sent to your email.",
      });
    },
    onError: () => {
      toast({
        title: "Email Failed",
        description: "Could not send email. Please try again.",
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

  // Mutation to adapt a hook template to the user's content
  const adaptHookMutation = useMutation({
    mutationFn: async ({ hookId, hookTemplate, hookName }: { hookId: string; hookTemplate: string; hookName: string }) => {
      const params = script.parameters as unknown as Record<string, unknown>;
      const res = await apiRequest("POST", "/api/hooks/adapt", {
        hookTemplate,
        hookName,
        problem: script.parameters.topic || "",
        solution: script.parameters.targetAudience || "",
        targetAudience: script.parameters.targetAudience || "",
        videoPurpose: params.videoPurpose || "education",
      });
      return { ...(await res.json()), hookId };
    },
    onSuccess: (data) => {
      setSelectedHook(data.hookId);
      setCustomHookLine(data.adaptedHook);
      toast({
        title: "Hook Adapted",
        description: `"${data.hookName}" customized to your content.`,
      });
    },
    onError: () => {
      toast({
        title: "Adaptation Failed",
        description: "Couldn't personalize the hook. Using template example instead.",
        variant: "destructive",
      });
    },
  });

  const handleHookChange = (hookId: string) => {
    const hook = viralHooks.find(h => h.id === hookId);
    if (hook) {
      // Show loading state
      setSelectedHook(hookId);
      toast({
        title: "Adapting Hook",
        description: `Customizing "${hook.name}" for your content...`,
      });
      
      // Call the API to adapt the hook to the user's content
      adaptHookMutation.mutate({
        hookId: hook.id,
        hookTemplate: hook.template,
        hookName: hook.name,
      });
    }
  };

  const getDisplayScript = () => {
    let baseScript = enhancedScript || script.script;
    
    // Strip out markdown section labels like **HOOK**, **BODY**, **CTA**
    baseScript = baseScript
      .replace(/^\*\*HOOK\*\*\s*/gim, '')
      .replace(/^\*\*BODY\*\*\s*/gim, '')
      .replace(/^\*\*CTA\*\*\s*/gim, '')
      .replace(/^\*\*CORE TEACHING\*\*\s*/gim, '')
      .replace(/^\*\*CALL TO ACTION\*\*\s*/gim, '')
      .replace(/^\*Hook\*\s*/gim, '')
      .replace(/^\*Body\*\s*/gim, '')
      .replace(/^\*CTA\*\s*/gim, '')
      .replace(/^HOOK:\s*/gim, '')
      .replace(/^BODY:\s*/gim, '')
      .replace(/^CTA:\s*/gim, '')
      .replace(/\n{3,}/g, '\n\n') // Clean up extra newlines
      .trim();
    
    if (customHookLine) {
      const lines = baseScript.split('\n');
      // Find first non-empty line and replace it
      const firstNonEmptyIndex = lines.findIndex(l => l.trim());
      if (firstNonEmptyIndex !== -1) {
        lines[firstNonEmptyIndex] = customHookLine;
      }
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


  const groupedHooks = hookCategories.map(cat => ({
    ...cat,
    hooks: viralHooks.filter(h => h.category === cat.id)
  }));

  return (
    <Card className="p-6 glass-card rounded-md" data-testid="card-script-output">
      <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
        <div>
          <h2 className="text-lg font-semibold mb-1 text-foreground" data-testid="text-output-title">Generated Script</h2>
          <div className="flex items-center gap-3 text-sm text-muted-foreground flex-wrap">
            <span data-testid="text-word-count">{displayWordCount} words</span>
            <span className="hidden sm:inline">|</span>
            <span className={gradeColor} data-testid="text-grade-level">
              Grade {displayGradeLevel.toFixed(1)} ({gradeLabel})
            </span>
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
              Boost Virality
            </Button>
          </div>
        </div>
        
        <div className="flex items-center gap-2 flex-wrap">
          {script.research && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowResearch(!showResearch)}
              className="bg-muted/50 border-border"
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
            className="bg-muted/50 border-border"
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
            className="bg-muted/50 border-border"
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
            className="bg-muted/50 border-border"
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
          <Wand2 className="w-4 h-4 text-purple-400" />
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
              <div className="p-2 rounded bg-muted/50 border border-border">
                <p className="text-[10px] text-muted-foreground uppercase mb-1">Grade Level</p>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-red-400">{boostImprovements.gradeLevelBefore}</span>
                  <span className="text-xs text-muted-foreground">→</span>
                  <span className="text-sm text-green-400 font-bold">{boostImprovements.gradeLevelAfter}</span>
                </div>
              </div>
              <div className="p-2 rounded bg-muted/50 border border-border">
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
                  <span className="font-medium text-foreground">{suggestion.area}:</span>{" "}
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
            <h3 className="text-sm font-medium text-foreground">Research Findings</h3>
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
            <h3 className="text-sm font-medium text-foreground">Enhance Your Script</h3>
          </div>
          <p className="text-xs text-muted-foreground mb-4">
            Choose how you want AI to improve your script
          </p>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
            <button
              onClick={() => enhanceScriptMutation.mutate('punchier')}
              disabled={enhanceScriptMutation.isPending}
              className="p-3 rounded-md bg-muted/50 border border-border text-left hover-elevate active-elevate-2"
              data-testid="button-enhance-punchier"
            >
              <Zap className="w-4 h-4 text-yellow-400 mb-1" />
              <p className="text-xs font-medium text-foreground">Punchier</p>
              <p className="text-[10px] text-muted-foreground">More energy</p>
            </button>
            <button
              onClick={() => enhanceScriptMutation.mutate('clearer')}
              disabled={enhanceScriptMutation.isPending}
              className="p-3 rounded-md bg-muted/50 border border-border text-left hover-elevate active-elevate-2"
              data-testid="button-enhance-clearer"
            >
              <Target className="w-4 h-4 text-green-400 mb-1" />
              <p className="text-xs font-medium text-foreground">Clearer</p>
              <p className="text-[10px] text-muted-foreground">Simpler words</p>
            </button>
            <button
              onClick={() => enhanceScriptMutation.mutate('storytelling')}
              disabled={enhanceScriptMutation.isPending}
              className="p-3 rounded-md bg-muted/50 border border-border text-left hover-elevate active-elevate-2"
              data-testid="button-enhance-storytelling"
            >
              <MessageSquare className="w-4 h-4 text-blue-400 mb-1" />
              <p className="text-xs font-medium text-foreground">Story Mode</p>
              <p className="text-[10px] text-muted-foreground">More narrative</p>
            </button>
            <button
              onClick={() => enhanceScriptMutation.mutate('engagement')}
              disabled={enhanceScriptMutation.isPending}
              className="p-3 rounded-md bg-muted/50 border border-border text-left hover-elevate active-elevate-2"
              data-testid="button-enhance-engagement"
            >
              <TrendingUp className="w-4 h-4 text-red-400 mb-1" />
              <p className="text-xs font-medium text-foreground">Engagement</p>
              <p className="text-[10px] text-muted-foreground">More hooks</p>
            </button>
            <button
              onClick={() => enhanceScriptMutation.mutate('general')}
              disabled={enhanceScriptMutation.isPending}
              className="p-3 rounded-md bg-muted/50 border border-border text-left hover-elevate active-elevate-2"
              data-testid="button-enhance-general"
            >
              <Wand2 className="w-4 h-4 text-purple-400 mb-1" />
              <p className="text-xs font-medium text-foreground">Auto Improve</p>
              <p className="text-[10px] text-muted-foreground">Best of all</p>
            </button>
          </div>
        </div>
      )}

      {showHookSelector && (
        <div className="mb-6 p-4 rounded-md bg-muted/50 border border-border">
          <div className="flex items-center gap-2 mb-3">
            <Lightbulb className="w-4 h-4 text-primary" />
            <h3 className="text-sm font-medium text-foreground">Select a Viral Hook Style</h3>
          </div>
          <p className="text-xs text-muted-foreground mb-4">
            Choose from 50 proven viral hooks to change how your script opens
          </p>
          
          <Select value={selectedHook || ""} onValueChange={handleHookChange}>
            <SelectTrigger className="bg-muted/50 border-border mb-4" data-testid="select-hook-style">
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
                <span className="text-sm font-medium text-foreground">{currentHook.name}</span>
                {adaptHookMutation.isPending && (
                  <Badge variant="secondary" className="animate-pulse">Adapting...</Badge>
                )}
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">TEMPLATE</p>
                <p className="text-sm text-muted-foreground italic">"{currentHook.template}"</p>
              </div>
              {customHookLine && !adaptHookMutation.isPending && (
                <div>
                  <p className="text-xs text-green-400 mb-1">YOUR PERSONALIZED HOOK</p>
                  <p className="text-sm text-foreground font-medium bg-green-500/10 p-2 rounded border border-green-500/20">
                    "{customHookLine}"
                  </p>
                </div>
              )}
              {adaptHookMutation.isPending && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">GENERATING...</p>
                  <div className="h-8 bg-muted/50 rounded animate-pulse" />
                </div>
              )}
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
                  className="p-3 rounded-md bg-muted/50 border border-border text-left hover-elevate active-elevate-2"
                  data-testid={`button-hook-category-${cat.id}`}
                >
                  <p className="text-xs font-medium text-foreground">{cat.name}</p>
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
        <div className="mb-6 p-4 rounded-md bg-muted/50 border border-border">
          <h3 className="text-sm font-medium mb-3 text-foreground">Readability Analysis</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-xs text-muted-foreground mb-1">Grade Level</p>
              <p className={`text-2xl font-bold ${gradeColor}`} data-testid="stat-grade">
                {script.gradeLevel.toFixed(1)}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Word Count</p>
              <p className="text-2xl font-bold text-foreground" data-testid="stat-words">{script.wordCount}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Est. Duration</p>
              <p className="text-2xl font-bold text-foreground" data-testid="stat-duration">
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
        <TabsList className="bg-muted/50 border border-border">
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
          {(() => {
            const hookId = selectedHook || script.parameters.hook;
            const foundHook = currentHook || viralHooks.find(h => h.id === hookId);
            const isCustomHook = !foundHook || hookId === "custom";
            const hookIndex = viralHooks.findIndex(h => h.id === hookId);
            const sanitizedFirstLine = getDisplayScript().split('\n').filter(l => l.trim())[0] || "";
            const actualHookLine = customHookLine || sanitizedFirstLine;
            
            return (
              <div className="mb-4 p-4 rounded-md bg-primary/10 border border-primary/20 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-primary" />
                    <span className="text-sm font-semibold text-foreground">
                      {isCustomHook ? "YOUR HOOK" : `HOOK #${hookIndex + 1}: ${foundHook?.name}`}
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
                {!isCustomHook && foundHook?.template && (
                  <div className="text-xs text-muted-foreground">
                    <span className="font-medium text-muted-foreground">Template:</span> "{foundHook.template}"
                  </div>
                )}
                <div className="text-xs text-muted-foreground">
                  <span className="font-medium text-muted-foreground">Your hook:</span> "{actualHookLine}"
                </div>
              </div>
            );
          })()}

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
                  <div className="p-4 rounded-md bg-muted/50 border border-border">
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
                    <p className="font-mono text-sm text-foreground leading-relaxed">{hookLine}</p>
                  </div>

                  {/* Body Section */}
                  <div className="p-4 rounded-md bg-muted/50 border border-border">
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
                    <p className="font-mono text-sm text-foreground whitespace-pre-wrap leading-relaxed">{bodyLines}</p>
                  </div>

                  {/* CTA Section */}
                  <div className="p-4 rounded-md bg-muted/50 border border-border">
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
                    <p className="font-mono text-sm text-foreground leading-relaxed">{ctaLine}</p>
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
              <div className="p-4 rounded-md bg-muted/50 border border-border">
                <div className="flex items-center gap-2 mb-4">
                  <Clapperboard className="w-4 h-4 text-primary" />
                  <h4 className="text-sm font-semibold text-foreground uppercase tracking-wider">Scene Breakdown</h4>
                </div>
                <div className="space-y-3">
                  {script.scenes.map((scene, index) => (
                    <div key={index} className="p-3 rounded-md bg-muted/50 border-l-2 border-primary" data-testid={`scene-${index}`}>
                      <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
                        <div className="flex items-center gap-2">
                          <Badge className="bg-primary/20 text-primary border-0">{scene.section}</Badge>
                          <span className="text-xs text-muted-foreground font-mono">{scene.duration}</span>
                        </div>
                        <Badge variant="outline" className="text-xs border-border">{scene.energy}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2 line-clamp-2 leading-relaxed">{scene.lines}</p>
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
              <div className="p-4 rounded-md bg-muted/50 border border-border">
                <div className="flex items-center gap-2 mb-3">
                  <Music className="w-4 h-4 text-primary" />
                  <h4 className="text-sm font-semibold text-foreground">Music & Audio</h4>
                </div>
                <p className="text-sm text-muted-foreground" data-testid="text-music-mood">
                  {script.musicMood || "Modern lo-fi or chill beat - 80-100 BPM. Not distracting."}
                </p>
              </div>

              {/* Pacing */}
              <div className="p-4 rounded-md bg-muted/50 border border-border">
                <div className="flex items-center gap-2 mb-3">
                  <Gauge className="w-4 h-4 text-primary" />
                  <h4 className="text-sm font-semibold text-foreground">Pacing</h4>
                </div>
                <p className="text-sm text-muted-foreground" data-testid="text-pacing">
                  {script.pacing || "Medium pace - let key points breathe for 1s"}
                </p>
              </div>

              {/* Caption Style */}
              <div className="p-4 rounded-md bg-muted/50 border border-border">
                <div className="flex items-center gap-2 mb-3">
                  <Type className="w-4 h-4 text-primary" />
                  <h4 className="text-sm font-semibold text-foreground">Caption Style</h4>
                </div>
                <p className="text-sm text-muted-foreground" data-testid="text-caption-style">
                  {script.captionStyle || "Bold, centered captions with 3-4 words max per line."}
                </p>
              </div>

              {/* Lighting */}
              <div className="p-4 rounded-md bg-muted/50 border border-border">
                <div className="flex items-center gap-2 mb-3">
                  <LightbulbIcon className="w-4 h-4 text-primary" />
                  <h4 className="text-sm font-semibold text-foreground">Lighting</h4>
                </div>
                <p className="text-sm text-muted-foreground" data-testid="text-lighting">
                  {script.lighting || "Ring light or soft box at 45-degree angle. Avoid harsh shadows."}
                </p>
              </div>
            </div>

            {/* Camera Angles */}
            {script.cameraAngles && script.cameraAngles.length > 0 && (
              <div className="p-4 rounded-md bg-muted/50 border border-border">
                <div className="flex items-center gap-2 mb-3">
                  <Camera className="w-4 h-4 text-primary" />
                  <h4 className="text-sm font-semibold text-foreground">Camera Angles</h4>
                </div>
                <div className="grid md:grid-cols-2 gap-2">
                  {script.cameraAngles.map((angle, index) => (
                    <div key={index} className="flex items-center gap-2 p-2 rounded bg-muted/50" data-testid={`camera-angle-${index}`}>
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
              <div className="p-4 rounded-md bg-muted/50 border border-border">
                <div className="flex items-center gap-2 mb-3">
                  <Wand2 className="w-4 h-4 text-primary" />
                  <h4 className="text-sm font-semibold text-foreground">Transitions & Effects</h4>
                </div>
                <div className="flex flex-wrap gap-2">
                  {script.transitions.map((transition, index) => (
                    <Badge 
                      key={index} 
                      variant="outline" 
                      className="border-primary/30 bg-primary/10 text-muted-foreground"
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
              <div className="p-4 rounded-md bg-muted/50 border border-border">
                <div className="flex items-center gap-2 mb-3">
                  <Film className="w-4 h-4 text-primary" />
                  <h4 className="text-sm font-semibold text-foreground">B-Roll Ideas</h4>
                </div>
                <div className="grid gap-2">
                  {script.bRollIdeas.map((idea, index) => (
                    <div key={index} className="flex items-start gap-3 p-2 rounded bg-muted/50" data-testid={`text-broll-${index}`}>
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
              <div className="p-4 rounded-md bg-muted/50 border border-border">
                <div className="flex items-center gap-2 mb-3">
                  <Type className="w-4 h-4 text-primary" />
                  <h4 className="text-sm font-semibold text-foreground">On-Screen Text Overlay Options</h4>
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
                                'border-border text-muted-foreground'
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
                                className="p-3 rounded-md bg-card dark:bg-neutral-900 border border-border text-center hover-elevate active-elevate-2 cursor-pointer group"
                                data-testid={`overlay-${(sectionData.section || 'section').toLowerCase()}-${optIndex}`}
                              >
                                <span className="text-foreground font-bold text-sm tracking-wide">{text}</span>
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
                          className="p-3 rounded-md bg-card dark:bg-neutral-900 border border-border text-center"
                          data-testid={`badge-onscreen-${index}`}
                        >
                          <span className="text-foreground font-bold text-sm tracking-wide">{text}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Shot Gallery */}
            <div className="p-4 rounded-md bg-muted/50 border border-border">
              <div className="flex items-center gap-2 mb-3">
                <Image className="w-4 h-4 text-primary" />
                <h4 className="text-sm font-semibold text-foreground">Shot Gallery</h4>
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
                        <div className={`relative rounded-md overflow-hidden mb-2 ring-2 transition-all ${expandedShot === `hook-${shot.id}` ? 'ring-primary' : 'ring-transparent hover:ring-primary/30'}`}>
                          <img 
                            src={shot.image} 
                            alt={shot.name}
                            className="w-40 h-28 object-cover"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent flex flex-col items-start justify-end p-2">
                            <span className="text-xs font-medium text-foreground">{shot.name}</span>
                            <span className="text-[10px] text-primary">{shot.angle}</span>
                          </div>
                          <div className="absolute top-2 right-2">
                            <ChevronDown className={`w-4 h-4 text-foreground transition-transform ${expandedShot === `hook-${shot.id}` ? 'rotate-180' : ''}`} />
                          </div>
                        </div>
                        <p className="text-[10px] text-muted-foreground line-clamp-2">{shot.whenToUse}</p>
                      </div>
                    ))}
                  </div>
                  {/* Expanded Shot Details for Hook */}
                  {expandedShot?.startsWith('hook-') && (
                    <div className="p-4 rounded-md bg-card dark:bg-neutral-900 border border-primary/30 animate-in slide-in-from-top-2 duration-200">
                      {(() => {
                        const shotId = expandedShot.replace('hook-', '');
                        const shot = getShotRecommendations("hook").find(s => s.id === shotId);
                        if (!shot) return null;
                        return (
                          <div className="space-y-4">
                            <div className="flex items-center justify-between">
                              <h5 className="font-semibold text-foreground">{shot.name} Setup Guide</h5>
                              <Badge className="bg-primary/20 text-primary border-0">{shot.angle}</Badge>
                            </div>
                            <div className="grid md:grid-cols-2 gap-4">
                              <div>
                                <p className="text-xs text-muted-foreground mb-1">Camera Height</p>
                                <p className="text-sm text-foreground">{shot.setup.cameraHeight}</p>
                              </div>
                              <div>
                                <p className="text-xs text-muted-foreground mb-1">Distance from Subject</p>
                                <p className="text-sm text-foreground">{shot.setup.distance}</p>
                              </div>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground mb-2">Equipment Needed</p>
                              <div className="flex flex-wrap gap-2">
                                {shot.setup.equipment.map((item, i) => (
                                  <Badge key={i} variant="outline" className="border-border text-muted-foreground text-xs">{item}</Badge>
                                ))}
                              </div>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground mb-2">Pro Tips</p>
                              <ul className="space-y-1">
                                {shot.setup.tips.map((tip, i) => (
                                  <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
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
                  <Badge variant="outline" className="border-border text-muted-foreground text-xs">Body Shots</Badge>
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
                        <div className={`relative rounded-md overflow-hidden mb-2 ring-2 transition-all ${expandedShot === `body-${shot.id}` ? 'ring-primary/50' : 'ring-transparent hover:ring-primary/30'}`}>
                          <img 
                            src={shot.image} 
                            alt={shot.name}
                            className="w-40 h-28 object-cover"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent flex flex-col items-start justify-end p-2">
                            <span className="text-xs font-medium text-foreground">{shot.name}</span>
                            <span className="text-[10px] text-muted-foreground">{shot.angle}</span>
                          </div>
                          <div className="absolute top-2 right-2">
                            <ChevronDown className={`w-4 h-4 text-foreground transition-transform ${expandedShot === `body-${shot.id}` ? 'rotate-180' : ''}`} />
                          </div>
                        </div>
                        <p className="text-[10px] text-muted-foreground line-clamp-2">{shot.whenToUse}</p>
                      </div>
                    ))}
                  </div>
                  {/* Expanded Shot Details for Body */}
                  {expandedShot?.startsWith('body-') && (
                    <div className="p-4 rounded-md bg-card dark:bg-neutral-900 border border-border animate-in slide-in-from-top-2 duration-200">
                      {(() => {
                        const shotId = expandedShot.replace('body-', '');
                        const shot = getShotRecommendations("body").find(s => s.id === shotId);
                        if (!shot) return null;
                        return (
                          <div className="space-y-4">
                            <div className="flex items-center justify-between">
                              <h5 className="font-semibold text-foreground">{shot.name} Setup Guide</h5>
                              <Badge className="bg-muted text-muted-foreground border-0">{shot.angle}</Badge>
                            </div>
                            <div className="grid md:grid-cols-2 gap-4">
                              <div>
                                <p className="text-xs text-muted-foreground mb-1">Camera Height</p>
                                <p className="text-sm text-foreground">{shot.setup.cameraHeight}</p>
                              </div>
                              <div>
                                <p className="text-xs text-muted-foreground mb-1">Distance from Subject</p>
                                <p className="text-sm text-foreground">{shot.setup.distance}</p>
                              </div>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground mb-2">Equipment Needed</p>
                              <div className="flex flex-wrap gap-2">
                                {shot.setup.equipment.map((item, i) => (
                                  <Badge key={i} variant="outline" className="border-border text-muted-foreground text-xs">{item}</Badge>
                                ))}
                              </div>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground mb-2">Pro Tips</p>
                              <ul className="space-y-1">
                                {shot.setup.tips.map((tip, i) => (
                                  <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
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
                        <div className={`relative rounded-md overflow-hidden mb-2 ring-2 transition-all ${expandedShot === `cta-${shot.id}` ? 'ring-green-500' : 'ring-transparent hover:ring-primary/30'}`}>
                          <img 
                            src={shot.image} 
                            alt={shot.name}
                            className="w-40 h-28 object-cover"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent flex flex-col items-start justify-end p-2">
                            <span className="text-xs font-medium text-foreground">{shot.name}</span>
                            <span className="text-[10px] text-green-400">{shot.angle}</span>
                          </div>
                          <div className="absolute top-2 right-2">
                            <ChevronDown className={`w-4 h-4 text-foreground transition-transform ${expandedShot === `cta-${shot.id}` ? 'rotate-180' : ''}`} />
                          </div>
                        </div>
                        <p className="text-[10px] text-muted-foreground line-clamp-2">{shot.whenToUse}</p>
                      </div>
                    ))}
                  </div>
                  {/* Expanded Shot Details for CTA */}
                  {expandedShot?.startsWith('cta-') && (
                    <div className="p-4 rounded-md bg-card dark:bg-neutral-900 border border-green-500/30 animate-in slide-in-from-top-2 duration-200">
                      {(() => {
                        const shotId = expandedShot.replace('cta-', '');
                        const shot = getShotRecommendations("cta").find(s => s.id === shotId);
                        if (!shot) return null;
                        return (
                          <div className="space-y-4">
                            <div className="flex items-center justify-between">
                              <h5 className="font-semibold text-foreground">{shot.name} Setup Guide</h5>
                              <Badge className="bg-green-500/20 text-green-400 border-0">{shot.angle}</Badge>
                            </div>
                            <div className="grid md:grid-cols-2 gap-4">
                              <div>
                                <p className="text-xs text-muted-foreground mb-1">Camera Height</p>
                                <p className="text-sm text-foreground">{shot.setup.cameraHeight}</p>
                              </div>
                              <div>
                                <p className="text-xs text-muted-foreground mb-1">Distance from Subject</p>
                                <p className="text-sm text-foreground">{shot.setup.distance}</p>
                              </div>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground mb-2">Equipment Needed</p>
                              <div className="flex flex-wrap gap-2">
                                {shot.setup.equipment.map((item, i) => (
                                  <Badge key={i} variant="outline" className="border-border text-muted-foreground text-xs">{item}</Badge>
                                ))}
                              </div>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground mb-2">Pro Tips</p>
                              <ul className="space-y-1">
                                {shot.setup.tips.map((tip, i) => (
                                  <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
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
            <div className="p-4 rounded-md bg-muted/50 border border-border">
              <div className="flex items-center gap-2 mb-3">
                <Music className="w-4 h-4 text-primary" />
                <h4 className="text-sm font-semibold text-foreground">Music Resources</h4>
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
                    className="flex items-center gap-2 p-2 rounded-md bg-muted/50 border border-border hover-elevate active-elevate-2"
                    data-testid={`music-resource-${index}`}
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{resource.name}</p>
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
                  <p className="text-sm text-muted-foreground" data-testid="text-production-notes">
                    {(script.productionNotes as any).filming || "Film close-up, direct to camera. High energy on the hook."}
                  </p>
                  {Array.isArray((script.productionNotes as any).tips) && (script.productionNotes as any).tips.length > 0 && (
                    <ul className="space-y-1">
                      {(script.productionNotes as any).tips
                        .filter((tip: any) => typeof tip === 'string')
                        .map((tip: string, index: number) => (
                          <li key={index} className="text-xs text-muted-foreground flex items-start gap-2">
                            <span className="text-primary mt-0.5">-</span>
                            {tip}
                          </li>
                        ))}
                    </ul>
                  )}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground" data-testid="text-production-notes">
                  {typeof script.productionNotes === 'string' ? script.productionNotes : "Film close-up, direct to camera. High energy on the hook."}
                </p>
              )}
            </div>
          </div>
        </TabsContent>
      </Tabs>

      <div className="flex flex-wrap items-center gap-2">
        <Button onClick={handleCopy} variant="outline" size="sm" className="bg-muted/50 border-border" data-testid="button-copy">
          {copied ? <Check className="w-4 h-4 mr-1" /> : <Copy className="w-4 h-4 mr-1" />}
          {copied ? "Copied" : "Copy Script"}
        </Button>
        
        <Button
          onClick={onRegenerate}
          variant="outline"
          size="sm"
          disabled={isRegenerating}
          className="bg-muted/50 border-border"
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
          className="bg-muted/50 border-border"
          data-testid="button-save-vault"
        >
          <Save className="w-4 h-4 mr-1" />
          Save to Vault
        </Button>
        
        {script.id && (
          <Button
            onClick={() => emailScriptMutation.mutate()}
            variant="outline"
            size="sm"
            disabled={emailScriptMutation.isPending}
            className="bg-muted/50 border-border"
            data-testid="button-email-script"
          >
            <Mail className="w-4 h-4 mr-1" />
            {emailScriptMutation.isPending ? "Sending..." : "Email Script"}
          </Button>
        )}
        
        <Button
          onClick={() => addToProjectMutation.mutate()}
          variant="outline"
          size="sm"
          disabled={addToProjectMutation.isPending}
          className="bg-muted/50 border-border"
          data-testid="button-add-project"
        >
          <FolderPlus className="w-4 h-4 mr-1" />
          Add to Project
        </Button>
        
        <Button 
          variant="outline" 
          size="sm" 
          className="bg-muted/50 border-border"
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
        
        {script.id && (
          <Button
            variant="outline"
            size="sm"
            className="bg-muted/50 border-border"
            onClick={() => setShowVersionHistory(true)}
            data-testid="button-version-history"
          >
            <History className="w-4 h-4 mr-1" />
            History
          </Button>
        )}
        
        {script.id && (
          <Button
            variant="outline"
            size="sm"
            className="bg-muted/50 border-border"
            onClick={() => {
              if (!enhancedScript) {
                setEnhancedScript(script.script);
              }
              setShowCollabEditor(true);
            }}
            data-testid="button-edit-script"
          >
            <FileText className="w-4 h-4 mr-1" />
            Edit & Save
          </Button>
        )}
      </div>
      
      {showVersionHistory && script.id && (
        <div className="mt-4">
          <VersionHistory
            scriptId={script.id}
            currentScript={enhancedScript || script.script}
            wordCount={enhancedMetrics?.wordCount || script.wordCount || 0}
            gradeLevel={enhancedMetrics?.gradeLevel || script.gradeLevel || 0}
            parameters={script.parameters}
            onRevert={(restoredScript) => {
              setEnhancedScript(restoredScript);
              toast({
                title: "Version Restored",
                description: "The script has been reverted to the selected version.",
              });
            }}
          />
        </div>
      )}
      
      {showCollabEditor && script.id && (
        <div className="mt-4 p-4 rounded-lg bg-muted/50 border border-border">
          <div className="flex items-center justify-between mb-3 gap-2 flex-wrap">
            <h3 className="text-sm font-medium flex items-center gap-2">
              <Users className="w-4 h-4" />
              Edit Script
              {hasUnsavedChanges && (
                <Badge variant="outline" className="text-xs bg-yellow-500/10 text-yellow-500 border-yellow-500/30">
                  Unsaved changes
                </Badge>
              )}
            </h3>
            <div className="flex items-center gap-2">
              <Button 
                size="sm" 
                onClick={() => saveScriptMutation.mutate()}
                disabled={saveScriptMutation.isPending || !hasUnsavedChanges}
                className="bg-green-600 hover:bg-green-700"
                data-testid="button-save-script"
              >
                {saveScriptMutation.isPending ? (
                  <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin mr-1" />
                ) : (
                  <Save className="w-4 h-4 mr-1" />
                )}
                Save Changes
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setShowCollabEditor(false)}>
                Close
              </Button>
            </div>
          </div>
          <p className="text-xs text-muted-foreground mb-3">
            Edit your script below. Saving helps Script Memory learn your voice and style.
          </p>
          <CollaborativeEditor
            scriptId={script.id}
            initialContent={enhancedScript || script.script}
            isEnabled={false}
            onContentChange={(content) => {
              setEnhancedScript(content);
              setHasUnsavedChanges(true);
            }}
          />
        </div>
      )}

      {/* AI Chat Refinement Bar */}
      <div className="mt-6 pt-4 border-t border-border">
        <div className="flex items-center justify-between mb-3">
          <button
            onClick={() => setShowAiChat(!showAiChat)}
            className="flex items-center gap-2 text-sm font-medium text-foreground hover:text-primary transition-colors"
            data-testid="button-toggle-ai-chat"
          >
            <Sparkles className="w-4 h-4 text-primary" />
            AI Script Refiner
            {chatMessages.length > 0 && (
              <Badge variant="secondary" className="text-[10px]">{chatMessages.length} messages</Badge>
            )}
            {showAiChat ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
          {hasUnsavedChanges && (
            <Button 
              size="sm" 
              onClick={() => saveScriptMutation.mutate()}
              disabled={saveScriptMutation.isPending}
              className="bg-green-600 hover:bg-green-700"
              data-testid="button-save-refined-script"
            >
              {saveScriptMutation.isPending ? (
                <Loader2 className="w-3 h-3 animate-spin mr-1" />
              ) : (
                <Save className="w-3 h-3 mr-1" />
              )}
              Save Changes
            </Button>
          )}
        </div>

        {showAiChat && (
          <div className="rounded-lg border border-border bg-muted/30">
            {/* Chat messages */}
            {chatMessages.length > 0 && (
              <ScrollArea className="max-h-[200px] p-3">
                <div className="space-y-3">
                  {chatMessages.map((msg, i) => (
                    <div
                      key={i}
                      className={`flex gap-2 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                    >
                      {msg.role === "assistant" && (
                        <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                          <Bot className="w-3 h-3 text-primary" />
                        </div>
                      )}
                      <div
                        className={`max-w-[80%] px-3 py-2 rounded-lg text-sm ${
                          msg.role === "user"
                            ? "bg-primary text-primary-foreground"
                            : "bg-card border border-border"
                        }`}
                      >
                        {msg.content}
                      </div>
                      {msg.role === "user" && (
                        <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                          <User className="w-3 h-3 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                  ))}
                  {refineScriptMutation.isPending && (
                    <div className="flex gap-2 justify-start">
                      <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                        <Bot className="w-3 h-3 text-primary" />
                      </div>
                      <div className="px-3 py-2 rounded-lg text-sm bg-card border border-border flex items-center gap-2">
                        <Loader2 className="w-3 h-3 animate-spin" />
                        Refining script...
                      </div>
                    </div>
                  )}
                </div>
              </ScrollArea>
            )}

            {/* Input area */}
            <div className="p-3 border-t border-border">
              <div className="flex gap-2">
                <Input
                  placeholder="Tell me how to change the script... (e.g., 'make the hook more aggressive', 'add humor')"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSendChat();
                    }
                  }}
                  disabled={refineScriptMutation.isPending}
                  className="flex-1 text-sm"
                  data-testid="input-ai-refine"
                />
                <Button
                  onClick={handleSendChat}
                  disabled={!chatInput.trim() || refineScriptMutation.isPending}
                  size="icon"
                  data-testid="button-send-refine"
                >
                  {refineScriptMutation.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Ask the AI to make changes like "add more urgency", "make it funnier", "change the CTA", etc.
              </p>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}
