import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Heart, Sparkles, Star, Coins } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/client";
import { useTodos } from "@/hooks/useTodos";
import { Progress } from "@/components/ui/progress";
import {
  PET_TYPES,
  PET_ACTIONS,
  getPetStage,
  getOverallMood,
  calculateStatDecay,
  type PetStats,
  type PetType,
} from "@/lib/pet-data";

// XP / growth tuning
const XP_PER_COMPLETED_TODO = 10; // each newly-completed todo grants this XP
const COINS_PER_COMPLETED_TODO = 10; // spendable "XP balance" used for feeding/actions
const HUNGER_LOSS_PER_COMPLETED_TODO = 4;
const ENERGY_LOSS_PER_COMPLETED_TODO = 5;
const HAPPINESS_LOSS_PER_COMPLETED_TODO = 2;
const CLEANLINESS_LOSS_PER_COMPLETED_TODO = 1;

const XP_PER_GROWTH_DAY = 100; // at 100 XP: next "potential day"
const SIZE_SCALE_PER_DAY = 0.00012; // tiny but visible growth from day 0 -> day 1000

// Pixel pet renderer
function PixelPet({ pixels, size = 6, animate = false }: { pixels: string[][]; size?: number; animate?: boolean }) {
  return (
    <motion.div
      className="inline-grid gap-0"
      style={{ gridTemplateColumns: `repeat(${pixels[0]?.length || 8}, ${size}px)` }}
      animate={animate ? { y: [0, -8, 0] } : {}}
      transition={animate ? { duration: 2, repeat: Infinity, ease: "easeInOut" } : {}}
    >
      {pixels.flatMap((row, ri) =>
        row.map((color, ci) => (
          <div
            key={`${ri}-${ci}`}
            style={{
              width: size,
              height: size,
              backgroundColor: color === "transparent" ? "transparent" : color,
              borderRadius: size > 5 ? 1 : 0,
            }}
          />
        ))
      )}
    </motion.div>
  );
}

// Room / house background
function PetRoom({ children, mood }: { children: React.ReactNode; mood: string }) {
  const bgColor = mood === "Thriving!" ? "from-purple-900/40 to-indigo-900/40"
    : mood === "Happy" ? "from-blue-900/40 to-purple-900/40"
    : mood === "Okay" ? "from-gray-800/40 to-blue-900/40"
    : "from-gray-900/40 to-red-900/20";

  return (
    <div className={`relative rounded-2xl bg-gradient-to-b ${bgColor} border border-border/30 p-6 overflow-hidden min-h-[280px] flex flex-col items-center justify-center`}>
      {/* Floor */}
      <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-accent/20 to-transparent" />
      {/* Furniture decorations */}
      <div className="absolute bottom-4 left-4 text-2xl opacity-60">🪴</div>
      <div className="absolute bottom-4 right-4 text-2xl opacity-60">🛋️</div>
      <div className="absolute top-4 right-6 text-lg opacity-40">🖼️</div>
      <div className="absolute top-4 left-6 text-lg opacity-40">💡</div>
      {/* Stars if happy */}
      {mood === "Thriving!" && (
        <>
          <motion.div className="absolute top-8 left-1/4 text-xs" animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1.2, 0.8] }} transition={{ duration: 2, repeat: Infinity }}>✨</motion.div>
          <motion.div className="absolute top-12 right-1/3 text-xs" animate={{ opacity: [0.5, 1, 0.5] }} transition={{ duration: 3, repeat: Infinity }}>⭐</motion.div>
        </>
      )}
      {children}
    </div>
  );
}

