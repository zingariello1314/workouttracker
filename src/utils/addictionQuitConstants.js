/** Durée de référence pour la jauge « bénéfices sur 20 ans » */
export const TWENTY_YEARS_MS = 20 * 365.25 * 24 * 60 * 60 * 1000;

export const MS = {
  MIN: 60 * 1000,
  HOUR: 60 * 60 * 1000,
  DAY: 24 * 60 * 60 * 1000,
  WEEK: 7 * 24 * 60 * 60 * 1000,
  /** Mois moyen (calendrier) pour positionner les jalons */
  MONTH: 30.44 * 24 * 60 * 60 * 1000,
  YEAR: 365.25 * 24 * 60 * 60 * 1000,
};

const T = (ms) => ms / TWENTY_YEARS_MS;

/**
 * Tabac — jalons inspirés des repères OMS / santé publique (risques relatifs, récupération fonctionnelle).
 * Formulations courtes ; effets individuels variables. Source générale : synthèses tabac & maladies cardiovasculaires / cancers.
 */
export const CIGARETTE_TIMELINE_FR = [
  { ms: 12 * MS.MIN, t: T(12 * MS.MIN), label: '12 min — circulation périphérique qui se réveille' },
  { ms: 20 * MS.MIN, t: T(20 * MS.MIN), label: '20 min — tension artérielle et pouls vers la normale' },
  { ms: 60 * MS.MIN, t: T(60 * MS.MIN), label: '1 h — rythme cardiaque plus régulier' },
  { ms: 2 * MS.HOUR, t: T(2 * MS.HOUR), label: '2 h — pic de monoxyde post-cigarette en forte baisse' },
  { ms: 4 * MS.HOUR, t: T(4 * MS.HOUR), label: '4 h — sensation de manque intense souvent à son pic' },
  { ms: 8 * MS.HOUR, t: T(8 * MS.HOUR), label: '8 h — CO sanguin fortement réduit ; oxygène mieux utilisé' },
  { ms: 12 * MS.HOUR, t: T(12 * MS.HOUR), label: '12 h — CO continue de chuter ; cellules mieux oxygénées' },
  { ms: 24 * MS.HOUR, t: T(24 * MS.HOUR), label: '24 h — risque d’infarctus commence à diminuer' },
  { ms: 36 * MS.HOUR, t: T(36 * MS.HOUR), label: '36 h — endurance légère souvent un peu meilleure' },
  { ms: 48 * MS.HOUR, t: T(48 * MS.HOUR), label: '48 h — goût et odorat en net progrès (nerfs sensoriels)' },
  { ms: 72 * MS.HOUR, t: T(72 * MS.HOUR), label: '72 h — bronches plus détendues ; respiration plus aisée' },
  { ms: 3 * MS.DAY, t: T(3 * MS.DAY), label: '3 j — nicotine largement éliminée (ordre de grandeur)' },
  { ms: 5 * MS.DAY, t: T(5 * MS.DAY), label: '5 j — irritabilité / troubles du sommeil souvent en baisse' },
  { ms: 7 * MS.DAY, t: T(7 * MS.DAY), label: '1 sem — circulation sanguine en amélioration (peau, jambes)' },
  { ms: 10 * MS.DAY, t: T(10 * MS.DAY), label: '10 j — toux « de sevrage » parfois encore présente puis en baisse' },
  { ms: 14 * MS.DAY, t: T(14 * MS.DAY), label: '2 sem — marche et escaliers souvent plus faciles' },
  { ms: 21 * MS.DAY, t: T(21 * MS.DAY), label: '3 sem — cils bronchiques qui repoussent ; nettoyage des voies' },
  { ms: 30 * MS.DAY, t: T(30 * MS.DAY), label: '1 mois — toux / expectorations souvent en diminution' },
  { ms: 45 * MS.DAY, t: T(45 * MS.DAY), label: '6 sem — VO₂ de marche en hausse ; moins d’essoufflement' },
  { ms: 60 * MS.DAY, t: T(60 * MS.DAY), label: '2 mois — risque cardiovasculaire continue de descendre' },
  { ms: 90 * MS.DAY, t: T(90 * MS.DAY), label: '3 mois — fonction pulmonaire souvent +10 à +30 % au test' },
  { ms: 120 * MS.DAY, t: T(120 * MS.DAY), label: '4 mois — infections des voies respiratoires moins fréquentes' },
  { ms: 150 * MS.DAY, t: T(150 * MS.DAY), label: '5 mois — sinus et voies nasales souvent plus confortables' },
  { ms: 180 * MS.DAY, t: T(180 * MS.DAY), label: '6 mois — toux chronique et fatigue respiratoire en baisse' },
  { ms: 9 * MS.MONTH, t: T(9 * MS.MONTH), label: '9 mois — poumon « autonettoyant » ; crachats en diminution' },
  { ms: 1 * MS.YEAR, t: T(1 * MS.YEAR), label: '1 an — risque coronarien environ divisé par deux vs fumeur actif' },
  { ms: 15 * MS.MONTH, t: T(15 * MS.MONTH), label: '15 mois — artères plus souples ; effort quotidien facilité' },
  { ms: 2 * MS.YEAR, t: T(2 * MS.YEAR), label: '2 ans — risque d’AVC tabac proche du non-fumeur' },
  { ms: 3 * MS.YEAR, t: T(3 * MS.YEAR), label: '3 ans — infarctus : risque encore très en baisse' },
  { ms: 4 * MS.YEAR, t: T(4 * MS.YEAR), label: '4 ans — capacité pulmonaire stabilisée sur une bonne pente' },
  { ms: 5 * MS.YEAR, t: T(5 * MS.YEAR), label: '5 ans — cancers bouche, gorge, œsophage : risque ~÷2 vs fumeur' },
  { ms: 6 * MS.YEAR, t: T(6 * MS.YEAR), label: '6 ans — pancréas / vessie : risques liés au tabac en recul' },
  { ms: 7 * MS.YEAR, t: T(7 * MS.YEAR), label: '7 ans — mortalité toutes causes liées au tabac en forte baisse' },
  { ms: 8 * MS.YEAR, t: T(8 * MS.YEAR), label: '8 ans — cancer de la vessie : risque nettement réduit' },
  { ms: 10 * MS.YEAR, t: T(10 * MS.YEAR), label: '10 ans — cancer du poumon : ~50 % de risque en moins vs fumeur' },
  { ms: 12 * MS.YEAR, t: T(12 * MS.YEAR), label: '12 ans — BPCO : progression ralentie ou stabilisée selon antécédents' },
  { ms: 15 * MS.YEAR, t: T(15 * MS.YEAR), label: '15 ans — risque coronarien quasi équivalent au non-fumeur' },
  { ms: 17 * MS.YEAR, t: T(17 * MS.YEAR), label: '17 ans — espérance de vie : une partie du « retard » rattrapée' },
  { ms: TWENTY_YEARS_MS, t: 1, label: '20 ans — profil de risque global proche de « n’a jamais fumé »' },
];

