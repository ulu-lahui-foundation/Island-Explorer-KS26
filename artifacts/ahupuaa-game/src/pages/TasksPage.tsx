import { useGame, PLANT_DATABASE } from "@/lib/GameContext";
import { ArrowLeft, CheckCircle2, Circle } from "lucide-react";
import { motion } from "framer-motion";

export function TasksPage() {
  const { setCurrentView, collectedPlants, placedPlants } = useGame();

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
    { title: "Collect your first plant",           completed: collectedPlants.length >= 1 },
    { title: `Collect all ${PLANT_DATABASE.length} plants`, completed: collectedPlants.length >= PLANT_DATABASE.length },
    { title: "Plant a tree in Uka",                completed: isTreeInUka },
    { title: "Build your ahupuaʻa",                completed: hasAllZones },
    { title: "Become a Plant Master",              completed: isMaster },
  ];

  const completedCount = tasks.filter(t => t.completed).length;
  const progressPercent = (completedCount / tasks.length) * 100;

  return (
    <div className="w-full h-full flex flex-col" style={{ background: '#F6F1E7' }}>

      {/* Header */}
      <div className="px-4 pt-8 pb-6 shadow-sm z-10"
        style={{ background: 'rgba(246,241,231,0.97)', borderBottom: '1px solid rgba(47,111,78,0.12)' }}>
        <button
          onClick={() => setCurrentView('piko')}
          className="flex items-center font-bold mb-4 transition-colors"
          style={{ color: '#2F6F4E' }}
        >
          <ArrowLeft className="mr-2" size={20} />
          Back to Piko
        </button>

        <h1 className="text-3xl font-bold tracking-tight mb-6" style={{ color: '#26342F' }}>Tasks</h1>

        <div className="mb-2 flex justify-between items-end">
          <span className="font-bold" style={{ color: 'rgba(38,52,47,0.55)' }}>Overall Progress</span>
          <span className="font-bold text-xl" style={{ color: '#2F6F4E' }}>
            {completedCount}/{tasks.length}
          </span>
        </div>

        {/* Progress bar */}
        <div className="w-full h-4 rounded-full overflow-hidden" style={{ background: 'rgba(47,111,78,0.12)' }}>
          <motion.div
            className="h-full rounded-full"
            style={{ background: 'linear-gradient(90deg, #2F6F4E 0%, #7BC96F 100%)' }}
            initial={{ width: 0 }}
            animate={{ width: `${progressPercent}%` }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          />
        </div>
      </div>

      {/* Task cards */}
      <div className="flex-1 overflow-y-auto p-4 pb-24 flex flex-col gap-4">
        {tasks.map((task, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.08 }}
            className="p-5 rounded-2xl flex items-center gap-4 transition-colors"
            style={task.completed
              ? { background: 'rgba(47,111,78,0.10)', border: '1px solid rgba(47,111,78,0.22)' }
              : { background: 'rgba(246,241,231,0.8)', border: '1px solid rgba(47,111,78,0.10)', boxShadow: '0 1px 6px rgba(38,52,47,0.06)' }
            }
          >
            {task.completed
              ? <CheckCircle2 size={28} className="shrink-0" style={{ color: '#2F6F4E' }} />
              : <Circle size={28} className="shrink-0" style={{ color: 'rgba(47,111,78,0.25)' }} />
            }
            <span className="font-bold text-base"
              style={{ color: task.completed ? '#2F6F4E' : 'rgba(38,52,47,0.65)' }}>
              {task.title}
            </span>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
