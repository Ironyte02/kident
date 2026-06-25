import { useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface FloatingItem {
  id: number;
  type: "tooth" | "toothbrush" | "bacteria" | "bubble" | "sparkle";
  x: number;
  y: number;
  size: number;
  rotation: number;
  duration: number;
  delay: number;
  morphing?: boolean; // bacteria → tooth transition
}

interface Particle {
  id: number;
  x: number;
  y: number;
  angle: number;
}

const TOOTH_SVG = (
  <path
    d="M12 2C8.5 2 6 4.5 6 7c0 2 .5 4 1.5 6 1.2 2.5 2 5 2.5 7 .3 1 1 2 2 2s1.7-1 2-2c.5-2 1.3-4.5 2.5-7C17.5 11 18 9 18 7c0-2.5-2.5-5-6-5z"
    fill="currentColor"
  />
);

const CLEAN_TOOTH_SVG = (
  <g>
    <path
      d="M12 2C8.5 2 6 4.5 6 7c0 2 .5 4 1.5 6 1.2 2.5 2 5 2.5 7 .3 1 1 2 2 2s1.7-1 2-2c.5-2 1.3-4.5 2.5-7C17.5 11 18 9 18 7c0-2.5-2.5-5-6-5z"
      fill="currentColor"
    />
    {/* Sparkle marks on clean tooth */}
    <path d="M8 5l-1-1.5L8 5l1.5-1z" fill="white" opacity="0.8" />
    <path d="M16 5l1-1.5L16 5l-1.5-1z" fill="white" opacity="0.8" />
    <circle cx="10" cy="8" r="0.8" fill="white" opacity="0.6" />
    <circle cx="14" cy="8" r="0.8" fill="white" opacity="0.6" />
  </g>
);

const TOOTHBRUSH_SVG = (
  <g fill="currentColor">
    <rect x="10" y="2" width="4" height="14" rx="2" />
    <rect x="8" y="16" width="8" height="3" rx="1.5" />
    <rect x="9" y="19" width="2" height="2" rx="0.5" />
    <rect x="13" y="19" width="2" height="2" rx="0.5" />
    <rect x="11" y="19" width="2" height="2" rx="0.5" />
  </g>
);

const BACTERIA_SVG = (
  <g fill="currentColor">
    <circle cx="12" cy="12" r="6" />
    <circle cx="10" cy="10" r="1" fill="white" />
    <circle cx="14" cy="10" r="1" fill="white" />
    <ellipse cx="12" cy="14" rx="2" ry="1" fill="white" />
    <line x1="6" y1="8" x2="4" y2="6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    <line x1="18" y1="8" x2="20" y2="6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    <line x1="8" y1="17" x2="6" y2="19" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    <line x1="16" y1="17" x2="18" y2="19" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </g>
);

const BUBBLE_SVG = (
  <g>
    <circle cx="12" cy="12" r="10" fill="currentColor" opacity="0.5" />
    <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeWidth="0.5" opacity="0.7" />
    <ellipse cx="9" cy="9" rx="3" ry="2" fill="white" opacity="0.5" />
  </g>
);

const SPARKLE_SVG = (
  <g fill="currentColor">
    <path d="M12 2l1.5 4.5L18 8l-4.5 1.5L12 14l-1.5-4.5L6 8l4.5-1.5z" />
    <path d="M12 14l1 3L16 18l-3 1-1 3-1-3-3-1 3-1z" opacity="0.6" />
  </g>
);

function generateItems(count: number): FloatingItem[] {
  const types: FloatingItem["type"][] = ["tooth", "toothbrush", "bacteria", "bubble", "sparkle"];
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    type: types[i % 5],
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: 28 + Math.random() * 28, // Bigger: 28-56px
    rotation: Math.random() * 360,
    duration: 12 + Math.random() * 18,
    delay: Math.random() * 4,
  }));
}

