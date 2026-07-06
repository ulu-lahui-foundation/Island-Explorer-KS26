import { useGame } from "@/lib/GameContext";
import { ArrowLeft, CheckCircle2, Circle, CalendarDays } from "lucide-react";
import { motion } from "framer-motion";

export function TasksPage() {
  const { setCurrentView, weeklyState, darkMode } = useGame();

  const completedCount = weeklyState.tasks.filter(t => t.completed).length;
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
      };

  const formatWeek = (iso: string) => {
    const d = new Date(iso);
    const end = new Date(d);
    end.setDate(d.getDate() + 6);
    const fmt = (date: Date) =>
      date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    return `${fmt(d)} – ${fmt(end)}`;
  };

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

        {/* Week badge */}
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

      {/* Task cards */}
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
              {/* Progress micro-label */}
              {!task.completed && task.target > 1 && (
                <span className="text-xs font-medium"
                  style={{ color: t.muted }}>
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
