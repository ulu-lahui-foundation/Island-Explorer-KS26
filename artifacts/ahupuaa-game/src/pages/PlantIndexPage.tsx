import { useGame, PLANT_DATABASE, Plant } from "@/lib/GameContext";
import { ArrowLeft, Search, SearchSlash } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

/* ── Zone styling ── */
const ZONE_RING: Record<string, React.CSSProperties> = {
  uka:  { boxShadow: '0 0 0 3px #111111, 0 0 16px 5px rgba(0,0,0,0.50)' },
  kula: { boxShadow: '0 0 0 3px #7B4F2E, 0 0 16px 5px rgba(123,79,46,0.55)' },
  kai:  { boxShadow: '0 0 0 3px #3b82f6, 0 0 16px 5px rgba(59,130,246,0.52)' },
};

const ZONE_BADGE: Record<string, { bg: string; text: string }> = {
  uka:  { bg: '#111111',           text: '#F6F1E7' },
  kula: { bg: '#7B4F2E',           text: '#F6F1E7' },
  kai:  { bg: '#3b82f6',           text: '#ffffff' },
};

const ZONE_HEADING: Record<string, { label: string; color: string }> = {
  uka:  { label: 'Uka',  color: '#111111' },
  kula: { label: 'Kula', color: '#7B4F2E' },
  kai:  { label: 'Kai',  color: '#3b82f6' },
};

const ZONES = ['uka', 'kula', 'kai'] as const;

const FILTERS = ["All", "Trees", "Edible", "Lei", "Fern", "Vine"];

/* ── Helper ── */
function SectionHeader({ zone }: { zone: string }) {
  const { label, color } = ZONE_HEADING[zone];
  return (
    <div className="col-span-2 flex items-center gap-3 mt-4 mb-1">
      <span className="w-3 h-3 rounded-full shrink-0"
        style={{ background: color, boxShadow: ZONE_RING[zone].boxShadow }} />
      <span className="text-base font-extrabold tracking-wide uppercase"
        style={{ color }}>
        {label}
      </span>
      <div className="flex-1 h-px" style={{ background: color, opacity: 0.22 }} />
    </div>
  );
}

function PlantCard({
  plant,
  index,
  onTap,
}: {
  plant: Plant;
  index: number;
  onTap: () => void;
}) {
  const badge = ZONE_BADGE[plant.zone];
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04 }}
      onClick={onTap}
      className="aspect-square rounded-2xl overflow-hidden relative cursor-pointer"
      style={ZONE_RING[plant.zone]}
    >
      <img src={plant.image} alt={plant.name} className="w-full h-full object-cover" />
      <div
        className="absolute inset-x-0 bottom-0 p-3 pt-8"
        style={{ background: 'linear-gradient(to top, rgba(20,30,25,0.88), transparent)' }}
      >
        <p className="text-white font-bold truncate text-sm leading-tight">{plant.name}</p>
        <span
          className="inline-block px-1.5 py-0.5 rounded text-[10px] font-bold uppercase mt-0.5"
          style={{ background: badge.bg, color: badge.text }}
        >
          {plant.zone}
        </span>
      </div>
    </motion.div>
  );
}

function NotFoundCard({ index }: { index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.03 }}
      className="aspect-square rounded-2xl flex flex-col items-center justify-center"
      style={{
        background: '#ffffff',
        border: '2px dashed #111111',
      }}
    >
      <p className="font-bold text-sm text-center" style={{ color: '#111111' }}>Not Found</p>
    </motion.div>
  );
}

