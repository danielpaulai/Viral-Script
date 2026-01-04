import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Sparkles, Zap, FileText, CheckCircle2, Loader2 } from "lucide-react";
import { Link, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { getQueryFn } from "@/lib/queryClient";
import type { User } from "@shared/schema";

const benefits = [
  "50+ viral hook templates",
  "AI-powered script generation",
  "Hemingway readability analysis",
  "Knowledge Base for brand voice",
  "Deep Research mode",
  "Production notes & B-roll ideas"
];

export default function Login() {
  const [, setLocation] = useLocation();
  
  const { data: user, isLoading } = useQuery<User | undefined>({
    queryKey: ["/api/auth/user"],
    queryFn: getQueryFn({ on401: "returnNull" }),
  });

  useEffect(() => {
    if (user) {
      setLocation("/");
    }
  }, [user, setLocation]);

  const handleLogin = () => {
    window.location.href = "/api/login";
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex">
      <div className="hidden lg:flex lg:w-1/2 bg-card/50 flex-col justify-center p-12 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/10" />
        <div className="relative z-10 max-w-lg">
          <div className="flex items-center gap-2 mb-8">
            <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-primary-foreground" />
            </div>
            <span className="font-bold text-2xl">Script Writer Pro</span>
          </div>
          
          <h1 className="text-4xl font-bold mb-4 leading-tight">
            Create viral scripts<br />
            in seconds
          </h1>
          <p className="text-muted-foreground text-lg mb-8">
            AI-powered script generation optimized for short-form video. 
            Stop staring at blank pages and start creating.
          </p>

          <div className="space-y-4">
            {benefits.map((benefit, idx) => (
              <div key={idx} className="flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0" />
                <span>{benefit}</span>
              </div>
            ))}
          </div>

          <div className="mt-12 flex items-center gap-6 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4" />
              <span>1000+ creators</span>
            </div>
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              <span>50,000+ scripts</span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col justify-center items-center p-8">
        <div className="w-full max-w-md">
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-bold text-xl">Script Writer Pro</span>
          </div>

          <Card className="bg-card border-card-border">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">Welcome</CardTitle>
              <CardDescription>
                Sign in to start creating viral scripts
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button 
                onClick={handleLogin} 
                className="w-full" 
                size="lg"
                data-testid="button-login"
              >
                <Sparkles className="w-4 h-4 mr-2" />
                Continue with Replit
              </Button>
              
              <p className="text-center text-xs text-muted-foreground">
                By continuing, you agree to our Terms of Service and Privacy Policy
              </p>
            </CardContent>
          </Card>

          <p className="text-center text-sm text-muted-foreground mt-6">
            <Link href="/" className="hover:text-foreground transition-colors">
              Back to home
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