// Stat bar component
function StatBar({ label, value, emoji, color }: { label: string; value: number; emoji: string; color: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-lg">{emoji}</span>
      <div className="flex-1">
        <div className="flex justify-between text-xs font-body mb-1">
          <span className="text-muted-foreground">{label}</span>
          <span className="text-foreground font-medium">{value}%</span>
        </div>
        <div className="h-2 rounded-full bg-secondary overflow-hidden">
          <motion.div
            className="h-full rounded-full"
            style={{ backgroundColor: color }}
            initial={{ width: 0 }}
            animate={{ width: `${value}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>
      </div>
    </div>
  );
}

export default function PetGardenPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { allTodos } = useTodos();
  const totalCompleted = allTodos.filter(t => t.completed).length;

  const [petData, setPetData] = useState<any>(null);
  const [selectedPetType, setSelectedPetType] = useState<string | null>(null);
  const [petName, setPetName] = useState("");
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);
  const [cooldowns, setCooldowns] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const prevCompletedRef = useRef<number | null>(null);

  // Fetch pet data
  const fetchPet = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from("virtual_pets")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();
    setPetData(data);
    setLoading(false);
  }, [user]);

  useEffect(() => { fetchPet(); }, [fetchPet]);

  // Award XP + spendable "XP balance" when the user completes new todos,
  // and also make the pet lose some stats because the user is doing work.
  useEffect(() => {
    if (!petData || !user) return;

    // Initialize reference on first load so we only process "newly completed" tasks.
    if (prevCompletedRef.current === null) {
      prevCompletedRef.current = totalCompleted;
      return;
    }

    const newlyCompleted = totalCompleted - prevCompletedRef.current;
    if (newlyCompleted <= 0) return;

    const nowIso = new Date().toISOString();

    const xpGain = newlyCompleted * XP_PER_COMPLETED_TODO;
    const coinsGain = newlyCompleted * COINS_PER_COMPLETED_TODO;

    const hunger = Math.max(0, (petData.hunger || 0) - newlyCompleted * HUNGER_LOSS_PER_COMPLETED_TODO);
    const energy = Math.max(0, (petData.energy || 0) - newlyCompleted * ENERGY_LOSS_PER_COMPLETED_TODO);
    const happiness = Math.max(0, (petData.happiness || 0) - newlyCompleted * HAPPINESS_LOSS_PER_COMPLETED_TODO);
    const cleanliness = Math.max(0, (petData.cleanliness || 0) - newlyCompleted * CLEANLINESS_LOSS_PER_COMPLETED_TODO);

    supabase
      .from("virtual_pets")
      .update({
        xp: (petData.xp || 0) + xpGain,
        coins: (petData.coins || 0) + coinsGain,
        hunger,
        energy,
        happiness,
        cleanliness,
        // Reset "last_*" times so we don't immediately double-decay from time.
        last_fed: nowIso,
        last_slept: nowIso,
        last_played: nowIso,
        last_cleaned: nowIso,
      })
      .eq("user_id", user.id)
      .then(() => fetchPet());

    prevCompletedRef.current = totalCompleted;
  }, [totalCompleted, petData, user, fetchPet]);

  // Grow the pet when it has filled all stats AND the XP is enough for the next "day".
  useEffect(() => {
    if (!petData || !user) return;
    const hunger = petData.hunger || 0;
    const happiness = petData.happiness || 0;
    const cleanliness = petData.cleanliness || 0;
    const energy = petData.energy || 0;

    const allStatsMaxed = hunger >= 100 && happiness >= 100 && cleanliness >= 100 && energy >= 100;
    if (!allStatsMaxed) return;

    // petData.level is stored as (achievedDays + 1). So achievedDays=0 => level=1.
    const achievedDays = Math.max(0, (petData.level || 1) - 1);
    const potentialDays = Math.floor((petData.xp || 0) / XP_PER_GROWTH_DAY);

    if (potentialDays > achievedDays) {
      supabase
        .from("virtual_pets")
        .update({ level: potentialDays + 1 })
        .eq("user_id", user.id)
        .then(() => fetchPet());
    }
  }, [petData?.hunger, petData?.happiness, petData?.cleanliness, petData?.energy, petData?.xp, petData?.level, user, fetchPet]);

  // Apply stat decay
  useEffect(() => {
    if (!petData || !user) return;
    const decays = {
      hunger: calculateStatDecay(petData.last_fed),
      happiness: calculateStatDecay(petData.last_played),
      cleanliness: calculateStatDecay(petData.last_cleaned),
      energy: calculateStatDecay(petData.last_slept),
    };
    const needsUpdate = Object.values(decays).some(d => d > 5);
    if (needsUpdate) {
      supabase.from("virtual_pets").update({
        hunger: Math.max(0, petData.hunger - decays.hunger),
        happiness: Math.max(0, petData.happiness - decays.happiness),
        cleanliness: Math.max(0, petData.cleanliness - decays.cleanliness),
        energy: Math.max(0, petData.energy - decays.energy),
      }).eq("user_id", user.id).then(() => fetchPet());
    }
  }, [petData?.id]);

  // Create pet
  const createPet = async () => {
    if (!user || !selectedPetType) return;
    await supabase.from("virtual_pets").insert({
      user_id: user.id,
      pet_type: selectedPetType,
      pet_name: petName || PET_TYPES.find(p => p.id === selectedPetType)!.name,
      // Start as "day 0 old": virtual_pets.level is stored as (achievedDays + 1)
      level: 1,
      // Spendable XP balance starts at 0; earning XP happens from completed todos.
      coins: 0,
      xp: 0,
    });
    fetchPet();
  };

  // Perform action
  const doAction = async (actionId: string) => {
    if (!petData || !user) return;
    const action = PET_ACTIONS.find(a => a.id === actionId);
    if (!action) return;
    if (petData.coins < action.cost) {
      setActionFeedback("Not enough XP! Complete more tasks 💜");
      setTimeout(() => setActionFeedback(null), 2000);
      return;
    }
    if (cooldowns[actionId] && Date.now() < cooldowns[actionId]) {
      setActionFeedback("Wait a bit... ⏳");
      setTimeout(() => setActionFeedback(null), 1500);
      return;
    }

    const newVal = Math.min(100, (petData[action.stat] || 0) + action.amount);

    const timeField = actionId === 'feed' ? 'last_fed'
      : actionId === 'clean' ? 'last_cleaned'
      : actionId === 'sleep' ? 'last_slept'
      : 'last_played';

    await supabase.from("virtual_pets").update({
      [action.stat]: newVal,
      coins: petData.coins - action.cost,
      [timeField]: new Date().toISOString(),
    }).eq("user_id", user.id);

    setCooldowns(prev => ({ ...prev, [actionId]: Date.now() + action.cooldownMs }));
    setActionFeedback(`${action.emoji} ${action.label}! +${action.amount} ${action.stat}`);
    setTimeout(() => setActionFeedback(null), 2000);
    fetchPet();
  };

  const currentPetType = PET_TYPES.find(p => p.id === petData?.pet_type);
  const achievedDays = petData ? Math.max(0, (petData.level || 1) - 1) : 0;
  const stats: PetStats | null = petData ? {
    hunger: petData.hunger, happiness: petData.happiness,
    cleanliness: petData.cleanliness, energy: petData.energy,
    xp: petData.xp, level: achievedDays, coins: petData.coins,
  } : null;
  const mood = stats ? getOverallMood(stats) : null;
  const stage = currentPetType && stats ? getPetStage(currentPetType, achievedDays) : null;
  const petScale = 1 + Math.min(0.25, achievedDays * SIZE_SCALE_PER_DAY);
  const pixelSize = Math.max(6, Math.round(8 * petScale));
  const xpIntoGrowthDay = (stats?.xp || 0) % XP_PER_GROWTH_DAY;
  const growthProgress = (xpIntoGrowthDay / XP_PER_GROWTH_DAY) * 100;

  if (loading) return <div className="min-h-screen bg-main-gradient flex items-center justify-center"><span className="text-2xl animate-pulse">🐾</span></div>;

  // Pet selection screen
  if (!petData) {
    return (
      <div className="min-h-screen bg-main-gradient px-4 pt-6 pb-28">
        <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-muted-foreground mb-6">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-8">
          <h1 className="text-3xl font-display font-semibold gradient-text mb-2">Choose Your Pet!</h1>
          <p className="text-sm font-body text-muted-foreground">Each BT21 character has a unique personality 💜</p>
        </motion.div>

        <div className="grid grid-cols-2 gap-3 max-w-md mx-auto mb-6">
          {PET_TYPES.map((pet) => (
            <motion.button
              key={pet.id}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setSelectedPetType(pet.id)}
              className={`glass-card rounded-2xl p-4 flex flex-col items-center gap-2 transition-all ${
                selectedPetType === pet.id ? "ring-2 ring-primary shadow-lg" : ""
              }`}
            >
              <PixelPet pixels={pet.stages[0].pixels} size={5} />
              <span className="font-display font-semibold text-sm text-foreground">{pet.name}</span>
              <span className="text-[10px] font-body text-muted-foreground">{pet.member} • {pet.personality}</span>
            </motion.button>
          ))}
        </div>

        {selectedPetType && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="max-w-md mx-auto">
            <input
              value={petName}
              onChange={e => setPetName(e.target.value)}
              placeholder="Name your pet..."
              className="w-full glass-card rounded-xl px-4 py-3 text-sm font-body text-foreground bg-transparent border-none outline-none placeholder:text-muted-foreground mb-3"
            />
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={createPet}
              className="w-full bg-primary text-primary-foreground rounded-xl py-3 font-display font-semibold text-sm"
            >
              Adopt {PET_TYPES.find(p => p.id === selectedPetType)?.name}! 💜
            </motion.button>
          </motion.div>
        )}
      </div>
    );
  }

  // Main pet view
  return (
    <div className="min-h-screen bg-main-gradient px-4 pt-6 pb-28">
      {/* Keep header aligned with the rest of the centered pet UI */}
      <div className="max-w-md mx-auto">
        <div className="flex items-center justify-between mb-4">
          <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-muted-foreground">
            <ArrowLeft className="w-4 h-4" /> Back
          </button>
          <div className="flex items-center gap-2 glass-card rounded-full px-3 py-1">
              <Sparkles className="w-3 h-3 text-yellow-400" />
              <span className="text-xs font-body font-semibold text-foreground">{stats?.coins || 0}</span>
          </div>
        </div>
      </div>

      {/* Pet name & level */}
      <div className="text-center mb-4">
        <h1 className="text-2xl font-display font-semibold text-foreground">{petData.pet_name}</h1>
        <div className="flex items-center justify-center gap-2 mt-1">
          <Star className="w-3 h-3 text-primary" />
          <span className="text-xs font-body text-muted-foreground">
            Day {achievedDays} • {stage?.name} • {currentPetType?.member}
          </span>
          <Star className="w-3 h-3 text-primary" />
        </div>
        {/* XP bar */}
        <div className="max-w-[200px] mx-auto mt-2">
          <Progress value={growthProgress} className="h-1.5" />
          <span className="text-[10px] font-body text-muted-foreground">
            {xpIntoGrowthDay}/{XP_PER_GROWTH_DAY} XP
          </span>
        </div>
      </div>

      {/* Pet Room */}
      <div className="max-w-md mx-auto mb-4">
        <PetRoom mood={mood?.label || "Okay"}>
          <div className="relative z-10 flex flex-col items-center">
            {stage && <PixelPet pixels={stage.pixels} size={pixelSize} animate />}
            {mood && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className={`mt-3 text-xs font-body font-medium ${mood.color}`}
              >
                {mood.emoji} {mood.label}
              </motion.div>
            )}
          </div>
        </PetRoom>
      </div>

      {/* Action feedback */}
      <AnimatePresence>
        {actionFeedback && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10 }}
            className="text-center mb-3"
          >
            <span className="glass-card rounded-full px-4 py-2 text-sm font-display font-semibold text-primary">
              {actionFeedback}
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Stats */}
      <div className="max-w-md mx-auto glass-card rounded-2xl p-4 mb-4 space-y-3">
        <StatBar label="Hunger" value={stats?.hunger || 0} emoji="🍜" color="hsl(25, 95%, 60%)" />
        <StatBar label="Happiness" value={stats?.happiness || 0} emoji="💜" color="hsl(270, 60%, 65%)" />
        <StatBar label="Cleanliness" value={stats?.cleanliness || 0} emoji="✨" color="hsl(200, 70%, 60%)" />
        <StatBar label="Energy" value={stats?.energy || 0} emoji="⚡" color="hsl(45, 90%, 55%)" />
      </div>

      {/* Actions */}
      <div className="max-w-md mx-auto grid grid-cols-3 gap-2">
        {PET_ACTIONS.map((action) => {
          const onCooldown = cooldowns[action.id] && Date.now() < cooldowns[action.id];
          return (
            <motion.button
              key={action.id}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => doAction(action.id)}
              disabled={!!onCooldown}
              className={`glass-card rounded-xl p-3 flex flex-col items-center gap-1 transition-all ${
                onCooldown ? "opacity-40" : "cursor-pointer"
              }`}
            >
              <span className="text-xl">{action.emoji}</span>
              <span className="text-xs font-body font-medium text-foreground">{action.label}</span>
              {action.cost > 0 && (
                <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                  <Coins className="w-2.5 h-2.5" /> {action.cost}
                </span>
              )}
            </motion.button>
          );
        })}
      </div>

      {/* Tip */}
      <p className="text-center text-[10px] font-body text-muted-foreground mt-4 max-w-md mx-auto">
        💡 Complete todos to earn XP. Fill all stats (100/100) to grow to the next day. Next stages hit around day 5 and day 10.
      </p>
    </div>
  );
}
