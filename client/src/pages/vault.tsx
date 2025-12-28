import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Header } from "@/components/header";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { VaultItem, Script } from "@shared/schema";
import { Archive, Trash2, FileText, Calendar, Copy, Loader2, Eye } from "lucide-react";

export default function Vault() {
  const { toast } = useToast();
  const [selectedItem, setSelectedItem] = useState<VaultItem | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const { data: vaultItems, isLoading } = useQuery<VaultItem[]>({
    queryKey: ["/api/vault"],
  });

  const { data: scriptData, isLoading: isLoadingScript } = useQuery<Script>({
    queryKey: ["/api/scripts", selectedItem?.scriptId],
    enabled: !!selectedItem?.scriptId,
  });

  const openScript = (item: VaultItem) => {
    setSelectedItem(item);
    setIsDialogOpen(true);
  };

  const copyToClipboard = async () => {
    if (scriptData?.script) {
      await navigator.clipboard.writeText(scriptData.script);
      toast({ title: "Copied!", description: "Script copied to clipboard." });
    }
  };

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/vault/${id}`);
    },
    onSuccess: () => {
      toast({
        title: "Removed",
        description: "Script removed from vault.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/vault"] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to remove from vault.",
        variant: "destructive",
      });
    },
  });

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
            <Archive className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold" data-testid="text-vault-title">Script Vault</h1>
            <p className="text-sm text-muted-foreground">Your saved scripts for future reference</p>
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i} className="p-4 bg-card border-card-border animate-pulse">
                <div className="h-4 bg-muted rounded w-3/4 mb-3" />
                <div className="h-3 bg-muted rounded w-1/2 mb-4" />
                <div className="h-20 bg-muted rounded" />
              </Card>
            ))}
          </div>
        ) : vaultItems && vaultItems.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {vaultItems.map((item) => (
              <Card 
                key={item.id} 
                className="p-4 bg-card border-card-border hover-elevate cursor-pointer"
                onClick={() => openScript(item)}
                data-testid={`card-vault-item-${item.id}`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-muted-foreground" />
                    <h3 className="font-medium text-sm line-clamp-1" data-testid={`text-vault-name-${item.id}`}>
                      {item.name}
                    </h3>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={(e) => {
                        e.stopPropagation();
                        openScript(item);
                      }}
                      data-testid={`button-view-${item.id}`}
                    >
                      <Eye className="w-4 h-4 text-muted-foreground" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteMutation.mutate(item.id);
                      }}
                      disabled={deleteMutation.isPending}
                      data-testid={`button-delete-${item.id}`}
                    >
                      <Trash2 className="w-4 h-4 text-muted-foreground" />
                    </Button>
                  </div>
                </div>
                
                <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
                  <Calendar className="w-3 h-3" />
                  <span data-testid={`text-vault-date-${item.id}`}>
                    {item.createdAt ? new Date(item.createdAt).toLocaleDateString() : "Unknown date"}
                  </span>
                </div>
                
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="text-xs">
                    Saved
                  </Badge>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="p-12 bg-card border-card-border text-center">
            <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-4">
              <Archive className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium mb-2" data-testid="text-empty-title">No saved scripts</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Scripts you save will appear here for future reference.
            </p>
            <Button variant="outline" asChild>
              <a href="/" data-testid="button-create-first">Create your first script</a>
            </Button>
          </Card>
        )}
      </main>

      {/* Script View Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[85vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              {selectedItem?.name || "Script"}
            </DialogTitle>
            <DialogDescription>
              Saved on {selectedItem?.createdAt ? new Date(selectedItem.createdAt).toLocaleDateString() : "Unknown date"}
            </DialogDescription>
          </DialogHeader>
          
          {isLoadingScript ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : scriptData ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant="secondary">{scriptData.wordCount} words</Badge>
                  <Badge variant="outline">Grade {scriptData.gradeLevel}</Badge>
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={copyToClipboard}
                  data-testid="button-copy-script"
                >
                  <Copy className="w-4 h-4 mr-2" />
                  Copy Script
                </Button>
              </div>
              
              <ScrollArea className="h-[400px] rounded-md border p-4">
                <div className="whitespace-pre-wrap text-sm leading-relaxed" data-testid="text-script-content">
                  {scriptData.script}
                </div>
              </ScrollArea>
              
              {scriptData.productionNotes && (
                <div className="space-y-2">
                  <h4 className="font-medium text-sm">Production Notes</h4>
                  <p className="text-sm text-muted-foreground">{scriptData.productionNotes}</p>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              Script not found. It may have been deleted.
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
