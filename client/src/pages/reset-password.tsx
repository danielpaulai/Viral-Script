import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Feather, Loader2, CheckCircle2, XCircle } from "lucide-react";
import { Link, useLocation, useSearch } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function ResetPassword() {
  const [, setLocation] = useLocation();
  const searchString = useSearch();
  
  // Try to get token from query params first, then from hash fragment (Supabase format)
  const queryToken = new URLSearchParams(searchString).get("token");
  
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isValidating, setIsValidating] = useState(true);
  const [isValidToken, setIsValidToken] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [tokenType, setTokenType] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    // Parse the hash fragment for Supabase tokens
    // Supabase sends: #access_token=xxx&token_type=bearer&type=recovery
    const hash = window.location.hash.substring(1);
    if (hash) {
      const hashParams = new URLSearchParams(hash);
      const hashAccessToken = hashParams.get("access_token");
      const hashType = hashParams.get("type");
      
      if (hashAccessToken && hashType === "recovery") {
        setAccessToken(hashAccessToken);
        setTokenType("supabase");
        setIsValidToken(true);
        setIsValidating(false);
        return;
      }
    }
    
    // Fallback: check for legacy token in query params
    if (queryToken) {
      validateLegacyToken(queryToken);
    } else {
      setIsValidating(false);
      setIsValidToken(false);
    }
  }, [queryToken]);
  
  async function validateLegacyToken(token: string) {
    try {
      const response = await fetch(`/api/verify-reset-token?token=${token}`);
      const data = await response.json();
      if (data.valid) {
        setAccessToken(token);
        setTokenType("legacy");
        setIsValidToken(true);
      } else {
        setIsValidToken(false);
      }
    } catch {
      setIsValidToken(false);
    } finally {
      setIsValidating(false);
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      toast({
        title: "Error",
        description: "Passwords do not match",
        variant: "destructive",
      });
      return;
    }

    if (password.length < 6) {
      toast({
        title: "Error",
        description: "Password must be at least 6 characters",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      if (tokenType === "supabase" && accessToken) {
        // Use the Supabase access token to update password via API
        const response = await fetch("/api/reset-password-supabase", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ accessToken, password }),
        });
        
        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.message || "Failed to reset password");
        }
      } else {
        // Legacy token flow
        await apiRequest("POST", "/api/reset-password", { token: accessToken, password });
      }
      
      setIsSuccess(true);
      toast({
        title: "Success",
        description: "Your password has been reset successfully.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error?.message || "Failed to reset password. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isValidating) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Validating reset link...</p>
        </div>
      </div>
    );
  }

  if (!isValidToken) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <XCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
            <CardTitle>Invalid or Expired Link</CardTitle>
            <CardDescription>
              This password reset link is invalid or has expired. Please request a new one.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Link href="/login">
              <Button data-testid="button-back-to-login">Back to Login</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-4" />
            <CardTitle>Password Reset Successful</CardTitle>
            <CardDescription>
              Your password has been changed. You can now log in with your new password.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Link href="/login">
              <Button data-testid="button-go-to-login">Go to Login</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="flex items-center gap-2 justify-center mb-8">
          <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center">
            <Feather className="w-6 h-6 text-primary-foreground" />
          </div>
          <span className="font-bold text-2xl">Script Writer Pro</span>
        </div>

        <Card>
          <CardHeader className="text-center">
            <CardTitle>Create New Password</CardTitle>
            <CardDescription>
              Enter your new password below.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password">New Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter new password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  disabled={isLoading}
                  data-testid="input-new-password"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm New Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="Confirm new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={6}
                  disabled={isLoading}
                  data-testid="input-confirm-new-password"
                />
                {password !== confirmPassword && confirmPassword && (
                  <p className="text-xs text-destructive">Passwords do not match</p>
                )}
              </div>
              <Button 
                type="submit" 
                className="w-full" 
                disabled={isLoading || password !== confirmPassword || password.length < 6}
                data-testid="button-reset-password"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : null}
                Reset Password
              </Button>
            </form>
          </CardContent>
        </Card>

        <p className="text-center text-sm text-muted-foreground mt-6">
          <Link href="/login" className="hover:text-foreground transition-colors">
            Back to login
          </Link>
        </p>
      </div>
    </div>
  );
}
