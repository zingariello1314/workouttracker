/**
 * 🧘 STRETCH UTILS — Normalisation et résolution des étirements
 *
 * Cette couche d'adaptation existe parce que plusieurs formats historiques cohabitent
 * dans le code pour `etirements` :
 *
 *   1. Legacy string      : { matin: "1 min … + 2 min …", midi: "...", soir: "..." }
 *   2. Objet enrichi      : { matin: { name, duration, instructions }, midi: ..., soir: ... }
 *   3. Tableau d'objets   : { matin: [ {id, stretchKey, duration}, ... ], midi: [...], soir: [...] }
 *      (= format canonique ciblé)
 *
 * Tous les consommateurs (TodayTab, ProgramDetailView, calendrier, XP…) doivent passer
 * par `normalizeStretchSlots(raw)` pour obtenir une structure homogène avec **un item
 * par étirement individuel** (groupable par moment).
 *
 * Chaque item normalisé a la forme :
 *   {
 *     id            : number,               // ID stable (ex. 9111 = lundi matin 1)
 *     moment        : 'matin' | 'midi' | 'soir',
 *     stretchKey    : string | null,        // clé dans stretchDatabase, ou null si libre
 *     name          : string,               // libellé (depuis banque ou customName)
 *     duration      : number,               // durée en secondes
 *     instructions  : string,               // instructions (depuis banque ou item)
 *     bodyZone      : string,               // si stretchKey résolu
 *     primaryMuscles: string[],             // si stretchKey résolu
 *     fromBank      : boolean,              // true si l'item référence la banque
 *     legacyText    : string | null         // fallback pour items issus du parsing legacy
 *   }
 *
 * @module stretchUtils
 */

import { stretchDatabase, getStretchByKey } from '../data/stretchDatabase';

export const STRETCH_MOMENTS = ['matin', 'midi', 'soir'];

/**
 * Construit un ID numérique stable pour un étirement de programme par défaut.
 *
 * Format : 9<jour 1-7><moment 1-3><idx 1-9>
 *   - jour : lundi=1, mardi=2, mercredi=3, jeudi=4, vendredi=5, samedi=6, dimanche=7
 *   - moment : matin=1, midi=2, soir=3
 *   - idx : index 1-based dans la liste du moment
 *
 * Range réservé : 9000-9999 (n'entre pas en conflit avec les exercices 100-799).
 */
const DAY_INDEX = { lundi: 1, mardi: 2, mercredi: 3, jeudi: 4, vendredi: 5, samedi: 6, dimanche: 7 };
const MOMENT_INDEX = { matin: 1, midi: 2, soir: 3 };

export function buildDefaultStretchId(dayName, moment, index1Based) {
  const d = DAY_INDEX[dayName];
  const m = MOMENT_INDEX[moment];
  if (!d || !m || !Number.isFinite(index1Based)) return null;
  return 9000 + d * 100 + m * 10 + Math.min(9, Math.max(1, index1Based));
}

/**
 * Vérifie si un ID appartient au range réservé aux étirements (9000-9999).
 */
export function isStretchId(id) {
  const n = Number(id);
  return Number.isFinite(n) && n >= 9000 && n <= 9999;
}

/**
 * Construit un item normalisé enrichi avec les données de la banque (si stretchKey résolvable).
 */
function buildResolvedItem({ id, moment, stretchKey, duration, customName, customInstructions, legacyText }) {
  const dbEntry = stretchKey ? getStretchByKey(stretchKey) : null;
  return {
    id,
    moment,
    stretchKey: stretchKey || null,
    name: customName || dbEntry?.name || (legacyText ? legacyText.slice(0, 80) : 'Étirement'),
    duration: Number.isFinite(duration) && duration > 0
      ? duration
      : (dbEntry?.defaultDuration || 60),
    instructions: customInstructions || dbEntry?.instructions || legacyText || '',
    bodyZone: dbEntry?.bodyZone || 'full',
    primaryMuscles: dbEntry?.primaryMuscles || [],
    fromBank: Boolean(dbEntry),
    legacyText: legacyText || null
  };
}

/**
 * Parse une chaîne legacy de type "1 min respiration nasale lente (...) + 2 min mobilisation cervicale (...)"
 * en items individuels en tentant un best-effort de matching avec la banque.
 *
 * Stratégie :
 *   1. Split sur " + " (séparateur historique du programme).
 *   2. Pour chaque segment, extraire la durée en minutes ("X min") → secondes.
 *   3. Tenter de matcher le segment avec une entrée de la banque par mots-clés (variations + name).
 *   4. Si match → item résolu avec stretchKey ; sinon → item "libre" avec legacyText.
 */
function parseLegacyStretchString(rawText, dayName, moment) {
  if (!rawText || typeof rawText !== 'string') return [];

  const segments = rawText
    .split(/\s+\+\s+/)
    .map((s) => s.trim())
    .filter(Boolean);

  return segments.map((segment, idx) => {
    const id = buildDefaultStretchId(dayName, moment, idx + 1) || (90000 + idx);
    const durationMatch = segment.match(/(\d+(?:[.,]\d+)?)\s*min/i);
    const minutes = durationMatch ? parseFloat(durationMatch[1].replace(',', '.')) : null;
    const duration = minutes ? Math.round(minutes * 60) : 60;

    const lower = segment.toLowerCase();
    const matchKey = Object.keys(stretchDatabase).find((key) => {
      const entry = stretchDatabase[key];
      const tokens = [entry.name, ...(entry.variations || [])]
        .map((t) => t.toLowerCase())
        .filter((t) => t.length >= 4);
      return tokens.some((t) => lower.includes(t));
    });

    return buildResolvedItem({
      id,
      moment,
      stretchKey: matchKey || null,
      duration,
      legacyText: segment
    });
  });
}

