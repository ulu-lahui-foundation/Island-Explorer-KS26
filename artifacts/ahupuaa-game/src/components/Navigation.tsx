import { Map, Camera, Target } from "lucide-react";
import { useGame } from "@/lib/GameContext";

export function Navigation() {
  const { currentView, setCurrentView } = useGame();

  const isViewActive = (views: string[]) => views.includes(currentView);

  return (
    <div className="fixed bottom-0 left-0 right-0 max-w-[430px] mx-auto bg-white border-t border-green-100 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] z-50">
      <div className="flex justify-around items-center h-20 px-6">
        <button
          onClick={() => setCurrentView('ahupuaa')}
          className={`flex flex-col items-center justify-center w-20 h-full transition-colors ${
            isViewActive(['ahupuaa']) ? 'text-primary scale-110' : 'text-gray-400 hover:text-primary/70'
          }`}
        >
          <div className={`p-2 rounded-full mb-1 transition-colors ${isViewActive(['ahupuaa']) ? 'bg-primary/10' : ''}`}>
            <Map size={28} strokeWidth={isViewActive(['ahupuaa']) ? 2.5 : 2} />
          </div>
          <span className="text-[11px] font-bold tracking-wide uppercase">Map</span>
        </button>

        <button
          onClick={() => setCurrentView('camera')}
          className={`flex flex-col items-center justify-center w-20 h-full transition-colors ${
            isViewActive(['camera']) ? 'text-accent scale-110' : 'text-gray-400 hover:text-accent/70'
          }`}
        >
          <div className={`p-2 rounded-full mb-1 transition-colors ${isViewActive(['camera']) ? 'bg-accent/10' : ''}`}>
            <Camera size={28} strokeWidth={isViewActive(['camera']) ? 2.5 : 2} />
          </div>
          <span className="text-[11px] font-bold tracking-wide uppercase">Scan</span>
        </button>

        <button
          onClick={() => setCurrentView('piko')}
          className={`flex flex-col items-center justify-center w-20 h-full transition-colors ${
            isViewActive(['piko', 'plant_index', 'tasks', 'settings']) ? 'text-secondary-foreground scale-110' : 'text-gray-400 hover:text-secondary-foreground/70'
          }`}
        >
          <div className={`p-2 rounded-full mb-1 transition-colors ${isViewActive(['piko', 'plant_index', 'tasks', 'settings']) ? 'bg-secondary/20' : ''}`}>
            <Target size={28} strokeWidth={isViewActive(['piko', 'plant_index', 'tasks', 'settings']) ? 2.5 : 2} />
          </div>
          <span className="text-[11px] font-bold tracking-wide uppercase">Piko</span>
        </button>
      </div>
    </div>
  );
}
