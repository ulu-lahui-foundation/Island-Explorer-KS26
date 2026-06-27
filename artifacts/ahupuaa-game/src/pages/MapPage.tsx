import { useGame, Zone, PLANT_DATABASE } from "@/lib/GameContext";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useRef, useEffect } from "react";
import { ChevronUp, ChevronDown, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export function MapPage() {
  const { inventory, placedPlants, placePlant } = useGame();
  const [inventoryOpen, setInventoryOpen] = useState(true);
  const { toast } = useToast();
  
  // Basic hit detection for zones
  const ukaRef = useRef<HTMLDivElement>(null);
  const kulaRef = useRef<HTMLDivElement>(null);
  const kaiRef = useRef<HTMLDivElement>(null);

  const handleDragEnd = (event: any, info: any, plantId: string) => {
    // Simple y-coordinate based drop detection
    const y = info.point.y;
    let targetZone: Zone | null = null;
    
    // Get screen percentages roughly
    const vh = window.innerHeight;
    if (y < vh * 0.4) {
      targetZone = 'uka';
    } else if (y < vh * 0.7) {
      targetZone = 'kula';
    } else if (y < vh * 0.9) {
      targetZone = 'kai';
    }

    if (targetZone) {
      const plant = PLANT_DATABASE.find(p => p.id === plantId);
      const success = placePlant(plantId, targetZone);
      if (success) {
        // Success animation could be triggered here
      } else {
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
    <div className="relative w-full h-full pb-20 overflow-hidden bg-blue-50 flex flex-col">
      {/* Map Zones */}
      <div className="flex-1 flex flex-col w-full relative">
        {/* UKA - Mountains */}
        <div ref={ukaRef} className="flex-[0.4] w-full relative bg-gradient-to-b from-emerald-800 to-green-600 overflow-hidden">
          {/* Mountain shapes */}
          <div className="absolute top-10 left-[-10%] w-[60%] h-[120%] bg-emerald-900 rounded-[100%] opacity-50" />
          <div className="absolute top-20 right-[-20%] w-[80%] h-[150%] bg-emerald-950 rounded-[100%] opacity-40" />
          
          {/* Water source */}
          <div className="absolute top-[40%] left-[45%] w-8 h-[100%] bg-blue-300/40 blur-sm transform -rotate-12" />
          
          <div className="absolute top-4 right-4 bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-white font-bold text-sm z-10">Uka</div>
          
          {/* Placed Plants */}
          <div className="absolute inset-0 p-8 flex flex-wrap gap-4 items-center justify-center pointer-events-none">
            {getPlacedForZone('uka').map((p, i) => {
              const plant = PLANT_DATABASE.find(db => db.id === p.plantId);
              return (
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} key={i} className="w-16 h-16 rounded-full border-4 border-white/50 overflow-hidden shadow-lg shadow-black/20 bg-emerald-800">
                  {plant && <img src={plant.image} alt={plant.name} className="w-full h-full object-cover" />}
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* KULA - Plains/Fields */}
        <div ref={kulaRef} className="flex-[0.3] w-full relative bg-gradient-to-b from-green-600 to-lime-500 overflow-hidden">
          {/* Agricultural fields patterns */}
          <div className="absolute inset-0 opacity-10 bg-[repeating-linear-gradient(45deg,transparent,transparent_10px,#000_10px,#000_20px)]" />
          
          {/* Water flowing through */}
          <div className="absolute top-0 left-[38%] w-10 h-[100%] bg-blue-300/40 blur-sm transform -rotate-6" />

          {/* Small hale */}
          <div className="absolute top-[30%] left-[20%] w-8 h-6 bg-amber-800 rounded-sm before:content-[''] before:absolute before:-top-4 before:-left-1 before:w-10 before:h-6 before:bg-amber-600 before:clip-path-triangle" style={{ clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)' }} />

          <div className="absolute top-4 right-4 bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-white font-bold text-sm z-10">Kula</div>

          {/* Placed Plants */}
          <div className="absolute inset-0 p-8 flex flex-wrap gap-4 items-center justify-center pointer-events-none">
            {getPlacedForZone('kula').map((p, i) => {
              const plant = PLANT_DATABASE.find(db => db.id === p.plantId);
              return (
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} key={i} className="w-16 h-16 rounded-full border-4 border-white/50 overflow-hidden shadow-lg shadow-black/20 bg-lime-600">
                  {plant && <img src={plant.image} alt={plant.name} className="w-full h-full object-cover" />}
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* KAI - Ocean */}
        <div ref={kaiRef} className="flex-[0.3] w-full relative bg-gradient-to-b from-amber-200 via-cyan-400 to-blue-600 overflow-hidden">
          {/* Shoreline */}
          <div className="absolute top-0 left-0 right-0 h-4 bg-amber-300/50 blur-sm" />
          
          {/* Water meeting ocean */}
          <div className="absolute top-0 left-[35%] w-12 h-[40%] bg-blue-300/40 blur-sm transform rotate-6" />

          <div className="absolute top-4 right-4 bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-white font-bold text-sm z-10">Kai</div>

          {/* Placed Plants */}
          <div className="absolute inset-0 pt-12 pb-4 px-8 flex flex-wrap gap-4 items-center justify-center pointer-events-none">
            {getPlacedForZone('kai').map((p, i) => {
              const plant = PLANT_DATABASE.find(db => db.id === p.plantId);
              return (
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} key={i} className="w-16 h-16 rounded-full border-4 border-white/50 overflow-hidden shadow-lg shadow-black/20 bg-cyan-600">
                  {plant && <img src={plant.image} alt={plant.name} className="w-full h-full object-cover" />}
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Inventory Bar */}
      <motion.div 
        className="absolute bottom-0 left-0 right-0 bg-white/90 backdrop-blur-lg rounded-t-3xl shadow-[0_-10px_40px_rgba(0,0,0,0.1)] border-t border-white"
        initial={{ y: "80%" }}
        animate={{ y: inventoryOpen ? "0%" : "80%" }}
        transition={{ type: "spring", damping: 25, stiffness: 200 }}
      >
        <button 
          onClick={() => setInventoryOpen(!inventoryOpen)}
          className="w-full flex justify-center items-center py-3 text-gray-400 hover:text-primary transition-colors"
        >
          {inventoryOpen ? <ChevronDown size={24} /> : <ChevronUp size={24} />}
        </button>
        
        <div className="px-6 pb-6 pt-0">
          <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3">Your Plants</h3>
          
          <div className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory hide-scrollbar">
            {inventory.length === 0 ? (
              <div className="w-full h-24 flex items-center justify-center border-2 border-dashed border-gray-200 rounded-2xl text-gray-400 text-sm font-medium">
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
                  className="snap-center shrink-0 w-24 h-24 rounded-2xl overflow-hidden shadow-md cursor-grab active:cursor-grabbing relative bg-gray-100"
                >
                  <img src={plant.image} alt={plant.name} className="w-full h-full object-cover pointer-events-none" />
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-2 text-white text-xs font-bold truncate pointer-events-none">
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
