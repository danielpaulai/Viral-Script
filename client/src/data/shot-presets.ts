import mediumCloseUp from "@assets/Gemini_Generated_Image_sempxosempxosemp_1766952452963.jpeg";
import lowAngle from "@assets/Gemini_Generated_Image_jnygi9jnygi9jnyg_1766956595220.jpeg";
import pov from "@assets/Gemini_Generated_Image_bln07fbln07fbln0_1766956608885.jpeg";
import birdsEye from "@assets/Gemini_Generated_Image_2dqx8d2dqx8d2dqx_1766956743080.jpeg";
import overTheShoulder from "@assets/Gemini_Generated_Image_fbzqyvfbzqyvfbzq_1766956836510.jpeg";
import fullShot from "@assets/Gemini_Generated_Image_qm81w7qm81w7qm81_1766957038333.jpeg";
import mediumWideShot from "@assets/Gemini_Generated_Image_iab3baiab3baiab3_1766957068225.jpeg";
import mediumShot from "@assets/Gemini_Generated_Image_z65spxz65spxz65s_1766957276994.jpeg";
import mediumCloseUpStudio from "@assets/Gemini_Generated_Image_iaxjb9iaxjb9iaxj_1766957515879.jpeg";
import seatedPowerPose from "@assets/Gemini_Generated_Image_mxcquemxcquemxcq_1766957682233.jpeg";
import closeUp from "@assets/Gemini_Generated_Image_bsrmribsrmribsrm_1766957703496.jpeg";
import wormsEye from "@assets/Gemini_Generated_Image_ycxe88ycxe88ycxe_1766957753813.jpeg";
import dutchAngle from "@assets/Gemini_Generated_Image_tnzl6xtnzl6xtnzl_1766957792594.jpeg";
import reflectionShot from "@assets/Gemini_Generated_Image_ucrh58ucrh58ucrh_1766957891632.jpeg";
import throughFrame from "@assets/Gemini_Generated_Image_paf2wjpaf2wjpaf2_1766957997249.jpeg";

export interface ShotPreset {
  id: string;
  name: string;
  image: string;
  description: string;
  whenToUse: string;
  mood: string;
  angle: string;
  setup: {
    cameraHeight: string;
    distance: string;
    equipment: string[];
    tips: string[];
  };
}

