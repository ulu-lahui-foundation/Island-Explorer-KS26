import { useGame } from "@/lib/GameContext";
import { ArrowLeft, Volume2, Globe, Type } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";

const PAGE_BG = '#245238';
const CARD_BG = '#2A6042';
const ACCENT  = '#5CC882';

export function SettingsPage() {
  const { setCurrentView } = useGame();

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

      <div className="flex-1 overflow-y-auto p-4 pb-28 flex flex-col gap-6">

        {/* Options card */}
        <div className="rounded-2xl p-6 flex flex-col gap-8"
          style={{ background: CARD_BG, border: '2px solid rgba(255,255,255,0.10)', boxShadow: '0 6px 18px rgba(0,0,0,0.30)' }}>

          {/* Sound */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full flex items-center justify-center"
                style={{ background: 'rgba(255,255,255,0.10)', color: ACCENT }}>
                <Volume2 size={20} />
              </div>
              <div>
                <h3 className="font-bold text-white">Sound Effects</h3>
                <p className="text-sm font-medium" style={{ color: 'rgba(255,255,255,0.45)' }}>Play sounds on action</p>
              </div>
            </div>
            <Switch defaultChecked />
          </div>

          {/* Text Size */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full flex items-center justify-center"
                style={{ background: 'rgba(255,255,255,0.10)', color: ACCENT }}>
                <Type size={20} />
              </div>
              <div>
                <h3 className="font-bold text-white">Text Size</h3>
                <p className="text-sm font-medium" style={{ color: 'rgba(255,255,255,0.45)' }}>Adjust readability</p>
              </div>
            </div>
            <div className="px-2">
              <Slider defaultValue={[50]} max={100} step={50} />
              <div className="flex justify-between text-xs font-bold mt-2"
                style={{ color: 'rgba(255,255,255,0.35)' }}>
                <span>A</span><span>A</span><span className="text-lg">A</span>
              </div>
            </div>
          </div>

          {/* Language */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full flex items-center justify-center"
                style={{ background: 'rgba(255,255,255,0.10)', color: ACCENT }}>
                <Globe size={20} />
              </div>
              <div>
                <h3 className="font-bold text-white">Language</h3>
                <p className="text-sm font-medium" style={{ color: 'rgba(255,255,255,0.45)' }}>English only</p>
              </div>
            </div>
            <span className="px-3 py-1 rounded-lg text-sm font-bold"
              style={{ background: 'rgba(255,255,255,0.10)', color: ACCENT }}>
              EN
            </span>
          </div>
        </div>

        {/* Credits */}
        <div className="text-center mt-2" style={{ color: 'rgba(255,255,255,0.35)' }}>
          <p className="font-medium text-sm">Made with aloha for</p>
          <p className="font-bold" style={{ color: 'rgba(255,255,255,0.50)' }}>Hawaiian ecology education</p>
          <p className="text-xs mt-4">Version 1.0.0</p>
        </div>
      </div>
    </div>
  );
}
