import { useEffect, useRef } from "react";
import confetti from "canvas-confetti";

export function useConfetti(completed: number, total: number) {
  const firedRef = useRef(false);

  useEffect(() => {
    if (total > 0 && completed === total && !firedRef.current) {
      firedRef.current = true;

      // Purple/lavender themed confetti burst 💜
      const colors = ["#9b87f5", "#7E69AB", "#D6BCFA", "#E5DEFF", "#F1F0FB"];

      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors,
      });

      setTimeout(() => {
        confetti({
          particleCount: 50,
          angle: 60,
          spread: 55,
          origin: { x: 0, y: 0.65 },
          colors,
        });
        confetti({
          particleCount: 50,
          angle: 120,
          spread: 55,
          origin: { x: 1, y: 0.65 },
          colors,
        });
      }, 250);
    }

    // Reset when not all done anymore
    if (completed < total || total === 0) {
      firedRef.current = false;
    }
  }, [completed, total]);
}