export const shotPresets: ShotPreset[] = [
  {
    id: "close-up",
    name: "Close-Up",
    image: closeUp,
    description: "Shoulders up to just above head. Face fills 60-70% of frame.",
    whenToUse: "For emotional moments, direct connection with audience, sharing personal stories or insights",
    mood: "Confident, approachable, trustworthy",
    angle: "Eye level (0 degrees)",
    setup: {
      cameraHeight: "Eye level - camera lens at same height as your eyes",
      distance: "2-3 feet from subject",
      equipment: ["Tripod at eye height", "Ring light or key light", "Phone/camera with portrait mode"],
      tips: ["Keep background simple and uncluttered", "Use shallow depth of field for blur", "Maintain eye contact with lens"]
    }
  },
  {
    id: "medium-close-up",
    name: "Medium Close-Up",
    image: mediumCloseUp,
    description: "Mid-chest up to above head. Hands partially visible gesturing.",
    whenToUse: "Educational content, explaining concepts, YouTube/podcast creator aesthetic",
    mood: "Educational, energetic, expert sharing knowledge",
    angle: "Eye level to slightly above (0-10 degrees down)",
    setup: {
      cameraHeight: "Eye level or slightly above - camera 0-6 inches above eye line",
      distance: "3-4 feet from subject",
      equipment: ["Tripod or desk mount", "Soft box or ring light", "Lavalier or shotgun mic"],
      tips: ["Leave headroom above - about 10% of frame", "Hands should be visible when gesturing", "Background can include relevant props"]
    }
  },
  {
    id: "medium-close-up-studio",
    name: "Medium Close-Up (Studio)",
    image: mediumCloseUpStudio,
    description: "Professional studio setup with RGB lighting and monitors visible.",
    whenToUse: "Tech content, professional creator look, behind-the-scenes feel",
    mood: "Professional, modern creator aesthetic",
    angle: "Eye level (0 degrees)",
    setup: {
      cameraHeight: "Eye level - lens aligned with eyes",
      distance: "3-4 feet from subject",
      equipment: ["RGB lighting for ambiance", "Monitor as background element", "Quality webcam or mirrorless camera"],
      tips: ["Show tech setup in background", "Use RGB lights at 20-30% brightness", "Keep main face lit with key light"]
    }
  },
  {
    id: "medium-shot",
    name: "Medium Shot",
    image: mediumShot,
    description: "Waist/belt line up to above head. Arms and gestures visible.",
    whenToUse: "Teaching moments, lifestyle content, when you need to show body language",
    mood: "Helpful, knowledgeable, approachable expert",
    angle: "Eye level (0 degrees)",
    setup: {
      cameraHeight: "Chest to eye level",
      distance: "4-6 feet from subject",
      equipment: ["Full-size tripod", "Two-point lighting (key + fill)", "Wireless mic recommended"],
      tips: ["Frame from waist up", "Show hand gestures clearly", "Use 35-50mm focal length equivalent"]
    }
  },
  {
    id: "medium-wide-shot",
    name: "Medium Wide Shot",
    image: mediumWideShot,
    description: "Mid-thigh up. Shows confident stance and environment.",
    whenToUse: "Motivational content, fitness, showing confidence and environment",
    mood: "Motivational, powerful, commanding",
    angle: "Slightly below eye level (5-10 degrees up)",
    setup: {
      cameraHeight: "Chest height - slightly below eye level",
      distance: "6-8 feet from subject",
      equipment: ["Full tripod with adjustable legs", "Wide angle lens (24-35mm)", "Three-point lighting for full body"],
      tips: ["Show confident stance and posture", "Include environment context", "Lower angle adds power"]
    }
  },
  {
    id: "full-shot",
    name: "Full Shot",
    image: fullShot,
    description: "Head to toe, full body visible in environment.",
    whenToUse: "Street style content, showing outfit, walking shots, establishing presence",
    mood: "Stylish, confident, aspirational",
    angle: "Waist level (15-20 degrees up)",
    setup: {
      cameraHeight: "Waist height - about 3 feet from ground",
      distance: "8-12 feet from subject",
      equipment: ["Low tripod or ground pod", "Wide angle lens (24mm or wider)", "Stabilizer for walking shots"],
      tips: ["Frame with small headroom and footroom", "Use leading lines in environment", "Shoot at golden hour for best light"]
    }
  },
  {
    id: "low-angle",
    name: "Low Angle",
    image: lowAngle,
    description: "Camera below eye level, looking up at subject.",
    whenToUse: "Power moments, authority statements, making bold claims",
    mood: "Powerful, authoritative, dominant",
    angle: "30-45 degrees up from below",
    setup: {
      cameraHeight: "Chest to waist height - 2-3 feet from ground",
      distance: "3-5 feet from subject",
      equipment: ["Short tripod or mini tripod", "Standard lens (35-50mm)", "Light from above or side"],
      tips: ["Chin up slightly for best look", "Light face from above to avoid shadows", "Makes subject look taller and more powerful"]
    }
  },
  {
    id: "worms-eye",
    name: "Worm's Eye",
    image: wormsEye,
    description: "Extreme low angle from ground, looking straight up.",
    whenToUse: "Maximum impact moments, dramatic reveals, powerful statements",
    mood: "Dominant, larger-than-life, aspirational",
    angle: "60-90 degrees up (near vertical)",
    setup: {
      cameraHeight: "Ground level - camera flat on ground or on ground tripod",
      distance: "2-4 feet from subject",
      equipment: ["Ground pod or flat surface", "Wide angle lens for dramatic effect", "Remote trigger or timer"],
      tips: ["Subject should look down at camera", "Works best outdoors with sky background", "Use for dramatic reveals only"]
    }
  },
  {
    id: "birds-eye",
    name: "Bird's Eye",
    image: birdsEye,
    description: "Camera directly above looking down at workspace/setup.",
    whenToUse: "Showing process, workspace tours, productivity content, desk setups",
    mood: "Organized, creative, behind-the-scenes",
    angle: "90 degrees down (directly overhead)",
    setup: {
      cameraHeight: "3-4 feet above desk/workspace",
      distance: "Directly overhead",
      equipment: ["Overhead camera arm or C-stand", "Wide angle lens", "Even lighting from sides"],
      tips: ["Keep workspace tidy and organized", "Remove any reflective surfaces", "Hands should enter frame naturally"]
    }
  },
  {
    id: "pov",
    name: "POV (Point of View)",
    image: pov,
    description: "First-person perspective showing what the creator sees.",
    whenToUse: "Tutorials, showing process, 'day in my life' content, immersive moments",
    mood: "Immersive, personal, relatable",
    angle: "Varies - matches natural eye line",
    setup: {
      cameraHeight: "Eye level of subject - mounted on head or chest",
      distance: "N/A - camera is on the subject",
      equipment: ["GoPro or action camera", "Head or chest mount", "Stabilization recommended"],
      tips: ["Move head slowly to avoid motion sickness", "Use wide angle for immersion", "Works great for tutorials and processes"]
    }
  },
  {
    id: "over-the-shoulder",
    name: "Over-the-Shoulder",
    image: overTheShoulder,
    description: "Camera positioned behind one person looking at another.",
    whenToUse: "Conversation scenes, interviews, showing interaction or connection",
    mood: "Intimate, conversational, connected",
    angle: "Eye level, 45 degrees off-axis",
    setup: {
      cameraHeight: "Eye level - slightly behind one subject's shoulder",
      distance: "4-6 feet from the subjects",
      equipment: ["Two tripods for different angles", "85mm or longer lens for compression", "Separate audio for each person"],
      tips: ["Include 30% of near shoulder in frame", "Focus on the facing subject", "Great for reaction shots"]
    }
  },
  {
    id: "seated-power-pose",
    name: "Seated Power Pose",
    image: seatedPowerPose,
    description: "Subject seated in executive chair, leaning back confidently.",
    whenToUse: "Authority content, business advice, 'CEO energy' moments",
    mood: "Executive, contemplative, successful",
    angle: "Slightly below eye level (10-15 degrees up)",
    setup: {
      cameraHeight: "Below seated eye level - about 3 feet from ground",
      distance: "5-7 feet from subject",
      equipment: ["Low tripod position", "Standard or short telephoto lens", "Professional lighting setup"],
      tips: ["Lean back confidently in chair", "Steeple fingers or rest hands on armrests", "Include desk or office background"]
    }
  },
  {
    id: "dutch-angle",
    name: "Dutch Angle",
    image: dutchAngle,
    description: "Camera tilted 15-25 degrees for dynamic, edgy feel.",
    whenToUse: "Hot takes, controversial opinions, creating tension or urgency",
    mood: "Edgy, dynamic, tension, 'hot take incoming'",
    angle: "Eye level, tilted 15-25 degrees sideways",
    setup: {
      cameraHeight: "Eye level - standard height",
      distance: "3-5 feet from subject",
      equipment: ["Tripod with tilt capability", "Any lens works", "Dynamic lighting (shadows okay)"],
      tips: ["Tilt 15-25 degrees - more looks sloppy", "Use sparingly for impact", "Great for controversial takes or reveals"]
    }
  },
  {
    id: "reflection-shot",
    name: "Reflection Shot",
    image: reflectionShot,
    description: "Subject and their reflection visible simultaneously.",
    whenToUse: "Introspective moments, self-reflection content, artistic transitions",
    mood: "Introspective, artistic, thoughtful",
    angle: "Varies based on reflective surface",
    setup: {
      cameraHeight: "Depends on mirror/surface placement",
      distance: "Position to capture both subject and reflection",
      equipment: ["Mirror, window, or water surface", "Polarizing filter optional", "Soft, diffused lighting"],
      tips: ["Clean reflective surface thoroughly", "Watch for unwanted reflections", "Focus on subject, not reflection"]
    }
  },
  {
    id: "through-frame",
    name: "Through Frame",
    image: throughFrame,
    description: "Shot through foreground elements like plants or doorways.",
    whenToUse: "Cinematic transitions, adding depth, professional look",
    mood: "Cinematic, artistic, layered",
    angle: "Eye level typically (0 degrees)",
    setup: {
      cameraHeight: "Eye level or varies based on foreground element",
      distance: "6-10 feet from subject, 1-2 feet from foreground",
      equipment: ["Fast aperture lens (f/1.8-2.8)", "Plants, doorframes, or other foreground elements", "Shallow depth of field"],
      tips: ["Blur foreground heavily with wide aperture", "Frame subject within the gap", "Adds cinematic depth and layers"]
    }
  }
];

