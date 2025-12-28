import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, FileText, Trash2, Edit2, User, Target, MessageSquare, Mic, Box, Layers, BookOpen, FileQuestion, Loader2, LogIn } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { isUnauthorizedError } from "@/lib/auth-utils";

const knowledgeBaseTypes = [
  { id: "icp", name: "Ideal Customer Profile", icon: User, description: "Define your target audience demographics, psychographics, and pain points" },
  { id: "brand_positioning", name: "Brand Positioning", icon: Target, description: "Your unique value proposition and market positioning" },
  { id: "messaging_house", name: "Messaging House", icon: MessageSquare, description: "Core messaging pillars and key talking points" },
  { id: "voice_dna", name: "Voice DNA", icon: Mic, description: "Your unique speaking style, tone, and personality" },
  { id: "rule_of_one", name: "Rule of One", icon: Box, description: "One avatar, one problem, one solution framework" },
  { id: "business_box", name: "Business Box", icon: Layers, description: "Business context, offers, and market position" },
  { id: "content_strategy", name: "Content Strategy", icon: BookOpen, description: "Content pillars, themes, and posting strategy" },
  { id: "custom", name: "Custom Document", icon: FileQuestion, description: "Any other brand or strategy documentation" },
];

interface KnowledgeBaseDoc {
  id: string;
  type: string;
  title: string;
  content: string;
  summary?: string | null;
  tags?: string | null;
  createdAt: string;
  updatedAt: string;
}

