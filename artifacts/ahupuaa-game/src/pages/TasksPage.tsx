import { useGame, PLANT_DATABASE } from "@/lib/GameContext";
import { ArrowLeft, CheckCircle2, Circle, CalendarDays, Gift, Sparkles, Lock } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export function TasksPage() {
  const { setCurrentView, weeklyState, darkMode, claimWeeklyReward } = useGame();

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
  };

  const limu = PLANT_DATABASE.find(p => p.id === 'limu');

  return (
    <div className="w-full h-full flex flex-col" style={{ background: t.bg }}>

      {/* ── Header + Reward (pinned above scroll) ── */}
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

        {/* Progress bar */}
        <div className="w-full h-3 rounded-full overflow-hidden mb-4" style={{ background: t.barBg }}>
          <motion.div
            className="h-full rounded-full"
            style={{ background: t.accent }}
            initial={{ width: 0 }}
            animate={{ width: `${progressPercent}%` }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          />
        </div>

        {/* ── Weekly Reward Card (horizontal, right under the bar) ── */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          onClick={handleClaim}
          className="rounded-2xl overflow-hidden relative"
          style={{
            background: darkMode
              ? (weeklyState.rewardClaimed || allDone
                  ? 'linear-gradient(135deg, #1B4D2E 0%, #245238 50%, #1B4D2E 100%)'
                  : 'linear-gradient(135deg, #1A3A28 0%, #1D4A30 50%, #1A3A28 100%)')
              : (weeklyState.rewardClaimed || allDone
                  ? 'linear-gradient(135deg, #EAF5ED 0%, #F6F1E7 50%, #EAF5ED 100%)'
                  : 'linear-gradient(135deg, #E8E4DB 0%, #F0EDE5 50%, #E8E4DB 100%)'),
            border: `3px solid ${weeklyState.rewardClaimed ? '#5CC882' : (allDone ? '#5CC882' : darkMode ? 'rgba(255,215,0,0.25)' : 'rgba(184,134,11,0.30)')}`,
            boxShadow: allDone && !weeklyState.rewardClaimed
              ? '0 0 24px rgba(92,200,130,0.35), 0 6px 18px rgba(0,0,0,0.25)'
              : '0 6px 18px rgba(0,0,0,0.20)',
            cursor: allDone && !weeklyState.rewardClaimed ? 'pointer' : 'default',
          }}
        >
          {/* Animated shimmer overlay when ready */}
          {allDone && !weeklyState.rewardClaimed && (
            <motion.div
              className="absolute inset-0 rounded-2xl"
              style={{
                background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.10), transparent)',
                backgroundSize: '200% 100%',
              }}
              animate={{ backgroundPosition: ['200% 0', '-200% 0'] }}
              transition={{ repeat: Infinity, duration: 2, ease: 'linear' }}
            />
          )}

          {/* Outer glow ring when ready */}
          {allDone && !weeklyState.rewardClaimed && (
            <motion.div
              className="absolute inset-0 rounded-2xl pointer-events-none"
              animate={{ opacity: [0.4, 0.8, 0.4] }}
              transition={{ repeat: Infinity, duration: 2 }}
              style={{ boxShadow: 'inset 0 0 30px rgba(92,200,130,0.25)' }}
            />
          )}

          <div className="p-5 flex items-center gap-4 relative z-10">
            {/* Left: icon with golden circle bg */}
            {weeklyState.rewardClaimed ? (
              <div className="w-16 h-16 rounded-2xl overflow-hidden shrink-0"
                style={{ boxShadow: `0 0 0 3px #5CC882, 0 0 0 5px ${darkMode ? '#245238' : '#F6F1E7'}` }}>
                {limu && <img src={limu.image} alt={limu.name} className="w-full h-full object-cover" />}
              </div>
            ) : (
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center shrink-0"
                style={{
                  background: allDone
                    ? 'linear-gradient(135deg, rgba(92,200,130,0.25), rgba(92,200,130,0.10))'
                    : darkMode
                      ? 'linear-gradient(135deg, rgba(255,215,0,0.12), rgba(255,215,0,0.04))'
                      : 'linear-gradient(135deg, rgba(184,134,11,0.12), rgba(184,134,11,0.04))',
                  border: `2px solid ${allDone ? 'rgba(92,200,130,0.35)' : darkMode ? 'rgba(255,215,0,0.15)' : 'rgba(184,134,11,0.20)'}`,
                }}
              >
                {allDone
                  ? <Gift size={30} style={{ color: '#5CC882' }} />
                  : <Lock size={26} style={{ color: darkMode ? 'rgba(255,215,0,0.50)' : 'rgba(184,134,11,0.50)' }} />
                }
              </div>
            )}

            {/* Center: text */}
            <div className="flex-1 min-w-0">
              <span className="text-xs font-extrabold uppercase tracking-widest block mb-1"
                style={{ color: allDone ? '#5CC882' : darkMode ? 'rgba(255,215,0,0.70)' : 'rgba(184,134,11,0.70)' }}>
                Weekly Reward
              </span>

              <AnimatePresence mode="wait">
                {weeklyState.rewardClaimed && limu ? (
                  <motion.div
                    key="revealed"
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <span className="text-lg font-extrabold block" style={{ color: t.text }}>
                      {limu.name}
                    </span>
                    <span className="text-xs font-semibold" style={{ color: t.sub }}>
                      Collected! Check your Plant Index.
                    </span>
                  </motion.div>
                ) : (
                  <motion.div
                    key="mystery"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  >
                    <span className="text-lg font-extrabold block" style={{ color: t.text }}>
                      Mystery Plant
                    </span>
                    <span className="text-xs font-semibold" style={{ color: t.sub }}>
                      {allDone
                        ? 'Tap to reveal your reward!'
                        : `Complete all ${weeklyState.tasks.length} tasks to unlock`
                      }
                    </span>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Right: animated sparkle when ready */}
            {allDone && !weeklyState.rewardClaimed && (
              <motion.div
                className="shrink-0"
                animate={{ rotate: [0, 20, -20, 0], scale: [1, 1.3, 1] }}
                transition={{ repeat: Infinity, duration: 1.2 }}
              >
                <Sparkles size={28} style={{ color: '#5CC882' }} />
              </motion.div>
            )}
          </div>
        </motion.div>
      </div>

      {/* ── Task cards (scrollable list below) ── */}
      <div className="flex-1 overflow-y-auto p-4 pb-28 flex flex-col gap-3">
        {weeklyState.tasks.map((task, i) => (
          <motion.div
            key={task.id}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
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
