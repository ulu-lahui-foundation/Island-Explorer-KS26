import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { recordLogin, recordPlantCollected, recordPlantPlaced } from './weeklyTasks';

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
  { id: 'ohia', name: 'ʻŌhiʻa Lehua', tags: ['trees', 'lei'], zone: 'uka', image: '/plants/ohia.jpg', info: 'ʻŌhiʻa Lehua. A vital forest tree that gathers rain and is sacred to Laka.' },
  { id: 'limu', name: 'Limu', tags: ['edible', 'rare'], zone: 'kai', image: '/plants/limu.png', info: 'Hawaiian seaweed. A rare ocean treasure that thrives along the reef edge in the Kai zone.' },
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
}

const GameContext = createContext<GameContextType | undefined>(undefined);

export function GameProvider({ children }: { children: ReactNode }) {
  const [currentView, setCurrentView] = useState<ViewState>('ahupuaa');
  const [collectedPlants, setCollectedPlants] = useState<string[]>([]);
  const [inventory, setInventory] = useState<Plant[]>([]);
  const [placedPlants, setPlacedPlants] = useState<PlacedPlant[]>([]);

  const collectPlant = (plant: Plant) => {
    if (!collectedPlants.includes(plant.id)) {
      setCollectedPlants(prev => [...prev, plant.id]);
    }
    setInventory(prev => [...prev, plant]);
    recordPlantCollected(plant);
  };

  const placePlant = (plantId: string, zone: Zone) => {
    const plant = PLANT_DATABASE.find(p => p.id === plantId);
    if (plant && plant.zone === zone) {
      setInventory(prev => prev.filter(p => p.id !== plantId));
      setPlacedPlants(prev => [...prev, { plantId, zone }]);
      recordPlantPlaced();
      return true;
    }
    return false;
  };

  /* Track app open as a login for weekly tasks */
  useEffect(() => {
    recordLogin();
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
        placePlant
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
