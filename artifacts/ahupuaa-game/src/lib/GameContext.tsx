import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { loadWeeklyState, saveWeeklyState, checkTasks, WeeklyState } from './weeklyTasks';
import { PLANT_DATA, PlantData } from './plantData';

export type Zone = 'uka' | 'kula' | 'kai';

export type Plant = PlantData & {
  tags: string[];
};

function deriveTags(plant: PlantData): string[] {
  const tags: string[] = [];
  if (plant.category === 'Canoe Plant') tags.push('canoe');
  if (plant.category === 'Endemic') tags.push('endemic');
  if (plant.category === 'Indigenous') tags.push('indigenous');
  if (plant.rarity.toLowerCase().includes('common')) tags.push('common');
  if (plant.rarity.toLowerCase().includes('rare')) tags.push('rare');
  if (plant.zone === 'uka') tags.push('mountain');
  if (plant.zone === 'kula') tags.push('valley');
  if (plant.zone === 'kai') tags.push('coast');
  return tags;
}

export const PLANT_DATABASE: Plant[] = PLANT_DATA.map(p => ({
  ...p,
  tags: deriveTags(p),
}));

export type ViewState = 'ahupuaa' | 'camera' | 'piko' | 'plant_index' | 'tasks' | 'settings' | 'about';

export type PlacedPlant = {
  plantId: string;
  zone: Zone;
  x?: number; // screen % left (0-100)
  y?: number; // screen % top (0-100)
  wx?: number; // world x
  wy?: number; // world y
  wz?: number; // world z
};

interface GameContextType {
  currentView: ViewState;
  setCurrentView: (view: ViewState) => void;
  collectedPlants: string[];
  inventory: Plant[];
  placedPlants: PlacedPlant[];
  collectPlant: (plant: Plant) => void;
  placePlant: (plantId: string, zone: Zone, x?: number, y?: number, wx?: number, wy?: number, wz?: number) => boolean;
  darkMode: boolean;
  toggleDarkMode: () => void;
  weeklyState: WeeklyState;
  incrementScanCount: () => void;
  claimWeeklyReward: () => void;
}

const GameContext = createContext<GameContextType | undefined>(undefined);

export function GameProvider({ children }: { children: ReactNode }) {
  const [currentView, setCurrentView] = useState<ViewState>('ahupuaa');
  const [collectedPlants, setCollectedPlants] = useState<string[]>(
    PLANT_DATABASE.map(p => p.id)
  );
  const [inventory, setInventory] = useState<Plant[]>(
    PLANT_DATABASE.flatMap(p => [p, p])
  );
  const [placedPlants, setPlacedPlants] = useState<PlacedPlant[]>([]);
  const [darkMode, setDarkMode] = useState(true);
  const [weeklyState, setWeeklyState] = useState<WeeklyState>(() => loadWeeklyState());

  /* Weekly tasks: login count + re-check completion */
  useEffect(() => {
    setWeeklyState(prev => {
      const incremented = { ...prev, loginCount: prev.loginCount + 1 };
      const checked = checkTasks(incremented, collectedPlants, placedPlants);
      saveWeeklyState(checked);
      return checked;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* Re-check tasks whenever game state changes */
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

  const placePlant = (plantId: string, zone: Zone, x?: number, y?: number, wx?: number, wy?: number, wz?: number) => {
    const plant = PLANT_DATABASE.find(p => p.id === plantId);
    if (plant && plant.zone === zone) {
      setInventory(prev => {
        const idx = prev.findIndex(p => p.id === plantId);
        if (idx === -1) return prev;
        const next = [...prev];
        next.splice(idx, 1);
        return next;
      });
      setPlacedPlants(prev => [...prev, { plantId, zone, x, y, wx, wy, wz }]);
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

  const claimWeeklyReward = useCallback(() => {
    const limu = PLANT_DATABASE.find(p => p.id === 'limu');
    if (!limu) return;

    setCollectedPlants(prev => {
      const next = prev.includes('limu') ? prev : [...prev, 'limu'];
      return next;
    });
    setInventory(prev => [...prev, limu]);

    setWeeklyState(prev => {
      const next = { ...prev, rewardClaimed: true };
      saveWeeklyState(next);
      return next;
    });
  }, []);

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
        claimWeeklyReward,
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