/**
 * Normalise un objet `etirements` au format canonique :
 *   { matin: NormalizedItem[], midi: NormalizedItem[], soir: NormalizedItem[] }
 *
 * Accepte n'importe quel format historique (string / objet enrichi / tableau).
 *
 * @param {*} raw - Source brute (string, objet, tableau, undefined…)
 * @param {string} [dayName] - Nom du jour (pour les IDs stables des items legacy)
 * @returns {{matin: Object[], midi: Object[], soir: Object[]}}
 */
export function normalizeStretchSlots(raw, dayName = null) {
  const out = { matin: [], midi: [], soir: [] };
  if (!raw || typeof raw !== 'object') return out;

  for (const moment of STRETCH_MOMENTS) {
    const slot = raw[moment];
    if (slot == null) continue;

    if (Array.isArray(slot)) {
      slot.forEach((item, idx) => {
        if (!item) return;
        const id = item.id ?? buildDefaultStretchId(dayName, moment, idx + 1) ?? (95000 + idx);
        let dur = item.duration;
        if (typeof dur === 'string') {
          const n = parseInt(String(dur).trim(), 10);
          dur = Number.isFinite(n) ? n : null;
        }
        out[moment].push(buildResolvedItem({
          id,
          moment,
          stretchKey: item.stretchKey || item.key || null,
          duration: dur,
          customName: item.customName || item.name,
          customInstructions: item.customInstructions || item.instructions,
          legacyText: item.legacyText || null
        }));
      });
      continue;
    }

    if (typeof slot === 'string') {
      out[moment] = parseLegacyStretchString(slot, dayName, moment);
      continue;
    }

    if (typeof slot === 'object') {
      const text = slot.instructions || slot.description || slot.text;
      if (typeof text === 'string' && text.includes(' + ')) {
        out[moment] = parseLegacyStretchString(text, dayName, moment);
      } else if (text && typeof text === 'string') {
        const id = buildDefaultStretchId(dayName, moment, 1) ?? 95000;
        out[moment] = [buildResolvedItem({
          id,
          moment,
          stretchKey: null,
          duration: typeof slot.duration === 'number'
            ? slot.duration
            : null,
          customName: slot.name,
          customInstructions: text
        })];
      }
    }
  }

  return out;
}

/**
 * Aplatit les 3 moments en un tableau plat d'items (utile pour itérer).
 */
export function flattenStretchItems(slots) {
  if (!slots) return [];
  return [...(slots.matin || []), ...(slots.midi || []), ...(slots.soir || [])];
}

/**
 * Compte le nombre total d'items d'étirement planifiés pour un workout normalisé.
 */
export function countStretchItems(slots) {
  return flattenStretchItems(slots).length;
}

const DAY_NAMES = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];

function dayNameFromDateStr(dateStr) {
  const d = new Date(`${dateStr}T12:00:00`);
  if (Number.isNaN(d.getTime())) return null;
  return DAY_NAMES[d.getDay()];
}

/**
 * Construit la liste plate des items d'étirement planifiés pour une date donnée,
 * en agrégeant :
 *   • le programme par défaut (`workoutProgram[dayName]`)
 *   • les programmes custom passés en contexte (`ctx.programs`)
 *
 * Le résultat sert :
 *   • au calcul d'XP étirements (résoudre stretchId → stretchKey → notes)
 *   • à l'agrégation calendrier / complétion (combien d'items prévus ce jour ?)
 *
 * @param {string} dateStr - "YYYY-MM-DD"
 * @param {Object} workoutProgram - Programme par défaut (importé)
 * @param {Object} [ctx]
 * @param {Array} [ctx.programs] - Programmes custom de l'utilisateur (chacun avec `.schedule`)
 * @param {boolean} [ctx.includeDefault=true] - Inclure le programme par défaut (passe `false` pour ignorer)
 * @returns {Array<{moment: string, id: number|string, stretchKey: string|null, duration: number, name: string}>}
 */
export function buildPlannedStretchItemsForDateStr(dateStr, workoutProgram, ctx = {}) {
  const dayName = dayNameFromDateStr(dateStr);
  if (!dayName) return [];

  const { programs = [], includeDefault = true } = ctx;
  const out = [];
  const seen = new Set(); // déduplication par (moment + id)

  const pushAll = (rawEtirements, dayKey) => {
    const slots = normalizeStretchSlots(rawEtirements, dayKey);
    for (const moment of STRETCH_MOMENTS) {
      for (const item of slots[moment] || []) {
        const dedupKey = `${moment}_${item.id}`;
        if (seen.has(dedupKey)) continue;
        seen.add(dedupKey);
        out.push({
          moment,
          id: item.id,
          stretchKey: item.stretchKey,
          duration: item.duration,
          name: item.name
        });
      }
    }
  };

  if (includeDefault) {
    const defaultDay = workoutProgram?.[dayName];
    if (defaultDay?.etirements) {
      pushAll(defaultDay.etirements, dayName);
    }
  }

  if (Array.isArray(programs)) {
    for (const program of programs) {
      const daySchedule = program?.schedule?.[dayName];
      if (daySchedule?.etirements) {
        pushAll(daySchedule.etirements, dayName);
      }
    }
  }

  return out;
}
