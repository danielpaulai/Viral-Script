import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sparkles, Zap, FileText, CheckCircle2, Loader2 } from "lucide-react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";

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
  const { loginMutation, registerMutation, user } = useAuth();
  const [isRegister, setIsRegister] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  useEffect(() => {
    if (user) {
      setLocation("/");
    }
  }, [user, setLocation]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isRegister) {
      if (password !== confirmPassword) {
        return;
      }
      registerMutation.mutate({ username, password });
    } else {
      loginMutation.mutate({ username, password });
    }
  };

  const isPending = loginMutation.isPending || registerMutation.isPending;

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
              <CardTitle className="text-2xl">
                {isRegister ? "Create an account" : "Welcome back"}
              </CardTitle>
              <CardDescription>
                {isRegister 
                  ? "Sign up to start creating viral scripts" 
                  : "Sign in to continue creating"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="username">Email</Label>
                  <Input
                    id="username"
                    type="email"
                    placeholder="you@example.com"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                    disabled={isPending}
                    data-testid="input-username"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={isPending}
                    data-testid="input-password"
                  />
                </div>
                {isRegister && (
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirm Password</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      placeholder="Confirm your password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      disabled={isPending}
                      data-testid="input-confirm-password"
                    />
                    {password !== confirmPassword && confirmPassword && (
                      <p className="text-xs text-destructive">Passwords do not match</p>
                    )}
                  </div>
                )}
                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={isPending || (isRegister && password !== confirmPassword)}
                  data-testid="button-submit"
                >
                  {isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : null}
                  {isRegister ? "Create Account" : "Sign In"}
                </Button>
              </form>

              <div className="mt-4 text-center text-sm">
                <button
                  type="button"
                  onClick={() => setIsRegister(!isRegister)}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                  data-testid="button-toggle-mode"
                >
                  {isRegister 
                    ? "Already have an account? Sign in" 
                    : "Don't have an account? Sign up"}
                </button>
              </div>
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
