import { ApifyClient } from "apify-client";

const APIFY_TOKEN = process.env.APIFY_API_TOKEN;

interface TikTokVideo {
  id: string;
  text: string;
  createTime: number;
  diggCount: number;
  commentCount: number;
  shareCount: number;
  playCount: number;
}

interface InstagramPost {
  id: string;
  caption: string;
  timestamp: string;
  likesCount: number;
  commentsCount: number;
  type: string;
}

interface ScrapedContent {
  platform: "tiktok" | "instagram";
  username: string;
  posts: Array<{
    id: string;
    text: string;
    engagement: number;
    timestamp: string;
  }>;
  totalPosts: number;
}

export async function scrapeTikTokProfile(username: string): Promise<ScrapedContent> {
  if (!APIFY_TOKEN) {
    throw new Error("APIFY_API_TOKEN is not configured");
  }

  const client = new ApifyClient({ token: APIFY_TOKEN });

  const cleanUsername = username.replace("@", "").trim();
  const profileUrl = `https://www.tiktok.com/@${cleanUsername}`;

  const input = {
    profiles: [profileUrl],
    resultsPerPage: 30,
    shouldDownloadVideos: false,
    shouldDownloadCovers: false,
    shouldDownloadSubtitles: false,
    shouldDownloadSlideshowImages: false,
  };

  const run = await client.actor("clockworks/free-tiktok-scraper").call(input);

  const { items } = await client.dataset(run.defaultDatasetId).listItems();

  const posts = (items as unknown as TikTokVideo[])
    .filter((item) => item.text)
    .map((item) => ({
      id: item.id,
      text: item.text || "",
      engagement: (item.diggCount || 0) + (item.commentCount || 0) + (item.shareCount || 0),
      timestamp: new Date(item.createTime * 1000).toISOString(),
    }))
    .sort((a, b) => b.engagement - a.engagement);

  return {
    platform: "tiktok",
    username: cleanUsername,
    posts,
    totalPosts: posts.length,
  };
}

export async function scrapeInstagramProfile(username: string): Promise<ScrapedContent> {
  if (!APIFY_TOKEN) {
    throw new Error("APIFY_API_TOKEN is not configured");
  }

  const client = new ApifyClient({ token: APIFY_TOKEN });

  const cleanUsername = username.replace("@", "").trim();

  const input = {
    directUrls: [`https://www.instagram.com/${cleanUsername}/`],
    resultsType: "posts",
    resultsLimit: 30,
    searchType: "user",
    searchLimit: 1,
  };

  const run = await client.actor("apify/instagram-scraper").call(input);

  const { items } = await client.dataset(run.defaultDatasetId).listItems();

  const posts = (items as unknown as InstagramPost[])
    .filter((item) => item.caption)
    .map((item) => ({
      id: item.id,
      text: item.caption || "",
      engagement: (item.likesCount || 0) + (item.commentsCount || 0),
      timestamp: item.timestamp || new Date().toISOString(),
    }))
    .sort((a, b) => b.engagement - a.engagement);

  return {
    platform: "instagram",
    username: cleanUsername,
    posts,
    totalPosts: posts.length,
  };
}

// Research insights from competitor analysis
export interface CompetitorInsights {
  topHooks: string[];
  commonPatterns: string[];
  audienceLanguage: string[];
  provenAngles: string[];
  engagementStats: {
    avgViews: number;
    avgLikes: number;
    avgComments: number;
  };
  contentSummary: string;
}

interface TikTokSearchResult {
  id: string;
  desc: string;
  createTime: number;
  stats: {
    diggCount: number;
    commentCount: number;
    shareCount: number;
    playCount: number;
  };
  author: {
    uniqueId: string;
    nickname: string;
  };
}

// Search TikTok for top-performing content by keyword
export async function searchTikTokByKeyword(keyword: string, limit: number = 20): Promise<{
  posts: Array<{
    id: string;
    text: string;
    views: number;
    likes: number;
    comments: number;
    shares: number;
    author: string;
  }>;
  totalFound: number;
}> {
  if (!APIFY_TOKEN) {
    throw new Error("APIFY_API_TOKEN is not configured");
  }

  const client = new ApifyClient({ token: APIFY_TOKEN });

  // Use TikTok hashtag/keyword scraper
  const input = {
    searchQueries: [keyword],
    resultsPerPage: limit,
    shouldDownloadVideos: false,
    shouldDownloadCovers: false,
    shouldDownloadSubtitles: false,
    shouldDownloadSlideshowImages: false,
  };

  try {
    const run = await client.actor("clockworks/free-tiktok-scraper").call(input, {
      waitSecs: 120,
    });

    const { items } = await client.dataset(run.defaultDatasetId).listItems();

    const posts = (items as unknown as TikTokSearchResult[])
      .filter((item) => item.desc && item.stats)
      .map((item) => ({
        id: item.id,
        text: item.desc || "",
        views: item.stats?.playCount || 0,
        likes: item.stats?.diggCount || 0,
        comments: item.stats?.commentCount || 0,
        shares: item.stats?.shareCount || 0,
        author: item.author?.uniqueId || "unknown",
      }))
      .sort((a, b) => b.views - a.views)
      .slice(0, limit);

    return {
      posts,
      totalFound: posts.length,
    };
  } catch (error) {
    console.error("TikTok search error:", error);
    return { posts: [], totalFound: 0 };
  }
}