export default function AnimatedBackground() {
  const [items, setItems] = useState<FloatingItem[]>(() => generateItems(18));
  const [popped, setPopped] = useState<Set<number>>(new Set());
  const [tapped, setTapped] = useState<Set<number>>(new Set());
  const [morphing, setMorphing] = useState<Set<number>>(new Set());
  const [particles, setParticles] = useState<Particle[]>([]);
  const [dragging, setDragging] = useState<number | null>(null);
  const nextId = useRef(1000);

  const respawn = useCallback((id: number) => {
    setTimeout(() => {
      setItems((prev) =>
        prev.map((it) =>
          it.id === id
            ? {
                ...it,
                id: nextId.current++,
                type: "bacteria" as const,
                x: Math.random() * 100,
                y: Math.random() * 100,
                size: 28 + Math.random() * 28,
                morphing: false,
              }
            : it
        )
      );
      setPopped((prev) => { const n = new Set(prev); n.delete(id); return n; });
      setTapped((prev) => { const n = new Set(prev); n.delete(id); return n; });
      setMorphing((prev) => { const n = new Set(prev); n.delete(id); return n; });
    }, 1800);
  }, []);

  const spawnParticles = useCallback((x: number, y: number, count = 8) => {
    const newParticles = Array.from({ length: count }, (_, i) => ({
      id: nextId.current++,
      x,
      y,
      angle: (360 / count) * i + Math.random() * 20,
    }));
    setParticles((p) => [...p, ...newParticles]);
    setTimeout(() => {
      setParticles((p) => p.filter((pp) => !newParticles.find((np) => np.id === pp.id)));
    }, 700);
  }, []);

  const handleInteract = useCallback(
    (item: FloatingItem, e: React.MouseEvent | React.TouchEvent) => {
      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
      const px = rect.left + rect.width / 2;
      const py = rect.top + rect.height / 2;

      if (item.type === "bacteria") {
        // Bacteria → clean tooth morph
        setMorphing((prev) => new Set(prev).add(item.id));
        spawnParticles(px, py, 10);
        respawn(item.id);
      } else if (item.type === "bubble") {
        setPopped((prev) => new Set(prev).add(item.id));
        spawnParticles(px, py, 6);
        respawn(item.id);
      } else {
        setTapped((prev) => new Set(prev).add(item.id));
        if (item.type === "tooth") spawnParticles(px, py, 6);
        setTimeout(() => setTapped((prev) => { const n = new Set(prev); n.delete(item.id); return n; }), 800);
      }

      if (navigator.vibrate) navigator.vibrate(15);
    },
    [spawnParticles, respawn]
  );

  const getColor = (type: FloatingItem["type"], isMorphing: boolean) => {
    if (isMorphing) return "text-primary/30";
    switch (type) {
      case "tooth": return "text-primary/20";
      case "toothbrush": return "text-secondary/20";
      case "bacteria": return "text-destructive/25";
      case "bubble": return "text-primary/18";
      case "sparkle": return "text-accent/20";
    }
  };

  const getSvg = (type: FloatingItem["type"], isMorphing: boolean) => {
    if (isMorphing) return CLEAN_TOOTH_SVG;
    switch (type) {
      case "tooth": return TOOTH_SVG;
      case "toothbrush": return TOOTHBRUSH_SVG;
      case "bacteria": return BACTERIA_SVG;
      case "bubble": return BUBBLE_SVG;
      case "sparkle": return SPARKLE_SVG;
    }
  };

  const getTapAnimation = (item: FloatingItem) => {
    if (morphing.has(item.id)) {
      return {
        scale: [1, 1.6, 1.3],
        rotate: [item.rotation, item.rotation + 360],
        opacity: [1, 1, 0],
        filter: "drop-shadow(0 0 12px hsl(var(--primary) / 0.6))",
      };
    }
    if (popped.has(item.id)) {
      return { opacity: 0, scale: 2.5, rotate: item.rotation + 180 };
    }
    if (tapped.has(item.id)) {
      switch (item.type) {
        case "tooth":
          return { scale: [1, 1.5, 1], rotate: item.rotation, filter: "drop-shadow(0 0 10px hsl(var(--primary) / 0.5))" };
        case "toothbrush":
          return { rotate: [item.rotation, item.rotation + 45, item.rotation - 45, item.rotation + 30, item.rotation], scale: 1.3 };
        case "sparkle":
          return { scale: [1, 2, 0.8, 1.3], opacity: [1, 1, 0.6, 1] };
        default:
          return { scale: 1 };
      }
    }
    return {
      opacity: 1,
      scale: 1,
      rotate: [item.rotation, item.rotation + 15, item.rotation - 15, item.rotation],
      y: [0, -25, 0, 25, 0],
      x: [0, 10, 0, -10, 0],
    };
  };

  const getTransition = (item: FloatingItem) => {
    if (morphing.has(item.id)) return { duration: 1.2, ease: "easeInOut" as const };
    if (popped.has(item.id)) return { duration: 0.5 };
    if (tapped.has(item.id)) return { duration: 0.6, ease: "easeInOut" as const };
    return {
      rotate: { duration: item.duration, repeat: Infinity, ease: "easeInOut" as const },
      y: { duration: item.duration * 0.5, repeat: Infinity, ease: "easeInOut" as const, delay: item.delay },
      x: { duration: item.duration * 0.7, repeat: Infinity, ease: "easeInOut" as const, delay: item.delay + 1 },
      opacity: { duration: 0.8, delay: item.delay },
    };
  };

  const isDraggable = (type: FloatingItem["type"]) =>
    type === "tooth" || type === "toothbrush" || type === "bubble";

  return (
    <div className="fixed inset-0 overflow-hidden z-[1] transition-colors duration-500" style={{ pointerEvents: 'none' }} aria-hidden="true">
      {/* Particles */}
      <AnimatePresence>
        {particles.map((p) => {
          const rad = (p.angle * Math.PI) / 180;
          return (
            <motion.div
              key={p.id}
              className="absolute w-2.5 h-2.5 rounded-full bg-accent/70 pointer-events-none"
              style={{ left: p.x, top: p.y }}
              initial={{ opacity: 1, scale: 1, x: 0, y: 0 }}
              animate={{
                opacity: 0,
                scale: 0.2,
                x: Math.cos(rad) * 50,
                y: Math.sin(rad) * 50,
              }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
            />
          );
        })}
      </AnimatePresence>

      {/* Items */}
      <AnimatePresence>
        {items.map((item) => {
          const isMorphing = morphing.has(item.id);
          return (
            <motion.div
              key={item.id}
              className={`absolute ${getColor(item.type, isMorphing)} pointer-events-auto cursor-pointer select-none`}
              style={{ left: `${item.x}%`, top: `${item.y}%`, width: item.size, height: item.size }}
              initial={{ opacity: 0, scale: 0.5, rotate: item.rotation }}
              animate={getTapAnimation(item)}
              transition={getTransition(item)}
              onClick={(e) => handleInteract(item, e)}
              whileHover={{ scale: 1.3, filter: "drop-shadow(0 0 8px hsl(var(--primary) / 0.4))" }}
              whileTap={{ scale: 0.9 }}
              drag={isDraggable(item.type)}
              dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
              dragElastic={0.8}
              dragMomentum
              onDragStart={() => setDragging(item.id)}
              onDragEnd={() => setDragging(null)}
            >
              <svg viewBox="0 0 24 24" className="w-full h-full">
                {getSvg(item.type, isMorphing)}
              </svg>
              {/* Sparkle trail on toothbrush tap */}
              {tapped.has(item.id) && item.type === "toothbrush" && (
                <motion.div
                  className="absolute -top-1 -right-1 w-4 h-4"
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: [0, 1, 0], scale: [0, 1.5, 0], rotate: [0, 180] }}
                  transition={{ duration: 0.6 }}
                >
                  <svg viewBox="0 0 24 24" className="w-full h-full text-accent">
                    {SPARKLE_SVG}
                  </svg>
                </motion.div>
              )}
              {/* Glow ring on morphing bacteria */}
              {isMorphing && (
                <motion.div
                  className="absolute inset-0 rounded-full border-2 border-primary/40"
                  initial={{ scale: 1, opacity: 1 }}
                  animate={{ scale: 2.5, opacity: 0 }}
                  transition={{ duration: 1 }}
                />
              )}
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
