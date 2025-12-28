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
}

export const shotPresets: ShotPreset[] = [
  {
    id: "close-up",
    name: "Close-Up",
    image: closeUp,
    description: "Shoulders up to just above head. Face fills 60-70% of frame.",
    whenToUse: "For emotional moments, direct connection with audience, sharing personal stories or insights",
    mood: "Confident, approachable, trustworthy"
  },
  {
    id: "medium-close-up",
    name: "Medium Close-Up",
    image: mediumCloseUp,
    description: "Mid-chest up to above head. Hands partially visible gesturing.",
    whenToUse: "Educational content, explaining concepts, YouTube/podcast creator aesthetic",
    mood: "Educational, energetic, expert sharing knowledge"
  },
  {
    id: "medium-close-up-studio",
    name: "Medium Close-Up (Studio)",
    image: mediumCloseUpStudio,
    description: "Professional studio setup with RGB lighting and monitors visible.",
    whenToUse: "Tech content, professional creator look, behind-the-scenes feel",
    mood: "Professional, modern creator aesthetic"
  },
  {
    id: "medium-shot",
    name: "Medium Shot",
    image: mediumShot,
    description: "Waist/belt line up to above head. Arms and gestures visible.",
    whenToUse: "Teaching moments, lifestyle content, when you need to show body language",
    mood: "Helpful, knowledgeable, approachable expert"
  },
  {
    id: "medium-wide-shot",
    name: "Medium Wide Shot",
    image: mediumWideShot,
    description: "Mid-thigh up. Shows confident stance and environment.",
    whenToUse: "Motivational content, fitness, showing confidence and environment",
    mood: "Motivational, powerful, commanding"
  },
  {
    id: "full-shot",
    name: "Full Shot",
    image: fullShot,
    description: "Head to toe, full body visible in environment.",
    whenToUse: "Street style content, showing outfit, walking shots, establishing presence",
    mood: "Stylish, confident, aspirational"
  },
  {
    id: "low-angle",
    name: "Low Angle",
    image: lowAngle,
    description: "Camera below eye level, looking up at subject.",
    whenToUse: "Power moments, authority statements, making bold claims",
    mood: "Powerful, authoritative, dominant"
  },
  {
    id: "worms-eye",
    name: "Worm's Eye",
    image: wormsEye,
    description: "Extreme low angle from ground, looking straight up.",
    whenToUse: "Maximum impact moments, dramatic reveals, powerful statements",
    mood: "Dominant, larger-than-life, aspirational"
  },
  {
    id: "birds-eye",
    name: "Bird's Eye",
    image: birdsEye,
    description: "Camera directly above looking down at workspace/setup.",
    whenToUse: "Showing process, workspace tours, productivity content, desk setups",
    mood: "Organized, creative, behind-the-scenes"
  },
  {
    id: "pov",
    name: "POV (Point of View)",
    image: pov,
    description: "First-person perspective showing what the creator sees.",
    whenToUse: "Tutorials, showing process, 'day in my life' content, immersive moments",
    mood: "Immersive, personal, relatable"
  },
  {
    id: "over-the-shoulder",
    name: "Over-the-Shoulder",
    image: overTheShoulder,
    description: "Camera positioned behind one person looking at another.",
    whenToUse: "Conversation scenes, interviews, showing interaction or connection",
    mood: "Intimate, conversational, connected"
  },
  {
    id: "seated-power-pose",
    name: "Seated Power Pose",
    image: seatedPowerPose,
    description: "Subject seated in executive chair, leaning back confidently.",
    whenToUse: "Authority content, business advice, 'CEO energy' moments",
    mood: "Executive, contemplative, successful"
  },
  {
    id: "dutch-angle",
    name: "Dutch Angle",
    image: dutchAngle,
    description: "Camera tilted 15-25 degrees for dynamic, edgy feel.",
    whenToUse: "Hot takes, controversial opinions, creating tension or urgency",
    mood: "Edgy, dynamic, tension, 'hot take incoming'"
  },
  {
    id: "reflection-shot",
    name: "Reflection Shot",
    image: reflectionShot,
    description: "Subject and their reflection visible simultaneously.",
    whenToUse: "Introspective moments, self-reflection content, artistic transitions",
    mood: "Introspective, artistic, thoughtful"
  },
  {
    id: "through-frame",
    name: "Through Frame",
    image: throughFrame,
    description: "Shot through foreground elements like plants or doorways.",
    whenToUse: "Cinematic transitions, adding depth, professional look",
    mood: "Cinematic, artistic, layered"
  }
];

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