export interface BackgroundTrack {
  id: string;
  title: string;
  artist: string;
  vibes: string[];
}

export const backgroundMusicLibrary: BackgroundTrack[] = [
  { id: "1", title: "THANK YOU (Instrumental)", artist: "Tyler, The Creator", vibes: ["Inspirational", "Thought-provoking"] },
  { id: "2", title: "Plage Coquillage (First Kiss Song)", artist: "Tao Mon Amour", vibes: ["Thought-provoking", "Inspirational"] },
  { id: "3", title: "Bloody Mary (Remix)", artist: "Lady Gaga", vibes: ["Sigma"] },
  { id: "4", title: "Private Jet", artist: "D Savage", vibes: ["Chill", "Engaging"] },
  { id: "5", title: "Suicide Year", artist: "WEEDMANE", vibes: ["Phonk"] },
  { id: "6", title: "Sahara", artist: "Hensonn", vibes: ["Sigma"] },
  { id: "7", title: "i was only temporary", artist: "my head is empty", vibes: ["Thought-provoking", "Suspense"] },
  { id: "8", title: "Suspense, Horror, Piano and Music Box", artist: "Mr. Blindbandit", vibes: ["Thought-provoking", "Suspense"] },
  { id: "9", title: "Echo Sax End", artist: "Caleb Arredondo", vibes: ["Thought-provoking", "Inspirational"] },
  { id: "10", title: "Tings", artist: "Baby Smoove", vibes: ["Chill", "Engaging"] },
  { id: "11", title: "The Lost Soul Down (slowed + reverb)", artist: "NBSPLV", vibes: ["Thought-provoking", "Sigma"] },
  { id: "12", title: "Blade Runner 2049", artist: "Synthwave Goose", vibes: ["Thought-provoking"] },
  { id: "13", title: "Another Late Night", artist: "Drake ft. Lil Yachty", vibes: ["Chill", "Engaging"] },
  { id: "14", title: "Yale", artist: "Ken Carson", vibes: ["Hard", "Engaging"] },
  { id: "15", title: "Paper Planes", artist: "M.I.A.", vibes: ["Chill", "Engaging"] },
  { id: "16", title: "After Dark", artist: "Mr. Kitty", vibes: ["Sigma"] },
  { id: "17", title: "Hell N Back", artist: "Bakar", vibes: ["Chill", "Engaging"] },
  { id: "18", title: "Vampire Heart", artist: "Isak Roen & Key Kelly", vibes: ["Hard", "Engaging"] },
  { id: "19", title: "The Young Folks", artist: "Peter Bjorn and John", vibes: ["Chill", "Engaging"] },
  { id: "20", title: "Righteous", artist: "Mo Beats", vibes: ["Inspirational"] },
  { id: "21", title: "Million Dollar Baby", artist: "Tommy Richman", vibes: ["Hard", "Engaging"] },
  { id: "22", title: "HOME - Resonance (slowed + reverb)", artist: "HOME", vibes: ["Emotional", "Inspirational"] },
  { id: "23", title: "Luminary", artist: "Joel Sunny", vibes: ["Thought-provoking"] },
  { id: "24", title: "Low Key Gliding (K08beatz remix)", artist: "Hal Walker", vibes: ["Chill", "Engaging"] },
  { id: "25", title: "Not Like Us", artist: "Kendrick Lamar", vibes: ["Hard", "Engaging"] },
  { id: "26", title: "Call me (slowed)", artist: "Plenka", vibes: ["Sigma"] },
  { id: "27", title: "Space Cadet", artist: "Metro Boomin & Gunna", vibes: ["Chill", "Engaging"] },
  { id: "28", title: "After Hours (slowed + reverb)", artist: "The Weeknd", vibes: ["Inspirational"] },
  { id: "29", title: "Walk Em Down", artist: "Metro Boomin & 21 Savage", vibes: ["Hard", "Engaging"] },
  { id: "30", title: "In Ha Mood", artist: "Ice Spice", vibes: ["Hard", "Engaging"] },
  { id: "31", title: "Runaway", artist: "Kanye West", vibes: ["Inspirational", "Engaging"] },
  { id: "32", title: "Walking on a Dream", artist: "Empire of the Sun", vibes: ["Chill", "Engaging"] },
  { id: "33", title: "Like That", artist: "Metro Boomin & Future", vibes: ["Hard", "Engaging"] },
  { id: "34", title: "Test & Recognize (Flume Re-work)", artist: "Seekae", vibes: ["Thought-provoking", "Inspirational"] },
  { id: "35", title: "Dark Red", artist: "Steve Lacy", vibes: ["Chill", "Engaging"] },
  { id: "36", title: "1901", artist: "Phoenix", vibes: ["Inspirational"] },
  { id: "37", title: "Thelema", artist: "Øfdream", vibes: ["Thought-provoking"] },
  { id: "38", title: "First Person Shooter", artist: "Drake ft. J. Cole", vibes: ["Hard", "Engaging"] },
  { id: "39", title: "Money So Big", artist: "Yeat", vibes: ["Hard", "Engaging"] },
  { id: "40", title: "GigaChad Theme", artist: "g3ox_em", vibes: ["Phonk"] },
  { id: "41", title: "ESSENCE", artist: "Casper", vibes: ["Phonk"] },
  { id: "42", title: "Swag Overload", artist: "Ken Carson", vibes: ["Chill", "Engaging"] },
  { id: "43", title: "METAMORPHOSIS", artist: "INTERWORLD", vibes: ["Phonk"] },
  { id: "44", title: "Surround Sound", artist: "J.I.D ft. 21 Savage", vibes: ["Hard", "Engaging"] },
  { id: "45", title: "Memory Reboot", artist: "Narvent & VØJ", vibes: ["Inspirational"] },
  { id: "46", title: "Frank Saint (slowed)", artist: "core²", vibes: ["Thought-provoking", "Emotional"] },
  { id: "47", title: "Dragonfly", artist: "Dana and Alden", vibes: ["Thought-provoking", "Inspirational"] },
  { id: "48", title: "Another Love (slowed)", artist: "Tom Odell", vibes: ["Emotional"] },
  { id: "49", title: "Tell Em (slowed + reverb)", artist: "Cochise", vibes: ["Chill", "Engaging"] },
  { id: "50", title: "Eyes Without A Face", artist: "Billy Idol", vibes: ["Chill", "Engaging"] },
  { id: "51", title: "Close Eyes (slowed + reverb)", artist: "DVRST", vibes: ["Phonk"] },
  { id: "52", title: "Rapp Snitch Knishes", artist: "MF Doom", vibes: ["Chill", "Engaging"] },
  { id: "53", title: "Dream Space", artist: "DVRST", vibes: ["Phonk"] },
  { id: "54", title: "bigger thën everything", artist: "Yeat", vibes: ["Chill", "Engaging"] },
  { id: "55", title: "Hand Covers Bruise", artist: "Atticus Ross & Trent Reznor", vibes: ["Thought-provoking", "Suspense"] },
  { id: "56", title: "20 Min", artist: "Lil Uzi Vert", vibes: ["Chill", "Engaging"] },
  { id: "57", title: "Particles (slowed)", artist: "Villiam Lane", vibes: ["Sigma"] },
  { id: "58", title: "Heart On My Sleeve", artist: "AI Drake", vibes: ["Chill", "Engaging"] },
  { id: "59", title: "Paris", artist: "Else", vibes: ["Thought-provoking"] },
  { id: "60", title: "Lost", artist: "Frank Ocean", vibes: ["Chill", "Engaging"] },
  { id: "61", title: "MONEY IS FOR THE RENT NOT FOR THE SOUL", artist: "Mr. Carmack", vibes: ["Phonk"] }
];

