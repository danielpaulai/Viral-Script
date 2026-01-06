import { Link, useLocation } from "wouter";
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
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
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
  { href: "/competitive", label: "Competitive Analysis", icon: BarChart3, isPro: true },
  { href: "/knowledge-base", label: "Knowledge Base", icon: BookOpen, isPro: true },
  { href: "/pricing", label: "Pricing", icon: CreditCard },
  { href: "/settings", label: "Settings", icon: Settings },
];

const footerNavItems = [
  { href: "#feedback", label: "Share feedback", icon: MessageSquare },
  { href: "#support", label: "Get support", icon: HelpCircle },
];

export function AppSidebar() {
  const [location] = useLocation();

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
              {proNavItems.map((item) => {
                const Icon = item.icon;
                const isActive = location === item.href;
                const isPro = 'isPro' in item && item.isPro;
                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      tooltip={item.label}
                    >
                      <Link href={item.href} data-testid={`nav-${item.label.toLowerCase().replace(' ', '-')}`}>
                        <Icon className="w-4 h-4" />
                        <span className="flex-1">{item.label}</span>
                        {isPro && (
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
          <SidebarMenuItem>
            <SidebarMenuButton className="text-primary" tooltip="Sign out">
              <LogOut className="w-4 h-4" />
              <span>Sign out</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
