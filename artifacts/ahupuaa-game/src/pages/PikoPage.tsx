import { useGame } from "@/lib/GameContext";
import { Book, Star, Settings } from "lucide-react";
import { motion } from "framer-motion";

export function PikoPage() {
  const { setCurrentView } = useGame();

  const container = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const item = {
    hidden: { opacity: 0, y: 50 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
  };

  return (
    <div className="w-full h-full bg-[#F6F1E7] p-4 pb-24 flex flex-col gap-4">
      <div className="pt-8 pb-4 px-2">
        <h1 className="text-4xl font-bold text-[#26342F] tracking-tight">Piko</h1>
        <p className="text-[#26342F]/55 font-medium mt-1">Your hub for knowledge and progress.</p>
      </div>

      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="flex-1 flex flex-col gap-4"
      >
        {/* Plant Index — deep forest green */}
        <motion.button
          variants={item}
          onClick={() => setCurrentView('plant_index')}
          className="flex-1 rounded-[2rem] shadow-md active:scale-[0.98] transition-transform p-8 flex flex-col justify-end relative overflow-hidden group"
          style={{ background: 'linear-gradient(135deg, #2F6F4E 0%, #1d4a35 100%)' }}
        >
          <Book className="absolute top-8 right-8 w-24 h-24 text-white/15 group-hover:rotate-12 transition-transform duration-500" />
          <div className="text-left text-[#F6F1E7] z-10">
            <h2 className="text-3xl font-bold mb-1">Plant Index</h2>
            <p className="text-[#F6F1E7]/70 font-medium text-base">View your collection</p>
          </div>
        </motion.button>

        {/* Tasks — bright leaf green */}
        <motion.button
          variants={item}
          onClick={() => setCurrentView('tasks')}
          className="flex-1 rounded-[2rem] shadow-md active:scale-[0.98] transition-transform p-8 flex flex-col justify-end relative overflow-hidden group"
          style={{ background: 'linear-gradient(135deg, #7BC96F 0%, #5aad54 100%)' }}
        >
          <Star className="absolute top-8 right-8 w-24 h-24 text-white/20 group-hover:rotate-12 transition-transform duration-500" />
          <div className="text-left z-10">
            <h2 className="text-3xl font-bold mb-1 text-[#26342F]">Tasks</h2>
            <p className="text-[#26342F]/60 font-medium text-base">Track your progress</p>
          </div>
        </motion.button>

        {/* Settings — dark forest */}
        <motion.button
          variants={item}
          onClick={() => setCurrentView('settings')}
          className="flex-1 rounded-[2rem] shadow-md active:scale-[0.98] transition-transform p-8 flex flex-col justify-end relative overflow-hidden group"
          style={{ background: 'linear-gradient(135deg, #26342F 0%, #3a4f46 100%)' }}
        >
          <Settings className="absolute top-8 right-8 w-24 h-24 text-white/15 group-hover:rotate-12 transition-transform duration-500" />
          <div className="text-left text-[#F6F1E7] z-10">
            <h2 className="text-3xl font-bold mb-1">Settings</h2>
            <p className="text-[#F6F1E7]/60 font-medium text-base">App options</p>
          </div>
        </motion.button>
      </motion.div>
    </div>
  );
}
