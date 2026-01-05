import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { SiTiktok, SiInstagram } from "react-icons/si";
import {
  Search,
  Loader2,
  TrendingUp,
  Eye,
  Heart,
  MessageCircle,
  ExternalLink,
  Filter,
  BarChart3,
  Users,
  Calendar,
  Flame,
  ArrowUpRight,
  Play,
  Grid3X3,
  List,
  X,
} from "lucide-react";
import type { CompetitorVideo, CompetitiveSearchResult } from "@shared/schema";

function formatNumber(num: number): string {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
  if (num >= 1000) return (num / 1000).toFixed(1) + "K";
  return num.toString();
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "1d ago";
  if (diffDays < 7) return `${diffDays}d ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)}mo ago`;
  return `${Math.floor(diffDays / 365)}y ago`;
}

function getOutlierColor(score: number): string {
  if (score >= 5) return "text-green-400";
  if (score >= 2) return "text-yellow-400";
  if (score >= 1) return "text-blue-400";
  return "text-muted-foreground";
}

function getOutlierBgColor(score: number): string {
  if (score >= 5) return "bg-green-500/20 border-green-500/30";
  if (score >= 2) return "bg-yellow-500/20 border-yellow-500/30";
  if (score >= 1) return "bg-blue-500/20 border-blue-500/30";
  return "bg-muted/50";
}

interface VideoCardProps {
  video: CompetitorVideo;
  viewMode: "grid" | "list";
}

