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

// Research growing creators for a topic - find real examples with growth metrics
export interface CreatorGrowthData {
  username: string;
  platform: "tiktok" | "instagram";
  contentSample: string;
  views: number;
  likes: number;
  engagementRate: number;
  tacticsUsed: string[];
  toolsMentioned: string[];
}

export interface TopicResearchResult {
  growingCreators: CreatorGrowthData[];
  workingStrategies: string[];
  toolsAndAutomations: string[];
  trendingAngles: string[];
  avgEngagement: number;
  researchTimestamp: string;
}

// Extract tactics and tools from content
function extractTacticsAndTools(text: string): { tactics: string[], tools: string[] } {
  const tactics: string[] = [];
  const tools: string[] = [];
  
  const lowerText = text.toLowerCase();
  
  // Common automation/tools
  const toolPatterns = [
    { pattern: /manychat|many chat/gi, tool: "ManyChat" },
    { pattern: /dm automation/gi, tool: "DM Automation" },
    { pattern: /chatgpt|chat gpt/gi, tool: "ChatGPT" },
    { pattern: /canva/gi, tool: "Canva" },
    { pattern: /capcut|cap cut/gi, tool: "CapCut" },
    { pattern: /notion/gi, tool: "Notion" },
    { pattern: /calendly/gi, tool: "Calendly" },
    { pattern: /stan store|stan\.store/gi, tool: "Stan Store" },
    { pattern: /linktree|link tree/gi, tool: "Linktree" },
    { pattern: /beacons/gi, tool: "Beacons" },
    { pattern: /gumroad/gi, tool: "Gumroad" },
    { pattern: /kajabi/gi, tool: "Kajabi" },
    { pattern: /teachable/gi, tool: "Teachable" },
    { pattern: /convertkit/gi, tool: "ConvertKit" },
    { pattern: /mailchimp/gi, tool: "Mailchimp" },
    { pattern: /substack/gi, tool: "Substack" },
    { pattern: /later/gi, tool: "Later (Scheduling)" },
    { pattern: /buffer/gi, tool: "Buffer" },
    { pattern: /hootsuite/gi, tool: "Hootsuite" },
    { pattern: /opus clip/gi, tool: "Opus Clip" },
    { pattern: /descript/gi, tool: "Descript" },
    { pattern: /riverside/gi, tool: "Riverside.fm" },
  ];
  
  // Common tactics/strategies
  const tacticPatterns = [
    { pattern: /hook.{0,10}(first|opening|3 sec)/gi, tactic: "Strong hook in first 3 seconds" },
    { pattern: /carousel/gi, tactic: "Carousel posts" },
    { pattern: /collab|collaboration/gi, tactic: "Creator collaborations" },
    { pattern: /duet|stitch/gi, tactic: "Duets/Stitches with trending content" },
    { pattern: /trending (sound|audio)/gi, tactic: "Using trending sounds" },
    { pattern: /comment (back|reply|response)/gi, tactic: "Replying to comments" },
    { pattern: /post.{0,10}(daily|every day|3x|twice)/gi, tactic: "Consistent posting schedule" },
    { pattern: /dm.{0,10}(free|guide|resource)/gi, tactic: "DM for freebie strategy" },
    { pattern: /lead magnet/gi, tactic: "Lead magnet funnel" },
    { pattern: /story.{0,10}(engagement|poll|question)/gi, tactic: "Story engagement tactics" },
    { pattern: /live.{0,10}(stream|weekly|daily)/gi, tactic: "Regular live streams" },
    { pattern: /series|episode/gi, tactic: "Content series format" },
    { pattern: /(3|5|7).{0,10}steps/gi, tactic: "Step-by-step breakdown format" },
    { pattern: /behind the scenes|bts/gi, tactic: "Behind-the-scenes content" },
    { pattern: /faceless/gi, tactic: "Faceless content strategy" },
    { pattern: /repurpos/gi, tactic: "Content repurposing" },
    { pattern: /batch.{0,10}(content|create|record)/gi, tactic: "Batch content creation" },
  ];
  
  for (const { pattern, tool } of toolPatterns) {
    if (pattern.test(lowerText)) {
      tools.push(tool);
    }
  }
  
  for (const { pattern, tactic } of tacticPatterns) {
    if (pattern.test(lowerText)) {
      tactics.push(tactic);
    }
  }
  
  return { tactics: Array.from(new Set(tactics)), tools: Array.from(new Set(tools)) };
}

