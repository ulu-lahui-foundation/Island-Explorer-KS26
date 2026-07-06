import { useGame, PLANT_DATABASE, Plant } from "@/lib/GameContext";
import { useTheme } from "@/lib/ThemeContext";
import { ArrowLeft, Search, Lock } from "lucide-react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

/* ── Design tokens ── */
const ZONE_BADGE: Record<string, { bg: string; text: string }> = {
  uka:  { bg: '#8BC34A', text: '#1A3828' },
  kula: { bg: '#5CC882', text: '#1A3828' },
  kai:  { bg: '#29B5E8', text: '#1A3828' },
};

const ZONE_DETAIL: Record<string, { bg: string; text: string }> = {
  uka:  { bg: '#8BC34A', text: '#1A3828' },
  kula: { bg: '#5CC882', text: '#1A3828' },
  kai:  { bg: '#29B5E8', text: '#ffffff' },
};

const ZONE_HEADING: Record<string, { label: string; color: string }> = {
  uka:  { label: 'Uka',  color: '#8BC34A' },
  kula: { label: 'Kula', color: '#5CC882' },
  kai:  { label: 'Kai',  color: '#29B5E8' },
};

const ZONES = ['uka', 'kula', 'kai'] as const;
const FILTERS = ["All", "Fern", "Vine", "Trees", "Edible", "Lei"];

function SectionHeader({ zone, darkMode }: { zone: string; darkMode: boolean }) {
  const { label, color } = ZONE_HEADING[zone];
  const lineCol = darkMode ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.10)';
  return (
    <div className="col-span-2 flex items-center gap-3 mt-4 mb-1">
      <span className="w-3 h-3 rounded-full shrink-0" style={{ background: color }} />
      <span className="text-base font-extrabold tracking-wide uppercase" style={{ color }}>
        {label}
      </span>
      <div className="flex-1 h-px" style={{ background: lineCol }} />
    </div>
  );
}

function PlantCard({ plant, index, onTap, darkMode }: { plant: Plant; index: number; onTap: () => void; darkMode: boolean }) {
  const badge = ZONE_BADGE[plant.zone];
  const gradStart = darkMode ? 'rgba(10,25,18,0.85)' : 'rgba(38,52,47,0.85)';
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04 }}
      onClick={onTap}
      className="aspect-square rounded-2xl overflow-hidden relative cursor-pointer"
      style={{ border: darkMode ? '2px solid rgba(255,255,255,0.08)' : '2px solid rgba(0,0,0,0.06)', boxShadow: darkMode ? '0 6px 18px rgba(0,0,0,0.30)' : '0 6px 18px rgba(0,0,0,0.08)' }}
    >
      <img src={plant.image} alt={plant.name} className="w-full h-full object-cover" />
      <div className="absolute inset-x-0 bottom-0 h-1/2" style={{ background: `linear-gradient(to top, ${gradStart}, transparent)` }} />
      <div className="absolute inset-x-0 bottom-0 p-3 pt-8">
        <p className="text-white font-bold truncate text-sm leading-tight">{plant.name}</p>
        <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-bold uppercase mt-0.5" style={{ background: badge.bg, color: badge.text }}>
          {plant.zone}
        </span>
      </div>
    </motion.div>
  );
}

function NotFoundCard({ index, darkMode }: { index: number; darkMode: boolean }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.03 }}
      className="aspect-square rounded-2xl flex flex-col items-center justify-center"
      style={{
        background: darkMode ? '#1D4A30' : '#ffffff',
        border: darkMode ? '2px dashed rgba(255,255,255,0.25)' : '2px dashed #111111',
        boxShadow: darkMode ? '0 6px 18px rgba(0,0,0,0.20)' : '0 6px 18px rgba(0,0,0,0.06)',
      }}
    >
      <div className="w-10 h-10 rounded-full flex items-center justify-center mb-2" style={{ background: darkMode ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.08)' }}>
        <Lock size={20} color={darkMode ? 'rgba(255,255,255,0.70)' : '#111111'} strokeWidth={2} />
      </div>
      <p className="font-bold text-sm" style={{ color: darkMode ? 'rgba(255,255,255,0.70)' : '#111111' }}>Not Found</p>
    </motion.div>
  );
}

