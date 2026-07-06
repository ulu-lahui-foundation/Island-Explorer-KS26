import { useGame } from "@/lib/GameContext";
import { ArrowLeft, Leaf, Heart, Sprout, BookOpen } from "lucide-react";

const PAGE_BG = '#245238';
const CARD_BG = '#2A6042';
const ACCENT  = '#5CC882';

export function AboutPage() {
  const { setCurrentView } = useGame();

  return (
    <div className="w-full h-full flex flex-col overflow-hidden" style={{ background: PAGE_BG }}>

      {/* Header */}
      <div className="px-4 pt-10 pb-4 shrink-0" style={{ background: PAGE_BG }}>
        <button
          onClick={() => setCurrentView('settings')}
          className="flex items-center gap-1 mb-5 text-sm font-bold"
          style={{ color: 'rgba(255,255,255,0.55)' }}
        >
          <ArrowLeft size={16} />
          Back
        </button>

        <h1 className="text-4xl font-extrabold leading-tight text-white">
          About Us
        </h1>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 pb-28 pt-2 flex flex-col gap-5">

        {/* Mission card */}
        <div className="rounded-2xl p-6"
          style={{ background: CARD_BG, border: '2px solid rgba(255,255,255,0.10)', boxShadow: '0 6px 18px rgba(0,0,0,0.30)' }}>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full flex items-center justify-center"
              style={{ background: 'rgba(255,255,255,0.10)', color: ACCENT }}>
              <Heart size={20} />
            </div>
            <h2 className="text-xl font-bold text-white">Our Mission</h2>
          </div>
          <p className="text-sm leading-relaxed font-medium"
            style={{ color: 'rgba(255,255,255,0.60)' }}>
            Ahupuaʻa Explorer was built to help keiki (children) connect with the land
            through the lens of the ahupuaʻa — the traditional Hawaiian land-division system
            that stretches from mountain to sea.
          </p>
        </div>

        {/* What kids learn */}
        <div className="rounded-2xl p-6"
          style={{ background: CARD_BG, border: '2px solid rgba(255,255,255,0.10)', boxShadow: '0 6px 18px rgba(0,0,0,0.30)' }}>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full flex items-center justify-center"
              style={{ background: 'rgba(255,255,255,0.10)', color: ACCENT }}>
              <Sprout size={20} />
            </div>
            <h2 className="text-xl font-bold text-white">What You Will Learn</h2>
          </div>
          <ul className="flex flex-col gap-3 text-sm font-medium"
            style={{ color: 'rgba(255,255,255,0.60)' }}>
            <li className="flex items-start gap-2">
              <Leaf size={14} className="shrink-0 mt-0.5" style={{ color: ACCENT }} />
              Recognize native Hawaiian plants in the wild
            </li>
            <li className="flex items-start gap-2">
              <Leaf size={14} className="shrink-0 mt-0.5" style={{ color: ACCENT }} />
              Understand where each plant belongs in the ecosystem
            </li>
            <li className="flex items-start gap-2">
              <Leaf size={14} className="shrink-0 mt-0.5" style={{ color: ACCENT }} />
              Explore the three zones: Uka (mountain), Kula (plain), Kai (sea)
            </li>
            <li className="flex items-start gap-2">
              <Leaf size={14} className="shrink-0 mt-0.5" style={{ color: ACCENT }} />
              Build your own ahupuaʻa by placing plants on the map
            </li>
          </ul>
        </div>

        {/* Ahupua'a meaning */}
        <div className="rounded-2xl p-6"
          style={{ background: CARD_BG, border: '2px solid rgba(255,255,255,0.10)', boxShadow: '0 6px 18px rgba(0,0,0,0.30)' }}>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full flex items-center justify-center"
              style={{ background: 'rgba(255,255,255,0.10)', color: ACCENT }}>
              <BookOpen size={20} />
            </div>
            <h2 className="text-xl font-bold text-white">Ahupuaʻa</h2>
          </div>
          <p className="text-sm leading-relaxed font-medium"
            style={{ color: 'rgba(255,255,255,0.60)' }}>
            An <span style={{ color: ACCENT, fontWeight: 700 }}>ahupuaʻa</span> is a traditional Hawaiian land division
            that runs from the mountain peaks (
            <em>uka</em>) down through the agricultural plains (
            <em>kula</em>) all the way to the ocean (
            <em>kai</em>). Each section provided the resources needed for a sustainable community.
          </p>
        </div>

        {/* Footer */}
        <div className="text-center mt-6" style={{ color: 'rgba(255,255,255,0.30)' }}>
          <p className="font-medium text-sm">Made with aloha for</p>
          <p className="font-bold" style={{ color: 'rgba(255,255,255,0.45)' }}>Hawaiian ecology education</p>
          <p className="text-xs mt-4">Version 1.0.0</p>
        </div>
      </div>
    </div>
  );
}
