import { Linkedin, Instagram, Globe } from "lucide-react";

const socialLinks = [
  {
    name: "LinkedIn",
    href: "https://www.linkedin.com/in/danielpaulai/",
    icon: Linkedin,
  },
  {
    name: "Instagram",
    href: "https://www.instagram.com/danielpaul.ai",
    icon: Instagram,
  },
  {
    name: "Website",
    href: "https://danielpaul.ai/",
    icon: Globe,
  },
];

export function Footer() {
  return (
    <footer className="border-t border-border bg-card/50 py-6">
      <div className="max-w-6xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <p className="text-sm text-muted-foreground" data-testid="text-footer-copyright">
          Script Writer Pro by Daniel Paul
        </p>
        <div className="flex gap-3 items-center" data-testid="social-links-container">
          {socialLinks.map((link) => {
            const Icon = link.icon;
            return (
              <a
                key={link.name}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-muted/50 border border-border flex items-center justify-center hover:bg-muted hover:border-primary/30 transition-all"
                title={link.name}
                data-testid={`link-social-${link.name.toLowerCase()}`}
              >
                <Icon className="w-4 h-4 text-muted-foreground hover:text-foreground" />
              </a>
            );
          })}
        </div>
      </div>
    </footer>
  );
}
