import { PLANT_DATABASE, type Plant } from "./GameContext";

/* ── Weekly task system ── */

export type WeeklyTask = {
  id: string;
  label: string;
  target: number;
  category: "login" | "collect" | "zone" | "plant" | "place" | "scan";
  meta?: string; // zone name, plant id, etc.
};

export type WeeklyStats = {
  weekKey: string;
  loginCount: number;
  plantsCollected: string[];
  plantsPlaced: number;
  scanCount: number;
};

const TASK_TEMPLATES: Omit<WeeklyTask, "id">[] = [
  { label: "Log in 4 times",   target: 4,  category: "login" },
  { label: "Log in 7 times",   target: 7,  category: "login" },
  { label: "Collect 2 plants", target: 2,  category: "collect" },
  { label: "Collect 3 plants", target: 3,  category: "collect" },
  { label: "Collect a plant from Uka",  target: 1, category: "zone", meta: "uka" },
  { label: "Collect a plant from Kula", target: 1, category: "zone", meta: "kula" },
  { label: "Collect a plant from Kai",  target: 1, category: "zone", meta: "kai" },
  { label: "Find the Kukui tree", target: 1, category: "plant", meta: "kukui" },
  { label: "Find Kalo",           target: 1, category: "plant", meta: "kalo" },
  { label: "Find ʻŌhiʻa Lehua",    target: 1, category: "plant", meta: "ohia" },
  { label: "Place 2 plants on the map", target: 2, category: "place" },
  { label: "Scan 3 plants", target: 3, category: "scan" },
];

/* ── Helpers ── */

function getISOWeek(date = new Date()): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((+d - +yearStart) / 86400000 + 1) / 7);
}

export function getWeekKey(): string {
  const now = new Date();
  return `${now.getFullYear()}-W${getISOWeek(now)}`;
}

/* Seeded shuffle — deterministic for a given week */
function seededShuffle<T>(arr: T[], seed: number): T[] {
  const a = [...arr];
  let s = seed;
  for (let i = a.length - 1; i > 0; i--) {
    s = (s * 16807 + 0) % 2147483647;
    const j = s % (i + 1);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/* ── Generate this week’s tasks ── */
export function getWeeklyTasks(): WeeklyTask[] {
  const week = getISOWeek();
  const year = new Date().getFullYear();
  const seed = year * 1000 + week;
  const shuffled = seededShuffle(TASK_TEMPLATES, seed);

  // Pick 5 tasks, ensure variety — no duplicate categories if possible
  const picked: WeeklyTask[] = [];
  const usedCats = new Set<string>();
  for (const t of shuffled) {
    const catKey = t.meta ? `${t.category}-${t.meta}` : t.category;
    if (usedCats.has(catKey)) continue;
    usedCats.add(catKey);
    picked.push({ ...t, id: `${year}-W${week}-${picked.length}` });
    if (picked.length >= 5) break;
  }
  return picked;
}

/* ── LocalStorage stats ── */
const STORAGE_KEY = "ahupuaa-weekly-stats";

export function loadWeeklyStats(): WeeklyStats {
  const weekKey = getWeekKey();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as WeeklyStats;
      if (parsed.weekKey === weekKey) return parsed;
    }
  } catch { /* ignore */ }
  return { weekKey, loginCount: 0, plantsCollected: [], plantsPlaced: 0, scanCount: 0 };
}

export function saveWeeklyStats(stats: WeeklyStats) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(stats));
}

/* ── Check completion ── */
export function isTaskComplete(task: WeeklyTask, stats: WeeklyStats): boolean {
  switch (task.category) {
    case "login":   return stats.loginCount >= task.target;
    case "collect": return stats.plantsCollected.length >= task.target;
    case "place":   return stats.plantsPlaced >= task.target;
    case "scan":    return stats.scanCount >= task.target;
    case "zone":    return stats.plantsCollected.some(id => {
      const p = PLANT_DATABASE.find(x => x.id === id);
      return p?.zone === task.meta;
    });
    case "plant":   return stats.plantsCollected.includes(task.meta ?? "");
    default: return false;
  }
}

/* ── Progress for a single task ── */
export function taskProgress(task: WeeklyTask, stats: WeeklyStats): { current: number; target: number } {
  switch (task.category) {
    case "login":   return { current: stats.loginCount, target: task.target };
    case "collect": return { current: stats.plantsCollected.length, target: task.target };
    case "place":   return { current: stats.plantsPlaced, target: task.target };
    case "scan":    return { current: stats.scanCount, target: task.target };
    case "zone": {
      const has = stats.plantsCollected.some(id => {
        const p = PLANT_DATABASE.find(x => x.id === id);
        return p?.zone === task.meta;
      });
      return { current: has ? 1 : 0, target: 1 };
    }
    case "plant": {
      const has = stats.plantsCollected.includes(task.meta ?? "");
      return { current: has ? 1 : 0, target: 1 };
    }
    default: return { current: 0, target: task.target };
  }
}

/* ── Mutations ── */

export function recordLogin() {
  const stats = loadWeeklyStats();
  stats.loginCount++;
  saveWeeklyStats(stats);
}

export function recordPlantCollected(plant: Plant) {
  const stats = loadWeeklyStats();
  if (!stats.plantsCollected.includes(plant.id)) {
    stats.plantsCollected.push(plant.id);
  }
  saveWeeklyStats(stats);
}

export function recordPlantPlaced() {
  const stats = loadWeeklyStats();
  stats.plantsPlaced++;
  saveWeeklyStats(stats);
}

export function recordScan() {
  const stats = loadWeeklyStats();
  stats.scanCount++;
  saveWeeklyStats(stats);
}
