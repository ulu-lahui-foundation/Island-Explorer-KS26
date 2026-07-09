import { useState } from "react";
import { useGame } from "@/lib/GameContext";
import { useAuth } from "@/lib/AuthContext";
import { Book, Star, Settings, ChevronDown, ChevronUp, LogOut } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export function PikoPage() {
  const { setCurrentView, darkMode } = useGame();
  const { currentUser, testAccounts, signOut } = useAuth();
  const [showAccounts, setShowAccounts] = useState(false);
  const [showSignOutConfirm, setShowSignOutConfirm] = useState(false);

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
        tableBg: 'rgba(0,0,0,0.20)',
        tableAlt: 'rgba(0,0,0,0.12)',
        tableHead: 'rgba(255,255,255,0.08)',
        tableText: 'rgba(255,255,255,0.75)',
        tableHead2: 'rgba(255,255,255,0.40)',
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
        tableBg: 'rgba(47,111,78,0.06)',
        tableAlt: 'rgba(47,111,78,0.03)',
        tableHead: 'rgba(47,111,78,0.10)',
        tableText: '#26342F',
        tableHead2: 'rgba(38,52,47,0.50)',
      };

  const container = {
    hidden: { opacity: 0 },
    show:  { opacity: 1, transition: { staggerChildren: 0.08 } },
  };

  const item = {
    hidden: { opacity: 0, y: 40 },
    show:   { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 300, damping: 24 } },
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
      style={{ background: t.cardBg, border: `2px solid ${t.border}`, boxShadow: t.shadow }}
    >
      <Icon className="absolute top-8 right-8 w-24 h-24 transition-transform duration-500 group-hover:rotate-12" style={{ color: t.iconColor }} />
      <div className="text-left z-10">
        <h2 className="text-3xl font-bold mb-1" style={{ color: t.text }}>{label}</h2>
        <p className="font-medium text-base" style={{ color: t.desc }}>{desc}</p>
      </div>
    </motion.button>
  );

  return (
    <div className="w-full h-full overflow-y-auto pb-24" style={{ background: t.bg }}>
      <div className="p-4 flex flex-col gap-4">
        {/* Header row: greeting + sign out */}
        <div className="pt-8 pb-2 px-2 flex items-start justify-between">
          <div>
            <h1 className="text-4xl font-extrabold tracking-tight" style={{ color: t.title }}>Piko</h1>
            {currentUser && (
              <p className="font-semibold mt-1" style={{ color: '#7BC96F' }}>
                Aloha, {currentUser}! 🌺
              </p>
            )}
            <p className="font-medium mt-0.5 text-sm" style={{ color: t.subtitle }}>
              Your hub for knowledge and progress.
            </p>
          </div>

          {/* Sign Out button */}
          {currentUser && !showSignOutConfirm && (
            <button
              onClick={() => setShowSignOutConfirm(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-2xl text-sm font-bold mt-8 transition-transform active:scale-95"
              style={{ background: 'rgba(185,64,64,0.15)', color: '#e05c5c', border: '1.5px solid rgba(185,64,64,0.25)' }}
            >
              <LogOut size={15} />
              Sign Out
            </button>
          )}
          {showSignOutConfirm && (
            <div className="flex flex-col items-end gap-1 mt-8">
              <span className="text-xs font-semibold" style={{ color: t.subtitle }}>Sign out?</span>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowSignOutConfirm(false)}
                  className="px-3 py-1.5 rounded-xl text-xs font-bold"
                  style={{ background: t.cardBg, color: t.text, border: `1px solid ${t.border}` }}
                >
                  Cancel
                </button>
                <button
                  onClick={() => { setShowSignOutConfirm(false); signOut(); }}
                  className="px-3 py-1.5 rounded-xl text-xs font-bold"
                  style={{ background: '#b94040', color: '#fff' }}
                >
                  Yes, Sign Out
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Nav cards */}
        <motion.div variants={container} initial="hidden" animate="show" className="flex flex-col gap-4" style={{ minHeight: 320 }}>
          <HubButton icon={Book}     label="Plant Index" desc="View your collection"  view="plant_index" />
          <HubButton icon={Star}     label="Tasks"       desc="Track your progress"   view="tasks" />
          <HubButton icon={Settings} label="Settings"    desc="App options"           view="settings" />
        </motion.div>

        {/* Test Accounts section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, type: 'spring', damping: 24 }}
          className="rounded-[1.5rem] overflow-hidden"
          style={{ border: `1.5px solid ${t.border}`, boxShadow: t.shadow }}
        >
          <button
            onClick={() => setShowAccounts(v => !v)}
            className="w-full flex items-center justify-between px-6 py-4"
            style={{ background: t.cardBg }}
          >
            <div className="text-left">
              <p className="font-bold text-base" style={{ color: t.text }}>Test Accounts</p>
              <p className="text-xs font-medium mt-0.5" style={{ color: t.subtitle }}>
                15 ready-to-use accounts
              </p>
            </div>
            {showAccounts
              ? <ChevronUp size={20} style={{ color: t.subtitle }} />
              : <ChevronDown size={20} style={{ color: t.subtitle }} />}
          </button>

          <AnimatePresence>
            {showAccounts && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ type: 'spring', damping: 28, stiffness: 280 }}
                style={{ overflow: 'hidden' }}
              >
                <div style={{ background: t.tableBg }}>
                  {/* Table header */}
                  <div
                    className="grid grid-cols-2 px-5 py-2 text-xs font-bold uppercase tracking-widest"
                    style={{ background: t.tableHead, color: t.tableHead2 }}
                  >
                    <span>Username</span>
                    <span>Password</span>
                  </div>
                  {/* Rows */}
                  {testAccounts.map((acc, i) => (
                    <div
                      key={acc.username}
                      className="grid grid-cols-2 px-5 py-2.5 text-sm"
                      style={{
                        background: i % 2 === 0 ? 'transparent' : t.tableAlt,
                        borderTop: `1px solid ${t.border}`,
                      }}
                    >
                      <span className="font-bold" style={{ color: '#7BC96F' }}>{acc.username}</span>
                      <span className="font-mono" style={{ color: t.tableText }}>{acc.password}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
}
