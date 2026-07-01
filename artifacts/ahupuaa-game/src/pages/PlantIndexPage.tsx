import { useGame, PLANT_DATABASE } from "@/lib/GameContext";
import { ArrowLeft, Search, SearchSlash } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const ZONE_ORDER: Record<string, number> = { uka: 0, kula: 1, kai: 2 };

/** Zone ring/glow styles */
const ZONE_RING: Record<string, React.CSSProperties> = {
  uka:  { boxShadow: '0 0 0 3px #1a1a1a, 0 0 14px 4px rgba(0,0,0,0.55)' },
  kula: { boxShadow: '0 0 0 3px #2F6F4E, 0 0 14px 4px rgba(47,111,78,0.60)' },
  kai:  { boxShadow: '0 0 0 3px #3b82f6, 0 0 14px 4px rgba(59,130,246,0.55)' },
};

const ZONE_LABEL: Record<string, { bg: string; text: string }> = {
  uka:  { bg: 'rgba(0,0,0,0.70)',          text: '#F6F1E7' },
  kula: { bg: 'rgba(47,111,78,0.80)',      text: '#F6F1E7' },
  kai:  { bg: 'rgba(59,130,246,0.80)',     text: '#F6F1E7' },
};

export function PlantIndexPage() {
  const { setCurrentView, collectedPlants } = useGame();
  const [filter, setFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [selectedPlant, setSelectedPlant] = useState<typeof PLANT_DATABASE[0] | null>(null);

  const filters = ["All", "Trees", "Edible", "Lei", "Fern", "Vine"];

  // 1. Apply search + tag filter
  const matchesFilter = PLANT_DATABASE.filter(plant => {
    if (search && !plant.name.toLowerCase().includes(search.toLowerCase())) return false;
    if (filter !== "All" && !plant.tags.includes(filter.toLowerCase())) return false;
    return true;
  });

  // 2. Sort: collected first (sorted by zone uka→kula→kai), unknown last
  const sortedPlants = [...matchesFilter].sort((a, b) => {
    const aCollected = collectedPlants.includes(a.id);
    const bCollected = collectedPlants.includes(b.id);
    if (aCollected && !bCollected) return -1;
    if (!aCollected && bCollected) return 1;
    // Both collected — sort by zone
    if (aCollected && bCollected) {
      return (ZONE_ORDER[a.zone] ?? 99) - (ZONE_ORDER[b.zone] ?? 99);
    }
    return 0;
  });

  return (
    <div className="w-full h-full flex flex-col" style={{ background: '#F6F1E7' }}>

      {/* Header */}
      <div className="px-4 pt-8 pb-4 shadow-sm z-10"
        style={{ background: 'rgba(246,241,231,0.97)', borderBottom: '1px solid rgba(47,111,78,0.12)' }}>
        <button
          onClick={() => setCurrentView('piko')}
          className="flex items-center font-bold mb-4 transition-colors"
          style={{ color: '#2F6F4E' }}
        >
          <ArrowLeft className="mr-2" size={20} />
          Back to Piko
        </button>

        <h1 className="text-3xl font-bold tracking-tight mb-4" style={{ color: '#26342F' }}>
          Plant Index
        </h1>

        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2" size={20}
            style={{ color: 'rgba(47,111,78,0.5)' }} />
          <Input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search plants..."
            className="pl-10 rounded-xl h-12 text-base border-0"
            style={{ background: 'rgba(47,111,78,0.08)', color: '#26342F' }}
          />
        </div>

        <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-2">
          {filters.map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className="px-4 py-2 rounded-full whitespace-nowrap text-sm font-bold transition-all"
              style={filter === f
                ? { background: '#2F6F4E', color: '#F6F1E7', boxShadow: '0 2px 8px rgba(47,111,78,0.30)' }
                : { background: 'rgba(47,111,78,0.08)', color: '#26342F', border: '1px solid rgba(47,111,78,0.18)' }
              }
            >
              {f}
            </button>
          ))}
        </div>

        {/* Zone legend */}
        <div className="flex gap-3 mt-3">
          {(['uka', 'kula', 'kai'] as const).map(zone => (
            <div key={zone} className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full shrink-0"
                style={{ boxShadow: ZONE_RING[zone].boxShadow, background: zone === 'uka' ? '#1a1a1a' : zone === 'kula' ? '#2F6F4E' : '#3b82f6' }} />
              <span className="text-xs font-bold capitalize" style={{ color: 'rgba(38,52,47,0.55)' }}>{zone}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Grid */}
      <div className="flex-1 overflow-y-auto p-4 pb-24">
        <div className="grid grid-cols-2 gap-4">
          {sortedPlants.map((plant, i) => {
            const isCollected = collectedPlants.includes(plant.id);
            const ringStyle = isCollected ? ZONE_RING[plant.zone] : {};
            const labelColors = ZONE_LABEL[plant.zone];

            return (
              <motion.div
                key={plant.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                onClick={() => isCollected && setSelectedPlant(plant)}
                className="aspect-square rounded-2xl overflow-hidden relative"
                style={isCollected
                  ? { cursor: 'pointer', ...ringStyle }
                  : { background: '#26342F' }
                }
              >
                {isCollected ? (
                  <>
                    <img src={plant.image} alt={plant.name} className="w-full h-full object-cover" />
                    <div className="absolute inset-x-0 bottom-0 p-3 pt-8"
                      style={{ background: 'linear-gradient(to top, rgba(38,52,47,0.85), transparent)' }}>
                      <p className="text-white font-bold truncate">{plant.name}</p>
                      {/* Zone badge */}
                      <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-bold uppercase mt-0.5"
                        style={{ background: labelColors.bg, color: labelColors.text }}>
                        {plant.zone}
                      </span>
                    </div>
                  </>
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center p-4">
                    <span className="text-4xl mb-2" style={{ color: 'rgba(246,241,231,0.25)' }}>?</span>
                    <p className="font-bold text-center text-sm" style={{ color: 'rgba(246,241,231,0.35)' }}>Unknown</p>
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>

        {sortedPlants.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12"
            style={{ color: 'rgba(47,111,78,0.35)' }}>
            <SearchSlash size={48} className="mb-4 opacity-50" />
            <p className="font-medium text-lg">No plants found</p>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      <AnimatePresence>
        {selectedPlant && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-end"
            style={{ background: 'rgba(38,52,47,0.65)', backdropFilter: 'blur(6px)' }}
            onClick={() => setSelectedPlant(null)}
          >
            <motion.div
              initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="w-full max-w-[430px] mx-auto rounded-t-3xl overflow-hidden shadow-2xl"
              style={{ background: '#F6F1E7' }}
              onClick={e => e.stopPropagation()}
            >
              <div className="h-64 relative">
                <img src={selectedPlant.image} alt={selectedPlant.name} className="w-full h-full object-cover" />
                <button
                  onClick={() => setSelectedPlant(null)}
                  className="absolute top-4 right-4 w-8 h-8 rounded-full text-white flex items-center justify-center"
                  style={{ background: 'rgba(38,52,47,0.55)', backdropFilter: 'blur(8px)' }}
                >✕</button>
              </div>
              <div className="p-6 pb-12">
                <div className="flex items-center gap-2 mb-3 flex-wrap">
                  <span className="px-2 py-1 rounded text-xs font-bold uppercase"
                    style={{ background: ZONE_LABEL[selectedPlant.zone].bg, color: ZONE_LABEL[selectedPlant.zone].text }}>
                    Zone: {selectedPlant.zone}
                  </span>
                  {selectedPlant.tags.map(tag => (
                    <span key={tag} className="px-2 py-1 rounded text-xs font-bold uppercase"
                      style={{ background: 'rgba(123,201,111,0.15)', color: '#2F6F4E' }}>
                      {tag}
                    </span>
                  ))}
                </div>
                <h2 className="text-3xl font-bold mb-4" style={{ color: '#26342F' }}>{selectedPlant.name}</h2>
                <p className="font-medium leading-relaxed" style={{ color: 'rgba(38,52,47,0.65)' }}>
                  {selectedPlant.info}
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
