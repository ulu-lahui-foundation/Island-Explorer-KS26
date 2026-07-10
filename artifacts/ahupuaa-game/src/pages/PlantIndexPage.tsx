import { useGame, PLANT_DATABASE, Plant } from "@/lib/GameContext";
import { ArrowLeft, Search, Lock } from "lucide-react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

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

const FILTERS = ["All", "Canoe Plant", "Endemic", "Indigenous"];

export function PlantIndexPage() {
  const { setCurrentView, collectedPlants, darkMode } = useGame();
  const [filter, setFilter]     = useState("All");
  const [search,  setSearch]    = useState("");
  const [selected, setSelected]   = useState<Plant | null>(null);

  const t = darkMode
    ? {
        bg: '#245238',
        cardBg: '#2A6042',
        cardFoundBg: '#2A6042',
        border: 'rgba(255,255,255,0.10)',
        text: '#ffffff',
        title: '#ffffff',
        muted: 'rgba(255,255,255,0.55)',
        sub: 'rgba(255,255,255,0.45)',
        faint: 'rgba(255,255,255,0.30)',
        pillActiveBg: '#5CC882',
        pillActiveText: '#1A3828',
        pillInactiveBg: 'rgba(255,255,255,0.10)',
        pillInactiveText: 'rgba(255,255,255,0.80)',
        pillBorder: 'rgba(255,255,255,0.15)',
        notFoundText: '#ffffff',
        overlay: 'rgba(20,45,30,0.55)',
        searchBg: 'rgba(255,255,255,0.10)',
        searchBorder: 'rgba(255,255,255,0.12)',
        searchIcon: 'rgba(255,255,255,0.35)',
        detailBg: '#245238',
        detailTitle: '#ffffff',
        tagBg: 'rgba(255,255,255,0.10)',
        tagText: '#7BC96F',
        infoText: 'rgba(255,255,255,0.70)',
        sectionText: 'rgba(255,255,255,0.55)',
        rarityBg: 'rgba(255,255,255,0.10)',
      }
    : {
        bg: '#F6F1E7',
        cardBg: '#ffffff',
        cardFoundBg: '#ffffff',
        border: 'rgba(47,111,78,0.15)',
        text: '#26342F',
        title: '#26342F',
        muted: 'rgba(38,52,47,0.55)',
        sub: 'rgba(38,52,47,0.50)',
        faint: 'rgba(38,52,47,0.30)',
        pillActiveBg: '#2F6F4E',
        pillActiveText: '#F6F1E7',
        pillInactiveBg: 'rgba(47,111,78,0.08)',
        pillInactiveText: '#26342F',
        pillBorder: 'rgba(47,111,78,0.18)',
        notFoundText: '#111111',
        overlay: 'rgba(200,210,200,0.60)',
        searchBg: 'rgba(47,111,78,0.08)',
        searchBorder: 'rgba(47,111,78,0.12)',
        searchIcon: 'rgba(47,111,78,0.50)',
        detailBg: '#F6F1E7',
        detailTitle: '#26342F',
        tagBg: 'rgba(47,111,78,0.12)',
        tagText: '#2F6F4E',
        infoText: 'rgba(38,52,47,0.70)',
        sectionText: 'rgba(38,52,47,0.55)',
        rarityBg: 'rgba(47,111,78,0.10)',
      };

  const filtered = PLANT_DATABASE
    .filter(plant => {
      if (search && !plant.name.toLowerCase().includes(search.toLowerCase())) return false;
      if (filter !== "All" && plant.category !== filter) return false;
      return true;
    })
    .sort((a, b) => {
      const aFound = collectedPlants.includes(a.id);
      const bFound = collectedPlants.includes(b.id);
      if (aFound === bFound) return 0;
      return aFound ? -1 : 1;
    });

  const discovered = collectedPlants.length;
  const total      = PLANT_DATABASE.length;

  return (
    <div className="w-full h-full flex flex-col overflow-hidden" style={{ background: t.bg }}>

      {/* Header */}
      <div className="px-4 pt-10 pb-3" style={{ background: t.bg }}>

        <button
          onClick={() => setCurrentView('piko')}
          className="flex items-center gap-1 mb-5 text-sm font-bold"
          style={{ color: t.muted }}
        >
          <ArrowLeft size={16} />
          Back
        </button>

        <h1 className="text-4xl font-extrabold leading-tight mb-0.5" style={{ color: t.title }}>
          Plant Index
        </h1>
        <p className="text-sm font-semibold mb-4" style={{ color: t.faint }}>
          {discovered} / {total} discovered
        </p>

        {/* Search */}
        <div className="relative mb-4">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2"
            style={{ color: t.searchIcon }} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search plants\u2026"
            className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm outline-none"
            style={{
              background: t.searchBg,
              color: t.text,
              border: `1px solid ${t.searchBorder}`,
            }}
          />
        </div>

        {/* Filter pills */}
        <div className="flex flex-wrap gap-2">
          {FILTERS.map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className="px-4 py-1.5 rounded-full text-sm font-bold transition-all"
              style={filter === f
                ? { background: t.pillActiveBg, color: t.pillActiveText }
                : { background: t.pillInactiveBg, color: t.pillInactiveText, border: `1px solid ${t.pillBorder}` }
              }
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      <div className="flex-1 overflow-y-auto px-4 pt-4 pb-28">
        <div className="grid grid-cols-2 gap-4">
          {filtered.map((plant, i) => {
            const isFound = collectedPlants.includes(plant.id);
            const badge   = ZONE_BADGE[plant.zone];

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
                {/* Card image area */}
                <div
                  className="relative w-full aspect-square rounded-2xl overflow-hidden"
                  style={isFound
                    ? { background: t.cardFoundBg, border: `2px solid ${t.border}`, boxShadow: '0 6px 18px rgba(0,0,0,0.12)' }
                    : { background: t.cardBg,   border: `2px solid ${t.border}`, boxShadow: '0 6px 18px rgba(0,0,0,0.12)' }
                  }
                >
                  {/* Plant image */}
                  <img
                    src={plant.image}
                    alt=""
                    aria-hidden
                    className="absolute inset-0 w-full h-full object-cover"
                    style={{ opacity: isFound ? 1 : 0.14 }}
                  />

                  {/* Overlay for undiscovered */}
                  {!isFound && (
                    <div className="absolute inset-0" style={{ background: t.overlay }} />
                  )}

                  {/* Dark gradient for found cards */}
                  {isFound && (
                    <div className="absolute inset-x-0 bottom-0 h-1/2"
                      style={{ background: 'linear-gradient(to top, rgba(10,25,18,0.80), transparent)' }} />
                  )}

                  {/* Lock + Not Found */}
                  {!isFound && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
                      <div
                        className="w-11 h-11 rounded-full flex items-center justify-center"
                        style={{ background: darkMode ? 'rgba(255,255,255,0.18)' : 'rgba(0,0,0,0.15)' }}
                      >
                        <Lock size={20} color={darkMode ? '#fff' : '#26342F'} strokeWidth={2.5} />
                      </div>
                      <span className="font-bold text-sm" style={{ color: t.notFoundText }}>Not Found</span>
                    </div>
                  )}

                  {/* Zone badge */}
                  <span
                    className="absolute bottom-2 left-2 px-2 py-0.5 rounded-full text-[11px] font-bold capitalize"
                    style={{ background: badge.bg, color: badge.text }}
                  >
                    {plant.zone.charAt(0).toUpperCase() + plant.zone.slice(1)}
                  </span>
                </div>

                {/* Below-card text */}
                <div className="px-1">
                  {isFound ? (
                    <>
                      <p className="font-bold text-sm leading-tight truncate" style={{ color: t.text }}>{plant.name}</p>
                      <p className="text-xs" style={{ color: t.sub }}>{plant.category}</p>
                    </>
                  ) : (
                    <>
                      <p className="font-bold text-sm" style={{ color: t.muted }}>???</p>
                      <p className="text-xs" style={{ color: t.faint }}>{plant.category}</p>
                    </>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>

        {filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20" style={{ color: t.faint }}>
            <Search size={44} className="mb-4" />
            <p className="font-semibold">No plants found</p>
          </div>
        )}
      </div>

      {/* Full-screen detail */}
      <AnimatePresence>
        {selected && (
          <motion.div
            key="detail"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 220 }}
            className="fixed inset-0 z-[200] flex flex-col overflow-hidden"
            style={{ background: t.detailBg }}
          >
            <div className="relative w-full" style={{ height: '40%' }}>
              <img src={selected.image} alt={selected.name} className="w-full h-full object-cover" />
              <div className="absolute inset-x-0 bottom-0 h-1.5"
                style={{ background: ZONE_DETAIL[selected.zone].bg }} />
              <button
                onClick={() => setSelected(null)}
                className="absolute top-12 right-5 w-9 h-9 rounded-full flex items-center justify-center font-bold text-lg"
                style={{ background: 'rgba(20,40,28,0.55)', backdropFilter: 'blur(8px)', color: '#fff' }}
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-6 pt-6 pb-16">
              {/* Category + Rarity badges */}
              <div className="flex gap-2 mb-4">
                <span
                  className="inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider"
                  style={{ background: ZONE_DETAIL[selected.zone].bg, color: ZONE_DETAIL[selected.zone].text }}
                >
                  {selected.zone.charAt(0).toUpperCase() + selected.zone.slice(1)} Zone
                </span>
                <span
                  className="inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider"
                  style={{ background: t.tagBg, color: t.tagText }}
                >
                  {selected.category}
                </span>
                <span
                  className="inline-block px-3 py-1 rounded-full text-xs font-bold"
                  style={{ background: t.rarityBg, color: t.tagText }}
                >
                  {selected.rarity}
                </span>
              </div>

              <h2 className="text-4xl font-extrabold mb-1 leading-tight" style={{ color: t.detailTitle }}>
                {selected.name}
              </h2>
              <p className="text-sm italic font-semibold mb-5" style={{ color: t.infoText }}>
                {selected.scientific}
              </p>

              {/* Info sections */}
              <div className="flex flex-col gap-5">
                <div>
                  <h3 className="text-xs font-extrabold uppercase tracking-wider mb-1.5" style={{ color: t.tagText }}>Description</h3>
                  <p className="text-sm leading-relaxed" style={{ color: t.infoText }}>{selected.description}</p>
                </div>

                <div>
                  <h3 className="text-xs font-extrabold uppercase tracking-wider mb-1.5" style={{ color: t.tagText }}>Where It Grows</h3>
                  <p className="text-sm leading-relaxed" style={{ color: t.infoText }}>{selected.distribution}</p>
                </div>

                <div>
                  <h3 className="text-xs font-extrabold uppercase tracking-wider mb-1.5" style={{ color: t.tagText }}>Cultural Significance</h3>
                  <p className="text-sm leading-relaxed" style={{ color: t.infoText }}>{selected.cultural}</p>
                </div>

                <div>
                  <h3 className="text-xs font-extrabold uppercase tracking-wider mb-1.5" style={{ color: t.tagText }}>Landscape Use</h3>
                  <p className="text-sm leading-relaxed" style={{ color: t.infoText }}>{selected.landscape}</p>
                </div>

                <div>
                  <h3 className="text-xs font-extrabold uppercase tracking-wider mb-1.5" style={{ color: t.tagText }}>Care</h3>
                  <p className="text-sm leading-relaxed" style={{ color: t.infoText }}>{selected.care}</p>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
