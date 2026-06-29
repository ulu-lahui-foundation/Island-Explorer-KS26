import { useGame, Zone, PLANT_DATABASE } from "@/lib/GameContext";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useRef } from "react";
import { ChevronUp, ChevronDown } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export function MapPage() {
  const { inventory, placedPlants, placePlant } = useGame();
  const [inventoryOpen, setInventoryOpen] = useState(true);
  const { toast } = useToast();

  const ukaRef = useRef<HTMLDivElement>(null);
  const kulaRef = useRef<HTMLDivElement>(null);
  const kaiRef = useRef<HTMLDivElement>(null);

  const handleDragEnd = (event: any, info: any, plantId: string) => {
    const y = info.point.y;
    let targetZone: Zone | null = null;
    const vh = window.innerHeight;
    if (y < vh * 0.4) targetZone = 'uka';
    else if (y < vh * 0.7) targetZone = 'kula';
    else if (y < vh * 0.9) targetZone = 'kai';

    if (targetZone) {
      const plant = PLANT_DATABASE.find(p => p.id === plantId);
      const success = placePlant(plantId, targetZone);
      if (!success) {
        toast({
          title: `You can't plant it there! 🌿`,
          description: `${plant?.name} lives in ${plant?.zone}.`,
          variant: "destructive"
        });
      }
    }
  };

  const getPlacedForZone = (zone: Zone) => placedPlants.filter(p => p.zone === zone);

  return (
    <div className="relative w-full h-full pb-20 overflow-hidden flex flex-col" style={{ background: '#26342F' }}>
      <div className="flex-1 flex flex-col w-full relative">

        {/* UKA — deep forest */}
        <div ref={ukaRef} className="flex-[0.4] w-full relative overflow-hidden"
          style={{ background: 'linear-gradient(180deg, #1a3d2b 0%, #2F6F4E 100%)' }}>
          {/* Mountain silhouettes */}
          <div className="absolute top-8 left-[-10%] w-[60%] h-[130%] rounded-[100%] opacity-40"
            style={{ background: '#1a3d2b' }} />
          <div className="absolute top-16 right-[-18%] w-[75%] h-[150%] rounded-[100%] opacity-35"
            style={{ background: '#122a1e' }} />
          {/* Canopy texture blobs */}
          <div className="absolute bottom-0 left-[10%] w-[35%] h-[55%] rounded-[100%] opacity-25"
            style={{ background: '#7BC96F' }} />
          <div className="absolute bottom-0 left-[40%] w-[40%] h-[45%] rounded-[100%] opacity-20"
            style={{ background: '#7BC96F' }} />
          {/* Water */}
          <div className="absolute top-[30%] left-[44%] w-5 h-full blur-sm opacity-50"
            style={{ background: 'linear-gradient(180deg, #a8d8f0 0%, #6fb8e8 100%)', transform: 'rotate(-8deg)' }} />

          <div className="absolute top-4 right-4 px-3 py-1 rounded-full text-xs font-bold z-10"
            style={{ background: 'rgba(246,241,231,0.18)', backdropFilter: 'blur(8px)', color: '#F6F1E7' }}>
            Uka
          </div>

          <div className="absolute inset-0 p-8 flex flex-wrap gap-3 items-center justify-center pointer-events-none">
            {getPlacedForZone('uka').map((p, i) => {
              const plant = PLANT_DATABASE.find(db => db.id === p.plantId);
              return (
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} key={i}
                  className="w-14 h-14 rounded-full overflow-hidden shadow-lg"
                  style={{ border: '3px solid rgba(246,241,231,0.5)' }}>
                  {plant && <img src={plant.image} alt={plant.name} className="w-full h-full object-cover" />}
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* KULA — mid-tone greens */}
        <div ref={kulaRef} className="flex-[0.3] w-full relative overflow-hidden"
          style={{ background: 'linear-gradient(180deg, #3d8f62 0%, #7BC96F 100%)' }}>
          {/* Field pattern */}
          <div className="absolute inset-0 opacity-[0.07]"
            style={{ backgroundImage: 'repeating-linear-gradient(45deg,transparent,transparent 10px,#26342F 10px,#26342F 20px)' }} />
          {/* Water */}
          <div className="absolute top-0 left-[38%] w-6 h-full blur-sm opacity-40"
            style={{ background: 'linear-gradient(180deg, #a8d8f0 0%, #6fb8e8 100%)', transform: 'rotate(-4deg)' }} />
          {/* Small hale accent */}
          <div className="absolute top-[28%] left-[18%] w-7 h-5 rounded-sm opacity-60"
            style={{ background: '#2F6F4E' }} />
          <div className="absolute top-[15%] left-[17%] w-9 h-5 opacity-60"
            style={{ background: '#26342F', clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)' }} />

          <div className="absolute top-4 right-4 px-3 py-1 rounded-full text-xs font-bold z-10"
            style={{ background: 'rgba(246,241,231,0.20)', backdropFilter: 'blur(8px)', color: '#F6F1E7' }}>
            Kula
          </div>

          <div className="absolute inset-0 p-8 flex flex-wrap gap-3 items-center justify-center pointer-events-none">
            {getPlacedForZone('kula').map((p, i) => {
              const plant = PLANT_DATABASE.find(db => db.id === p.plantId);
              return (
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} key={i}
                  className="w-14 h-14 rounded-full overflow-hidden shadow-lg"
                  style={{ border: '3px solid rgba(246,241,231,0.5)' }}>
                  {plant && <img src={plant.image} alt={plant.name} className="w-full h-full object-cover" />}
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* KAI — sandy shore to ocean */}
        <div ref={kaiRef} className="flex-[0.3] w-full relative overflow-hidden"
          style={{ background: 'linear-gradient(180deg, #c8b98a 0%, #5ba3c9 55%, #2a6fa8 100%)' }}>
          {/* Sandy shoreline */}
          <div className="absolute top-0 left-0 right-0 h-5 blur-sm opacity-80"
            style={{ background: '#d4c088' }} />
          {/* River mouth */}
          <div className="absolute top-0 left-[35%] w-10 h-[45%] blur-sm opacity-35"
            style={{ background: '#a8d8f0', transform: 'rotate(5deg)' }} />

          <div className="absolute top-4 right-4 px-3 py-1 rounded-full text-xs font-bold z-10"
            style={{ background: 'rgba(246,241,231,0.20)', backdropFilter: 'blur(8px)', color: '#F6F1E7' }}>
            Kai
          </div>

          <div className="absolute inset-0 pt-10 pb-4 px-8 flex flex-wrap gap-3 items-center justify-center pointer-events-none">
            {getPlacedForZone('kai').map((p, i) => {
              const plant = PLANT_DATABASE.find(db => db.id === p.plantId);
              return (
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} key={i}
                  className="w-14 h-14 rounded-full overflow-hidden shadow-lg"
                  style={{ border: '3px solid rgba(246,241,231,0.5)' }}>
                  {plant && <img src={plant.image} alt={plant.name} className="w-full h-full object-cover" />}
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Inventory Bar */}
      <motion.div
        className="absolute bottom-0 left-0 right-0 rounded-t-3xl shadow-[0_-10px_40px_rgba(38,52,47,0.18)]"
        style={{ background: 'rgba(246,241,231,0.96)', backdropFilter: 'blur(16px)', borderTop: '1px solid rgba(47,111,78,0.15)' }}
        initial={{ y: "80%" }}
        animate={{ y: inventoryOpen ? "0%" : "80%" }}
        transition={{ type: "spring", damping: 25, stiffness: 200 }}
      >
        <button
          onClick={() => setInventoryOpen(!inventoryOpen)}
          className="w-full flex justify-center items-center py-3 transition-colors"
          style={{ color: '#2F6F4E' }}
        >
          {inventoryOpen ? <ChevronDown size={24} /> : <ChevronUp size={24} />}
        </button>

        <div className="px-6 pb-6 pt-0">
          <h3 className="text-xs font-bold uppercase tracking-wider mb-3"
            style={{ color: '#26342F', opacity: 0.45 }}>Your Plants</h3>

          <div className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory hide-scrollbar">
            {inventory.length === 0 ? (
              <div className="w-full h-24 flex items-center justify-center rounded-2xl text-sm font-medium"
                style={{ border: '2px dashed rgba(47,111,78,0.25)', color: '#26342F', opacity: 0.45 }}>
                Empty! Scan to find plants.
              </div>
            ) : (
              inventory.map((plant, index) => (
                <motion.div
                  key={`${plant.id}-${index}`}
                  drag
                  dragSnapToOrigin
                  onDragEnd={(e, info) => handleDragEnd(e, info, plant.id)}
                  whileDrag={{ scale: 1.1, zIndex: 50 }}
                  className="snap-center shrink-0 w-24 h-24 rounded-2xl overflow-hidden shadow-md cursor-grab active:cursor-grabbing relative"
                  style={{ border: '2px solid rgba(47,111,78,0.20)' }}
                >
                  <img src={plant.image} alt={plant.name} className="w-full h-full object-cover pointer-events-none" />
                  <div className="absolute inset-x-0 bottom-0 p-2 text-white text-xs font-bold truncate pointer-events-none"
                    style={{ background: 'linear-gradient(to top, rgba(38,52,47,0.85), transparent)' }}>
                    {plant.name}
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
