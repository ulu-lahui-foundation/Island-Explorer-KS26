import { useState } from "react";
import { useGame } from "@/lib/GameContext";
import { t, setLang, getLang, useLang } from "@/lib/i18n";
import { ArrowLeft, Volume2, Globe, Moon, Bell, Info } from "lucide-react";
import { Switch } from "@/components/ui/switch";

const PAGE_BG = '#245238';
const CARD_BG = '#2A6042';
const ACCENT  = '#5CC882';

export function SettingsPage() {
  const { setCurrentView } = useGame();
  useLang(); // re-render on language change

  const [langLabel, setLangLabel] = useState(getLang() === 'haw' ? 'HAW' : 'EN');

  const toggleLanguage = () => {
    const next = getLang() === 'en' ? 'haw' : 'en';
    setLang(next);
    setLangLabel(next === 'haw' ? 'HAW' : 'EN');
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
      <div className="px-4 pt-10 pb-4" style={{ background: PAGE_BG }}>
        <button
          onClick={() => setCurrentView('piko')}
          className="flex items-center gap-1 mb-5 text-sm font-bold"
          style={{ color: 'rgba(255,255,255,0.55)' }}
        >
          <ArrowLeft size={16} />
          {t('back')}
        </button>
        <h1 className="text-4xl font-extrabold leading-tight text-white">
          {t('settings_header')}
        </h1>
      </div>

      <div className="flex-1 overflow-y-auto p-4 pb-28 flex flex-col gap-5">
        <div className="rounded-2xl p-6 flex flex-col gap-7"
          style={{ background: CARD_BG, border: '2px solid rgba(255,255,255,0.10)', boxShadow: '0 6px 18px rgba(0,0,0,0.30)' }}>

          <SettingRow
            icon={Globe}
            label={t('language')}
            desc={t('language_desc')}
            action={
              <button
                onClick={toggleLanguage}
                className="text-sm font-bold px-3 py-1.5 rounded-lg transition-colors active:scale-95"
                style={{ background: 'rgba(255,255,255,0.10)', color: ACCENT }}
              >
                {langLabel}
              </button>
            }
          />

          <SettingRow
            icon={Moon}
            label={t('dark_mode')}
            desc={t('dark_mode_desc')}
            action={<Switch defaultChecked disabled />}
          />

          <SettingRow
            icon={Bell}
            label={t('notifications')}
            desc={t('notifications_desc')}
            action={<Switch />}
          />

          <SettingRow
            icon={Volume2}
            label={t('sound')}
            desc={t('sound_desc')}
            action={<Switch defaultChecked />}
          />

          <SettingRow
            icon={Info}
            label={t('about_us')}
            desc={t('about_us_desc')}
            action={
              <button
                onClick={() => setCurrentView('about')}
                className="text-sm font-bold px-3 py-1.5 rounded-lg transition-colors"
                style={{ background: 'rgba(255,255,255,0.10)', color: ACCENT }}
              >
                {t('open')}
              </button>
            }
          />
        </div>

        <div className="text-center mt-4" style={{ color: 'rgba(255,255,255,0.30)' }}>
          <p className="font-medium text-sm">{t('credits_line1')}</p>
          <p className="font-bold" style={{ color: 'rgba(255,255,255,0.45)' }}>{t('credits_line2')}</p>
          <p className="text-xs mt-4">{t('version')} 1.0.0</p>
        </div>
      </div>
    </div>
  );
}
