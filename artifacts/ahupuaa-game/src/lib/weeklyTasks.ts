export type WeeklyTaskType =
  | 'login'
  | 'place_zone'
  | 'scan_count'
  | 'collect_plant'
  | 'all_zones'
  | 'collect_any'
  | 'remove_plant'
  | 'place_same'
  | 'inventory_count';

export type WeeklyTask = {
  id: string;
  type: WeeklyTaskType;
  title: string;
  target: number;
  current: number;
  completed: boolean;
  zone?: 'uka' | 'kula' | 'kai';
  plantId?: string;
};

export type WeeklyState = {
  weekStart: string;
  loginCount: number;
  scanCount: number;
  removeCount: number;
  tasks: WeeklyTask[];
  rewardClaimed: boolean;
  poolHash: string;
};

const STORAGE_KEY_PREFIX = 'ahupuaa_weekly_v3_';

function storageKey(username?: string) {
  return STORAGE_KEY_PREFIX + (username ?? 'global');
}

function getWeekStart(): string {
  const d = new Date();
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d.toISOString().split('T')[0];
}

// Exactly 7 unique tasks — 5 are randomly chosen each week with no duplicates
const TASK_POOL: Omit<WeeklyTask, 'id' | 'current' | 'completed'>[] = [
  { type: 'all_zones',       title: 'Plant in all three land zones',    target: 3 },
  { type: 'scan_count',      title: 'Scan 5 plants',                    target: 5 },
  { type: 'collect_plant',   title: 'Collect Naupaka Kahakai',          target: 1, plantId: 'naupaka' },
  { type: 'login',           title: 'Log in 3 times',                   target: 3 },
  { type: 'remove_plant',    title: 'Dig up one plant',                  target: 1 },
  { type: 'place_same',      title: 'Plant two of the same plant',       target: 2 },
  { type: 'inventory_count', title: 'Have 10 plants in your inventory', target: 10 },
];

function getPoolHash(): string {
  const titles = TASK_POOL.map(t => `${t.type}:${t.title}:${t.target}`).join('|');
  let hash = 0;
  for (let i = 0; i < titles.length; i++) {
    hash = ((hash << 5) - hash + titles.charCodeAt(i)) | 0;
  }
  return String(Math.abs(hash));
}

function generateTasks(): WeeklyTask[] {
  const shuffled = [...TASK_POOL].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, 5).map((t, i) => ({
    ...t,
    id: `task_${i}_${getWeekStart()}`,
    current: 0,
    completed: false,
  }));
}

export function loadWeeklyState(username?: string): WeeklyState {
  const currentWeek = getWeekStart();
  const currentHash = getPoolHash();
  try {
    const raw = localStorage.getItem(storageKey(username));
    if (raw) {
      const parsed = JSON.parse(raw) as WeeklyState;
      if (parsed.weekStart === currentWeek && parsed.poolHash === currentHash) {
        return { ...parsed, removeCount: parsed.removeCount ?? 0 };
      }
    }
  } catch { /* ignore */ }
  return {
    weekStart: currentWeek,
    loginCount: 0,
    scanCount: 0,
    removeCount: 0,
    tasks: generateTasks(),
    rewardClaimed: false,
    poolHash: currentHash,
  };
}

export function saveWeeklyState(state: WeeklyState, username?: string) {
  localStorage.setItem(storageKey(username), JSON.stringify(state));
}

export function checkTasks(
  state: WeeklyState,
  collectedPlants: string[],
  placedPlants: { zone: 'uka' | 'kula' | 'kai'; plantId: string }[],
  inventoryCount: number,
): WeeklyState {
  const updatedTasks = state.tasks.map(task => {
    let current = task.current;

    switch (task.type) {
      case 'login':
        current = state.loginCount;
        break;
      case 'scan_count':
        current = state.scanCount;
        break;
      case 'remove_plant':
        current = state.removeCount;
        break;
      case 'place_zone':
        current = task.zone && placedPlants.some(p => p.zone === task.zone) ? 1 : 0;
        break;
      case 'collect_plant':
        current = task.plantId && collectedPlants.includes(task.plantId) ? 1 : 0;
        break;
      case 'all_zones':
        current = new Set(placedPlants.map(p => p.zone)).size >= 3 ? 1 : 0;
        break;
      case 'collect_any':
        current = collectedPlants.length;
        break;
      case 'place_same': {
        const counts = new Map<string, number>();
        for (const p of placedPlants) {
          counts.set(p.plantId, (counts.get(p.plantId) ?? 0) + 1);
        }
        current = counts.size > 0 ? Math.max(...counts.values()) : 0;
        break;
      }
      case 'inventory_count':
        current = inventoryCount;
        break;
    }

    return { ...task, current, completed: current >= task.target };
  });

  return { ...state, tasks: updatedTasks };
}
