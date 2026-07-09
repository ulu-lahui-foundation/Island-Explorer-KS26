import React, { createContext, useContext, useState, ReactNode } from 'react';

// ── 15 hardcoded test accounts ──
export const TEST_ACCOUNTS: { username: string; password: string }[] = [
  { username: 'kai',     password: 'wave123' },
  { username: 'malia',   password: 'aloha456' },
  { username: 'kekoa',   password: 'fern789' },
  { username: 'leilani', password: 'plumeria1' },
  { username: 'keoni',   password: 'coral22' },
  { username: 'noelani', password: 'flower33' },
  { username: 'makoa',   password: 'lava44' },
  { username: 'kalani',  password: 'gecko55' },
  { username: 'haunani', password: 'taro66' },
  { username: 'kahiau',  password: 'bamboo77' },
  { username: 'palila',  password: 'bird88' },
  { username: 'mahina',  password: 'moon99' },
  { username: 'kawika',  password: 'surf00' },
  { username: 'loke',    password: 'rose11' },
  { username: 'nani',    password: 'stars22' },
];

// Starter plant IDs given to each test account on first sign-in
const STARTER_SEEDS: Record<string, string[]> = {
  kai:     ['loulu', 'pohinahina', 'limu'],
  malia:   ['kalo', 'ohia', 'hala'],
  kekoa:   ['hapuu', 'palapalai', 'aalii'],
  leilani: ['lai', 'kukui', 'milo'],
  keoni:   ['ulu', 'naupaka', 'loulu'],
  noelani: ['ohia', 'koa', 'maunaloa'],
  makoa:   ['loulu', 'hapuu', 'kalo'],
  kalani:  ['limu', 'pohinahina', 'naupaka'],
  haunani: ['palapalai', 'aalii', 'kukui'],
  kahiau:  ['lai', 'ulu', 'ohia'],
  palila:  ['koa', 'milo', 'hala'],
  mahina:  ['kalo', 'loulu', 'limu'],
  kawika:  ['hapuu', 'lai', 'pohinahina'],
  loke:    ['ohia', 'palapalai', 'maunaloa'],
  nani:    ['aalii', 'kukui', 'naupaka'],
};

export type PlacedPlantSave = {
  plantId: string;
  zone: 'uka' | 'kula' | 'kai';
  x?: number;
  y?: number;
  wx?: number;
  wy?: number;
  wz?: number;
};

export type GameSave = {
  collectedPlants: string[];
  inventoryIds: string[];
  placedPlants: PlacedPlantSave[];
};

const GAME_SAVE_PREFIX = 'ahupuaa_game_v1_';
const AUTH_STORAGE_KEY = 'ahupuaa_auth_v1';

export function loadGameSave(username: string): GameSave | null {
  try {
    const raw = localStorage.getItem(GAME_SAVE_PREFIX + username);
    if (raw) return JSON.parse(raw) as GameSave;
  } catch { /* ignore */ }
  return null;
}

export function saveGameData(username: string, data: GameSave) {
  try {
    localStorage.setItem(GAME_SAVE_PREFIX + username, JSON.stringify(data));
  } catch { /* ignore */ }
}

interface StoredAuth {
  currentUser: string | null;
  accounts: { username: string; password: string }[];
}

function loadStoredAuth(): StoredAuth {
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    if (raw) return JSON.parse(raw) as StoredAuth;
  } catch { /* ignore */ }
  return { currentUser: null, accounts: [] };
}

function saveStoredAuth(auth: StoredAuth) {
  localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(auth));
}

interface AuthContextType {
  currentUser: string | null;
  testAccounts: { username: string; password: string }[];
  signIn: (username: string, password: string) => { ok: boolean; error?: string };
  createAccount: (username: string, password: string) => { ok: boolean; error?: string };
  signOut: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [auth, setAuth] = useState<StoredAuth>(loadStoredAuth);

  const allAccounts = [...TEST_ACCOUNTS, ...auth.accounts];

  const signIn = (username: string, password: string): { ok: boolean; error?: string } => {
    const trimmed = username.trim().toLowerCase();
    const account = allAccounts.find(a => a.username === trimmed);
    if (!account) return { ok: false, error: 'Account not found.' };
    if (account.password !== password) return { ok: false, error: 'Incorrect password.' };

    // Seed starter plants on first sign-in (no existing save)
    if (!loadGameSave(trimmed)) {
      const ids = STARTER_SEEDS[trimmed] ?? [];
      saveGameData(trimmed, { collectedPlants: ids, inventoryIds: ids, placedPlants: [] });
    }

    const next: StoredAuth = { ...auth, currentUser: trimmed };
    saveStoredAuth(next);
    setAuth(next);
    return { ok: true };
  };

  const createAccount = (username: string, password: string): { ok: boolean; error?: string } => {
    const trimmed = username.trim().toLowerCase();
    if (trimmed.length < 2) return { ok: false, error: 'Username must be at least 2 characters.' };
    if (password.length < 4)  return { ok: false, error: 'Password must be at least 4 characters.' };
    if (allAccounts.find(a => a.username === trimmed))
      return { ok: false, error: 'Username already taken.' };

    const nextAccounts = [...auth.accounts, { username: trimmed, password }];
    const next: StoredAuth = { currentUser: trimmed, accounts: nextAccounts };
    saveStoredAuth(next);
    saveGameData(trimmed, { collectedPlants: [], inventoryIds: [], placedPlants: [] });
    setAuth(next);
    return { ok: true };
  };

  const signOut = () => {
    const next: StoredAuth = { ...auth, currentUser: null };
    saveStoredAuth(next);
    setAuth(next);
  };

  return (
    <AuthContext.Provider value={{
      currentUser: auth.currentUser,
      testAccounts: TEST_ACCOUNTS,
      signIn,
      createAccount,
      signOut,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be inside AuthProvider');
  return ctx;
}
