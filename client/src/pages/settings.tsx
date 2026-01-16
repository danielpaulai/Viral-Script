import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  User, 
  CreditCard, 
  BarChart3, 
  Settings as SettingsIcon,
  Crown,
  Zap,
  Building2,
  FileText,
  Search,
  BookOpen,
  ArrowUpRight,
  Calendar,
  Loader2,
  LogIn,
  AlertTriangle,
  XCircle,
  RefreshCw
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { pricingTiers } from "@shared/schema";
import { Link } from "wouter";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface UsageData {
  scriptsGenerated: number | string;
  deepResearchUsed: number | string;
  knowledgeBaseQueries: number | string;
  month: string;
}

interface SubscriptionData {
  plan: string;
  status: string;
  billingCycle: string;
  currentPeriodStart: string | null;
  currentPeriodEnd: string | null;
}

interface BillingStatus {
  hasSubscription: boolean;
  status: string | null;
  plan: string;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  trialEndsAt: string | null;
  isTrialing: boolean;
}

export default function Settings() {
  const { user, isLoading: authLoading, isAuthenticated, logoutMutation } = useAuth();
  const { toast } = useToast();

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

  const { data: subscription, isLoading: subLoading } = useQuery<SubscriptionData>({
    queryKey: ["/api/user/subscription"],
    enabled: isAuthenticated,
  });

  const { data: billingStatus, isLoading: billingLoading } = useQuery<BillingStatus>({
    queryKey: ["/api/billing/status"],
    enabled: isAuthenticated,
  });

  const startSubscriptionMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/billing/create-checkout");
      return res.json();
    },
    onSuccess: (data) => {
      if (data.url) {
        window.location.href = data.url;
      }
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to start subscription checkout", variant: "destructive" });
    },
  });

  const cancelSubscriptionMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/billing/cancel-subscription");
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Subscription Cancelled", description: "Your subscription will end at the current billing period" });
      queryClient.invalidateQueries({ queryKey: ["/api/billing/status"] });
      queryClient.invalidateQueries({ queryKey: ["/api/user/subscription"] });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to cancel subscription", variant: "destructive" });
    },
  });

  const resumeSubscriptionMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/billing/resume-subscription");
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Subscription Resumed", description: "Your subscription has been reactivated" });
      queryClient.invalidateQueries({ queryKey: ["/api/billing/status"] });
      queryClient.invalidateQueries({ queryKey: ["/api/user/subscription"] });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to resume subscription", variant: "destructive" });
    },
  });

  const openBillingPortalMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/billing/portal");
      return res.json();
    },
    onSuccess: (data) => {
      if (data.url) {
        window.location.href = data.url;
      }
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to open billing portal", variant: "destructive" });
    },
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
              Manage your account, subscription, and usage
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-6">
              Sign in to access your account settings, view usage statistics, and manage your subscription.
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

  const currentPlan = pricingTiers.find(t => t.id === (subscription?.plan || "starter")) || pricingTiers[0];
  const PlanIcon = currentPlan.id === "ultimate" ? Building2 : currentPlan.id === "pro" ? Crown : Zap;

  const scriptsLimit = currentPlan.limits.scriptsPerMonth;
  const scriptsUsed = typeof usage?.scriptsGenerated === 'string' ? parseInt(usage.scriptsGenerated, 10) : (usage?.scriptsGenerated || 0);
  const deepResearchUsed = typeof usage?.deepResearchUsed === 'string' ? parseInt(usage.deepResearchUsed, 10) : (usage?.deepResearchUsed || 0);
  const kbQueries = typeof usage?.knowledgeBaseQueries === 'string' ? parseInt(usage.knowledgeBaseQueries, 10) : (usage?.knowledgeBaseQueries || 0);
  const scriptsPercent = scriptsLimit === -1 ? 0 : Math.min((scriptsUsed / scriptsLimit) * 100, 100);

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "N/A";
    return new Date(dateStr).toLocaleDateString("en-US", { 
      month: "short", 
      day: "numeric", 
      year: "numeric" 
    });
  };

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
            <p className="text-muted-foreground">Manage your account and subscription</p>
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
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Current Plan</CardTitle>
                    <CardDescription>Your subscription details</CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    {billingStatus?.isTrialing && (
                      <Badge variant="outline" className="border-yellow-500 text-yellow-500">
                        Trial
                      </Badge>
                    )}
                    {billingStatus?.cancelAtPeriodEnd && (
                      <Badge variant="destructive">
                        Cancelling
                      </Badge>
                    )}
                    <Badge variant={billingStatus?.status === "active" || billingStatus?.status === "trialing" ? "default" : "secondary"}>
                      {billingStatus?.status || subscription?.status || "Active"}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {billingLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-5 h-5 animate-spin" />
                  </div>
                ) : (
                  <>
                    <div className="flex items-center gap-4 p-4 rounded-lg bg-muted/50">
                      <div className="p-3 rounded-full bg-primary/10">
                        <PlanIcon className="w-6 h-6 text-primary" />
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-lg" data-testid="text-current-plan">
                          {currentPlan.name}
                        </p>
                        <p className="text-muted-foreground text-sm">{currentPlan.description}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-2xl" data-testid="text-plan-price">${currentPlan.price}</p>
                        <p className="text-muted-foreground text-sm">/{subscription?.billingCycle || "month"}</p>
                      </div>
                    </div>

                    {billingStatus?.isTrialing && billingStatus?.trialEndsAt && (
                      <div className="p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                        <div className="flex items-center gap-2 text-yellow-600 dark:text-yellow-400">
                          <AlertTriangle className="w-5 h-5" />
                          <p className="font-medium">Free Trial Active</p>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          Your 7-day free trial ends on {formatDate(billingStatus.trialEndsAt)}. 
                          You'll be charged $19.99/month after the trial ends.
                        </p>
                      </div>
                    )}

                    {billingStatus?.cancelAtPeriodEnd && billingStatus?.currentPeriodEnd && (
                      <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20">
                        <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
                          <XCircle className="w-5 h-5" />
                          <p className="font-medium">Subscription Ending</p>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          Your subscription will end on {formatDate(billingStatus.currentPeriodEnd)}. 
                          You can resume your subscription before this date.
                        </p>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="mt-3"
                          onClick={() => resumeSubscriptionMutation.mutate()}
                          disabled={resumeSubscriptionMutation.isPending}
                          data-testid="button-resume-subscription"
                        >
                          {resumeSubscriptionMutation.isPending ? (
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          ) : (
                            <RefreshCw className="w-4 h-4 mr-2" />
                          )}
                          Resume Subscription
                        </Button>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Billing Cycle</p>
                        <p className="font-medium capitalize">{subscription?.billingCycle || "Monthly"}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Next Billing Date</p>
                        <p className="font-medium">{formatDate(billingStatus?.currentPeriodEnd || subscription?.currentPeriodEnd || null)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Current Period Started</p>
                        <p className="font-medium">{formatDate(subscription?.currentPeriodStart || null)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Status</p>
                        <p className="font-medium capitalize">{billingStatus?.status || subscription?.status || "Active"}</p>
                      </div>
                    </div>

                    <Separator />

                    <div className="flex flex-wrap gap-3">
                      {!billingStatus?.hasSubscription && (
                        <Button 
                          onClick={() => startSubscriptionMutation.mutate()}
                          disabled={startSubscriptionMutation.isPending}
                          className="bg-gradient-to-r from-primary to-purple-600"
                          data-testid="button-start-subscription"
                        >
                          {startSubscriptionMutation.isPending ? (
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          ) : (
                            <Crown className="w-4 h-4 mr-2" />
                          )}
                          Start Pro Subscription - 7 Day Free Trial
                        </Button>
                      )}
                      
                      {billingStatus?.hasSubscription && !billingStatus?.cancelAtPeriodEnd && (
                        <>
                          <Button 
                            variant="outline" 
                            onClick={() => openBillingPortalMutation.mutate()}
                            disabled={openBillingPortalMutation.isPending}
                            data-testid="button-manage-billing"
                          >
                            {openBillingPortalMutation.isPending ? (
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            ) : (
                              <CreditCard className="w-4 h-4 mr-2" />
                            )}
                            Manage Billing
                          </Button>
                          <Button 
                            variant="outline" 
                            className="text-red-500 hover:text-red-600 border-red-500/30 hover:border-red-500/50"
                            onClick={() => cancelSubscriptionMutation.mutate()}
                            disabled={cancelSubscriptionMutation.isPending}
                            data-testid="button-cancel-subscription"
                          >
                            {cancelSubscriptionMutation.isPending ? (
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            ) : (
                              <XCircle className="w-4 h-4 mr-2" />
                            )}
                            Cancel Subscription
                          </Button>
                        </>
                      )}
                      
                      {currentPlan.id !== "ultimate" && billingStatus?.hasSubscription && (
                        <Link href="/pricing">
                          <Button variant="outline" data-testid="button-upgrade-plan">
                            <ArrowUpRight className="w-4 h-4 mr-2" />
                            Upgrade Plan
                          </Button>
                        </Link>
                      )}
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Plan Features</CardTitle>
                <CardDescription>What's included in your {currentPlan.name} plan</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {currentPlan.features.map((feature, idx) => (
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
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Usage - {getCurrentMonth()}</CardTitle>
                    <CardDescription>Your monthly usage statistics</CardDescription>
                  </div>
                  {scriptsLimit > 0 && scriptsPercent >= 80 && (
                    <Badge variant="destructive">Approaching Limit</Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {usageLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-5 h-5 animate-spin" />
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="p-4 rounded-lg bg-muted/50 space-y-2">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <FileText className="w-4 h-4" />
                          <span className="text-sm">Scripts Generated</span>
                        </div>
                        <p className="text-2xl font-bold" data-testid="text-scripts-used">
                          {scriptsUsed}
                          {scriptsLimit > 0 && <span className="text-sm font-normal text-muted-foreground">/{scriptsLimit}</span>}
                        </p>
                        {scriptsLimit > 0 && (
                          <Progress value={scriptsPercent} className="h-2" />
                        )}
                        {scriptsLimit === -1 && (
                          <p className="text-xs text-muted-foreground">Unlimited</p>
                        )}
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

                    {scriptsLimit > 0 && scriptsPercent >= 80 && (
                      <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/20">
                        <p className="text-sm font-medium text-destructive">
                          You've used {Math.round(scriptsPercent)}% of your monthly script limit.
                        </p>
                        <p className="text-sm text-muted-foreground mt-1">
                          Upgrade your plan for unlimited scripts or wait for your limit to reset next month.
                        </p>
                        <Link href="/pricing">
                          <Button size="sm" className="mt-3" data-testid="button-upgrade-usage">
                            Upgrade for Unlimited Scripts
                          </Button>
                        </Link>
                      </div>
                    )}

                    <Separator />

                    <div className="flex flex-wrap gap-3">
                      <Button variant="outline" data-testid="button-buy-credits">
                        <Zap className="w-4 h-4 mr-2" />
                        Buy More Credits
                      </Button>
                      <Link href="/pricing">
                        <Button variant="outline" data-testid="button-view-plans">
                          View All Plans
                        </Button>
                      </Link>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Usage Limits by Plan</CardTitle>
                <CardDescription>Compare what each plan offers</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {pricingTiers.map((tier) => {
                    const TierIcon = tier.id === "ultimate" ? Building2 : tier.id === "pro" ? Crown : Zap;
                    const isCurrentPlan = tier.id === currentPlan.id;
                    const limits = tier.limits as { scriptsPerMonth: number; knowledgeBaseDocs: number; competitorAssets: number };
                    return (
                      <div 
                        key={tier.id} 
                        className={`p-4 rounded-lg border ${isCurrentPlan ? 'border-primary bg-primary/5' : 'bg-muted/30'}`}
                      >
                        <div className="flex items-center gap-2 mb-3">
                          <TierIcon className="w-4 h-4" />
                          <span className="font-medium">{tier.name}</span>
                          {isCurrentPlan && <Badge variant="secondary" className="text-xs">Current</Badge>}
                        </div>
                        <ul className="space-y-1 text-sm text-muted-foreground">
                          <li>Scripts: {limits.scriptsPerMonth === -1 ? "Unlimited" : `${limits.scriptsPerMonth}/mo`}</li>
                          <li>Knowledge Base: {limits.knowledgeBaseDocs === -1 ? "Unlimited" : limits.knowledgeBaseDocs === 0 ? "Not included" : `${limits.knowledgeBaseDocs} docs`}</li>
                          <li>Competitor Assets: {limits.competitorAssets === -1 ? "Unlimited" : limits.competitorAssets === 0 ? "Not included" : `${limits.competitorAssets}`}</li>
                        </ul>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
