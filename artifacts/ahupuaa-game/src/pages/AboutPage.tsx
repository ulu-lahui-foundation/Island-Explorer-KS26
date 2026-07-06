import { useGame } from "@/lib/GameContext";
import { t, useLang } from "@/lib/i18n";
import { ArrowLeft, Leaf, Heart, Sprout, BookOpen } from "lucide-react";

const PAGE_BG = '#245238';
const CARD_BG = '#2A6042';
const ACCENT  = '#5CC882';

export function AboutPage() {
  const { setCurrentView } = useGame();
  useLang(); // re-render on language change

  return (
    <div className="w-full h-full flex flex-col overflow-hidden" style={{ background: PAGE_BG }}>

      <div className="px-4 pt-10 pb-4 shrink-0" style={{ background: PAGE_BG }}>
        <button
          onClick={() => setCurrentView('settings')}
          className="flex items-center gap-1 mb-5 text-sm font-bold"
          style={{ color: 'rgba(255,255,255,0.55)' }}
        >
          <ArrowLeft size={16} />
          {t('back')}
        </button>
        <h1 className="text-4xl font-extrabold leading-tight text-white">
          {t('about_header')}
        </h1>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-28 pt-2 flex flex-col gap-5">

        <div className="rounded-2xl p-6"
          style={{ background: CARD_BG, border: '2px solid rgba(255,255,255,0.10)', boxShadow: '0 6px 18px rgba(0,0,0,0.30)' }}>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full flex items-center justify-center"
              style={{ background: 'rgba(255,255,255,0.10)', color: ACCENT }}>
              <Heart size={20} />
            </div>
            <h2 className="text-xl font-bold text-white">{t('mission_title')}</h2>
          </div>
          <p className="text-sm leading-relaxed font-medium"
            style={{ color: 'rgba(255,255,255,0.60)' }}>
            {t('mission_text')}
          </p>
        </div>

        <div className="rounded-2xl p-6"
          style={{ background: CARD_BG, border: '2px solid rgba(255,255,255,0.10)', boxShadow: '0 6px 18px rgba(0,0,0,0.30)' }}>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full flex items-center justify-center"
              style={{ background: 'rgba(255,255,255,0.10)', color: ACCENT }}>
              <Sprout size={20} />
            </div>
            <h2 className="text-xl font-bold text-white">{t('learn_title')}</h2>
          </div>
          <ul className="flex flex-col gap-3 text-sm font-medium"
            style={{ color: 'rgba(255,255,255,0.60)' }}>
            <li className="flex items-start gap-2">
              <Leaf size={14} className="shrink-0 mt-0.5" style={{ color: ACCENT }} />
              {t('learn_1')}
            </li>
            <li className="flex items-start gap-2">
              <Leaf size={14} className="shrink-0 mt-0.5" style={{ color: ACCENT }} />
              {t('learn_2')}
            </li>
            <li className="flex items-start gap-2">
              <Leaf size={14} className="shrink-0 mt-0.5" style={{ color: ACCENT }} />
              {t('learn_3')}
            </li>
            <li className="flex items-start gap-2">
              <Leaf size={14} className="shrink-0 mt-0.5" style={{ color: ACCENT }} />
              {t('learn_4')}
            </li>
          </ul>
        </div>

        <div className="rounded-2xl p-6"
          style={{ background: CARD_BG, border: '2px solid rgba(255,255,255,0.10)', boxShadow: '0 6px 18px rgba(0,0,0,0.30)' }}>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full flex items-center justify-center"
              style={{ background: 'rgba(255,255,255,0.10)', color: ACCENT }}>
              <BookOpen size={20} />
            </div>
            <h2 className="text-xl font-bold text-white">{t('ahupuaa_title')}</h2>
          </div>
          <p className="text-sm leading-relaxed font-medium"
            style={{ color: 'rgba(255,255,255,0.60)' }}>
            {t('ahupuaa_text')}
          </p>
        </div>

        <div className="text-center mt-6" style={{ color: 'rgba(255,255,255,0.30)' }}>
          <p className="font-medium text-sm">{t('credits_line1')}</p>
          <p className="font-bold" style={{ color: 'rgba(255,255,255,0.45)' }}>{t('credits_line2')}</p>
          <p className="text-xs mt-4">{t('version')} 1.0.0</p>
        </div>
      </div>
    </div>
  );
}
