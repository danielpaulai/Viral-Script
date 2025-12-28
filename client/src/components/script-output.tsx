import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { GeneratedScript } from "@shared/schema";
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
    await navigator.clipboard.writeText(script.script);
    setCopied(true);
    toast({
      title: "Copied",
      description: "Script copied to clipboard.",
    });
    setTimeout(() => setCopied(false), 2000);
  };

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

  return (
    <Card className="p-6 bg-card border-card-border" data-testid="card-script-output">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-semibold mb-1" data-testid="text-output-title">Generated Script</h2>
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <span data-testid="text-word-count">{script.wordCount} words</span>
            <span>|</span>
            <span className={gradeColor} data-testid="text-grade-level">
              Grade {script.gradeLevel.toFixed(1)} ({gradeLabel})
            </span>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowAnalysis(!showAnalysis)}
            data-testid="button-show-analysis"
          >
            <BarChart3 className="w-4 h-4 mr-1" />
            {showAnalysis ? "Hide" : "Show"} Analysis
            {showAnalysis ? <ChevronUp className="w-4 h-4 ml-1" /> : <ChevronDown className="w-4 h-4 ml-1" />}
          </Button>
        </div>
      </div>

      {showAnalysis && (
        <div className="mb-6 p-4 rounded-md bg-muted/30 border border-muted">
          <h3 className="text-sm font-medium mb-3">Readability Analysis</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-xs text-muted-foreground mb-1">Grade Level</p>
              <p className={`text-2xl font-bold ${gradeColor}`} data-testid="stat-grade">
                {script.gradeLevel.toFixed(1)}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Word Count</p>
              <p className="text-2xl font-bold" data-testid="stat-words">{script.wordCount}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Est. Duration</p>
              <p className="text-2xl font-bold" data-testid="stat-duration">
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
        <TabsList className="bg-muted/50">
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
            className="p-6 rounded-md bg-muted/20 border border-muted font-mono text-sm leading-relaxed whitespace-pre-wrap"
            data-testid="text-script-content"
          >
            {script.script}
          </div>
        </TabsContent>
        
        <TabsContent value="production" className="mt-4">
          <div className="space-y-4">
            <div className="p-4 rounded-md bg-muted/20 border border-muted">
              <h4 className="text-sm font-medium mb-2">Filming Notes</h4>
              <p className="text-sm text-muted-foreground italic" data-testid="text-production-notes">
                {script.productionNotes}
              </p>
            </div>
            
            {script.bRollIdeas.length > 0 && (
              <div className="p-4 rounded-md bg-muted/20 border border-muted">
                <h4 className="text-sm font-medium mb-2">B-Roll Ideas</h4>
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
              <div className="p-4 rounded-md bg-muted/20 border border-muted">
                <h4 className="text-sm font-medium mb-2">On-Screen Text</h4>
                <div className="flex flex-wrap gap-2">
                  {script.onScreenText.map((text, index) => (
                    <Badge key={index} variant="outline" data-testid={`badge-onscreen-${index}`}>
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
        <Button onClick={handleCopy} variant="outline" size="sm" data-testid="button-copy">
          {copied ? <Check className="w-4 h-4 mr-1" /> : <Copy className="w-4 h-4 mr-1" />}
          {copied ? "Copied" : "Copy Script"}
        </Button>
        
        <Button
          onClick={onRegenerate}
          variant="outline"
          size="sm"
          disabled={isRegenerating}
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
          data-testid="button-add-project"
        >
          <FolderPlus className="w-4 h-4 mr-1" />
          Add to Project
        </Button>
        
        <Button variant="outline" size="sm" data-testid="button-remix">
          <Shuffle className="w-4 h-4 mr-1" />
          Remix Idea
        </Button>
      </div>
    </Card>
  );
}