// Analyze competitor content to extract insights
export function analyzeCompetitorContent(posts: Array<{
  text: string;
  views: number;
  likes: number;
  comments: number;
}>): CompetitorInsights {
  if (posts.length === 0) {
    return {
      topHooks: [],
      commonPatterns: [],
      audienceLanguage: [],
      provenAngles: [],
      engagementStats: { avgViews: 0, avgLikes: 0, avgComments: 0 },
      contentSummary: "No competitor data available",
    };
  }

  // Extract hooks (first lines)
  const topHooks = posts
    .map((p) => {
      const firstLine = p.text.split(/[\n.!?]/)[0]?.trim();
      return firstLine;
    })
    .filter((h) => h && h.length > 5 && h.length < 150)
    .slice(0, 8);

  // Find common phrases/patterns
  const allText = posts.map((p) => p.text).join(" ").toLowerCase();
  const words = allText.split(/\s+/);
  const bigramCount: Record<string, number> = {};
  const trigramCount: Record<string, number> = {};
  
  for (let i = 0; i < words.length - 1; i++) {
    const bigram = words.slice(i, i + 2).join(" ");
    if (bigram.length > 5) {
      bigramCount[bigram] = (bigramCount[bigram] || 0) + 1;
    }
  }
  
  for (let i = 0; i < words.length - 2; i++) {
    const trigram = words.slice(i, i + 3).join(" ");
    if (trigram.length > 8) {
      trigramCount[trigram] = (trigramCount[trigram] || 0) + 1;
    }
  }

  const commonPatterns = Object.entries(trigramCount)
    .filter(([_, count]) => count >= 2)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([phrase]) => phrase);

  // Extract audience language (questions, pain points)
  const audienceLanguage: string[] = [];
  const questionPhrases = allText.match(/(?:why|how|what|when|did you know|ever wonder)[^.!?\n]{10,60}[?]/gi) || [];
  audienceLanguage.push(...questionPhrases.slice(0, 5));

  // Extract proven angles (what the top posts focus on)
  const provenAngles = posts
    .slice(0, 5)
    .map((p) => {
      const text = p.text;
      // Get the main theme/angle
      if (text.length > 100) {
        return text.substring(0, 100) + "...";
      }
      return text;
    });

  // Calculate engagement stats
  const avgViews = Math.round(posts.reduce((sum, p) => sum + p.views, 0) / posts.length);
  const avgLikes = Math.round(posts.reduce((sum, p) => sum + p.likes, 0) / posts.length);
  const avgComments = Math.round(posts.reduce((sum, p) => sum + p.comments, 0) / posts.length);

  // Generate content summary
  const highPerformers = posts.filter((p) => p.views > avgViews);
  const contentSummary = `Found ${posts.length} top posts. Avg ${formatNumber(avgViews)} views, ${formatNumber(avgLikes)} likes. Top ${highPerformers.length} posts outperform average.`;

  return {
    topHooks,
    commonPatterns,
    audienceLanguage,
    provenAngles,
    engagementStats: { avgViews, avgLikes, avgComments },
    contentSummary,
  };
}

function formatNumber(num: number): string {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
  if (num >= 1000) return (num / 1000).toFixed(1) + "K";
  return num.toString();
}

export function analyzeCreatorStyle(content: ScrapedContent): {
  hooks: string[];
  phrases: string[];
  avgLength: number;
  styleNotes: string;
  topPerformingContent: string[];
} {
  const allText = content.posts.map((p) => p.text);
  
  const hooks = allText
    .map((text) => {
      const firstLine = text.split(/[.\n!?]/)[0];
      return firstLine?.trim();
    })
    .filter((h) => h && h.length > 10 && h.length < 200)
    .slice(0, 10);

  const words = allText.join(" ").toLowerCase().split(/\s+/);
  const phraseCount: Record<string, number> = {};
  
  for (let i = 0; i < words.length - 2; i++) {
    const phrase = words.slice(i, i + 3).join(" ");
    if (phrase.length > 8) {
      phraseCount[phrase] = (phraseCount[phrase] || 0) + 1;
    }
  }
  
  const phrases = Object.entries(phraseCount)
    .filter(([_, count]) => count >= 2)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 15)
    .map(([phrase]) => phrase);

  const avgLength = Math.round(
    allText.reduce((sum, t) => sum + t.split(/\s+/).length, 0) / allText.length
  );

  const topPerformingContent = content.posts
    .slice(0, 5)
    .map((p) => p.text);

  let styleNotes = "";
  
  const avgSentenceLength = allText
    .flatMap((t) => t.split(/[.!?]+/))
    .filter((s) => s.trim())
    .reduce((sum, s, _, arr) => sum + s.split(/\s+/).length / arr.length, 0);
  
  if (avgSentenceLength < 8) {
    styleNotes += "Uses short, punchy sentences. ";
  } else if (avgSentenceLength > 15) {
    styleNotes += "Uses longer, flowing sentences. ";
  }

  const questionCount = allText.filter((t) => t.includes("?")).length;
  if (questionCount > content.posts.length * 0.3) {
    styleNotes += "Frequently uses questions to engage. ";
  }

  const exclamationCount = allText.filter((t) => t.includes("!")).length;
  if (exclamationCount > content.posts.length * 0.5) {
    styleNotes += "High-energy tone with exclamations. ";
  }

  const youCount = allText.join(" ").toLowerCase().match(/\byou\b/g)?.length || 0;
  if (youCount > content.posts.length * 3) {
    styleNotes += "Direct address style (talks TO the viewer). ";
  }

  const iCount = allText.join(" ").toLowerCase().match(/\bi\b/g)?.length || 0;
  if (iCount > content.posts.length * 5) {
    styleNotes += "Personal storytelling approach. ";
  }

  return {
    hooks,
    phrases,
    avgLength,
    styleNotes: styleNotes.trim() || "Balanced, versatile style.",
    topPerformingContent,
  };
}
