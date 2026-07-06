import { useGame, PLANT_DATABASE, Plant } from "@/lib/GameContext";
import { ArrowLeft, Search, Lock } from "lucide-react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

/* ── Design tokens ── */
const PAGE_BG     = '#F6F1E7';
const CARD_BG     = '#EDE8DC';
const ACTIVE_PILL = '#2F6F4E';

const ZONE_BADGE: Record<string, { bg: string; text: string }> = {
  uka:  { bg: '#4a7c3f', text: '#ffffff' },
  kula: { bg: '#7B4F2E', text: '#ffffff' },
  kai:  { bg: '#29B5E8', text: '#ffffff' },
};

const ZONE_DETAIL: Record<string, { bg: string; text: string }> = {
  uka:  { bg: '#4a7c3f', text: '#ffffff' },
  kula: { bg: '#7B4F2E', text: '#ffffff' },
  kai:  { bg: '#29B5E8', text: '#ffffff' },
};

const FILTERS = ["All", "Fern", "Vine", "Trees", "Edible", "Lei"];

/* ── Component ── */
export function PlantIndexPage() {
  const { setCurrentView, collectedPlants } = useGame();
  const [filter, setFilter]       = useState("All");
  const [search,  setSearch]      = useState("");
  const [selected, setSelected]   = useState<Plant | null>(null);

  /* Filter */
  const filtered = PLANT_DATABASE.filter(plant => {
    if (search && !plant.name.toLowerCase().includes(search.toLowerCase())) return false;
    if (filter !== "All" && !plant.tags.includes(filter.toLowerCase())) return false;
    return true;
  });

  const discovered = collectedPlants.length;
  const total      = PLANT_DATABASE.length;

  return (
    <div className="w-full h-full flex flex-col overflow-hidden" style={{ background: PAGE_BG }}>

      {/* ── Header ── */}
      <div className="px-4 pt-10 pb-3" style={{ background: PAGE_BG, borderBottom: '1px solid rgba(47,111,78,0.12)' }}>

        {/* Back */}
        <button
          onClick={() => setCurrentView('piko')}
          className="flex items-center gap-1 mb-5 text-sm font-bold"
          style={{ color: '#2F6F4E' }}
        >
          <ArrowLeft size={16} />
          Back
        </button>

        {/* Title + count */}
        <h1 className="text-4xl font-extrabold leading-tight mb-0.5" style={{ color: '#26342F' }}>
          Plant Index
        </h1>
        <p className="text-sm font-semibold mb-4" style={{ color: 'rgba(38,52,47,0.45)' }}>
          {discovered} / {total} discovered
        </p>

        {/* Search */}
        <div className="relative mb-4">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2"
            style={{ color: 'rgba(47,111,78,0.45)' }} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search plants…"
            className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm outline-none"
            style={{
              background: 'rgba(47,111,78,0.09)',
              color: '#26342F',
              border: '1px solid rgba(47,111,78,0.14)',
            }}
          />
        </div>

        {/* Filter pills — wrapping */}
        <div className="flex flex-wrap gap-2">
          {FILTERS.map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className="px-4 py-1.5 rounded-full text-sm font-bold transition-all"
              style={filter === f
                ? { background: ACTIVE_PILL, color: '#F6F1E7', boxShadow: '0 2px 8px rgba(47,111,78,0.25)' }
                : { background: 'rgba(47,111,78,0.08)', color: '#26342F',
                    border: '1px solid rgba(47,111,78,0.16)' }
              }
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* ── Grid ── */}
      <div className="flex-1 overflow-y-auto px-4 pt-4 pb-28">
        <div className="grid grid-cols-2 gap-4">
          {filtered.map((plant, i) => {
            const isFound = collectedPlants.includes(plant.id);
            const badge   = ZONE_BADGE[plant.zone];
            const firstTag = plant.tags[0] ?? '';

            return (
              <motion.div
                key={plant.id}
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                onClick={() => isFound && setSelected(plant)}
                className="flex flex-col gap-2"
                style={{ cursor: isFound ? 'pointer' : 'default' }}
              >
                {/* ── Card image area ── */}
                <div
                  className="relative w-full aspect-square rounded-2xl overflow-hidden"
                  style={{ background: CARD_BG }}
                >
                  {/* Plant image */}
                  <img
                    src={plant.image}
                    alt=""
                    aria-hidden
                    className="absolute inset-0 w-full h-full object-cover"
                    style={isFound
                      ? { opacity: 1 }
                      /* Silhouette: turn every pixel black, keep very low opacity so
                         the plant shape is hinted but completely unidentifiable */
                      : { filter: 'brightness(0)', opacity: 0.14 }
                    }
                  />

                  {/* Gradient for found cards */}
                  {isFound && (
                    <div className="absolute inset-x-0 bottom-0 h-1/2"
                      style={{ background: 'linear-gradient(to top, rgba(20,40,28,0.80), transparent)' }} />
                  )}

                  {/* Lock + label for undiscovered */}
                  {!isFound && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
                      <div
                        className="w-11 h-11 rounded-full flex items-center justify-center"
                        style={{ background: 'rgba(47,111,78,0.15)', border: '1.5px solid rgba(47,111,78,0.25)' }}
                      >
                        <Lock size={20} color="#2F6F4E" strokeWidth={2.5} />
                      </div>
                      <span className="font-bold text-sm" style={{ color: '#2F6F4E' }}>Not Found</span>
                    </div>
                  )}

                  {/* Zone badge — bottom-left */}
                  <span
                    className="absolute bottom-2 left-2 px-2 py-0.5 rounded-full text-[11px] font-bold capitalize"
                    style={{ background: badge.bg, color: badge.text }}
                  >
                    {plant.zone.charAt(0).toUpperCase() + plant.zone.slice(1)}
                  </span>
                </div>

                {/* ── Below-card text ── */}
                <div className="px-1">
                  {isFound ? (
                    <>
                      <p className="font-bold text-sm leading-tight truncate" style={{ color: '#26342F' }}>{plant.name}</p>
                      <p className="text-xs capitalize" style={{ color: 'rgba(38,52,47,0.50)' }}>{firstTag}</p>
                    </>
                  ) : (
                    <>
                      <p className="font-bold text-sm" style={{ color: 'rgba(38,52,47,0.40)' }}>???</p>
                      <p className="text-xs capitalize" style={{ color: 'rgba(38,52,47,0.30)' }}>{firstTag}</p>
                    </>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>

        {filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20"
            style={{ color: 'rgba(38,52,47,0.30)' }}>
            <Search size={44} className="mb-4" />
            <p className="font-semibold">No plants found</p>
          </div>
        )}
      </div>

      {/* ── Full-screen detail ── */}
      <AnimatePresence>
        {selected && (
          <motion.div
            key="detail"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 220 }}
            className="fixed inset-0 z-[200] flex flex-col overflow-hidden"
            style={{ background: '#F6F1E7' }}
          >
            {/* Hero photo */}
            <div className="relative w-full" style={{ height: '45%' }}>
              <img
                src={selected.image}
                alt={selected.name}
                className="w-full h-full object-cover"
              />
              {/* Zone colour accent bar */}
              <div className="absolute inset-x-0 bottom-0 h-1.5"
                style={{ background: ZONE_DETAIL[selected.zone].bg }} />
              {/* Close */}
              <button
                onClick={() => setSelected(null)}
                className="absolute top-12 right-5 w-9 h-9 rounded-full flex items-center justify-center font-bold text-lg"
                style={{ background: 'rgba(20,40,28,0.55)', backdropFilter: 'blur(8px)', color: '#fff' }}
              >
                ✕
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto px-6 pt-6 pb-16">
              <span
                className="inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-4"
                style={{ background: ZONE_DETAIL[selected.zone].bg, color: ZONE_DETAIL[selected.zone].text }}
              >
                {selected.zone.charAt(0).toUpperCase() + selected.zone.slice(1)} Zone
              </span>

              <h2 className="text-4xl font-extrabold mb-3 leading-tight" style={{ color: '#26342F' }}>
                {selected.name}
              </h2>

              <div className="flex flex-wrap gap-2 mb-5">
                {selected.tags.map(tag => (
                  <span key={tag} className="px-2.5 py-1 rounded-full text-xs font-bold uppercase"
                    style={{ background: 'rgba(47,111,78,0.12)', color: '#2F6F4E' }}>
                    {tag}
                  </span>
                ))}
              </div>

              <p className="text-base leading-relaxed" style={{ color: 'rgba(38,52,47,0.70)' }}>
                {selected.info}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