export const musicVibes = [
  "Chill",
  "Engaging", 
  "Hard",
  "Inspirational",
  "Thought-provoking",
  "Emotional",
  "Sigma",
  "Phonk",
  "Suspense"
] as const;

export function getMusicByVibe(vibe: string): BackgroundTrack[] {
  return backgroundMusicLibrary.filter(track => 
    track.vibes.some(v => v.toLowerCase() === vibe.toLowerCase())
  );
}

export function getMusicForScriptMood(mood: string): BackgroundTrack[] {
  const moodToVibeMap: Record<string, string[]> = {
    "authority": ["Hard", "Sigma", "Inspirational"],
    "education": ["Thought-provoking", "Chill", "Inspirational"],
    "storytelling": ["Emotional", "Thought-provoking", "Inspirational"],
    "motivational": ["Hard", "Inspirational", "Engaging"],
    "casual": ["Chill", "Engaging"],
    "intense": ["Phonk", "Hard", "Suspense"]
  };
  
  const vibes = moodToVibeMap[mood.toLowerCase()] || ["Chill", "Engaging"];
  return backgroundMusicLibrary.filter(track =>
    track.vibes.some(v => vibes.includes(v))
  );
}

export const musicResources = [
  {
    name: "Epidemic Sound",
    url: "https://www.epidemicsound.com",
    description: "Premium royalty-free music library with unlimited downloads",
    type: "Paid (free trial)"
  },
  {
    name: "Artlist",
    url: "https://artlist.io",
    description: "High-quality music and SFX for creators",
    type: "Paid (annual license)"
  },
  {
    name: "Uppbeat",
    url: "https://uppbeat.io",
    description: "Free music for creators with attribution",
    type: "Free + Paid"
  },
  {
    name: "Pixabay Music",
    url: "https://pixabay.com/music",
    description: "100% free royalty-free music tracks",
    type: "Free"
  },
  {
    name: "YouTube Audio Library",
    url: "https://studio.youtube.com/channel/UC/music",
    description: "Free music and sound effects from YouTube",
    type: "Free"
  },
  {
    name: "Mixkit",
    url: "https://mixkit.co/free-stock-music",
    description: "Free stock music tracks for any project",
    type: "Free"
  },
  {
    name: "Free Music Archive",
    url: "https://freemusicarchive.org",
    description: "High-quality, legal audio downloads",
    type: "Free"
  },
  {
    name: "Bensound",
    url: "https://www.bensound.com",
    description: "Original royalty-free music",
    type: "Free + Paid"
  }
];

export function getShotRecommendations(scriptSection: "hook" | "body" | "cta"): ShotPreset[] {
  switch (scriptSection) {
    case "hook":
      return shotPresets.filter(s => 
        ["close-up", "medium-close-up", "dutch-angle", "low-angle", "pov"].includes(s.id)
      );
    case "body":
      return shotPresets.filter(s => 
        ["medium-shot", "medium-close-up", "birds-eye", "over-the-shoulder", "through-frame", "medium-wide-shot"].includes(s.id)
      );
    case "cta":
      return shotPresets.filter(s => 
        ["close-up", "medium-close-up", "seated-power-pose", "low-angle"].includes(s.id)
      );
    default:
      return shotPresets;
  }
}
