export const comfortQuotes: string[] = [
  "You did well today. Really. 💜",
  "It's okay to rest. The stars don't shine all night either.",
  "Even the moon has phases. You're allowed to be less than full.",
  "Someone out there is proud of you, even if you can't see it yet.",
  "You are not behind. You are exactly where you need to be.",
  "Breathe in courage, breathe out fear. 🌙",
  "The fact that you're still here means you're stronger than you think.",
  "Take it one step at a time. There's no rush.",
  "You are enough, just as you are, in this very moment.",
  "Let go of what you can't control. Hold on to what makes you smile.",
  "Your heart knows the way. Trust it. 💜",
  "Difficult roads often lead to beautiful destinations.",
  "You don't have to be perfect to be amazing.",
  "Rest if you must, but don't give up.",
  "The night is darkest just before the dawn. Keep going. 🌟",
];

export function getRandomComfort(): string {
  return comfortQuotes[Math.floor(Math.random() * comfortQuotes.length)];
}
