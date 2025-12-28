import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Video, FolderOpen, Calendar, Archive } from "lucide-react";

export function Header() {
  const [location] = useLocation();

  const navItems = [
    { href: "/", label: "Create", icon: Video },
    { href: "/projects", label: "Projects", icon: FolderOpen },
    { href: "/calendar", label: "Calendar", icon: Calendar },
    { href: "/vault", label: "Vault", icon: Archive },
  ];

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-14">
          <Link href="/">
            <div className="flex items-center gap-2 cursor-pointer" data-testid="link-logo">
              <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                <Video className="w-4 h-4 text-primary-foreground" />
              </div>
              <span className="font-semibold text-sm">VideoScriptWriter</span>
            </div>
          </Link>

          <nav className="flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location === item.href;
              return (
                <Link key={item.href} href={item.href}>
                  <Button
                    variant={isActive ? "secondary" : "ghost"}
                    size="sm"
                    className={`gap-2 ${isActive ? "bg-muted" : ""}`}
                    data-testid={`nav-${item.label.toLowerCase()}`}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="hidden sm:inline">{item.label}</span>
                  </Button>
                </Link>
              );
            })}
          </nav>
        </div>
      </div>
    </header>
  );
}
