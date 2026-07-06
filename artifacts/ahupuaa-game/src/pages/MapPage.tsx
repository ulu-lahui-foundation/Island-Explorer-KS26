import { useGame, Zone, PLANT_DATABASE, Plant } from "@/lib/GameContext";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { Leaf } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

/** Deduplicate inventory by plant id, returning unique plants with a count */
function deduplicateInventory(inventory: Plant[]): { plant: Plant; count: number }[] {
  const map = new Map<string, { plant: Plant; count: number }>();
  for (const p of inventory) {
    const existing = map.get(p.id);
    if (existing) existing.count++;
    else map.set(p.id, { plant: p, count: 1 });
  }
  return Array.from(map.values());
}

export function MapPage() {
  const { inventory, placedPlants, placePlant } = useGame();
  const [inventoryOpen, setInventoryOpen] = useState(false);
  const { toast } = useToast();

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
  const dedupedInventory = deduplicateInventory(inventory);

  return (
    <div className="relative w-full h-full pb-20 overflow-hidden flex flex-col" style={{ background: '#26342F' }}>
      <div className="flex-1 flex flex-col w-full relative">

        {/* UKA */}
        <div className="flex-[0.4] w-full relative overflow-hidden"
          style={{ background: 'linear-gradient(180deg, #1a3d2b 0%, #2F6F4E 100%)' }}>
          <div className="absolute top-8 left-[-10%] w-[60%] h-[130%] rounded-[100%] opacity-40" style={{ background: '#1a3d2b' }} />
          <div className="absolute top-16 right-[-18%] w-[75%] h-[150%] rounded-[100%] opacity-35" style={{ background: '#122a1e' }} />
          <div className="absolute bottom-0 left-[10%] w-[35%] h-[55%] rounded-[100%] opacity-25" style={{ background: '#7BC96F' }} />
          <div className="absolute bottom-0 left-[40%] w-[40%] h-[45%] rounded-[100%] opacity-20" style={{ background: '#7BC96F' }} />
          <div className="absolute top-[30%] left-[44%] w-5 h-full blur-sm opacity-50"
            style={{ background: 'linear-gradient(180deg, #a8d8f0 0%, #6fb8e8 100%)', transform: 'rotate(-8deg)' }} />
          <div className="absolute top-4 right-4 px-3 py-1 rounded-full text-xs font-bold z-10"
            style={{ background: 'rgba(246,241,231,0.18)', backdropFilter: 'blur(8px)', color: '#F6F1E7' }}>Uka</div>
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

        {/* KULA */}
        <div className="flex-[0.3] w-full relative overflow-hidden"
          style={{ background: 'linear-gradient(180deg, #3d8f62 0%, #7BC96F 100%)' }}>
          <div className="absolute inset-0 opacity-[0.07]"
            style={{ backgroundImage: 'repeating-linear-gradient(45deg,transparent,transparent 10px,#26342F 10px,#26342F 20px)' }} />
          <div className="absolute top-0 left-[38%] w-6 h-full blur-sm opacity-40"
            style={{ background: 'linear-gradient(180deg, #a8d8f0 0%, #6fb8e8 100%)', transform: 'rotate(-4deg)' }} />
          <div className="absolute top-[28%] left-[18%] w-7 h-5 rounded-sm opacity-60" style={{ background: '#2F6F4E' }} />
          <div className="absolute top-[15%] left-[17%] w-9 h-5 opacity-60"
            style={{ background: '#26342F', clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)' }} />
          <div className="absolute top-4 right-4 px-3 py-1 rounded-full text-xs font-bold z-10"
            style={{ background: 'rgba(246,241,231,0.20)', backdropFilter: 'blur(8px)', color: '#F6F1E7' }}>Kula</div>
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

        {/* KAI */}
        <div className="flex-[0.3] w-full relative overflow-hidden"
          style={{ background: 'linear-gradient(180deg, #c8b98a 0%, #5ba3c9 55%, #2a6fa8 100%)' }}>
          <div className="absolute top-0 left-0 right-0 h-5 blur-sm opacity-80" style={{ background: '#d4c088' }} />
          <div className="absolute top-0 left-[35%] w-10 h-[45%] blur-sm opacity-35"
            style={{ background: '#a8d8f0', transform: 'rotate(5deg)' }} />
          <div className="absolute top-4 right-4 px-3 py-1 rounded-full text-xs font-bold z-10"
            style={{ background: 'rgba(246,241,231,0.20)', backdropFilter: 'blur(8px)', color: '#F6F1E7' }}>Kai</div>
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

      {/* ── Inventory FAB + Tray ── */}
      {/* The tray + button sit in a row just above the nav bar (bottom-20 = 80px nav height) */}
      <div className="absolute bottom-20 left-0 right-0 flex items-end px-3 pb-2 pointer-events-none">

        {/* Toggle button — bottom-left, always visible */}
        <button
          onClick={() => setInventoryOpen(o => !o)}
          className="relative shrink-0 w-14 h-14 rounded-2xl shadow-xl flex items-center justify-center pointer-events-auto z-20 transition-transform active:scale-95"
          style={{ background: 'rgba(246,241,231,0.97)', border: '1.5px solid rgba(47,111,78,0.22)' }}
          aria-label="Toggle inventory"
        >
          <Leaf size={22} style={{ color: '#2F6F4E' }} />
          {/* badge showing total unique plants in inventory */}
          {inventory.length > 0 && (
            <span className="absolute -top-1.5 -right-1.5 min-w-[20px] h-5 px-1 rounded-full text-[11px] font-bold flex items-center justify-center"
              style={{ background: '#2F6F4E', color: '#F6F1E7' }}>
              {dedupedInventory.length}
            </span>
          )}
        </button>

        {/* Horizontal tray — slides in to the right of the button */}
        <AnimatePresence>
          {inventoryOpen && (
            <motion.div
              key="tray"
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: "auto" }}
              exit={{ opacity: 0, width: 0 }}
              transition={{ type: "spring", damping: 28, stiffness: 260 }}
              className="ml-2 pointer-events-auto overflow-hidden"
            >
              <div
                className="flex items-end gap-3 overflow-x-auto pb-1 pt-1 pr-2 hide-scrollbar"
                style={{ maxWidth: 'calc(100vw - 80px)' }}
              >
                {dedupedInventory.length === 0 ? (
                  <div className="h-14 px-4 flex items-center rounded-2xl text-sm font-medium whitespace-nowrap"
                    style={{ background: 'rgba(246,241,231,0.92)', color: 'rgba(38,52,47,0.45)', border: '1.5px dashed rgba(47,111,78,0.25)' }}>
                    No plants yet — go scan!
                  </div>
                ) : (
                  dedupedInventory.map(({ plant, count }) => (
                    <motion.div
                      key={plant.id}
                      drag
                      dragSnapToOrigin
                      onDragEnd={(e, info) => handleDragEnd(e, info, plant.id)}
                      whileDrag={{ scale: 1.12, zIndex: 50 }}
                      className="relative shrink-0 w-14 h-14 rounded-2xl overflow-hidden shadow-lg cursor-grab active:cursor-grabbing"
                      style={{ border: '2px solid rgba(47,111,78,0.25)' }}
                    >
                      <img
                        src={plant.image}
                        alt={plant.name}
                        className="w-full h-full object-cover pointer-events-none"
                      />
                      {/* Count badge */}
                      {count > 1 && (
                        <span className="absolute top-0.5 right-0.5 min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-bold flex items-center justify-center pointer-events-none"
                          style={{ background: 'rgba(47,111,78,0.90)', color: '#F6F1E7' }}>
                          {count}
                        </span>
                      )}
                    </motion.div>
                  ))
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
