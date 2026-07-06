import React from 'react';

export type Lang = 'en' | 'haw';

type DictEntry = { en: string; haw: string };

const DICT: Record<string, DictEntry> = {
  /* ── Navigation ── */
  nav_map:        { en: 'Map',          haw: "Palapala \u2018\u0101ina" },
  nav_scan:       { en: 'Scan',         haw: "\u2018Ike" },
  nav_piko:       { en: 'Piko',         haw: 'Piko' },

  /* ── Common ── */
  back:           { en: 'Back',         haw: 'Huli' },
  back_to_piko:   { en: 'Back to Piko', haw: 'Huli i Piko' },
  got_it:         { en: 'Got it!',      haw: "Maika\u2018i!" },
  try_again:      { en: 'Try Again',    haw: 'Hana hou' },

  /* ── Piko hub ── */
  piko_title:     { en: 'Piko',         haw: 'Piko' },
  piko_subtitle:  { en: 'Your hub for knowledge and progress.', haw: "Kou wahi no ka \u2018ike a me ka holomua." },
  plant_index:    { en: 'Plant Index',  haw: 'Helu Kanu' },
  plant_index_sub:{ en: 'View your collection', haw: 'N\u0101n\u0101 i k\u0101u waihona' },
  tasks:          { en: 'Tasks',        haw: 'Hana' },
  tasks_sub:      { en: 'Track your progress',  haw: 'Hahai i k\u0101u holomua' },
  settings:       { en: 'Settings',     haw: "Ho\u02bbonohonoho" },
  settings_sub:   { en: 'App options',  haw: 'Koho P\u0101keke' },

  /* ── Plant Index ── */
  plant_index_header: { en: 'Plant Index', haw: 'Helu Kanu' },
  discovered:     { en: 'discovered',   haw: "i loa\u2018a" },
  search:         { en: 'Search plants...', haw: 'Huli i n\u0101 kanu...' },
  not_found_card: { en: 'Not Found',    haw: "\u2018A\u2018ole loa\u2018a" },
  no_results:     { en: 'No plants found', haw: "\u2018A\u2018ole loa\u2018a n\u0101 kanu" },

  /* ── Tasks ── */
  tasks_header:   { en: 'Tasks',        haw: 'Hana' },
  completed:      { en: 'completed',    haw: 'pau' },
  task_collect_first:  { en: 'Collect your first plant',   haw: 'Waiho i k\u0101u kanu mua' },
  task_collect_all:    { en: 'Collect all {n} plants',     haw: 'Waiho i n\u0101 kanu a pau {n}' },
  task_tree_uka:       { en: 'Plant a tree in Uka',        haw: "Kanu i kahi l\u0101\u02bbau ma Uka" },
  task_build:          { en: "Build your ahupua\u2018a",       haw: "K\u016b kou ahupua\u2018a" },
  task_master:         { en: 'Become a Plant Master',       haw: "Lilo i Mea \u2018Ike i n\u0101 Kanu" },

  /* ── Settings ── */
  settings_header:  { en: 'Settings',   haw: "Ho\u02bbonohonoho" },
  language:         { en: 'Language',   haw: "\u2018\u014clelo" },
  language_desc:    { en: 'English / Hawaiian', haw: "Pelek\u0101ne / \u2018\u014clelo Hawai\u2018i" },
  dark_mode:        { en: 'Dark Mode',  haw: "P\u014d Nui" },
  dark_mode_desc:   { en: 'Always on in this version', haw: "Pa\u02bba mau i k\u0113ia mana" },
  notifications:    { en: 'Notifications', haw: "\u2018Alo \u02bbia" },
  notifications_desc:{ en: 'Reminders for daily scan', haw: "H\u014dmaika\u02bbi no ka \u2018ike a l\u0101" },
  sound:            { en: 'Sound',      haw: 'Leo' },
  sound_desc:       { en: 'Play sounds on action', haw: "H\u014d leo i ka hana" },
  about_us:         { en: 'About Us',   haw: 'No M\u0101kou' },
  about_us_desc:    { en: 'Learn about the app', haw: "\u2018A\u02bba i ka p\u0101keke" },
  open:             { en: 'Open',       haw: 'Wehe' },

  /* ── About ── */
  about_header:     { en: 'About Us',   haw: 'No M\u0101kou' },
  mission_title:    { en: 'Our Mission', haw: 'Ko M\u0101kou W\u0101' },
  mission_text:     { en: "Ahupua\u2018a Explorer was built to help keiki connect with the land through the lens of the ahupua\u2018a \u2014 the traditional Hawaiian land-division system that stretches from mountain to sea.",
                        haw: "Hana \u02bbia \u02bbo Ahupua\u2018a Explorer e k\u014dkua i n\u0101 keiki e pili i ka \u2018\u0101ina ma ka \u2018ike o ka ahupua\u2018a \u2014 ka \u2018ao\u02bba ho\u02bboka\u02bbaawale \u2018\u0101ina mai ka mauna a hiki i kai." },
  learn_title:      { en: 'What You Will Learn', haw: "He Aha Ka\u02bbu E \u2018A\u02bba Ai" },
  learn_1:          { en: 'Recognize native Hawaiian plants in the wild', haw: "\u2018Ike i n\u0101 kanu Hawai\u2018i ma ka n\u0101helehele" },
  learn_2:          { en: 'Understand where each plant belongs in the ecosystem', haw: "Maopopo ka wahi o k\u0113l\u0101 me k\u0113ia kanu ma loko o ka \u2018ao\u02bba k\u012blauea" },
  learn_3:          { en: 'Explore the three zones: Uka, Kula, Kai', haw: "H\u014dnahele i n\u0101 wahi \u02bbekolu: Uka, Kula, Kai" },
  learn_4:          { en: 'Build your own ahupua\u2018a by placing plants on the map', haw: "K\u016b kou ahupua\u2018a ma ka ho\u02bbonoho \u02bbana i n\u0101 kanu ma ka palapala" },
  ahupuaa_title:    { en: 'Ahupua\u2018a', haw: 'Ahupua\u2018a' },
  ahupuaa_text:     { en: "An ahupua\u2018a is a traditional Hawaiian land division that runs from the mountain peaks (uka) down through the agricultural plains (kula) all the way to the ocean (kai). Each section provided the resources needed for a sustainable community.",
                        haw: "\u2018O ka ahupua\u2018a he \u2018ao\u02bba ho\u02bboka\u02bbaawale \u2018\u0101ina Hawai\u2018i mai n\u0101 piko mauna (uka) a hiki i n\u0101 maikai (kula) a p\u014d\u02bbai i ka moana (kai). H\u014dd\u02bbia k\u0113l\u0101 wahi \u2018\u0101ina i n\u0101 kumu waiwai no ka nohona mau loa." },
  version:          { en: 'Version',    haw: 'Mana' },
  credits_line1:    { en: 'Made with aloha for', haw: 'Hana \u02bbia me ke aloha no' },
  credits_line2:    { en: 'Hawaiian ecology education', haw: "Ka ho\u02bbao\u02bba \u2018ao\u02bba k\u012blauea Hawai\u2018i" },

  /* ── Camera ── */
  cam_point:        { en: 'Point at a plant', haw: "K\u016b\u02bbia i kekahi kanu" },
  cam_scanning:     { en: 'Scanning...', haw: "\u2018Ike nei..." },
  cam_identifying:  { en: 'Identifying...', haw: "\u2018Ike \u02bbana..." },
  cam_not_found_title: { en: 'Plant Not Found', haw: "\u2018A\u2018ole loa\u2018a ka Kanu" },
  cam_not_found_desc:  { en: 'We could not identify this plant. Try scanning again!', haw: "\u2018A\u2018ole m\u0101kou i \u2018ike i k\u0113ia kanu. E \u2018ike hou!" },
  cam_found_title:     { en: 'You found a plant!', haw: "Ua loa\u2018a \u02bboe i kekahi kanu!" },
  cam_found_desc:      { en: 'Great job! It has been added to your collection.', haw: "Maika\u2018i loa! Ua ho\u02bbohui \u02bbia i k\u0101u waihona." },

  /* ── Map ── */
  map_no_inventory:   { en: 'No plants yet \u2014 go scan!', haw: "\u2018A\u2018ole kanu \u2014 e \u2018ike!" },
  map_wrong_zone:     { en: "You can't plant it there!", haw: "\u2018A\u2018ole hiki ke kanu ma laila!" },
  map_wrong_zone_desc:{ en: '{name} lives in {zone}.', haw: 'No ho\u02bbi {name} ma {zone}.' },
};