/**
 * THC / cannabis — jalons prudents (sommeil, humeur, cognition, motivation) d’après littérature arrêt / sevrage.
 * Les effets varient fortement selon l’ancienneté, la dose et la voie ; viser l’aide professionnelle si besoin.
 */
export const THC_TIMELINE_FR = [
  { ms: 30 * MS.MIN, t: T(30 * MS.MIN), label: '30 min — anxiété aiguë ou palpitations parfois en baisse' },
  { ms: 90 * MS.MIN, t: T(90 * MS.MIN), label: '90 min — concentration de surface : premiers réajustements' },
  { ms: 6 * MS.HOUR, t: T(6 * MS.HOUR), label: '6 h — sommeil paradoxal perturbé la première nuit (fréquent)' },
  { ms: 12 * MS.HOUR, t: T(12 * MS.HOUR), label: '12 h — appétit et rêves vivids souvent modifiés' },
  { ms: 24 * MS.HOUR, t: T(24 * MS.HOUR), label: '24 h — architecture du sommeil (REM) qui se réorganise' },
  { ms: 36 * MS.HOUR, t: T(36 * MS.HOUR), label: '36 h — irritabilité possible ; hydratation et repos utiles' },
  { ms: 48 * MS.HOUR, t: T(48 * MS.HOUR), label: '48 h — brouillard mental souvent encore présent puis en baisse' },
  { ms: 72 * MS.HOUR, t: T(72 * MS.HOUR), label: '72 h — pics d’envie souvent encore intenses puis moindre' },
  { ms: 5 * MS.DAY, t: T(5 * MS.DAY), label: '5 j — humeur labile ; soutien social important' },
  { ms: 7 * MS.DAY, t: T(7 * MS.DAY), label: '1 sem — envies en dents de scie ; sommeil en lente amélioration' },
  { ms: 10 * MS.DAY, t: T(10 * MS.DAY), label: '10 j — anxiété de fond souvent un peu plus stable' },
  { ms: 14 * MS.DAY, t: T(14 * MS.DAY), label: '2 sem — mémoire de travail : premiers gains chez beaucoup' },
  { ms: 21 * MS.DAY, t: T(21 * MS.DAY), label: '3 sem — motivation et projet long terme plus accessibles' },
  { ms: 28 * MS.DAY, t: T(28 * MS.DAY), label: '4 sem — sommeil plus continu pour une majorité' },
  { ms: 35 * MS.DAY, t: T(35 * MS.DAY), label: '5 sem — réduction des envies « automatiques » liées aux rituels' },
  { ms: 45 * MS.DAY, t: T(45 * MS.DAY), label: '6 sem — attention soutenue en légère hausse (tests cognitifs)' },
  { ms: 60 * MS.DAY, t: T(60 * MS.DAY), label: '2 mois — anxiété sociale ou générale souvent en recul' },
  { ms: 75 * MS.DAY, t: T(75 * MS.DAY), label: '2,5 mois — circuit de récompense moins « capté » par l’habitude' },
  { ms: 90 * MS.DAY, t: T(90 * MS.DAY), label: '3 mois — humeur et sommeil : consolidation fréquente' },
  { ms: 120 * MS.DAY, t: T(120 * MS.DAY), label: '4 mois — mémoire verbale / vitesse de traitement en progrès' },
  { ms: 150 * MS.DAY, t: T(150 * MS.DAY), label: '5 mois — moins de brouillard le matin pour beaucoup' },
  { ms: 180 * MS.DAY, t: T(180 * MS.DAY), label: '6 mois — schémas d’usage anciens affaiblis ; envies plus rares' },
  { ms: 8 * MS.MONTH, t: T(8 * MS.MONTH), label: '8 mois — stabilité émotionnelle renforcée (hors troubles préexistants)' },
  { ms: 10 * MS.MONTH, t: T(10 * MS.MONTH), label: '10 mois — capacité à gérer le stress sans produit en hausse' },
  { ms: 1 * MS.YEAR, t: T(1 * MS.YEAR), label: '1 an — risques respiratoires liés à la fumée en baisse nette' },
  { ms: 15 * MS.MONTH, t: T(15 * MS.MONTH), label: '15 mois — clarté cognitive et projets personnels souvent revus' },
  { ms: 18 * MS.MONTH, t: T(18 * MS.MONTH), label: '18 mois — ancrage des nouvelles habitudes de loisirs / sommeil' },
  { ms: 2 * MS.YEAR, t: T(2 * MS.YEAR), label: '2 ans — dysphorie chronique liée au sevrage rare si elle existait' },
  { ms: 2.5 * MS.YEAR, t: T(2.5 * MS.YEAR), label: '2,5 ans — image de soi et autodiscipline renforcées' },
  { ms: 3 * MS.YEAR, t: T(3 * MS.YEAR), label: '3 ans — fonction exécutive (planification) souvent au meilleur niveau' },
  { ms: 4 * MS.YEAR, t: T(4 * MS.YEAR), label: '4 ans — risque de rechute psychologique très bas pour la plupart' },
  { ms: 5 * MS.YEAR, t: T(5 * MS.YEAR), label: '5 ans — cerveau sur trajectoire « sans dépendance cannabique »' },
  { ms: 6 * MS.YEAR, t: T(6 * MS.YEAR), label: '6 ans — sommeil profond et réveils souvent qualitativement stables' },
  { ms: 7 * MS.YEAR, t: T(7 * MS.YEAR), label: '7 ans — résilience face aux déclencheurs externes accrue' },
  { ms: 8 * MS.YEAR, t: T(8 * MS.YEAR), label: '8 ans — capital santé mentale et physique aligné sur un non-usager' },
  { ms: 10 * MS.YEAR, t: T(10 * MS.YEAR), label: '10 ans — identité « sans cannabis » pleinement intégrée' },
  { ms: 12 * MS.YEAR, t: T(12 * MS.YEAR), label: '12 ans — bénéfices cognitifs et sociaux pérennisés' },
  { ms: 15 * MS.YEAR, t: T(15 * MS.YEAR), label: '15 ans — risques cumulés d’usage prolongé fortement derrière vous' },
  { ms: 17 * MS.YEAR, t: T(17 * MS.YEAR), label: '17 ans — longévité et qualité de vie : trajectoire de non-consommateur' },
  { ms: TWENTY_YEARS_MS, t: 1, label: '20 ans — ancrage profond : profil de santé aligné sur l’absence d’usage' },
];

