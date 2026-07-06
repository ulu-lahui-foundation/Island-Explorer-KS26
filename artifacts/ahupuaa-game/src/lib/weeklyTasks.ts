export type WeeklyTaskType =
  | 'login'
  | 'place_zone'
  | 'scan_count'
  | 'collect_plant'
  | 'all_zones'
  | 'collect_any';

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
  tasks: WeeklyTask[];
  rewardClaimed: boolean;
  poolHash: string;
};

const STORAGE_KEY = 'ahupuaa_weekly_tasks_v2';

function getWeekStart(): string {
  const d = new Date();
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d.toISOString().split('T')[0];
}

const TASK_POOL: Omit<WeeklyTask, 'id' | 'current' | 'completed'>[] = [
  { type: 'login',       title: 'Log in 5 times',                  target: 5 },
  { type: 'place_zone',  title: 'Plant a tree in the Uka section', target: 1, zone: 'uka' },
  { type: 'scan_count',  title: 'Scan 5 plants',                  target: 5 },
  { type: 'login',       title: 'Log in 5 times',                  target: 5 },
  { type: 'collect_plant', title: 'Collect Kalo',                 target: 1, plantId: 'kalo' },
  { type: 'collect_plant', title: 'Collect \u02bb\u014chi\u02bba Lehua', target: 1, plantId: 'ohia' },
  { type: 'all_zones',   title: 'Plant in all 3 zones',            target: 1 },
  { type: 'login',       title: 'Log in to game 5 Times',           target: 5 },
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

export function loadWeeklyState(): WeeklyState {
  const currentWeek = getWeekStart();
  const currentHash = getPoolHash();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as WeeklyState;
      if (parsed.weekStart === currentWeek && parsed.poolHash === currentHash) return parsed;
    }
  } catch {}
  return {
    weekStart: currentWeek,
    loginCount: 0,
    scanCount: 0,
    tasks: generateTasks(),
    rewardClaimed: false,
    poolHash: currentHash,
  };
}

export function saveWeeklyState(state: WeeklyState) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function checkTasks(
  state: WeeklyState,
  collectedPlants: string[],
  placedPlants: { zone: 'uka' | 'kula' | 'kai' }[],
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
    }

    return { ...task, current, completed: current >= task.target };
  });

  return { ...state, tasks: updatedTasks };
}
