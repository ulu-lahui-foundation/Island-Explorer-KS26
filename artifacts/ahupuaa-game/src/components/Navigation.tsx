import { Map, Camera, Target } from "lucide-react";
import { useGame } from "@/lib/GameContext";
import { useTheme } from "@/lib/ThemeContext";

export function Navigation() {
  const { currentView, setCurrentView } = useGame();
  const { darkMode } = useTheme();

  const isViewActive = (views: string[]) => views.includes(currentView);

  const navBg   = darkMode ? '#1A3828' : '#F6F1E7';
  const navBorder = darkMode ? 'rgba(255,255,255,0.08)' : 'rgba(47,111,78,0.15)';
  const activeColor = '#2F6F4E';
  const scanColor   = '#7BC96F';
  const inactiveLight = 'rgba(38,52,47,0.35)';
  const inactiveDark  = 'rgba(255,255,255,0.35)';
  const inactiveColor = darkMode ? inactiveDark : inactiveLight;

  return (
    <div className="fixed bottom-0 left-0 right-0 max-w-[430px] mx-auto z-50"
      style={{ background: navBg, borderTop: `1px solid ${navBorder}`, boxShadow: darkMode ? '0 -4px 24px rgba(0,0,0,0.30)' : '0 -4px 24px rgba(38,52,47,0.08)' }}>
      <div className="flex justify-around items-center h-20 px-6">

        <button
          data-testid="nav-map"
          onClick={() => setCurrentView('ahupuaa')}
          className="flex flex-col items-center justify-center w-20 h-full transition-all"
          style={{ color: isViewActive(['ahupuaa']) ? activeColor : inactiveColor, transform: isViewActive(['ahupuaa']) ? 'scale(1.10)' : 'scale(1)' }}
        >
          <div className="p-2 rounded-full mb-1 transition-colors"
            style={{ background: isViewActive(['ahupuaa']) ? (darkMode ? 'rgba(255,255,255,0.10)' : 'rgba(47,111,78,0.12)') : 'transparent' }}>
            <Map size={26} strokeWidth={isViewActive(['ahupuaa']) ? 2.5 : 2} />
          </div>
          <span className="text-[11px] font-bold tracking-wide uppercase">Map</span>
        </button>

        <button
          data-testid="nav-scan"
          onClick={() => setCurrentView('camera')}
          className="flex flex-col items-center justify-center w-20 h-full transition-all"
          style={{ color: isViewActive(['camera']) ? scanColor : inactiveColor, transform: isViewActive(['camera']) ? 'scale(1.10)' : 'scale(1)' }}
        >
          <div className="p-2 rounded-full mb-1 transition-colors"
            style={{ background: isViewActive(['camera']) ? (darkMode ? 'rgba(123,201,111,0.15)' : 'rgba(123,201,111,0.15)') : 'transparent' }}>
            <Camera size={26} strokeWidth={isViewActive(['camera']) ? 2.5 : 2} />
          </div>
          <span className="text-[11px] font-bold tracking-wide uppercase">Scan</span>
        </button>

        <button
          data-testid="nav-piko"
          onClick={() => setCurrentView('piko')}
          className="flex flex-col items-center justify-center w-20 h-full transition-all"
          style={{ color: isViewActive(['piko', 'plant_index', 'tasks', 'settings', 'about']) ? activeColor : inactiveColor, transform: isViewActive(['piko', 'plant_index', 'tasks', 'settings', 'about']) ? 'scale(1.10)' : 'scale(1)' }}
        >
          <div className="p-2 rounded-full mb-1 transition-colors"
            style={{ background: isViewActive(['piko', 'plant_index', 'tasks', 'settings', 'about']) ? (darkMode ? 'rgba(255,255,255,0.10)' : 'rgba(47,111,78,0.12)') : 'transparent' }}>
            <Target size={26} strokeWidth={isViewActive(['piko', 'plant_index', 'tasks', 'settings', 'about']) ? 2.5 : 2} />
          </div>
          <span className="text-[11px] font-bold tracking-wide uppercase">Piko</span>
        </button>

      </div>
    </div>
  );
}
