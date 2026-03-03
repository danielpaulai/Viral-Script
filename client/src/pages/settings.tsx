import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  User, 
  CreditCard, 
  BarChart3, 
  Crown,
  FileText,
  Search,
  BookOpen,
  Loader2,
  LogIn,
  Settings as SettingsIcon,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

interface UsageData {
  scriptsGenerated: number | string;
  deepResearchUsed: number | string;
  knowledgeBaseQueries: number | string;
  month: string;
}

export default function Settings() {
  const { user, isLoading: authLoading, isAuthenticated, logoutMutation } = useAuth();

  const handleLogout = () => {
    logoutMutation.mutate(undefined, {
      onSuccess: () => {
        window.location.href = "/";
      },
    });
  };

  const { data: usage, isLoading: usageLoading } = useQuery<UsageData>({
    queryKey: ["/api/user/usage"],
    enabled: isAuthenticated,
  });

  if (authLoading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <div className="flex items-center gap-3">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span className="text-muted-foreground">Loading...</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="p-6 max-w-2xl mx-auto">
        <Card className="text-center p-8">
          <CardHeader>
            <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <SettingsIcon className="w-8 h-8 text-primary" />
            </div>
            <CardTitle className="text-2xl">Settings</CardTitle>
            <CardDescription className="text-base mt-2">
              Manage your account and usage
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-6">
              Sign in to access your account settings and view usage statistics.
            </p>
            <Button 
              onClick={() => window.location.href = "/login"}
              className="gap-2"
              data-testid="button-login-settings"
            >
              <LogIn className="w-4 h-4" />
              Sign In to Continue
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const scriptsUsed = typeof usage?.scriptsGenerated === 'string' ? parseInt(usage.scriptsGenerated, 10) : (usage?.scriptsGenerated || 0);
  const deepResearchUsed = typeof usage?.deepResearchUsed === 'string' ? parseInt(usage.deepResearchUsed, 10) : (usage?.deepResearchUsed || 0);
  const kbQueries = typeof usage?.knowledgeBaseQueries === 'string' ? parseInt(usage.knowledgeBaseQueries, 10) : (usage?.knowledgeBaseQueries || 0);

  const getCurrentMonth = () => {
    const now = new Date();
    return now.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  };

  return (
    <div className="min-h-full p-6 bg-background">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold" data-testid="text-settings-title">Settings</h1>
            <p className="text-muted-foreground">Manage your account</p>
          </div>
          <Button 
            variant="outline" 
            onClick={handleLogout} 
            disabled={logoutMutation.isPending}
            data-testid="button-logout"
          >
            {logoutMutation.isPending ? "Signing out..." : "Sign Out"}
          </Button>
        </div>

        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList data-testid="tabs-settings">
            <TabsTrigger value="profile" data-testid="tab-profile">
              <User className="w-4 h-4 mr-2" />
              Profile
            </TabsTrigger>
            <TabsTrigger value="subscription" data-testid="tab-subscription">
              <CreditCard className="w-4 h-4 mr-2" />
              Subscription
            </TabsTrigger>
            <TabsTrigger value="usage" data-testid="tab-usage">
              <BarChart3 className="w-4 h-4 mr-2" />
              Usage
            </TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Profile Information</CardTitle>
                <CardDescription>Your account details from Replit</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center gap-4">
                  <Avatar className="w-16 h-16">
                    <AvatarImage src={user?.profileImageUrl || ""} alt={user?.firstName || "User"} />
                    <AvatarFallback className="text-lg">
                      {user?.firstName?.[0]}{user?.lastName?.[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium text-lg" data-testid="text-user-name">
                      {user?.firstName} {user?.lastName}
                    </p>
                    <p className="text-muted-foreground" data-testid="text-user-email">
                      {user?.email || "No email provided"}
                    </p>
                  </div>
                </div>

                <Separator />

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">First Name</p>
                    <p className="font-medium">{user?.firstName || "Not set"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Last Name</p>
                    <p className="font-medium">{user?.lastName || "Not set"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Email</p>
                    <p className="font-medium">{user?.email || "Not set"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">User ID</p>
                    <p className="font-medium font-mono text-xs">{user?.id?.slice(0, 16)}...</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="subscription" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Current Plan</CardTitle>
                <CardDescription>Your plan details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center gap-4 p-4 rounded-lg bg-muted/50">
                  <div className="p-3 rounded-full bg-primary/10">
                    <Crown className="w-6 h-6 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-lg" data-testid="text-current-plan">
                      Free Plan
                    </p>
                    <p className="text-muted-foreground text-sm">All features are completely free</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-2xl" data-testid="text-plan-price">$0</p>
                    <p className="text-muted-foreground text-sm">forever</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Included Features</CardTitle>
                <CardDescription>Everything is included for free</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {["Unlimited script generation", "AI-powered scripts", "Clone Video Format", "Deep Research mode", "Knowledge Base", "Competitive Analysis", "Voice DNA / Style Import", "All video types & formats"].map((feature, idx) => (
                    <li key={idx} className="flex items-center gap-2 text-sm">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="usage" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Usage - {getCurrentMonth()}</CardTitle>
                <CardDescription>Your monthly usage statistics</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {usageLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-5 h-5 animate-spin" />
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 rounded-lg bg-muted/50 space-y-2">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <FileText className="w-4 h-4" />
                        <span className="text-sm">Scripts Generated</span>
                      </div>
                      <p className="text-2xl font-bold" data-testid="text-scripts-used">
                        {scriptsUsed}
                      </p>
                      <p className="text-xs text-muted-foreground">Unlimited</p>
                    </div>

                    <div className="p-4 rounded-lg bg-muted/50 space-y-2">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Search className="w-4 h-4" />
                        <span className="text-sm">Deep Research</span>
                      </div>
                      <p className="text-2xl font-bold" data-testid="text-research-used">
                        {deepResearchUsed}
                      </p>
                      <p className="text-xs text-muted-foreground">Research queries this month</p>
                    </div>

                    <div className="p-4 rounded-lg bg-muted/50 space-y-2">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <BookOpen className="w-4 h-4" />
                        <span className="text-sm">Knowledge Base</span>
                      </div>
                      <p className="text-2xl font-bold" data-testid="text-kb-queries">
                        {kbQueries}
                      </p>
                      <p className="text-xs text-muted-foreground">KB-enhanced scripts</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
