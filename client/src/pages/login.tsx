import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Sparkles, ArrowRight, Zap, FileText, Target, CheckCircle2 } from "lucide-react";
import { Link } from "wouter";

const benefits = [
  "50+ viral hook templates",
  "AI-powered script generation",
  "Hemingway readability analysis",
  "Knowledge Base for brand voice",
  "Deep Research mode",
  "Production notes & B-roll ideas"
];

export default function Login() {
  const handleLogin = () => {
    window.location.href = "/api/login";
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left side - Benefits */}
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

      {/* Right side - Login */}
      <div className="flex-1 flex flex-col justify-center items-center p-8">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-bold text-xl">Script Writer Pro</span>
          </div>

          <Card className="bg-card border-card-border">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">Welcome back</CardTitle>
              <CardDescription>
                Sign in to start creating viral scripts
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button 
                onClick={handleLogin}
                className="w-full gap-2"
                size="lg"
                data-testid="button-login-replit"
              >
                <svg viewBox="0 0 32 32" className="w-5 h-5" fill="currentColor">
                  <path d="M7 5.5C7 4.11929 8.11929 3 9.5 3H22.5C23.8807 3 25 4.11929 25 5.5V11.5C25 12.8807 23.8807 14 22.5 14H9.5C8.11929 14 7 12.8807 7 11.5V5.5Z"/>
                  <path d="M7 20.5C7 19.1193 8.11929 18 9.5 18H22.5C23.8807 18 25 19.1193 25 20.5V26.5C25 27.8807 23.8807 29 22.5 29H9.5C8.11929 29 7 27.8807 7 26.5V20.5Z"/>
                </svg>
                Continue with Replit
              </Button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-2 text-muted-foreground">or</span>
                </div>
              </div>

              <p className="text-center text-sm text-muted-foreground">
                New to Script Writer Pro?{" "}
                <button 
                  onClick={handleLogin}
                  className="text-primary hover:underline"
                  data-testid="link-signup"
                >
                  Create an account
                </button>
              </p>
            </CardContent>
          </Card>

          <div className="mt-8 text-center">
            <Link href="/">
              <Button variant="ghost" size="sm" className="gap-2" data-testid="button-back-home">
                <ArrowRight className="w-4 h-4 rotate-180" />
                Back to home
              </Button>
            </Link>
          </div>

          <p className="mt-8 text-center text-xs text-muted-foreground">
            By signing in, you agree to our Terms of Service and Privacy Policy.
          </p>
        </div>
      </div>
    </div>
  );
}
