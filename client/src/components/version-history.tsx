import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { History, RotateCcw, Save, Clock, Tag, ChevronRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { formatDistanceToNow } from "date-fns";

interface ScriptVersion {
  id: string;
  scriptId: string;
  version: string;
  label: string | null;
  script: string;
  wordCount: string | null;
  gradeLevel: string | null;
  createdAt: string;
}

interface VersionHistoryProps {
  scriptId: string;
  currentScript: string;
  wordCount: number;
  gradeLevel: number;
  parameters: any;
  onRevert: (script: string) => void;
}

export function VersionHistory({ 
  scriptId, 
  currentScript, 
  wordCount, 
  gradeLevel,
  parameters,
  onRevert 
}: VersionHistoryProps) {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [saveLabel, setSaveLabel] = useState("");
  const [selectedVersion, setSelectedVersion] = useState<ScriptVersion | null>(null);

  const { data: versionsData, isLoading } = useQuery<{ versions: ScriptVersion[] }>({
    queryKey: ["/api/scripts", scriptId, "versions"],
    enabled: isOpen && !!scriptId,
  });

  const versions = versionsData?.versions || [];

  const saveVersionMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", `/api/scripts/${scriptId}/versions`, {
        label: saveLabel || undefined,
        script: currentScript,
        wordCount,
        gradeLevel,
        parameters,
      });
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Version Saved", description: "Current script saved to history." });
      setSaveLabel("");
      queryClient.invalidateQueries({ queryKey: ["/api/scripts", scriptId, "versions"] });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to save version.", variant: "destructive" });
    },
  });

  const revertMutation = useMutation({
    mutationFn: async (versionId: string) => {
      const res = await apiRequest("POST", `/api/scripts/${scriptId}/versions/${versionId}/revert`, {});
      return res.json();
    },
    onSuccess: (data) => {
      toast({ title: "Reverted", description: data.message });
      if (selectedVersion) {
        onRevert(selectedVersion.script);
      }
      setSelectedVersion(null);
      queryClient.invalidateQueries({ queryKey: ["/api/scripts", scriptId, "versions"] });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to revert.", variant: "destructive" });
    },
  });

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="bg-white/5 border-white/10" data-testid="button-version-history">
          <History className="w-4 h-4 mr-1" />
          History
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <History className="w-5 h-5" />
            Version History
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Input
              placeholder="Version label (optional)"
              value={saveLabel}
              onChange={(e) => setSaveLabel(e.target.value)}
              className="flex-1"
              data-testid="input-version-label"
            />
            <Button 
              onClick={() => saveVersionMutation.mutate()}
              disabled={saveVersionMutation.isPending}
              data-testid="button-save-version"
            >
              <Save className="w-4 h-4 mr-1" />
              {saveVersionMutation.isPending ? "Saving..." : "Save Current"}
            </Button>
          </div>

          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Loading versions...</div>
          ) : versions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No versions saved yet. Save the current script to start tracking history.
            </div>
          ) : (
            <ScrollArea className="h-[400px]">
              <div className="space-y-2 pr-4">
                {versions.map((version) => (
                  <div
                    key={version.id}
                    className={`p-3 rounded-md border transition-all cursor-pointer hover-elevate ${
                      selectedVersion?.id === version.id
                        ? "bg-primary/10 border-primary/30"
                        : "bg-white/5 border-white/10"
                    }`}
                    onClick={() => setSelectedVersion(version)}
                    data-testid={`version-item-${version.id}`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          v{version.version}
                        </Badge>
                        {version.label && (
                          <span className="flex items-center gap-1 text-xs text-primary">
                            <Tag className="w-3 h-3" />
                            {version.label}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                        <Clock className="w-3 h-3" />
                        {formatDistanceToNow(new Date(version.createdAt), { addSuffix: true })}
                      </div>
                    </div>
                    
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {version.script.substring(0, 150)}...
                    </p>
                    
                    <div className="flex items-center gap-3 mt-2 text-[10px] text-muted-foreground">
                      {version.wordCount && <span>{version.wordCount} words</span>}
                      {version.gradeLevel && <span>Grade {parseFloat(version.gradeLevel).toFixed(1)}</span>}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}

          {selectedVersion && (
            <div className="flex items-center justify-between gap-2 p-3 rounded-md bg-amber-500/10 border border-amber-500/30">
              <div className="flex items-center gap-2">
                <ChevronRight className="w-4 h-4 text-amber-500" />
                <span className="text-sm">
                  Selected: <strong>v{selectedVersion.version}</strong>
                  {selectedVersion.label && ` - ${selectedVersion.label}`}
                </span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => revertMutation.mutate(selectedVersion.id)}
                disabled={revertMutation.isPending}
                className="bg-amber-500/20 border-amber-500/30 text-amber-400"
                data-testid="button-revert-version"
              >
                <RotateCcw className="w-4 h-4 mr-1" />
                {revertMutation.isPending ? "Reverting..." : "Revert to This"}
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
