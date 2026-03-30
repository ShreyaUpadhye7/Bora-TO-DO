export interface BTSMember {
  name: string;
  emoji: string;
  label: string;
  keywords: string[];
  color: string;
}

export const btsMembers: BTSMember[] = [
  {
    name: "RM",
    emoji: "🐨",
    label: "Deep Thinker",
    keywords: ["study", "read", "write", "think", "plan", "research", "learn", "book", "philosophy", "reflect", "analyze", "strategy", "lead", "organize", "manage", "meeting", "present", "speech", "essay", "journal", "brainstorm", "idea", "concept", "thesis", "library", "museum"],
    color: "hsl(270 40% 55%)",
  },
  {
    name: "Jin",
    emoji: "🐹",
    label: "Joyful Spirit",
    keywords: ["cook", "eat", "lunch", "dinner", "breakfast", "joke", "laugh", "friend", "party", "social", "gather", "chat", "call", "game", "play", "fun", "celebrate", "birthday", "surprise", "gift", "bake", "recipe", "grill", "snack", "hangout", "comedy"],
    color: "hsl(340 30% 60%)",
  },
  {
    name: "Suga",
    emoji: "🐱",
    label: "Chill Vibes",
    keywords: ["coffee", "nap", "relax", "rest", "sleep", "music", "listen", "compose", "produce", "beat", "chill", "lazy", "cozy", "tea", "quiet", "calm", "meditation", "lounge", "podcast", "vinyl", "studio", "piano", "guitar", "song", "album", "playlist"],
    color: "hsl(200 25% 55%)",
  },
  {
    name: "J-Hope",
    emoji: "🐿️",
    label: "Energy Boost",
    keywords: ["dance", "workout", "exercise", "run", "gym", "cardio", "stretch", "yoga", "practice", "perform", "rehearse", "energy", "hype", "motivate", "train", "jog", "bike", "swim", "sport", "fitness", "morning", "routine", "jump", "active", "move", "walk"],
    color: "hsl(45 50% 55%)",
  },
  {
    name: "Jimin",
    emoji: "🐥",
    label: "Gentle Soul",
    keywords: ["care", "skin", "beauty", "spa", "bath", "pamper", "friend", "hug", "love", "sweet", "cute", "kind", "help", "support", "encourage", "comfort", "massage", "facial", "self-care", "wellness", "mindful", "grateful", "diary", "letter", "bond", "empathy"],
    color: "hsl(320 30% 60%)",
  },
  {
    name: "V",
    emoji: "🐻",
    label: "Creative Soul",
    keywords: ["art", "paint", "draw", "photo", "camera", "film", "movie", "gallery", "museum", "design", "create", "aesthetic", "vintage", "nature", "garden", "flower", "sunset", "sky", "dream", "imagine", "sketch", "color", "canvas", "sculpture", "pottery", "craft"],
    color: "hsl(30 35% 55%)",
  },
  {
    name: "Jungkook",
    emoji: "🐰",
    label: "Golden Achiever",
    keywords: ["late", "night", "grind", "focus", "productive", "goal", "achieve", "complete", "finish", "deadline", "project", "code", "build", "create", "stream", "game", "compete", "challenge", "push", "improve", "skill", "practice", "master", "homework", "assignment", "study"],
    color: "hsl(260 35% 55%)",
  },
];

export function classifyTodo(text: string): BTSMember {
  const lower = text.toLowerCase();
  let bestMatch = btsMembers[0];
  let bestScore = 0;

  for (const member of btsMembers) {
    let score = 0;
    for (const keyword of member.keywords) {
      if (lower.includes(keyword)) {
        score += keyword.length; // longer matches score higher
      }
    }
    if (score > bestScore) {
      bestScore = score;
      bestMatch = member;
    }
  }

  // If no match, assign based on hash
  if (bestScore === 0) {
    let hash = 0;
    for (let i = 0; i < text.length; i++) {
      hash = ((hash << 5) - hash) + text.charCodeAt(i);
      hash |= 0;
    }
    bestMatch = btsMembers[Math.abs(hash) % btsMembers.length];
  }

  return bestMatch;
}
