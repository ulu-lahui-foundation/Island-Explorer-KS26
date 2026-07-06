import { useGame } from "@/lib/GameContext";
import { ArrowLeft, Leaf, Heart, Sprout, BookOpen } from "lucide-react";

export function AboutPage() {
  const { setCurrentView, darkMode } = useGame();

  const t = darkMode
    ? {
        bg: '#245238',
        cardBg: '#2A6042',
        border: 'rgba(255,255,255,0.10)',
        text: '#ffffff',
        title: '#ffffff',
        sub: 'rgba(255,255,255,0.60)',
        muted: 'rgba(255,255,255,0.55)',
        faint: 'rgba(255,255,255,0.30)',
        accent: '#5CC882',
        iconBg: 'rgba(255,255,255,0.10)',
      }
    : {
        bg: '#F6F1E7',
        cardBg: '#ffffff',
        border: 'rgba(47,111,78,0.15)',
        text: '#26342F',
        title: '#26342F',
        sub: 'rgba(38,52,47,0.65)',
        muted: 'rgba(38,52,47,0.55)',
        faint: 'rgba(38,52,47,0.30)',
        accent: '#2F6F4E',
        iconBg: 'rgba(47,111,78,0.10)',
      };

  return (
    <div className="w-full h-full flex flex-col overflow-hidden" style={{ background: t.bg }}>

      <div className="px-4 pt-10 pb-4 shrink-0" style={{ background: t.bg }}>
        <button
          onClick={() => setCurrentView('settings')}
          className="flex items-center gap-1 mb-5 text-sm font-bold"
          style={{ color: t.muted }}
        >
          <ArrowLeft size={16} />
          Back
        </button>

        <h1 className="text-4xl font-extrabold leading-tight" style={{ color: t.title }}>
          About Us
        </h1>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-28 pt-2 flex flex-col gap-5">

        {/* Mission */}
        <div className="rounded-2xl p-6"
          style={{ background: t.cardBg, border: `2px solid ${t.border}`, boxShadow: '0 6px 18px rgba(0,0,0,0.12)' }}>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full flex items-center justify-center"
              style={{ background: t.iconBg, color: t.accent }}>
              <Heart size={20} />
            </div>
            <h2 className="text-xl font-bold" style={{ color: t.title }}>Our Mission</h2>
          </div>
          <p className="text-sm leading-relaxed font-medium" style={{ color: t.sub }}>
            Ahupua\u02bba Explorer was built to help keiki (children) connect with the land
            through the lens of the ahupua\u02bba — the traditional Hawaiian land-division system
            that stretches from mountain to sea.
          </p>
        </div>

        {/* What kids learn */}
        <div className="rounded-2xl p-6"
          style={{ background: t.cardBg, border: `2px solid ${t.border}`, boxShadow: '0 6px 18px rgba(0,0,0,0.12)' }}>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full flex items-center justify-center"
              style={{ background: t.iconBg, color: t.accent }}>
              <Sprout size={20} />
            </div>
            <h2 className="text-xl font-bold" style={{ color: t.title }}>What You Will Learn</h2>
          </div>
          <ul className="flex flex-col gap-3 text-sm font-medium" style={{ color: t.sub }}>
            <li className="flex items-start gap-2">
              <Leaf size={14} className="shrink-0 mt-0.5" style={{ color: t.accent }} />
              Recognize native Hawaiian plants in the wild
            </li>
            <li className="flex items-start gap-2">
              <Leaf size={14} className="shrink-0 mt-0.5" style={{ color: t.accent }} />
              Understand where each plant belongs in the ecosystem
            </li>
            <li className="flex items-start gap-2">
              <Leaf size={14} className="shrink-0 mt-0.5" style={{ color: t.accent }} />
              Explore the three zones: Uka (mountain), Kula (plain), Kai (sea)
            </li>
            <li className="flex items-start gap-2">
              <Leaf size={14} className="shrink-0 mt-0.5" style={{ color: t.accent }} />
              Build your own ahupua\u02bba by placing plants on the map
            </li>
          </ul>
        </div>

        {/* Ahupua'a meaning */}
        <div className="rounded-2xl p-6"
          style={{ background: t.cardBg, border: `2px solid ${t.border}`, boxShadow: '0 6px 18px rgba(0,0,0,0.12)' }}>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full flex items-center justify-center"
              style={{ background: t.iconBg, color: t.accent }}>
              <BookOpen size={20} />
            </div>
            <h2 className="text-xl font-bold" style={{ color: t.title }}>Ahupua\u02bba</h2>
          </div>
          <p className="text-sm leading-relaxed font-medium" style={{ color: t.sub }}>
            An <span style={{ color: t.accent, fontWeight: 700 }}>ahupua\u02bba</span> is a traditional Hawaiian land division
            that runs from the mountain peaks (
            <em>uka</em>) down through the agricultural plains (
            <em>kula</em>) all the way to the ocean (
            <em>kai</em>). Each section provided the resources needed for a sustainable community.
          </p>
        </div>

        <div className="text-center mt-6" style={{ color: t.faint }}>
          <p className="font-medium text-sm">Made with aloha for</p>
          <p className="font-bold" style={{ color: t.muted }}>Hawaiian ecology education</p>
          <p className="text-xs mt-4">Version 1.0.0</p>
        </div>
      </div>
    </div>
  );
}
