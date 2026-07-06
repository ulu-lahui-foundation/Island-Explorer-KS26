import { useGame } from "@/lib/GameContext";
import { ArrowLeft, Volume2, Globe, Moon, Bell, Info } from "lucide-react";
import { Switch } from "@/components/ui/switch";

export function SettingsPage() {
  const { setCurrentView, darkMode, toggleDarkMode } = useGame();

  const t = darkMode
    ? {
        bg: '#245238',
        cardBg: '#2A6042',
        border: 'rgba(255,255,255,0.10)',
        text: '#ffffff',
        muted: 'rgba(255,255,255,0.55)',
        sub: 'rgba(255,255,255,0.45)',
        faint: 'rgba(255,255,255,0.30)',
        pillBg: 'rgba(255,255,255,0.10)',
        accent: '#5CC882',
        switchTrack: '#5CC882',
      }
    : {
        bg: '#F6F1E7',
        cardBg: '#ffffff',
        border: 'rgba(47,111,78,0.15)',
        text: '#26342F',
        muted: 'rgba(38,52,47,0.55)',
        sub: 'rgba(38,52,47,0.50)',
        faint: 'rgba(38,52,47,0.30)',
        pillBg: 'rgba(47,111,78,0.10)',
        accent: '#2F6F4E',
        switchTrack: '#2F6F4E',
      };

  const SettingRow = ({
    icon: Icon,
    label,
    desc,
    action,
  }: {
    icon: React.ElementType;
    label: string;
    desc: string;
    action: React.ReactNode;
  }) => (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full flex items-center justify-center"
          style={{ background: darkMode ? 'rgba(255,255,255,0.10)' : 'rgba(47,111,78,0.10)', color: t.accent }}>
          <Icon size={20} />
        </div>
        <div>
          <h3 className="font-bold" style={{ color: t.text }}>{label}</h3>
          <p className="text-sm font-medium" style={{ color: t.sub }}>{desc}</p>
        </div>
      </div>
      {action}
    </div>
  );

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

        <h1 className="text-4xl font-extrabold leading-tight" style={{ color: t.text }}>
          Settings
        </h1>
      </div>

      <div className="flex-1 overflow-y-auto p-4 pb-28 flex flex-col gap-5">

        {/* Main options card */}
        <div className="rounded-2xl p-6 flex flex-col gap-7"
          style={{ background: t.cardBg, border: `2px solid ${t.border}`, boxShadow: '0 6px 18px rgba(0,0,0,0.12)' }}>

          <SettingRow
            icon={Globe}
            label="Language"
            desc="English only"
            action={
              <span className="px-3 py-1 rounded-lg text-sm font-bold"
                style={{ background: t.pillBg, color: t.accent }}>
                EN
              </span>
            }
          />

          <SettingRow
            icon={Moon}
            label="Dark Mode"
            desc={darkMode ? 'Deep forest theme on' : 'Light cream theme on'}
            action={
              <Switch
                checked={darkMode}
                onCheckedChange={toggleDarkMode}
              />
            }
          />

          <SettingRow
            icon={Bell}
            label="Notifications"
            desc="Reminders for daily scan"
            action={<Switch />}
          />

          <SettingRow
            icon={Volume2}
            label="Sound"
            desc="Play sounds on action"
            action={<Switch defaultChecked />}
          />

          <SettingRow
            icon={Info}
            label="About Us"
            desc="Learn about the app"
            action={
              <button
                onClick={() => setCurrentView('about')}
                className="text-sm font-bold px-3 py-1.5 rounded-lg transition-colors"
                style={{ background: t.pillBg, color: t.accent }}
              >
                Open
              </button>
            }
          />
        </div>

        {/* Credits */}
        <div className="text-center mt-4" style={{ color: t.faint }}>
          <p className="font-medium text-sm">Made with aloha for</p>
          <p className="font-bold" style={{ color: t.muted }}>Hawaiian ecology education</p>
          <p className="text-xs mt-4">Version 1.0.0</p>
        </div>
      </div>
    </div>
  );
}