export const DEFAULT_ADDICTION_QUIT_DATA = {
  version: '3',
  tracks: {
    cigarette: { quitAtIso: null, displayName: 'Tabac' },
    thc: { quitAtIso: null, displayName: 'THC / cannabis' },
  },
  cravingsByDay: {},
  /** Estimations perso (optionnel) pour paquets / joints évités et économie — non médical */
  estimates: {
    packsPerDay: null,
    packPriceEur: null,
    jointsPerWeek: null,
  },
  /** Sessions d’arrêt (entre craquage / reset) — une session ouverte = endedAtIso null */
  sessions: { cigarette: [], thc: [] },
  /** Craquages enregistrés (bouton dédié) */
  relapses: [],
  /** Copilote : micro-actions perso (textes libres), en plus des suggestions */
  copilot: {
    customActions: [],
  },
  /** Objectifs / rappels optionnels par suivi (pas imposés) */
  trackFocus: {
    cigarette: { routine: true, sleep: false, mood: false },
    thc: { routine: false, sleep: true, mood: true },
  },
  /** Une phrase par jour (fin de journée) */
  reflectionByDay: {},
  /** Semaines où la mini-revue a été cochée — clé ISO type 2026-W15 */
  weeklyReviewWeeks: {},
  /** Options d’affichage prudentes */
  privacy: {
    highlightWeekendRisk: false,
  },
};

