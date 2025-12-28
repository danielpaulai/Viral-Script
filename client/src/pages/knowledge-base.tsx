import { useState, useRef, useCallback } from "react";
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
import { Progress } from "@/components/ui/progress";
import { Plus, FileText, Trash2, Edit2, User, Target, MessageSquare, Mic, Box, Layers, BookOpen, FileQuestion, Loader2, LogIn, Upload, X, CheckCircle2, AlertCircle, File } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { isUnauthorizedError } from "@/lib/auth-utils";

const MAX_FILES = 10;
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const SUPPORTED_EXTENSIONS = ['.pdf', '.png', '.jpg', '.jpeg', '.gif', '.webp', '.docx', '.txt'];

interface UploadResult {
  filename: string;
  success: boolean;
  docId?: string;
  error?: string;
  source?: string;
}

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
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadQueue, setUploadQueue] = useState<File[]>([]);
  const [uploadResults, setUploadResults] = useState<UploadResult[]>([]);
  const [showUploadPanel, setShowUploadPanel] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const { user, isLoading: authLoading } = useAuth();
  const isAuthenticated = !!user;

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
              onClick={() => window.location.href = "/login"}
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

  const uploadMutation = useMutation({
    mutationFn: async (files: File[]) => {
      const formData = new FormData();
      files.forEach((file) => formData.append('files', file));
      const res = await fetch('/api/knowledge-base/upload', {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Upload failed');
      }
      return res.json();
    },
    onSuccess: (data) => {
      setUploadResults(data.results);
      queryClient.invalidateQueries({ queryKey: ["/api/knowledge-base"] });
      const successCount = data.results.filter((r: UploadResult) => r.success).length;
      toast({ 
        title: "Upload complete", 
        description: data.message,
      });
    },
    onError: (error: Error) => {
      toast({ title: "Upload failed", description: error.message, variant: "destructive" });
    },
  });

  const validateFile = useCallback((file: File): string | null => {
    const ext = '.' + file.name.split('.').pop()?.toLowerCase();
    if (!SUPPORTED_EXTENSIONS.includes(ext)) {
      return `Unsupported file type: ${ext}`;
    }
    if (file.size > MAX_FILE_SIZE) {
      return `File too large: ${(file.size / 1024 / 1024).toFixed(1)}MB (max 10MB)`;
    }
    return null;
  }, []);

  const handleFileSelect = useCallback((files: FileList | null) => {
    if (!files) return;
    
    const fileArray = Array.from(files);
    const validFiles: File[] = [];
    const errors: string[] = [];
    
    for (const file of fileArray) {
      if (uploadQueue.length + validFiles.length >= MAX_FILES) {
        errors.push(`Maximum ${MAX_FILES} files allowed`);
        break;
      }
      const error = validateFile(file);
      if (error) {
        errors.push(`${file.name}: ${error}`);
      } else {
        validFiles.push(file);
      }
    }
    
    if (errors.length > 0) {
      toast({ 
        title: "Some files were skipped", 
        description: errors.slice(0, 3).join('\n'),
        variant: "destructive",
      });
    }
    
    if (validFiles.length > 0) {
      setUploadQueue((prev) => [...prev, ...validFiles]);
      setShowUploadPanel(true);
      setUploadResults([]);
    }
  }, [uploadQueue.length, validateFile, toast]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    handleFileSelect(e.dataTransfer.files);
  }, [handleFileSelect]);

  const removeFromQueue = useCallback((index: number) => {
    setUploadQueue((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const startUpload = useCallback(() => {
    if (uploadQueue.length === 0) return;
    uploadMutation.mutate(uploadQueue);
  }, [uploadQueue, uploadMutation]);

  const clearUploadPanel = useCallback(() => {
    setUploadQueue([]);
    setUploadResults([]);
    setShowUploadPanel(false);
  }, []);

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
        <div className="flex items-center justify-between gap-4 mb-8 flex-wrap">
          <div>
            <h1 className="text-3xl font-bold" data-testid="text-kb-title">Knowledge Base</h1>
            <p className="text-muted-foreground mt-1">
              Store your brand documents so AI generates scripts that sound like you
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              data-testid="button-upload-files"
            >
              <Upload className="h-4 w-4 mr-2" />
              Upload Files
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".pdf,.png,.jpg,.jpeg,.gif,.webp,.docx,.txt"
              onChange={(e) => handleFileSelect(e.target.files)}
              className="hidden"
              data-testid="input-file-upload"
            />
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
        </div>

        {/* Drag and Drop Zone */}
        <div
          className={`mb-6 border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            isDragOver 
              ? 'border-primary bg-primary/5' 
              : 'border-muted-foreground/25 hover:border-muted-foreground/50'
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          data-testid="dropzone-files"
        >
          <Upload className={`h-10 w-10 mx-auto mb-3 ${isDragOver ? 'text-primary' : 'text-muted-foreground'}`} />
          <p className="text-lg font-medium mb-1">
            {isDragOver ? 'Drop files here' : 'Drag and drop files here'}
          </p>
          <p className="text-sm text-muted-foreground mb-3">
            Supports PDF, DOCX, images (with OCR), and text files. Up to 10 files, 10MB each.
          </p>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            data-testid="button-browse-files"
          >
            Browse Files
          </Button>
        </div>

        {/* Upload Panel */}
        {showUploadPanel && (
          <Card className="mb-6" data-testid="card-upload-panel">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between gap-3">
                <CardTitle className="text-lg">
                  {uploadMutation.isPending ? 'Processing Files...' : 'Files to Upload'}
                </CardTitle>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={clearUploadPanel}
                  disabled={uploadMutation.isPending}
                  data-testid="button-close-upload"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {uploadMutation.isPending && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-sm text-muted-foreground">
                      Extracting text from files (this may take a moment for OCR)...
                    </span>
                  </div>
                  <Progress value={50} className="h-2" />
                </div>
              )}

              <div className="space-y-2">
                {uploadQueue.map((file, index) => {
                  const result = uploadResults.find((r) => r.filename === file.name);
                  return (
                    <div 
                      key={index} 
                      className="flex items-center justify-between gap-3 p-3 rounded-md bg-muted/50"
                      data-testid={`upload-item-${index}`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <File className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">{file.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {(file.size / 1024).toFixed(1)} KB
                            {result?.source && ` - via ${result.source}`}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {result ? (
                          result.success ? (
                            <CheckCircle2 className="h-5 w-5 text-green-500" />
                          ) : (
                            <div className="flex items-center gap-1 text-destructive">
                              <AlertCircle className="h-5 w-5" />
                              <span className="text-xs">{result.error}</span>
                            </div>
                          )
                        ) : !uploadMutation.isPending ? (
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => removeFromQueue(index)}
                            data-testid={`button-remove-${index}`}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        ) : null}
                      </div>
                    </div>
                  );
                })}
              </div>

              {!uploadMutation.isPending && uploadResults.length === 0 && uploadQueue.length > 0 && (
                <div className="flex justify-end gap-3">
                  <Button variant="outline" onClick={clearUploadPanel} data-testid="button-cancel-upload">
                    Cancel
                  </Button>
                  <Button onClick={startUpload} data-testid="button-start-upload">
                    <Upload className="h-4 w-4 mr-2" />
                    Extract & Upload ({uploadQueue.length} file{uploadQueue.length !== 1 ? 's' : ''})
                  </Button>
                </div>
              )}

              {uploadResults.length > 0 && (
                <div className="flex justify-end">
                  <Button onClick={clearUploadPanel} data-testid="button-done-upload">
                    Done
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        )}

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
