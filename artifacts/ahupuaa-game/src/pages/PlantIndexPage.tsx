import { useGame, PLANT_DATABASE } from "@/lib/GameContext";
import { ArrowLeft, Search, SearchSlash } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export function PlantIndexPage() {
  const { setCurrentView, collectedPlants } = useGame();
  const [filter, setFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [selectedPlant, setSelectedPlant] = useState<typeof PLANT_DATABASE[0] | null>(null);

  const filters = ["All", "Trees", "Edible", "Lei", "Fern", "Vine"];

  const filteredPlants = PLANT_DATABASE.filter(plant => {
    if (search && !plant.name.toLowerCase().includes(search.toLowerCase())) return false;
    if (filter !== "All" && !plant.tags.includes(filter.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="w-full h-full bg-emerald-50 flex flex-col">
      <div className="bg-white px-4 pt-8 pb-4 shadow-sm z-10">
        <button 
          onClick={() => setCurrentView('piko')}
          className="flex items-center text-gray-500 hover:text-gray-900 font-bold mb-4"
        >
          <ArrowLeft className="mr-2" size={20} />
          Back to Piko
        </button>
        
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight mb-4">Plant Index</h1>
        
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <Input 
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search plants..." 
            className="pl-10 rounded-xl bg-gray-100 border-none h-12 text-base"
          />
        </div>

        <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-2">
          {filters.map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-full whitespace-nowrap text-sm font-bold transition-colors ${
                filter === f 
                  ? 'bg-primary text-white shadow-md' 
                  : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 pb-24">
        <div className="grid grid-cols-2 gap-4">
          {filteredPlants.map((plant, i) => {
            const isCollected = collectedPlants.includes(plant.id);
            
            return (
              <motion.div
                key={plant.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                onClick={() => isCollected && setSelectedPlant(plant)}
                className={`aspect-square rounded-2xl overflow-hidden relative shadow-sm ${
                  isCollected ? 'cursor-pointer bg-white' : 'bg-gray-800'
                }`}
              >
                {isCollected ? (
                  <>
                    <img src={plant.image} alt={plant.name} className="w-full h-full object-cover" />
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-3 pt-8">
                      <p className="text-white font-bold truncate">{plant.name}</p>
                      <p className="text-white/70 text-xs font-medium uppercase">{plant.zone}</p>
                    </div>
                  </>
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center p-4">
                    <span className="text-4xl text-gray-600 mb-2">?</span>
                    <p className="text-gray-500 font-bold text-center">Unknown</p>
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
        
        {filteredPlants.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-gray-400">
            <SearchSlash size={48} className="mb-4 opacity-20" />
            <p className="font-medium text-lg">No plants found</p>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      <AnimatePresence>
        {selectedPlant && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-end"
            onClick={() => setSelectedPlant(null)}
          >
            <motion.div 
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="w-full max-w-[430px] mx-auto bg-white rounded-t-3xl overflow-hidden shadow-2xl"
              onClick={e => e.stopPropagation()}
            >
              <div className="h-64 relative">
                <img src={selectedPlant.image} alt={selectedPlant.name} className="w-full h-full object-cover" />
                <button 
                  onClick={() => setSelectedPlant(null)}
                  className="absolute top-4 right-4 w-8 h-8 bg-black/50 rounded-full text-white flex items-center justify-center backdrop-blur-md"
                >
                  ✕
                </button>
              </div>
              <div className="p-6 pb-12">
                <div className="flex items-center gap-2 mb-2">
                  <span className="px-2 py-1 bg-green-100 text-green-800 rounded uppercase text-xs font-bold">
                    Zone: {selectedPlant.zone}
                  </span>
                  {selectedPlant.tags.map(tag => (
                    <span key={tag} className="px-2 py-1 bg-gray-100 text-gray-600 rounded uppercase text-xs font-bold">
                      {tag}
                    </span>
                  ))}
                </div>
                <h2 className="text-3xl font-bold text-gray-900 mb-4">{selectedPlant.name}</h2>
                <p className="text-gray-600 font-medium leading-relaxed">
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
