import { Switch, Route, useLocation } from "wouter";
import { useEffect, useState } from "react";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, SidebarTrigger, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { AuthProvider, useAuth } from "@/hooks/use-auth";
import { ThemeProvider } from "@/components/theme-provider";
import { ThemeToggle } from "@/components/theme-toggle";
import { CreditsDisplay } from "@/components/credits-display";
import { Footer } from "@/components/footer";
import Home from "@/pages/home";
import Scripts from "@/pages/scripts";
import Projects from "@/pages/projects";
import CalendarPage from "@/pages/calendar";
import Vault from "@/pages/vault";
import Pricing from "@/pages/pricing";
import KnowledgeBase from "@/pages/knowledge-base";
import Templates from "@/pages/templates";
import Competitive from "@/pages/competitive";
import Settings from "@/pages/settings";
import Admin from "@/pages/admin";
import Landing from "@/pages/landing";
import Login from "@/pages/login";
import ResetPassword from "@/pages/reset-password";
import Onboarding from "@/pages/onboarding";
import CheckoutSuccess from "@/pages/checkout-success";
import NotFound from "@/pages/not-found";

function LoginRedirect() {
  const [, setLocation] = useLocation();
  useEffect(() => {
    setLocation("/");
  }, [setLocation]);
  return null;
}

function AuthenticatedRouter() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/checkout-success" component={CheckoutSuccess} />
      <Route path="/login" component={LoginRedirect} />
      <Route path="/reset-password" component={ResetPassword} />
      <Route path="/competitive" component={Competitive} />
      <Route path="/scripts" component={Scripts} />
      <Route path="/projects" component={Projects} />
      <Route path="/calendar" component={CalendarPage} />
      <Route path="/vault" component={Vault} />
      <Route path="/pricing" component={Pricing} />
      <Route path="/knowledge-base" component={KnowledgeBase} />
      <Route path="/templates" component={Templates} />
      <Route path="/settings" component={Settings} />
      <Route path="/admin" component={Admin} />
      <Route component={NotFound} />
    </Switch>
  );
}

function AuthenticatedApp() {
  const style = {
    "--sidebar-width": "14rem",
    "--sidebar-width-icon": "3rem",
  };

  return (
    <SidebarProvider style={style as React.CSSProperties}>
      <div className="flex min-h-screen w-full bg-background">
        <AppSidebar />
        <SidebarInset className="flex-1 flex flex-col">
          <header className="sticky top-0 z-50 flex h-12 items-center justify-between gap-2 border-b border-border bg-background/95 backdrop-blur px-4">
            <SidebarTrigger data-testid="button-sidebar-toggle" />
            <ThemeToggle />
          </header>
          <main className="flex-1 pb-12">
            <AuthenticatedRouter />
          </main>
          <Footer />
        </SidebarInset>
        <CreditsDisplay />
      </div>
    </SidebarProvider>
  );
}

function PublicRouter() {
  return (
    <div className="min-h-screen flex flex-col">
      <div className="flex-1">
        <Switch>
          <Route path="/" component={Landing} />
          <Route path="/login" component={Login} />
          <Route path="/reset-password" component={ResetPassword} />
          <Route path="/pricing" component={Pricing} />
          <Route path="/checkout-success" component={CheckoutSuccess} />
          <Route component={Landing} />
        </Switch>
      </div>
      <Footer />
    </div>
  );
}

function AppContent() {
  const { user, isLoading } = useAuth();
  const [location] = useLocation();
  const [isProcessingSubscription, setIsProcessingSubscription] = useState(false);
  
  // Handle successful subscription redirect - refetch user data
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('subscription') === 'success') {
      // Show processing state
      setIsProcessingSubscription(true);
      
      // Clear the URL parameter
      window.history.replaceState({}, '', window.location.pathname);
      
      // Immediately refetch user data (webhook may have updated subscription status)
      // Use refetch with retry to handle webhook timing race
      const refetchWithRetry = async (attempt = 0) => {
        await queryClient.refetchQueries({ queryKey: ['/api/user'] });
        await queryClient.refetchQueries({ queryKey: ['/api/user/trial-status'] });
        
        // If still showing needsPaymentSetup after refetch, retry up to 5 times with delay
        // This handles the case where Stripe webhook hasn't processed yet
        const currentUser = queryClient.getQueryData(['/api/user']) as { needsPaymentSetup?: boolean } | undefined;
        if (currentUser?.needsPaymentSetup && attempt < 5) {
          setTimeout(() => refetchWithRetry(attempt + 1), 2000);
        } else {
          // Clear processing state when done
          setIsProcessingSubscription(false);
        }
      };
      
      refetchWithRetry();
    }
  }, [location]);
  
  if (isLoading || isProcessingSubscription) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center space-y-3">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto" />
          <div className="text-muted-foreground">
            {isProcessingSubscription ? "Setting up your subscription..." : "Loading..."}
          </div>
        </div>
      </div>
    );
  }

  const isAuthenticated = !!user;
  
  return isAuthenticated ? <AuthenticatedApp /> : <PublicRouter />;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="dark" storageKey="vswp-theme">
        <TooltipProvider>
          <AuthProvider>
            <AppContent />
          </AuthProvider>
          <Toaster />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
