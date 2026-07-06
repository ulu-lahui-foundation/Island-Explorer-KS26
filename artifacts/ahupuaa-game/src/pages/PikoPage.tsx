import { useGame } from "@/lib/GameContext";
import { Book, Star, Settings } from "lucide-react";
import { motion } from "framer-motion";

export function PikoPage() {
  const { setCurrentView, darkMode } = useGame();

  const t = darkMode
    ? {
        bg: '#245238',
        cardBg: '#2A6042',
        border: 'rgba(255,255,255,0.10)',
        text: '#ffffff',
        title: '#ffffff',
        subtitle: 'rgba(255,255,255,0.45)',
        desc: 'rgba(255,255,255,0.65)',
        shadow: '0 6px 18px rgba(0,0,0,0.30)',
        iconColor: 'rgba(255,255,255,0.15)',
      }
    : {
        bg: '#F6F1E7',
        cardBg: '#ffffff',
        border: 'rgba(47,111,78,0.15)',
        text: '#26342F',
        title: '#26342F',
        subtitle: 'rgba(38,52,47,0.55)',
        desc: 'rgba(38,52,47,0.65)',
        shadow: '0 6px 18px rgba(0,0,0,0.06)',
        iconColor: 'rgba(47,111,78,0.12)',
      };

  const container = {
    hidden: { opacity: 0 },
    show:  { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const item = {
    hidden: { opacity: 0, y: 50 },
    show:   { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 300, damping: 24 } }
  };

  const HubButton = ({
    icon: Icon,
    label,
    desc,
    view,
  }: {
    icon: React.ElementType;
    label: string;
    desc: string;
    view: 'plant_index' | 'tasks' | 'settings';
  }) => (
    <motion.button
      variants={item}
      onClick={() => setCurrentView(view)}
      className="flex-1 rounded-[2rem] active:scale-[0.98] transition-transform p-8 flex flex-col justify-end relative overflow-hidden group"
      style={{
        background: t.cardBg,
        border: `2px solid ${t.border}`,
        boxShadow: t.shadow,
      }}
    >
      <Icon className="absolute top-8 right-8 w-24 h-24 transition-transform duration-500 group-hover:rotate-12" style={{ color: t.iconColor }} />
      <div className="text-left z-10">
        <h2 className="text-3xl font-bold mb-1" style={{ color: t.text }}>{label}</h2>
        <p className="font-medium text-base" style={{ color: t.desc }}>{desc}</p>
      </div>
    </motion.button>
  );

  return (
    <div className="w-full h-full p-4 pb-24 flex flex-col gap-4" style={{ background: t.bg }}>
      <div className="pt-8 pb-4 px-2">
        <h1 className="text-4xl font-extrabold tracking-tight" style={{ color: t.title }}>Piko</h1>
        <p className="font-semibold mt-1" style={{ color: t.subtitle }}>
          Your hub for knowledge and progress.
        </p>
      </div>

      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="flex-1 flex flex-col gap-4"
      >
        <HubButton icon={Book}    label="Plant Index" desc="View your collection"  view="plant_index" />
        <HubButton icon={Star}    label="Tasks"       desc="Track your progress"   view="tasks" />
        <HubButton icon={Settings} label="Settings"    desc="App options"           view="settings" />
      </motion.div>
    </div>
  );
}
