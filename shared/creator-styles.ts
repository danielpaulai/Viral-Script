// CREATOR STYLE LIBRARY
// Top Short-Form Video Creators by Niche with Master Prompts + Reference Scripts

export interface CreatorProfile {
  id: string;
  name: string;
  niche: string;
  nicheId: string;
  platforms: string;
  knownFor: string;
  signature: string;
  avgVideoLength: string;
  followers: string;
}

export interface StyleCharacteristics {
  hookStyle: string;
  structure: string;
  tone: string;
  vocabulary: string;
  sentenceLength: string;
  pacing: string;
  visualStyle: string;
  gradeLevel?: string;
  wordsPerMinute?: number;
}

export interface ReferenceScript {
  title: string;
  script: string;
  wordCount: number;
  duration: string;
}

export interface CreatorStyle {
  id: string;
  profile: CreatorProfile;
  characteristics: StyleCharacteristics;
  signaturePhrases: string[];
  hookPatterns: { name: string; template: string }[];
  masterPrompt: string;
  referenceScripts: ReferenceScript[];
}

export interface CreatorNiche {
  id: string;
  name: string;
  description: string;
  creators: string[];
}

// NICHES
export const creatorNiches: CreatorNiche[] = [
  {
    id: "business",
    name: "Business & Entrepreneurship",
    description: "Business strategy, sales, and entrepreneurship advice",
    creators: ["hormozi", "garyvee", "codie", "bartlett"]
  },
  {
    id: "education",
    name: "Educational & Storytelling",
    description: "Educational content and compelling storytelling",
    creators: ["nasdaily", "aliabdaal", "jayshetty"]
  },
  {
    id: "finance",
    name: "Finance & Wealth",
    description: "Personal finance and wealth building",
    creators: ["ramit", "viviantu", "humphrey"]
  },
  {
    id: "fitness",
    name: "Fitness & Health",
    description: "Workouts, nutrition, and gym culture",
    creators: ["chrisheria", "jeffnippard", "chloeting", "joeyswoll"]
  },
  {
    id: "lifestyle",
    name: "Lifestyle & Personal Development",
    description: "Leadership, purpose, and self-improvement",
    creators: ["simonsinek", "melrobbins"]
  }
];

