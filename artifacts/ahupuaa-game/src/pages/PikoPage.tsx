import { useGame } from "@/lib/GameContext";
import { Book, Star, Settings } from "lucide-react";
import { motion } from "framer-motion";

export function PikoPage() {
  const { setCurrentView } = useGame();

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 50 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
  };

  return (
    <div className="w-full h-full bg-amber-50 p-4 pb-24 flex flex-col gap-4">
      <div className="pt-8 pb-4 px-2">
        <h1 className="text-4xl font-bold text-gray-900 tracking-tight">Piko</h1>
        <p className="text-gray-500 font-medium mt-1">Your hub for knowledge and progress.</p>
      </div>

      <motion.div 
        variants={container}
        initial="hidden"
        animate="show"
        className="flex-1 flex flex-col gap-4"
      >
        <motion.button 
          variants={item}
          onClick={() => setCurrentView('plant_index')}
          className="flex-1 rounded-[2rem] bg-gradient-to-br from-emerald-500 to-teal-600 shadow-lg shadow-teal-900/20 p-8 flex flex-col justify-end relative overflow-hidden group active:scale-[0.98] transition-transform"
        >
          <Book className="absolute top-8 right-8 w-24 h-24 text-white/20 transform group-hover:rotate-12 transition-transform duration-500" />
          <div className="text-left text-white z-10">
            <h2 className="text-3xl font-bold mb-2">Plant Index</h2>
            <p className="text-white/80 font-medium text-lg">View your collection</p>
          </div>
        </motion.button>

        <motion.button 
          variants={item}
          onClick={() => setCurrentView('tasks')}
          className="flex-1 rounded-[2rem] bg-gradient-to-br from-amber-400 to-orange-500 shadow-lg shadow-orange-900/20 p-8 flex flex-col justify-end relative overflow-hidden group active:scale-[0.98] transition-transform"
        >
          <Star className="absolute top-8 right-8 w-24 h-24 text-white/20 transform group-hover:rotate-12 transition-transform duration-500" />
          <div className="text-left text-white z-10">
            <h2 className="text-3xl font-bold mb-2">Tasks</h2>
            <p className="text-white/80 font-medium text-lg">Track your progress</p>
          </div>
        </motion.button>

        <motion.button 
          variants={item}
          onClick={() => setCurrentView('settings')}
          className="flex-1 rounded-[2rem] bg-gradient-to-br from-rose-500 to-purple-600 shadow-lg shadow-purple-900/20 p-8 flex flex-col justify-end relative overflow-hidden group active:scale-[0.98] transition-transform"
        >
          <Settings className="absolute top-8 right-8 w-24 h-24 text-white/20 transform group-hover:rotate-12 transition-transform duration-500" />
          <div className="text-left text-white z-10">
            <h2 className="text-3xl font-bold mb-2">Settings</h2>
            <p className="text-white/80 font-medium text-lg">App options</p>
          </div>
        </motion.button>
      </motion.div>
    </div>
  );
}
