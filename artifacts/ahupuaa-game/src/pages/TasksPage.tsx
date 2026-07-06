import { useGame, PLANT_DATABASE } from "@/lib/GameContext";
import { ArrowLeft, CheckCircle2, Circle, CalendarDays, Gift, Sparkles, Lock } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";

export function TasksPage() {
  const { setCurrentView, weeklyState, darkMode, claimWeeklyReward } = useGame();
  const [rewardRevealed, setRewardRevealed] = useState(false);

  const completedCount = weeklyState.tasks.filter(t => t.completed).length;
  const allDone = completedCount === weeklyState.tasks.length;
  const progressPercent = (completedCount / weeklyState.tasks.length) * 100;

  const t = darkMode
    ? {
        bg: '#245238',
        cardDoneBg: '#2A6042',
        cardDoneBorder: 'rgba(255,255,255,0.10)',
        cardDoneShadow: '0 4px 14px rgba(0,0,0,0.25)',
        cardTodoBg: '#1D4A30',
        cardTodoBorder: 'rgba(255,255,255,0.06)',
        cardTodoShadow: '0 4px 14px rgba(0,0,0,0.20)',
        text: '#ffffff',
        muted: 'rgba(255,255,255,0.55)',
        sub: 'rgba(255,255,255,0.50)',
        accent: '#5CC882',
        barBg: 'rgba(255,255,255,0.10)',
        weekBg: 'rgba(255,255,255,0.08)',
        rewardLockedBg: '#1D4A30',
        rewardLockedBorder: 'rgba(255,255,255,0.06)',
        rewardOpenBg: '#2A6042',
        rewardOpenBorder: 'rgba(255,255,255,0.10)',
      }
    : {
        bg: '#F6F1E7',
        cardDoneBg: '#ffffff',
        cardDoneBorder: 'rgba(47,111,78,0.15)',
        cardDoneShadow: '0 4px 14px rgba(0,0,0,0.06)',
        cardTodoBg: '#ffffff',
        cardTodoBorder: 'rgba(47,111,78,0.10)',
        cardTodoShadow: '0 4px 14px rgba(0,0,0,0.04)',
        text: '#26342F',
        muted: 'rgba(38,52,47,0.55)',
        sub: 'rgba(38,52,47,0.50)',
        accent: '#2F6F4E',
        barBg: 'rgba(47,111,78,0.12)',
        weekBg: 'rgba(47,111,78,0.08)',
        rewardLockedBg: '#E8E4DB',
        rewardLockedBorder: 'rgba(47,111,78,0.10)',
        rewardOpenBg: '#ffffff',
        rewardOpenBorder: 'rgba(47,111,78,0.15)',
      };

  const formatWeek = (iso: string) => {
    const d = new Date(iso);
    const end = new Date(d);
    end.setDate(d.getDate() + 6);
    const fmt = (date: Date) =>
      date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    return `${fmt(d)} \u2013 ${fmt(end)}`;
  };

  const handleClaim = () => {
    if (!allDone || weeklyState.rewardClaimed) return;
    claimWeeklyReward();
    setRewardRevealed(true);
  };

  const limu = PLANT_DATABASE.find(p => p.id === 'limu');

  return (
    <div className="w-full h-full flex flex-col" style={{ background: t.bg }}>

      {/* Header */}
      <div className="px-4 pt-10 pb-4" style={{ background: t.bg }}>
        <button
          onClick={() => setCurrentView('piko')}
          className="flex items-center gap-1 mb-5 text-sm font-bold"
          style={{ color: t.muted }}
        >
          <ArrowLeft size={16} />
          Back
        </button>

        <h1 className="text-4xl font-extrabold leading-tight mb-1" style={{ color: t.text }}>
          Weekly Tasks
        </h1>

        <div className="flex items-center gap-2 mb-3">
          <CalendarDays size={14} style={{ color: t.muted }} />
          <span className="text-xs font-bold px-2 py-0.5 rounded-full"
            style={{ background: t.weekBg, color: t.muted }}>
            {formatWeek(weeklyState.weekStart)}
          </span>
        </div>

        <p className="text-sm font-semibold mb-4" style={{ color: t.sub }}>
          {completedCount} / {weeklyState.tasks.length} completed
        </p>

        <div className="w-full h-3 rounded-full overflow-hidden" style={{ background: t.barBg }}>
          <motion.div
            className="h-full rounded-full"
            style={{ background: t.accent }}
            initial={{ width: 0 }}
            animate={{ width: `${progressPercent}%` }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 pb-28 flex flex-col gap-4">

        {/* ── Weekly Reward Card ── */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.15 }}
          onClick={handleClaim}
          className="rounded-2xl overflow-hidden relative"
          style={{
            background: weeklyState.rewardClaimed ? t.rewardOpenBg : (allDone ? t.rewardOpenBg : t.rewardLockedBg),
            border: `2px solid ${weeklyState.rewardClaimed ? t.rewardOpenBorder : (allDone ? '#5CC882' : t.rewardLockedBorder)}`,
            boxShadow: '0 6px 18px rgba(0,0,0,0.20)',
            cursor: allDone && !weeklyState.rewardClaimed ? 'pointer' : 'default',
          }}
        >
          {/* Glow ring when ready */}
          {allDone && !weeklyState.rewardClaimed && (
            <motion.div
              className="absolute inset-0 rounded-2xl"
              animate={{ opacity: [0.3, 0.6, 0.3] }}
              transition={{ repeat: Infinity, duration: 2 }}
              style={{ boxShadow: 'inset 0 0 20px rgba(92,200,130,0.4)' }}
            />
          )}

          <div className="p-5 flex items-center gap-4 relative z-10">
            {/* Gift icon or revealed plant image */}
            {weeklyState.rewardClaimed ? (
              <div className="w-16 h-16 rounded-xl overflow-hidden shrink-0">
                {limu && <img src={limu.image} alt={limu.name} className="w-full h-full object-cover" />}
              </div>
            ) : (
              <div
                className="w-16 h-16 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: allDone ? 'rgba(92,200,130,0.15)' : 'rgba(0,0,0,0.08)' }}
              >
                {allDone
                  ? <Gift size={28} style={{ color: '#5CC882' }} />
                  : <Lock size={24} style={{ color: darkMode ? 'rgba(255,255,255,0.25)' : 'rgba(38,52,47,0.25)' }} />
                }
              </div>
            )}

            <div className="flex-1 min-w-0">
              <span className="text-xs font-bold uppercase tracking-wider block mb-1"
                style={{ color: allDone ? t.accent : t.muted }}>
                Weekly Reward
              </span>

              <AnimatePresence mode="wait">
                {weeklyState.rewardClaimed && limu ? (
                  <motion.div
                    key="revealed"
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                  >
                    <span className="text-lg font-extrabold block" style={{ color: t.text }}>
                      {limu.name}
                    </span>
                    <span className="text-xs font-medium" style={{ color: t.sub }}>
                      Collected! Check your Plant Index.
                    </span>
                  </motion.div>
                ) : (
                  <motion.div
                    key="mystery"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    <span className="text-lg font-extrabold block" style={{ color: t.text }}>
                      Mystery Plant
                    </span>
                    <span className="text-xs font-medium" style={{ color: t.sub }}>
                      {allDone
                        ? 'Tap to reveal your reward!'
                        : `Complete all ${weeklyState.tasks.length} tasks to unlock`
                      }
                    </span>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Sparkle when ready */}
            {allDone && !weeklyState.rewardClaimed && (
              <motion.div
                animate={{ rotate: [0, 15, -15, 0], scale: [1, 1.2, 1] }}
                transition={{ repeat: Infinity, duration: 1.5 }}
              >
                <Sparkles size={22} style={{ color: '#5CC882' }} />
              </motion.div>
            )}
          </div>
        </motion.div>

        {/* ── Task cards ── */}
        {weeklyState.tasks.map((task, i) => (
          <motion.div
            key={task.id}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 + 0.2 }}
            className="p-4 rounded-2xl flex items-center gap-4"
            style={task.completed
              ? { background: t.cardDoneBg,   border: `2px solid ${t.cardDoneBorder}`,   boxShadow: t.cardDoneShadow }
              : { background: t.cardTodoBg,    border: `2px solid ${t.cardTodoBorder}`,   boxShadow: t.cardTodoShadow }
            }
          >
            {task.completed
              ? <CheckCircle2 size={26} className="shrink-0" style={{ color: t.accent }} />
              : <Circle size={26} className="shrink-0" style={{ color: darkMode ? 'rgba(255,255,255,0.20)' : 'rgba(47,111,78,0.25)' }} />
            }
            <div className="flex-1 min-w-0">
              <span className="font-bold text-base block truncate"
                style={{ color: task.completed ? t.text : t.sub }}>
                {task.title}
              </span>
              {!task.completed && task.target > 1 && (
                <span className="text-xs font-medium" style={{ color: t.muted }}>
                  {task.current} / {task.target}
                </span>
              )}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
