import { useGame, PLANT_DATABASE } from "@/lib/GameContext";
import { useTheme } from "@/lib/ThemeContext";
import { ArrowLeft, CheckCircle2, Circle } from "lucide-react";
import { motion } from "framer-motion";

export function TasksPage() {
  const { setCurrentView, collectedPlants, placedPlants } = useGame();
  const { darkMode } = useTheme();

  const pageBg   = darkMode ? '#245238' : '#F6F1E7';
  const titleCol = darkMode ? '#ffffff' : '#26342F';
  const subCol   = darkMode ? 'rgba(255,255,255,0.45)' : 'rgba(38,52,47,0.50)';
  const cardBg   = darkMode ? '#2A6042' : '#ffffff';
  const cardDim  = darkMode ? '#1D4A30' : '#EDEAE2';
  const accent   = '#5CC882';

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
    { title: "Collect your first plant",             completed: collectedPlants.length >= 1 },
    { title: `Collect all ${PLANT_DATABASE.length} plants`, completed: collectedPlants.length >= PLANT_DATABASE.length },
    { title: "Plant a tree in Uka",                  completed: isTreeInUka },
    { title: "Build your ahupuaʻa",                  completed: hasAllZones },
    { title: "Become a Plant Master",                 completed: isMaster },
  ];

  const completedCount = tasks.filter(t => t.completed).length;
  const progressPercent = (completedCount / tasks.length) * 100;

  return (
    <div className="w-full h-full flex flex-col" style={{ background: pageBg }}>

      {/* Header */}
      <div className="px-4 pt-10 pb-4" style={{ background: pageBg }}>
        <button
          onClick={() => setCurrentView('piko')}
          className="flex items-center gap-1 mb-5 text-sm font-bold"
          style={{ color: subCol }}
        >
          <ArrowLeft size={16} />
          Back
        </button>

        <h1 className="text-4xl font-extrabold leading-tight mb-1" style={{ color: titleCol }}>
          Tasks
        </h1>
        <p className="text-sm font-semibold mb-4" style={{ color: subCol }}>
          {completedCount} / {tasks.length} completed
        </p>

        <div className="w-full h-3 rounded-full overflow-hidden"
          style={{ background: darkMode ? 'rgba(255,255,255,0.10)' : 'rgba(47,111,78,0.12)' }}>
          <motion.div
            className="h-full rounded-full"
            style={{ background: accent }}
            initial={{ width: 0 }}
            animate={{ width: `${progressPercent}%` }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          />
        </div>
      </div>

      {/* Task cards */}
      <div className="flex-1 overflow-y-auto p-4 pb-28 flex flex-col gap-3">
        {tasks.map((task, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            className="p-4 rounded-2xl flex items-center gap-4"
            style={task.completed
              ? { background: cardBg,   border: `2px solid ${darkMode ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.06)'}`, boxShadow: darkMode ? '0 4px 14px rgba(0,0,0,0.25)' : '0 4px 14px rgba(0,0,0,0.06)' }
              : { background: cardDim, border: `2px solid ${darkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)'}`, boxShadow: darkMode ? '0 4px 14px rgba(0,0,0,0.20)' : '0 4px 14px rgba(0,0,0,0.04)' }
            }
          >
            {task.completed
              ? <CheckCircle2 size={26} className="shrink-0" style={{ color: accent }} />
              : <Circle size={26} className="shrink-0" style={{ color: darkMode ? 'rgba(255,255,255,0.20)' : 'rgba(47,111,78,0.25)' }} />
            }
            <span className="font-bold text-base"
              style={{ color: task.completed ? (darkMode ? '#F6F1E7' : '#26342F') : (darkMode ? 'rgba(255,255,255,0.50)' : 'rgba(38,52,47,0.50)') }}>
              {task.title}
            </span>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
