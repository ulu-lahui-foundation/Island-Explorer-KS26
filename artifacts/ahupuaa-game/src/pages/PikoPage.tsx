import { useGame } from "@/lib/GameContext";
import { useTheme } from "@/lib/ThemeContext";
import { Book, Star, Settings } from "lucide-react";
import { motion } from "framer-motion";

export function PikoPage() {
  const { setCurrentView } = useGame();
  const { darkMode } = useTheme();

  const pageBg   = darkMode ? '#245238' : '#F6F1E7';
  const cardBg   = darkMode ? '#2A6042' : '#ffffff';
  const cardBorder = darkMode ? 'rgba(255,255,255,0.10)' : 'rgba(47,111,78,0.12)';
  const cardShadow = darkMode ? '0 6px 18px rgba(0,0,0,0.30)' : '0 6px 18px rgba(38,52,47,0.10)';
  const titleCol = darkMode ? '#ffffff' : '#26342F';
  const subCol   = darkMode ? 'rgba(255,255,255,0.45)' : 'rgba(38,52,47,0.55)';
  const labelCol = darkMode ? 'rgba(255,255,255,0.65)' : 'rgba(38,52,47,0.60)';
  const iconCol  = darkMode ? 'text-white/15' : 'text-[#2F6F4E]/10';

  const container = {
    hidden: { opacity: 0 },
    show:  { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const item = {
    hidden: { opacity: 0, y: 50 },
    show:   { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 300, damping: 24 } }
  };

  return (
    <div className="w-full h-full p-4 pb-24 flex flex-col gap-4" style={{ background: pageBg }}>

      <div className="pt-8 pb-4 px-2">
        <h1 className="text-4xl font-extrabold tracking-tight" style={{ color: titleCol }}>Piko</h1>
        <p className="font-semibold mt-1" style={{ color: subCol }}>
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
          className={`flex-1 rounded-[2rem] active:scale-[0.98] transition-transform p-8 flex flex-col justify-end relative overflow-hidden group ${iconCol}`}
          style={{ background: cardBg, border: `2px solid ${cardBorder}`, boxShadow: cardShadow }}
        >
          <Book className="absolute top-8 right-8 w-24 h-24 group-hover:rotate-12 transition-transform duration-500" />
          <div className="text-left z-10" style={{ color: titleCol }}>
            <h2 className="text-3xl font-bold mb-1">Plant Index</h2>
            <p className="font-medium text-base" style={{ color: labelCol }}>View your collection</p>
          </div>
        </motion.button>

        {/* Tasks */}
        <motion.button
          variants={item}
          onClick={() => setCurrentView('tasks')}
          className={`flex-1 rounded-[2rem] active:scale-[0.98] transition-transform p-8 flex flex-col justify-end relative overflow-hidden group ${iconCol}`}
          style={{ background: cardBg, border: `2px solid ${cardBorder}`, boxShadow: cardShadow }}
        >
          <Star className="absolute top-8 right-8 w-24 h-24 group-hover:rotate-12 transition-transform duration-500" />
          <div className="text-left z-10" style={{ color: titleCol }}>
            <h2 className="text-3xl font-bold mb-1">Tasks</h2>
            <p className="font-medium text-base" style={{ color: labelCol }}>Track your progress</p>
          </div>
        </motion.button>

        {/* Settings */}
        <motion.button
          variants={item}
          onClick={() => setCurrentView('settings')}
          className={`flex-1 rounded-[2rem] active:scale-[0.98] transition-transform p-8 flex flex-col justify-end relative overflow-hidden group ${iconCol}`}
          style={{ background: cardBg, border: `2px solid ${cardBorder}`, boxShadow: cardShadow }}
        >
          <Settings className="absolute top-8 right-8 w-24 h-24 group-hover:rotate-12 transition-transform duration-500" />
          <div className="text-left z-10" style={{ color: titleCol }}>
            <h2 className="text-3xl font-bold mb-1">Settings</h2>
            <p className="font-medium text-base" style={{ color: labelCol }}>App options</p>
          </div>
        </motion.button>
      </motion.div>
    </div>
  );
}
