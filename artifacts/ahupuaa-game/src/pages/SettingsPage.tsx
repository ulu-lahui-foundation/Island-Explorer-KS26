import { useGame } from "@/lib/GameContext";
import { ArrowLeft, Volume2, Globe, Moon, Bell, Info } from "lucide-react";
import { Switch } from "@/components/ui/switch";

const PAGE_BG = '#245238';
const CARD_BG = '#2A6042';
const ACCENT  = '#5CC882';

export function SettingsPage() {
  const { setCurrentView } = useGame();

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
          style={{ background: 'rgba(255,255,255,0.10)', color: ACCENT }}>
          <Icon size={20} />
        </div>
        <div>
          <h3 className="font-bold text-white">{label}</h3>
          <p className="text-sm font-medium" style={{ color: 'rgba(255,255,255,0.45)' }}>{desc}</p>
        </div>
      </div>
      {action}
    </div>
  );

  return (
    <div className="w-full h-full flex flex-col" style={{ background: PAGE_BG }}>

      {/* Header */}
      <div className="px-4 pt-10 pb-4" style={{ background: PAGE_BG }}>
        <button
          onClick={() => setCurrentView('piko')}
          className="flex items-center gap-1 mb-5 text-sm font-bold"
          style={{ color: 'rgba(255,255,255,0.55)' }}
        >
          <ArrowLeft size={16} />
          Back
        </button>

        <h1 className="text-4xl font-extrabold leading-tight text-white">
          Settings
        </h1>
      </div>

      <div className="flex-1 overflow-y-auto p-4 pb-28 flex flex-col gap-5">

        {/* Main options card */}
        <div className="rounded-2xl p-6 flex flex-col gap-7"
          style={{ background: CARD_BG, border: '2px solid rgba(255,255,255,0.10)', boxShadow: '0 6px 18px rgba(0,0,0,0.30)' }}>

          <SettingRow
            icon={Globe}
            label="Language"
            desc="English only"
            action={
              <span className="px-3 py-1 rounded-lg text-sm font-bold"
                style={{ background: 'rgba(255,255,255,0.10)', color: ACCENT }}>
                EN
              </span>
            }
          />

          <SettingRow
            icon={Moon}
            label="Dark Mode"
            desc="Always on in this version"
            action={<Switch defaultChecked disabled />}
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
                style={{ background: 'rgba(255,255,255,0.10)', color: ACCENT }}
              >
                Open
              </button>
            }
          />
        </div>

        {/* Credits */}
        <div className="text-center mt-4" style={{ color: 'rgba(255,255,255,0.30)' }}>
          <p className="font-medium text-sm">Made with aloha for</p>
          <p className="font-bold" style={{ color: 'rgba(255,255,255,0.45)' }}>Hawaiian ecology education</p>
          <p className="text-xs mt-4">Version 1.0.0</p>
        </div>
      </div>
    </div>
  );
}
