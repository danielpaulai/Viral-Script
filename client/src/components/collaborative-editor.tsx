import { useState, useEffect, useRef, useCallback } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Users, Copy, Link2, UserPlus, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Editor {
  id: string;
  name: string;
  color: string;
  lastSeen?: Date;
}

interface CollaborativeEditorProps {
  scriptId: string;
  initialContent: string;
  editorName?: string;
  onContentChange?: (content: string) => void;
  isEnabled?: boolean;
}

export function CollaborativeEditor({
  scriptId,
  initialContent,
  editorName = "You",
  onContentChange,
  isEnabled = false,
}: CollaborativeEditorProps) {
  const { toast } = useToast();
  const [content, setContent] = useState(initialContent);
  const [isConnected, setIsConnected] = useState(false);
  const [editors, setEditors] = useState<Editor[]>([]);
  const [myId, setMyId] = useState<string | null>(null);
  const [myColor, setMyColor] = useState("#4ECDC4");
  const [showCollabPanel, setShowCollabPanel] = useState(false);
  
  const wsRef = useRef<WebSocket | null>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  const connect = useCallback(() => {
    if (!isEnabled || !scriptId) return;

    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws/collaborate`;
    
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      setIsConnected(true);
      ws.send(JSON.stringify({
        type: "join",
        scriptId,
        editorName,
        initialContent: content,
      }));
    };

    ws.onmessage = (event) => {
      const message = JSON.parse(event.data);
      
      switch (message.type) {
        case "sync":
          if (message.content) {
            setContent(message.content);
          }
          setEditors(message.editors || []);
          setMyId(message.yourId);
          setMyColor(message.yourColor);
          break;
          
        case "content_update":
          if (message.editorId !== myId) {
            setContent(message.content);
            onContentChange?.(message.content);
          }
          break;
          
        case "editor_joined":
        case "editor_left":
          setEditors(message.editors || []);
          break;
      }
    };

    ws.onclose = () => {
      setIsConnected(false);
      setEditors([]);
    };

    ws.onerror = () => {
      setIsConnected(false);
    };

    return () => {
      ws.send(JSON.stringify({ type: "leave" }));
      ws.close();
    };
  }, [isEnabled, scriptId, editorName, content, myId, onContentChange]);

  useEffect(() => {
    if (isEnabled) {
      const cleanup = connect();
      return cleanup;
    }
  }, [isEnabled, connect]);

  useEffect(() => {
    setContent(initialContent);
  }, [initialContent]);

  const handleContentChange = (newContent: string) => {
    setContent(newContent);
    onContentChange?.(newContent);

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({
          type: "update",
          content: newContent,
        }));
      }
    }, 150);
  };

  const copyShareLink = () => {
    const shareUrl = `${window.location.origin}?collaborate=${scriptId}`;
    navigator.clipboard.writeText(shareUrl);
    toast({ title: "Link Copied", description: "Share this link to collaborate in real-time." });
  };

  const otherEditors = editors.filter((e) => e.id !== myId);

  if (!isEnabled) {
    return (
      <div className="relative">
        <Textarea
          value={content}
          onChange={(e) => {
            setContent(e.target.value);
            onContentChange?.(e.target.value);
          }}
          className="min-h-[300px] bg-white/5 border-white/10 text-white resize-none"
          placeholder="Your script content..."
          data-testid="textarea-script-editor"
        />
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          <Badge 
            variant={isConnected ? "default" : "outline"}
            className={isConnected ? "bg-green-500/20 text-green-400 border-green-500/30" : ""}
          >
            <Users className="w-3 h-3 mr-1" />
            {isConnected ? `${editors.length} online` : "Offline"}
          </Badge>
          
          {otherEditors.length > 0 && (
            <div className="flex items-center gap-1">
              {otherEditors.slice(0, 3).map((editor) => (
                <Avatar key={editor.id} className="w-6 h-6 border-2" style={{ borderColor: editor.color }}>
                  <AvatarFallback 
                    className="text-[10px]" 
                    style={{ backgroundColor: editor.color + "20", color: editor.color }}
                  >
                    {editor.name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              ))}
              {otherEditors.length > 3 && (
                <span className="text-xs text-muted-foreground">+{otherEditors.length - 3}</span>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={copyShareLink}
            className="bg-white/5 border-white/10"
            data-testid="button-copy-collab-link"
          >
            <Link2 className="w-3 h-3 mr-1" />
            Invite
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowCollabPanel(!showCollabPanel)}
            data-testid="button-toggle-collab-panel"
          >
            <UserPlus className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {showCollabPanel && (
        <div className="p-3 rounded-md bg-white/5 border border-white/10">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Active Editors</span>
            <Button variant="ghost" size="sm" onClick={() => setShowCollabPanel(false)}>
              <X className="w-3 h-3" />
            </Button>
          </div>
          <div className="space-y-2">
            {editors.map((editor) => (
              <div key={editor.id} className="flex items-center gap-2 text-sm">
                <div 
                  className="w-2 h-2 rounded-full" 
                  style={{ backgroundColor: editor.color }}
                />
                <span>{editor.name}</span>
                {editor.id === myId && (
                  <Badge variant="outline" className="text-[10px]">You</Badge>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="relative">
        <Textarea
          value={content}
          onChange={(e) => handleContentChange(e.target.value)}
          className="min-h-[300px] bg-white/5 border-white/10 text-white resize-none"
          style={{ borderColor: isConnected ? myColor + "50" : undefined }}
          placeholder="Start typing... changes sync in real-time!"
          data-testid="textarea-collab-editor"
        />
        {isConnected && (
          <div 
            className="absolute top-2 right-2 w-2 h-2 rounded-full animate-pulse"
            style={{ backgroundColor: myColor }}
            title="Your cursor color"
          />
        )}
      </div>
    </div>
  );
}
