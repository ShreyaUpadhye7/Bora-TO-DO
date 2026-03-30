export const btsQuotes: string[] = [
  "Even if you're not perfect, you're limited edition. — RM",
  "Go on your path, even if you live for a day. — Suga",
  "If you want to love others, I think you should love yourself first. — RM",
  "Life is tough, and things don't always work out well, but we should be brave and go on with our lives. — Jin",
  "You can't just come into someone's life, make them feel special, and then leave.",
  "Dream, though your beginnings might be humble, may the end be prosperous. — J-Hope",
  "The stars shine brightest when the night is darkest.",
  "Don't be trapped in someone else's dream. — V",
  "Your presence can give happiness. I hope you remember that. — Jimin",
  "If you don't work hard, there won't be good results. — Jungkook",
  "You'll shine brightest when you stop comparing yourself to others.",
  "Take time to rest. You've worked hard today. 💜",
  "Patience is the key. Everything comes at the right time.",
  "Purple means trust and love for a long time. 💜",
  "Today's effort is tomorrow's achievement.",
  "Be kind to yourself. You're doing your best.",
];

export function getRandomQuote(): string {
  return btsQuotes[Math.floor(Math.random() * btsQuotes.length)];
}

export function getDailyQuote(): string {
  const today = new Date();
  const dayIndex = (today.getFullYear() * 366 + today.getMonth() * 31 + today.getDate()) % btsQuotes.length;
  return btsQuotes[dayIndex];
}
