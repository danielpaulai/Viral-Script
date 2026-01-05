import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Plus, FileText, Trash2, Edit2, Loader2, LogIn, ChevronDown, Layout, Clock, Mic, BookOpen, Wand2, Play } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import {
  scriptCategories,
  viralHooks,
  hookCategories,
  structureFormats,
  toneOptions,
  voiceOptions,
  pacingOptions,
  videoTypes,
  creatorStyles,
  durationOptions,
} from "@shared/schema";

interface ScriptTemplate {
  id: string;
  userId: string;
  name: string;
  description: string | null;
  platform: string;
  duration: string;
  category: string;
  structure: string;
  hook: string;
  tone: string | null;
  voice: string | null;
  pacing: string | null;
  videoType: string | null;
  creatorStyle: string | null;
  defaultTargetAudience: string | null;
  defaultCta: string | null;
  isPublic: string | null;
  usageCount: string | null;
  createdAt: string;
  updatedAt: string;
}

const platformOptions = [
  { id: "tiktok", name: "TikTok" },
  { id: "instagram", name: "Instagram Reels" },
  { id: "youtube_shorts", name: "YouTube Shorts" },
  { id: "youtube_long", name: "YouTube Long-form" },
  { id: "linkedin", name: "LinkedIn" },
  { id: "twitter", name: "Twitter/X" },
];

