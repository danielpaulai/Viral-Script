import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Users, 
  FileText, 
  TrendingUp, 
  UserPlus,
  Activity,
  Crown,
  Zap,
  Calendar,
  BarChart3,
  ArrowUpRight,
  ArrowDownRight
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { format } from "date-fns";

interface UserDetail {
  id: string;
  email: string;
  username: string | null;
  plan: string;
  tier: string;
  scriptsUsed: number;
  scriptsGenerated?: number;
  trialDaysRemaining: number;
  trialEndsAt: string | null;
  createdAt: string;
  source?: string;
}

interface AnalyticsData {
  users: {
    total: number;
    newToday: number;
    newThisWeek: number;
    newThisMonth: number;
  };
  scripts: {
    total: number;
    usersWithScripts: number;
    scriptsToday: number;
    scriptsThisWeek: number;
  };
  dailySignups: Array<{
    date: string;
    count: number;
  }>;
  subscriptions: Array<{
    tier: string;
    count: number;
  }>;
  recentUsers: UserDetail[];
  allUsers: UserDetail[];
  activeUsers: Array<{
    id: string;
    email: string;
    username: string | null;
    scriptCount: number;
  }>;
  generatedAt: string;
}

const TIER_COLORS: Record<string, string> = {
  trial: "#94a3b8",
  starter: "#3b82f6",
  pro: "#8b5cf6",
  ultimate: "#f59e0b",
};