export function t(key: string, vars?: Record<string, string | number>): string {
  const stored = (typeof window !== 'undefined'
    ? localStorage.getItem('ahupuaa_lang')
    : null) as Lang | null;

  const lang: Lang = stored === 'haw' ? 'haw' : 'en';
  let raw = DICT[key]?.[lang] ?? DICT[key]?.en ?? key;

  if (vars) {
    Object.entries(vars).forEach(([k, v]) => {
      raw = raw.replace(new RegExp(`\\{${k}\\}`, 'g'), String(v));
    });
  }
  return raw;
}

export function setLang(lang: Lang) {
  if (typeof window !== 'undefined') {
    localStorage.setItem('ahupuaa_lang', lang);
    window.dispatchEvent(new Event('langchange'));
  }
}

export function getLang(): Lang {
  if (typeof window === 'undefined') return 'en';
  return (localStorage.getItem('ahupuaa_lang') as Lang) ?? 'en';
}

/** React hook: returns current language and re-renders on change */
export function useLang(): Lang {
  const [lang, setLangState] = React.useState<Lang>(getLang());
  React.useEffect(() => {
    const handler = () => setLangState(getLang());
    window.addEventListener('langchange', handler);
    return () => window.removeEventListener('langchange', handler);
  }, []);
  return lang;
}
