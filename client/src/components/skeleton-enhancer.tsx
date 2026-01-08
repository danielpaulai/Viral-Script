import { useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import {
  Loader2,
  Lightbulb,
  TrendingUp,
  Search,
  RefreshCw,
  Check,
  Edit3,
  ChevronRight,
  Target,
  Zap,
  MessageCircle,
  Eye,
  Heart,
  AlertTriangle,
  Sparkles,
  ArrowRight,
  Quote,
  BarChart3,
} from "lucide-react";
import type {
  VideoIdeaSkeleton,
  EnhancedSkeleton,
  DeepResearchBrief,
  CompetitorAnalysis,
  SkeletonSectionType,
} from "@shared/schema";

interface SkeletonEnhancerProps {
  skeleton: VideoIdeaSkeleton;
  onSkeletonChange: (skeleton: VideoIdeaSkeleton) => void;
  onEnhancementComplete: (enhanced: EnhancedSkeleton) => void;
  onBack: () => void;
}

function formatNumber(num: number): string {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
  if (num >= 1000) return (num / 1000).toFixed(1) + "K";
  return num.toString();
}

export function SkeletonEnhancer({
  skeleton,
  onSkeletonChange,
  onEnhancementComplete,
  onBack,
}: SkeletonEnhancerProps) {
  const { toast } = useToast();
  const [editingSection, setEditingSection] = useState<SkeletonSectionType | null>(null);
  const [research, setResearch] = useState<DeepResearchBrief | null>(null);
  const [competitorAnalysis, setCompetitorAnalysis] = useState<CompetitorAnalysis | null>(null);
  const [selectedInsights, setSelectedInsights] = useState<string[]>([]);
  const [additionalNotes, setAdditionalNotes] = useState("");

  const deepResearchMutation = useMutation({
    mutationFn: async () => {
      const topic = `${skeleton.hook.content} - ${skeleton.problem.content}`;
      const response = await apiRequest("POST", "/api/scripts/expand-topic", {
        topic,
        targetAudience: skeleton.targetAudience,
        includeCompetitorResearch: true,
      });
      return response.json();
    },
    onSuccess: (data: any) => {
      if (data.expandedBrief) {
        setResearch(data.expandedBrief);
      }
      if (data.competitorInsights) {
        setCompetitorAnalysis({
          topHooks: data.competitorInsights.topHooks || [],
          commonPatterns: data.competitorInsights.commonPatterns || [],
          audienceLanguage: data.competitorInsights.audienceLanguage || [],
          provenAngles: data.competitorInsights.provenAngles || [],
          engagementStats: data.competitorInsights.engagementStats || { avgViews: 0, avgLikes: 0, avgComments: 0 },
          contentSummary: data.competitorInsights.contentSummary || "",
          postsAnalyzed: data.competitorInsights.postsAnalyzed || 0,
        });
      }
      toast({
        title: "Research Complete",
        description: "Deep research and competitor analysis loaded",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Research Failed",
        description: error.message || "Could not complete deep research",
        variant: "destructive",
      });
    },
  });

  const competitorMutation = useMutation({
    mutationFn: async () => {
      const keyword = skeleton.rawIdea || skeleton.hook.content.split(" ").slice(0, 5).join(" ");
      const response = await apiRequest("POST", "/api/research/competitors", { keyword, limit: 15 });
      return response.json();
    },
    onSuccess: (data: any) => {
      if (data.insights) {
        setCompetitorAnalysis({
          ...data.insights,
          postsAnalyzed: data.postsAnalyzed || 0,
        });
      }
      toast({
        title: "Competitor Analysis Complete",
        description: `Analyzed ${data.postsAnalyzed || 0} top-performing videos`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Competitor Analysis Failed",
        description: error.message || "Could not analyze competitors",
        variant: "destructive",
      });
    },
  });

  useEffect(() => {
    if (!research && !deepResearchMutation.isPending) {
      deepResearchMutation.mutate();
    }
  }, []);

  const toggleInsight = (insight: string) => {
    setSelectedInsights(prev =>
      prev.includes(insight)
        ? prev.filter(i => i !== insight)
        : [...prev, insight]
    );
  };

  const updateSection = (type: SkeletonSectionType, content: string) => {
    const updated = { ...skeleton };
    updated[type] = { ...updated[type], content };
    onSkeletonChange(updated);
  };

  const handleContinue = () => {
    const enhanced: EnhancedSkeleton = {
      baseSkeleton: skeleton,
      research: research || undefined,
      competitorAnalysis: competitorAnalysis || undefined,
      selectedInsights,
      additionalNotes: additionalNotes || undefined,
      isEnhanced: true,
    };
    onEnhancementComplete(enhanced);
  };

  const isLoading = deepResearchMutation.isPending || competitorMutation.isPending;

  const sectionConfig = [
    { type: "hook" as const, label: "Hook", icon: Target, color: "text-amber-500" },
    { type: "problem" as const, label: "Problem", icon: AlertTriangle, color: "text-red-500" },
    { type: "solution" as const, label: "Solution", icon: Lightbulb, color: "text-green-500" },
    { type: "cta" as const, label: "Call to Action", icon: Zap, color: "text-blue-500" },
  ];

  return (
    <div className="space-y-6" data-testid="skeleton-enhancer">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-xl font-semibold">Enhance Your Skeleton</h2>
          <p className="text-sm text-muted-foreground">
            Review and refine with AI research and competitor insights
          </p>
        </div>
        <Button variant="outline" onClick={onBack} data-testid="button-back-to-skeleton">
          Back to Edit
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Edit3 className="w-4 h-4" />
                Your Content Skeleton
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {sectionConfig.map(({ type, label, icon: Icon, color }) => (
                <div key={type} className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Icon className={`w-4 h-4 ${color}`} />
                      <span className="text-sm font-medium">{label}</span>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setEditingSection(editingSection === type ? null : type)}
                      data-testid={`button-edit-${type}`}
                    >
                      {editingSection === type ? <Check className="w-3 h-3" /> : <Edit3 className="w-3 h-3" />}
                    </Button>
                  </div>
                  {editingSection === type ? (
                    <Textarea
                      value={skeleton[type].content}
                      onChange={(e) => updateSection(type, e.target.value)}
                      className="min-h-[80px] text-sm"
                      data-testid={`input-${type}-content`}
                    />
                  ) : (
                    <div className="p-3 bg-muted/50 rounded-md text-sm">
                      {skeleton[type].content || <span className="text-muted-foreground italic">Not set</span>}
                    </div>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>

          {additionalNotes !== undefined && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <MessageCircle className="w-4 h-4" />
                  Additional Notes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  placeholder="Add any additional context, examples, or notes to include in your script..."
                  value={additionalNotes}
                  onChange={(e) => setAdditionalNotes(e.target.value)}
                  className="min-h-[100px]"
                  data-testid="input-additional-notes"
                />
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-4">
          <Tabs defaultValue="research" className="w-full">
            <TabsList className="w-full">
              <TabsTrigger value="research" className="flex-1" data-testid="tab-research">
                <Sparkles className="w-4 h-4 mr-2" />
                Deep Research
              </TabsTrigger>
              <TabsTrigger value="competitors" className="flex-1" data-testid="tab-competitors">
                <TrendingUp className="w-4 h-4 mr-2" />
                Competitors
              </TabsTrigger>
            </TabsList>

            <TabsContent value="research" className="mt-4">
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between gap-2">
                    <CardTitle className="text-base">AI Research Insights</CardTitle>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => deepResearchMutation.mutate()}
                      disabled={deepResearchMutation.isPending}
                      data-testid="button-refresh-research"
                    >
                      <RefreshCw className={`w-4 h-4 ${deepResearchMutation.isPending ? "animate-spin" : ""}`} />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {deepResearchMutation.isPending ? (
                    <div className="flex flex-col items-center justify-center py-8 gap-3">
                      <Loader2 className="w-8 h-8 animate-spin text-primary" />
                      <p className="text-sm text-muted-foreground">Researching your topic...</p>
                    </div>
                  ) : research ? (
                    <ScrollArea className="h-[400px] pr-4">
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <Checkbox
                              id="core-message"
                              checked={selectedInsights.includes(research.coreMessage)}
                              onCheckedChange={() => toggleInsight(research.coreMessage)}
                            />
                            <label htmlFor="core-message" className="text-sm font-medium">Core Message</label>
                          </div>
                          <p className="text-sm text-muted-foreground pl-6">{research.coreMessage}</p>
                        </div>

                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <Checkbox
                              id="unique-angle"
                              checked={selectedInsights.includes(research.uniqueAngle)}
                              onCheckedChange={() => toggleInsight(research.uniqueAngle)}
                            />
                            <label htmlFor="unique-angle" className="text-sm font-medium">Unique Angle</label>
                          </div>
                          <p className="text-sm text-muted-foreground pl-6">{research.uniqueAngle}</p>
                        </div>

                        <div className="space-y-2">
                          <p className="text-sm font-medium">Key Proof Points</p>
                          {research.keyProofPoints.map((point, idx) => (
                            <div key={idx} className="flex items-start gap-2 pl-2">
                              <Checkbox
                                id={`proof-${idx}`}
                                checked={selectedInsights.includes(point)}
                                onCheckedChange={() => toggleInsight(point)}
                              />
                              <label htmlFor={`proof-${idx}`} className="text-sm text-muted-foreground">{point}</label>
                            </div>
                          ))}
                        </div>

                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <Checkbox
                              id="takeaway"
                              checked={selectedInsights.includes(research.actionableTakeaway)}
                              onCheckedChange={() => toggleInsight(research.actionableTakeaway)}
                            />
                            <label htmlFor="takeaway" className="text-sm font-medium">Actionable Takeaway</label>
                          </div>
                          <p className="text-sm text-muted-foreground pl-6">{research.actionableTakeaway}</p>
                        </div>

                        <div className="pt-4 border-t">
                          <p className="text-sm font-medium mb-2">Target Viewer</p>
                          <p className="text-sm text-muted-foreground">{research.targetViewer}</p>
                        </div>
                      </div>
                    </ScrollArea>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-8 gap-3">
                      <Search className="w-8 h-8 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">No research data yet</p>
                      <Button
                        size="sm"
                        onClick={() => deepResearchMutation.mutate()}
                        data-testid="button-start-research"
                      >
                        Start Research
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="competitors" className="mt-4">
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between gap-2">
                    <CardTitle className="text-base">Competitor Analysis</CardTitle>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => competitorMutation.mutate()}
                      disabled={competitorMutation.isPending}
                      data-testid="button-refresh-competitors"
                    >
                      <RefreshCw className={`w-4 h-4 ${competitorMutation.isPending ? "animate-spin" : ""}`} />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {competitorMutation.isPending ? (
                    <div className="flex flex-col items-center justify-center py-8 gap-3">
                      <Loader2 className="w-8 h-8 animate-spin text-primary" />
                      <p className="text-sm text-muted-foreground">Analyzing top performers...</p>
                    </div>
                  ) : competitorAnalysis ? (
                    <ScrollArea className="h-[400px] pr-4">
                      <div className="space-y-4">
                        <div className="grid grid-cols-3 gap-3">
                          <div className="text-center p-3 bg-muted/50 rounded-md">
                            <Eye className="w-4 h-4 mx-auto mb-1 text-muted-foreground" />
                            <p className="text-lg font-semibold">{formatNumber(competitorAnalysis.engagementStats.avgViews)}</p>
                            <p className="text-xs text-muted-foreground">Avg Views</p>
                          </div>
                          <div className="text-center p-3 bg-muted/50 rounded-md">
                            <Heart className="w-4 h-4 mx-auto mb-1 text-muted-foreground" />
                            <p className="text-lg font-semibold">{formatNumber(competitorAnalysis.engagementStats.avgLikes)}</p>
                            <p className="text-xs text-muted-foreground">Avg Likes</p>
                          </div>
                          <div className="text-center p-3 bg-muted/50 rounded-md">
                            <BarChart3 className="w-4 h-4 mx-auto mb-1 text-muted-foreground" />
                            <p className="text-lg font-semibold">{competitorAnalysis.postsAnalyzed}</p>
                            <p className="text-xs text-muted-foreground">Analyzed</p>
                          </div>
                        </div>

                        {competitorAnalysis.topHooks.length > 0 && (
                          <div className="space-y-2">
                            <p className="text-sm font-medium flex items-center gap-2">
                              <Quote className="w-4 h-4" />
                              Top Performing Hooks
                            </p>
                            {competitorAnalysis.topHooks.slice(0, 5).map((hook, idx) => (
                              <div key={idx} className="flex items-start gap-2">
                                <Checkbox
                                  id={`hook-${idx}`}
                                  checked={selectedInsights.includes(hook)}
                                  onCheckedChange={() => toggleInsight(hook)}
                                />
                                <label
                                  htmlFor={`hook-${idx}`}
                                  className="text-sm text-muted-foreground cursor-pointer"
                                >
                                  "{hook.length > 80 ? hook.substring(0, 80) + "..." : hook}"
                                </label>
                              </div>
                            ))}
                          </div>
                        )}

                        {competitorAnalysis.commonPatterns.length > 0 && (
                          <div className="space-y-2">
                            <p className="text-sm font-medium">Common Patterns</p>
                            <div className="flex flex-wrap gap-2">
                              {competitorAnalysis.commonPatterns.slice(0, 8).map((pattern, idx) => (
                                <Badge
                                  key={idx}
                                  variant="secondary"
                                  className="cursor-pointer"
                                  onClick={() => toggleInsight(pattern)}
                                >
                                  {selectedInsights.includes(pattern) && <Check className="w-3 h-3 mr-1" />}
                                  {pattern}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}

                        {competitorAnalysis.provenAngles.length > 0 && (
                          <div className="space-y-2">
                            <p className="text-sm font-medium">Proven Angles</p>
                            {competitorAnalysis.provenAngles.slice(0, 4).map((angle, idx) => (
                              <div key={idx} className="flex items-start gap-2">
                                <Checkbox
                                  id={`angle-${idx}`}
                                  checked={selectedInsights.includes(angle)}
                                  onCheckedChange={() => toggleInsight(angle)}
                                />
                                <label htmlFor={`angle-${idx}`} className="text-sm text-muted-foreground">{angle}</label>
                              </div>
                            ))}
                          </div>
                        )}

                        {competitorAnalysis.contentSummary && (
                          <div className="pt-4 border-t">
                            <p className="text-sm font-medium mb-2">Content Summary</p>
                            <p className="text-sm text-muted-foreground">{competitorAnalysis.contentSummary}</p>
                          </div>
                        )}
                      </div>
                    </ScrollArea>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-8 gap-3">
                      <TrendingUp className="w-8 h-8 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">No competitor data yet</p>
                      <Button
                        size="sm"
                        onClick={() => competitorMutation.mutate()}
                        data-testid="button-start-competitor-analysis"
                      >
                        Analyze Competitors
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {selectedInsights.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-500" />
                  Selected Insights ({selectedInsights.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {selectedInsights.map((insight, idx) => (
                    <Badge
                      key={idx}
                      variant="default"
                      className="cursor-pointer"
                      onClick={() => toggleInsight(insight)}
                    >
                      {insight.length > 40 ? insight.substring(0, 40) + "..." : insight}
                      <span className="ml-1 opacity-60">x</span>
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Generate Script button at the bottom */}
      <div className="flex justify-end pt-4 border-t border-border">
        <Button
          onClick={handleContinue}
          disabled={isLoading}
          size="lg"
          data-testid="button-generate-script"
        >
          <Sparkles className="w-4 h-4 mr-2" />
          Generate Script
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  );
}
