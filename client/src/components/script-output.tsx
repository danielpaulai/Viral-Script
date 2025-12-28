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
    if (customHookLine) {
      const lines = script.script.split('\n');
      lines[0] = customHookLine;
      return lines.join('\n');
    }
    return script.script;
  };

  const currentHook = selectedHook 
    ? viralHooks.find(h => h.id === selectedHook)
    : null;

  const gradeColor = script.gradeLevel <= 6 
    ? "text-green-500" 
    : script.gradeLevel <= 8 
    ? "text-yellow-500" 
    : "text-red-500";

  const gradeLabel = script.gradeLevel <= 6 
    ? "Easy" 
    : script.gradeLevel <= 8 
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
          <h2 className="text-lg font-semibold mb-1 text-white" data-testid="text-output-title">Generated Script</h2>
          <div className="flex items-center gap-3 text-sm text-muted-foreground flex-wrap">
            <span data-testid="text-word-count">{script.wordCount} words</span>
            <span className="hidden sm:inline">|</span>
            <span className={gradeColor} data-testid="text-grade-level">
              Grade {script.gradeLevel.toFixed(1)} ({gradeLabel})
            </span>
          </div>
        </div>
        
        <div className="flex items-center gap-2 flex-wrap">
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
          <div 
            className="p-6 rounded-md bg-white/5 border border-white/10 font-mono text-sm leading-relaxed whitespace-pre-wrap text-white/90"
            data-testid="text-script-content"
          >
            {getDisplayScript()}
          </div>
          {currentHook && (
            <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
              <Zap className="w-3 h-3 text-primary" />
              Using "{currentHook.name}" hook style
            </p>
          )}
        </TabsContent>
        
        <TabsContent value="production" className="mt-4">
          <div className="space-y-4">
            <div className="p-4 rounded-md bg-white/5 border border-white/10">
              <h4 className="text-sm font-medium mb-2 text-white">Filming Notes</h4>
              <p className="text-sm text-muted-foreground italic" data-testid="text-production-notes">
                {script.productionNotes}
              </p>
            </div>
            
            {script.bRollIdeas.length > 0 && (
              <div className="p-4 rounded-md bg-white/5 border border-white/10">
                <h4 className="text-sm font-medium mb-2 text-white">B-Roll Ideas</h4>
                <ul className="space-y-1">
                  {script.bRollIdeas.map((idea, index) => (
                    <li key={index} className="text-sm text-muted-foreground flex items-start gap-2">
                      <span className="text-primary">•</span>
                      <span data-testid={`text-broll-${index}`}>{idea}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            
            {script.onScreenText.length > 0 && (
              <div className="p-4 rounded-md bg-white/5 border border-white/10">
                <h4 className="text-sm font-medium mb-2 text-white">On-Screen Text</h4>
                <div className="flex flex-wrap gap-2">
                  {script.onScreenText.map((text, index) => (
                    <Badge key={index} variant="outline" className="border-white/20" data-testid={`badge-onscreen-${index}`}>
                      {text}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
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
