import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Header } from "@/components/header";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import type { Project } from "@shared/schema";
import { FolderOpen, Plus, Trash2, Calendar, FileText } from "lucide-react";

export default function Projects() {
  const { toast } = useToast();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newProject, setNewProject] = useState({ name: "", description: "" });

  const { data: projects, isLoading } = useQuery<Project[]>({
    queryKey: ["/api/projects"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: { name: string; description: string }) => {
      const res = await apiRequest("POST", "/api/projects", data);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Project Created",
        description: "Your new project is ready.",
      });
      setIsCreateOpen(false);
      setNewProject({ name: "", description: "" });
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create project.",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/projects/${id}`);
    },
    onSuccess: () => {
      toast({
        title: "Deleted",
        description: "Project has been deleted.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete project.",
        variant: "destructive",
      });
    },
  });

  const handleCreate = () => {
    if (!newProject.name.trim()) {
      toast({
        title: "Name Required",
        description: "Please enter a project name.",
        variant: "destructive",
      });
      return;
    }
    createMutation.mutate(newProject);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
              <FolderOpen className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold" data-testid="text-projects-title">Projects</h1>
              <p className="text-sm text-muted-foreground">Organize your video scripts</p>
            </div>
          </div>

          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button data-testid="button-new-project">
                <Plus className="w-4 h-4 mr-2" />
                New Project
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Project</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div>
                  <Label htmlFor="project-name" className="text-sm font-medium mb-2 block">
                    Project Name
                  </Label>
                  <Input
                    id="project-name"
                    placeholder="e.g. Q1 Marketing Campaign"
                    value={newProject.name}
                    onChange={(e) => setNewProject((prev) => ({ ...prev, name: e.target.value }))}
                    data-testid="input-project-name"
                  />
                </div>
                <div>
                  <Label htmlFor="project-desc" className="text-sm font-medium mb-2 block">
                    Description (optional)
                  </Label>
                  <Textarea
                    id="project-desc"
                    placeholder="Describe what this project is about..."
                    value={newProject.description}
                    onChange={(e) => setNewProject((prev) => ({ ...prev, description: e.target.value }))}
                    className="resize-none"
                    data-testid="input-project-description"
                  />
                </div>
                <Button
                  onClick={handleCreate}
                  disabled={createMutation.isPending}
                  className="w-full"
                  data-testid="button-create-project"
                >
                  {createMutation.isPending ? "Creating..." : "Create Project"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="p-4 bg-card border-card-border animate-pulse">
                <div className="h-5 bg-muted rounded w-3/4 mb-3" />
                <div className="h-3 bg-muted rounded w-1/2 mb-4" />
                <div className="h-4 bg-muted rounded w-1/4" />
              </Card>
            ))}
          </div>
        ) : projects && projects.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {projects.map((project) => (
              <Card
                key={project.id}
                className="p-4 bg-card border-card-border hover-elevate cursor-pointer"
                data-testid={`card-project-${project.id}`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <FolderOpen className="w-4 h-4 text-primary" />
                    <h3 className="font-medium line-clamp-1" data-testid={`text-project-name-${project.id}`}>
                      {project.name}
                    </h3>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteMutation.mutate(project.id);
                    }}
                    disabled={deleteMutation.isPending}
                    data-testid={`button-delete-project-${project.id}`}
                  >
                    <Trash2 className="w-4 h-4 text-muted-foreground" />
                  </Button>
                </div>

                {project.description && (
                  <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                    {project.description}
                  </p>
                )}

                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    <span>
                      {project.createdAt ? new Date(project.createdAt).toLocaleDateString() : "Unknown"}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <FileText className="w-3 h-3" />
                    <span>0 scripts</span>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="p-12 bg-card border-card-border text-center">
            <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-4">
              <FolderOpen className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium mb-2" data-testid="text-empty-projects">No projects yet</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Create your first project to organize your video scripts.
            </p>
            <Button onClick={() => setIsCreateOpen(true)} data-testid="button-create-first-project">
              <Plus className="w-4 h-4 mr-2" />
              Create Project
            </Button>
          </Card>
        )}
      </main>
    </div>
  );
}
