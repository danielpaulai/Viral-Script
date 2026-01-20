import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, CheckCircle, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { apiRequest, queryClient } from "@/lib/queryClient";

type VerifyStatus = "verifying" | "success" | "error";

export default function CheckoutSuccess() {
  const [, setLocation] = useLocation();
  const [status, setStatus] = useState<VerifyStatus>("verifying");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const sessionId = urlParams.get("session_id");

    if (!sessionId) {
      setStatus("error");
      setErrorMessage("No checkout session found. Please try again.");
      return;
    }

    const verifySession = async () => {
      try {
        const response = await fetch(`/api/billing/verify-session?session_id=${sessionId}`, {
          credentials: "include"
        });
        
        const data = await response.json();
        
        if (response.ok && data.success) {
          setStatus("success");
          queryClient.invalidateQueries({ queryKey: ["/api/user"] });
          queryClient.invalidateQueries({ queryKey: ["/api/user/trial-status"] });
          queryClient.invalidateQueries({ queryKey: ["/api/user/subscription"] });
          
          setTimeout(() => {
            setLocation("/");
          }, 2000);
        } else {
          // Handle specific error cases
          if (response.status === 403 && data.error === "Email mismatch") {
            setStatus("error");
            setErrorMessage("The subscription email doesn't match your account. Please login with the correct email and try again.");
          } else if (response.status === 404) {
            setStatus("error");
            setErrorMessage("Account not found. Please login or register with the same email you used for checkout, then return here.");
          } else if (retryCount < 3) {
            setTimeout(() => {
              setRetryCount(prev => prev + 1);
            }, 2000);
          } else {
            setStatus("error");
            setErrorMessage(data.error || "Failed to verify subscription. Please contact support.");
          }
        }
      } catch (error: any) {
        console.error("Verification error:", error);
        if (retryCount < 3) {
          setTimeout(() => {
            setRetryCount(prev => prev + 1);
          }, 2000);
        } else {
          setStatus("error");
          setErrorMessage("Network error. Please refresh the page or contact support.");
        }
      }
    };

    verifySession();
  }, [retryCount, setLocation]);

  const handleRetry = () => {
    setStatus("verifying");
    setRetryCount(0);
    setErrorMessage("");
  };

  const handleGoHome = () => {
    queryClient.invalidateQueries({ queryKey: ["/api/user"] });
    setLocation("/");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardContent className="pt-6 pb-6 text-center">
          {status === "verifying" && (
            <div className="space-y-4">
              <Loader2 className="w-12 h-12 animate-spin mx-auto text-primary" />
              <h2 className="text-xl font-semibold">Verifying your subscription...</h2>
              <p className="text-muted-foreground">
                Please wait while we confirm your payment.
                {retryCount > 0 && ` (Attempt ${retryCount + 1}/4)`}
              </p>
            </div>
          )}

          {status === "success" && (
            <div className="space-y-4">
              <CheckCircle className="w-12 h-12 mx-auto text-green-500" />
              <h2 className="text-xl font-semibold text-green-600">Subscription Activated!</h2>
              <p className="text-muted-foreground">
                Your 7-day free trial has started. Redirecting to your dashboard...
              </p>
            </div>
          )}

          {status === "error" && (
            <div className="space-y-4">
              <XCircle className="w-12 h-12 mx-auto text-destructive" />
              <h2 className="text-xl font-semibold">Verification Failed</h2>
              <p className="text-muted-foreground">{errorMessage}</p>
              <div className="flex gap-2 justify-center">
                <Button onClick={handleRetry} variant="outline" data-testid="button-retry">
                  Try Again
                </Button>
                <Button onClick={handleGoHome} data-testid="button-go-home">
                  Go to Dashboard
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
