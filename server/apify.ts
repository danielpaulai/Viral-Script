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
