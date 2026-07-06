import { useGame } from "@/lib/GameContext";
import { t, useLang } from "@/lib/i18n";
import { Book, Star, Settings } from "lucide-react";
import { motion } from "framer-motion";

const CARD_BG  = '#2A6042';
const ACCENT   = '#5CC882';

export function PikoPage() {
  const { setCurrentView } = useGame();
  useLang(); // re-render on language change

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
        <h1 className="text-4xl font-extrabold text-white tracking-tight">{t('piko_title')}</h1>
        <p className="font-semibold mt-1" style={{ color: 'rgba(255,255,255,0.45)' }}>
          {t('piko_subtitle')}
        </p>
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
          className="flex-1 rounded-[2rem] active:scale-[0.98] transition-transform p-8 flex flex-col justify-end relative overflow-hidden group"
          style={{
            background: CARD_BG,
            border: '2px solid rgba(255,255,255,0.10)',
            boxShadow: '0 6px 18px rgba(0,0,0,0.30)',
          }}
        >
          <Book className="absolute top-8 right-8 w-24 h-24 text-white/15 group-hover:rotate-12 transition-transform duration-500" />
          <div className="text-left text-white z-10">
            <h2 className="text-3xl font-bold mb-1">{t('plant_index')}</h2>
            <p className="font-medium text-base" style={{ color: 'rgba(255,255,255,0.65)' }}>{t('plant_index_sub')}</p>
          </div>
        </motion.button>

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
            <h2 className="text-3xl font-bold mb-1">{t('tasks')}</h2>
            <p className="font-medium text-base" style={{ color: 'rgba(255,255,255,0.65)' }}>{t('tasks_sub')}</p>
          </div>
        </motion.button>

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
            <h2 className="text-3xl font-bold mb-1">{t('settings')}</h2>
            <p className="font-medium text-base" style={{ color: 'rgba(255,255,255,0.65)' }}>{t('settings_sub')}</p>
          </div>
        </motion.button>
      </motion.div>
    </div>
  );
}
