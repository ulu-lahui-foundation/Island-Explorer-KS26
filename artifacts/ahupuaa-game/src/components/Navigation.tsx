import { Map, Camera, Target } from "lucide-react";
import { useGame } from "@/lib/GameContext";

export function Navigation() {
  const { currentView, setCurrentView } = useGame();

  const isViewActive = (views: string[]) => views.includes(currentView);

  return (
    <div className="fixed bottom-0 left-0 right-0 max-w-[430px] mx-auto bg-[#F6F1E7] border-t border-[#2F6F4E]/15 shadow-[0_-4px_24px_rgba(38,52,47,0.08)] z-50">
      <div className="flex justify-around items-center h-20 px-6">

        <button
          data-testid="nav-map"
          onClick={() => setCurrentView('ahupuaa')}
          className={`flex flex-col items-center justify-center w-20 h-full transition-all ${
            isViewActive(['ahupuaa'])
              ? 'text-[#2F6F4E] scale-110'
              : 'text-[#26342F]/35 hover:text-[#2F6F4E]/70'
          }`}
        >
          <div className={`p-2 rounded-full mb-1 transition-colors ${isViewActive(['ahupuaa']) ? 'bg-[#2F6F4E]/12' : ''}`}>
            <Map size={26} strokeWidth={isViewActive(['ahupuaa']) ? 2.5 : 2} />
          </div>
          <span className="text-[11px] font-bold tracking-wide uppercase">Map</span>
        </button>

        <button
          data-testid="nav-scan"
          onClick={() => setCurrentView('camera')}
          className={`flex flex-col items-center justify-center w-20 h-full transition-all ${
            isViewActive(['camera'])
              ? 'text-[#7BC96F] scale-110'
              : 'text-[#26342F]/35 hover:text-[#7BC96F]/70'
          }`}
        >
          <div className={`p-2 rounded-full mb-1 transition-colors ${isViewActive(['camera']) ? 'bg-[#7BC96F]/15' : ''}`}>
            <Camera size={26} strokeWidth={isViewActive(['camera']) ? 2.5 : 2} />
          </div>
          <span className="text-[11px] font-bold tracking-wide uppercase">Scan</span>
        </button>

        <button
          data-testid="nav-piko"
          onClick={() => setCurrentView('piko')}
          className={`flex flex-col items-center justify-center w-20 h-full transition-all ${
            isViewActive(['piko', 'plant_index', 'tasks', 'settings'])
              ? 'text-[#2F6F4E] scale-110'
              : 'text-[#26342F]/35 hover:text-[#2F6F4E]/70'
          }`}
        >
          <div className={`p-2 rounded-full mb-1 transition-colors ${isViewActive(['piko', 'plant_index', 'tasks', 'settings']) ? 'bg-[#2F6F4E]/12' : ''}`}>
            <Target size={26} strokeWidth={isViewActive(['piko', 'plant_index', 'tasks', 'settings']) ? 2.5 : 2} />
          </div>
          <span className="text-[11px] font-bold tracking-wide uppercase">Piko</span>
        </button>

      </div>
    </div>
  );
}
