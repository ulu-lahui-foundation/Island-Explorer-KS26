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

  const isMaster = collectedPlants.length === PLANT_DATABASE.length && placedPlants.length === PLANT_DATABASE.length;

  const tasks = [
    { title: "Collect your first plant", completed: collectedPlants.length >= 1 },
    { title: `Collect all ${PLANT_DATABASE.length} plants`, completed: collectedPlants.length >= PLANT_DATABASE.length },
    { title: "Plant a tree in Uka", completed: isTreeInUka },
    { title: "Build your ahupuaʻa", completed: hasAllZones },
    { title: "Become a Plant Master", completed: isMaster }
  ];

  const completedCount = tasks.filter(t => t.completed).length;
  const progressPercent = (completedCount / tasks.length) * 100;

  return (
    <div className="w-full h-full bg-amber-50 flex flex-col">
      <div className="bg-white px-4 pt-8 pb-6 shadow-sm z-10">
        <button 
          onClick={() => setCurrentView('piko')}
          className="flex items-center text-gray-500 hover:text-gray-900 font-bold mb-4"
        >
          <ArrowLeft className="mr-2" size={20} />
          Back to Piko
        </button>
        
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight mb-6">Tasks</h1>
        
        <div className="mb-2 flex justify-between items-end">
          <span className="font-bold text-gray-600">Overall Progress</span>
          <span className="font-bold text-primary text-xl">{completedCount}/{tasks.length}</span>
        </div>
        <div className="w-full h-4 bg-gray-100 rounded-full overflow-hidden">
          <motion.div 
            className="h-full bg-amber-400"
            initial={{ width: 0 }}
            animate={{ width: `${progressPercent}%` }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 pb-24 flex flex-col gap-4">
        {tasks.map((task, i) => (
          <motion.div 
            key={i}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.1 }}
            className={`p-6 rounded-2xl flex items-center gap-4 transition-colors ${
              task.completed 
                ? 'bg-amber-100 border border-amber-200 shadow-sm' 
                : 'bg-white shadow-sm'
            }`}
          >
            {task.completed ? (
              <CheckCircle2 className="text-amber-500 shrink-0" size={28} />
            ) : (
              <Circle className="text-gray-300 shrink-0" size={28} />
            )}
            <span className={`font-bold text-lg ${task.completed ? 'text-amber-900' : 'text-gray-700'}`}>
              {task.title}
            </span>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