export default function Templates() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<ScriptTemplate | null>(null);
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    platform: "tiktok",
    duration: "90",
    category: "content_creation",
    structure: "problem_solver",
    hook: "painful_past",
    tone: "",
    voice: "",
    pacing: "",
    videoType: "talking_head",
    creatorStyle: "default",
    defaultTargetAudience: "",
    defaultCta: "",
  });
  
  const { toast } = useToast();
  const { user, isLoading: authLoading } = useAuth();
  const [, setLocation] = useLocation();
  const isAuthenticated = !!user;

  const { data: templates = [], isLoading } = useQuery<ScriptTemplate[]>({
    queryKey: ["/api/templates"],
    enabled: isAuthenticated,
  });

  if (authLoading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <div className="flex items-center gap-3">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span className="text-muted-foreground">Loading...</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="p-6 max-w-2xl mx-auto">
        <Card className="text-center p-8">
          <CardHeader>
            <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <Layout className="w-8 h-8 text-primary" />
            </div>
            <CardTitle className="text-2xl">Script Templates</CardTitle>
            <CardDescription className="text-base mt-2">
              Create and save custom templates with your preferred settings for faster script generation.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-6">
              Sign in to create custom templates with your preferred hook styles, structures, tones, and more.
            </p>
            <Button 
              onClick={() => window.location.href = "/login"}
              className="gap-2"
              data-testid="button-login-templates"
            >
              <LogIn className="w-4 h-4" />
              Sign In to Get Started
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const res = await apiRequest("POST", "/api/templates", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/templates"] });
      setIsDialogOpen(false);
      resetForm();
      toast({ title: "Template created", description: "Your template is ready to use." });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to create template.", variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: typeof formData }) => {
      const res = await apiRequest("PATCH", `/api/templates/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/templates"] });
      setIsDialogOpen(false);
      setEditingTemplate(null);
      resetForm();
      toast({ title: "Template updated" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update template.", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("DELETE", `/api/templates/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/templates"] });
      toast({ title: "Template deleted" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to delete template.", variant: "destructive" });
    },
  });

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      platform: "tiktok",
      duration: "90",
      category: "content_creation",
      structure: "problem_solver",
      hook: "painful_past",
      tone: "",
      voice: "",
      pacing: "",
      videoType: "talking_head",
      creatorStyle: "default",
      defaultTargetAudience: "",
      defaultCta: "",
    });
    setAdvancedOpen(false);
  };

  const handleEdit = (template: ScriptTemplate) => {
    setEditingTemplate(template);
    setFormData({
      name: template.name,
      description: template.description || "",
      platform: template.platform,
      duration: template.duration,
      category: template.category,
      structure: template.structure,
      hook: template.hook,
      tone: template.tone || "",
      voice: template.voice || "",
      pacing: template.pacing || "",
      videoType: template.videoType || "talking_head",
      creatorStyle: template.creatorStyle || "default",
      defaultTargetAudience: template.defaultTargetAudience || "",
      defaultCta: template.defaultCta || "",
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = () => {
    if (!formData.name.trim()) {
      toast({ title: "Error", description: "Template name is required.", variant: "destructive" });
      return;
    }
    
    if (editingTemplate) {
      updateMutation.mutate({ id: editingTemplate.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleUseTemplate = async (template: ScriptTemplate) => {
    try {
      await apiRequest("POST", `/api/templates/${template.id}/use`);
      queryClient.invalidateQueries({ queryKey: ["/api/templates"] });
    } catch (e) {
      // Silent fail for usage tracking
    }
    
    // Navigate to home with template data in sessionStorage
    const templateSettings = {
      platform: template.platform,
      duration: template.duration,
      category: template.category,
      structure: template.structure,
      hook: template.hook,
      tone: template.tone,
      voice: template.voice,
      pacing: template.pacing,
      videoType: template.videoType,
      creatorStyle: template.creatorStyle,
      targetAudience: template.defaultTargetAudience,
      callToAction: template.defaultCta,
    };
    sessionStorage.setItem("templateSettings", JSON.stringify(templateSettings));
    setLocation("/");
    toast({ 
      title: "Template loaded", 
      description: `${template.name} settings applied. Enter your topic to generate.` 
    });
  };

  const getCategoryName = (id: string) => scriptCategories.find(c => c.id === id)?.name || id;
  const getHookName = (id: string) => viralHooks.find(h => h.id === id)?.name || id;
  const getStructureName = (id: string) => structureFormats.find(s => s.id === id)?.name || id;
  const getPlatformName = (id: string) => platformOptions.find(p => p.id === id)?.name || id;
  const getDurationLabel = (id: string) => durationOptions.find(d => d.id === id)?.name || `${id}s`;

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground" data-testid="text-templates-title">Script Templates</h1>
          <p className="text-muted-foreground mt-1">Create reusable templates with your preferred settings</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) {
            setEditingTemplate(null);
            resetForm();
          }
        }}>
          <DialogTrigger asChild>
            <Button data-testid="button-create-template">
              <Plus className="w-4 h-4 mr-2" />
              Create Template
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
            <DialogHeader>
              <DialogTitle>{editingTemplate ? "Edit Template" : "Create Template"}</DialogTitle>
              <DialogDescription>
                {editingTemplate ? "Update your template settings" : "Design a custom template for faster script generation"}
              </DialogDescription>
            </DialogHeader>
            <ScrollArea className="flex-1 pr-4">
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Template Name</Label>
                  <Input
                    id="name"
                    placeholder="e.g., My Viral Hook Template"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    data-testid="input-template-name"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="description">Description (optional)</Label>
                  <Textarea
                    id="description"
                    placeholder="What is this template best for?"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="min-h-[60px]"
                    data-testid="input-template-description"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Platform</Label>
                    <Select value={formData.platform} onValueChange={(v) => setFormData({ ...formData, platform: v })}>
                      <SelectTrigger data-testid="select-platform">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {platformOptions.map((p) => (
                          <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Duration</Label>
                    <Select value={formData.duration} onValueChange={(v) => setFormData({ ...formData, duration: v })}>
                      <SelectTrigger data-testid="select-duration">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {durationOptions.map((d) => (
                          <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Category</Label>
                  <Select value={formData.category} onValueChange={(v) => setFormData({ ...formData, category: v })}>
                    <SelectTrigger data-testid="select-category">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {scriptCategories.map((c) => (
                        <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Hook Style</Label>
                  <Select value={formData.hook} onValueChange={(v) => setFormData({ ...formData, hook: v })}>
                    <SelectTrigger data-testid="select-hook">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {hookCategories.map((cat) => (
                        <div key={cat.id}>
                          <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground bg-muted/50">
                            {cat.name}
                          </div>
                          {viralHooks.filter(h => h.category === cat.id).map((h) => (
                            <SelectItem key={h.id} value={h.id}>{h.name}</SelectItem>
                          ))}
                        </div>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Structure</Label>
                  <Select value={formData.structure} onValueChange={(v) => setFormData({ ...formData, structure: v })}>
                    <SelectTrigger data-testid="select-structure">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {structureFormats.map((s) => (
                        <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <Collapsible open={advancedOpen} onOpenChange={setAdvancedOpen}>
                  <CollapsibleTrigger asChild>
                    <Button variant="ghost" className="w-full justify-between" data-testid="button-advanced-settings">
                      <span>Advanced Settings</span>
                      <ChevronDown className={`w-4 h-4 transition-transform ${advancedOpen ? "rotate-180" : ""}`} />
                    </Button>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="space-y-4 pt-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Tone</Label>
                        <Select value={formData.tone} onValueChange={(v) => setFormData({ ...formData, tone: v })}>
                          <SelectTrigger data-testid="select-tone">
                            <SelectValue placeholder="Select tone" />
                          </SelectTrigger>
                          <SelectContent>
                            {toneOptions.map((t) => (
                              <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="space-y-2">
                        <Label>Voice</Label>
                        <Select value={formData.voice} onValueChange={(v) => setFormData({ ...formData, voice: v })}>
                          <SelectTrigger data-testid="select-voice">
                            <SelectValue placeholder="Select voice" />
                          </SelectTrigger>
                          <SelectContent>
                            {voiceOptions.map((v) => (
                              <SelectItem key={v.id} value={v.id}>{v.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Pacing</Label>
                        <Select value={formData.pacing} onValueChange={(v) => setFormData({ ...formData, pacing: v })}>
                          <SelectTrigger data-testid="select-pacing">
                            <SelectValue placeholder="Select pacing" />
                          </SelectTrigger>
                          <SelectContent>
                            {pacingOptions.map((p) => (
                              <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="space-y-2">
                        <Label>Video Type</Label>
                        <Select value={formData.videoType} onValueChange={(v) => setFormData({ ...formData, videoType: v })}>
                          <SelectTrigger data-testid="select-video-type">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {videoTypes.map((v) => (
                              <SelectItem key={v.id} value={v.id}>{v.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Creator Style</Label>
                      <Select value={formData.creatorStyle} onValueChange={(v) => setFormData({ ...formData, creatorStyle: v })}>
                        <SelectTrigger data-testid="select-creator-style">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {creatorStyles.map((c) => (
                            <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="defaultAudience">Default Target Audience</Label>
                      <Textarea
                        id="defaultAudience"
                        placeholder="e.g., Content creators looking to grow their audience"
                        value={formData.defaultTargetAudience}
                        onChange={(e) => setFormData({ ...formData, defaultTargetAudience: e.target.value })}
                        className="min-h-[60px]"
                        data-testid="input-default-audience"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="defaultCta">Default Call to Action</Label>
                      <Input
                        id="defaultCta"
                        placeholder="e.g., Follow for more tips"
                        value={formData.defaultCta}
                        onChange={(e) => setFormData({ ...formData, defaultCta: e.target.value })}
                        data-testid="input-default-cta"
                      />
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              </div>
            </ScrollArea>
            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button variant="outline" onClick={() => setIsDialogOpen(false)} data-testid="button-cancel">
                Cancel
              </Button>
              <Button 
                onClick={handleSubmit} 
                disabled={createMutation.isPending || updateMutation.isPending}
                data-testid="button-save-template"
              >
                {(createMutation.isPending || updateMutation.isPending) && (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                )}
                {editingTemplate ? "Save Changes" : "Create Template"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : templates.length === 0 ? (
        <Card className="p-12 text-center">
          <div className="mx-auto w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
            <Layout className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold mb-2">No templates yet</h3>
          <p className="text-muted-foreground mb-6 max-w-md mx-auto">
            Create your first template to save your preferred hook styles, structures, and settings for quick script generation.
          </p>
          <Button onClick={() => setIsDialogOpen(true)} data-testid="button-create-first-template">
            <Plus className="w-4 h-4 mr-2" />
            Create Your First Template
          </Button>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {templates.map((template) => (
            <Card key={template.id} className="group relative overflow-visible" data-testid={`card-template-${template.id}`}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-base truncate">{template.name}</CardTitle>
                    {template.description && (
                      <CardDescription className="line-clamp-2 mt-1">{template.description}</CardDescription>
                    )}
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Button 
                      size="icon" 
                      variant="ghost"
                      onClick={() => handleEdit(template)}
                      data-testid={`button-edit-template-${template.id}`}
                    >
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button 
                      size="icon" 
                      variant="ghost"
                      onClick={() => deleteMutation.mutate(template.id)}
                      data-testid={`button-delete-template-${template.id}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex flex-wrap gap-1.5">
                  <Badge variant="secondary" className="text-xs">
                    {getPlatformName(template.platform)}
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    {getDurationLabel(template.duration)}
                  </Badge>
                </div>
                <div className="space-y-1.5 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Wand2 className="w-3.5 h-3.5" />
                    <span className="truncate">{getHookName(template.hook)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <FileText className="w-3.5 h-3.5" />
                    <span className="truncate">{getStructureName(template.structure)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <BookOpen className="w-3.5 h-3.5" />
                    <span className="truncate">{getCategoryName(template.category)}</span>
                  </div>
                </div>
                <div className="pt-2 flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">
                    Used {template.usageCount || "0"} times
                  </span>
                  <Button 
                    size="sm" 
                    onClick={() => handleUseTemplate(template)}
                    data-testid={`button-use-template-${template.id}`}
                  >
                    <Play className="w-3.5 h-3.5 mr-1.5" />
                    Use Template
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
