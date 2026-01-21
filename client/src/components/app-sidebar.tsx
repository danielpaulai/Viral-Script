import { Link, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import {
  Home,
  Video,
  FileText,
  FolderOpen,
  Archive,
  Calendar,
  BookOpen,
  CreditCard,
  MessageSquare,
  HelpCircle,
  LogOut,
  Settings,
  Layout,
  BarChart3,
  Crown,
  Clock,
  Sparkles,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
} from "@/components/ui/sidebar";

const mainNavItems = [
  { href: "/", label: "Home", icon: Home },
  { href: "/scripts", label: "Scripts", icon: FileText },
  { href: "/templates", label: "Templates", icon: Layout },
  { href: "/projects", label: "Projects", icon: FolderOpen },
  { href: "/vault", label: "Vault", icon: Archive },
  { href: "/calendar", label: "Calendar", icon: Calendar },
];

const proNavItems = [
  { href: "/competitive", label: "Competitive Analysis", icon: BarChart3, isPro: true, comingSoon: true },
  { href: "/knowledge-base", label: "Knowledge Base", icon: BookOpen, isPro: true, comingSoon: true },
  { href: "/pricing", label: "Pricing", icon: CreditCard },
  { href: "/settings", label: "Settings", icon: Settings },
  { href: "/admin", label: "Admin Analytics", icon: BarChart3, isAdmin: true },
];

const footerNavItems = [
  { href: "mailto:danny@danielpaul.ai?subject=ScriptWriter%20Feedback", label: "Share feedback", icon: MessageSquare },
  { href: "mailto:danny@danielpaul.ai?subject=ScriptWriter%20Support%20Request", label: "Get support", icon: HelpCircle },
];

interface TrialStatus {
  isActive: boolean;
  daysRemaining: number;
  scriptsUsed: number;
  scriptsLimit: number;
  trialEndsAt: string | null;
  isPaidUser?: boolean;
}

function TrialStatusCard() {
  const { data: trialStatus, isLoading } = useQuery<TrialStatus>({
    queryKey: ['/api/user/trial-status'],
  });

  if (isLoading || !trialStatus) return null;
  
  // Don't show trial card for paid subscribers
  if (trialStatus.isPaidUser) return null;

  const scriptsRemaining = trialStatus.scriptsLimit - trialStatus.scriptsUsed;
  const progressPercent = (trialStatus.scriptsUsed / trialStatus.scriptsLimit) * 100;

  if (!trialStatus.isActive) {
    return (
      <div className="mx-2 mb-2 p-3 rounded-lg bg-muted/50 border border-muted-foreground/10">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Clock className="w-4 h-4" />
          <span className="text-xs font-medium">Trial ended</span>
        </div>
        <Link href="/pricing">
          <div className="mt-2 text-xs text-primary hover:underline cursor-pointer flex items-center gap-1">
            <Sparkles className="w-3 h-3" />
            Upgrade to continue
          </div>
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-2 mb-2 p-3 rounded-lg bg-primary/5 border border-primary/10">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-primary" />
          <span className="text-xs font-medium">Free Trial</span>
        </div>
        <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 border-primary/30 text-primary">
          {trialStatus.daysRemaining} days left
        </Badge>
      </div>
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-[10px] text-muted-foreground">
          <span>Scripts used</span>
          <span>{trialStatus.scriptsUsed} / {trialStatus.scriptsLimit}</span>
        </div>
        <Progress value={progressPercent} className="h-1.5" />
        <p className="text-[10px] text-muted-foreground">
          {scriptsRemaining} scripts remaining
        </p>
      </div>
    </div>
  );
}

const ADMIN_EMAIL = 'danny@danielpaul.ai';

export function AppSidebar() {
  const [location, setLocation] = useLocation();
  const { logoutMutation, isAuthenticated, user } = useAuth();
  
  // Check if current user is admin
  const isAdmin = user?.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase();
  
  // Filter nav items based on admin status
  const filteredProNavItems = proNavItems.filter(item => {
    if ('isAdmin' in item && item.isAdmin) {
      return isAdmin;
    }
    return true;
  });
  
  const handleLogout = () => {
    logoutMutation.mutate(undefined, {
      onSuccess: () => {
        setLocation("/login");
      },
    });
  };

  return (
    <Sidebar>
      <SidebarHeader className="p-4">
        <Link href="/">
          <div className="flex items-center gap-2 cursor-pointer" data-testid="link-logo">
            <div className="w-8 h-8 rounded-md bg-primary flex items-center justify-center">
              <Video className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-semibold text-sm text-white">ScriptWriter</span>
          </div>
        </Link>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainNavItems.map((item) => {
                const Icon = item.icon;
                const isActive = location === item.href;
                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      tooltip={item.label}
                    >
                      <Link href={item.href} data-testid={`nav-${item.label.toLowerCase()}`}>
                        <Icon className="w-4 h-4" />
                        <span>{item.label}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        
        <SidebarSeparator />
        
        <SidebarGroup>
          <SidebarGroupLabel>Pro Features</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {filteredProNavItems.map((item) => {
                const Icon = item.icon;
                const isActive = location === item.href;
                const isPro = 'isPro' in item && item.isPro;
                const isComingSoon = 'comingSoon' in item && item.comingSoon;
                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      tooltip={isComingSoon ? `${item.label} - Coming Soon` : item.label}
                    >
                      <Link href={item.href} data-testid={`nav-${item.label.toLowerCase().replace(' ', '-')}`}>
                        <Icon className="w-4 h-4" />
                        <span className="flex-1">{item.label}</span>
                        {isComingSoon ? (
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 border-muted-foreground/30 text-muted-foreground">
                            Soon
                          </Badge>
                        ) : isPro && (
                          <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4 bg-amber-500/20 text-amber-500 border-amber-500/30">
                            <Crown className="w-2.5 h-2.5 mr-0.5" />
                            PRO
                          </Badge>
                        )}
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <TrialStatusCard />
        <SidebarSeparator />
        <SidebarMenu>
          {footerNavItems.map((item) => {
            const Icon = item.icon;
            return (
              <SidebarMenuItem key={item.href}>
                <SidebarMenuButton asChild tooltip={item.label}>
                  <a href={item.href} data-testid={`nav-${item.label.toLowerCase().replace(' ', '-')}`}>
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </a>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
          {isAuthenticated && (
            <SidebarMenuItem>
              <SidebarMenuButton 
                className="text-destructive hover:text-destructive" 
                tooltip="Sign out"
                onClick={handleLogout}
                disabled={logoutMutation.isPending}
                data-testid="button-logout"
              >
                <LogOut className="w-4 h-4" />
                <span>{logoutMutation.isPending ? "Signing out..." : "Sign out"}</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          )}
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
