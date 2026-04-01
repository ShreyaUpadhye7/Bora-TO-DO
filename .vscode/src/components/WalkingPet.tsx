import { useEffect, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/client";
import { PET_TYPES, getPetStage } from "@/lib/pet-data";
import { useLocation } from "react-router-dom";

const STORAGE_KEY = "walking-pet-enabled";
const PET_SIZE = 5;
const PET_W = 8 * PET_SIZE;
const PET_H = 8 * PET_SIZE;
const GRAVITY = 0.55;
const JUMP_FORCE = -10;
const WALK_SPEED = 1.6;
const CURSOR_ANGRY_DIST = 85;

function getPlatforms() {
  const out = [];
  document.querySelectorAll(".glass-card, .glass-nav").forEach(el => {
    const r = el.getBoundingClientRect();
    if (r.width > 30 && r.height > 20 && r.top > 0 && r.top < window.innerHeight)
      out.push({ x: r.left, y: r.top, w: r.width });
  });
  out.push({ x: 0, y: window.innerHeight - 8, w: window.innerWidth });
  return out;
}

function getGroundBelow(px, py, platforms) {
  const cx = px + PET_W / 2;
  let best = null;
  for (const p of platforms)
    if (cx >= p.x && cx <= p.x + p.w && p.y >= py + PET_H - 4)
      if (best === null || p.y < best) best = p.y;
  return best;
}

function PixelPetMini({ pixels, size = 5, flipX = false }) {
  return (
    <div style={{ display: "inline-grid", gap: 0, gridTemplateColumns: `repeat(${pixels[0]?.length || 8}, ${size}px)`, transform: flipX ? "scaleX(-1)" : "none" }}>
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
  const [petData, setPetData] = useState(null);
  const [rs, setRs] = useState({ x: 100, y: 400, flipX: false, angry: false, jumping: false });
  const xRef = useRef(100); const yRef = useRef(400);
  const vxRef = useRef(WALK_SPEED); const vyRef = useRef(0);
  const onGroundRef = useRef(false);
  const angryRef = useRef(false);
  const platformsRef = useRef([]);
  const cursorRef = useRef({ x: -9999, y: -9999 });
  const rafRef = useRef();
  const jumpCdRef = useRef(0);
  const angryTimerRef = useRef();

  useEffect(() => {
    if (!user) return;
    supabase.from("virtual_pets").select("*").eq("user_id", user.id).maybeSingle().then(({ data }) => setPetData(data));
  }, [user]);

  useEffect(() => {
    const h = (e) => { cursorRef.current = { x: e.clientX, y: e.clientY }; };
    window.addEventListener("mousemove", h);
    return () => window.removeEventListener("mousemove", h);
  }, []);

  useEffect(() => {
    if (!enabled) return;
    platformsRef.current = getPlatforms();
    const id = setInterval(() => { platformsRef.current = getPlatforms(); }, 800);
    return () => clearInterval(id);
  }, [enabled, location.pathname]);

  const tick = useCallback(() => {
    const W = window.innerWidth; const H = window.innerHeight;
    let x = xRef.current; let y = yRef.current;
    let vx = vxRef.current; let vy = vyRef.current;
    let onGround = onGroundRef.current;
    const platforms = platformsRef.current;
    const dist = Math.hypot(cursorRef.current.x - (x + PET_W / 2), cursorRef.current.y - (y + PET_H / 2));
    if (dist < CURSOR_ANGRY_DIST && !angryRef.current) {
      angryRef.current = true;
      if (angryTimerRef.current) clearTimeout(angryTimerRef.current);
    } else if (dist >= CURSOR_ANGRY_DIST && angryRef.current) {
      if (angryTimerRef.current) clearTimeout(angryTimerRef.current);
      angryTimerRef.current = setTimeout(() => { angryRef.current = false; }, 700);
    }
    if (!angryRef.current) {
      vy += GRAVITY; y += vy; x += vx;
      const groundY = getGroundBelow(x, y, platforms);
      if (groundY !== null && y + PET_H >= groundY && vy >= 0) { y = groundY - PET_H; vy = 0; onGround = true; }
      else { onGround = false; }
      if (x < 0) { x = 0; vx = Math.abs(vx); }
      if (x + PET_W > W) { x = W - PET_W; vx = -Math.abs(vx); }
      if (y + PET_H > H) { y = H - PET_H; vy = 0; onGround = true; }
      if (y < 0) { y = 0; vy = Math.abs(vy) * 0.4; }
      jumpCdRef.current = Math.max(0, jumpCdRef.current - 1);
      if (onGround && jumpCdRef.current === 0) {
        const cx = x + PET_W / 2;
        const curPlat = platforms.find(p => cx >= p.x && cx <= p.x + p.w && Math.abs((y + PET_H) - p.y) < 8);
        const nextCx = cx + vx * 18;
        const willFall = curPlat && (nextCx < curPlat.x || nextCx > curPlat.x + curPlat.w);
        const higherNearby = platforms.find(p => p.y < y + PET_H - 20 && Math.abs((p.x + p.w / 2) - cx) < 130);
        if (willFall || higherNearby || Math.random() < 0.003) { vy = JUMP_FORCE; onGround = false; jumpCdRef.current = 45; }
      }
    }
    xRef.current = x; yRef.current = y; vxRef.current = vx; vyRef.current = vy; onGroundRef.current = onGround;
    setRs({ x, y, flipX: vx < 0, angry: angryRef.current, jumping: !onGround });
    rafRef.current = requestAnimationFrame(tick);
  }, []);

  useEffect(() => {
    if (!enabled || !petData) return;
    xRef.current = window.innerWidth / 2;
    yRef.current = window.innerHeight - 100;
    rafRef.current = requestAnimationFrame(tick);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [enabled, petData, tick]);

  const hide = ["/pet", "/auth"].includes(location.pathname);
  const petType = PET_TYPES.find(p => p.id === petData?.pet_type);
  const stage = petType ? getPetStage(petType, Math.max(0, (petData?.level || 1) - 1)) : null;
  const pixels = stage?.pixels ?? petType?.stages[0]?.pixels;

  return (
    <>
      <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
        onClick={() => { const n = !enabled; setEnabled(n); localStorage.setItem(STORAGE_KEY, String(n)); }}
        className="fixed bottom-24 left-4 z-40 glass-card rounded-2xl px-3 py-2 flex items-center gap-1.5 text-xs font-body text-muted-foreground hover:text-foreground transition-colors">
        <span className="text-base">🐾</span><span>{enabled ? "On" : "Off"}</span>
      </motion.button>
      <AnimatePresence>
        {enabled && !hide && petData && pixels && (
          <div className="fixed z-30 pointer-events-none select-none" style={{ left: rs.x, top: rs.y }}>
            <AnimatePresence>
              {rs.angry && (
                <motion.div initial={{ opacity: 0, y: 4, scale: 0.8 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }}
                  className="absolute -top-7 left-1/2 -translate-x-1/2 bg-white text-black text-[9px] font-bold rounded-full px-2 py-0.5 whitespace-nowrap shadow"
                  style={{ border: "1px solid #ddd" }}>
                  😤 Hey!
                </motion.div>
              )}
            </AnimatePresence>
            <motion.div
              animate={rs.angry ? { rotate: [-5, 5, -5] } : rs.jumping ? { scaleY: [1, 1.2, 1] } : { y: [0, -2, 0] }}
              transition={rs.angry ? { duration: 0.25, repeat: Infinity } : { duration: 0.5, repeat: Infinity, ease: "easeInOut" }}>
              <PixelPetMini pixels={pixels} size={PET_SIZE} flipX={rs.flipX} />
            </motion.div>
            <div className="rounded-full bg-black/15 mx-auto" style={{ width: PET_W * 0.6, height: 3, filter: "blur(2px)", marginTop: 1 }} />
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