function StatCard({ 
  title, 
  value, 
  subValue, 
  icon: Icon, 
  trend,
  trendLabel 
}: { 
  title: string; 
  value: number | string; 
  subValue?: string;
  icon: any; 
  trend?: "up" | "down" | "neutral";
  trendLabel?: string;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {(subValue || trendLabel) && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
            {trend === "up" && <ArrowUpRight className="h-3 w-3 text-green-500" />}
            {trend === "down" && <ArrowDownRight className="h-3 w-3 text-red-500" />}
            <span className={trend === "up" ? "text-green-500" : trend === "down" ? "text-red-500" : ""}>
              {trendLabel || subValue}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="pb-2">
              <Skeleton className="h-4 w-24" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16" />
              <Skeleton className="h-3 w-20 mt-2" />
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <Skeleton className="h-5 w-32" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-[200px] w-full" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <Skeleton className="h-5 w-32" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-[200px] w-full" />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function Admin() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();

  const { data: analytics, isLoading, error } = useQuery<AnalyticsData>({
    queryKey: ["/api/admin/analytics"],
    enabled: isAuthenticated,
    refetchInterval: 60000,
  });

  if (authLoading) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <BarChart3 className="h-6 w-6" />
            Admin Analytics
          </h1>
          <p className="text-muted-foreground">Platform usage and user statistics</p>
        </div>
        <LoadingSkeleton />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <Card className="p-8 text-center">
          <CardHeader>
            <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <BarChart3 className="w-8 h-8 text-primary" />
            </div>
            <CardTitle className="text-2xl">Admin Analytics</CardTitle>
            <CardDescription className="text-base mt-2">
              Platform usage and user statistics
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-6">
              Sign in to access the admin analytics dashboard.
            </p>
            <a 
              href="/login"
              className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90"
              data-testid="button-login-admin"
            >
              Sign In to Continue
            </a>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <BarChart3 className="h-6 w-6" />
            Admin Analytics
          </h1>
          <p className="text-muted-foreground">Platform usage and user statistics</p>
        </div>
        <LoadingSkeleton />
      </div>
    );
  }

  if (error || !analytics) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <Card className="p-8 text-center">
          <CardTitle>Unable to load analytics</CardTitle>
          <CardDescription className="mt-2">
            {error ? "An error occurred while loading analytics." : "Please try again later"}
          </CardDescription>
        </Card>
      </div>
    );
  }

  const chartData = analytics.dailySignups.map(d => ({
    date: format(new Date(d.date), "MMM d"),
    signups: d.count,
  }));

  const pieData = analytics.subscriptions.map(s => ({
    name: s.tier.charAt(0).toUpperCase() + s.tier.slice(1),
    value: s.count,
    color: TIER_COLORS[s.tier] || "#94a3b8",
  }));

  const getTierBadgeVariant = (tier: string) => {
    switch (tier) {
      case "ultimate": return "default";
      case "pro": return "secondary";
      default: return "outline";
    }
  };

  const formatTierName = (tier: string) => {
    return tier.charAt(0).toUpperCase() + tier.slice(1);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <BarChart3 className="h-6 w-6" />
            Admin Analytics
          </h1>
          <p className="text-muted-foreground">Platform usage and user statistics</p>
        </div>
        <Badge variant="outline" className="gap-1">
          <Activity className="h-3 w-3" />
          Live
        </Badge>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Users"
          value={analytics.users.total}
          icon={Users}
          trend="up"
          trendLabel={`+${analytics.users.newThisWeek} this week`}
        />
        <StatCard
          title="New Today"
          value={analytics.users.newToday}
          icon={UserPlus}
          subValue="new signups"
        />
        <StatCard
          title="Scripts Generated"
          value={analytics.scripts.total}
          icon={FileText}
          trend="up"
          trendLabel={`+${analytics.scripts.scriptsThisWeek} this week`}
        />
        <StatCard
          title="Active Creators"
          value={analytics.scripts.usersWithScripts}
          icon={TrendingUp}
          subValue={`${Math.round((analytics.scripts.usersWithScripts / Math.max(analytics.users.total, 1)) * 100)}% of users`}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              User Signups (Last 30 Days)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="signupGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis 
                    dataKey="date" 
                    tick={{ fontSize: 12 }}
                    tickLine={false}
                    axisLine={false}
                    className="text-muted-foreground"
                  />
                  <YAxis 
                    tick={{ fontSize: 12 }}
                    tickLine={false}
                    axisLine={false}
                    className="text-muted-foreground"
                    allowDecimals={false}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "6px",
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="signups"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    fill="url(#signupGradient)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[220px] flex items-center justify-center text-muted-foreground">
                No signup data available
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Crown className="h-4 w-4" />
              Subscription Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <ResponsiveContainer width={140} height={140}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={65}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="flex-1 space-y-2">
                {pieData.map((item) => (
                  <div key={item.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: item.color }}
                      />
                      <span className="text-sm">{item.name}</span>
                    </div>
                    <span className="text-sm font-medium">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <UserPlus className="h-4 w-4" />
              Recent Users
            </CardTitle>
            <CardDescription>Latest signups</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {analytics.recentUsers.map((user) => (
                <div 
                  key={user.id} 
                  className="flex items-center justify-between py-2 border-b border-border last:border-0"
                  data-testid={`user-row-${user.id}`}
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {user.username || user.email?.split("@")[0] || "User"}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                  </div>
                  <div className="flex items-center gap-2 ml-2">
                    <Badge variant={getTierBadgeVariant(user.tier)} className="text-xs">
                      {user.tier === "ultimate" && <Crown className="h-3 w-3 mr-1" />}
                      {user.tier === "pro" && <Zap className="h-3 w-3 mr-1" />}
                      {formatTierName(user.tier)}
                    </Badge>
                  </div>
                </div>
              ))}
              {analytics.recentUsers.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">No users yet</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Most Active Users
            </CardTitle>
            <CardDescription>By scripts generated</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {analytics.activeUsers.map((user, index) => (
                <div 
                  key={user.id} 
                  className="flex items-center justify-between py-2 border-b border-border last:border-0"
                  data-testid={`active-user-row-${user.id}`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium">
                      {index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {user.username || user.email?.split("@")[0] || "User"}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                    </div>
                  </div>
                  <Badge variant="secondary" className="ml-2">
                    <FileText className="h-3 w-3 mr-1" />
                    {user.scriptCount}
                  </Badge>
                </div>
              ))}
              {analytics.activeUsers.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">No activity yet</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed User Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Users className="h-4 w-4" />
            All Users - Detailed View
          </CardTitle>
          <CardDescription>Scripts used, trial status, and plan information</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-2 font-medium text-muted-foreground">User</th>
                  <th className="text-left py-3 px-2 font-medium text-muted-foreground">Plan</th>
                  <th className="text-center py-3 px-2 font-medium text-muted-foreground">Scripts</th>
                  <th className="text-center py-3 px-2 font-medium text-muted-foreground">Trial Days Left</th>
                  <th className="text-left py-3 px-2 font-medium text-muted-foreground">Joined</th>
                </tr>
              </thead>
              <tbody>
                {(analytics.allUsers || analytics.recentUsers).map((user) => {
                  const isTrialExpired = user.trialDaysRemaining <= 0 && user.plan === 'starter';
                  const isTrialActive = user.trialDaysRemaining > 0 && user.plan === 'starter';
                  const isPaidPlan = user.plan === 'pro' || user.plan === 'ultimate' || user.plan === 'agency' || user.plan === 'admin';
                  
                  return (
                    <tr 
                      key={user.id} 
                      className="border-b border-border last:border-0 hover:bg-muted/50"
                      data-testid={`detailed-user-row-${user.id}`}
                    >
                      <td className="py-3 px-2">
                        <div className="flex flex-col">
                          <span className="font-medium truncate max-w-[200px]">
                            {user.username || user.email?.split("@")[0] || "User"}
                          </span>
                          <span className="text-xs text-muted-foreground truncate max-w-[200px]">
                            {user.email}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-2">
                        <Badge 
                          variant={isPaidPlan ? "default" : "outline"}
                          className={`text-xs ${
                            user.plan === 'ultimate' ? 'bg-amber-500 hover:bg-amber-600' :
                            user.plan === 'pro' ? 'bg-purple-500 hover:bg-purple-600' :
                            user.plan === 'agency' ? 'bg-blue-500 hover:bg-blue-600' :
                            ''
                          }`}
                        >
                          {user.plan === "ultimate" && <Crown className="h-3 w-3 mr-1" />}
                          {user.plan === "pro" && <Zap className="h-3 w-3 mr-1" />}
                          {formatTierName(user.plan)}
                        </Badge>
                      </td>
                      <td className="py-3 px-2 text-center">
                        {user.plan === 'admin' || user.plan === 'pro' || user.plan === 'ultimate' || user.plan === 'agency' ? (
                          <span className="font-mono font-medium text-foreground">
                            {user.scriptsUsed}
                          </span>
                        ) : (
                          <span className={`font-mono font-medium ${
                            user.scriptsUsed >= 20 ? 'text-red-500' :
                            user.scriptsUsed >= 15 ? 'text-amber-500' :
                            'text-foreground'
                          }`}>
                            {user.scriptsUsed}/20
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-2 text-center">
                        {isPaidPlan ? (
                          <Badge variant="secondary" className="text-xs bg-green-500/20 text-green-400">
                            Paid
                          </Badge>
                        ) : isTrialExpired ? (
                          <Badge variant="destructive" className="text-xs">
                            Expired
                          </Badge>
                        ) : isTrialActive ? (
                          <span className={`font-mono font-medium ${
                            user.trialDaysRemaining <= 2 ? 'text-red-500' :
                            user.trialDaysRemaining <= 4 ? 'text-amber-500' :
                            'text-green-500'
                          }`}>
                            {user.trialDaysRemaining} days
                          </span>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </td>
                      <td className="py-3 px-2 text-muted-foreground">
                        {format(new Date(user.createdAt), "MMM d, yyyy")}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {(!analytics.allUsers || analytics.allUsers.length === 0) && (
              <p className="text-sm text-muted-foreground text-center py-4">No users found</p>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="text-xs text-muted-foreground text-center">
        Last updated: {format(new Date(analytics.generatedAt), "MMM d, yyyy h:mm a")}
      </div>
    </div>
  );
}