/* ── Main page ── */
export function PlantIndexPage() {
  const { setCurrentView, collectedPlants } = useGame();
  const [filter, setFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [selectedPlant, setSelectedPlant] = useState<Plant | null>(null);

  /* Filter by search + tag */
  const filtered = PLANT_DATABASE.filter(plant => {
    if (search && !plant.name.toLowerCase().includes(search.toLowerCase())) return false;
    if (filter !== "All" && !plant.tags.includes(filter.toLowerCase())) return false;
    return true;
  });

  const collected = filtered.filter(p => collectedPlants.includes(p.id));
  const notFound  = filtered.filter(p => !collectedPlants.includes(p.id));

  /* Group collected by zone */
  const byZone: Record<string, Plant[]> = { uka: [], kula: [], kai: [] };
  collected.forEach(p => byZone[p.zone].push(p));

  /* Running index for staggered entrance animations */
  let animIdx = 0;

  return (
    <div className="w-full h-full flex flex-col" style={{ background: '#F6F1E7' }}>

      {/* ── Header ── */}
      <div
        className="px-4 pt-8 pb-3 z-10 shadow-sm"
        style={{ background: 'rgba(246,241,231,0.97)', borderBottom: '1px solid rgba(0,0,0,0.08)' }}
      >
        <button
          onClick={() => setCurrentView('piko')}
          className="flex items-center font-bold mb-4"
          style={{ color: '#2F6F4E' }}
        >
          <ArrowLeft className="mr-2" size={20} />
          Back to Piko
        </button>

        <h1 className="text-3xl font-bold tracking-tight mb-4" style={{ color: '#26342F' }}>
          Plant Index
        </h1>

        {/* Search */}
        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2" size={18}
            style={{ color: 'rgba(47,111,78,0.5)' }} />
          <Input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search plants…"
            className="pl-10 rounded-xl h-11 text-base border-0"
            style={{ background: 'rgba(47,111,78,0.09)', color: '#26342F' }}
          />
        </div>

        {/* Filter pills */}
        <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-1">
          {FILTERS.map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className="px-4 py-2 rounded-full whitespace-nowrap text-sm font-bold transition-all"
              style={filter === f
                ? { background: '#2F6F4E', color: '#F6F1E7', boxShadow: '0 2px 8px rgba(47,111,78,0.28)' }
                : { background: 'rgba(47,111,78,0.09)', color: '#26342F', border: '1px solid rgba(47,111,78,0.16)' }
              }
            >
              {f}
            </button>
          ))}
        </div>

        {/* Zone legend */}
        <div className="flex gap-4 mt-3">
          {ZONES.map(zone => (
            <div key={zone} className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full shrink-0"
                style={{ background: ZONE_HEADING[zone].color }} />
              <span className="text-xs font-bold uppercase" style={{ color: ZONE_HEADING[zone].color }}>
                {ZONE_HEADING[zone].label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Grid ── */}
      <div className="flex-1 overflow-y-auto px-4 pb-28 pt-2">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16"
            style={{ color: 'rgba(47,111,78,0.35)' }}>
            <SearchSlash size={48} className="mb-4 opacity-40" />
            <p className="font-medium text-lg">No plants found</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4">

            {/* ── Collected plants grouped by zone ── */}
            {ZONES.map(zone => {
              const group = byZone[zone];
              if (group.length === 0) return null;
              return (
                <>
                  <SectionHeader key={`hdr-${zone}`} zone={zone} />
                  {group.map(plant => {
                    const idx = animIdx++;
                    return (
                      <PlantCard
                        key={plant.id}
                        plant={plant}
                        index={idx}
                        onTap={() => setSelectedPlant(plant)}
                      />
                    );
                  })}
                </>
              );
            })}

            {/* ── Not Found ── */}
            {notFound.length > 0 && (
              <>
                {/* Section divider for not-found only when collected plants also exist */}
                {collected.length > 0 && (
                  <div className="col-span-2 flex items-center gap-3 mt-5 mb-1">
                    <div className="flex-1 h-px" style={{ background: 'rgba(0,0,0,0.14)' }} />
                    <span className="text-xs font-bold uppercase tracking-widest"
                      style={{ color: 'rgba(0,0,0,0.30)' }}>Not Found</span>
                    <div className="flex-1 h-px" style={{ background: 'rgba(0,0,0,0.14)' }} />
                  </div>
                )}
                {notFound.map((_, i) => (
                  <NotFoundCard key={i} index={animIdx++} />
                ))}
              </>
            )}
          </div>
        )}
      </div>

      {/* ── Full-screen detail view ── */}
      <AnimatePresence>
        {selectedPlant && (
          <motion.div
            key="detail"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 220 }}
            className="fixed inset-0 z-[200] flex flex-col overflow-hidden"
            style={{ background: '#F6F1E7' }}
          >
            {/* Hero image — top 45% of screen */}
            <div className="relative w-full" style={{ height: '45%' }}>
              <img
                src={selectedPlant.image}
                alt={selectedPlant.name}
                className="w-full h-full object-cover"
              />
              {/* Zone colour bar at bottom of image */}
              <div
                className="absolute inset-x-0 bottom-0 h-1.5"
                style={{ background: ZONE_BADGE[selectedPlant.zone].bg, opacity: 0.85 }}
              />
              {/* Close button */}
              <button
                onClick={() => setSelectedPlant(null)}
                className="absolute top-12 right-5 w-9 h-9 rounded-full flex items-center justify-center font-bold text-base"
                style={{ background: 'rgba(20,30,25,0.55)', backdropFilter: 'blur(8px)', color: '#fff' }}
              >
                ✕
              </button>
            </div>

            {/* Content — remaining 55% */}
            <div className="flex-1 overflow-y-auto px-6 pt-6 pb-12">
              {/* Zone badge */}
              <span
                className="inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-4"
                style={{
                  background: ZONE_BADGE[selectedPlant.zone].bg,
                  color: ZONE_BADGE[selectedPlant.zone].text,
                }}
              >
                {ZONE_HEADING[selectedPlant.zone].label} Zone
              </span>

              {/* Name */}
              <h2 className="text-4xl font-extrabold mb-3 leading-tight" style={{ color: '#26342F' }}>
                {selectedPlant.name}
              </h2>

              {/* Tags */}
              <div className="flex flex-wrap gap-2 mb-5">
                {selectedPlant.tags.map(tag => (
                  <span
                    key={tag}
                    className="px-2.5 py-1 rounded-full text-xs font-bold uppercase"
                    style={{ background: 'rgba(47,111,78,0.12)', color: '#2F6F4E' }}
                  >
                    {tag}
                  </span>
                ))}
              </div>

              {/* Info */}
              <p className="text-base leading-relaxed" style={{ color: 'rgba(38,52,47,0.70)' }}>
                {selectedPlant.info}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
