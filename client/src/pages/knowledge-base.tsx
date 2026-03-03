import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BookOpen, Sparkles, Clock, FileText, Brain, Mic, Bell } from "lucide-react";
import { Link } from "wouter";

export default function KnowledgeBase() {
  return (
    <div className="p-6 max-w-4xl mx-auto">
      <Card className="text-center overflow-hidden">
        <div className="absolute top-4 right-4">
          <Badge variant="outline" className="text-sm border-amber-500/50 text-amber-500 bg-amber-500/10">
            Coming Soon
          </Badge>
        </div>
        <CardHeader className="pt-12 pb-6">
          <div className="mx-auto w-20 h-20 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center mb-6 relative">
            <BookOpen className="w-10 h-10 text-primary" />
            <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-amber-500" />
            </div>
          </div>
          <CardTitle className="text-3xl">Knowledge Base</CardTitle>
          <CardDescription className="text-base mt-3 max-w-md mx-auto">
            Upload your brand documents, voice guidelines, and audience profiles. The AI will use this context to write scripts that sound exactly like you.
          </CardDescription>
        </CardHeader>
        <CardContent className="pb-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8 max-w-2xl mx-auto">
            <div className="p-4 rounded-lg bg-muted/50 text-left">
              <FileText className="w-5 h-5 text-primary mb-2" />
              <h4 className="font-medium text-sm">Brand Documents</h4>
              <p className="text-xs text-muted-foreground mt-1">Upload PDFs, docs, and brand guides</p>
            </div>
            <div className="p-4 rounded-lg bg-muted/50 text-left">
              <Mic className="w-5 h-5 text-primary mb-2" />
              <h4 className="font-medium text-sm">Voice DNA</h4>
              <p className="text-xs text-muted-foreground mt-1">Define your unique speaking style</p>
            </div>
            <div className="p-4 rounded-lg bg-muted/50 text-left">
              <Brain className="w-5 h-5 text-primary mb-2" />
              <h4 className="font-medium text-sm">Smart Context</h4>
              <p className="text-xs text-muted-foreground mt-1">AI learns your terminology and topics</p>
            </div>
          </div>
          
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground mb-6">
            <Clock className="w-4 h-4" />
            <span>Expected launch: Q2 2026</span>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button variant="outline" className="gap-2" disabled>
              <Bell className="w-4 h-4" />
              Notify Me When Available
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
