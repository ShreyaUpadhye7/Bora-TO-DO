import { useEffect, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/client";
import { PET_TYPES, getPetStage } from "@/lib/pet-data";
import { useLocation } from "react-router-dom";

const STORAGE_KEY = "walking-pet-enabled";
const PET_SIZE = 5; // pixel size per cell
const SPEED = 1.2; // px per frame
const EDGE_MARGIN = 48; // how close to edge before turning
const CURSOR_ANGRY_DIST = 80; // px — how close cursor triggers angry face

// Directions the pet can face
type Dir = "right" | "left";
type Mood = "walk" | "angry" | "jump";

function PixelPetMini({ pixels, size = 5, flipX = false }: { pixels: string[][], size?: number, flipX?: boolean }) {
  return (
    <div style={{ transform: flipX ? "scaleX(-1)" : "none", display: "inline-grid", gap: 0, gridTemplateColumns: `repeat(${pixels[0]?.length || 8}, ${size}px)` }}>
      {pixels.flatMap((row, ri) => row.map((color, ci) => (
        <div key={`${ri}-${ci}`} style={{ width: size, height: size, backgroundColor: color === "transparent" ? "transparent" : color, borderRadius: size > 4 ? 1 : 0 }} />
      )))}
    </div>
  );
}

export default function WalkingPet() {
  const { user } = useAuth();
  const location = useLocation();
  const [enabled, setEnabled] = useState(() => localStorage.getItem(STORAGE_KEY) !== "false");
  const [petData, setPetData] = useState<any>(null);
  const [pos, setPos] = useState({ x: 120, y: window.innerHeight - 60 });
  const [dir, setDir] = useState<Dir>("right");
  const [mood, setMood] = useState<Mood>("walk");
  const [jumpVy, setJumpVy] = useState(0);
  const [isOnGround, setIsOnGround] = useState(true);
  const cursorRef = useRef({ x: -999, y: -999 });
  const posRef = useRef(pos);
  const dirRef = useRef(dir);
  const moodRef = useRef(mood);
  const jumpVyRef = useRef(jumpVy);
  const isOnGroundRef = useRef(isOnGround);
  const rafRef = useRef<number>();
  const angryTimerRef = useRef<ReturnType<typeof setTimeout>>();

  posRef.current = pos;
  dirRef.current = dir;
  moodRef.current = mood;
  jumpVyRef.current = jumpVy;
  isOnGroundRef.current = isOnGround;

  // Load pet
  useEffect(() => {
    if (!user) return;
    supabase.from("virtual_pets").select("*").eq("user_id", user.id).maybeSingle()
      .then(({ data }) => setPetData(data));
  }, [user]);

  const toggle = () => {
    const next = !enabled;
    setEnabled(next);
    localStorage.setItem(STORAGE_KEY, String(next));
  };

  // Track cursor
  useEffect(() => {
    const handler = (e: MouseEvent) => { cursorRef.current = { x: e.clientX, y: e.clientY }; };
    window.addEventListener("mousemove", handler);
    return () => window.removeEventListener("mousemove", handler);
  }, []);

  // Animation loop
  const tick = useCallback(() => {
    const W = window.innerWidth;
    const H = window.innerHeight;
    const p = { ...posRef.current };
    let d = dirRef.current;
    let m = moodRef.current;
    let vy = jumpVyRef.current;
    let onGround = isOnGroundRef.current;

    // Check cursor proximity
    const cx = cursorRef.current.x;
    const cy = cursorRef.current.y;
    const dist = Math.hypot(cx - p.x, cy - p.y);

    if (dist < CURSOR_ANGRY_DIST && m !== "angry") {
      m = "angry";
      moodRef.current = "angry";
      setMood("angry");
      if (angryTimerRef.current) clearTimeout(angryTimerRef.current);
    } else if (dist >= CURSOR_ANGRY_DIST && m === "angry") {
      // Resume walking after cursor moves away
      angryTimerRef.current = setTimeout(() => {
        moodRef.current = "walk";
        setMood("walk");
      }, 600);
    }

    if (m === "angry") {
      rafRef.current = requestAnimationFrame(tick);
      return; // don't move when angry
    }

    // Gravity + jump
    const GROUND = H - 56;
    if (!onGround) {
      vy += 0.5; // gravity
      p.y += vy;
      if (p.y >= GROUND) {
        p.y = GROUND;
        vy = 0;
        onGround = true;
        setIsOnGround(true);
        setJumpVy(0);
        moodRef.current = "walk";
        setMood("walk");
      }
      jumpVyRef.current = vy;
      isOnGroundRef.current = onGround;
    }

    // Walk horizontally
    if (m !== "jump") {
      if (d === "right") {
        p.x += SPEED;
        if (p.x > W - EDGE_MARGIN) {
          d = "left";
          dirRef.current = "left";
          setDir("left");
          // Occasionally jump when turning
          if (onGround && Math.random() < 0.4) {
            vy = -9;
            setJumpVy(-9);
            setIsOnGround(false);
            isOnGroundRef.current = false;
            moodRef.current = "jump";
            setMood("jump");
          }
        }
      } else {
        p.x -= SPEED;
        if (p.x < EDGE_MARGIN) {
          d = "right";
          dirRef.current = "right";
          setDir("right");
          if (onGround && Math.random() < 0.4) {
            vy = -9;
            setJumpVy(-9);
            setIsOnGround(false);
            isOnGroundRef.current = false;
            moodRef.current = "jump";
            setMood("jump");
          }
        }
      }
    }

    posRef.current = p;
    setPos({ ...p });
    rafRef.current = requestAnimationFrame(tick);
  }, []);

  useEffect(() => {
    if (!enabled || !petData) return;
    rafRef.current = requestAnimationFrame(tick);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [enabled, petData, tick]);

  // Don't show on pet page or auth
  const hide = ["/pet", "/auth"].includes(location.pathname);

  const petType = PET_TYPES.find(p => p.id === petData?.pet_type);
  const stage = petType ? getPetStage(petType, Math.max(0, (petData?.level || 1) - 1)) : null;
  const pixels = stage?.pixels ?? petType?.stages[0]?.pixels;

  return (
    <>
      {/* Toggle button — bottom right */}
      <motion.button
        whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
        onClick={toggle}
        className="fixed bottom-24 left-4 z-40 glass-card rounded-2xl px-3 py-2 flex items-center gap-1.5 text-xs font-body text-muted-foreground hover:text-foreground transition-colors"
        title={enabled ? "Hide walking pet" : "Show walking pet"}
      >
        <span className="text-base">🐾</span>
        <span>{enabled ? "On" : "Off"}</span>
      </motion.button>

      {/* Walking pet */}
      <AnimatePresence>
        {enabled && !hide && petData && pixels && (
          <div
            className="fixed z-30 pointer-events-none select-none"
            style={{ left: pos.x, top: pos.y, transform: "translate(-50%, -100%)" }}
          >
            {/* Speech bubble when angry */}
            <AnimatePresence>
              {mood === "angry" && (
                <motion.div
                  initial={{ opacity: 0, y: 4, scale: 0.8 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="absolute -top-8 left-1/2 -translate-x-1/2 bg-white text-black text-[10px] font-bold rounded-full px-2 py-0.5 whitespace-nowrap shadow"
                  style={{ border: "1px solid #ddd" }}
                >
                  😤 Hey!
                </motion.div>
              )}
            </AnimatePresence>

            {/* Pet sprite */}
            <motion.div
              animate={mood === "jump" ? { y: [0, -4, 0] } : mood === "angry" ? { rotate: [-3, 3, -3] } : { y: [0, -2, 0] }}
              transition={mood === "angry" ? { duration: 0.3, repeat: Infinity } : { duration: 0.6, repeat: Infinity, ease: "easeInOut" }}
            >
              <PixelPetMini pixels={pixels} size={PET_SIZE} flipX={dir === "left"} />
            </motion.div>

            {/* Shadow */}
            <div className="mx-auto mt-0.5 rounded-full bg-black/20"
              style={{ width: pixels[0].length * PET_SIZE * 0.7, height: 3, filter: "blur(2px)" }} />
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
