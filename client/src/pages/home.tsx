import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  Video,
  FileText,
  Archive,
} from "lucide-react";
import { Link } from "wouter";

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
    hook: "painful_past",
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
    generateMutation.mutate({ ...formData, deepResearch });
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-8 text-center">
        <h1 className="text-2xl md:text-3xl font-bold text-white mb-2" data-testid="text-page-title">
          What do you want to create today?
        </h1>
        <p className="text-muted-foreground">
          Generate scroll-stopping short-form scripts in seconds
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-4 mb-8">
        <Link href="/scripts">
          <Card className="p-6 glass-card hover-elevate cursor-pointer text-center group">
            <FileText className="w-8 h-8 mx-auto mb-3 text-primary" />
            <h3 className="font-medium text-white mb-1">View Scripts</h3>
            <p className="text-xs text-muted-foreground">See all your generated scripts</p>
          </Card>
        </Link>
        <Card className="p-6 glass-card text-center border-primary/50 bg-primary/10">
          <Video className="w-8 h-8 mx-auto mb-3 text-primary" />
          <h3 className="font-medium text-white mb-1">Write Script</h3>
          <p className="text-xs text-muted-foreground">Using proven hooks and styles</p>
        </Card>
        <Link href="/vault">
          <Card className="p-6 glass-card hover-elevate cursor-pointer text-center group">
            <Archive className="w-8 h-8 mx-auto mb-3 text-muted-foreground group-hover:text-primary transition-colors" />
            <h3 className="font-medium text-white mb-1">Saved Scripts</h3>
            <p className="text-xs text-muted-foreground">Access your vault</p>
          </Card>
        </Link>
      </div>

      <Card className="p-6 glass-card rounded-md mb-8" data-testid="card-script-parameters">
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-1">
            <span className="h-px w-8 bg-primary" />
            <h2 className="text-xs font-semibold text-primary tracking-widest uppercase">Script Parameters</h2>
          </div>
          <p className="text-sm text-muted-foreground mt-2">Configure your viral inputs</p>
        </div>

        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium">QUICK PRESETS</span>
            </div>
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
                      : "bg-white/5 border border-white/10"
                  }`}
                  data-testid={`button-preset-${preset.id}`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <Icon className="w-4 h-4 text-primary" />
                    <span className="font-medium text-sm text-white">{preset.name}</span>
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {preset.description}
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        <div className="mb-6">
          <Label htmlFor="topic" className="text-xs font-medium mb-2 block uppercase tracking-wider">Topic / Video Idea</Label>
          <Input
            id="topic"
            value={formData.topic}
            onChange={(e) => setFormData((prev) => ({ ...prev, topic: e.target.value }))}
            placeholder="e.g., Why most people fail at content creation..."
            className="bg-white/5 border-white/10"
            data-testid="input-topic"
          />
        </div>

        <div className="grid md:grid-cols-2 gap-4 mb-6">
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
            <Label htmlFor="cta" className="text-xs font-medium mb-2 block uppercase tracking-wider">Call to Action</Label>
            <Input
              id="cta"
              value={formData.callToAction}
              onChange={(e) => setFormData((prev) => ({ ...prev, callToAction: e.target.value }))}
              placeholder="e.g., Follow for more tips..."
              className="bg-white/5 border-white/10"
              data-testid="input-cta"
            />
          </div>
        </div>

        <div className="mb-6">
          <Label htmlFor="facts" className="text-xs font-medium mb-2 block uppercase tracking-wider">Key Facts / Stats (Optional)</Label>
          <Textarea
            id="facts"
            value={formData.keyFacts}
            onChange={(e) => setFormData((prev) => ({ ...prev, keyFacts: e.target.value }))}
            placeholder="e.g., 10x growth, 50k followers, used by top creators..."
            className="bg-white/5 border-white/10 min-h-[80px]"
            data-testid="input-facts"
          />
        </div>

        <div className="grid md:grid-cols-4 gap-4 mb-6">
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
            <Label className="text-xs font-medium mb-2 block uppercase tracking-wider">Structure Format</Label>
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

        <div className="mb-6">
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
        </div>

        <div className="flex items-center justify-between p-4 rounded-md bg-white/5 border border-white/10 mb-6">
          <div className="flex items-center gap-3">
            <Search className="w-5 h-5 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium text-white">Deep Research Mode</p>
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
          className="w-full h-12 text-base font-semibold"
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
    </div>
  );
}
