import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Download, Crown, Star, CheckCircle2 } from "lucide-react";
import { SiTiktok, SiInstagram } from "react-icons/si";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface ImportStyleDialogProps {
  userPlan?: string;
  onImportComplete?: (content: string, platform: string, username: string) => void;
}

interface ScrapedAnalysis {
  hooks: string[];
  phrases: string[];
  avgLength: number;
  styleNotes: string;
  topPerformingContent: string[];
}

interface ScrapeResult {
  success: boolean;
  platform: string;
  username: string;
  postsAnalyzed: number;
  analysis: ScrapedAnalysis;
  suggestedKnowledgeBase: string;
}

export function ImportStyleDialog({ userPlan, onImportComplete }: ImportStyleDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [platform, setPlatform] = useState<"tiktok" | "instagram">("tiktok");
  const [username, setUsername] = useState("");
  const [result, setResult] = useState<ScrapeResult | null>(null);
  const { toast } = useToast();

  const isPro = true;

  const scrapeMutation = useMutation({
    mutationFn: async ({ platform, username }: { platform: string; username: string }) => {
      const res = await apiRequest("POST", `/api/scrape/${platform}`, { username });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to analyze profile");
      }
      return res.json() as Promise<ScrapeResult>;
    },
    onSuccess: (data) => {
      setResult(data);
      toast({
        title: "Profile analyzed",
        description: `Found ${data.postsAnalyzed} posts from @${data.username}`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Analysis failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (data: { type: string; title: string; content: string; summary: string }) => {
      const res = await apiRequest("POST", "/api/knowledge-base", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/knowledge-base"] });
      toast({
        title: "Style saved",
        description: "Your creator style has been added to your Knowledge Base",
      });
      if (result && onImportComplete) {
        onImportComplete(result.suggestedKnowledgeBase, result.platform, result.username);
      }
      handleClose();
    },
    onError: () => {
      toast({
        title: "Failed to save",
        description: "Could not save to Knowledge Base",
        variant: "destructive",
      });
    },
  });

  const handleAnalyze = () => {
    if (!username.trim()) {
      toast({
        title: "Username required",
        description: "Please enter a username to analyze",
        variant: "destructive",
      });
      return;
    }
    setResult(null);
    scrapeMutation.mutate({ platform, username: username.trim() });
  };

  const handleSave = () => {
    if (!result) return;
    saveMutation.mutate({
      type: "voice_dna",
      title: `${result.platform === "tiktok" ? "TikTok" : "Instagram"} Style - @${result.username}`,
      content: result.suggestedKnowledgeBase,
      summary: `Imported creator style from ${result.platform} with ${result.postsAnalyzed} posts analyzed`,
    });
  };

  const handleClose = () => {
    setIsOpen(false);
    setUsername("");
    setResult(null);
  };

  if (!isPro) {
    return (
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" className="gap-2" data-testid="button-import-style">
            <Download className="h-4 w-4" />
            Import Your Style
            <Badge variant="secondary" className="ml-1">
              <Crown className="h-3 w-3 mr-1" />
              Pro
            </Badge>
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Crown className="h-5 w-5 text-yellow-500" />
              Pro Feature
            </DialogTitle>
            <DialogDescription>
              Upgrade to Pro to automatically import your creator style from TikTok or Instagram.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="flex items-start gap-3">
              <SiTiktok className="h-5 w-5 mt-0.5 text-muted-foreground" />
              <div>
                <p className="font-medium">TikTok Import</p>
                <p className="text-sm text-muted-foreground">
                  Analyze your TikTok videos to extract your unique voice and hooks
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <SiInstagram className="h-5 w-5 mt-0.5 text-muted-foreground" />
              <div>
                <p className="font-medium">Instagram Import</p>
                <p className="text-sm text-muted-foreground">
                  Extract your style from Instagram posts and reels
                </p>
              </div>
            </div>
          </div>
          <div className="flex justify-end">
            <Button onClick={() => window.location.href = "/#pricing"} data-testid="button-upgrade-pro">
              Upgrade to Pro
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2" data-testid="button-import-style">
          <Download className="h-4 w-4" />
          Import Your Style
          <Star className="h-3 w-3 ml-1 text-yellow-500" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Import Your Creator Style</DialogTitle>
          <DialogDescription>
            Analyze your social media content to automatically generate a Voice DNA profile
          </DialogDescription>
        </DialogHeader>

        <Tabs value={platform} onValueChange={(v) => setPlatform(v as "tiktok" | "instagram")} className="mt-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="tiktok" className="gap-2" data-testid="tab-tiktok">
              <SiTiktok className="h-4 w-4" />
              TikTok
            </TabsTrigger>
            <TabsTrigger value="instagram" className="gap-2" data-testid="tab-instagram">
              <SiInstagram className="h-4 w-4" />
              Instagram
            </TabsTrigger>
          </TabsList>

          <TabsContent value="tiktok" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="tiktok-username">TikTok Username</Label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">@</span>
                  <Input
                    id="tiktok-username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value.replace("@", ""))}
                    placeholder="username"
                    className="pl-8"
                    data-testid="input-tiktok-username"
                  />
                </div>
                <Button 
                  onClick={handleAnalyze} 
                  disabled={scrapeMutation.isPending}
                  data-testid="button-analyze-tiktok"
                >
                  {scrapeMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    "Analyze"
                  )}
                </Button>
              </div>
              <p className="text-sm text-muted-foreground">
                We will analyze your last 30 public videos to extract your style
              </p>
            </div>
          </TabsContent>

          <TabsContent value="instagram" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="instagram-username">Instagram Username</Label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">@</span>
                  <Input
                    id="instagram-username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value.replace("@", ""))}
                    placeholder="username"
                    className="pl-8"
                    data-testid="input-instagram-username"
                  />
                </div>
                <Button 
                  onClick={handleAnalyze} 
                  disabled={scrapeMutation.isPending}
                  data-testid="button-analyze-instagram"
                >
                  {scrapeMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    "Analyze"
                  )}
                </Button>
              </div>
              <p className="text-sm text-muted-foreground">
                We will analyze your last 30 public posts to extract your style
              </p>
            </div>
          </TabsContent>
        </Tabs>

        {result && (
          <Card className="mt-4">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                    Analysis Complete
                  </CardTitle>
                  <CardDescription>
                    Analyzed {result.postsAnalyzed} posts from @{result.username}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm font-medium mb-2">Style Characteristics:</p>
                <p className="text-sm text-muted-foreground">{result.analysis.styleNotes}</p>
              </div>

              {result.analysis.hooks.length > 0 && (
                <div>
                  <p className="text-sm font-medium mb-2">Top Hooks:</p>
                  <ul className="space-y-1">
                    {result.analysis.hooks.slice(0, 3).map((hook, i) => (
                      <li key={i} className="text-sm text-muted-foreground pl-3 border-l-2 border-primary/30">
                        {hook.length > 100 ? hook.slice(0, 100) + "..." : hook}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {result.analysis.phrases.length > 0 && (
                <div>
                  <p className="text-sm font-medium mb-2">Common Phrases:</p>
                  <div className="flex flex-wrap gap-1">
                    {result.analysis.phrases.slice(0, 8).map((phrase, i) => (
                      <Badge key={i} variant="secondary">
                        {phrase}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              <div className="pt-2">
                <p className="text-sm font-medium mb-2">Generated Voice DNA:</p>
                <div className="bg-muted/50 rounded-md p-3 max-h-40 overflow-y-auto">
                  <p className="text-sm whitespace-pre-wrap">{result.suggestedKnowledgeBase}</p>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" onClick={handleClose} data-testid="button-cancel-import">
                  Cancel
                </Button>
                <Button 
                  onClick={handleSave} 
                  disabled={saveMutation.isPending}
                  data-testid="button-save-style"
                >
                  {saveMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Save to Knowledge Base"
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </DialogContent>
    </Dialog>
  );
}
