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
const JUMP = -11;
const SPEED = 1.8;
const ANGRY_R = 90;

// Scan visible glass-card elements as platforms (viewport coords)
function scanPlatforms() {
  const out = [];
  document.querySelectorAll(".glass-card, .glass-nav").forEach(el => {
    const r = el.getBoundingClientRect();
    // Only include if top edge is visible on screen
    if (r.width > 40 && r.height > 24 && r.top > -4 && r.top < window.innerHeight - 10) {
      out.push({ x: r.left, y: r.top, w: r.width, h: r.height });
    }
  });
  // Screen floor
  out.push({ x: 0, y: window.innerHeight - 4, w: window.innerWidth, h: 4 });
  return out;
}

// Find the nearest platform surface below the pet's feet
function groundBelow(px, py, plats) {
  const cx = px + PW / 2;
  const feet = py + PH;
  let best = null;
  for (const p of plats) {
    if (cx >= p.x + 4 && cx <= p.x + p.w - 4) {
      if (p.y >= feet - 6) { // platform top is at or below feet
        if (best === null || p.y < best) best = p.y;
      }
    }
  }
  return best;
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
  const plats = useRef([]);
  const cursor = useRef({ x: -999, y: -999 });
  const raf = useRef(null);
  const jumpCd = useRef(0);
  const angryTimer = useRef(null);
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
    window.addEventListener("mousemove", mc);
    window.addEventListener("touchmove", mt, { passive: true });
    return () => { window.removeEventListener("mousemove", mc); window.removeEventListener("touchmove", mt); };
  }, []);

  // Rescan platforms on scroll, resize, route change
  const rescan = useCallback(() => { plats.current = scanPlatforms(); }, []);

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
      clearTimeout(angryTimer.current);
    } else if (d >= ANGRY_R && angry.current) {
      clearTimeout(angryTimer.current);
      angryTimer.current = setTimeout(() => { angry.current = false; }, 800);
    }

    if (!angry.current) {
      // Gravity
      dvy += GRAV;
      y += dvy;
      x += dvx;

      // Platform collision
      const gy = groundBelow(x, y, plats.current);
      if (gy !== null && y + PH >= gy && dvy >= 0) {
        y = gy - PH;
        dvy = 0;
        g = true;
      } else {
        g = false;
      }

      // Screen bounds
      if (x < 0) { x = 0; dvx = Math.abs(dvx); }
      if (x + PW > W) { x = W - PW; dvx = -Math.abs(dvx); }
      if (y + PH > H) { y = H - PH; dvy = 0; g = true; }
      if (y < 0) { y = 0; dvy = Math.abs(dvy) * 0.3; }

      // Jump logic
      jumpCd.current = Math.max(0, jumpCd.current - 1);
      if (g && jumpCd.current === 0) {
        const cx = x + PW / 2;
        // Current platform
        const cur = plats.current.find(p =>
          cx >= p.x + 4 && cx <= p.x + p.w - 4 && Math.abs((y + PH) - p.y) < 8
        );
        // Will pet walk off edge in next ~20 frames?
        const nextCx = cx + dvx * 20;
        const fallOff = cur && (nextCx < cur.x + 4 || nextCx > cur.x + cur.w - 4);
        // Is there a higher platform nearby to jump to?
        const higher = plats.current.find(p =>
          p.y < y + PH - 15 &&
          Math.abs((p.x + p.w / 2) - cx) < 150
        );
        if (fallOff || higher || Math.random() < 0.004) {
          dvy = JUMP;
          g = false;
          jumpCd.current = 50;
        }
      }
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

  const hide = ["/pet", "/auth"].includes(loc.pathname);
  const petType = PET_TYPES.find(p => p.id === petData?.pet_type);
  const stage = petType ? getPetStage(petType, Math.max(0, (petData?.level || 1) - 1)) : null;
  const pixels = stage?.pixels ?? petType?.stages[0]?.pixels;

  return (
    <>
      {/* Toggle */}
      <motion.button
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