// Research top creators for a specific topic
export async function researchGrowingCreators(topic: string, limit: number = 20): Promise<TopicResearchResult> {
  if (!APIFY_TOKEN) {
    throw new Error("APIFY_API_TOKEN is not configured");
  }

  const client = new ApifyClient({ token: APIFY_TOKEN });
  
  // Generate search keywords from topic
  const keywords = [
    topic,
    `${topic} tips`,
    `${topic} strategy`,
    `${topic} growth`,
  ].slice(0, 2);
  
  const allPosts: Array<{
    id: string;
    text: string;
    views: number;
    likes: number;
    comments: number;
    shares: number;
    author: string;
    engagementRate: number;
  }> = [];
  
  try {
    for (const keyword of keywords) {
      const input = {
        searchQueries: [keyword],
        resultsPerPage: Math.ceil(limit / keywords.length),
        shouldDownloadVideos: false,
        shouldDownloadCovers: false,
        shouldDownloadSubtitles: false,
        shouldDownloadSlideshowImages: false,
      };

      const run = await client.actor("clockworks/free-tiktok-scraper").call(input, {
        waitSecs: 120,
      });

      const { items } = await client.dataset(run.defaultDatasetId).listItems();

      const posts = (items as unknown as TikTokSearchResult[])
        .filter((item) => item.desc && item.stats && item.stats.playCount > 10000)
        .map((item) => {
          const views = item.stats?.playCount || 0;
          const likes = item.stats?.diggCount || 0;
          const engagementRate = views > 0 ? ((likes + (item.stats?.commentCount || 0)) / views) * 100 : 0;
          return {
            id: item.id,
            text: item.desc || "",
            views,
            likes,
            comments: item.stats?.commentCount || 0,
            shares: item.stats?.shareCount || 0,
            author: item.author?.uniqueId || "unknown",
            engagementRate,
          };
        });
      
      allPosts.push(...posts);
    }
    
    // Sort by engagement rate and views
    allPosts.sort((a, b) => (b.views * b.engagementRate) - (a.views * a.engagementRate));
    
    // Dedupe by author, keep best post per creator
    const seenAuthors = new Set<string>();
    const uniquePosts = allPosts.filter(p => {
      if (seenAuthors.has(p.author)) return false;
      seenAuthors.add(p.author);
      return true;
    }).slice(0, 15);
    
    // Extract growing creators with their tactics
    const growingCreators: CreatorGrowthData[] = uniquePosts.map(post => {
      const { tactics, tools } = extractTacticsAndTools(post.text);
      return {
        username: post.author,
        platform: "tiktok" as const,
        contentSample: post.text.slice(0, 200),
        views: post.views,
        likes: post.likes,
        engagementRate: Math.round(post.engagementRate * 100) / 100,
        tacticsUsed: tactics,
        toolsMentioned: tools,
      };
    });
    
    // Aggregate working strategies and tools
    const allTactics: string[] = [];
    const allTools: string[] = [];
    const trendingAngles: string[] = [];
    
    for (const creator of growingCreators) {
      allTactics.push(...creator.tacticsUsed);
      allTools.push(...creator.toolsMentioned);
    }
    
    // Get top hooks as trending angles
    trendingAngles.push(...uniquePosts.slice(0, 8).map(p => {
      const firstLine = p.text.split(/[\n.!?]/)[0]?.trim();
      return firstLine?.slice(0, 100) || "";
    }).filter(Boolean));
    
    // Count and sort by frequency
    const tacticCounts: Record<string, number> = {};
    for (const t of allTactics) {
      tacticCounts[t] = (tacticCounts[t] || 0) + 1;
    }
    const toolCounts: Record<string, number> = {};
    for (const t of allTools) {
      toolCounts[t] = (toolCounts[t] || 0) + 1;
    }
    
    const workingStrategies = Object.entries(tacticCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([tactic]) => tactic);
    
    const toolsAndAutomations = Object.entries(toolCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([tool]) => tool);
    
    const avgEngagement = uniquePosts.length > 0
      ? Math.round(uniquePosts.reduce((sum, p) => sum + p.engagementRate, 0) / uniquePosts.length * 100) / 100
      : 0;
    
    return {
      growingCreators,
      workingStrategies,
      toolsAndAutomations,
      trendingAngles,
      avgEngagement,
      researchTimestamp: new Date().toISOString(),
    };
  } catch (error) {
    console.error("Creator research error:", error);
    return {
      growingCreators: [],
      workingStrategies: [],
      toolsAndAutomations: [],
      trendingAngles: [],
      avgEngagement: 0,
      researchTimestamp: new Date().toISOString(),
    };
  }
}

// VIRAL EXAMPLES - Fetch top performing TikTok captions for inspiration
export interface ViralExample {
  id: string;
  fullCaption: string;
  hookLine: string;
  views: number;
  likes: number;
  comments: number;
  shares: number;
  engagementRate: number;
  author: string;
  authorFollowers?: number;
  videoDuration?: number;
  estimatedWordCount: number;
  formatType: "hook-story-cta" | "listicle" | "tutorial" | "rant" | "question" | "unknown";
  hookType: "contrarian" | "question" | "statistic" | "personal" | "challenge" | "unknown";
  videoUrl: string;
}

export interface ViralExamplesResult {
  examples: ViralExample[];
  topicKeyword: string;
  avgViews: number;
  avgEngagement: number;
  dominantFormats: string[];
  dominantHookTypes: string[];
  bestPerformingDuration: string;
  fetchedAt: string;
}

// Detect format type from caption
function detectFormatType(text: string): ViralExample["formatType"] {
  const lowerText = text.toLowerCase();
  
  if (/\d+\s*(things?|ways?|tips?|steps?|reasons?)/i.test(text)) return "listicle";
  if (/how to|step \d|first,|then,|next,/i.test(text)) return "tutorial";
  if (/\?/.test(text.split(/[.!]/)[0] || "")) return "question";
  if (/i was|i used to|my story|i learned/i.test(lowerText)) return "hook-story-cta";
  if (/honestly|rant|unpopular opinion|hot take/i.test(lowerText)) return "rant";
  
  return "unknown";
}

