import { useGame } from "@/lib/GameContext";
import { useTheme } from "@/lib/ThemeContext";
import {
  getWeeklyTasks,
  loadWeeklyStats,
  isTaskComplete,
  taskProgress,
  getWeekKey,
  allTasksComplete,
  claimReward,
  isRewardClaimed,
  WEEKLY_REWARD_PLANT,
} from "@/lib/weeklyTasks";
import { ArrowLeft, CheckCircle2, Circle, Gift, Star } from "lucide-react";
import { motion } from "framer-motion";

export function TasksPage() {
  const { setCurrentView, collectedPlants, collectPlant } = useGame();
  const { darkMode } = useTheme();

  const tasks = getWeeklyTasks();
  const stats = loadWeeklyStats();
  const weekKey = getWeekKey();

  const pageBg   = darkMode ? '#245238' : '#F6F1E7';
  const titleCol = darkMode ? '#ffffff' : '#26342F';
  const subCol   = darkMode ? 'rgba(255,255,255,0.45)' : 'rgba(38,52,47,0.50)';
  const cardBg   = darkMode ? '#2A6042' : '#ffffff';
  const cardDim  = darkMode ? '#1D4A30' : '#EDEAE2';
  const accent   = '#5CC882';

  const completedCount = tasks.filter(t => isTaskComplete(t, stats)).length;
  const progressPercent = (completedCount / tasks.length) * 100;
  const allDone = allTasksComplete(tasks, stats);
  const claimed = isRewardClaimed();
  const alreadyHave = collectedPlants.includes(WEEKLY_REWARD_PLANT.id);

  const handleClaim = () => {
    if (claimReward()) {
      collectPlant(WEEKLY_REWARD_PLANT);
    }
  };

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
          {completedCount} / {tasks.length} completed · {weekKey}
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

      {/* ── Weekly Reward Card ── */}
      <div className="px-4 pb-2">
        <div className="rounded-2xl overflow-hidden relative"
          style={{
            background: allDone ? (darkMode ? '#1a3d28' : '#E8F5E9') : cardBg,
            border: `2px solid ${allDone ? accent : (darkMode ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.06)')}`,
            boxShadow: darkMode ? '0 6px 18px rgba(0,0,0,0.25)' : '0 6px 18px rgba(0,0,0,0.06)',
          }}>

          {/* Glow pulse when ready */}
          {allDone && !claimed && (
            <motion.div
              className="absolute inset-0 z-0"
              animate={{ opacity: [0.15, 0.35, 0.15] }}
              transition={{ repeat: Infinity, duration: 2 }}
              style={{ background: `radial-gradient(circle at 50% 50%, ${accent}, transparent 70%)` }}
            />
          )}

          <div className="relative z-10 flex items-center gap-4 p-4">
            {/* Plant image */}
            <div className="w-16 h-16 rounded-xl overflow-hidden shrink-0 relative"
              style={{ border: `2px solid ${claimed || alreadyHave ? accent : (darkMode ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.10)')}` }}>
              <img
                src={WEEKLY_REWARD_PLANT.image}
                alt={WEEKLY_REWARD_PLANT.name}
                className="w-full h-full object-cover"
                style={{ opacity: allDone ? 1 : 0.35 }}
              />
              {!allDone && (
                <div className="absolute inset-0 flex items-center justify-center"
                  style={{ background: 'rgba(0,0,0,0.40)' }}>
                  <Gift size={22} color="white" />
                </div>
              )}
              {(claimed || alreadyHave) && (
                <div className="absolute inset-0 flex items-center justify-center"
                  style={{ background: 'rgba(0,0,0,0.35)' }}>
                  <Star size={20} fill={accent} color={accent} />
                </div>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-xs font-bold uppercase tracking-wider"
                  style={{ color: accent }}>Weekly Reward</span>
                {(claimed || alreadyHave) && (
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full uppercase"
                    style={{ background: accent, color: '#1A3828' }}>Claimed</span>
                )}
              </div>
              <p className="font-bold text-base truncate" style={{ color: titleCol }}>
                {WEEKLY_REWARD_PLANT.name}
              </p>
              <p className="text-xs font-medium" style={{ color: subCol }}>
                {claimed || alreadyHave
                  ? "Already in your collection!"
                  : allDone
                    ? "All tasks done — claim your reward!"
                    : `Complete all ${tasks.length} tasks to unlock`
                }
              </p>
            </div>

            {/* Claim button */}
            {allDone && !claimed && !alreadyHave && (
              <motion.button
                whileTap={{ scale: 0.92 }}
                onClick={handleClaim}
                className="shrink-0 px-4 py-2 rounded-xl text-sm font-bold"
                style={{ background: accent, color: '#1A3828' }}
              >
                Claim
              </motion.button>
            )}
          </div>
        </div>
      </div>

      {/* Task cards */}
      <div className="flex-1 overflow-y-auto p-4 pb-28 flex flex-col gap-3">
        {tasks.map((task, i) => {
          const done = isTaskComplete(task, stats);
          const prog = taskProgress(task, stats);

          return (
            <motion.div
              key={task.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              className="p-4 rounded-2xl flex items-center gap-4"
              style={done
                ? { background: cardBg,   border: `2px solid ${darkMode ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.06)'}`, boxShadow: darkMode ? '0 4px 14px rgba(0,0,0,0.25)' : '0 4px 14px rgba(0,0,0,0.06)' }
                : { background: cardDim, border: `2px solid ${darkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)'}`, boxShadow: darkMode ? '0 4px 14px rgba(0,0,0,0.20)' : '0 4px 14px rgba(0,0,0,0.04)' }
              }
            >
              {done
                ? <CheckCircle2 size={26} className="shrink-0" style={{ color: accent }} />
                : <Circle size={26} className="shrink-0" style={{ color: darkMode ? 'rgba(255,255,255,0.20)' : 'rgba(47,111,78,0.25)' }} />
              }
              <div className="flex-1 min-w-0">
                <span className="font-bold text-base block truncate"
                  style={{ color: done ? (darkMode ? '#F6F1E7' : '#26342F') : (darkMode ? 'rgba(255,255,255,0.50)' : 'rgba(38,52,47,0.50)') }}>
                  {task.label}
                </span>
                {task.category !== "zone" && task.category !== "plant" && (
                  <span className="text-xs font-semibold"
                    style={{ color: darkMode ? 'rgba(255,255,255,0.35)' : 'rgba(38,52,47,0.40)' }}>
                    {prog.current} / {prog.target}
                  </span>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
