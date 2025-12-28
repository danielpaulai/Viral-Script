import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { FileText, Plus, Eye, Copy, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Script {
  id: string;
  title: string;
  script: string;
  wordCount: string;
  gradeLevel: string;
  status: string;
  createdAt: string;
}

export default function Scripts() {
  const { toast } = useToast();
  
  const { data: scripts = [], isLoading } = useQuery<Script[]>({
    queryKey: ["/api/scripts"],
  });

  const handleCopy = async (script: string) => {
    await navigator.clipboard.writeText(script);
    toast({
      title: "Copied",
      description: "Script copied to clipboard.",
    });
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white mb-2" data-testid="text-page-title">Scripts</h1>
          <p className="text-muted-foreground">All your generated scripts in one place</p>
        </div>
        <Link href="/">
          <Button data-testid="button-new-script">
            <Plus className="w-4 h-4 mr-2" />
            New Script
          </Button>
        </Link>
      </div>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="p-6 glass-card animate-pulse">
              <div className="h-4 bg-white/10 rounded mb-4 w-3/4" />
              <div className="h-20 bg-white/5 rounded mb-4" />
              <div className="h-4 bg-white/10 rounded w-1/2" />
            </Card>
          ))}
        </div>
      ) : scripts.length === 0 ? (
        <Card className="p-12 glass-card text-center">
          <FileText className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-medium text-white mb-2">No scripts yet</h3>
          <p className="text-muted-foreground mb-6">
            Create your first viral video script to get started
          </p>
          <Link href="/">
            <Button data-testid="button-create-first">
              <Plus className="w-4 h-4 mr-2" />
              Create Script
            </Button>
          </Link>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {scripts.map((script) => (
            <Card key={script.id} className="p-4 glass-card hover-elevate" data-testid={`card-script-${script.id}`}>
              <div className="flex items-start justify-between mb-3">
                <h3 className="font-medium text-white line-clamp-1">{script.title}</h3>
                <Badge variant="outline" className="text-xs">
                  {script.status}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground line-clamp-3 mb-4 font-mono">
                {script.script.slice(0, 150)}...
              </p>
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>{script.wordCount} words</span>
                <span>Grade {script.gradeLevel}</span>
              </div>
              <div className="flex items-center gap-2 mt-4 pt-4 border-t border-white/10">
                <Button variant="ghost" size="sm" className="flex-1" onClick={() => handleCopy(script.script)}>
                  <Copy className="w-3 h-3 mr-1" />
                  Copy
                </Button>
                <Button variant="ghost" size="sm" className="flex-1">
                  <Eye className="w-3 h-3 mr-1" />
                  View
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