export function PlantIndexPage() {
  const { setCurrentView, collectedPlants } = useGame();
  const { darkMode } = useTheme();
  const [filter, setFilter] = useState("All");
  const [search,  setSearch] = useState("");
  const [selected, setSelected] = useState<Plant | null>(null);

  const pageBg   = darkMode ? '#245238' : '#F6F1E7';
  const titleCol = darkMode ? '#ffffff' : '#26342F';
  const subCol   = darkMode ? 'rgba(255,255,255,0.45)' : 'rgba(38,52,47,0.50)';
  const pillBg   = darkMode ? 'rgba(255,255,255,0.10)' : 'rgba(47,111,78,0.09)';
  const pillBorder = darkMode ? 'rgba(255,255,255,0.12)' : 'rgba(47,111,78,0.16)';
  const activePill = '#5CC882';
  const searchIcon = darkMode ? 'rgba(255,255,255,0.35)' : 'rgba(47,111,78,0.50)';

  const filtered = PLANT_DATABASE.filter(plant => {
    if (search && !plant.name.toLowerCase().includes(search.toLowerCase())) return false;
    if (filter !== "All" && !plant.tags.includes(filter.toLowerCase())) return false;
    return true;
  });

  const collected = filtered.filter(p => collectedPlants.includes(p.id));
  const notFound  = filtered.filter(p => !collectedPlants.includes(p.id));

  const byZone: Record<string, Plant[]> = { uka: [], kula: [], kai: [] };
  collected.forEach(p => byZone[p.zone].push(p));

  let animIdx = 0;

  return (
    <div className="w-full h-full flex flex-col" style={{ background: pageBg }}>

      {/* Header */}
      <div className="px-4 pt-10 pb-3" style={{ background: pageBg }}>
        <button
          onClick={() => setCurrentView('piko')}
          className="flex items-center gap-1 mb-5 text-sm font-bold"
          style={{ color: subCol }}
        >
          <ArrowLeft size={16} />
          Back
        </button>

        <h1 className="text-4xl font-extrabold leading-tight mb-1" style={{ color: titleCol }}>
          Plant Index
        </h1>
        <p className="text-sm font-semibold mb-4" style={{ color: subCol }}>
          {collectedPlants.length} / {PLANT_DATABASE.length} discovered
        </p>

        <div className="relative mb-4">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: searchIcon }} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search plants…"
            className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm outline-none"
            style={{ background: pillBg, color: titleCol, border: `1px solid ${pillBorder}` }}
          />
        </div>

        <div className="flex flex-wrap gap-2">
          {FILTERS.map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className="px-4 py-1.5 rounded-full text-sm font-bold transition-all"
              style={filter === f
                ? { background: activePill, color: '#1A3828' }
                : { background: pillBg, color: darkMode ? 'rgba(255,255,255,0.80)' : '#26342F', border: `1px solid ${pillBorder}` }
              }
            >
              {f}
            </button>
          ))}
        </div>

        <div className="flex gap-4 mt-3">
          {ZONES.map(zone => (
            <div key={zone} className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: ZONE_HEADING[zone].color }} />
              <span className="text-xs font-bold uppercase" style={{ color: ZONE_HEADING[zone].color }}>
                {ZONE_HEADING[zone].label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Grid */}
      <div className="flex-1 overflow-y-auto px-4 pb-28 pt-2">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16" style={{ color: subCol }}>
            <Search size={44} className="mb-4 opacity-40" />
            <p className="font-semibold">No plants found</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            {ZONES.map(zone => {
              const group = byZone[zone];
              if (group.length === 0) return null;
              return (
                <>
                  <SectionHeader key={`hdr-${zone}`} zone={zone} darkMode={darkMode} />
                  {group.map(plant => {
                    const idx = animIdx++;
                    return (
                      <PlantCard key={plant.id} plant={plant} index={idx}
                        onTap={() => setSelected(plant)} darkMode={darkMode} />
                    );
                  })}
                </>
              );
            })}

            {notFound.length > 0 && (
              <>
                {collected.length > 0 && (
                  <div className="col-span-2 flex items-center gap-3 mt-5 mb-1">
                    <div className="flex-1 h-px" style={{ background: darkMode ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.10)' }} />
                    <span className="text-xs font-bold uppercase tracking-widest" style={{ color: darkMode ? 'rgba(255,255,255,0.30)' : 'rgba(0,0,0,0.30)' }}>Not Found</span>
                    <div className="flex-1 h-px" style={{ background: darkMode ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.10)' }} />
                  </div>
                )}
                {notFound.map((_, i) => (
                  <NotFoundCard key={i} index={animIdx++} darkMode={darkMode} />
                ))}
              </>
            )}
          </div>
        )}
      </div>

      {/* Detail */}
      <AnimatePresence>
        {selected && (
          <motion.div
            key="detail"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 220 }}
            className="fixed inset-0 z-[200] flex flex-col overflow-hidden"
            style={{ background: darkMode ? '#1A2B22' : '#F6F1E7' }}
          >
            <div className="relative w-full" style={{ height: '45%' }}>
              <img src={selected.image} alt={selected.name} className="w-full h-full object-cover" />
              <div className="absolute inset-x-0 bottom-0 h-1.5" style={{ background: ZONE_DETAIL[selected.zone].bg }} />
              <button
                onClick={() => setSelected(null)}
                className="absolute top-12 right-5 w-9 h-9 rounded-full flex items-center justify-center font-bold text-lg"
                style={{ background: 'rgba(20,40,28,0.55)', backdropFilter: 'blur(8px)', color: '#fff' }}
              >✕</button>
            </div>
            <div className="flex-1 overflow-y-auto px-6 pt-6 pb-16">
              <span className="inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-4"
                style={{ background: ZONE_DETAIL[selected.zone].bg, color: ZONE_DETAIL[selected.zone].text }}>
                {selected.zone.charAt(0).toUpperCase() + selected.zone.slice(1)} Zone
              </span>
              <h2 className="text-4xl font-extrabold mb-3 leading-tight" style={{ color: darkMode ? '#ffffff' : '#26342F' }}>
                {selected.name}
              </h2>
              <div className="flex flex-wrap gap-2 mb-5">
                {selected.tags.map(tag => (
                  <span key={tag} className="px-2.5 py-1 rounded-full text-xs font-bold uppercase"
                    style={{ background: darkMode ? 'rgba(255,255,255,0.10)' : 'rgba(47,111,78,0.12)', color: darkMode ? '#5CC882' : '#2F6F4E' }}>
                    {tag}
                  </span>
                ))}
              </div>
              <p className="text-base leading-relaxed" style={{ color: darkMode ? 'rgba(255,255,255,0.60)' : 'rgba(38,52,47,0.70)' }}>
                {selected.info}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