export default function KnowledgeBase() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingDoc, setEditingDoc] = useState<KnowledgeBaseDoc | null>(null);
  const [formData, setFormData] = useState({
    type: "icp",
    title: "",
    content: "",
    summary: "",
    tags: "",
  });
  const { toast } = useToast();
  const { user, isLoading: authLoading, isAuthenticated } = useAuth();

  const { data: docs = [], isLoading } = useQuery<KnowledgeBaseDoc[]>({
    queryKey: ["/api/knowledge-base"],
    enabled: isAuthenticated, // Only fetch if authenticated
  });

  // Show login prompt if not authenticated
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
              <BookOpen className="w-8 h-8 text-primary" />
            </div>
            <CardTitle className="text-2xl">Knowledge Base</CardTitle>
            <CardDescription className="text-base mt-2">
              Store your brand documents, ICP profiles, and voice guidelines to generate personalized scripts that match your unique voice.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-6">
              Sign in to create and manage your personal Knowledge Base. Your documents will be used by the AI to generate scripts tailored specifically to your brand.
            </p>
            <Button 
              onClick={() => window.location.href = "/api/login"}
              className="gap-2"
              data-testid="button-login-knowledge-base"
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
      const res = await apiRequest("POST", "/api/knowledge-base", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/knowledge-base"] });
      setIsDialogOpen(false);
      resetForm();
      toast({ title: "Document saved", description: "Your knowledge base has been updated." });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to save document.", variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: typeof formData }) => {
      const res = await apiRequest("PATCH", `/api/knowledge-base/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/knowledge-base"] });
      setIsDialogOpen(false);
      setEditingDoc(null);
      resetForm();
      toast({ title: "Document updated" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update document.", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("DELETE", `/api/knowledge-base/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/knowledge-base"] });
      toast({ title: "Document deleted" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to delete document.", variant: "destructive" });
    },
  });

  const resetForm = () => {
    setFormData({ type: "icp", title: "", content: "", summary: "", tags: "" });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingDoc) {
      updateMutation.mutate({ id: editingDoc.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const openEditDialog = (doc: KnowledgeBaseDoc) => {
    setEditingDoc(doc);
    setFormData({
      type: doc.type,
      title: doc.title,
      content: doc.content,
      summary: doc.summary || "",
      tags: doc.tags || "",
    });
    setIsDialogOpen(true);
  };

  const openNewDialog = (type?: string) => {
    setEditingDoc(null);
    resetForm();
    if (type) {
      setFormData((prev) => ({ ...prev, type }));
    }
    setIsDialogOpen(true);
  };

  const getDocsByType = (type: string) => docs.filter((d) => d.type === type);

  const getTypeInfo = (typeId: string) => knowledgeBaseTypes.find((t) => t.id === typeId);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="min-h-full p-6 bg-background">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold" data-testid="text-kb-title">Knowledge Base</h1>
            <p className="text-muted-foreground mt-1">
              Store your brand documents so AI generates scripts that sound like you
            </p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => openNewDialog()} data-testid="button-add-document">
                <Plus className="h-4 w-4 mr-2" />
                Add Document
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingDoc ? "Edit Document" : "Add New Document"}</DialogTitle>
                <DialogDescription>
                  {editingDoc ? "Update your knowledge base document" : "Add a new document to your knowledge base"}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="type">Document Type</Label>
                  <Select
                    value={formData.type}
                    onValueChange={(value) => setFormData((prev) => ({ ...prev, type: value }))}
                    disabled={!!editingDoc}
                  >
                    <SelectTrigger data-testid="select-doc-type">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      {knowledgeBaseTypes.map((type) => (
                        <SelectItem key={type.id} value={type.id}>
                          {type.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
                    placeholder="e.g., Primary ICP Profile"
                    data-testid="input-doc-title"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="content">Content</Label>
                  <Textarea
                    id="content"
                    value={formData.content}
                    onChange={(e) => setFormData((prev) => ({ ...prev, content: e.target.value }))}
                    placeholder="Paste your document content here..."
                    className="min-h-[300px]"
                    data-testid="input-doc-content"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="summary">Summary (optional)</Label>
                  <Input
                    id="summary"
                    value={formData.summary}
                    onChange={(e) => setFormData((prev) => ({ ...prev, summary: e.target.value }))}
                    placeholder="Brief summary of the document"
                    data-testid="input-doc-summary"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tags">Tags (optional)</Label>
                  <Input
                    id="tags"
                    value={formData.tags}
                    onChange={(e) => setFormData((prev) => ({ ...prev, tags: e.target.value }))}
                    placeholder="e.g., primary, b2b, saas"
                    data-testid="input-doc-tags"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsDialogOpen(false)}
                    data-testid="button-cancel"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={createMutation.isPending || updateMutation.isPending}
                    data-testid="button-save-document"
                  >
                    {(createMutation.isPending || updateMutation.isPending) && (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    )}
                    {editingDoc ? "Update" : "Save"} Document
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <Tabs defaultValue="all" className="space-y-6">
          <TabsList className="flex flex-wrap gap-1">
            <TabsTrigger value="all" data-testid="tab-all">All ({docs.length})</TabsTrigger>
            {knowledgeBaseTypes.map((type) => {
              const count = getDocsByType(type.id).length;
              if (count === 0) return null;
              return (
                <TabsTrigger key={type.id} value={type.id} data-testid={`tab-${type.id}`}>
                  {type.name} ({count})
                </TabsTrigger>
              );
            })}
          </TabsList>

          <TabsContent value="all" className="space-y-6">
            {docs.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No documents yet</h3>
                  <p className="text-muted-foreground text-center max-w-md mb-4">
                    Add your brand documents to help AI generate scripts that match your unique voice and style.
                  </p>
                  <Button onClick={() => openNewDialog()} data-testid="button-add-first">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Your First Document
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {docs.map((doc) => {
                  const typeInfo = getTypeInfo(doc.type);
                  const Icon = typeInfo?.icon || FileText;
                  return (
                    <Card key={doc.id} data-testid={`card-doc-${doc.id}`}>
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-start gap-3">
                            <div className="p-2 rounded-md bg-muted">
                              <Icon className="h-4 w-4" />
                            </div>
                            <div>
                              <CardTitle className="text-base" data-testid={`text-doc-title-${doc.id}`}>
                                {doc.title}
                              </CardTitle>
                              <CardDescription>
                                <Badge variant="secondary" className="mt-1">
                                  {typeInfo?.name || doc.type}
                                </Badge>
                              </CardDescription>
                            </div>
                          </div>
                          <div className="flex gap-1">
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => openEditDialog(doc)}
                              data-testid={`button-edit-${doc.id}`}
                            >
                              <Edit2 className="h-4 w-4" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => deleteMutation.mutate(doc.id)}
                              data-testid={`button-delete-${doc.id}`}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground line-clamp-3">
                          {doc.summary || doc.content.substring(0, 200)}...
                        </p>
                        {doc.tags && (
                          <div className="flex flex-wrap gap-1 mt-3">
                            {doc.tags.split(",").map((tag, idx) => (
                              <Badge key={idx} variant="outline" className="text-xs">
                                {tag.trim()}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>

          {knowledgeBaseTypes.map((type) => (
            <TabsContent key={type.id} value={type.id} className="space-y-4">
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <type.icon className="h-5 w-5" />
                    {type.name}
                  </CardTitle>
                  <CardDescription>{type.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button onClick={() => openNewDialog(type.id)} variant="outline" size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Add {type.name}
                  </Button>
                </CardContent>
              </Card>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {getDocsByType(type.id).map((doc) => (
                  <Card key={doc.id}>
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between gap-3">
                        <CardTitle className="text-base">{doc.title}</CardTitle>
                        <div className="flex gap-1">
                          <Button size="icon" variant="ghost" onClick={() => openEditDialog(doc)}>
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button size="icon" variant="ghost" onClick={() => deleteMutation.mutate(doc.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground line-clamp-3">
                        {doc.summary || doc.content.substring(0, 200)}...
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </div>
  );
}
