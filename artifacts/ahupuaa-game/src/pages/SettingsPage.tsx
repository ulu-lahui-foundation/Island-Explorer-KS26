import { useGame } from "@/lib/GameContext";
import { ArrowLeft, Volume2, Globe, Type } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";

export function SettingsPage() {
  const { setCurrentView } = useGame();

  return (
    <div className="w-full h-full flex flex-col" style={{ background: '#F6F1E7' }}>

      {/* Header */}
      <div className="px-4 pt-8 pb-4 shadow-sm z-10"
        style={{ background: 'rgba(246,241,231,0.97)', borderBottom: '1px solid rgba(47,111,78,0.12)' }}>
        <button
          onClick={() => setCurrentView('piko')}
          className="flex items-center font-bold mb-4 transition-colors"
          style={{ color: '#2F6F4E' }}
        >
          <ArrowLeft className="mr-2" size={20} />
          Back to Piko
        </button>
        <h1 className="text-3xl font-bold tracking-tight" style={{ color: '#26342F' }}>Settings</h1>
      </div>

      <div className="flex-1 overflow-y-auto p-4 pb-24 flex flex-col gap-6">

        {/* Options card */}
        <div className="rounded-3xl p-6 shadow-sm flex flex-col gap-8"
          style={{ background: 'rgba(246,241,231,0.85)', border: '1px solid rgba(47,111,78,0.12)' }}>

          {/* Sound */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full flex items-center justify-center"
                style={{ background: 'rgba(47,111,78,0.12)', color: '#2F6F4E' }}>
                <Volume2 size={20} />
              </div>
              <div>
                <h3 className="font-bold" style={{ color: '#26342F' }}>Sound Effects</h3>
                <p className="text-sm font-medium" style={{ color: 'rgba(38,52,47,0.50)' }}>Play sounds on action</p>
              </div>
            </div>
            <Switch defaultChecked />
          </div>

          {/* Text Size */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full flex items-center justify-center"
                style={{ background: 'rgba(47,111,78,0.12)', color: '#2F6F4E' }}>
                <Type size={20} />
              </div>
              <div>
                <h3 className="font-bold" style={{ color: '#26342F' }}>Text Size</h3>
                <p className="text-sm font-medium" style={{ color: 'rgba(38,52,47,0.50)' }}>Adjust readability</p>
              </div>
            </div>
            <div className="px-2">
              <Slider defaultValue={[50]} max={100} step={50} />
              <div className="flex justify-between text-xs font-bold mt-2"
                style={{ color: 'rgba(47,111,78,0.45)' }}>
                <span>A</span><span>A</span><span className="text-lg">A</span>
              </div>
            </div>
          </div>

          {/* Language */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full flex items-center justify-center"
                style={{ background: 'rgba(47,111,78,0.12)', color: '#2F6F4E' }}>
                <Globe size={20} />
              </div>
              <div>
                <h3 className="font-bold" style={{ color: '#26342F' }}>Language</h3>
                <p className="text-sm font-medium" style={{ color: 'rgba(38,52,47,0.50)' }}>English only</p>
              </div>
            </div>
            <span className="px-3 py-1 rounded-lg text-sm font-bold"
              style={{ background: 'rgba(47,111,78,0.10)', color: '#2F6F4E' }}>
              EN
            </span>
          </div>
        </div>

        {/* Credits */}
        <div className="text-center mt-4" style={{ color: 'rgba(38,52,47,0.40)' }}>
          <p className="font-medium text-sm">Made with aloha for</p>
          <p className="font-bold" style={{ color: 'rgba(38,52,47,0.55)' }}>Hawaiian ecology education</p>
          <p className="text-xs mt-4">Version 1.0.0</p>
        </div>
      </div>
    </div>
  );
}