// Detect hook type from first line
function detectHookType(hookLine: string): ViralExample["hookType"] {
  const lower = hookLine.toLowerCase();
  
  if (/\?$/.test(hookLine)) return "question";
  if (/\d+%|\d+x|\$\d+|\d+k|\d+ (million|billion)/i.test(hookLine)) return "statistic";
  if (/stop|don't|wrong|never|actually|myth/i.test(lower)) return "contrarian";
  if (/i was|i used to|my|when i/i.test(lower)) return "personal";
  if (/try this|do this|here's how|watch this/i.test(lower)) return "challenge";
  
  return "unknown";
}

// Fetch viral examples for a topic
export async function fetchViralExamples(
  topic: string, 
  limit: number = 10
): Promise<ViralExamplesResult> {
  if (!APIFY_TOKEN) {
    throw new Error("APIFY_API_TOKEN is not configured");
  }

  const client = new ApifyClient({ token: APIFY_TOKEN });

  try {
    const input = {
      searchQueries: [topic],
      resultsPerPage: Math.min(limit * 2, 30),
      shouldDownloadVideos: false,
      shouldDownloadCovers: false,
      shouldDownloadSubtitles: false,
      shouldDownloadSlideshowImages: false,
    };

    const run = await client.actor("clockworks/free-tiktok-scraper").call(input, {
      waitSecs: 120,
    });

    const { items } = await client.dataset(run.defaultDatasetId).listItems();
    
    console.log(`[Viral Examples] Raw items count: ${items.length}`);
    if (items.length > 0) {
      console.log(`[Viral Examples] First item keys:`, Object.keys(items[0] as any));
    }

    interface TikTokItem {
      id: string;
      desc?: string;
      text?: string;
      stats?: {
        playCount?: number;
        diggCount?: number;
        commentCount?: number;
        shareCount?: number;
      };
      playCount?: number;
      diggCount?: number;
      commentCount?: number;
      shareCount?: number;
      author?: {
        uniqueId?: string;
        followerCount?: number;
      };
      authorMeta?: {
        name?: string;
        id?: string;
      };
      video?: {
        duration?: number;
      };
      videoMeta?: {
        duration?: number;
      };
    }

    // Log sample item to see actual structure
    if (items.length > 0) {
      const sampleItem = items[0] as any;
      console.log(`[Viral Examples] Sample item structure:`, JSON.stringify(sampleItem, null, 2).substring(0, 1000));
    }

    const posts = (items as unknown as TikTokItem[])
      .filter((item) => {
        const hasCaption = !!(item.desc || item.text);
        const views = item.stats?.playCount || item.playCount || 0;
        console.log(`[Viral Examples] Item check - hasCaption: ${hasCaption}, views: ${views}, desc length: ${(item.desc || item.text || '').length}`);
        return hasCaption; // Remove view filter temporarily to see what we get
      })
      .map((item) => {
        const views = item.stats?.playCount || item.playCount || 0;
        const likes = item.stats?.diggCount || item.diggCount || 0;
        const comments = item.stats?.commentCount || item.commentCount || 0;
        const shares = item.stats?.shareCount || item.shareCount || 0;
        const engagementRate = views > 0 ? ((likes + comments + shares) / views) * 100 : 0;
        const fullCaption = item.desc || item.text || "";
        const hookLine = fullCaption.split(/[\n.!?]/)[0]?.trim() || "";
        const wordCount = fullCaption.split(/\s+/).length;

        const authorHandle = item.author?.uniqueId || item.authorMeta?.name || item.authorMeta?.id || "unknown";
        const videoUrl = `https://www.tiktok.com/@${authorHandle}/video/${item.id}`;
        const duration = item.video?.duration || item.videoMeta?.duration;

        return {
          id: item.id,
          fullCaption,
          hookLine,
          views,
          likes,
          comments,
          shares,
          engagementRate: Math.round(engagementRate * 100) / 100,
          author: authorHandle,
          authorFollowers: item.author?.followerCount,
          videoDuration: duration,
          estimatedWordCount: wordCount,
          formatType: detectFormatType(fullCaption),
          videoUrl,
          hookType: detectHookType(hookLine),
        };
      })
      .sort((a, b) => b.views - a.views)
      .slice(0, limit);

    // Calculate aggregates
    const avgViews = posts.length > 0 
      ? Math.round(posts.reduce((sum, p) => sum + p.views, 0) / posts.length)
      : 0;
    const avgEngagement = posts.length > 0
      ? Math.round(posts.reduce((sum, p) => sum + p.engagementRate, 0) / posts.length * 100) / 100
      : 0;

    // Find dominant formats
    const formatCounts: Record<string, number> = {};
    const hookCounts: Record<string, number> = {};
    
    for (const p of posts) {
      formatCounts[p.formatType] = (formatCounts[p.formatType] || 0) + 1;
      hookCounts[p.hookType] = (hookCounts[p.hookType] || 0) + 1;
    }

    const dominantFormats = Object.entries(formatCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([format]) => format);

    const dominantHookTypes = Object.entries(hookCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([hook]) => hook);

    // Analyze duration patterns
    const durations = posts
      .filter(p => p.videoDuration)
      .map(p => p.videoDuration!);
    
    let bestPerformingDuration = "30-60 seconds";
    if (durations.length > 0) {
      const avgDuration = durations.reduce((a, b) => a + b, 0) / durations.length;
      if (avgDuration < 20) bestPerformingDuration = "Under 20 seconds";
      else if (avgDuration < 45) bestPerformingDuration = "20-45 seconds";
      else if (avgDuration < 90) bestPerformingDuration = "45-90 seconds";
      else bestPerformingDuration = "Over 90 seconds";
    }

    return {
      examples: posts as ViralExample[],
      topicKeyword: topic,
      avgViews,
      avgEngagement,
      dominantFormats,
      dominantHookTypes,
      bestPerformingDuration,
      fetchedAt: new Date().toISOString(),
    };
  } catch (error) {
    console.error("Viral examples fetch error:", error);
    return {
      examples: [],
      topicKeyword: topic,
      avgViews: 0,
      avgEngagement: 0,
      dominantFormats: [],
      dominantHookTypes: [],
      bestPerformingDuration: "Unknown",
      fetchedAt: new Date().toISOString(),
    };
  }
}

// AP5 Social Media Monitoring - Enhanced strategic insights for script generation
export interface AP5StrategicInsights {
  keyInsights: string[];
  painPoints: string[];
  emotionalDrivers: string[];
  provenCTAIdeas: string[];
  objectionCrushers: string[];
  swipeableFacts: string[];
  contentAngles: string[];
  topicSummary: string;
  researchDepth: "basic" | "comprehensive";
  fetchedAt: string;
}

// Fetch strategic insights by reusing existing TikTok scraper data
// This extracts insights from viral content captions for strategic skeleton enhancement
export async function fetchAP5Insights(
  topic: string,
  options: {
    platforms?: string[];
    includeCompetitors?: boolean;
    limit?: number;
  } = {}
): Promise<AP5StrategicInsights> {
  if (!APIFY_TOKEN) {
    console.log("[Strategic Insights] No APIFY_API_TOKEN, returning empty insights");
    return getEmptyAP5Insights(topic);
  }
  
  try {
    console.log(`[Strategic Insights] Fetching insights for topic: ${topic}`);
    
    // Use existing TikTok scraper to get viral content, then extract insights
    const viralData = await fetchViralExamples(topic, options.limit || 15);
    
    if (!viralData || viralData.examples.length === 0) {
      console.log("[Strategic Insights] No viral examples found, returning basic insights");
      return getEmptyAP5Insights(topic);
    }

    console.log(`[Strategic Insights] Processing ${viralData.examples.length} viral examples`);

    // Convert viral examples to the format processAP5Data expects
    const items = viralData.examples.map((ex: any) => ({
      text: ex.caption,
      views: ex.views,
      likes: ex.likes,
      shares: ex.shares,
      comments: ex.comments,
      hashtags: ex.hashtags,
      creator: ex.creator,
    }));

    // Process and extract insights from the viral content
    const insights = processAP5Data(items, topic);
    
    // Add aggregate stats to the summary
    insights.topicSummary = `Analysis of ${viralData.examples.length} viral videos on "${topic}" with avg ${viralData.avgViews.toLocaleString()} views. Top formats: ${viralData.dominantFormats.slice(0, 2).join(', ')}. Best hooks: ${viralData.dominantHookTypes.slice(0, 2).join(', ')}.`;
    insights.researchDepth = viralData.examples.length >= 5 ? "comprehensive" : "basic";
    
    return insights;
  } catch (error) {
    console.error("[Strategic Insights] Error fetching insights:", error);
    return getEmptyAP5Insights(topic);
  }
}

function getEmptyAP5Insights(topic: string): AP5StrategicInsights {
  return {
    keyInsights: [],
    painPoints: [],
    emotionalDrivers: [],
    provenCTAIdeas: [],
    objectionCrushers: [],
    swipeableFacts: [],
    contentAngles: [],
    topicSummary: `Research for "${topic}" - no enhanced data available`,
    researchDepth: "basic",
    fetchedAt: new Date().toISOString(),
  };
}

function processAP5Data(items: any[], topic: string): AP5StrategicInsights {
  const allText = items
    .map(item => item.text || item.caption || item.content || item.description || "")
    .filter(Boolean);
  
  const keyInsights: string[] = [];
  const painPoints: string[] = [];
  const emotionalDrivers: string[] = [];
  const provenCTAIdeas: string[] = [];
  const objectionCrushers: string[] = [];
  const swipeableFacts: string[] = [];
  const contentAngles: string[] = [];

  // Extract pain points (problems mentioned)
  const painPointPatterns = [
    /struggle[sd]? with ([^.!?\n]{10,80})/gi,
    /problem is ([^.!?\n]{10,80})/gi,
    /tired of ([^.!?\n]{10,80})/gi,
    /sick of ([^.!?\n]{10,80})/gi,
    /can't seem to ([^.!?\n]{10,80})/gi,
    /keep failing at ([^.!?\n]{10,80})/gi,
    /why (do|does|is|are) ([^.!?\n]{10,60})\?/gi,
  ];

  // Extract emotional drivers
  const emotionPatterns = [
    /feel[s]? (so |like |really )?([a-z]+ed|[a-z]+ing)/gi,
    /imagine ([^.!?\n]{10,60})/gi,
    /finally ([^.!?\n]{10,60})/gi,
    /what if ([^.!?\n]{10,60})/gi,
  ];

  // Extract CTAs and calls to action
  const ctaPatterns = [
    /(comment|drop|type|dm|save|share|follow) [^.!?\n]{5,40}/gi,
    /link in bio/gi,
    /check out [^.!?\n]{5,40}/gi,
    /grab your [^.!?\n]{5,40}/gi,
  ];

  // Extract statistics and facts
  const factPatterns = [
    /\d+%[^.!?\n]{5,60}/gi,
    /\$\d+[^.!?\n]{5,60}/gi,
    /\d+ (out of|in) \d+/gi,
    /studies show[^.!?\n]{10,80}/gi,
    /research (shows|proves|found)[^.!?\n]{10,80}/gi,
  ];

  // Extract objection handlers
  const objectionPatterns = [
    /but what (if|about)[^.!?\n]{10,60}/gi,
    /you might think[^.!?\n]{10,60}/gi,
    /i know what you're thinking[^.!?\n]{10,60}/gi,
    /here's (the thing|why)[^.!?\n]{10,60}/gi,
  ];

  for (const text of allText) {
    // Extract pain points
    for (const pattern of painPointPatterns) {
      const matches = text.match(pattern);
      if (matches) {
        painPoints.push(...matches.slice(0, 2));
      }
    }

    // Extract emotional drivers
    for (const pattern of emotionPatterns) {
      const matches = text.match(pattern);
      if (matches) {
        emotionalDrivers.push(...matches.slice(0, 2));
      }
    }

    // Extract CTAs
    for (const pattern of ctaPatterns) {
      const matches = text.match(pattern);
      if (matches) {
        provenCTAIdeas.push(...matches.slice(0, 2));
      }
    }

    // Extract facts
    for (const pattern of factPatterns) {
      const matches = text.match(pattern);
      if (matches) {
        swipeableFacts.push(...matches.slice(0, 2));
      }
    }

    // Extract objection handlers
    for (const pattern of objectionPatterns) {
      const matches = text.match(pattern);
      if (matches) {
        objectionCrushers.push(...matches.slice(0, 2));
      }
    }

    // Extract content angles (first lines as hooks/angles)
    const firstLine = text.split(/[\n.!?]/)[0]?.trim();
    if (firstLine && firstLine.length > 10 && firstLine.length < 100) {
      contentAngles.push(firstLine);
    }
  }

  // Extract key insights from high-engagement content
  const sortedItems = items
    .filter(item => item.engagement || item.likes || item.views)
    .sort((a, b) => {
      const engA = a.engagement || a.likes || a.views || 0;
      const engB = b.engagement || b.likes || b.views || 0;
      return engB - engA;
    });

  for (const item of sortedItems.slice(0, 5)) {
    const text = item.text || item.caption || item.content || "";
    if (text.length > 20) {
      keyInsights.push(text.slice(0, 150) + (text.length > 150 ? "..." : ""));
    }
  }

  // Deduplicate and limit results
  const dedupe = (arr: string[]) => Array.from(new Set(arr.map(s => s.trim()))).slice(0, 8);

  const topicSummary = items.length > 0
    ? `Analyzed ${items.length} posts about "${topic}". Found ${painPoints.length} pain points, ${swipeableFacts.length} facts, and ${contentAngles.length} content angles.`
    : `Limited data available for "${topic}"`;

  return {
    keyInsights: dedupe(keyInsights),
    painPoints: dedupe(painPoints),
    emotionalDrivers: dedupe(emotionalDrivers),
    provenCTAIdeas: dedupe(provenCTAIdeas),
    objectionCrushers: dedupe(objectionCrushers),
    swipeableFacts: dedupe(swipeableFacts),
    contentAngles: dedupe(contentAngles),
    topicSummary,
    researchDepth: items.length >= 10 ? "comprehensive" : "basic",
    fetchedAt: new Date().toISOString(),
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

// Fetch Instagram viral examples for a topic (hashtag-based search)
export async function fetchInstagramViralExamples(
  topic: string, 
  limit: number = 10
): Promise<ViralExamplesResult> {
  if (!APIFY_TOKEN) {
    throw new Error("APIFY_API_TOKEN is not configured");
  }

  const client = new ApifyClient({ token: APIFY_TOKEN });

  try {
    // Convert topic to hashtag format
    const hashtag = topic.toLowerCase().replace(/\s+/g, "").replace(/[^a-z0-9]/g, "");
    
    const input = {
      hashtags: [hashtag],
      resultsLimit: Math.min(limit * 2, 30),
      resultsType: "posts",
    };

    console.log(`[Instagram Viral] Searching hashtag: #${hashtag}`);

    const run = await client.actor("apify/instagram-hashtag-scraper").call(input, {
      waitSecs: 120,
    });

    const { items } = await client.dataset(run.defaultDatasetId).listItems();
    
    console.log(`[Instagram Viral] Raw items count: ${items.length}`);

    interface InstagramItem {
      id: string;
      caption?: string;
      shortCode?: string;
      likesCount?: number;
      commentsCount?: number;
      videoViewCount?: number;
      ownerUsername?: string;
      ownerFullName?: string;
      type?: string;
      videoDuration?: number;
      timestamp?: string;
    }

    const posts = (items as unknown as InstagramItem[])
      .filter((item) => item.caption && item.caption.length > 20)
      .map((item) => {
        const views = item.videoViewCount || item.likesCount || 0;
        const likes = item.likesCount || 0;
        const comments = item.commentsCount || 0;
        const engagementRate = views > 0 ? ((likes + comments) / views) * 100 : 0;
        const fullCaption = item.caption || "";
        const hookLine = fullCaption.split(/[\n.!?]/)[0]?.trim() || "";
        const wordCount = fullCaption.split(/\s+/).length;

        const authorHandle = item.ownerUsername || "unknown";
        const postUrl = item.shortCode 
          ? `https://www.instagram.com/p/${item.shortCode}/`
          : `https://www.instagram.com/${authorHandle}/`;

        return {
          id: item.id || item.shortCode || String(Date.now()),
          fullCaption,
          hookLine,
          views,
          likes,
          comments,
          shares: 0,
          engagementRate: Math.round(engagementRate * 100) / 100,
          author: authorHandle,
          authorFollowers: undefined,
          videoDuration: item.videoDuration,
          estimatedWordCount: wordCount,
          formatType: detectFormatType(fullCaption),
          videoUrl: postUrl,
          hookType: detectHookType(hookLine),
        };
      })
      .sort((a, b) => b.views - a.views)
      .slice(0, limit);

    // Calculate aggregates
    const avgViews = posts.length > 0 
      ? Math.round(posts.reduce((sum, p) => sum + p.views, 0) / posts.length)
      : 0;
    const avgEngagement = posts.length > 0
      ? Math.round(posts.reduce((sum, p) => sum + p.engagementRate, 0) / posts.length * 100) / 100
      : 0;

    // Find dominant formats
    const formatCounts: Record<string, number> = {};
    const hookCounts: Record<string, number> = {};
    
    for (const p of posts) {
      formatCounts[p.formatType] = (formatCounts[p.formatType] || 0) + 1;
      hookCounts[p.hookType] = (hookCounts[p.hookType] || 0) + 1;
    }

    const dominantFormats = Object.entries(formatCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([format]) => format);

    const dominantHookTypes = Object.entries(hookCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([hook]) => hook);

    // Analyze duration patterns
    const durations = posts
      .filter(p => p.videoDuration)
      .map(p => p.videoDuration!);
    
    let bestPerformingDuration = "30-60 seconds";
    if (durations.length > 0) {
      const avgDuration = durations.reduce((a, b) => a + b, 0) / durations.length;
      if (avgDuration < 20) bestPerformingDuration = "Under 20 seconds";
      else if (avgDuration < 45) bestPerformingDuration = "20-45 seconds";
      else if (avgDuration < 90) bestPerformingDuration = "45-90 seconds";
      else bestPerformingDuration = "Over 90 seconds";
    }

    return {
      examples: posts as ViralExample[],
      topicKeyword: topic,
      avgViews,
      avgEngagement,
      dominantFormats,
      dominantHookTypes,
      bestPerformingDuration,
      fetchedAt: new Date().toISOString(),
    };
  } catch (error) {
    console.error("Instagram viral examples fetch error:", error);
    return {
      examples: [],
      topicKeyword: topic,
      avgViews: 0,
      avgEngagement: 0,
      dominantFormats: [],
      dominantHookTypes: [],
      bestPerformingDuration: "Unknown",
      fetchedAt: new Date().toISOString(),
    };
  }
}

// ============================================
// VIDEO CLONE FEATURE - Extract transcript from single video URL
// ============================================

export interface VideoCloneData {
  platform: "tiktok" | "instagram" | "youtube" | "unknown";
  transcript: string;
  author?: string;
  views?: number;
  likes?: number;
  comments?: number;
  duration?: number;
  videoDownloadUrl?: string;
  coverImageUrl?: string;
  success: boolean;
  error?: string;
}

export interface ExtractedFrame {
  thumbnailUrl: string;
  timestamp: number;
  width?: number;
  height?: number;
}

function extractTextFragments(value: unknown): string[] {
  if (typeof value === "string") {
    return [value];
  }

  if (Array.isArray(value)) {
    return value.flatMap((item) => extractTextFragments(item));
  }

  if (!value || typeof value !== "object") {
    return [];
  }

  const record = value as Record<string, unknown>;
  const preferredKeys = [
    "text",
    "caption",
    "captions",
    "subtitle",
    "subtitles",
    "transcript",
    "content",
    "sentence",
    "utterance",
    "words",
    "lines",
    "segments",
    "snippets",
    "body",
    "desc",
  ];

  const collected: string[] = [];
  for (const key of preferredKeys) {
    if (key in record) {
      collected.push(...extractTextFragments(record[key]));
    }
  }

  if (collected.length > 0) {
    return collected;
  }

  return Object.values(record).flatMap((item) => extractTextFragments(item));
}

function normalizeVideoTranscript(transcript: string): string {
  if (!transcript) return "";

  const normalized = transcript
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/https?:\/\/\S+/gi, " ")
    .replace(/\b\d{1,2}:\d{2}(?::\d{2})?\b/g, " ")
    .replace(/#[A-Za-z0-9_-]+/g, " ")
    .replace(/@[A-Za-z0-9._-]+/g, " ")
    .replace(/[|•·]+/g, "\n")
    .replace(/\s{2,}/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  const dedupedLines = normalized
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean)
    .filter((line, index, lines) => {
      if (line.length < 2) return false;
      if (line.replace(/[^A-Za-z0-9]/g, "").length < 2) return false;
      const previous = lines[index - 1]?.trim().toLowerCase();
      return previous !== line.toLowerCase();
    });

  return dedupedLines.join("\n").trim();
}

function buildBestTranscript(...sources: unknown[]): string {
  const candidates = sources
    .flatMap((source) => extractTextFragments(source))
    .map((text) => normalizeVideoTranscript(text))
    .filter((text) => text.length > 0)
    .sort((a, b) => b.length - a.length);

  return candidates[0] || "";
}

// Parse video URL to determine platform and extract ID
function parseVideoUrl(url: string): { platform: "tiktok" | "instagram" | "youtube" | "unknown"; videoId?: string } {
  const normalizedUrl = url.toLowerCase().trim();
  
  if (normalizedUrl.includes("tiktok.com")) {
    const videoMatch = url.match(/video\/(\d+)/);
    return { platform: "tiktok", videoId: videoMatch?.[1] };
  }
  
  if (normalizedUrl.includes("instagram.com")) {
    const postMatch = url.match(/(?:\/p\/|\/reel\/|\/reels\/)([A-Za-z0-9_-]+)/);
    return { platform: "instagram", videoId: postMatch?.[1] };
  }
  
  if (normalizedUrl.includes("youtube.com") || normalizedUrl.includes("youtu.be")) {
    let videoId: string | undefined;
    const longMatch = url.match(/[?&]v=([A-Za-z0-9_-]+)/);
    const shortMatch = url.match(/youtu\.be\/([A-Za-z0-9_-]+)/);
    const shortsMatch = url.match(/\/shorts\/([A-Za-z0-9_-]+)/);
    videoId = longMatch?.[1] || shortMatch?.[1] || shortsMatch?.[1];
    return { platform: "youtube", videoId };
  }
  
  return { platform: "unknown" };
}

// Scrape a single TikTok video by URL
export async function scrapeTikTokVideo(videoUrl: string): Promise<VideoCloneData> {
  if (!APIFY_TOKEN) {
    return { platform: "tiktok", transcript: "", success: false, error: "APIFY_API_TOKEN is not configured" };
  }

  const client = new ApifyClient({ token: APIFY_TOKEN });

  try {
    const input = {
      postURLs: [videoUrl],
      resultsPerPage: 1,
      shouldDownloadVideos: false,
      shouldDownloadCovers: true,
      shouldDownloadSubtitles: true,
      shouldDownloadSlideshowImages: false,
    };

    console.log("[Video Clone] Scraping TikTok video:", videoUrl);
    const run = await client.actor("clockworks/free-tiktok-scraper").call(input, {
      waitSecs: 120,
    });

    const { items } = await client.dataset(run.defaultDatasetId).listItems();

    if (items.length === 0) {
      return { platform: "tiktok", transcript: "", success: false, error: "Could not find video" };
    }

    const video = items[0] as any;
    const transcript = buildBestTranscript(
      video.subtitles,
      video.captions,
      video.subtitle,
      video.desc,
      video.text,
      video.video?.subtitle,
      video.video?.captions,
    );

    if (!transcript || transcript.split(/\s+/).filter(Boolean).length < 12) {
      return {
        platform: "tiktok",
        transcript: "",
        success: false,
        error: "This video did not return enough spoken transcript to clone accurately. Try a video with clearer captions or spoken dialogue.",
      };
    }

    console.log("[Video Clone] TikTok video scraped successfully, transcript length:", transcript.length);

    const videoDownloadUrl = video.videoUrl || video.video?.downloadAddr || video.video?.playAddr || video.downloadUrl || "";
    const coverImageUrl = video.covers?.default || video.covers?.dynamic || video.video?.cover || video.video?.originCover || video.video?.dynamicCover || video.coverUrl || video.cover || video.thumbnail || video.thumbnailUrl || video.imageUrl || "";
    
    console.log("[Video Clone] Video download URL available:", !!videoDownloadUrl, "Cover URL:", coverImageUrl ? coverImageUrl.substring(0, 80) : "none");
    console.log("[Video Clone] Raw video keys:", Object.keys(video).join(", "));

    return {
      platform: "tiktok",
      transcript,
      author: video.author?.uniqueId || video.authorMeta?.name,
      views: video.stats?.playCount || video.playCount,
      likes: video.stats?.diggCount || video.diggCount,
      comments: video.stats?.commentCount || video.commentCount,
      duration: video.duration,
      videoDownloadUrl: videoDownloadUrl || undefined,
      coverImageUrl: coverImageUrl || undefined,
      success: true,
    };
  } catch (error: any) {
    console.error("[Video Clone] TikTok scrape error:", error);
    return { platform: "tiktok", transcript: "", success: false, error: error.message || "Failed to scrape video" };
  }
}

// Scrape a single Instagram post/reel by URL
export async function scrapeInstagramVideo(postUrl: string): Promise<VideoCloneData> {
  if (!APIFY_TOKEN) {
    return { platform: "instagram", transcript: "", success: false, error: "APIFY_API_TOKEN is not configured" };
  }

  const client = new ApifyClient({ token: APIFY_TOKEN });

  try {
    const input = {
      directUrls: [postUrl],
      resultsType: "posts",
      resultsLimit: 1,
    };

    console.log("[Video Clone] Scraping Instagram post:", postUrl);
    const run = await client.actor("apify/instagram-scraper").call(input, {
      waitSecs: 120,
    });

    const { items } = await client.dataset(run.defaultDatasetId).listItems();

    if (items.length === 0) {
      return { platform: "instagram", transcript: "", success: false, error: "Could not find post" };
    }

    const post = items[0] as any;
    const transcript = buildBestTranscript(
      post.caption,
      post.text,
      post.subtitles,
      post.captions,
      post.videoCaption,
      post.accessibilityCaption,
    );

    if (!transcript || transcript.split(/\s+/).filter(Boolean).length < 12) {
      return {
        platform: "instagram",
        transcript: "",
        success: false,
        error: "This Instagram post did not return enough spoken transcript to clone accurately. Try a reel with clearer captions or spoken dialogue.",
      };
    }

    console.log("[Video Clone] Instagram post scraped successfully, transcript length:", transcript.length);

    const videoDownloadUrl = post.videoUrl || post.video?.url || "";
    const coverImageUrl = post.displayUrl || post.thumbnailUrl || post.imageUrl || post.images?.[0] || "";
    
    console.log("[Video Clone] Instagram video URL available:", !!videoDownloadUrl, "Cover URL:", coverImageUrl ? coverImageUrl.substring(0, 80) : "none");
    console.log("[Video Clone] Raw post keys:", Object.keys(post).join(", "));

    return {
      platform: "instagram",
      transcript,
      author: post.ownerUsername || post.owner?.username,
      views: post.videoViewCount || post.viewCount,
      likes: post.likesCount,
      comments: post.commentsCount,
      duration: post.videoDuration,
      videoDownloadUrl: videoDownloadUrl || undefined,
      coverImageUrl: coverImageUrl || undefined,
      success: true,
    };
  } catch (error: any) {
    console.error("[Video Clone] Instagram scrape error:", error);
    return { platform: "instagram", transcript: "", success: false, error: error.message || "Failed to scrape post" };
  }
}

// Main function to extract video transcript from any supported URL
// Scrape a YouTube video transcript by URL
export async function scrapeYouTubeVideo(videoUrl: string): Promise<VideoCloneData> {
  if (!APIFY_TOKEN) {
    return { platform: "youtube", transcript: "", success: false, error: "APIFY_API_TOKEN is not configured" };
  }

  const client = new ApifyClient({ token: APIFY_TOKEN });

  try {
    const input = {
      startUrls: [{ url: videoUrl }],
      maxResults: 1,
    };

    console.log("[Video Clone] Scraping YouTube video:", videoUrl);
    const run = await client.actor("karamelo/youtube-transcripts").call(input, {
      waitSecs: 120,
    });

    const { items } = await client.dataset(run.defaultDatasetId).listItems();
    
    if (!items || items.length === 0) {
      console.log("[Video Clone] YouTube scraper returned no items");
      return { platform: "youtube", transcript: "", success: false, error: "Could not extract transcript from YouTube video. The video may not have captions available." };
    }

    const video = items[0] as any;
    console.log("[Video Clone] YouTube video scraped, raw keys:", Object.keys(video).join(", "));
    
    const transcript = buildBestTranscript(
      video.transcript,
      video.captions,
      video.text,
      video.description,
      video.subtitle,
    );

    if (!transcript) {
      console.log("[Video Clone] YouTube: No transcript found in response");
      return { platform: "youtube", transcript: "", success: false, error: "No transcript/captions available for this YouTube video." };
    }

    console.log("[Video Clone] YouTube transcript extracted, length:", transcript.length);

    const coverImageUrl = video.thumbnailUrl || video.thumbnail || video.thumbnails?.[0]?.url || "";
    const author = video.channelName || video.channel || video.author || video.uploader || "";
    const views = video.viewCount || video.views || 0;
    const likes = video.likeCount || video.likes || 0;
    const comments = video.commentCount || video.comments || 0;
    const duration = video.duration || video.lengthSeconds || 0;

    console.log("[Video Clone] YouTube cover:", coverImageUrl ? coverImageUrl.substring(0, 80) : "none");

    return {
      platform: "youtube",
      transcript,
      author,
      views: typeof views === 'number' ? views : parseInt(views) || 0,
      likes: typeof likes === 'number' ? likes : parseInt(likes) || 0,
      comments: typeof comments === 'number' ? comments : parseInt(comments) || 0,
      duration: typeof duration === 'number' ? duration : parseInt(duration) || 0,
      coverImageUrl: coverImageUrl || undefined,
      success: true,
    };
  } catch (error: any) {
    console.error("[Video Clone] YouTube scrape error:", error);
    return { platform: "youtube", transcript: "", success: false, error: error.message || "Failed to scrape YouTube video" };
  }
}

export async function extractVideoTranscript(videoUrl: string): Promise<VideoCloneData> {
  const { platform } = parseVideoUrl(videoUrl);

  if (platform === "tiktok") {
    return scrapeTikTokVideo(videoUrl);
  }
  
  if (platform === "instagram") {
    return scrapeInstagramVideo(videoUrl);
  }

  if (platform === "youtube") {
    return scrapeYouTubeVideo(videoUrl);
  }

  return {
    platform: "unknown",
    transcript: "",
    success: false,
    error: "Unsupported platform. Please use a TikTok, Instagram, or YouTube video URL.",
  };
}

// ============================================
// VIDEO FRAME EXTRACTION - Extract key frames from video
// ============================================

export async function extractVideoFrames(
  videoDownloadUrl: string,
  thumbnailCount: number = 5,
  videoDuration?: number
): Promise<{ frames: ExtractedFrame[]; error?: string }> {
  if (!APIFY_TOKEN) {
    return { frames: [], error: "APIFY_API_TOKEN is not configured" };
  }

  const client = new ApifyClient({ token: APIFY_TOKEN });

  try {
    const input: any = {
      videoUrls: [videoDownloadUrl],
      thumbnailCount,
      outputFormat: "jpeg",
      imageWidth: 480,
      imageQuality: 80,
      includeMetadata: true,
      timeout: 120,
    };

    if (videoDuration && videoDuration > 0) {
      const timestamps: number[] = [];
      const interval = videoDuration / (thumbnailCount + 1);
      for (let i = 1; i <= thumbnailCount; i++) {
        timestamps.push(Math.round(interval * i));
      }
      input.customTimestamps = timestamps;
    }

    console.log("[Frame Extraction] Extracting frames from video, count:", thumbnailCount);
    const run = await client.actor("creator-tribe/automated-video-thumbnail-generator").call(input, {
      waitSecs: 180,
    });

    const { items } = await client.dataset(run.defaultDatasetId).listItems();

    const frames: ExtractedFrame[] = (items as any[])
      .filter((item) => item.status === "success" && item.thumbnailUrl)
      .map((item) => ({
        thumbnailUrl: item.thumbnailUrl,
        timestamp: item.timestamp || 0,
        width: item.width,
        height: item.height,
      }))
      .sort((a, b) => a.timestamp - b.timestamp);

    console.log("[Frame Extraction] Successfully extracted", frames.length, "frames");
    return { frames };
  } catch (error: any) {
    console.error("[Frame Extraction] Error:", error.message || error);
    return { frames: [], error: error.message || "Failed to extract frames" };
  }
}
