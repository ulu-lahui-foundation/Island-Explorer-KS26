import { useGame } from "@/lib/GameContext";
import { useTheme } from "@/lib/ThemeContext";
import { ArrowLeft, Volume2, Globe, Moon, Bell, Info } from "lucide-react";
import { Switch } from "@/components/ui/switch";

export function SettingsPage() {
  const { setCurrentView } = useGame();
  const { darkMode, toggleDarkMode } = useTheme();

  const pageBg   = darkMode ? '#245238' : '#F6F1E7';
  const titleCol = darkMode ? '#ffffff' : '#26342F';
  const subCol   = darkMode ? 'rgba(255,255,255,0.55)' : 'rgba(38,52,47,0.55)';
  const cardBg   = darkMode ? '#2A6042' : '#ffffff';
  const cardBorder = darkMode ? 'rgba(255,255,255,0.10)' : 'rgba(47,111,78,0.12)';
  const cardShadow = darkMode ? '0 6px 18px rgba(0,0,0,0.30)' : '0 6px 18px rgba(38,52,47,0.08)';
  const accent   = '#5CC882';

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
          style={{ background: darkMode ? 'rgba(255,255,255,0.10)' : 'rgba(47,111,78,0.10)', color: accent }}>
          <Icon size={20} />
        </div>
        <div>
          <h3 className="font-bold" style={{ color: titleCol }}>{label}</h3>
          <p className="text-sm font-medium" style={{ color: subCol }}>{desc}</p>
        </div>
      </div>
      {action}
    </div>
  );

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

        <h1 className="text-4xl font-extrabold leading-tight" style={{ color: titleCol }}>
          Settings
        </h1>
      </div>

      <div className="flex-1 overflow-y-auto p-4 pb-28 flex flex-col gap-5">

        {/* Main options card */}
        <div className="rounded-2xl p-6 flex flex-col gap-7"
          style={{ background: cardBg, border: `2px solid ${cardBorder}`, boxShadow: cardShadow }}>

          <SettingRow
            icon={Globe}
            label="Language"
            desc="English only"
            action={
              <span className="px-3 py-1 rounded-lg text-sm font-bold"
                style={{ background: darkMode ? 'rgba(255,255,255,0.10)' : 'rgba(47,111,78,0.10)', color: accent }}>
                EN
              </span>
            }
          />

          <SettingRow
            icon={Moon}
            label="Dark Mode"
            desc={darkMode ? "Switched on" : "Switched off"}
            action={<Switch checked={darkMode} onCheckedChange={toggleDarkMode} />}
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
                style={{ background: darkMode ? 'rgba(255,255,255,0.10)' : 'rgba(47,111,78,0.10)', color: accent }}
              >
                Open
              </button>
            }
          />
        </div>

        {/* Credits */}
        <div className="text-center mt-4" style={{ color: darkMode ? 'rgba(255,255,255,0.30)' : 'rgba(38,52,47,0.35)' }}>
          <p className="font-medium text-sm">Made with aloha for</p>
          <p className="font-bold" style={{ color: darkMode ? 'rgba(255,255,255,0.45)' : 'rgba(38,52,47,0.50)' }}>Hawaiian ecology education</p>
          <p className="text-xs mt-4">Version 1.0.0</p>
        </div>
      </div>
    </div>
  );
}
