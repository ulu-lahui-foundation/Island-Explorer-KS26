import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { loadWeeklyState, saveWeeklyState, checkTasks, WeeklyState } from './weeklyTasks';

export type Zone = 'uka' | 'kula' | 'kai';

export type Plant = {
  id: string;
  name: string;
  tags: string[];
  zone: Zone;
  image: string;
  info: string;
};

export const PLANT_DATABASE: Plant[] = [
  { id: 'kukui', name: 'Kukui', tags: ['trees', 'edible'], zone: 'kula', image: '/plants/kukui.jpg', info: 'The Candlenut tree. Its nuts were used for light, oil, and medicine.' },
  { id: 'kalo', name: 'Kalo', tags: ['edible'], zone: 'kai', image: '/plants/kalo.jpg', info: 'Taro. A sacred staple food in Hawaiian culture representing family and ancestry.' },
  { id: 'ohia', name: '\u02bb\u014chi\u02bba Lehua', tags: ['trees', 'lei'], zone: 'uka', image: '/plants/ohia.jpg', info: '\u02bb\u014chi\u02bba Lehua. A vital forest tree that gathers rain and is sacred to Laka.' },
];

export type ViewState = 'ahupuaa' | 'camera' | 'piko' | 'plant_index' | 'tasks' | 'settings' | 'about';

export type PlacedPlant = {
  plantId: string;
  zone: Zone;
};

interface GameContextType {
  currentView: ViewState;
  setCurrentView: (view: ViewState) => void;
  collectedPlants: string[];
  inventory: Plant[];
  placedPlants: PlacedPlant[];
  collectPlant: (plant: Plant) => void;
  placePlant: (plantId: string, zone: Zone) => boolean;
  darkMode: boolean;
  toggleDarkMode: () => void;
  weeklyState: WeeklyState;
  incrementScanCount: () => void;
}

const GameContext = createContext<GameContextType | undefined>(undefined);

export function GameProvider({ children }: { children: ReactNode }) {
  const [currentView, setCurrentView] = useState<ViewState>('ahupuaa');
  const [collectedPlants, setCollectedPlants] = useState<string[]>([]);
  const [inventory, setInventory] = useState<Plant[]>([]);
  const [placedPlants, setPlacedPlants] = useState<PlacedPlant[]>([]);
  const [darkMode, setDarkMode] = useState(true);
  const [weeklyState, setWeeklyState] = useState<WeeklyState>(() => loadWeeklyState());

  /* ── Weekly tasks: login count + re-check completion ── */
  useEffect(() => {
    setWeeklyState(prev => {
      const incremented = { ...prev, loginCount: prev.loginCount + 1 };
      const checked = checkTasks(incremented, collectedPlants, placedPlants);
      saveWeeklyState(checked);
      return checked;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ── Re-check tasks whenever game state changes ── */
  useEffect(() => {
    setWeeklyState(prev => {
      const checked = checkTasks(prev, collectedPlants, placedPlants);
      saveWeeklyState(checked);
      return checked;
    });
  }, [collectedPlants, placedPlants]);

  const collectPlant = (plant: Plant) => {
    setCollectedPlants(prev => {
      const next = prev.includes(plant.id) ? prev : [...prev, plant.id];
      return next;
    });
    setInventory(prev => [...prev, plant]);
  };

  const placePlant = (plantId: string, zone: Zone) => {
    const plant = PLANT_DATABASE.find(p => p.id === plantId);
    if (plant && plant.zone === zone) {
      setInventory(prev => prev.filter(p => p.id !== plantId));
      setPlacedPlants(prev => [...prev, { plantId, zone }]);
      return true;
    }
    return false;
  };

  const toggleDarkMode = () => setDarkMode(prev => !prev);

  const incrementScanCount = useCallback(() => {
    setWeeklyState(prev => {
      const next = { ...prev, scanCount: prev.scanCount + 1 };
      const checked = checkTasks(next, collectedPlants, placedPlants);
      saveWeeklyState(checked);
      return checked;
    });
  }, [collectedPlants, placedPlants]);

  return (
    <GameContext.Provider
      value={{
        currentView,
        setCurrentView,
        collectedPlants,
        inventory,
        placedPlants,
        collectPlant,
        placePlant,
        darkMode,
        toggleDarkMode,
        weeklyState,
        incrementScanCount,
      }}
    >
      {children}
    </GameContext.Provider>
  );
}

export function useGame() {
  const context = useContext(GameContext);
  if (context === undefined) {
    throw new Error('useGame must be used within a GameProvider');
  }
  return context;
}