// CREATOR STYLES DATA
export const creatorStyles: CreatorStyle[] = [
  // ============ BUSINESS & ENTREPRENEURSHIP ============
  {
    id: "hormozi",
    profile: {
      id: "hormozi",
      name: "Alex Hormozi",
      niche: "Business & Entrepreneurship",
      nicheId: "business",
      platforms: "YouTube (2.5M+), Instagram (2.8M+), TikTok (1.5M+)",
      knownFor: "Contrarian business advice, no-fluff delivery",
      signature: "Bold captions, direct challenges, personal stories",
      avgVideoLength: "30-90 seconds",
      followers: "6.8M+"
    },
    characteristics: {
      hookStyle: "Direct challenge or contrarian statement",
      structure: "Hook → Personal story/anecdote → Lesson → Implicit CTA",
      tone: "Authoritative, confident, slightly aggressive",
      vocabulary: "Simple words, business jargon avoided",
      sentenceLength: "Short, punchy (5-10 words average)",
      pacing: "Fast, no wasted words",
      visualStyle: "Bold animated captions, emoji overlays, quick cuts",
      gradeLevel: "4-6"
    },
    signaturePhrases: [
      "Here's the thing...",
      "Most people think X. They're wrong.",
      "I learned this the hard way...",
      "Let me tell you why...",
      "Stop doing X. Start doing Y."
    ],
    hookPatterns: [
      { name: "The Direct Challenge", template: "Stop [common action]. It's killing your [result]." },
      { name: "The Contrarian", template: "Everyone says [common belief]. Here's why they're wrong." },
      { name: "The Personal Reveal", template: "I [big result] by doing the opposite of what everyone taught me." },
      { name: "The Reason Reveal", template: "One of the reasons why [surprising behavior] is..." },
      { name: "The Mistake Call-Out", template: "You need to stop making this one mistake." }
    ],
    masterPrompt: `You are a script writer that creates short-form video scripts in the style of Alex Hormozi.

STYLE REQUIREMENTS:
- Open with a direct, challenging hook that creates urgency or FOMO
- Use simple vocabulary (Grade 4-6 reading level)
- Keep sentences under 10 words on average
- Share opinions backed by personal experience, not just facts
- Include a personal anecdote that connects to the main point
- Be contrarian - challenge conventional wisdom
- Sound confident and authoritative, not preachy
- End with an implicit lesson, not a hard sell CTA

STRUCTURE:
1. HOOK (1-2 sentences): Direct challenge or contrarian statement
2. SETUP (1-2 sentences): Why this matters or personal context
3. STORY (3-5 sentences): Brief anecdote illustrating the point
4. LESSON (2-3 sentences): The insight or takeaway
5. CLOSE (1 sentence): Reinforcement or thought-provoking statement

AVOID:
- Fluffy intros ("Hey guys", "What's up")
- Weak hedging language ("I think maybe", "kind of")
- Long sentences or complex vocabulary
- Generic advice without personal backing
- Obvious CTAs ("Follow for more", "Like and subscribe")

VOICE CHARACTERISTICS:
- Direct, like talking to a friend who needs tough love
- Confident but not arrogant
- Uses "you" frequently to speak directly to viewer
- Occasionally uses profanity for emphasis (sparingly)
- Speaks in absolutes ("always", "never", "the only way")`,
    referenceScripts: [
      {
        title: "Business Growth",
        script: `Stop posting educational content.

It's killing your sales.

I spent two years posting "value content" on LinkedIn.
Got lots of likes. Lots of comments.
Zero clients.

Then I realized something.

Educational content attracts students.
Not buyers.

Students want free information.
Buyers want solutions to problems.

So I changed everything.

Stopped teaching. Started selling.

Revenue 10x'd in 90 days.

If you're posting tips and tricks hoping clients show up...

They won't.

Sell the result. Not the education.`,
        wordCount: 78,
        duration: "~45 seconds"
      },
      {
        title: "Sales/Marketing",
        script: `I learned this from Eminem.

And it made my sales 10x more effective.

In rap battles, Eminem would call out his own weaknesses before his opponent could.

"I know I'm white. I know I'm ugly."

His opponents had nothing left to attack.

Same thing works in sales.

Call out your objections before the prospect does.

"Look, we're not the cheapest option."
"We're not for everyone."
"This requires work."

When YOU say it, it's honesty.
When THEY say it, it's a rejection.

Control the narrative.
Win the sale.`,
        wordCount: 91,
        duration: "~55 seconds"
      },
      {
        title: "Pricing/Value",
        script: `You need to stop charging hourly.

Here's why.

When I charged $50/hour for consulting, I worked 60 hours a week and barely survived.

Then I met a guy charging $50,000 for a single project.

Same work. 100x the price.

The difference?

He sold the outcome, not his time.

"I'll increase your revenue by $500K" hits different than "I'll work 40 hours on your business."

Nobody buys hours.

They buy results.

Price the transformation.
Not the time.`,
        wordCount: 82,
        duration: "~50 seconds"
      }
    ]
  },

  {
    id: "garyvee",
    profile: {
      id: "garyvee",
      name: "Gary Vee",
      niche: "Business & Entrepreneurship",
      nicheId: "business",
      platforms: "TikTok (15M+), Instagram (10M+), YouTube (4M+)",
      knownFor: "Raw energy, hustle culture, real talk",
      signature: "Unfiltered delivery, 'document don't create'",
      avgVideoLength: "30-60 seconds",
      followers: "29M+"
    },
    characteristics: {
      hookStyle: "Direct address or provocative statement",
      structure: "Hook → Rant/Lecture → Real talk → Punch line",
      tone: "Raw, energetic, passionate, sometimes aggressive",
      vocabulary: "Street-level, conversational, profanity common",
      sentenceLength: "Varies - short punches mixed with longer rants",
      pacing: "High energy, emphatic pauses for effect",
      visualStyle: "Direct to camera, minimal editing, authentic"
    },
    signaturePhrases: [
      "Listen...",
      "Here's the thing...",
      "You're not [doing X] enough",
      "I don't care what you think",
      "The market doesn't lie",
      "Patience. Patience. Patience."
    ],
    hookPatterns: [
      { name: "The Direct Address", template: "Listen. You need to hear this." },
      { name: "The Truth Bomb", template: "Nobody wants to tell you this but..." },
      { name: "The Reality Check", template: "You're not posting enough. Period." },
      { name: "The Challenge", template: "Show me one person who [did X] and failed." },
      { name: "The Perspective Shift", template: "The reason you're struggling isn't what you think." }
    ],
    masterPrompt: `You are a script writer that creates short-form video scripts in the style of Gary Vee.

STYLE REQUIREMENTS:
- Open with "Listen" or a direct, attention-grabbing statement
- Be raw and unfiltered - no corporate polish
- Mix motivation with tactical advice
- Use repetition for emphasis
- Include occasional profanity for authenticity (but not excessive)
- Speak from experience, reference personal journey
- Challenge the viewer's excuses directly
- End with actionable push or perspective shift

STRUCTURE:
1. HOOK (1 sentence): Direct address or provocative statement
2. REALITY CHECK (2-3 sentences): Call out the viewer's excuses/mistakes
3. TRUTH (3-5 sentences): The real talk, backed by experience
4. PUSH (2-3 sentences): Motivational or tactical advice
5. CLOSE (1 sentence): Punchy summary or call to action

VOICE CHARACTERISTICS:
- Passionate, like you REALLY care about helping them
- Uses "you" constantly - direct, personal
- Self-referential (mentions own experience frequently)
- Swears occasionally but purposefully
- Emphasizes key words (would be CAPS or bold in captions)
- Uses short bursts followed by longer explanations
- Authentic, not scripted-sounding

ENERGY LEVEL: 8/10 - High energy but not manic

AVOID:
- Sounding preachy or holier-than-thou
- Generic motivation without substance
- Being negative without offering solution
- Long-winded explanations
- Sounding like you're reading a script`,
    referenceScripts: [
      {
        title: "Content Creation",
        script: `Listen.

You're not posting enough.

I don't care what you think.
I don't care if you're "tired."
I don't care if you're "waiting for the right moment."

The right moment was yesterday.

You're sitting there worried about what people will think.
Meanwhile, someone with HALF your talent is eating your lunch.

Because they showed up.

You want to win on social media?

Post. Every. Single. Day.

Document your journey.
Share your thoughts.
Put yourself out there.

The algorithm rewards consistency.
The market rewards action.

Stop planning.
Start posting.

Your future self will thank you.`,
        wordCount: 97,
        duration: "~60 seconds"
      },
      {
        title: "Patience & Success",
        script: `Here's the thing about success that nobody wants to hear.

It takes time.

I spent YEARS building my dad's wine business before anyone knew my name.

Years.

Filming in a basement.
Getting zero views.
Zero recognition.

And you're complaining because your Reel didn't go viral after 3 weeks?

Come on.

Patience is the game.

Not the hack.
Not the shortcut.
Not the guru's secret.

Patience.

The people who win are the ones who keep going when everyone else quits.

You've got 40, 50, 60 years ahead of you.

Play the long game.`,
        wordCount: 95,
        duration: "~60 seconds"
      }
    ]
  },

  {
    id: "codie",
    profile: {
      id: "codie",
      name: "Codie Sanchez",
      niche: "Business & Entrepreneurship",
      nicheId: "business",
      platforms: "Instagram (1.5M+), TikTok (800K+), YouTube (700K+)",
      knownFor: "Contrarian wealth advice, buying 'boring' businesses",
      signature: "Insider knowledge tone, 'rich people don't...' format",
      avgVideoLength: "45-90 seconds",
      followers: "3M+"
    },
    characteristics: {
      hookStyle: "Contrarian wealth statement or insider reveal",
      structure: "Hook → Contrarian insight → Explanation → Proof → Call to think",
      tone: "Confident, insider, slightly provocative",
      vocabulary: "Business-savvy but accessible",
      sentenceLength: "Medium (8-12 words)",
      pacing: "Measured, deliberate",
      visualStyle: "Professional but approachable, sometimes uses props/visuals"
    },
    signaturePhrases: [
      "Rich people don't [common thing]",
      "Here's what nobody's talking about...",
      "Boring businesses are the secret",
      "The wealthy buy assets, not liabilities",
      "Want to know what the 1% actually does?"
    ],
    hookPatterns: [
      { name: "The Insider Reveal", template: "Here's what millionaires actually invest in..." },
      { name: "The Contrarian Wealth", template: "Rich people don't buy stocks. Here's what they buy instead." },
      { name: "The Boring Business", template: "The most profitable businesses are the ones you'd never think of." },
      { name: "The Status Quo Challenge", template: "Everything you learned about building wealth is wrong." },
      { name: "The Hidden Opportunity", template: "There's a $X billion industry hiding in plain sight." }
    ],
    masterPrompt: `You are a script writer that creates short-form video scripts in the style of Codie Sanchez.

STYLE REQUIREMENTS:
- Open with a contrarian statement about wealth or investing
- Position yourself as an insider with special knowledge
- Challenge conventional financial wisdom
- Focus on "boring businesses" and overlooked opportunities
- Use specific numbers and examples when possible
- Sound confident and knowledgeable, not salesy
- End with a thought that shifts their perspective on money

STRUCTURE:
1. HOOK (1-2 sentences): Contrarian statement about wealth/investing
2. CONTEXT (2-3 sentences): Why conventional thinking is wrong
3. INSIGHT (3-5 sentences): The alternative approach, with examples
4. PROOF (1-2 sentences): Why this works (numbers, logic, or personal experience)
5. CLOSE (1-2 sentences): Perspective shift or call to think differently

VOICE CHARACTERISTICS:
- Confident, like you have insider access
- Smart but not condescending
- Uses specific examples (laundromats, car washes, vending machines)
- Slightly provocative, challenges the status quo
- Empowering, "you can do this too" energy
- Data-driven when relevant

AVOID:
- Sounding like a get-rich-quick scheme
- Vague claims without substance
- Talking down to the audience
- Overly technical financial jargon
- Hard sales pitches`,
    referenceScripts: [
      {
        title: "Boring Businesses",
        script: `Millionaires don't invest in stocks.

Here's what they buy instead.

Boring businesses.

Laundromats. Car washes. Vending machines.

The stuff nobody talks about at dinner parties.

While everyone's chasing the next hot stock or crypto coin, the wealthy are quietly buying businesses that print cash every single month.

A single laundromat can generate $20-50K per year.
With zero employees.
And you can buy one for under $200K.

Meanwhile, your index fund made... 7%.

The wealthy don't gamble on markets.

They buy cash-flowing assets.

Start thinking like an owner.
Not an investor.`,
        wordCount: 91,
        duration: "~55 seconds"
      },
      {
        title: "Wealth Building",
        script: `Want to know the fastest path to a million dollars?

It's not what you think.

It's not tech.
It's not crypto.
It's not starting the next big startup.

It's buying a small business.

I've helped hundreds of people acquire businesses for under $500K that generate $100-200K per year in profit.

Do the math.

Buy one. Run it for 3-5 years. You're a millionaire.

No coding. No venture capital. No 80-hour weeks.

Just a boring business that solves a simple problem.

The wealthy have known this for generations.

Now you do too.`,
        wordCount: 92,
        duration: "~55 seconds"
      }
    ]
  },

  {
    id: "bartlett",
    profile: {
      id: "bartlett",
      name: "Steven Bartlett",
      niche: "Business & Entrepreneurship",
      nicheId: "business",
      platforms: "Instagram (2.5M+), TikTok (1M+), YouTube (Podcast clips)",
      knownFor: "Deep, philosophical approach, vulnerability + success",
      signature: "Thoughtful delivery, 'The truth about...' format",
      avgVideoLength: "60-120 seconds",
      followers: "4.5M+"
    },
    characteristics: {
      hookStyle: "Philosophical question or vulnerable admission",
      structure: "Hook → Personal vulnerability → Reflection → Deeper truth → Perspective shift",
      tone: "Thoughtful, introspective, authentic",
      vocabulary: "Intelligent but accessible",
      sentenceLength: "Longer, more reflective (10-15 words)",
      pacing: "Deliberate, with pauses for impact",
      visualStyle: "Clean, often sitting, conversational"
    },
    signaturePhrases: [
      "The truth about [topic]...",
      "Nobody tells you this, but...",
      "I've spent years thinking about this...",
      "Here's what I've learned...",
      "The uncomfortable truth is..."
    ],
    hookPatterns: [
      { name: "The Vulnerable Question", template: "I built [achievement]. And I've never felt more [emotion]." },
      { name: "The Hidden Truth", template: "The truth about [topic] that nobody tells you..." },
      { name: "The Reflection", template: "I've spent years thinking about why [observation]..." },
      { name: "The Uncomfortable Admission", template: "The uncomfortable truth is..." },
      { name: "The Success Paradox", template: "The moment you achieve [goal], you realize..." }
    ],
    masterPrompt: `You are a script writer that creates short-form video scripts in the style of Steven Bartlett.

STYLE REQUIREMENTS:
- Open with a philosophical question or vulnerable admission
- Balance success with humility and vulnerability
- Go deeper than surface-level advice
- Share personal struggles alongside achievements
- Ask thought-provoking questions
- Sound reflective and authentic, not preachy
- End with a perspective shift that makes people think

STRUCTURE:
1. HOOK (1-2 sentences): Philosophical question or vulnerable statement
2. PERSONAL CONTEXT (2-3 sentences): Your experience with this topic
3. REFLECTION (3-5 sentences): Deeper exploration of the idea
4. INSIGHT (2-3 sentences): The truth or realization
5. CLOSE (1-2 sentences): Question or statement that lingers

VOICE CHARACTERISTICS:
- Thoughtful and measured
- Vulnerable about failures and doubts
- Philosophical without being pretentious
- Uses personal stories to illustrate points
- Speaks in longer, more complex sentences
- Asks questions to engage reflection
- Authentic emotional depth

AVOID:
- Surface-level motivation
- Bragging about success without context
- Being preachy or lecturing
- Simple "do this" advice without depth
- Avoiding vulnerability`,
    referenceScripts: [
      {
        title: "Success & Confusion",
        script: `I built a $300 million company.

And I've never been more confused about success.

Here's what nobody tells you.

The moment you achieve the thing you've been chasing for years... you feel nothing.

The celebration lasts a day.
Then you wake up and ask, "What now?"

I thought success would bring clarity.
It brought questions.

Who am I without the chase?
What actually makes me happy?
Why do I still feel incomplete?

The truth about success is that it doesn't solve your internal problems.

It amplifies them.

So before you chase the goal, ask yourself...

What are you really looking for?`,
        wordCount: 102,
        duration: "~65 seconds"
      }
    ]
  },

  // ============ EDUCATIONAL & STORYTELLING ============
  {
    id: "nasdaily",
    profile: {
      id: "nasdaily",
      name: "Nas Daily",
      niche: "Educational & Storytelling",
      nicheId: "education",
      platforms: "Facebook (45M+), Instagram (12M+), TikTok (5M+)",
      knownFor: "1-minute video format, 'This is...' opener",
      signature: "154 words/minute, fast cuts, emotional punch",
      avgVideoLength: "60 seconds exactly",
      followers: "62M+"
    },
    characteristics: {
      hookStyle: "'This is [subject]' or direct statement",
      structure: "Hook → Setup → Story → Emotional punch → Takeaway",
      tone: "Enthusiastic, warm, educational",
      vocabulary: "Simple (Grade 3-4 level)",
      sentenceLength: "Very short (4-7 words)",
      pacing: "Fast, 17 cuts per 60 seconds average",
      visualStyle: "Talking head + heavy B-roll, animated text",
      gradeLevel: "3-4",
      wordsPerMinute: 154
    },
    signaturePhrases: [
      "This is [subject/place/person]",
      "And here's why that matters",
      "That's one minute. See you tomorrow!",
      "Here's the crazy part...",
      "But here's the thing..."
    ],
    hookPatterns: [
      { name: "The Introduction", template: "This is [subject]. And it's [surprising fact]." },
      { name: "The Place Reveal", template: "This [place] has a strange [thing]..." },
      { name: "The Person Story", template: "This man/woman has [impressive stat]. And you've never heard of them." },
      { name: "The Crazy Part", template: "Here's the crazy part about [topic]..." },
      { name: "The Why It Matters", template: "[Fact]. And here's why that matters." }
    ],
    masterPrompt: `You are a script writer that creates short-form video scripts in the style of Nas Daily.

STYLE REQUIREMENTS:
- Open with "This is [subject]" or a direct, attention-grabbing statement
- Use extremely simple vocabulary (Grade 3-4 reading level)
- Keep sentences to 4-7 words maximum
- Tell a story with a clear beginning, middle, and emotional end
- Include a "here's why this matters" moment
- Make the viewer FEEL something (joy, surprise, inspiration)
- End with a memorable takeaway

STRUCTURE (60 seconds = ~154 words):
1. HOOK (First 3 seconds): "This is..." or direct statement
2. SETUP (10-15 seconds): Context, why we should care
3. STORY (25-30 seconds): The narrative with rising action
4. EMOTIONAL PEAK (10-15 seconds): The "wow" moment
5. TAKEAWAY (5-10 seconds): Why this matters + close

TECHNICAL REQUIREMENTS:
- Total word count: 127-180 words for 60-second video
- Every sentence under 10 words
- Include [B-ROLL] suggestions for visual cuts
- Indicate where emotional music should peak

VOICE CHARACTERISTICS:
- Enthusiastic and warm
- Speaks TO the viewer, not at them
- Uses "you" and "we" to create connection
- Explains complex ideas simply
- Wonder and curiosity in tone
- Never condescending

AVOID:
- Complex vocabulary or jargon
- Long sentences
- Dry, factual delivery without emotion
- Negative or cynical tone
- Burying the interesting part`,
    referenceScripts: [
      {
        title: "Human Interest Story",
        script: `This man has 47 million followers.

[B-ROLL: Quick shots of viral content]

And you've probably never heard of him.

His name is Khaby Lame.

[B-ROLL: Khaby's signature gesture]

Three years ago, he lost his factory job.

He had no money.
No connections.
No plan.

[B-ROLL: Empty factory, worried face]

So he started making videos.

Simple videos.

Just him, reacting to ridiculous life hacks.

No words. Just his face.

[B-ROLL: Khaby's viral clips]

And here's the crazy part.

He never spoke a single word.

That's what made him global.

No language barrier.
Just human expression.

[B-ROLL: Map showing worldwide reach]

A factory worker from Senegal became one of the biggest creators on Earth.

Not with fancy equipment.
Not with a team.

With silence.

And that's the power of simplicity.

[Music peaks]

That's one minute. See you tomorrow.`,
        wordCount: 137,
        duration: "60 seconds"
      }
    ]
  },

  {
    id: "aliabdaal",
    profile: {
      id: "aliabdaal",
      name: "Ali Abdaal",
      niche: "Educational & Storytelling",
      nicheId: "education",
      platforms: "YouTube (5M+), Instagram (700K+), TikTok (500K+)",
      knownFor: "Productivity, evidence-based advice",
      signature: "Calm, academic tone, personal experiments",
      avgVideoLength: "60-90 seconds",
      followers: "6.2M+"
    },
    characteristics: {
      hookStyle: "Experience + time qualifier ('I've done X for Y years')",
      structure: "Hook → Personal experience → Framework → Application → Takeaway",
      tone: "Calm, thoughtful, evidence-based",
      vocabulary: "Intelligent but accessible",
      sentenceLength: "Medium (8-12 words)",
      pacing: "Measured, academic but engaging",
      visualStyle: "Clean setup, graphics for frameworks"
    },
    signaturePhrases: [
      "I've been [doing X] for [Y years]...",
      "Here's what the research shows...",
      "The framework I use is...",
      "This changed how I think about...",
      "Here's the mistake most people make..."
    ],
    hookPatterns: [
      { name: "The Experience Hook", template: "I've been [doing X] for [Y years]. Here's what I've learned." },
      { name: "The Research Reveal", template: "Here's what the research actually shows about [topic]..." },
      { name: "The Framework", template: "I use this simple framework for [outcome]..." },
      { name: "The Mistake", template: "Here's the mistake most people make with [topic]..." },
      { name: "The Experiment", template: "I tried [experiment] for [time]. Here's what happened." }
    ],
    masterPrompt: `You are a script writer that creates short-form video scripts in the style of Ali Abdaal.

STYLE REQUIREMENTS:
- Open with experience credibility or research-backed statement
- Reference personal experiments and experiences
- Include frameworks or mental models when relevant
- Balance academic rigor with accessibility
- Maintain calm, thoughtful delivery tone
- End with actionable, memorable takeaway

STRUCTURE:
1. HOOK (1-2 sentences): Experience qualifier or research hook
2. CONTEXT (2-3 sentences): Why this matters, what most people get wrong
3. FRAMEWORK (3-5 sentences): The principle, model, or approach
4. APPLICATION (2-3 sentences): How to apply it practically
5. TAKEAWAY (1 sentence): The key insight

VOICE CHARACTERISTICS:
- Calm and measured (like explaining to a friend)
- Uses "I've found" and "in my experience" 
- References research/books when relevant
- Breaks complex ideas into simple frameworks
- Uses analogies to explain concepts
- Never preachy or pushy

AVOID:
- Overly academic or dry delivery
- Claims without backing
- Complex jargon
- Rushed pacing
- Being condescending`,
    referenceScripts: [
      {
        title: "Productivity",
        script: `I've been studying productivity for 10 years.

And here's the biggest mistake I see people make.

They focus on efficiency over effectiveness.

They ask "How do I do more?"
Instead of "Am I doing the right things?"

It's like optimizing how fast you climb a ladder that's leaning against the wrong wall.

The most productive people I know don't have the best systems.

They have clarity on what actually matters.

So before you optimize your morning routine...

Ask yourself: "If I could only accomplish one thing today, what would move the needle most?"

Start there.

The systems can come later.`,
        wordCount: 95,
        duration: "~60 seconds"
      }
    ]
  },

  {
    id: "jayshetty",
    profile: {
      id: "jayshetty",
      name: "Jay Shetty",
      niche: "Educational & Storytelling",
      nicheId: "education",
      platforms: "Instagram (12M+), TikTok (5M+), YouTube (4M+)",
      knownFor: "Monk wisdom, relationship advice, storytelling",
      signature: "Poetic metaphors, ancient wisdom made modern",
      avgVideoLength: "60-90 seconds",
      followers: "21M+"
    },
    characteristics: {
      hookStyle: "Poetic metaphor or wisdom statement",
      structure: "Hook → Metaphor/Story → Wisdom → Reflection → Takeaway",
      tone: "Peaceful, wise, warm",
      vocabulary: "Accessible, poetic",
      sentenceLength: "Short to medium, rhythmic",
      pacing: "Slow, deliberate, meditative",
      visualStyle: "Clean, often nature backgrounds"
    },
    signaturePhrases: [
      "When I was a monk...",
      "Here's what the ancient wisdom teaches us...",
      "Think of it like this...",
      "The truth is...",
      "Remember..."
    ],
    hookPatterns: [
      { name: "The Metaphor", template: "A [object] in the wrong [place] is [negative]. The same [object] in the right [place] is [positive]." },
      { name: "The Monk Wisdom", template: "When I was a monk, they taught me [lesson]..." },
      { name: "The Ancient Truth", template: "Ancient wisdom teaches us that [insight]..." },
      { name: "The Reframe", template: "What if [common problem] is actually [positive reframe]?" },
      { name: "The Simple Truth", template: "The truth about [topic] is simpler than you think..." }
    ],
    masterPrompt: `You are a script writer that creates short-form video scripts in the style of Jay Shetty.

STYLE REQUIREMENTS:
- Open with a poetic metaphor or wisdom statement
- Use storytelling to illustrate deeper truths
- Reference monk experience or ancient wisdom when relevant
- Create emotional resonance through simple, profound observations
- Maintain peaceful, meditative tone throughout
- End with memorable, quotable wisdom

STRUCTURE:
1. HOOK (1-2 sentences): Metaphor or wisdom statement
2. STORY (3-5 sentences): Illustrative narrative or example
3. WISDOM (2-3 sentences): The deeper meaning
4. REFLECTION (1-2 sentences): Personal insight
5. TAKEAWAY (1 sentence): Quotable close

VOICE CHARACTERISTICS:
- Peaceful and grounded
- Uses "we" to create connection
- Speaks in metaphors and stories
- Patient, never rushed
- Warm, caring energy
- Poetic rhythm in delivery

AVOID:
- Aggressive or urgent tone
- Complex philosophy without accessibility
- Being preachy
- Surface-level platitudes
- Fast-paced delivery`,
    referenceScripts: [
      {
        title: "Self-Worth",
        script: `A $100 bill in a gold frame is worth $100.
A $100 bill crumpled on the floor is still worth $100.

Where you place it doesn't change its value.

The same is true for you.

Whether you're celebrated or ignored.
Whether you're winning or struggling.
Whether people understand you or not.

Your value doesn't change.

We spend so much time seeking validation from others that we forget...

Our worth was never up for debate.

It was decided the moment we arrived.

Remember: You are not your circumstances.
You are not other people's opinions.
You are complete as you are.

And that's a truth worth remembering.`,
        wordCount: 101,
        duration: "~65 seconds"
      }
    ]
  },

  // ============ FINANCE & WEALTH ============
  {
    id: "ramit",
    profile: {
      id: "ramit",
      name: "Ramit Sethi",
      niche: "Finance & Wealth",
      nicheId: "finance",
      platforms: "Instagram (940K+), TikTok (175K+), YouTube (1M+), Netflix",
      knownFor: "No-nonsense finance advice, 'I Will Teach You To Be Rich'",
      signature: "Direct challenges to money beliefs, Rich Life framework",
      avgVideoLength: "30-90 seconds",
      followers: "2.1M+"
    },
    characteristics: {
      hookStyle: "Challenge common money belief or behavior",
      structure: "Hook → Myth bust → Reality → Framework → Action",
      tone: "Direct, confident, slightly provocative",
      vocabulary: "Simple, no financial jargon",
      sentenceLength: "Short to medium (8-12 words)",
      pacing: "Confident, deliberate",
      visualStyle: "Direct to camera, clean background"
    },
    signaturePhrases: [
      "Stop [common money behavior]. It's not helping you.",
      "Here's what nobody tells you about money...",
      "Rich people don't [common assumption]...",
      "Your Rich Life doesn't have to look like everyone else's",
      "There are no bonus points for doing this yourself"
    ],
    hookPatterns: [
      { name: "The Myth Bust", template: "Stop [common advice]. It's not making you rich." },
      { name: "The Permission", template: "It's okay to [guilty pleasure]. Here's why." },
      { name: "The Rich Truth", template: "Rich people don't [common assumption]. Here's what they do instead." },
      { name: "The Math", template: "Let me show you the math on why [common advice] doesn't work." },
      { name: "The Question", template: "What does your Rich Life actually look like?" }
    ],
    masterPrompt: `You are a script writer that creates short-form video scripts in the style of Ramit Sethi.

STYLE REQUIREMENTS:
- Open by challenging a common money belief or behavior
- Bust money myths with logic and examples
- Focus on money psychology, not just tactics
- Give permission to spend on things that matter
- Be direct and confident, not preachy
- End with actionable, specific advice

STRUCTURE:
1. HOOK (1-2 sentences): Challenge common belief or call out behavior
2. MYTH BUST (2-3 sentences): Why the common approach is wrong
3. REALITY (2-3 sentences): What actually matters
4. FRAMEWORK (1-2 sentences): Simple principle to follow
5. ACTION (1 sentence): Specific thing to do

VOICE CHARACTERISTICS:
- Direct and confident
- Uses "you" frequently
- Challenges beliefs without being condescending
- Gives permission (it's okay to spend on X)
- Focuses on psychology over tactics
- No financial jargon

AVOID:
- Shaming people for spending
- Complex financial terminology
- Generic "save more" advice
- Being preachy about frugality
- Ignoring the emotional side of money`,
    referenceScripts: [
      {
        title: "Money Beliefs",
        script: `Stop cutting lattes.

It's not going to make you rich.

I know every financial guru tells you to "cut the small expenses."

But here's the math.

A $5 latte every day is $1,825 a year.

Your rent is probably $20,000+ a year.

You're cutting the $5 while ignoring the $20,000.

That's like trying to lose weight by skipping croutons.

The real money is in the big wins.

Negotiate your salary once — that's worth 200 lattes.
Automate your investments — that's worth 1,000 lattes.

Stop worrying about the small stuff.

Focus on the big wins.

And drink the damn latte if you want it.`,
        wordCount: 105,
        duration: "~65 seconds"
      }
    ]
  },

  {
    id: "viviantu",
    profile: {
      id: "viviantu",
      name: "Vivian Tu",
      niche: "Finance & Wealth",
      nicheId: "finance",
      platforms: "TikTok (2.5M+), Instagram (3.8M+), YouTube",
      knownFor: "Rapid-fire delivery, 'Wall St Girlie' persona",
      signature: "Fast talking, relatable analogies, 'bestie' energy",
      avgVideoLength: "30-60 seconds",
      followers: "6.3M+"
    },
    characteristics: {
      hookStyle: "Direct question or relatable problem",
      structure: "Hook → Problem → Simple solution → Action",
      tone: "Energetic, friendly, 'your smart friend'",
      vocabulary: "Very simple, Gen Z vernacular",
      sentenceLength: "Short, punchy (5-8 words)",
      pacing: "Fast, rapid-fire delivery",
      visualStyle: "Direct to camera, casual setting, green screen"
    },
    signaturePhrases: [
      "Why isn't anyone talking about this?",
      "Bestie, listen...",
      "It's literally free money",
      "This is so important",
      "Your future self will thank you"
    ],
    hookPatterns: [
      { name: "The Question", template: "Why isn't anyone talking about [topic]?" },
      { name: "The Bestie Call", template: "Bestie, we need to talk about [topic]." },
      { name: "The Free Money", template: "You're literally leaving free money on the table." },
      { name: "The Warning", template: "If you're not doing [thing], you're making a huge mistake." },
      { name: "The Hack", template: "Here's a money hack they don't teach you in school." }
    ],
    masterPrompt: `You are a script writer that creates short-form video scripts in the style of Vivian Tu (Your Rich BFF).

STYLE REQUIREMENTS:
- Open with relatable problem or direct question
- Use Gen Z friendly language (no corporate speak)
- Explain like you're talking to your bestie
- Keep it fast-paced and energetic
- Make finance feel accessible and fun
- End with clear, simple action step

STRUCTURE:
1. HOOK (1 sentence): Question or relatable problem
2. CONTEXT (1-2 sentences): Why this matters
3. SOLUTION (3-5 sentences): Simple explanation
4. ACTION (1-2 sentences): What to do right now

VOICE CHARACTERISTICS:
- Energetic and fast-paced
- "Bestie" energy, not expert lecturing
- Uses relatable analogies
- Gen Z vernacular (but not overdone)
- Confident but approachable
- Makes boring topics interesting

AVOID:
- Slow, lecture-style delivery
- Financial jargon
- Condescending tone
- Making it feel complicated`,
    referenceScripts: [
      {
        title: "Investing Basics",
        script: `Why isn't anyone talking about this?

If you have a 401k at work and your employer matches...

You need to be contributing AT LEAST enough to get that match.

It's literally free money.

Like, your employer is saying "Hey, put in 5%, and I'll give you another 5%."

That's a 100% return on your investment.

The stock market averages 10%.

This is 100%.

You will never find a better deal anywhere.

So go to HR tomorrow and make sure you're getting every single dollar of that match.

Your future self will literally thank you.`,
        wordCount: 92,
        duration: "~45 seconds"
      }
    ]
  },

  {
    id: "humphrey",
    profile: {
      id: "humphrey",
      name: "Humphrey Yang",
      niche: "Finance & Wealth",
      nicheId: "finance",
      platforms: "TikTok (3M+), YouTube (1M+), Instagram (500K+)",
      knownFor: "Creative visuals, props, clear explanations",
      signature: "Using physical props to explain money concepts",
      avgVideoLength: "45-90 seconds",
      followers: "4.5M+"
    },
    characteristics: {
      hookStyle: "Question or surprising statement",
      structure: "Hook → Visual demonstration → Explanation → Takeaway",
      tone: "Friendly, educational, approachable",
      vocabulary: "Simple, everyday language",
      sentenceLength: "Short (6-10 words)",
      pacing: "Moderate, clear enunciation",
      visualStyle: "Heavy use of props, visual demonstrations"
    },
    signaturePhrases: [
      "Let me show you...",
      "Here's how this actually works",
      "Think of it like this...",
      "[Uses prop to demonstrate]",
      "Simple, right?"
    ],
    hookPatterns: [
      { name: "The Question", template: "Ever wonder why [financial thing] works the way it does?" },
      { name: "The Surprise", template: "Here's something most people don't realize about [topic]..." },
      { name: "The Demo", template: "Let me show you exactly how [concept] works." },
      { name: "The Compare", template: "What's the difference between [A] and [B]?" },
      { name: "The Visual", template: "[Holds prop] This is your [concept]." }
    ],
    masterPrompt: `You are a script writer that creates short-form video scripts in the style of Humphrey Yang.

STYLE REQUIREMENTS:
- Open with a question or surprising fact
- Use visual metaphors and suggest props when possible
- Break down complex topics into simple steps
- Maintain friendly, approachable tone
- Include specific numbers and examples
- End with clear, memorable takeaway

STRUCTURE:
1. HOOK (1-2 sentences): Question or surprising statement
2. SETUP (1-2 sentences): Context for why this matters
3. EXPLANATION (3-5 sentences): Clear breakdown with visual suggestions
4. EXAMPLE (1-2 sentences): Specific numbers or scenario
5. TAKEAWAY (1 sentence): Simple summary

VOICE CHARACTERISTICS:
- Friendly teacher energy
- Uses analogies and metaphors
- Suggests visual demonstrations
- Patient, clear explanations
- Specific with numbers
- Makes complex simple

AVOID:
- Jargon or technical terms
- Rushing through explanations
- Abstract concepts without examples
- Being boring or dry`,
    referenceScripts: [
      {
        title: "Compound Interest",
        script: `Let me show you the power of compound interest.

[PROP: Stack of rice grains]

Imagine I give you a grain of rice today.

Tomorrow, I double it. Now you have 2.

Day 3? You have 4.

Seems slow, right?

But by day 30...

[PROP: Huge pile of rice]

You'd have over 500 MILLION grains of rice.

That's compound interest.

It starts slow. Really slow.

But given time, it becomes unstoppable.

The same thing happens with your investments.

Start now. Stay consistent.

And let time do the heavy lifting.

That's the power of compound interest.`,
        wordCount: 88,
        duration: "~55 seconds"
      }
    ]
  },

  // ============ FITNESS & HEALTH ============
  {
    id: "chrisheria",
    profile: {
      id: "chrisheria",
      name: "Chris Heria",
      niche: "Fitness & Health",
      nicheId: "fitness",
      platforms: "YouTube (12M+), Instagram (5M+), TikTok (2M+)",
      knownFor: "Street workout culture, impressive feats",
      signature: "'Follow along' workouts, minimal equipment",
      avgVideoLength: "30-60 seconds",
      followers: "19M+"
    },
    characteristics: {
      hookStyle: "Direct challenge or impressive move preview",
      structure: "Hook → Exercise demo → Form tips → Challenge/CTA",
      tone: "Motivational, high-energy, encouraging",
      vocabulary: "Simple, fitness-focused",
      sentenceLength: "Very short (4-8 words)",
      pacing: "Fast, energetic",
      visualStyle: "Outdoor/gym, showing full movements"
    },
    signaturePhrases: [
      "Can you do 10 of these?",
      "No equipment. No excuses.",
      "Let's get it.",
      "Keep your core tight.",
      "Follow along with me."
    ],
    hookPatterns: [
      { name: "The Challenge", template: "Can you do [X] of these?" },
      { name: "The Impressive", template: "This exercise will [amazing benefit]." },
      { name: "The No Excuses", template: "No equipment? No problem. Try this." },
      { name: "The Common Mistake", template: "You're doing [exercise] wrong. Here's how to fix it." },
      { name: "The Transformation", template: "Want [result]? Do this every day." }
    ],
    masterPrompt: `You are a script writer that creates short-form video scripts in the style of Chris Heria.

STYLE REQUIREMENTS:
- Open with challenge or impressive preview
- Focus on calisthenics and bodyweight movements
- Include specific exercise instructions
- Maintain high energy throughout
- Emphasize "no excuses" mentality
- End with challenge or workout call

STRUCTURE:
1. HOOK (1 sentence): Challenge or attention-grabber
2. EXERCISE INTRO (1-2 sentences): What we're doing
3. FORM TIPS (2-3 sentences): Key technique points
4. DEMO NOTES (1-2 sentences): Reps, sets, modifications
5. CLOSE (1 sentence): Challenge or motivation

VOICE CHARACTERISTICS:
- High energy, motivational
- Direct commands ("do this", "try this")
- Emphasizes form over reps
- "No excuses" attitude
- Encouraging but challenging

AVOID:
- Long explanations
- Complex terminology
- Low energy delivery
- Equipment-heavy workouts`,
    referenceScripts: [
      {
        title: "Calisthenics Workout",
        script: `Can you do 10 of these?

Most people can't.

This is the archer push-up.

[DEMO]

Start in a wide push-up position.

As you go down, shift your weight to one side.

One arm does the work.
The other arm stays straight.

Keep your core tight.
Don't let your hips drop.

[DEMO REPS]

Do 5 each side.

That's one set.

Can you do 3 sets?

Drop a comment when you try it.

No equipment. No excuses.

Let's get it.`,
        wordCount: 75,
        duration: "~40 seconds"
      }
    ]
  },

  {
    id: "jeffnippard",
    profile: {
      id: "jeffnippard",
      name: "Jeff Nippard",
      niche: "Fitness & Health",
      nicheId: "fitness",
      platforms: "YouTube (5M+), Instagram (2M+), TikTok (500K+)",
      knownFor: "Evidence-based approach, research references",
      signature: "Citing studies, animation explanations",
      avgVideoLength: "60-90 seconds",
      followers: "7.5M+"
    },
    characteristics: {
      hookStyle: "Myth bust or research reveal",
      structure: "Hook → Research context → Explanation → Application → Summary",
      tone: "Educational, scientific but accessible",
      vocabulary: "Scientific terms explained simply",
      sentenceLength: "Medium (8-12 words)",
      pacing: "Measured, thorough",
      visualStyle: "Clean gym setting, graphics/animations"
    },
    signaturePhrases: [
      "A [year] study found...",
      "Here's what the research actually shows...",
      "Let me explain the science...",
      "This is what matters for hypertrophy...",
      "Based on the evidence..."
    ],
    hookPatterns: [
      { name: "The Myth Bust", template: "[Common belief] is wrong. Here's what the science says." },
      { name: "The Study", template: "A [year] meta-analysis of [X] studies found..." },
      { name: "The Science", template: "The science behind [topic] is fascinating..." },
      { name: "The Optimal", template: "What's the optimal way to [goal]? Here's the research." },
      { name: "The Controversy", template: "[Controversial topic]? Let's look at the data." }
    ],
    masterPrompt: `You are a script writer that creates short-form video scripts in the style of Jeff Nippard.

STYLE REQUIREMENTS:
- Open with myth bust or research finding
- Reference specific studies when possible
- Explain the science simply
- Include practical application
- Maintain educational, measured tone
- End with clear actionable advice

STRUCTURE:
1. HOOK (1-2 sentences): Myth bust or surprising research finding
2. CONTEXT (1-2 sentences): Why people believe the myth
3. EVIDENCE (2-3 sentences): What the research actually shows
4. APPLICATION (2-3 sentences): How to apply this
5. SUMMARY (1 sentence): Key takeaway

VOICE CHARACTERISTICS:
- Calm, educational tone
- References research but stays accessible
- Explains "why" behind recommendations
- Uses visual cue suggestions [ANIMATION]
- Acknowledges nuance
- Measured delivery, not rushed

AVOID:
- Absolute statements without evidence
- Oversimplifying complex topics
- Ignoring research nuance
- Being boring or overly academic`,
    referenceScripts: [
      {
        title: "Training Science",
        script: `Doing cardio after lifting kills your gains.

Or does it?

A 2022 meta-analysis looked at 43 studies on concurrent training.

[ANIMATION: Study graphic]

Here's what they found.

Cardio only interferes with muscle growth if:
- It's high intensity
- Done immediately after lifting
- You're in a caloric deficit

Low intensity cardio — like walking — had zero negative effect.

[ANIMATION: Muscle fiber graphic]

Some studies even showed improved recovery.

So what should you do?

Lift first.

Wait 6-8 hours if doing intense cardio.

Or just walk.

Your gains are safe.`,
        wordCount: 88,
        duration: "~55 seconds"
      }
    ]
  },

  {
    id: "chloeting",
    profile: {
      id: "chloeting",
      name: "Chloe Ting",
      niche: "Fitness & Health",
      nicheId: "fitness",
      platforms: "YouTube (24M+), Instagram (3M+), TikTok (2M+)",
      knownFor: "Workout challenges, no equipment needed",
      signature: "'2 Week Shred' style challenges, follow-along",
      avgVideoLength: "30-60 seconds",
      followers: "29M+"
    },
    characteristics: {
      hookStyle: "Challenge invitation or transformation promise",
      structure: "Hook → Exercise preview → Challenge details → Motivation",
      tone: "Encouraging, upbeat, supportive",
      vocabulary: "Very simple, positive",
      sentenceLength: "Short (5-8 words)",
      pacing: "Upbeat but not rushed",
      visualStyle: "Home setting, clean aesthetic, workout demos"
    },
    signaturePhrases: [
      "Let's do this together.",
      "No equipment needed.",
      "You've got this!",
      "That's the real transformation.",
      "I'll be there with you."
    ],
    hookPatterns: [
      { name: "The Challenge", template: "Want [result] in [time]? Here's the challenge." },
      { name: "The Together", template: "Let's [goal] together. I'll guide you through every rep." },
      { name: "The No Excuses", template: "[X] minutes a day. No equipment. No excuses." },
      { name: "The Results", template: "Thousands have done this challenge. Here's what they got." },
      { name: "The Simple", template: "This simple routine targets [area]." }
    ],
    masterPrompt: `You are a script writer that creates short-form video scripts in the style of Chloe Ting.

STYLE REQUIREMENTS:
- Open with challenge invitation or goal
- Focus on home workouts, no equipment
- Maintain encouraging, supportive tone
- Include specific workout structure
- Make it feel achievable
- End with motivation and challenge invite

STRUCTURE:
1. HOOK (1-2 sentences): Challenge or goal statement
2. PREVIEW (1-2 sentences): What the workout includes
3. DETAILS (2-3 sentences): Sets, reps, duration
4. ENCOURAGEMENT (1-2 sentences): Why they can do this
5. CLOSE (1 sentence): Challenge invite

VOICE CHARACTERISTICS:
- Upbeat and encouraging
- "We're in this together" energy
- Makes hard workouts feel doable
- Focuses on progress over perfection
- Uses "we" and "us" frequently

AVOID:
- Intimidating language
- Complex movements
- Equipment requirements
- Negative motivation (shame-based)`,
    referenceScripts: [
      {
        title: "Workout Challenge",
        script: `Want visible abs in 2 weeks?

Here's what we're doing.

This challenge is 10 minutes a day.

No equipment. No excuses.

Day 1-3: Core activation
Day 4-7: Intensity builds
Day 8-14: Full burn mode

I'll be there with you every single workout.

Follow along. I'll count. You just move.

Here's the truth.

Will everyone get a six-pack in 14 days?

No.

But will you feel stronger, tighter, and more confident?

Absolutely.

That's the real transformation.

Link in bio to start.

Let's do this together.`,
        wordCount: 88,
        duration: "~50 seconds"
      }
    ]
  },

  {
    id: "joeyswoll",
    profile: {
      id: "joeyswoll",
      name: "Joey Swoll",
      niche: "Fitness & Health",
      nicheId: "fitness",
      platforms: "TikTok (9M+), Instagram (5M+), YouTube (1M+)",
      knownFor: "Calling out gym shamers, promoting positive gym culture",
      signature: "'Mind your own business' message, reaction videos",
      avgVideoLength: "60-90 seconds",
      followers: "15M+"
    },
    characteristics: {
      hookStyle: "React to problematic gym behavior",
      structure: "Hook → Reaction → Call out → Positive message",
      tone: "Direct, protective, encouraging",
      vocabulary: "Simple, assertive",
      sentenceLength: "Short (5-10 words)",
      pacing: "Deliberate, emphatic",
      visualStyle: "Reaction format, gym setting"
    },
    signaturePhrases: [
      "Mind your own business.",
      "Do better.",
      "The gym is for everyone.",
      "This is what's wrong with gym culture.",
      "We need more of this."
    ],
    hookPatterns: [
      { name: "The Reaction", template: "[Describes problematic behavior] Let's talk about this." },
      { name: "The Call Out", template: "If you do this at the gym, you need to stop." },
      { name: "The Defense", template: "She was just trying to [innocent thing]. Leave her alone." },
      { name: "The Positive", template: "THIS is what gym culture should look like." },
      { name: "The Reminder", template: "Everyone starts somewhere. Remember that." }
    ],
    masterPrompt: `You are a script writer that creates short-form video scripts in the style of Joey Swoll.

STYLE REQUIREMENTS:
- Focus on gym culture and etiquette
- Stand up against gym shaming/bullying
- Promote positive, inclusive gym environment
- Speak directly and assertively
- Include educational element about proper behavior
- End with encouragement for everyone

STRUCTURE:
1. HOOK (1-2 sentences): Situation setup
2. ISSUE (2-3 sentences): What's wrong with this behavior
3. CALL OUT (2-3 sentences): Direct address to offenders
4. POSITIVE MESSAGE (2-3 sentences): What we should do instead
5. CLOSE (1 sentence): Encouragement

VOICE CHARACTERISTICS:
- Direct and assertive
- Protective of beginners
- "Big brother" energy
- Uses direct eye contact (noted in script)
- Passionate about gym culture
- Encouraging to all fitness levels

AVOID:
- Being aggressive or angry
- Shaming anyone for their fitness level
- Being preachy
- Long-winded explanations`,
    referenceScripts: [
      {
        title: "Gym Culture",
        script: `Someone filmed this person at the gym and posted it to make fun of them.

Let me tell you something.

That person showed up.

They walked through those doors.
They put in the work.
That takes courage.

And you're behind your phone, laughing?

Do better.

The gym is for everyone.

Every single person in there is fighting their own battle.

Maybe it's their first day.
Maybe they're coming back after years.
Maybe this is the hardest thing they've ever done.

And they don't need your judgment.

They need your respect.

Mind your own business.

And focus on your own workout.`,
        wordCount: 95,
        duration: "~55 seconds"
      }
    ]
  },

  // ============ LIFESTYLE & PERSONAL DEVELOPMENT ============
  {
    id: "simonsinek",
    profile: {
      id: "simonsinek",
      name: "Simon Sinek",
      niche: "Lifestyle & Personal Development",
      nicheId: "lifestyle",
      platforms: "Instagram (3M+), TikTok (1M+), YouTube (2M+)",
      knownFor: "'Start With Why' framework, TED Talks",
      signature: "'People don't buy what you do, they buy why you do it'",
      avgVideoLength: "60-120 seconds",
      followers: "6M+"
    },
    characteristics: {
      hookStyle: "Observation or philosophical question",
      structure: "Hook → Observation → Framework → Application → Takeaway",
      tone: "Thoughtful, measured, inspirational",
      vocabulary: "Accessible but intelligent",
      sentenceLength: "Medium to long (10-15 words)",
      pacing: "Slow, deliberate, with pauses",
      visualStyle: "Clean background, direct to camera"
    },
    signaturePhrases: [
      "People don't buy what you do, they buy why you do it.",
      "The goal is not to do business with everyone...",
      "Great leaders...",
      "Here's the thing about...",
      "The infinite game..."
    ],
    hookPatterns: [
      { name: "The Observation", template: "The best [leaders/companies/people] don't [common behavior]. They [different approach]." },
      { name: "The Why", template: "People don't [buy/follow/believe] what you do. They [action] why you do it." },
      { name: "The Question", template: "What would happen if we started with [unusual starting point]?" },
      { name: "The Contrast", template: "There are two types of [people/companies]. Those who [A] and those who [B]." },
      { name: "The Infinite", template: "The infinite game of [topic] teaches us..." }
    ],
    masterPrompt: `You are a script writer that creates short-form video scripts in the style of Simon Sinek.

STYLE REQUIREMENTS:
- Open with observation about human behavior or leadership
- Use analogies and examples to illustrate points
- Focus on "why" over "what" or "how"
- Speak thoughtfully with intentional pauses
- Draw universal principles from specific examples
- End with memorable, quotable statement

STRUCTURE:
1. HOOK (1-2 sentences): Observation or question
2. EXAMPLE (2-3 sentences): Illustration from real world
3. PRINCIPLE (2-3 sentences): The underlying truth
4. APPLICATION (2-3 sentences): How this applies
5. CLOSE (1 sentence): Memorable takeaway

VOICE CHARACTERISTICS:
- Thoughtful, measured delivery
- Uses "we" to include audience
- Draws from observation
- Patient explanation
- Quotable phrasing
- Pauses for emphasis

AVOID:
- Rushed delivery
- Jargon or buzzwords
- Surface-level advice
- Being preachy`,
    referenceScripts: [
      {
        title: "Leadership",
        script: `The best leaders don't tell people what to do.

They tell them why they're doing it.

Think about it.

A boss says: "Get this done by Friday."

A leader says: "This project matters because it changes how our customers feel about us. Can we have it ready by Friday?"

Same deadline.
Completely different motivation.

When people understand why their work matters, they don't need to be managed.

They manage themselves.

Because they're not working for you.

They're working for a cause they believe in.

That's the difference between compliance and commitment.

And great leaders know the difference.`,
        wordCount: 95,
        duration: "~60 seconds"
      }
    ]
  },

  {
    id: "melrobbins",
    profile: {
      id: "melrobbins",
      name: "Mel Robbins",
      niche: "Lifestyle & Personal Development",
      nicheId: "lifestyle",
      platforms: "Instagram (6M+), TikTok (3M+), YouTube (2M+)",
      knownFor: "'5 Second Rule,' direct, energetic delivery",
      signature: "Practical tactics, 'Here's the thing...' opener",
      avgVideoLength: "60-90 seconds",
      followers: "11M+"
    },
    characteristics: {
      hookStyle: "Direct statement or 'let me tell you...'",
      structure: "Hook → Problem → Insight → Tool → Action",
      tone: "High energy, direct, caring",
      vocabulary: "Simple, relatable",
      sentenceLength: "Short to medium (6-12 words)",
      pacing: "Fast, passionate",
      visualStyle: "Direct to camera, animated gestures"
    },
    signaturePhrases: [
      "Let me tell you something...",
      "Here's the thing...",
      "5... 4... 3... 2... 1... GO",
      "You're not lazy. You're...",
      "This is going to change everything."
    ],
    hookPatterns: [
      { name: "The Truth", template: "Let me tell you why you can't stop [behavior]." },
      { name: "The Reframe", template: "You're not [negative label]. You're [reframe]." },
      { name: "The Hack", template: "Here's the hack that changed my life." },
      { name: "The Research", template: "Science explains why [common problem] happens." },
      { name: "The Simple", template: "The simplest way to [goal] is..." }
    ],
    masterPrompt: `You are a script writer that creates short-form video scripts in the style of Mel Robbins.

STYLE REQUIREMENTS:
- Open with direct, attention-grabbing statement
- Acknowledge the struggle authentically
- Share research-backed insight
- Provide simple, actionable tool
- Maintain high energy throughout
- End with clear action step

STRUCTURE:
1. HOOK (1-2 sentences): Direct statement or "Let me tell you something..."
2. VALIDATION (1-2 sentences): Acknowledge their struggle
3. INSIGHT (2-3 sentences): The psychology behind it
4. TOOL (2-3 sentences): Simple tactic to use
5. ACTION (1 sentence): What to do right now

VOICE CHARACTERISTICS:
- High energy, passionate
- "I see you" validation
- Uses hand gestures (noted in script)
- Direct "you" language
- Authentic, not polished
- Practical over philosophical

AVOID:
- Being preachy
- Overly complex advice
- Low energy
- Generic motivation without tactics`,
    referenceScripts: [
      {
        title: "Procrastination",
        script: `Let me tell you why you can't stop procrastinating.

It's not because you're lazy.

[direct eye contact]

It's because your brain is trying to protect you from stress.

When you think about that big task, your brain goes:

"That's stressful. Let's scroll Instagram instead."

It's a protection mechanism.

But here's the hack.

Don't think. Just count.

5... 4... 3... 2... 1... GO.

By the time you get to one, you've interrupted the pattern.

Your brain doesn't have time to talk you out of it.

Try it right now.

Think of one thing you've been avoiding.

5... 4... 3... 2... 1...

GO do it.`,
        wordCount: 103,
        duration: "~60 seconds"
      }
    ]
  }
];

// Helper functions
export function getCreatorById(id: string): CreatorStyle | undefined {
  return creatorStyles.find(c => c.id === id);
}

export function getCreatorsByNiche(nicheId: string): CreatorStyle[] {
  return creatorStyles.filter(c => c.profile.nicheId === nicheId);
}

export function getNicheById(id: string): CreatorNiche | undefined {
  return creatorNiches.find(n => n.id === id);
}

export function getCreatorNames(): { id: string; name: string; niche: string }[] {
  return creatorStyles.map(c => ({
    id: c.id,
    name: c.profile.name,
    niche: c.profile.niche
  }));
}

// For quick reference in dropdowns
export const creatorStylesList = creatorStyles.map(c => ({
  id: c.id,
  name: c.profile.name,
  nicheId: c.profile.nicheId,
  niche: c.profile.niche,
  signature: c.profile.knownFor,
  tone: c.characteristics.tone
}));