export function progressTwentyYears(quitAtIso, nowMs = Date.now()) {
  if (!quitAtIso) return 0;
  const start = new Date(quitAtIso).getTime();
  if (Number.isNaN(start) || start > nowMs) return 0;
  const elapsed = nowMs - start;
  return Math.min(1, elapsed / TWENTY_YEARS_MS);
}

export function elapsedMs(quitAtIso, nowMs = Date.now()) {
  if (!quitAtIso) return 0;
  const start = new Date(quitAtIso).getTime();
  if (Number.isNaN(start)) return 0;
  return Math.max(0, nowMs - start);
}

/** Affichage détaillé années → secondes */
export function formatElapsedDetailed(ms) {
  if (ms <= 0) return '0 s';
  let r = Math.floor(ms / 1000);
  const years = Math.floor(r / (365.25 * 24 * 3600));
  r -= Math.floor(years * 365.25 * 24 * 3600);
  const days = Math.floor(r / (24 * 3600));
  r -= days * 24 * 3600;
  const hours = Math.floor(r / 3600);
  r -= hours * 3600;
  const minutes = Math.floor(r / 60);
  const seconds = r - minutes * 60;
  const parts = [];
  if (years > 0) parts.push(`${years} an${years > 1 ? 's' : ''}`);
  if (days > 0) parts.push(`${days} jour${days > 1 ? 's' : ''}`);
  if (hours > 0) parts.push(`${hours} h`);
  if (minutes > 0) parts.push(`${minutes} min`);
  parts.push(`${seconds} s`);
  return parts.join(' ');
}

export function formatElapsedCompact(ms) {
  if (ms <= 0) return '0:00:00';
  const s = Math.floor(ms / 1000);
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (d > 0) return `${d}j ${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
}

/** datetime-local value from ISO */
export function isoToDatetimeLocal(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
