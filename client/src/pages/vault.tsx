import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Header } from "@/components/header";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { VaultItem } from "@shared/schema";
import { Archive, Trash2, FileText, Calendar } from "lucide-react";

export default function Vault() {
  const { toast } = useToast();

  const { data: vaultItems, isLoading } = useQuery<VaultItem[]>({
    queryKey: ["/api/vault"],
  });

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
                className="p-4 bg-card border-card-border hover-elevate"
                data-testid={`card-vault-item-${item.id}`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-muted-foreground" />
                    <h3 className="font-medium text-sm line-clamp-1" data-testid={`text-vault-name-${item.id}`}>
                      {item.name}
                    </h3>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => deleteMutation.mutate(item.id)}
                    disabled={deleteMutation.isPending}
                    data-testid={`button-delete-${item.id}`}
                  >
                    <Trash2 className="w-4 h-4 text-muted-foreground" />
                  </Button>
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
    </div>
  );
}
