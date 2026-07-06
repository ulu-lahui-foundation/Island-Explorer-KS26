import { useGame } from "@/lib/GameContext";
import { Book, Star, Settings } from "lucide-react";
import { motion } from "framer-motion";

const CARD_BG  = '#2A6042';
const ACCENT   = '#5CC882';

export function PikoPage() {
  const { setCurrentView } = useGame();

  const container = {
    hidden: { opacity: 0 },
    show:  { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const item = {
    hidden: { opacity: 0, y: 50 },
    show:   { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 300, damping: 24 } }
  };

  return (
    <div className="w-full h-full p-4 pb-24 flex flex-col gap-4"
      style={{ background: '#245238' }}>

      <div className="pt-8 pb-4 px-2">
        <h1 className="text-4xl font-extrabold text-white tracking-tight">Piko</h1>
        <p className="font-semibold mt-1" style={{ color: 'rgba(255,255,255,0.45)' }}>
          Your hub for knowledge and progress.
        </p>
      </div>

      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="flex-1 flex flex-col gap-4"
      >
        {/* Plant Index */}
        <motion.button
          variants={item}
          onClick={() => setCurrentView('plant_index')}
          className="flex-1 rounded-[2rem] active:scale-[0.98] transition-transform p-8 flex flex-col justify-end relative overflow-hidden group"
          style={{
            background: CARD_BG,
            border: '2px solid rgba(255,255,255,0.10)',
            boxShadow: '0 6px 18px rgba(0,0,0,0.30)',
          }}
        >
          <Book className="absolute top-8 right-8 w-24 h-24 text-white/15 group-hover:rotate-12 transition-transform duration-500" />
          <div className="text-left text-white z-10">
            <h2 className="text-3xl font-bold mb-1">Plant Index</h2>
            <p className="font-medium text-base" style={{ color: 'rgba(255,255,255,0.65)' }}>View your collection</p>
          </div>
        </motion.button>

        {/* Tasks */}
        <motion.button
          variants={item}
          onClick={() => setCurrentView('tasks')}
          className="flex-1 rounded-[2rem] active:scale-[0.98] transition-transform p-8 flex flex-col justify-end relative overflow-hidden group"
          style={{
            background: CARD_BG,
            border: '2px solid rgba(255,255,255,0.10)',
            boxShadow: '0 6px 18px rgba(0,0,0,0.30)',
          }}
        >
          <Star className="absolute top-8 right-8 w-24 h-24 text-white/15 group-hover:rotate-12 transition-transform duration-500" />
          <div className="text-left text-white z-10">
            <h2 className="text-3xl font-bold mb-1">Tasks</h2>
            <p className="font-medium text-base" style={{ color: 'rgba(255,255,255,0.65)' }}>Track your progress</p>
          </div>
        </motion.button>

        {/* Settings */}
        <motion.button
          variants={item}
          onClick={() => setCurrentView('settings')}
          className="flex-1 rounded-[2rem] active:scale-[0.98] transition-transform p-8 flex flex-col justify-end relative overflow-hidden group"
          style={{
            background: CARD_BG,
            border: '2px solid rgba(255,255,255,0.10)',
            boxShadow: '0 6px 18px rgba(0,0,0,0.30)',
          }}
        >
          <Settings className="absolute top-8 right-8 w-24 h-24 text-white/15 group-hover:rotate-12 transition-transform duration-500" />
          <div className="text-left text-white z-10">
            <h2 className="text-3xl font-bold mb-1">Settings</h2>
            <p className="font-medium text-base" style={{ color: 'rgba(255,255,255,0.65)' }}>App options</p>
          </div>
        </motion.button>
      </motion.div>
    </div>
  );
}
