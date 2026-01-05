import { Switch, Route, useLocation } from "wouter";
import { useEffect } from "react";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, SidebarTrigger, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { AuthProvider, useAuth } from "@/hooks/use-auth";
import { ThemeProvider } from "@/components/theme-provider";
import { ThemeToggle } from "@/components/theme-toggle";
import Home from "@/pages/home";
import Scripts from "@/pages/scripts";
import Projects from "@/pages/projects";
import CalendarPage from "@/pages/calendar";
import Vault from "@/pages/vault";
import Pricing from "@/pages/pricing";
import KnowledgeBase from "@/pages/knowledge-base";
import Templates from "@/pages/templates";
import Settings from "@/pages/settings";
import Landing from "@/pages/landing";
import Login from "@/pages/login";
import ResetPassword from "@/pages/reset-password";
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
      <Route path="/login" component={LoginRedirect} />
      <Route path="/reset-password" component={ResetPassword} />
      <Route path="/scripts" component={Scripts} />
      <Route path="/projects" component={Projects} />
      <Route path="/calendar" component={CalendarPage} />
      <Route path="/vault" component={Vault} />
      <Route path="/pricing" component={Pricing} />
      <Route path="/knowledge-base" component={KnowledgeBase} />
      <Route path="/templates" component={Templates} />
      <Route path="/settings" component={Settings} />
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
        <SidebarInset className="flex-1">
          <header className="sticky top-0 z-50 flex h-12 items-center justify-between gap-2 border-b border-border bg-background/95 backdrop-blur px-4">
            <SidebarTrigger data-testid="button-sidebar-toggle" />
            <ThemeToggle />
          </header>
          <main className="flex-1">
            <AuthenticatedRouter />
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}

function PublicRouter() {
  return (
    <Switch>
      <Route path="/" component={Landing} />
      <Route path="/login" component={Login} />
      <Route path="/reset-password" component={ResetPassword} />
      <Route path="/pricing" component={Pricing} />
      <Route component={Landing} />
    </Switch>
  );
}

function AppContent() {
  const { user, isLoading } = useAuth();
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
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
