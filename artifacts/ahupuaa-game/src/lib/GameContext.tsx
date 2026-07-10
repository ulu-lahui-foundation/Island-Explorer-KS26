import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { loadWeeklyState, saveWeeklyState, checkTasks, WeeklyState } from './weeklyTasks';
import { PLANT_DATA, PlantData } from './plantData';
import { loadGameSave, saveGameData } from './AuthContext';

/** Plants that start locked — unlocked by scanning or completing all tasks */
export const LOCKED_PLANT_IDS = ['naupaka', 'limu'] as const;

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
  x?: number;
  y?: number;
  wx?: number;
  wy?: number;
  wz?: number;
};

interface GameContextType {
  currentView: ViewState;
  setCurrentView: (view: ViewState) => void;
  collectedPlants: string[];
  inventory: Plant[];
  placedPlants: PlacedPlant[];
  lockedPlants: string[];
  collectPlant: (plant: Plant) => void;
  placePlant: (plantId: string, zone: Zone, x?: number, y?: number, wx?: number, wy?: number, wz?: number) => boolean;
  removePlacedPlant: (index: number) => void;
  darkMode: boolean;
  toggleDarkMode: () => void;
  weeklyState: WeeklyState;
  incrementScanCount: () => void;
  claimWeeklyReward: () => void;
}

const GameContext = createContext<GameContextType | undefined>(undefined);

export function GameProvider({ children, username }: { children: ReactNode; username: string | null }) {
  // Load saved state for this user (or start fresh)
  const savedState = username ? loadGameSave(username) : null;

  const [currentView, setCurrentView] = useState<ViewState>('ahupuaa');

  // Collected = scanned. Restore from save; default gives everything except locked plants.
  const [collectedPlants, setCollectedPlants] = useState<string[]>(
    savedState?.collectedPlants ??
    PLANT_DATABASE.filter(p => !(LOCKED_PLANT_IDS as readonly string[]).includes(p.id)).map(p => p.id)
  );

  // 1 of each plant in inventory on every session start
  const [inventory, setInventory] = useState<Plant[]>(
    PLANT_DATABASE.map(p => p)
  );

  // Per-user placed plants are preserved across sessions
  const [placedPlants, setPlacedPlants] = useState<PlacedPlant[]>(
    savedState?.placedPlants ?? []
  );

  const [darkMode, setDarkMode] = useState(true);

  const [weeklyState, setWeeklyState] = useState<WeeklyState>(
    () => loadWeeklyState(username ?? undefined)
  );

  // Auto-save game data whenever core state changes
  useEffect(() => {
    if (!username) return;
    saveGameData(username, {
      collectedPlants,
      inventoryIds: inventory.map(p => p.id),
      placedPlants,
    });
  }, [username, collectedPlants, inventory, placedPlants]);

  // Weekly tasks: login count + re-check completion
  useEffect(() => {
    setWeeklyState(prev => {
      const incremented = { ...prev, loginCount: prev.loginCount + 1 };
      const checked = checkTasks(incremented, collectedPlants, placedPlants);
      saveWeeklyState(checked, username ?? undefined);
      return checked;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Re-check tasks whenever game state changes
  useEffect(() => {
    setWeeklyState(prev => {
      const checked = checkTasks(prev, collectedPlants, placedPlants);
      saveWeeklyState(checked, username ?? undefined);
      return checked;
    });
  }, [collectedPlants, placedPlants, username]);

  const collectPlant = (plant: Plant) => {
    setCollectedPlants(prev =>
      prev.includes(plant.id) ? prev : [...prev, plant.id]
    );
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

  // A locked plant unlocks when scanned OR when all tasks are done
  const allTasksDone = weeklyState.tasks.length > 0 && weeklyState.tasks.every(t => t.completed);
  const lockedPlants = (LOCKED_PLANT_IDS as readonly string[]).filter(
    id => !collectedPlants.includes(id) && !allTasksDone
  );

  const incrementScanCount = useCallback(() => {
    setWeeklyState(prev => {
      const next = { ...prev, scanCount: prev.scanCount + 1 };
      const checked = checkTasks(next, collectedPlants, placedPlants);
      saveWeeklyState(checked, username ?? undefined);
      return checked;
    });
  }, [collectedPlants, placedPlants, username]);

  const removePlacedPlant = useCallback((index: number) => {
    setPlacedPlants(prev => prev.filter((_, i) => i !== index));
  }, []);

  const claimWeeklyReward = useCallback(() => {
    const limu = PLANT_DATABASE.find(p => p.id === 'limu');
    if (!limu) return;

    setCollectedPlants(prev =>
      prev.includes('limu') ? prev : [...prev, 'limu']
    );
    setInventory(prev => [...prev, limu]);

    setWeeklyState(prev => {
      const next = { ...prev, rewardClaimed: true };
      saveWeeklyState(next, username ?? undefined);
      return next;
    });
  }, [username]);

  return (
    <GameContext.Provider
      value={{
        currentView,
        setCurrentView,
        collectedPlants,
        inventory,
        placedPlants,
        lockedPlants,
        collectPlant,
        placePlant,
        removePlacedPlant,
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
