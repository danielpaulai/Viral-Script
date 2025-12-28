import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, SidebarTrigger, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import Home from "@/pages/home";
import Scripts from "@/pages/scripts";
import Projects from "@/pages/projects";
import CalendarPage from "@/pages/calendar";
import Vault from "@/pages/vault";
import Pricing from "@/pages/pricing";
import KnowledgeBase from "@/pages/knowledge-base";
import Settings from "@/pages/settings";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/scripts" component={Scripts} />
      <Route path="/projects" component={Projects} />
      <Route path="/calendar" component={CalendarPage} />
      <Route path="/vault" component={Vault} />
      <Route path="/pricing" component={Pricing} />
      <Route path="/knowledge-base" component={KnowledgeBase} />
      <Route path="/settings" component={Settings} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  const style = {
    "--sidebar-width": "14rem",
    "--sidebar-width-icon": "3rem",
  };

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <SidebarProvider style={style as React.CSSProperties}>
          <div className="flex min-h-screen w-full bg-background">
            <AppSidebar />
            <SidebarInset className="flex-1">
              <header className="sticky top-0 z-50 flex h-12 items-center gap-2 border-b border-border bg-background/95 backdrop-blur px-4">
                <SidebarTrigger data-testid="button-sidebar-toggle" />
              </header>
              <main className="flex-1">
                <Router />
              </main>
            </SidebarInset>
          </div>
        </SidebarProvider>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
