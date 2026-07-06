import { useGame } from "@/lib/GameContext";
import { useTheme } from "@/lib/ThemeContext";
import { ArrowLeft, Leaf, Heart, Sprout, BookOpen } from "lucide-react";

export function AboutPage() {
  const { setCurrentView } = useGame();
  const { darkMode } = useTheme();

  const pageBg   = darkMode ? '#245238' : '#F6F1E7';
  const titleCol = darkMode ? '#ffffff' : '#26342F';
  const subCol   = darkMode ? 'rgba(255,255,255,0.55)' : 'rgba(38,52,47,0.55)';
  const cardBg   = darkMode ? '#2A6042' : '#ffffff';
  const cardBorder = darkMode ? 'rgba(255,255,255,0.10)' : 'rgba(47,111,78,0.12)';
  const cardShadow = darkMode ? '0 6px 18px rgba(0,0,0,0.30)' : '0 6px 18px rgba(38,52,47,0.08)';
  const textCol  = darkMode ? 'rgba(255,255,255,0.60)' : 'rgba(38,52,47,0.65)';
  const accent   = '#5CC882';

  return (
    <div className="w-full h-full flex flex-col overflow-hidden" style={{ background: pageBg }}>

      {/* Header */}
      <div className="px-4 pt-10 pb-4 shrink-0" style={{ background: pageBg }}>
        <button
          onClick={() => setCurrentView('settings')}
          className="flex items-center gap-1 mb-5 text-sm font-bold"
          style={{ color: subCol }}
        >
          <ArrowLeft size={16} />
          Back
        </button>

        <h1 className="text-4xl font-extrabold leading-tight" style={{ color: titleCol }}>
          About Us
        </h1>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 pb-28 pt-2 flex flex-col gap-5">

        {/* Mission card */}
        <div className="rounded-2xl p-6"
          style={{ background: cardBg, border: `2px solid ${cardBorder}`, boxShadow: cardShadow }}>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full flex items-center justify-center"
              style={{ background: darkMode ? 'rgba(255,255,255,0.10)' : 'rgba(47,111,78,0.10)', color: accent }}>
              <Heart size={20} />
            </div>
            <h2 className="text-xl font-bold" style={{ color: titleCol }}>Our Mission</h2>
          </div>
          <p className="text-sm leading-relaxed font-medium" style={{ color: textCol }}>
            Ahupuaʻa Explorer was built to help keiki (children) connect with the land
            through the lens of the ahupuaʻa — the traditional Hawaiian land-division system
            that stretches from mountain to sea.
          </p>
        </div>

        {/* What kids learn */}
        <div className="rounded-2xl p-6"
          style={{ background: cardBg, border: `2px solid ${cardBorder}`, boxShadow: cardShadow }}>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full flex items-center justify-center"
              style={{ background: darkMode ? 'rgba(255,255,255,0.10)' : 'rgba(47,111,78,0.10)', color: accent }}>
              <Sprout size={20} />
            </div>
            <h2 className="text-xl font-bold" style={{ color: titleCol }}>What You Will Learn</h2>
          </div>
          <ul className="flex flex-col gap-3 text-sm font-medium" style={{ color: textCol }}>
            <li className="flex items-start gap-2">
              <Leaf size={14} className="shrink-0 mt-0.5" style={{ color: accent }} />
              Recognize native Hawaiian plants in the wild
            </li>
            <li className="flex items-start gap-2">
              <Leaf size={14} className="shrink-0 mt-0.5" style={{ color: accent }} />
              Understand where each plant belongs in the ecosystem
            </li>
            <li className="flex items-start gap-2">
              <Leaf size={14} className="shrink-0 mt-0.5" style={{ color: accent }} />
              Explore the three zones: Uka (mountain), Kula (plain), Kai (sea)
            </li>
            <li className="flex items-start gap-2">
              <Leaf size={14} className="shrink-0 mt-0.5" style={{ color: accent }} />
              Build your own ahupuaʻa by placing plants on the map
            </li>
          </ul>
        </div>

        {/* Ahupua'a meaning */}
        <div className="rounded-2xl p-6"
          style={{ background: cardBg, border: `2px solid ${cardBorder}`, boxShadow: cardShadow }}>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full flex items-center justify-center"
              style={{ background: darkMode ? 'rgba(255,255,255,0.10)' : 'rgba(47,111,78,0.10)', color: accent }}>
              <BookOpen size={20} />
            </div>
            <h2 className="text-xl font-bold" style={{ color: titleCol }}>Ahupuaʻa</h2>
          </div>
          <p className="text-sm leading-relaxed font-medium" style={{ color: textCol }}>
            An <span style={{ color: accent, fontWeight: 700 }}>ahupuaʻa</span> is a traditional Hawaiian land division
            that runs from the mountain peaks (
            <em>uka</em>) down through the agricultural plains (
            <em>kula</em>) all the way to the ocean (
            <em>kai</em>). Each section provided the resources needed for a sustainable community.
          </p>
        </div>

        {/* Footer */}
        <div className="text-center mt-6" style={{ color: darkMode ? 'rgba(255,255,255,0.30)' : 'rgba(38,52,47,0.30)' }}>
          <p className="font-medium text-sm">Made with aloha for</p>
          <p className="font-bold" style={{ color: darkMode ? 'rgba(255,255,255,0.45)' : 'rgba(38,52,47,0.45)' }}>Hawaiian ecology education</p>
          <p className="text-xs mt-4">Version 1.0.0</p>
        </div>
      </div>
    </div>
  );
}
