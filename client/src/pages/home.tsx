import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  scriptCategories,
  hookFormats,
  structureFormats,
  platformOptions,
  durationOptions,
  quickPresets,
  type ScriptParameters,
  type GeneratedScript,
} from "@shared/schema";
import { ScriptOutput } from "@/components/script-output";
import { Header } from "@/components/header";
import { 
  Sparkles, 
  ArrowRight, 
  Zap, 
  TrendingUp, 
  Cpu, 
  Heart,
  Search
} from "lucide-react";

const presetIcons: Record<string, typeof Zap> = {
  business_growth: TrendingUp,
  ai_tech: Cpu,
  viral_growth: Zap,
  personal_brand: Heart,
};

export default function Home() {
  const { toast } = useToast();
  const [generatedScript, setGeneratedScript] = useState<GeneratedScript | null>(null);
  const [activePreset, setActivePreset] = useState<string | null>(null);
  const [deepResearch, setDeepResearch] = useState(false);

  const [formData, setFormData] = useState<ScriptParameters>({
    topic: "",
    targetAudience: "",
    callToAction: "",
    keyFacts: "",
    platform: "tiktok",
    duration: "30",
    category: "content_creation",
    structure: "problem_solver",
    hook: "personal_experience",
    deepResearch: false,
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
      setFormData((prev) => ({
        ...prev,
        category: preset.category,
        hook: preset.hook,
        structure: preset.structure,
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
    generateMutation.mutate({ ...formData, deepResearch });
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="max-w-5xl mx-auto px-4 py-8">
        <section className="text-center mb-12">
          <Badge variant="outline" className="mb-4 border-primary/30 text-primary" data-testid="badge-system-status">
            <Sparkles className="w-3 h-3 mr-1" />
            SYSTEM V5.0 LIVE
          </Badge>
          
          <h1 className="text-4xl md:text-5xl font-bold mb-3" data-testid="text-hero-title">
            Video Script Writer
            <br />
            <span className="gradient-text">for Virality</span>
          </h1>
          
          <p className="text-muted-foreground max-w-xl mx-auto" data-testid="text-hero-description">
            Generate scroll-stopping short-form content in seconds. Built on data, psychology, and viral structures.
          </p>
        </section>

        <section className="mb-12">
          <Card className="p-6 bg-card border-card-border" data-testid="card-script-parameters">
            <div className="mb-6">
              <h2 className="text-lg font-semibold mb-1" data-testid="text-section-title">Script Parameters</h2>
              <p className="text-sm text-muted-foreground">Configure your viral inputs</p>
            </div>

            <div className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-primary" />
                  <span className="text-sm font-medium">QUICK PRESETS</span>
                </div>
                <Button 
                  variant="default" 
                  size="sm"
                  onClick={handleGenerate}
                  disabled={generateMutation.isPending}
                  data-testid="button-get-ideas"
                >
                  Get Ideas
                </Button>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {quickPresets.map((preset) => {
                  const Icon = presetIcons[preset.id] || Zap;
                  return (
                    <button
                      key={preset.id}
                      onClick={() => handlePresetClick(preset.id)}
                      className={`p-3 rounded-md text-left transition-all hover-elevate active-elevate-2 ${
                        activePreset === preset.id
                          ? "bg-primary/20 border border-primary/50"
                          : "bg-muted/50 border border-transparent"
                      }`}
                      data-testid={`button-preset-${preset.id}`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <Icon className="w-4 h-4 text-primary" />
                        <span className="font-medium text-sm">{preset.name}</span>
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {preset.description}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="topic" className="text-sm font-medium mb-2 block">
                    TOPIC / VIDEO IDEAS <span className="text-primary">*</span>
                  </Label>
                  <Textarea
                    id="topic"
                    placeholder="Describe your video idea, key points, or paste a rough outline..."
                    value={formData.topic}
                    onChange={(e) => setFormData((prev) => ({ ...prev, topic: e.target.value }))}
                    className="min-h-24 bg-muted/30 border-muted resize-none"
                    data-testid="input-topic"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="audience" className="text-sm font-medium mb-2 block">
                    TARGET AUDIENCE
                  </Label>
                  <Input
                    id="audience"
                    placeholder="e.g. Solopreneurs"
                    value={formData.targetAudience}
                    onChange={(e) => setFormData((prev) => ({ ...prev, targetAudience: e.target.value }))}
                    className="bg-muted/30 border-muted"
                    data-testid="input-audience"
                  />
                </div>

                <div>
                  <Label htmlFor="cta" className="text-sm font-medium mb-2 block">
                    CALL TO ACTION (OPT)
                  </Label>
                  <Select
                    value={formData.callToAction}
                    onValueChange={(value) => setFormData((prev) => ({ ...prev, callToAction: value }))}
                  >
                    <SelectTrigger className="bg-muted/30 border-muted" data-testid="select-cta">
                      <SelectValue placeholder="Write my own..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="write_own">Write my own...</SelectItem>
                      <SelectItem value="link_bio">Link in bio</SelectItem>
                      <SelectItem value="follow">Follow for more</SelectItem>
                      <SelectItem value="comment">Comment below</SelectItem>
                      <SelectItem value="share">Share this</SelectItem>
                      <SelectItem value="dm">DM me</SelectItem>
                    </SelectContent>
                  </Select>
                  {formData.callToAction === "write_own" && (
                    <Input
                      placeholder="e.g. Link in bio"
                      className="mt-2 bg-muted/30 border-muted"
                      onChange={(e) => setFormData((prev) => ({ ...prev, callToAction: e.target.value }))}
                      data-testid="input-custom-cta"
                    />
                  )}
                </div>
              </div>
            </div>

            <div className="mb-6">
              <Label htmlFor="facts" className="text-sm font-medium mb-2 block">
                KEY FACTS (OPTIONAL)
              </Label>
              <Input
                id="facts"
                placeholder='2-3 specific details to include (e.g. "Launched in 2020", "Revenue $1M", "Team of 5")'
                value={formData.keyFacts}
                onChange={(e) => setFormData((prev) => ({ ...prev, keyFacts: e.target.value }))}
                className="bg-muted/30 border-muted"
                data-testid="input-facts"
              />
            </div>

            <div className="grid grid-cols-2 md:grid-cols-2 gap-4 mb-6">
              <div>
                <Label className="text-sm font-medium mb-2 block">PLATFORM</Label>
                <Select
                  value={formData.platform}
                  onValueChange={(value) => setFormData((prev) => ({ ...prev, platform: value }))}
                >
                  <SelectTrigger className="bg-muted/30 border-muted" data-testid="select-platform">
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
                <Label className="text-sm font-medium mb-2 block">DURATION</Label>
                <Select
                  value={formData.duration}
                  onValueChange={(value) => setFormData((prev) => ({ ...prev, duration: value }))}
                >
                  <SelectTrigger className="bg-muted/30 border-muted" data-testid="select-duration">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {durationOptions.map((opt) => (
                      <SelectItem key={opt.id} value={opt.id}>
                        {opt.name} ({opt.wordCount})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div>
                <Label className="text-sm font-medium mb-2 block">SCRIPT CATEGORY</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => setFormData((prev) => ({ ...prev, category: value }))}
                >
                  <SelectTrigger className="bg-muted/30 border-muted" data-testid="select-category">
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
                <Label className="text-sm font-medium mb-2 block">STRUCTURE FORMAT</Label>
                <Select
                  value={formData.structure}
                  onValueChange={(value) => setFormData((prev) => ({ ...prev, structure: value }))}
                >
                  <SelectTrigger className="bg-muted/30 border-muted" data-testid="select-structure">
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

            <div className="mb-6">
              <Label className="text-sm font-medium mb-2 block">HOOK STRATEGY</Label>
              <Select
                value={formData.hook}
                onValueChange={(value) => setFormData((prev) => ({ ...prev, hook: value }))}
              >
                <SelectTrigger className="bg-muted/30 border-muted" data-testid="select-hook">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {hookFormats.map((hook) => (
                    <SelectItem key={hook.id} value={hook.id}>
                      {hook.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between p-4 rounded-md bg-muted/20 border border-muted mb-6">
              <div className="flex items-center gap-3">
                <Search className="w-5 h-5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Deep Research Mode</p>
                  <p className="text-xs text-muted-foreground">
                    AI will research your topic online before generating the script
                  </p>
                </div>
              </div>
              <Switch
                checked={deepResearch}
                onCheckedChange={setDeepResearch}
                data-testid="switch-deep-research"
              />
            </div>

            <Button
              onClick={handleGenerate}
              disabled={generateMutation.isPending}
              className="w-full h-12 text-base font-semibold glow-primary"
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
        </section>

        {generatedScript && (
          <ScriptOutput 
            script={generatedScript} 
            onRegenerate={handleGenerate}
            isRegenerating={generateMutation.isPending}
          />
        )}

        <footer className="text-center py-8 border-t border-border mt-12">
          <p className="text-sm text-muted-foreground mb-4">CONNECT WITH ME</p>
          <div className="flex items-center justify-center gap-4">
            <Button variant="ghost" size="icon" data-testid="button-social-linkedin">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
              </svg>
            </Button>
            <Button variant="ghost" size="icon" data-testid="button-social-instagram">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
              </svg>
            </Button>
            <Button variant="ghost" size="icon" data-testid="button-social-youtube">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
              </svg>
            </Button>
          </div>
        </footer>
      </main>
    </div>
  );
}
