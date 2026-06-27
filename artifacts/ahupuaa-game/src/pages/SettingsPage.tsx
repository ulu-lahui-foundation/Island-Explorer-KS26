import { useGame } from "@/lib/GameContext";
import { ArrowLeft, Volume2, Globe, Type } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";

export function SettingsPage() {
  const { setCurrentView } = useGame();

  return (
    <div className="w-full h-full bg-slate-50 flex flex-col">
      <div className="bg-white px-4 pt-8 pb-4 shadow-sm z-10">
        <button 
          onClick={() => setCurrentView('piko')}
          className="flex items-center text-gray-500 hover:text-gray-900 font-bold mb-4"
        >
          <ArrowLeft className="mr-2" size={20} />
          Back to Piko
        </button>
        
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Settings</h1>
      </div>

      <div className="flex-1 overflow-y-auto p-4 pb-24 flex flex-col gap-6">
        
        <div className="bg-white rounded-3xl p-6 shadow-sm flex flex-col gap-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                <Volume2 size={20} />
              </div>
              <div>
                <h3 className="font-bold text-gray-900">Sound Effects</h3>
                <p className="text-sm font-medium text-gray-500">Play sounds on action</p>
              </div>
            </div>
            <Switch defaultChecked />
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                <Type size={20} />
              </div>
              <div>
                <h3 className="font-bold text-gray-900">Text Size</h3>
                <p className="text-sm font-medium text-gray-500">Adjust readability</p>
              </div>
            </div>
            <div className="px-2">
              <Slider defaultValue={[50]} max={100} step={50} />
              <div className="flex justify-between text-xs font-bold text-gray-400 mt-2">
                <span>A</span>
                <span>A</span>
                <span className="text-lg">A</span>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                <Globe size={20} />
              </div>
              <div>
                <h3 className="font-bold text-gray-900">Language</h3>
                <p className="text-sm font-medium text-gray-500">English only</p>
              </div>
            </div>
            <span className="px-3 py-1 bg-gray-100 rounded-lg text-sm font-bold text-gray-600">
              EN
            </span>
          </div>
        </div>

        <div className="mt-8 text-center text-gray-400">
          <p className="font-medium text-sm">Made with aloha for</p>
          <p className="font-bold text-gray-500">Hawaiian ecology education</p>
          <p className="text-xs mt-4">Version 1.0.0</p>
        </div>
      </div>
    </div>
  );
}
