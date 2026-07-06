import { useGame, PLANT_DATABASE } from "@/lib/GameContext";
import { t, useLang } from "@/lib/i18n";
import { ArrowLeft, CheckCircle2, Circle } from "lucide-react";
import { motion } from "framer-motion";

const PAGE_BG  = '#245238';
const CARD_BG  = '#2A6042';
const CARD_DIM = '#1D4A30';
const ACCENT   = '#5CC882';

export function TasksPage() {
  const { setCurrentView, collectedPlants, placedPlants } = useGame();
  useLang(); // re-render on language change

  const isTreeInUka = placedPlants.some(p => {
    const plant = PLANT_DATABASE.find(db => db.id === p.plantId);
    return plant?.tags.includes('trees') && p.zone === 'uka';
  });

  const hasAllZones = ['uka', 'kula', 'kai'].every(zone =>
    placedPlants.some(p => p.zone === zone)
  );

  const isMaster =
    collectedPlants.length === PLANT_DATABASE.length &&
    placedPlants.length === PLANT_DATABASE.length;

  const tasks = [
    { key: 'task_collect_first', completed: collectedPlants.length >= 1 },
    { key: 'task_collect_all',   completed: collectedPlants.length >= PLANT_DATABASE.length, vars: { n: PLANT_DATABASE.length } },
    { key: 'task_tree_uka',      completed: isTreeInUka },
    { key: 'task_build',         completed: hasAllZones },
    { key: 'task_master',        completed: isMaster },
  ];

  const completedCount = tasks.filter(t => t.completed).length;
  const progressPercent = (completedCount / tasks.length) * 100;

  return (
    <div className="w-full h-full flex flex-col" style={{ background: PAGE_BG }}>
      <div className="px-4 pt-10 pb-4" style={{ background: PAGE_BG }}>
        <button
          onClick={() => setCurrentView('piko')}
          className="flex items-center gap-1 mb-5 text-sm font-bold"
          style={{ color: 'rgba(255,255,255,0.55)' }}
        >
          <ArrowLeft size={16} />
          {t('back')}
        </button>

        <h1 className="text-4xl font-extrabold leading-tight mb-1 text-white">
          {t('tasks_header')}
        </h1>
        <p className="text-sm font-semibold mb-4" style={{ color: 'rgba(255,255,255,0.45)' }}>
          {completedCount} / {tasks.length} {t('completed')}
        </p>

        <div className="w-full h-3 rounded-full overflow-hidden"
          style={{ background: 'rgba(255,255,255,0.10)' }}>
          <motion.div
            className="h-full rounded-full"
            style={{ background: ACCENT }}
            initial={{ width: 0 }}
            animate={{ width: `${progressPercent}%` }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 pb-28 flex flex-col gap-3">
        {tasks.map((task, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            className="p-4 rounded-2xl flex items-center gap-4"
            style={task.completed
              ? { background: CARD_BG,   border: '2px solid rgba(255,255,255,0.10)', boxShadow: '0 4px 14px rgba(0,0,0,0.25)' }
              : { background: CARD_DIM, border: '2px solid rgba(255,255,255,0.06)', boxShadow: '0 4px 14px rgba(0,0,0,0.20)' }
            }
          >
            {task.completed
              ? <CheckCircle2 size={26} className="shrink-0" style={{ color: ACCENT }} />
              : <Circle size={26} className="shrink-0" style={{ color: 'rgba(255,255,255,0.20)' }} />
            }
            <span className="font-bold text-base"
              style={{ color: task.completed ? '#F6F1E7' : 'rgba(255,255,255,0.50)' }}>
              {t(task.key, task.vars)}
            </span>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
