import { useEffect, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/client";
import { PET_TYPES, getPetStage } from "@/lib/pet-data";
import { useLocation } from "react-router-dom";

const STORAGE_KEY = "walking-pet-enabled";
const S = 5; // pixel cell size
const PW = 8 * S; // pet width ~40px
const PH = 8 * S; // pet height ~40px
const GRAV = 0.6;
const SPEED = 1.8;
const ANGRY_R = 90;
const CLIMB_HEIGHT = 22;
const CLIMB_SPEED = 3.2;
const MAX_FALL_SPEED = 12;

type SolidBox = { x: number; y: number; w: number; h: number; floor?: boolean };

const SOLID_SELECTOR = [
  ".glass-card",
  ".glass-nav",
  "button",
  "a[href]",
  "input",
  "textarea",
  "select",
  "[role='button']",
  "[role='dialog']",
  "[data-radix-popper-content-wrapper]",
].join(", ");

// Scan visible app UI as solid boxes (viewport coords)
function scanSolids(): SolidBox[] {
  const out: SolidBox[] = [];
  document.querySelectorAll(SOLID_SELECTOR).forEach((el) => {
    if (!(el instanceof HTMLElement) || el.closest("[data-walking-pet]")) return;
    const r = el.getBoundingClientRect();
    const style = window.getComputedStyle(el);
    if (
      style.visibility === "hidden" ||
      style.display === "none" ||
      r.width < 34 ||
      r.height < 18 ||
      r.bottom < 0 ||
      r.top > window.innerHeight ||
      r.right < 0 ||
      r.left > window.innerWidth
    ) {
      return;
    }

    // Avoid duplicate nested controls making the pet bounce inside the same card.
    const duplicate = out.some((p) =>
      Math.abs(p.x - r.left) < 3 &&
      Math.abs(p.y - r.top) < 3 &&
      Math.abs(p.w - r.width) < 3 &&
      Math.abs(p.h - r.height) < 3
    );
    if (!duplicate) {
      out.push({ x: r.left, y: r.top, w: r.width, h: r.height });
    }
  });
  // Screen floor
  out.push({ x: 0, y: window.innerHeight - 4, w: window.innerWidth, h: 4, floor: true });
  return out;
}

function overlaps(a1: number, a2: number, b1: number, b2: number) {
  return a1 < b2 && a2 > b1;
}

function intersectsBox(x: number, y: number, box: SolidBox) {
  return x < box.x + box.w && x + PW > box.x && y < box.y + box.h && y + PH > box.y;
}

function findWall(x: number, y: number, solids: SolidBox[]) {
  return solids.find((box) => !box.floor && intersectsBox(x, y, box)) ?? null;
}

function findStepUp(x: number, y: number, dx: number, solids: SolidBox[]) {
  const foot = y + PH;
  const frontX = dx > 0 ? x + PW + 2 : x - 2;

  for (const box of solids) {
    if (box.floor) continue;
    const hitsFront = dx > 0
      ? frontX >= box.x && frontX <= box.x + Math.min(18, box.w)
      : frontX <= box.x + box.w && frontX >= box.x + Math.max(box.w - 18, 0);

    if (!hitsFront) continue;
    if (!overlaps(y + 6, foot - 3, box.y, box.y + box.h)) continue;

    const climb = foot - box.y;
    if (climb >= 0 && climb <= CLIMB_HEIGHT) {
      return box.y - PH;
    }
  }

  return null;
}

function findLanding(x: number, prevY: number, nextY: number, solids: SolidBox[]) {
  const prevFoot = prevY + PH;
  const nextFoot = nextY + PH;
  let landing: SolidBox | null = null;

  for (const box of solids) {
    if (!overlaps(x + 6, x + PW - 6, box.x + 4, box.x + box.w - 4)) continue;
    if (prevFoot <= box.y + 4 && nextFoot >= box.y) {
      if (!landing || box.y < landing.y) landing = box;
    }
  }

  return landing;
}

function hasGround(x: number, y: number, solids: SolidBox[]) {
  const foot = y + PH;
  return solids.some((box) =>
    overlaps(x + 6, x + PW - 6, box.x + 4, box.x + box.w - 4) &&
    Math.abs(foot - box.y) < 5
  );
}

function PixelMini({ pixels, size, flipX }) {
  if (!pixels) return null;
  const cols = pixels[0]?.length || 8;
  return (
    <div style={{
      display: "inline-grid", gap: 0,
      gridTemplateColumns: `repeat(${cols}, ${size}px)`,
      transform: flipX ? "scaleX(-1)" : "none",
      imageRendering: "pixelated",
    }}>
      {pixels.flatMap((row, ri) => row.map((c, ci) => (
        <div key={ri + "-" + ci} style={{
          width: size, height: size,
          background: c === "transparent" ? "transparent" : c,
          borderRadius: size > 4 ? 1 : 0,
        }} />
      )))}
    </div>
  );
}

export default function WalkingPet() {
  const { user } = useAuth();
  const loc = useLocation();
  const [enabled, setEnabled] = useState(() => localStorage.getItem(STORAGE_KEY) !== "false");
  const [petData, setPetData] = useState(null);
  const [view, setView] = useState({ x: 200, y: 300, flipX: false, angry: false, air: false });

  // Physics state in refs (not state — avoids re-render lag)
  const px = useRef(200); const py = useRef(300);
  const vx = useRef(SPEED); const vy = useRef(0);
  const grounded = useRef(false);
  const angry = useRef(false);
  const solids = useRef<SolidBox[]>([]);
  const cursor = useRef({ x: -999, y: -999 });
  const raf = useRef(null);
  const scanTimer = useRef(null);

  // Load pet
  useEffect(() => {
    if (!user) return;
    supabase.from("virtual_pets").select("*").eq("user_id", user.id).maybeSingle()
      .then(({ data }) => { if (data) setPetData(data); });
  }, [user]);

  // Track cursor / touch
  useEffect(() => {
    const mc = (e) => { cursor.current = { x: e.clientX, y: e.clientY }; };
    const mt = (e) => { if (e.touches[0]) cursor.current = { x: e.touches[0].clientX, y: e.touches[0].clientY }; };
    const onLeave = () => { cursor.current = { x: -999, y: -999 }; };

    window.addEventListener("pointermove", mc);
    window.addEventListener("mousemove", mc);
    window.addEventListener("touchmove", mt, { passive: true });
    window.addEventListener("mouseleave", onLeave);
    return () => {
      window.removeEventListener("pointermove", mc);
      window.removeEventListener("mousemove", mc);
      window.removeEventListener("touchmove", mt);
      window.removeEventListener("mouseleave", onLeave);
    };
  }, []);

  // Rescan solid UI boxes on scroll, resize, route change
  const rescan = useCallback(() => { solids.current = scanSolids(); }, []);

  useEffect(() => {
    if (!enabled) return;
    rescan();
    scanTimer.current = setInterval(rescan, 600);
    window.addEventListener("scroll", rescan, true);
    window.addEventListener("resize", rescan);
    return () => {
      clearInterval(scanTimer.current);
      window.removeEventListener("scroll", rescan, true);
      window.removeEventListener("resize", rescan);
    };
  }, [enabled, loc.pathname, rescan]);

  // Main physics loop
  const tick = useCallback(() => {
    const W = window.innerWidth;
    const H = window.innerHeight;
    let x = px.current, y = py.current;
    let dvx = vx.current, dvy = vy.current;
    let g = grounded.current;

    // Cursor anger check
    const d = Math.hypot(cursor.current.x - (x + PW / 2), cursor.current.y - (y + PH / 2));
    if (d < ANGRY_R && !angry.current) {
      angry.current = true;
    } else if (d >= ANGRY_R && angry.current) {
      angry.current = false;
    }

    if (!angry.current) {
      // Gravity
      dvy = Math.min(MAX_FALL_SPEED, dvy + GRAV);

      // Horizontal movement: climb short obstacles, otherwise treat them as walls.
      let nextX = x + dvx;
      const stepY = g ? findStepUp(nextX, y, dvx, solids.current) : null;
      if (stepY !== null) {
        x = nextX;
        y = stepY;
        dvy = 0;
        g = true;
      } else {
        let climbedWall = false;
        const wall = findWall(nextX, y, solids.current);
        if (wall) {
          const targetY = wall.y - PH;
          if (targetY < y) {
            y = Math.max(targetY, y - CLIMB_SPEED);
            dvy = 0;
            g = true;
            climbedWall = true;
          } else {
            dvx = -dvx;
          }
        } else {
          x = nextX;
        }

        if (!climbedWall) {
          // Vertical movement: land on UI boxes, fall when no ground is below.
          const prevY = y;
          const nextY = y + dvy;
          const landing = dvy >= 0 ? findLanding(x, prevY, nextY, solids.current) : null;
          if (landing) {
            y = landing.y - PH;
            dvy = 0;
            g = true;
          } else {
            y = nextY;
            g = false;
          }

          if (g && !hasGround(x, y, solids.current)) {
            g = false;
          }
        }
      }

      // Screen bounds
      if (x < 0) { x = 0; dvx = Math.abs(dvx); }
      if (x + PW > W) { x = W - PW; dvx = -Math.abs(dvx); }
      if (y + PH > H) { y = H - PH; dvy = 0; g = true; }
      if (y < 0) { y = 0; dvy = Math.abs(dvy) * 0.3; }
    }

    px.current = x; py.current = y;
    vx.current = dvx; vy.current = dvy;
    grounded.current = g;

    setView({ x, y, flipX: dvx < 0, angry: angry.current, air: !g });
    raf.current = requestAnimationFrame(tick);
  }, []);

  // Start/stop loop
  useEffect(() => {
    if (!enabled || !petData) return;
    // Start near bottom center
    px.current = window.innerWidth / 2;
    py.current = window.innerHeight - 80;
    raf.current = requestAnimationFrame(tick);
    return () => { if (raf.current) cancelAnimationFrame(raf.current); };
  }, [enabled, petData, tick]);

  const hide = ["/auth"].includes(loc.pathname);
  const petType = PET_TYPES.find(p => p.id === petData?.pet_type);
  const stage = petType ? getPetStage(petType, Math.max(0, (petData?.level || 1) - 1)) : null;
  const pixels = stage?.pixels ?? petType?.stages[0]?.pixels;

  return (
    <>
      {/* Toggle */}
      <motion.button
        data-walking-pet
        whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
        onClick={() => { const n = !enabled; setEnabled(n); localStorage.setItem(STORAGE_KEY, String(n)); }}
        className="fixed bottom-24 left-4 z-40 glass-card rounded-2xl px-3 py-2 flex items-center gap-1.5 text-xs font-body text-muted-foreground hover:text-foreground transition-colors"
        style={{ userSelect: "none" }}
      >
        <span className="text-base">🐾</span>
        <span>{enabled ? "On" : "Off"}</span>
      </motion.button>

      {/* Pet */}
      {enabled && !hide && petData && pixels && (
        <div
          data-walking-pet
          className="fixed z-30 pointer-events-none select-none"
          style={{ left: view.x, top: view.y, willChange: "left, top" }}
        >
          {/* Angry bubble */}
          <AnimatePresence>
            {view.angry && (
              <motion.div
                key="bubble"
                initial={{ opacity: 0, scale: 0.7, y: 4 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.7 }}
                className="absolute -top-8 left-1/2 -translate-x-1/2 bg-white text-black text-[9px] font-bold rounded-full px-2 py-0.5 whitespace-nowrap"
                style={{ border: "1px solid #ccc", boxShadow: "0 2px 6px rgba(0,0,0,0.15)" }}
              >
                😤 Hey!
              </motion.div>
            )}
          </AnimatePresence>

          {/* Sprite */}
          <motion.div
            animate={
              view.angry
                ? { rotate: [-6, 6, -6] }
                : view.air
                  ? { scaleY: [1, 1.15, 1], scaleX: [1, 0.9, 1] }
                  : { y: [0, -2.5, 0] }
            }
            transition={
              view.angry
                ? { duration: 0.2, repeat: Infinity }
                : { duration: 0.45, repeat: Infinity, ease: "easeInOut" }
            }
          >
            <PixelMini pixels={pixels} size={S} flipX={view.flipX} />
          </motion.div>

          {/* Ground shadow */}
          {!view.air && (
            <div style={{
              width: PW * 0.55, height: 3, margin: "1px auto 0",
              background: "rgba(0,0,0,0.18)", borderRadius: 99, filter: "blur(2px)"
            }} />
          )}
        </div>
      )}
    </>
  );
}