function VideoCard({ video, viewMode }: VideoCardProps) {
  const isGrid = viewMode === "grid";
  
  return (
    <Card 
      className={`overflow-hidden group hover-elevate cursor-pointer ${
        isGrid ? "" : "flex flex-row"
      }`}
      onClick={() => window.open(video.videoUrl, "_blank")}
      data-testid={`card-video-${video.id}`}
    >
      <div className={`relative ${isGrid ? "aspect-[9/16]" : "w-32 h-48 flex-shrink-0"}`}>
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/80" />
        
        {video.thumbnailUrl ? (
          <img 
            src={video.thumbnailUrl} 
            alt={video.caption}
            className="w-full h-full object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = "none";
            }}
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
            <Play className="w-8 h-8 text-primary/50" />
          </div>
        )}
        
        <div className="absolute top-2 right-2">
          {video.platform === "instagram" ? (
            <SiInstagram className="w-5 h-5 text-white drop-shadow-lg" />
          ) : (
            <SiTiktok className="w-5 h-5 text-white drop-shadow-lg" />
          )}
        </div>
        
        <div className="absolute bottom-2 left-2 right-2 space-y-1">
          <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-bold ${getOutlierBgColor(video.outlierScore)}`}>
            <ArrowUpRight className={`w-3 h-3 ${getOutlierColor(video.outlierScore)}`} />
            <span className={getOutlierColor(video.outlierScore)}>{video.outlierScore}x</span>
          </div>
          <div className="flex items-center gap-2 text-white text-xs">
            <span className="flex items-center gap-1">
              <Eye className="w-3 h-3" />
              {formatNumber(video.views)}
            </span>
            <span className="flex items-center gap-1">
              <Heart className="w-3 h-3" />
              {formatNumber(video.likes)}
            </span>
            <span className="flex items-center gap-1 text-green-400">
              <TrendingUp className="w-3 h-3" />
              {video.engagementRate}%
            </span>
          </div>
        </div>
        
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <ExternalLink className="w-8 h-8 text-white" />
        </div>
      </div>
      
      <div className={`p-3 ${isGrid ? "" : "flex-1"}`}>
        <p className="text-sm font-medium text-foreground line-clamp-2 mb-2">
          {video.caption || "No caption"}
        </p>
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <span className="text-xs text-muted-foreground">{video.creatorHandle}</span>
          <span className="text-xs text-muted-foreground">{formatDate(video.postedAt)}</span>
        </div>
        {video.hookType && (
          <Badge variant="outline" className="mt-2 text-xs">
            {video.hookType}
          </Badge>
        )}
      </div>
    </Card>
  );
}

export default function CompetitivePage() {
  const { toast } = useToast();
  const [keyword, setKeyword] = useState("");
  const [profileUrl, setProfileUrl] = useState("");
  const [platforms, setPlatforms] = useState<string[]>(["tiktok", "instagram"]);
  const [results, setResults] = useState<CompetitiveSearchResult | null>(null);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [activeTab, setActiveTab] = useState("keyword");
  
  const [filters, setFilters] = useState({
    minOutlier: 1,
    sortBy: "views" as "views" | "engagement" | "outlier" | "date",
    selectedChannels: [] as string[],
  });

  const searchMutation = useMutation({
    mutationFn: async (data: { keyword: string; platforms: string[] }) => {
      const res = await apiRequest("POST", "/api/competitive/search", data);
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Search failed");
      }
      return res.json() as Promise<CompetitiveSearchResult>;
    },
    onSuccess: (data) => {
      setResults(data);
      toast({
        title: "Search complete",
        description: `Found ${data.videos.length} videos from ${data.profiles.length} creators`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Search failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const profileMutation = useMutation({
    mutationFn: async (data: { profileUrl: string }) => {
      const res = await apiRequest("POST", "/api/competitive/profile", data);
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Profile analysis failed");
      }
      return res.json();
    },
    onSuccess: (data) => {
      setResults({
        query: data.profile.handle,
        platforms: [data.profile.platform],
        totalResults: data.videos.length,
        profiles: [data.profile],
        videos: data.videos,
        analytics: {
          avgViews: data.profile.avgViews,
          avgEngagement: data.profile.avgEngagement,
          dominantFormats: [],
          bestPerformingDuration: "",
          topHookTypes: [],
        },
        searchedAt: data.analyzedAt,
      });
      toast({
        title: "Profile analyzed",
        description: `Found ${data.videos.length} videos from ${data.profile.handle}`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Analysis failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSearch = () => {
    if (!keyword.trim()) {
      toast({
        title: "Enter a keyword",
        description: "Please enter a topic or keyword to search for",
        variant: "destructive",
      });
      return;
    }
    searchMutation.mutate({ keyword: keyword.trim(), platforms });
  };

  const handleProfileAnalysis = () => {
    if (!profileUrl.trim()) {
      toast({
        title: "Enter a profile URL",
        description: "Please enter an Instagram or TikTok profile URL",
        variant: "destructive",
      });
      return;
    }
    profileMutation.mutate({ profileUrl: profileUrl.trim() });
  };

  const togglePlatform = (platform: string) => {
    if (platforms.includes(platform)) {
      if (platforms.length > 1) {
        setPlatforms(platforms.filter(p => p !== platform));
      }
    } else {
      setPlatforms([...platforms, platform]);
    }
  };

  const filteredVideos = results?.videos.filter(video => {
    if (video.outlierScore < filters.minOutlier) return false;
    if (filters.selectedChannels.length > 0 && !filters.selectedChannels.includes(video.creatorHandle)) return false;
    return true;
  }).sort((a, b) => {
    switch (filters.sortBy) {
      case "engagement": return b.engagementRate - a.engagementRate;
      case "outlier": return b.outlierScore - a.outlierScore;
      case "date": return new Date(b.postedAt).getTime() - new Date(a.postedAt).getTime();
      default: return b.views - a.views;
    }
  }) || [];

  const isLoading = searchMutation.isPending || profileMutation.isPending;

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold text-foreground" data-testid="heading-competitive">
          Competitive Video Analysis
        </h1>
        <p className="text-muted-foreground">
          Discover what's going viral in your niche and why it's working
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="keyword" data-testid="tab-keyword">
            <Search className="w-4 h-4 mr-2" />
            Keyword Search
          </TabsTrigger>
          <TabsTrigger value="profile" data-testid="tab-profile">
            <Users className="w-4 h-4 mr-2" />
            Competitor Profile
          </TabsTrigger>
        </TabsList>

        <TabsContent value="keyword" className="space-y-4 mt-4">
          <Card>
            <CardContent className="p-4 space-y-4">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <Input
                    placeholder="Search for videos by topic (e.g., AI Branding for Founders)"
                    value={keyword}
                    onChange={(e) => setKeyword(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                    className="h-11"
                    data-testid="input-keyword"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1 border rounded-md p-1">
                    <Button
                      variant={platforms.includes("tiktok") ? "secondary" : "ghost"}
                      size="sm"
                      onClick={() => togglePlatform("tiktok")}
                      data-testid="button-platform-tiktok"
                    >
                      <SiTiktok className="w-4 h-4 mr-1.5" />
                      TikTok
                    </Button>
                    <Button
                      variant={platforms.includes("instagram") ? "secondary" : "ghost"}
                      size="sm"
                      onClick={() => togglePlatform("instagram")}
                      data-testid="button-platform-instagram"
                    >
                      <SiInstagram className="w-4 h-4 mr-1.5" />
                      Instagram
                    </Button>
                  </div>
                  <Button 
                    onClick={handleSearch} 
                    disabled={isLoading}
                    className="h-11"
                    data-testid="button-search"
                  >
                    {isLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <Search className="w-4 h-4 mr-2" />
                        Search
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="profile" className="space-y-4 mt-4">
          <Card>
            <CardContent className="p-4 space-y-4">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <Input
                    placeholder="Paste competitor profile URL (e.g., https://tiktok.com/@username)"
                    value={profileUrl}
                    onChange={(e) => setProfileUrl(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleProfileAnalysis()}
                    className="h-11"
                    data-testid="input-profile-url"
                  />
                </div>
                <Button 
                  onClick={handleProfileAnalysis} 
                  disabled={isLoading}
                  className="h-11"
                  data-testid="button-analyze-profile"
                >
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <Users className="w-4 h-4 mr-2" />
                      Analyze Profile
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {results && (
        <>
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
            <div className="flex items-center gap-4 flex-wrap">
              <Badge variant="secondary" className="text-sm">
                {results.query}
              </Badge>
              <span className="text-sm text-muted-foreground">
                {filteredVideos.length} videos from {results.profiles.length} channels
              </span>
            </div>
            
            <div className="flex items-center gap-2 flex-wrap">
              <Select 
                value={String(filters.minOutlier)} 
                onValueChange={(v) => setFilters({ ...filters, minOutlier: Number(v) })}
              >
                <SelectTrigger className="w-[140px]" data-testid="select-outlier">
                  <Flame className="w-4 h-4 mr-2 text-orange-500" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">&gt; 1x outlier</SelectItem>
                  <SelectItem value="2">&gt; 2x outlier</SelectItem>
                  <SelectItem value="5">&gt; 5x outlier</SelectItem>
                  <SelectItem value="10">&gt; 10x outlier</SelectItem>
                </SelectContent>
              </Select>
              
              <Select 
                value={filters.sortBy} 
                onValueChange={(v) => setFilters({ ...filters, sortBy: v as any })}
              >
                <SelectTrigger className="w-[140px]" data-testid="select-sort">
                  <BarChart3 className="w-4 h-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="views">Views</SelectItem>
                  <SelectItem value="engagement">Engagement</SelectItem>
                  <SelectItem value="outlier">Outlier Score</SelectItem>
                  <SelectItem value="date">Posted Date</SelectItem>
                </SelectContent>
              </Select>

              <div className="flex items-center border rounded-md">
                <Button
                  variant={viewMode === "grid" ? "secondary" : "ghost"}
                  size="icon"
                  onClick={() => setViewMode("grid")}
                  data-testid="button-view-grid"
                >
                  <Grid3X3 className="w-4 h-4" />
                </Button>
                <Button
                  variant={viewMode === "list" ? "secondary" : "ghost"}
                  size="icon"
                  onClick={() => setViewMode("list")}
                  data-testid="button-view-list"
                >
                  <List className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>

          {results.analytics && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="p-2 rounded-md bg-blue-500/10">
                    <Eye className="w-5 h-5 text-blue-500" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Avg Views</p>
                    <p className="text-lg font-bold">{formatNumber(results.analytics.avgViews)}</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="p-2 rounded-md bg-green-500/10">
                    <TrendingUp className="w-5 h-5 text-green-500" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Avg Engagement</p>
                    <p className="text-lg font-bold">{results.analytics.avgEngagement}%</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="p-2 rounded-md bg-purple-500/10">
                    <Users className="w-5 h-5 text-purple-500" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Creators</p>
                    <p className="text-lg font-bold">{results.profiles.length}</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="p-2 rounded-md bg-orange-500/10">
                    <Flame className="w-5 h-5 text-orange-500" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Top Formats</p>
                    <p className="text-sm font-medium truncate">
                      {results.analytics.dominantFormats.slice(0, 2).join(", ") || "Mixed"}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {filteredVideos.length > 0 ? (
            <div className={
              viewMode === "grid" 
                ? "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4"
                : "space-y-4"
            }>
              {filteredVideos.map((video) => (
                <VideoCard key={video.id} video={video as CompetitorVideo} viewMode={viewMode} />
              ))}
            </div>
          ) : (
            <Card className="p-8 text-center">
              <p className="text-muted-foreground">No videos match your filters</p>
            </Card>
          )}
        </>
      )}

      {!results && !isLoading && (
        <Card className="p-12 text-center">
          <div className="space-y-4">
            <div className="w-16 h-16 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
              <Search className="w-8 h-8 text-primary" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">Search for viral content</h3>
              <p className="text-muted-foreground mt-1">
                Enter a keyword to discover top-performing videos in your niche
              </p>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
