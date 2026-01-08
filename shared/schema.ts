import { pgTable, text, varchar, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Export auth models for Replit Auth integration
export * from "./models/auth";

// Script Categories
export const scriptCategories = [
  { id: "content_creation", name: "Content Creation & Strategy", description: "Content workflows, filming systems, creator productivity" },
  { id: "business_marketing", name: "Business Building & Marketing", description: "Lead generation, sales strategies, business growth" },
  { id: "ai_technology", name: "AI & Technology", description: "AI tools, tech trends, future implications" },
  { id: "personal_branding", name: "Personal Branding & Community", description: "Authentic brands, engaged communities" },
  { id: "social_growth", name: "Social Media Growth Hacks", description: "Viral strategies, algorithm hacks" },
  { id: "niche_optimization", name: "Niche & Format Optimization", description: "Finding your niche, optimizing formats" },
  { id: "mindset_growth", name: "Mindset & Personal Growth", description: "Self-development, boundaries, life philosophy" },
  { id: "health_science", name: "Health & Science", description: "Health topics, scientific insights, psychology" },
  { id: "wealth_finance", name: "Wealth & Finance", description: "Money mindset, wealth building strategies" },
] as const;

// Hook Categories for organization
export const hookCategories = [
  { id: "personal_experience", name: "Personal Experience", description: "Present your unique perspective to build instant credibility" },
  { id: "case_study", name: "Case Study", description: "Highlight someone achieving unexpected results" },
  { id: "secret_reveal", name: "Secret Reveal", description: "Tease insider knowledge for exclusive access feeling" },
  { id: "contrarian", name: "Contrarian", description: "Challenge conventional beliefs to stop the scroll" },
  { id: "question", name: "Question", description: "Frame an opening question that demands an answer" },
  { id: "list", name: "List", description: "Introduce a numbered list that promises organized value" },
  { id: "education", name: "Education", description: "Introduce a step-by-step process for transformation" },
] as const;

// 50 Viral Hooks Database
export const viralHooks = [
  // PERSONAL EXPERIENCE (1-8)
  { id: "painful_past", category: "personal_experience", name: "The Painful Past", template: "I used to [painful thing everyone relates to].", example: "I used to write a script, film, edit, and post all in one day.", why: "Viewers think 'that's me right now' and stay to see the solution." },
  { id: "realization_moment", category: "personal_experience", name: "The Realization Moment", template: "I spent [time period] doing [thing] before I realized [insight].", example: "I spent 3 years posting daily before I realized I was burning out for nothing.", why: "Implies hard-earned wisdom they can get in 60 seconds." },
  { id: "unlikely_start", category: "personal_experience", name: "The Unlikely Start", template: "I [started from unlikely place] and now [impressive result].", example: "I came out here lonely. Didn't know anybody. Had to build from scratch.", why: "Creates a transformation arc viewers want to follow." },
  { id: "confession", category: "personal_experience", name: "The Confession", template: "I'm going to be honest - I [vulnerable admission].", example: "I'm going to be honest - I almost quit content creation last year.", why: "Vulnerability creates instant trust and curiosity." },
  { id: "accidental_discovery", category: "personal_experience", name: "The Accidental Discovery", template: "I accidentally discovered [thing] when I [situation].", example: "I accidentally discovered the best hook formula when I analyzed my flops.", why: "Makes the insight feel serendipitous and authentic." },
  { id: "rule_breaker", category: "personal_experience", name: "The Rule Breaker", template: "I broke every rule about [topic] and here's what happened.", example: "I broke every rule about posting times and here's what happened.", why: "Rebellion is intriguing. People want to see if rules are real." },
  { id: "big_result", category: "personal_experience", name: "The Big Result", template: "I just [achieved impressive thing].", example: "I just sold my company for $10 million.", why: "Immediate credibility. Viewers want to know how." },
  { id: "time_marker", category: "personal_experience", name: "The Time Marker", template: "[Time period] ago I [past state]. Today I [current state].", example: "6 months ago I had 200 followers. Today I have 200,000.", why: "Concrete transformation with a timeline feels achievable." },
  
  // CASE STUDY (9-16)
  { id: "brand_spotlight", category: "case_study", name: "The Brand Spotlight", template: "[Brand/Person] is doing something nobody's talking about.", example: "Adobe is doing something with AI that nobody's talking about.", why: "Name recognition + exclusivity = instant attention." },
  { id: "unexpected_winner", category: "case_study", name: "The Unexpected Winner", template: "This [underdog] is outperforming [expected winner] and here's why.", example: "This unknown creator is outperforming Mr. Beast's engagement and here's why.", why: "David vs Goliath stories are irresistible." },
  { id: "number_flex", category: "case_study", name: "The Number Flex", template: "[Person/Brand] hit [impressive number] by doing [unexpected thing].", example: "This marketer hits 40% conversion rates by ditching landing pages.", why: "Specific numbers create believability and curiosity." },
  { id: "reverse_engineering", category: "case_study", name: "The Reverse Engineering", template: "I studied [successful person] for [time] and found their secret.", example: "I studied Alex Hormozi for 6 months and found his secret.", why: "Positions you as a researcher delivering exclusive insights." },
  { id: "industry_insider", category: "case_study", name: "The Industry Insider", template: "[X]% of [group] are doing [thing] and you're not.", example: "74% of artists are experimenting with AI and you're not.", why: "FOMO + social proof is a powerful combo." },
  { id: "method_reveal", category: "case_study", name: "The Method Reveal", template: "Here's exactly how [person] [achieved result] in [timeframe].", example: "Here's exactly how Brandon Baum creates impossible videos in minutes.", why: "'Exactly how' promises actionable, specific steps." },
  { id: "comparison", category: "case_study", name: "The Comparison", template: "Most [people] get [bad result]. [This person] gets [great result].", example: "Most websites convert at 2-4%. This marketer hits 20-40%.", why: "Gap between normal and exceptional creates desire." },
  { id: "pattern_interrupt", category: "case_study", name: "The Pattern Interrupt", template: "[Famous person/brand] just did something that changes everything.", example: "Forbes just said something about AI that changes everything.", why: "Authority + urgency = must-watch content." },
  
  // SECRET REVEAL (17-26)
  { id: "hidden_truth", category: "secret_reveal", name: "The Hidden Truth", template: "Here's something nobody tells you about [topic].", example: "Here's something nobody tells you about self-respect.", why: "Implies insider knowledge most people miss." },
  { id: "industry_secret", category: "secret_reveal", name: "The Industry Secret", template: "The [industry] doesn't want you to know this.", example: "The algorithm doesn't want you to know this.", why: "Creates an us-vs-them dynamic with viewer on your side." },
  { id: "future_warning", category: "secret_reveal", name: "The Future Warning", template: "What's coming in [timeframe] is going to [big change].", example: "What's coming in 2025 is going to destroy most creators.", why: "Future-pacing creates urgency and fear of missing out." },
  { id: "rate_of_change", category: "secret_reveal", name: "The Rate of Change", template: "The rate at which [thing] is [changing] is actually [emotion].", example: "The rate at which AI is progressing is actually terrifying.", why: "Emotional language + trending topic = engagement." },
  { id: "counterintuitive_truth", category: "secret_reveal", name: "The Counterintuitive Truth", template: "The real reason [thing happens] has nothing to do with [expected reason].", example: "The real reason your content flops has nothing to do with the algorithm.", why: "Challenges assumptions and promises new perspective." },
  { id: "insider_access", category: "secret_reveal", name: "The Insider Access", template: "I have information about [topic] that most people don't.", example: "I have information about where social media is going that most people don't.", why: "Exclusivity is magnetic. People want to be 'in the know.'" },
  { id: "uncomfortable_truth", category: "secret_reveal", name: "The Uncomfortable Truth", template: "No one wants to hear this but [hard truth].", example: "No one wants to hear this but your content isn't the problem.", why: "Frames the message as brave truth-telling." },
  { id: "prediction", category: "secret_reveal", name: "The Prediction", template: "In [timeframe], [current thing] will be [new state].", example: "In 12 months, perfect content will be everywhere and we'll be sick of it.", why: "Predictions feel valuable and shareable." },
  { id: "strategy_reveal", category: "secret_reveal", name: "The Strategy Reveal", template: "Here's how [international/unexpected group] are [achieving result].", example: "Here's how international creators charge US prices.", why: "Geographic/demographic angle adds novelty." },
  { id: "liberation", category: "secret_reveal", name: "The Liberation", template: "Here's the truth that will set you free about [topic].", example: "Here's the truth that will set you free: no one was watching as much as you thought.", why: "Promises emotional relief and breakthrough." },
  
  // CONTRARIAN (27-34)
  { id: "direct_attack", category: "contrarian", name: "The Direct Attack", template: "[Common advice] is ruining your [desired outcome].", example: "Educational content is ruining your sales.", why: "Attacks something they're probably doing. Must defend or learn." },
  { id: "opposite_claim", category: "contrarian", name: "The Opposite Claim", template: "Stop [thing everyone says to do].", example: "Stop posting educational content on Instagram.", why: "Contradicts mainstream advice. Demands explanation." },
  { id: "myth_buster", category: "contrarian", name: "The Myth Buster", template: "Everything you've been told about [topic] is wrong.", example: "Everything you've been told about going viral is wrong.", why: "Promises paradigm shift in understanding." },
  { id: "unpopular_opinion", category: "contrarian", name: "The Unpopular Opinion", template: "Unpopular opinion: [controversial take].", example: "Unpopular opinion: consistency is overrated.", why: "Signals bold thinking. Invites debate and shares." },
  { id: "anti_advice", category: "contrarian", name: "The Anti-Advice", template: "The worst advice I ever got was [common advice].", example: "The worst advice I ever got was 'just be consistent.'", why: "Story format + contrarian angle = compelling combo." },
  { id: "inversion", category: "contrarian", name: "The Inversion", template: "[Desired outcome] doesn't come from [expected source].", example: "Wealth doesn't come from working harder.", why: "Disrupts cause-effect assumptions they hold." },
  { id: "paradox", category: "contrarian", name: "The Paradox", template: "The more you [common action], the less you [desired result].", example: "The more you post, the less you grow.", why: "Paradoxes are mentally sticky and shareable." },
  { id: "industry_lie", category: "contrarian", name: "The Industry Lie", template: "[Industry/gurus] have been lying to you about [topic].", example: "Marketing gurus have been lying to you about funnels.", why: "Positions viewer as victim who needs your truth." },
  
  // QUESTION (35-42)
  { id: "direct_question", category: "question", name: "The Direct Question", template: "Why do most [people] fail at [thing]?", example: "Why do most businesses die from too much, not too little?", why: "Viewer's brain automatically tries to answer." },
  { id: "what_if_question", category: "question", name: "The What If Question", template: "What if [common belief] was actually [opposite]?", example: "What if posting more was actually hurting your growth?", why: "Opens imagination to new possibilities." },
  { id: "choice_question", category: "question", name: "The Choice Question", template: "Would you rather [option A] or [option B]?", example: "Would you rather 10 years of pain for one big exit or mini wins every year?", why: "Forces mental engagement and self-reflection." },
  { id: "identification_question", category: "question", name: "The Identification Question", template: "Do you know what type of [category] you are?", example: "Do you know what type of niche you're in - visual, verbal, or product?", why: "Curiosity about self-categorization is powerful." },
  { id: "problem_question", category: "question", name: "The Problem Question", template: "Ever wonder why [frustrating thing happens]?", example: "Ever wonder why your videos get views but no followers?", why: "Names their pain point directly." },
  { id: "rhetorical_challenge", category: "question", name: "The Rhetorical Challenge", template: "What would happen if you [bold action]?", example: "What would happen if you just stopped caring what people think?", why: "Plants a seed of possibility in their mind." },
  { id: "knowledge_test", category: "question", name: "The Knowledge Test", template: "Can you name [number] [things] that [outcome]?", example: "Can you name 3 substances that permanently change your personality?", why: "Challenges their knowledge. They stay to verify." },
  { id: "stakes_question", category: "question", name: "The Stakes Question", template: "What's the real cost of [common behavior]?", example: "What's the real cost of staying in your hometown?", why: "Forces them to confront consequences they avoid." },
  
  // LIST (43-47)
  { id: "countdown", category: "list", name: "The Countdown", template: "[Number] [things] that will [outcome].", example: "3 substances that can permanently change your personality.", why: "Specific number sets clear expectation. Easy to consume." },
  { id: "daily_tracker", category: "list", name: "The Daily Tracker", template: "Day [number] of [challenge/goal].", example: "Day 29 of building my business in public.", why: "Serialized content creates return viewers." },
  { id: "toolkit", category: "list", name: "The Toolkit", template: "[Number] tools I use to [achieve result].", example: "3 AI tools I use to never run out of content ideas.", why: "Tool lists are highly saveable and shareable." },
  { id: "mistake_list", category: "list", name: "The Mistake List", template: "[Number] mistakes killing your [desired outcome].", example: "5 mistakes killing your engagement right now.", why: "Fear of loss is stronger than desire for gain." },
  { id: "ranking", category: "list", name: "The Ranking", template: "The [number] most [adjective] [things] for [outcome].", example: "The 3 most underrated strategies for going viral.", why: "Rankings promise curated, valuable information." },
  
  // EDUCATION (48-50)
  { id: "how_to", category: "education", name: "The How-To", template: "Here's how to [achieve specific result] in [time/steps].", example: "Here's how to find viral content ideas in under 5 minutes.", why: "Clear promise of transformation with specific outcome." },
  { id: "step_by_step", category: "education", name: "The Step-by-Step", template: "The [number]-step process to [desired outcome].", example: "The 3-step process to never run out of content ideas.", why: "Numbered steps feel organized and achievable." },
  { id: "template_reveal", category: "education", name: "The Template Reveal", template: "I'm giving you the exact template I use to [outcome].", example: "I'm giving you the exact method I use to find my format.", why: "Promises a ready-to-use framework they can copy." },
] as const;

// Legacy hook formats (for backwards compatibility)
export const hookFormats = viralHooks.slice(0, 10).map(h => ({
  id: h.id,
  name: h.name,
  template: h.template,
  example: h.example,
}));

// Structure Formats
export const structureFormats = [
  { id: "problem_solver", name: "Problem Solver", description: "Set up problem → Present solution", sections: ["Problem Setup (30%)", "Agitation (20%)", "Solution (40%)", "CTA (10%)"] },
  { id: "breakdown", name: "Breakdown", description: "Explain foundational principles", sections: ["Big Picture (20%)", "Component 1 (25%)", "Component 2 (25%)", "Component 3 (20%)", "Synthesis (10%)"] },
  { id: "listicle", name: "Listicle", description: "Numbered list format", sections: ["Hook + Setup (15%)", "Item 1 (20%)", "Item 2 (20%)", "Item 3 (20%)", "Item 4 (15%)", "Wrap (10%)"] },
  { id: "tutorial", name: "Tutorial", description: "Step-by-step walkthrough", sections: ["Setup (15%)", "Step 1 (25%)", "Step 2 (25%)", "Step 3 (25%)", "Result/CTA (10%)"] },
  { id: "story_arc", name: "Story Arc", description: "Narrative with emotional journey", sections: ["Setup (20%)", "Conflict (30%)", "Turning Point (20%)", "Resolution (20%)", "Lesson (10%)"] },
  { id: "educational_motivation", name: "Educational Motivation", description: "Motivate and educate through experience", sections: ["Hook + Context (15%)", "Journey/Experience (35%)", "The Lesson (30%)", "Empowerment (20%)"] },
] as const;

// Tone Options
export const toneOptions = [
  { id: "direct", name: "Direct", description: "Matter-of-fact, no fluff" },
  { id: "high_energy", name: "High Energy", description: "Enthusiastic, excited" },
  { id: "conversational", name: "Conversational", description: "Casual, friendly" },
  { id: "vulnerable", name: "Vulnerable", description: "Open, honest, real" },
  { id: "relaxed", name: "Relaxed", description: "Laid-back, chill" },
] as const;

// Voice Options
export const voiceOptions = [
  { id: "confident", name: "Confident & Commanding", description: "Instructive, expert positioning" },
  { id: "inquisitive", name: "Inquisitive & Bold", description: "Forward-looking, questioning" },
  { id: "relatable", name: "Relatable & Authentic", description: "Human, imperfect, real" },
  { id: "thoughtful", name: "Thoughtful & Introspective", description: "Personal, reflective, deep" },
] as const;

// Pacing Options
export const pacingOptions = [
  { id: "balanced", name: "Balanced", description: "Natural rhythm with pauses" },
  { id: "rapid_fire", name: "Rapid-Fire", description: "Minimal pauses, high momentum" },
  { id: "deliberate", name: "Deliberate", description: "Slower, dramatic emphasis" },
] as const;

// Video Types - Simplified to 3 most-used formats
export const videoTypes = [
  { id: "talking_head", name: "Talking Head", icon: "Mic", description: "You speak directly to camera" },
  { id: "broll_voiceover", name: "B-Roll + Voiceover", icon: "Film", description: "Voice over footage, no face" },
  { id: "text_on_screen", name: "Text on Screen", icon: "Type", description: "No voice, just text cards" },
] as const;

// Extended video types (for Pro/Ultimate users or future expansion)
export const extendedVideoTypes = [
  { id: "ai_avatar", name: "AI Avatar / Clone", icon: "Bot", description: "AI avatar speaks the script" },
  { id: "screen_recording", name: "Screen Recording", icon: "Monitor", description: "Voice narrates over screen capture" },
  { id: "mixed_format", name: "Mixed Format", icon: "Layers", description: "Combination of talking head + b-roll + text" },
] as const;

// Creator Style Presets - Famous creator patterns
export const creatorStyles = [
  { 
    id: "default", 
    name: "Default", 
    icon: "Target",
    description: "Optimized for virality",
    characteristics: "Uses proven viral patterns, optimal hook placement, engaging structure",
    exampleHook: "Here's something nobody tells you about [topic]..."
  },
  { 
    id: "nas_daily", 
    name: "Nas Daily", 
    icon: "Globe",
    description: "Fast, simple, emotional",
    characteristics: "Opens with 'This is [subject]' or direct statement. 1-minute format, fast-paced. Simple vocabulary (Grade 3-4 level). Heavy use of 'Here's why this matters'. Ends with emotional punch.",
    exampleHook: "This man has 47 million followers. Here's why you've never heard of him."
  },
  { 
    id: "mrbeast", 
    name: "MrBeast", 
    icon: "Gamepad2",
    description: "Big, bold, challenge-based",
    characteristics: "Big bold claims upfront. Challenge/experiment framing. High energy, exclamation points. Numbers and stakes emphasized. 'I [did crazy thing]' format. Fast cuts implied.",
    exampleHook: "I spent $100,000 testing which thumbnail gets more clicks. Here's what I found."
  },
  { 
    id: "alex_hormozi", 
    name: "Alex Hormozi", 
    icon: "DollarSign",
    description: "Direct, contrarian, business",
    characteristics: "Direct, no-fluff business advice. Contrarian takes on common beliefs. 'Most people think X. They're wrong.' pattern. Framework/system reveals. Confident, authoritative tone.",
    exampleHook: "Stop posting educational content. It's killing your sales. Here's why."
  },
  { 
    id: "gary_vee", 
    name: "Gary Vee", 
    icon: "Flame",
    description: "Raw, motivational, hustle",
    characteristics: "Raw, unfiltered energy. Motivational + tactical mix. 'Listen...' or 'Here's the thing...' openers. Real talk, no polish. Short, punchy, repetitive emphasis.",
    exampleHook: "Listen. You're not posting enough. I don't care what you think. You're not."
  },
  { 
    id: "ali_abdaal", 
    name: "Ali Abdaal", 
    icon: "BookOpen",
    description: "Calm, evidence-based, structured",
    characteristics: "Calm, thoughtful delivery. Evidence-based claims. 'I've been [doing thing] for [time]...' credibility. Structured with clear takeaways. Academic but accessible.",
    exampleHook: "I've been making YouTube videos for 6 years. Here are the 3 things I wish I knew from day one."
  },
  { 
    id: "codie_sanchez", 
    name: "Codie Sanchez", 
    icon: "Building2",
    description: "Contrarian wealth, insider",
    characteristics: "'Boring business' framing. Contrarian wealth advice. 'Rich people don't [common thing]' pattern. Behind-the-scenes business reveals. Confident, insider knowledge tone.",
    exampleHook: "Millionaires don't invest in stocks. Here's what they buy instead."
  },
  { 
    id: "steven_bartlett", 
    name: "Steven Bartlett", 
    icon: "MessageCircle",
    description: "Deep, philosophical, vulnerable",
    characteristics: "Deep, philosophical questions. Vulnerability + success mix. 'The truth about [topic]...' framing. Longer, more reflective sentences. Emotional depth. Personal story integration.",
    exampleHook: "I built a $300M company and I've never been more confused about success. Here's what I mean."
  },
] as const;

// Funnel Stages for content strategy
export const funnelStages = [
  { id: "tofu", name: "TOFU (Top of Funnel)", description: "Awareness content to attract new audience", goal: "Engagement & Discovery" },
  { id: "mofu", name: "MOFU (Middle of Funnel)", description: "Value content to build trust", goal: "Nurturing & Authority" },
  { id: "bofu", name: "BOFU (Bottom of Funnel)", description: "Conversion content to drive action", goal: "Sales & Signups" },
] as const;

// CTA Library organized by funnel stage
export const ctaLibrary = [
  // TOFU - Engagement CTAs (Awareness, Discovery)
  { id: "comment_experience", stage: "tofu", category: "engage", text: "Comment if you've experienced this", why: "Low friction, builds engagement" },
  { id: "save_later", stage: "tofu", category: "save", text: "Save this for later", why: "Boosts saves, helps algorithm" },
  { id: "share_friend", stage: "tofu", category: "engage", text: "Tag someone who needs to see this", why: "Increases reach organically" },
  { id: "follow_more", stage: "tofu", category: "follow", text: "Follow for more [topic] tips", why: "Simple follow ask for new viewers" },
  { id: "drop_emoji", stage: "tofu", category: "engage", text: "Drop a [relevant icon] if this resonates", why: "Quick engagement, shows agreement" },
  { id: "what_would_you", stage: "tofu", category: "engage", text: "What would you do in this situation?", why: "Drives comments through questions" },
  
  // MOFU - Value Exchange CTAs (Nurturing, Trust Building)  
  { id: "dm_guide", stage: "mofu", category: "lead", text: "DM me 'GUIDE' and I'll send you the template", why: "Captures leads via DMs" },
  { id: "comment_word", stage: "mofu", category: "lead", text: "Comment '[WORD]' and I'll send you [resource]", why: "Public commitment + lead gen" },
  { id: "link_bio_free", stage: "mofu", category: "link", text: "Link in bio for the free [resource]", why: "Drives traffic to lead magnet" },
  { id: "save_reference", stage: "mofu", category: "save", text: "Save this so you don't forget", why: "Positions as reference material" },
  { id: "part_two", stage: "mofu", category: "follow", text: "Follow for Part 2 tomorrow", why: "Creates anticipation and follows" },
  { id: "want_more", stage: "mofu", category: "engage", text: "Want me to go deeper on this? Comment 'YES'", why: "Gauges interest + engagement" },
  
  // BOFU - Conversion CTAs (Sales, Action)
  { id: "book_call", stage: "bofu", category: "action", text: "Link in bio to book a free call", why: "Direct conversion to sales call" },
  { id: "limited_spots", stage: "bofu", category: "action", text: "Only [X] spots left - link in bio", why: "Scarcity drives action" },
  { id: "dm_buy", stage: "bofu", category: "action", text: "DM me 'READY' to get started", why: "Low friction buying signal" },
  { id: "join_community", stage: "bofu", category: "community", text: "Join [X] others in our community - link in bio", why: "Social proof + conversion" },
  { id: "enrollment_open", stage: "bofu", category: "action", text: "Enrollment is open now - link in bio", why: "Clear call for time-sensitive offer" },
  { id: "apply_now", stage: "bofu", category: "action", text: "Apply at the link in bio [limited availability]", why: "Exclusivity positioning" },
  
  // Evergreen CTAs (work across funnel stages)
  { id: "subscribe_more", stage: "tofu", category: "follow", text: "Subscribe for more content like this", why: "Platform-agnostic follow ask" },
  { id: "turn_on_notifs", stage: "mofu", category: "follow", text: "Turn on notifications so you don't miss this", why: "Increases notification follows" },
  { id: "share_needed", stage: "tofu", category: "engage", text: "Share this with someone who needs to hear it", why: "Viral sharing prompt" },
  { id: "which_resonates", stage: "tofu", category: "engage", text: "Which one resonates most? Comment 1, 2, or 3", why: "Easy engagement for list content" },
  { id: "check_pinned", stage: "mofu", category: "link", text: "Check my pinned post for [resource]", why: "Drives to key content" },
  { id: "questions_dm", stage: "mofu", category: "lead", text: "Questions? DM me anytime", why: "Opens conversation, builds rapport" },
] as const;

// Creator niches for organization
export const creatorNiches = [
  { id: "business", name: "Business & Entrepreneurship", description: "Business strategy, sales, and entrepreneurship advice", icon: "Briefcase" },
  { id: "education", name: "Educational & Storytelling", description: "Educational content and compelling storytelling", icon: "GraduationCap" },
  { id: "finance", name: "Finance & Wealth", description: "Personal finance and wealth building", icon: "Wallet" },
  { id: "fitness", name: "Fitness & Health", description: "Workouts, nutrition, and gym culture", icon: "Dumbbell" },
  { id: "lifestyle", name: "Lifestyle & Personal Development", description: "Leadership, purpose, and self-improvement", icon: "Heart" },
] as const;

// Extended creator styles with niche assignments (IDs match creator-styles.ts)
export const extendedCreatorStyles = [
  // Business & Entrepreneurship
  { id: "hormozi", nicheId: "business", name: "Alex Hormozi", followers: "6.8M+", tone: "Authoritative, confident", exampleHook: "Stop posting educational content. It's killing your sales." },
  { id: "garyvee", nicheId: "business", name: "Gary Vee", followers: "29M+", tone: "Raw, energetic, passionate", exampleHook: "Listen. You're not posting enough. Period." },
  { id: "codie", nicheId: "business", name: "Codie Sanchez", followers: "3M+", tone: "Confident, insider", exampleHook: "Millionaires don't invest in stocks. Here's what they buy instead." },
  { id: "bartlett", nicheId: "business", name: "Steven Bartlett", followers: "4.5M+", tone: "Thoughtful, introspective", exampleHook: "I built a $300M company. And I've never been more confused about success." },
  
  // Educational & Storytelling
  { id: "nasdaily", nicheId: "education", name: "Nas Daily", followers: "62M+", tone: "Enthusiastic, warm", exampleHook: "This man has 47 million followers. And you've never heard of him." },
  { id: "aliabdaal", nicheId: "education", name: "Ali Abdaal", followers: "6.2M+", tone: "Calm, evidence-based", exampleHook: "I've been studying productivity for 10 years. Here's the biggest mistake people make." },
  { id: "jayshetty", nicheId: "education", name: "Jay Shetty", followers: "21M+", tone: "Peaceful, wise", exampleHook: "A $100 bill in a gold frame is worth $100. A $100 bill crumpled on the floor is still worth $100." },
  
  // Finance & Wealth
  { id: "ramit", nicheId: "finance", name: "Ramit Sethi", followers: "2.1M+", tone: "Direct, confident", exampleHook: "Stop cutting lattes. It's not going to make you rich." },
  { id: "viviantu", nicheId: "finance", name: "Vivian Tu", followers: "6.3M+", tone: "Energetic, friendly", exampleHook: "Why isn't anyone talking about this? You're leaving free money on the table." },
  { id: "humphrey", nicheId: "finance", name: "Humphrey Yang", followers: "4.5M+", tone: "Friendly, educational", exampleHook: "Let me show you the power of compound interest." },
  
  // Fitness & Health
  { id: "chrisheria", nicheId: "fitness", name: "Chris Heria", followers: "19M+", tone: "High energy, motivational", exampleHook: "Can you do 10 of these? Most people can't." },
  { id: "jeffnippard", nicheId: "fitness", name: "Jeff Nippard", followers: "7.5M+", tone: "Educational, scientific", exampleHook: "Doing cardio after lifting kills your gains. Or does it?" },
  { id: "chloeting", nicheId: "fitness", name: "Chloe Ting", followers: "29M+", tone: "Encouraging, upbeat", exampleHook: "Want visible abs in 2 weeks? Here's what we're doing." },
  { id: "joeyswoll", nicheId: "fitness", name: "Joey Swoll", followers: "15M+", tone: "Direct, protective", exampleHook: "If you do this at the gym, you need to stop." },
  
  // Lifestyle & Personal Development
  { id: "simonsinek", nicheId: "lifestyle", name: "Simon Sinek", followers: "6M+", tone: "Thoughtful, measured", exampleHook: "The best leaders don't tell people what to do. They tell them why they're doing it." },
  { id: "melrobbins", nicheId: "lifestyle", name: "Mel Robbins", followers: "11M+", tone: "High energy, direct", exampleHook: "Let me tell you why you can't stop procrastinating. It's not because you're lazy." },
] as const;

// Combined creator styles for dropdown (extended + legacy where IDs differ)
const extendedIds = extendedCreatorStyles.map(e => e.id as string);
export const allCreatorStyles = [
  ...extendedCreatorStyles,
  // Add any legacy styles that have different IDs for backwards compatibility
  ...creatorStyles.filter(legacy => 
    !extendedIds.includes(legacy.id) && legacy.id !== "default"
  ).map(legacy => ({
    id: legacy.id,
    nicheId: "business" as const,
    name: legacy.name,
    followers: "",
    tone: legacy.description,
    exampleHook: legacy.exampleHook
  }))
];

// Platform Options
export const platformOptions = [
  { id: "tiktok", name: "TikTok", optimalLength: "15-60s", style: "Trendy, fast, hooks in 1s", hashtags: "#fyp #viral" },
  { id: "instagram_reels", name: "Instagram Reels", optimalLength: "30-90s", style: "Polished, aesthetic", hashtags: "Fewer, targeted" },
  { id: "youtube_shorts", name: "YouTube Shorts", optimalLength: "30-60s", style: "Educational, value-packed", hashtags: "SEO-focused titles" },
  { id: "linkedin", name: "LinkedIn", optimalLength: "30-90s", style: "Professional, insight-led", hashtags: "Industry-specific" },
] as const;

// Duration Options
export const durationOptions = [
  { id: "15", name: "15 seconds", wordCount: "30-45 words" },
  { id: "30", name: "30 seconds", wordCount: "60-80 words" },
  { id: "60", name: "60 seconds", wordCount: "90-120 words" },
  { id: "90", name: "90 seconds", wordCount: "135-180 words" },
] as const;

// Quick Presets with world-class script writer samples
export const quickPresets = [
  { 
    id: "business_growth", 
    name: "Business Growth Engine", 
    description: "High-converting marketing content", 
    category: "business_marketing", 
    hook: "number_flex", 
    structure: "problem_solver", 
    tone: "direct", 
    voice: "confident",
    sampleTopic: "The exact 3-step cold outreach system I used to book 47 sales calls last month without spending a dollar on ads",
    sampleAudience: "Entrepreneurs and business owners struggling to get consistent leads",
    sampleCta: "Drop 'SYSTEM' in the comments and I'll send you my exact templates",
    sampleFacts: "47 calls booked, $0 ad spend, 23% response rate, 6-figure pipeline"
  },
  { 
    id: "ai_tech", 
    name: "AI & Tech Insider", 
    description: "Futuristic and high-energy tech breakdowns", 
    category: "ai_technology", 
    hook: "hidden_truth", 
    structure: "breakdown", 
    tone: "high_energy", 
    voice: "inquisitive",
    sampleTopic: "This new AI feature just dropped and nobody is talking about it. It's going to replace 80% of what most marketers do manually",
    sampleAudience: "Tech-savvy professionals and early adopters who want an edge",
    sampleCta: "Follow for daily AI updates that'll keep you ahead of 99% of people",
    sampleFacts: "Launched this week, free to use, 10x faster than current methods, integrates with everything"
  },
  { 
    id: "viral_growth", 
    name: "Viral Growth Hacks", 
    description: "Fast-paced tips for social growth", 
    category: "social_growth", 
    hook: "countdown", 
    structure: "listicle", 
    tone: "high_energy", 
    voice: "confident",
    sampleTopic: "5 hooks that got me 10M views this month. Number 3 is the one everyone sleeps on",
    sampleAudience: "Content creators who want more views and engagement",
    sampleCta: "Save this and use hook #3 on your next video. Trust me.",
    sampleFacts: "10M+ views, tested on 200+ videos, works on TikTok/Reels/Shorts, takes 5 seconds to add"
  },
  { 
    id: "personal_brand", 
    name: "Authentic Personal Brand", 
    description: "Relatable storytelling to build trust", 
    category: "personal_branding", 
    hook: "unlikely_start", 
    structure: "story_arc", 
    tone: "conversational", 
    voice: "relatable",
    sampleTopic: "I quit my 6-figure job with no backup plan. Here's the uncomfortable truth about what happened next",
    sampleAudience: "People feeling stuck in their careers dreaming of something more",
    sampleCta: "If this resonates, follow for more stories from the journey",
    sampleFacts: "Left corporate 2 years ago, first 6 months were brutal, now earning 3x my old salary, working 20 hours less"
  },
] as const;

// Predefined CTA Library
export const ctaCategories = [
  { id: "follow", name: "Follow / Subscribe", description: "Grow your audience" },
  { id: "engage", name: "Engagement", description: "Comments, likes, shares" },
  { id: "save", name: "Save / Bookmark", description: "Build content library" },
  { id: "link", name: "Link in Bio", description: "Drive traffic" },
  { id: "action", name: "Take Action", description: "Specific next steps" },
  { id: "community", name: "Community", description: "Build relationships" },
] as const;

export const ctaOptions = [
  // Follow / Subscribe CTAs
  { id: "follow_more", category: "follow", text: "Follow for more tips like this", short: "Follow for more" },
  { id: "follow_daily", category: "follow", text: "Follow for daily [topic] content", short: "Follow for daily tips" },
  { id: "follow_journey", category: "follow", text: "Follow along on my journey", short: "Follow my journey" },
  { id: "follow_miss", category: "follow", text: "Follow so you don't miss part 2", short: "Don't miss part 2" },
  { id: "follow_first", category: "follow", text: "Follow to be first to know when I drop new content", short: "Be first to know" },
  
  // Engagement CTAs
  { id: "comment_question", category: "engage", text: "Drop a [emoji] in the comments if this resonated", short: "Drop a comment" },
  { id: "comment_tell", category: "engage", text: "Tell me in the comments - which one are you trying first?", short: "Which one first?" },
  { id: "share_friend", category: "engage", text: "Share this with someone who needs to hear it", short: "Share with a friend" },
  { id: "tag_friend", category: "engage", text: "Tag a friend who's going through this", short: "Tag a friend" },
  { id: "duet_stitch", category: "engage", text: "Duet/Stitch this with your experience", short: "Duet this" },
  
  // Save / Bookmark CTAs
  { id: "save_later", category: "save", text: "Save this for later - you'll need it", short: "Save for later" },
  { id: "save_reference", category: "save", text: "Bookmark this as your go-to reference", short: "Bookmark this" },
  { id: "save_comeback", category: "save", text: "Save this and come back when you're ready", short: "Come back to this" },
  { id: "screenshot", category: "save", text: "Screenshot this before you scroll", short: "Screenshot now" },
  
  // Link in Bio CTAs
  { id: "link_free", category: "link", text: "Grab my free [resource] - link in bio", short: "Free resource in bio" },
  { id: "link_guide", category: "link", text: "Full guide in my bio", short: "Guide in bio" },
  { id: "link_tool", category: "link", text: "I linked the tool in my bio", short: "Tool in bio" },
  { id: "link_checklist", category: "link", text: "Get the free checklist - link in bio", short: "Checklist in bio" },
  
  // Take Action CTAs
  { id: "try_today", category: "action", text: "Try this today and let me know what happens", short: "Try it today" },
  { id: "start_now", category: "action", text: "Start with step 1 right now", short: "Start now" },
  { id: "dm_word", category: "action", text: "DM me '[word]' for more details", short: "DM me" },
  { id: "test_yourself", category: "action", text: "Test this on your next [content type]", short: "Test it" },
  
  // Community CTAs
  { id: "lets_connect", category: "community", text: "Let's connect - I reply to every comment", short: "Let's connect" },
  { id: "ask_anything", category: "community", text: "Ask me anything in the comments", short: "Ask me anything" },
  { id: "join_community", category: "community", text: "Join our community of [description]", short: "Join us" },
  { id: "help_each", category: "community", text: "Help each other out in the comments", short: "Help each other" },
] as const;

// Script Parameters Interface
export interface ScriptParameters {
  topic: string;
  targetAudience?: string;
  callToAction?: string;
  selectedCtaId?: string;
  customCta?: string;
  keyFacts?: string;
  platform: string;
  duration: string;
  category: string;
  structure: string;
  hook: string;
  tone?: string;
  voice?: string;
  pacing?: string;
  deepResearch?: boolean;
  contentStrategy?: string;
  useKnowledgeBase?: boolean;
  videoType?: string;
  creatorStyle?: string;
  referenceScript?: string;
  contentSkeleton?: {
    topicSummary: string;
    targetAudience: string;
    uniqueAngle: string;
    sections: Array<{
      id: string;
      title: string;
      objective: string;
      keyMoments: string[];
      suggestedDuration: string;
    }>;
    researchFacts: Array<{
      id: string;
      fact: string;
      source?: string;
      credibility: "high" | "medium" | "low";
      isUsed: boolean;
    }>;
    suggestedHooks: string[];
    isLocked: boolean;
  };
  videoIdeaSkeleton?: {
    hook: string;
    problem: string;
    solution: string;
    cta: string;
    targetAudience?: string;
    videoPurpose?: string;
    isLocked: boolean;
  };
}

// Scene breakdown for production
export interface SceneBreakdown {
  section: string;
  lines: string;
  duration: string;
  camera: string;
  energy: string;
}

// Generated Script Interface
export interface GeneratedScript {
  id: string;
  script: string;
  wordCount: number;
  gradeLevel: number;
  productionNotes: string;
  bRollIdeas: string[];
  onScreenText: string[];
  cameraAngles: string[];
  transitions: string[];
  musicMood: string;
  captionStyle: string;
  pacing: string;
  lighting: string;
  scenes: SceneBreakdown[];
  parameters: ScriptParameters;
  createdAt: Date;
  research?: string;
  referenceAnalysis?: string;
}

// Content Skeleton for Deep Research Mode
export interface ResearchFact {
  id: string;
  fact: string;
  source?: string;
  credibility: "high" | "medium" | "low";
  isUsed: boolean;
}

export interface ContentSection {
  id: string;
  title: string;
  objective: string;
  keyMoments: string[];
  suggestedDuration: string;
}

export interface ContentSkeleton {
  topicSummary: string;
  targetAudience: string;
  uniqueAngle: string;
  sections: ContentSection[];
  researchFacts: ResearchFact[];
  competitorInsights?: string[];
  suggestedHooks: string[];
  isLocked: boolean;
}

// Video Purpose Types - determines the structure and approach
export type VideoPurposeType = "authority" | "education" | "storytelling";

export interface VideoPurpose {
  id: VideoPurposeType;
  name: string;
  description: string;
  icon: string;
  problemGuidance: string;
  solutionGuidance: string;
  hookGuidance: string;
}

export const videoPurposes: VideoPurpose[] = [
  {
    id: "authority",
    name: "Authority",
    description: "Position yourself as an expert. Share unique insights, opinions, or predictions.",
    icon: "Crown",
    problemGuidance: "What common belief or practice in your industry is wrong or outdated?",
    solutionGuidance: "What's your contrarian take or unique insight that proves your expertise?",
    hookGuidance: "Challenge the status quo or make a bold claim that grabs attention",
  },
  {
    id: "education", 
    name: "Education",
    description: "Teach something valuable. Help viewers learn a skill or understand a concept.",
    icon: "GraduationCap",
    problemGuidance: "What struggle or knowledge gap does your audience face?",
    solutionGuidance: "What's the step-by-step method, framework, or technique that solves this?",
    hookGuidance: "Promise a specific outcome or reveal a surprising truth about the topic",
  },
  {
    id: "storytelling",
    name: "Storytelling", 
    description: "Share a personal experience. Connect emotionally through narrative.",
    icon: "BookOpen",
    problemGuidance: "What challenge, failure, or turning point did you experience?",
    solutionGuidance: "What lesson, realization, or transformation came from this experience?",
    hookGuidance: "Open with a moment of tension, curiosity, or vulnerability",
  },
];

// Video Idea Clarifier - Mandatory 4-Section Skeleton
export type SkeletonSectionType = "hook" | "problem" | "solution" | "cta";

export interface SkeletonSection {
  type: SkeletonSectionType;
  title: string;
  content: string;
  guidingQuestion: string;
  examples: string[];
  isValid: boolean;
  validationMessage?: string;
}

export interface VideoIdeaSkeleton {
  rawIdea: string;
  videoPurpose: VideoPurposeType;
  hook: SkeletonSection;
  problem: SkeletonSection;
  solution: SkeletonSection;
  cta: SkeletonSection;
  targetAudience: string;
  platform: string;
  duration: string;
  isLocked: boolean;
  clarityScore: number; // 0-100, must be >= 70 to proceed
}

// Skeleton validation rules
export const skeletonValidationRules = {
  hook: {
    minLength: 10,
    maxLength: 200,
    requiresSpecificity: true,
    guidingQuestion: "What will make someone stop scrolling and feel 'this is for me'?",
    examples: [
      "I lost $50K following this 'expert' advice",
      "The AI tool nobody is talking about",
      "Why your morning routine is killing your productivity"
    ]
  },
  problem: {
    minLength: 20,
    maxLength: 300,
    requiresSpecificity: true,
    guidingQuestion: "What pain, frustration, or tension does the viewer recognize immediately?",
    examples: [
      "Most people waste 3 hours daily on tasks that could be automated",
      "You're told to 'just be confident' but no one explains how",
      "Every productivity tip ignores the real reason you procrastinate"
    ]
  },
  solution: {
    minLength: 20,
    maxLength: 500,
    requiresSpecificity: true,
    guidingQuestion: "What is THE core teaching - the golden nugget your entire video is built around?",
    examples: [
      "The 2-minute rule: If something takes less than 2 minutes, do it now instead of adding it to your to-do list",
      "One simple reframe: Instead of asking 'what if I fail?' ask 'what if I never try?' - this removes the pressure of perfection",
      "The 80/20 automation principle: Focus only on automating the 20% of tasks that take up 80% of your time"
    ]
  },
  cta: {
    minLength: 10,
    maxLength: 150,
    requiresSpecificity: false,
    guidingQuestion: "What should the viewer do next - think, click, comment, or act?",
    examples: [
      "Save this for your next meeting",
      "Comment 'TEMPLATE' and I'll send you the full guide",
      "Follow for part 2 tomorrow"
    ]
  }
};

// Create empty skeleton with defaults
export function createEmptySkeleton(rawIdea: string = "", platform: string = "tiktok", duration: string = "60", videoPurpose: VideoPurposeType = "education"): VideoIdeaSkeleton {
  const purpose = videoPurposes.find(p => p.id === videoPurpose) || videoPurposes[1];
  
  return {
    rawIdea,
    videoPurpose,
    hook: {
      type: "hook",
      title: "Hook",
      content: "",
      guidingQuestion: purpose.hookGuidance,
      examples: skeletonValidationRules.hook.examples,
      isValid: false,
    },
    problem: {
      type: "problem",
      title: "Problem",
      content: "",
      guidingQuestion: purpose.problemGuidance,
      examples: skeletonValidationRules.problem.examples,
      isValid: false,
    },
    solution: {
      type: "solution",
      title: "Core Teaching",
      content: "",
      guidingQuestion: purpose.solutionGuidance,
      examples: skeletonValidationRules.solution.examples,
      isValid: false,
    },
    cta: {
      type: "cta",
      title: "Call to Action",
      content: "",
      guidingQuestion: skeletonValidationRules.cta.guidingQuestion,
      examples: skeletonValidationRules.cta.examples,
      isValid: false,
    },
    targetAudience: "",
    platform,
    duration,
    isLocked: false,
    clarityScore: 0,
  };
}

// Validate a skeleton section
export function validateSkeletonSection(section: SkeletonSection): { isValid: boolean; message?: string } {
  const rules = skeletonValidationRules[section.type];
  const content = section.content.trim();
  
  if (!content) {
    return { isValid: false, message: "This section cannot be empty" };
  }
  
  if (content.length < rules.minLength) {
    return { isValid: false, message: `Be more specific - at least ${rules.minLength} characters` };
  }
  
  if (content.length > rules.maxLength) {
    return { isValid: false, message: `Too long - keep it under ${rules.maxLength} characters` };
  }
  
  // Check for vague language patterns
  if (rules.requiresSpecificity) {
    const vaguePatterns = [
      /^(something|stuff|things|etc|whatever)/i,
      /\b(maybe|possibly|might|could be|i think|i guess)\b/i,
      /^(good|bad|nice|great|cool|awesome) /i,
    ];
    
    for (const pattern of vaguePatterns) {
      if (pattern.test(content)) {
        return { isValid: false, message: "Be more specific - avoid vague language" };
      }
    }
  }
  
  return { isValid: true };
}

// Deep Research Brief (from API)
export interface DeepResearchBrief {
  coreMessage: string;
  targetViewer: string;
  uniqueAngle: string;
  keyProofPoints: string[];
  actionableTakeaway: string;
}

// Competitor Insights (from Apify/TikTok analysis)
export interface CompetitorAnalysis {
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
  postsAnalyzed: number;
}

// Enhanced Skeleton - Step 2 of the flow
export interface EnhancedSkeleton {
  baseSkeleton: VideoIdeaSkeleton;
  research?: DeepResearchBrief;
  competitorAnalysis?: CompetitorAnalysis;
  selectedInsights: string[]; // User-picked insights to use in script
  refinedHook?: string; // Optional refined hook based on research
  additionalNotes?: string; // User notes/tweaks
  isEnhanced: boolean;
}

// Create enhanced skeleton from base
export function createEnhancedSkeleton(baseSkeleton: VideoIdeaSkeleton): EnhancedSkeleton {
  return {
    baseSkeleton,
    selectedInsights: [],
    isEnhanced: false,
  };
}

// Calculate overall clarity score
export function calculateClarityScore(skeleton: VideoIdeaSkeleton): number {
  const sections = [skeleton.hook, skeleton.problem, skeleton.solution, skeleton.cta];
  let score = 0;
  
  for (const section of sections) {
    const validation = validateSkeletonSection(section);
    if (validation.isValid) {
      score += 25;
    } else if (section.content.length > 0) {
      // Partial credit for started but not complete
      score += 10;
    }
  }
  
  // Bonus for target audience
  if (skeleton.targetAudience.trim().length >= 10) {
    score = Math.min(100, score + 5);
  }
  
  return score;
}

// Database Tables
export const scripts = pgTable("scripts", {
  id: varchar("id", { length: 36 }).primaryKey(),
  title: text("title").notNull(),
  script: text("script").notNull(),
  wordCount: text("word_count"),
  gradeLevel: text("grade_level"),
  productionNotes: text("production_notes"),
  bRollIdeas: text("b_roll_ideas"),
  onScreenText: text("on_screen_text"),
  parameters: jsonb("parameters"),
  status: text("status").default("draft"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const projects = pgTable("projects", {
  id: varchar("id", { length: 36 }).primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const vault = pgTable("vault", {
  id: varchar("id", { length: 36 }).primaryKey(),
  scriptId: varchar("script_id", { length: 36 }).notNull(),
  name: text("name").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Insert Schemas
export const insertScriptSchema = createInsertSchema(scripts).omit({ id: true, createdAt: true });
export const insertProjectSchema = createInsertSchema(projects).omit({ id: true, createdAt: true });
export const insertVaultSchema = createInsertSchema(vault).omit({ id: true, createdAt: true });

// Types
export type InsertScript = z.infer<typeof insertScriptSchema>;
export type Script = typeof scripts.$inferSelect;
export type InsertProject = z.infer<typeof insertProjectSchema>;
export type Project = typeof projects.$inferSelect;
export type InsertVault = z.infer<typeof insertVaultSchema>;
export type VaultItem = typeof vault.$inferSelect;

// Pricing Tiers
export const pricingTiers = [
  { 
    id: "starter", 
    name: "Starter", 
    price: 19.99, 
    description: "Essential script generation for content creators",
    popular: false,
    features: [
      "AI-powered script generation",
      "50 viral hooks library",
      "30+ CTA templates",
      "All structure formats",
      "Basic production notes"
    ],
    limits: {
      scriptsPerMonth: 50,
      knowledgeBaseDocs: 0,
      competitorAssets: 0
    }
  },
  { 
    id: "pro", 
    name: "Pro", 
    price: 29.99, 
    description: "Knowledge Base powered scripts for your brand",
    popular: true,
    features: [
      "Everything in Starter",
      "100 scripts per month",
      "Knowledge Base (unlimited docs)",
      "ICP & Brand Voice integration",
      "Content strategy categories",
      "Deep Research mode",
      "Priority support"
    ],
    limits: {
      scriptsPerMonth: 100,
      knowledgeBaseDocs: -1,
      competitorAssets: 0
    }
  },
  { 
    id: "ultimate", 
    name: "Ultimate", 
    price: 99.99, 
    description: "Full content strategy with competitor intelligence",
    popular: false,
    features: [
      "Everything in Pro",
      "Unlimited scripts",
      "Competitor script analysis",
      "Full content strategy builder",
      "TOFU/MOFU/BOFU planning",
      "Multi-brand support",
      "White-label exports"
    ],
    limits: {
      scriptsPerMonth: -1,
      knowledgeBaseDocs: -1,
      competitorAssets: -1
    }
  }
] as const;

// Knowledge Base Document Types
export const knowledgeBaseTypes = [
  { id: "icp", name: "Ideal Customer Profile", description: "Target audience, pain points, goals" },
  { id: "brand_positioning", name: "Brand Positioning", description: "UVP, differentiators, market position" },
  { id: "messaging_house", name: "Messaging House", description: "Key messages, pillars, proof points" },
  { id: "business_box", name: "Business-in-a-Box", description: "Full business analysis and strategy" },
  { id: "rule_of_one", name: "Rule of One", description: "Avatar, problem, solution, outcome" },
  { id: "voice_dna", name: "Voice DNA", description: "Tone, phrases, emotional signature" },
  { id: "content_strategy", name: "Content Strategy", description: "Pillars, calendar, roadmap" },
  { id: "custom", name: "Custom Document", description: "Any other business document" },
] as const;

// Content Strategy Categories (Funnel Stages)
export const contentStrategyCategories = [
  { id: "tofu", name: "Top of Funnel", description: "Awareness content - myths, trends, viral hooks", color: "blue" },
  { id: "mofu", name: "Middle of Funnel", description: "Consideration content - case studies, demos, proof", color: "purple" },
  { id: "bofu", name: "Bottom of Funnel", description: "Decision content - ROI, testimonials, offers", color: "green" },
  { id: "personal_stories", name: "Personal Stories", description: "Founder journey, confessions, lessons learned", color: "orange" },
  { id: "hot_takes", name: "Hot Takes", description: "Contrarian views, industry critiques, bold opinions", color: "red" },
] as const;

// User types are now from ./models/auth (Replit Auth)
// Additional validation schema for auth
export const authCredentialsSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});
export type AuthCredentials = z.infer<typeof authCredentialsSchema>;

// Knowledge Base Documents Table
export const knowledgeBase = pgTable("knowledge_base", {
  id: varchar("id", { length: 36 }).primaryKey(),
  userId: varchar("user_id", { length: 36 }),
  type: text("type").notNull(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  summary: text("summary"),
  tags: text("tags"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertKnowledgeBaseSchema = createInsertSchema(knowledgeBase).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertKnowledgeBase = z.infer<typeof insertKnowledgeBaseSchema>;
export type KnowledgeBaseDoc = typeof knowledgeBase.$inferSelect;

// Competitor Assets Table (Agency tier)
export const competitorAssets = pgTable("competitor_assets", {
  id: varchar("id", { length: 36 }).primaryKey(),
  userId: varchar("user_id", { length: 36 }),
  name: text("name").notNull(),
  platform: text("platform"),
  profileUrl: text("profile_url"),
  scripts: text("scripts"),
  analysis: text("analysis"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertCompetitorAssetSchema = createInsertSchema(competitorAssets).omit({ id: true, createdAt: true });
export type InsertCompetitorAsset = z.infer<typeof insertCompetitorAssetSchema>;
export type CompetitorAsset = typeof competitorAssets.$inferSelect;

// Content Strategies Table
export const contentStrategies = pgTable("content_strategies", {
  id: varchar("id", { length: 36 }).primaryKey(),
  userId: varchar("user_id", { length: 36 }),
  name: text("name").notNull(),
  category: text("category").notNull(),
  topics: text("topics"),
  hooks: text("hooks"),
  schedule: text("schedule"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertContentStrategySchema = createInsertSchema(contentStrategies).omit({ id: true, createdAt: true });
export type InsertContentStrategy = z.infer<typeof insertContentStrategySchema>;
export type ContentStrategy = typeof contentStrategies.$inferSelect;

// Script Versions Table (Version History)
export const scriptVersions = pgTable("script_versions", {
  id: varchar("id", { length: 36 }).primaryKey(),
  scriptId: varchar("script_id", { length: 36 }).notNull(),
  userId: varchar("user_id", { length: 255 }),
  version: text("version").notNull().default("1"),
  label: text("label"),
  script: text("script").notNull(),
  wordCount: text("word_count"),
  gradeLevel: text("grade_level"),
  parameters: jsonb("parameters"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertScriptVersionSchema = createInsertSchema(scriptVersions).omit({ id: true, createdAt: true });
export type InsertScriptVersion = z.infer<typeof insertScriptVersionSchema>;
export type ScriptVersion = typeof scriptVersions.$inferSelect;

// Collaborative Sessions Table
export const collaborativeSessions = pgTable("collaborative_sessions", {
  id: varchar("id", { length: 36 }).primaryKey(),
  scriptId: varchar("script_id", { length: 36 }).notNull(),
  ownerId: varchar("owner_id", { length: 255 }).notNull(),
  activeEditors: jsonb("active_editors").default([]),
  lastActivity: timestamp("last_activity").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertCollaborativeSessionSchema = createInsertSchema(collaborativeSessions).omit({ id: true, createdAt: true });
export type InsertCollaborativeSession = z.infer<typeof insertCollaborativeSessionSchema>;
export type CollaborativeSession = typeof collaborativeSessions.$inferSelect;

// User Usage Tracking Table
export const userUsage = pgTable("user_usage", {
  id: varchar("id", { length: 36 }).primaryKey(),
  userId: varchar("user_id", { length: 255 }).notNull(),
  month: varchar("month", { length: 7 }).notNull(), // YYYY-MM format
  scriptsGenerated: text("scripts_generated").default("0"),
  deepResearchUsed: text("deep_research_used").default("0"),
  knowledgeBaseQueries: text("knowledge_base_queries").default("0"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertUserUsageSchema = createInsertSchema(userUsage).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertUserUsage = z.infer<typeof insertUserUsageSchema>;
export type UserUsage = typeof userUsage.$inferSelect;

// User Subscriptions Table
export const userSubscriptions = pgTable("user_subscriptions", {
  id: varchar("id", { length: 36 }).primaryKey(),
  userId: varchar("user_id", { length: 255 }).notNull().unique(),
  plan: varchar("plan", { length: 50 }).notNull().default("starter"),
  status: varchar("status", { length: 50 }).notNull().default("active"), // active, cancelled, expired
  billingCycle: varchar("billing_cycle", { length: 20 }).default("monthly"), // monthly, yearly
  currentPeriodStart: timestamp("current_period_start"),
  currentPeriodEnd: timestamp("current_period_end"),
  cancelAtPeriodEnd: text("cancel_at_period_end").default("false"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertUserSubscriptionSchema = createInsertSchema(userSubscriptions).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertUserSubscription = z.infer<typeof insertUserSubscriptionSchema>;
export type UserSubscription = typeof userSubscriptions.$inferSelect;

// Script Templates Table - Custom user-created templates
export const scriptTemplates = pgTable("script_templates", {
  id: varchar("id", { length: 36 }).primaryKey(),
  userId: varchar("user_id", { length: 255 }).notNull(),
  name: text("name").notNull(),
  description: text("description"),
  platform: text("platform").notNull().default("tiktok"),
  duration: text("duration").notNull().default("90"),
  category: text("category").notNull().default("content_creation"),
  structure: text("structure").notNull().default("problem_solver"),
  hook: text("hook").notNull().default("painful_past"),
  tone: text("tone"),
  voice: text("voice"),
  pacing: text("pacing"),
  videoType: text("video_type").default("talking_head"),
  creatorStyle: text("creator_style").default("default"),
  defaultTargetAudience: text("default_target_audience"),
  defaultCta: text("default_cta"),
  isPublic: text("is_public").default("false"),
  usageCount: text("usage_count").default("0"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertScriptTemplateSchema = createInsertSchema(scriptTemplates).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertScriptTemplate = z.infer<typeof insertScriptTemplateSchema>;
export type ScriptTemplate = typeof scriptTemplates.$inferSelect;

// CTA Templates Table - Saved user CTA templates
export const ctaTemplates = pgTable("cta_templates", {
  id: varchar("id", { length: 36 }).primaryKey(),
  userId: varchar("user_id", { length: 255 }).notNull(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  category: text("category").default("general"),
  sourceContext: jsonb("source_context"),
  usageCount: text("usage_count").default("0"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertCtaTemplateSchema = createInsertSchema(ctaTemplates).omit({ id: true, createdAt: true });
export type InsertCtaTemplate = z.infer<typeof insertCtaTemplateSchema>;
export type CtaTemplate = typeof ctaTemplates.$inferSelect;

// Competitive Analysis Types
export interface CompetitorVideo {
  id: string;
  platform: "instagram" | "tiktok";
  videoUrl: string;
  thumbnailUrl: string;
  caption: string;
  creatorHandle: string;
  creatorName: string;
  creatorAvatar?: string;
  creatorFollowers?: number;
  postedAt: string;
  views: number;
  likes: number;
  comments: number;
  shares?: number;
  engagementRate: number;
  outlierScore: number; // How much better than creator's average (e.g., 7x means 7 times average)
  duration?: number;
  hashtags?: string[];
  formatType?: string; // listicle, story, tutorial, etc.
  hookType?: string; // question, statistic, contrarian, etc.
}

export interface CompetitorProfile {
  id: string;
  platform: "instagram" | "tiktok";
  handle: string;
  displayName: string;
  avatarUrl?: string;
  followers: number;
  avgViews: number;
  avgEngagement: number;
  totalVideos: number;
  topVideos: CompetitorVideo[];
}

export interface CompetitiveSearchResult {
  query: string;
  platforms: ("instagram" | "tiktok")[];
  totalResults: number;
  profiles: CompetitorProfile[];
  videos: CompetitorVideo[];
  analytics: {
    avgViews: number;
    avgEngagement: number;
    dominantFormats: string[];
    bestPerformingDuration: string;
    topHookTypes: string[];
  };
  searchedAt: string;
}

export interface CompetitiveSearchFilters {
  keyword?: string;
  platforms?: ("instagram" | "tiktok")[];
  channels?: string[];
  dateRange?: { start: string; end: string };
  minOutlierScore?: number;
  minViews?: number;
  minEngagement?: number;
  sortBy?: "views" | "engagement" | "outlier" | "date";
}
