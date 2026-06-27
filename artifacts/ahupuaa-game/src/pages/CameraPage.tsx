import { useState, useEffect } from "react";
import { useGame, PLANT_DATABASE } from "@/lib/GameContext";
import { motion, AnimatePresence } from "framer-motion";
import { ScanFace } from "lucide-react";
import { Button } from "@/components/ui/button";

export function CameraPage() {
  const { collectPlant, setCurrentView } = useGame();
  const [scanning, setScanning] = useState(false);
  const [flashing, setFlashing] = useState(false);
  const [foundPlant, setFoundPlant] = useState<typeof PLANT_DATABASE[0] | null>(null);

  const handleScan = () => {
    if (scanning || foundPlant) return;
    setScanning(true);
    
    // Simulate scan delay
    setTimeout(() => {
      setFlashing(true);
      setTimeout(() => {
        setFlashing(false);
        setScanning(false);
        // Pick a random plant
        const randomPlant = PLANT_DATABASE[Math.floor(Math.random() * PLANT_DATABASE.length)];
        setFoundPlant(randomPlant);
      }, 300);
    }, 2000);
  };

  const handleCollect = () => {
    if (foundPlant) {
      collectPlant(foundPlant);
      setCurrentView('ahupuaa');
    }
  };

  return (
    <div className="relative w-full h-full bg-black flex flex-col pb-20 overflow-hidden">
      {/* Viewfinder UI */}
      <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center">
        {/* Frame markers */}
        <div className="relative w-64 h-64">
          <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-white/50" />
          <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-white/50" />
          <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-white/50" />
          <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-white/50" />
          
          {/* Scanning line */}
          <AnimatePresence>
            {scanning && (
              <motion.div 
                className="absolute left-0 right-0 h-1 bg-green-400 shadow-[0_0_15px_rgba(74,222,128,1)] z-10"
                initial={{ top: 0 }}
                animate={{ top: "100%" }}
                transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
              />
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Shutter Button */}
      <div className="absolute bottom-28 left-0 right-0 flex justify-center">
        <button 
          onClick={handleScan}
          disabled={scanning || !!foundPlant}
          className="w-20 h-20 rounded-full border-4 border-white flex items-center justify-center active:scale-95 transition-transform disabled:opacity-50"
        >
          <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center text-black">
            <ScanFace size={32} />
          </div>
        </button>
      </div>

      {/* Flash Effect */}
      <AnimatePresence>
        {flashing && (
          <motion.div 
            className="absolute inset-0 bg-white z-40"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          />
        )}
      </AnimatePresence>

      {/* Success Modal */}
      <AnimatePresence>
        {foundPlant && (
          <motion.div 
            className="absolute inset-0 z-50 flex items-end bg-black/60 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div 
              className="w-full bg-white rounded-t-3xl p-6 pb-28 shadow-2xl"
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
            >
              <div className="text-center mb-6">
                <span className="inline-block px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-bold uppercase tracking-wider mb-2">
                  New Discovery
                </span>
                <h2 className="text-3xl font-bold text-gray-900">You found {foundPlant.name}! 🌿</h2>
              </div>
              
              <div className="aspect-square w-48 mx-auto rounded-2xl overflow-hidden shadow-lg mb-6 border-4 border-white">
                <img src={foundPlant.image} alt={foundPlant.name} className="w-full h-full object-cover" />
              </div>
              
              <p className="text-center text-gray-600 mb-8 px-4 font-medium leading-relaxed">
                {foundPlant.info}
              </p>
              
              <Button 
                onClick={handleCollect} 
                className="w-full py-6 text-lg rounded-2xl bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/30"
              >
                Add to Inventory
              </Button>
              <Button 
                variant="ghost" 
                onClick={() => setFoundPlant(null)} 
                className="w-full mt-2"
              >
                Discard
              </Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
