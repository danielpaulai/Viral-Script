import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BarChart3, Sparkles, Clock, TrendingUp, Users, Target, Bell } from "lucide-react";
import { Link } from "wouter";

export default function Competitive() {
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
            <BarChart3 className="w-10 h-10 text-primary" />
            <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-amber-500" />
            </div>
          </div>
          <CardTitle className="text-3xl">Competitive Analysis</CardTitle>
          <CardDescription className="text-base mt-3 max-w-md mx-auto">
            Discover what's working for top creators in your niche. Analyze viral content, identify winning patterns, and reverse-engineer success.
          </CardDescription>
        </CardHeader>
        <CardContent className="pb-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8 max-w-2xl mx-auto">
            <div className="p-4 rounded-lg bg-muted/50 text-left">
              <TrendingUp className="w-5 h-5 text-primary mb-2" />
              <h4 className="font-medium text-sm">Viral Content Scanner</h4>
              <p className="text-xs text-muted-foreground mt-1">Find top-performing videos in any niche</p>
            </div>
            <div className="p-4 rounded-lg bg-muted/50 text-left">
              <Users className="w-5 h-5 text-primary mb-2" />
              <h4 className="font-medium text-sm">Creator Tracking</h4>
              <p className="text-xs text-muted-foreground mt-1">Monitor competitors and industry leaders</p>
            </div>
            <div className="p-4 rounded-lg bg-muted/50 text-left">
              <Target className="w-5 h-5 text-primary mb-2" />
              <h4 className="font-medium text-sm">Hook Pattern Analysis</h4>
              <p className="text-xs text-muted-foreground mt-1">Decode what makes content go viral</p>
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
