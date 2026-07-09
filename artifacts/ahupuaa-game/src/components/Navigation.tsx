import { Map, Camera, Target } from "lucide-react";
import { useGame } from "@/lib/GameContext";

export function Navigation() {
  const { currentView, setCurrentView, darkMode } = useGame();

  const isViewActive = (views: string[]) => views.includes(currentView);

  const nav = darkMode
    ? {
        bg: '#1D4A30',
        border: 'rgba(255,255,255,0.08)',
        shadow: '0 -4px 24px rgba(0,0,0,0.30)',
        activeMap:  '#7BC96F',
        activeScan: '#7BC96F',
        activePiko: '#7BC96F',
        inactive: 'rgba(255,255,255,0.30)',
        activePillMap:  'rgba(123,201,111,0.15)',
        activePillScan: 'rgba(123,201,111,0.15)',
        activePillPiko: 'rgba(123,201,111,0.15)',
      }
    : {
        bg: '#F6F1E7',
        border: 'rgba(47,111,78,0.15)',
        shadow: '0 -4px 24px rgba(38,52,47,0.08)',
        activeMap:  '#2F6F4E',
        activeScan: '#7BC96F',
        activePiko: '#2F6F4E',
        inactive: 'rgba(38,52,47,0.35)',
        activePillMap:  'rgba(47,111,78,0.12)',
        activePillScan: 'rgba(123,201,111,0.15)',
        activePillPiko: 'rgba(47,111,78,0.12)',
      };

  return (
    <div
      className="fixed bottom-0 left-0 right-0 max-w-[430px] mx-auto z-50"
      style={{
        background: nav.bg,
        borderTop: `1px solid ${nav.border}`,
        boxShadow: nav.shadow,
      }}
    >
      <div className="flex justify-around items-center h-20 px-6">

        <button
          data-testid="nav-map"
          onClick={() => setCurrentView('ahupuaa')}
          className="flex flex-col items-center justify-center w-20 h-full transition-all"
          style={{
            color: isViewActive(['ahupuaa']) ? nav.activeMap : nav.inactive,
            transform: isViewActive(['ahupuaa']) ? 'scale(1.10)' : 'scale(1)',
          }}
        >
          <div
            className="p-2 rounded-full mb-1 transition-colors"
            style={{ background: isViewActive(['ahupuaa']) ? nav.activePillMap : 'transparent' }}
          >
            <Map size={26} strokeWidth={isViewActive(['ahupuaa']) ? 2.5 : 2} />
          </div>
          <span className="text-[11px] font-bold tracking-wide uppercase">Ahupua'a</span>
        </button>

        <button
          data-testid="nav-scan"
          onClick={() => setCurrentView('camera')}
          className="flex flex-col items-center justify-center w-20 h-full transition-all"
          style={{
            color: isViewActive(['camera']) ? nav.activeScan : nav.inactive,
            transform: isViewActive(['camera']) ? 'scale(1.10)' : 'scale(1)',
          }}
        >
          <div
            className="p-2 rounded-full mb-1 transition-colors"
            style={{ background: isViewActive(['camera']) ? nav.activePillScan : 'transparent' }}
          >
            <Camera size={26} strokeWidth={isViewActive(['camera']) ? 2.5 : 2} />
          </div>
          <span className="text-[11px] font-bold tracking-wide uppercase">Scan</span>
        </button>

        <button
          data-testid="nav-piko"
          onClick={() => setCurrentView('piko')}
          className="flex flex-col items-center justify-center w-20 h-full transition-all"
          style={{
            color: isViewActive(['piko', 'plant_index', 'tasks', 'settings', 'about']) ? nav.activePiko : nav.inactive,
            transform: isViewActive(['piko', 'plant_index', 'tasks', 'settings', 'about']) ? 'scale(1.10)' : 'scale(1)',
          }}
        >
          <div
            className="p-2 rounded-full mb-1 transition-colors"
            style={{ background: isViewActive(['piko', 'plant_index', 'tasks', 'settings', 'about']) ? nav.activePillPiko : 'transparent' }}
          >
            <Target size={26} strokeWidth={isViewActive(['piko', 'plant_index', 'tasks', 'settings', 'about']) ? 2.5 : 2} />
          </div>
          <span className="text-[11px] font-bold tracking-wide uppercase">Piko</span>
        </button>

      </div>
    </div>
  );
}
