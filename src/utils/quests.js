/**
 * Utilitaires partagés pour les quêtes (créneaux horaires, tri, affichage, prières).
 * @module utils/quests
 */

import { getPrayerTimeForDate } from './prayerTimes';

/** Plages horaires : value (stockage), label (affichage), start (HH:mm pour tri) */
export const CRENEAUX = [
  { value: 'matin', label: 'Matin', start: '06:00' },
  { value: 'midi', label: 'Midi', start: '12:00' },
  { value: 'apres-midi', label: 'Après-midi', start: '14:00' },
  { value: 'soir', label: 'Soir', start: '18:00' },
  { value: 'nuit', label: 'Nuit', start: '21:00' },
];

function parseHeureToMinutes(heure) {
  if (!heure || typeof heure !== 'string') return 24 * 60;
  const m = heure.trim().match(/^([0-1]?[0-9]|2[0-3]):([0-5][0-9])$/);
  return m ? parseInt(m[1], 10) * 60 + parseInt(m[2], 10) : 24 * 60;
}

/** Minutes depuis minuit pour une heure HH:mm */
function addMinutesToTime(timeStr, deltaMinutes) {
  const min = parseHeureToMinutes(timeStr);
  const total = min + deltaMinutes;
  const h = Math.floor(total / 60) % 24;
  const m = total % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

/**
 * Retourne les minutes depuis minuit pour trier une quête par heure.
 * - prière : heure calculée pour targetDateStr si prayerLocation fourni
 * - créneau : heure de début du créneau (matin → 6h, etc.)
 * - précise : heure stockée (ou fin de journée si vide)
 * @param {Object} quest
 * @param {string} [targetDateStr] - Date YYYY-MM-DD (pour quêtes prière)
 * @param {{ lat: number, lng: number }} [prayerLocation] - Position pour calcul prière
 */
export function getHeureSortMinutes(quest, targetDateStr, prayerLocation) {
  if (quest?.priere && targetDateStr && prayerLocation) {
    const h = getPrayerTimeForDate(targetDateStr, quest.priere, prayerLocation);
    if (h) return parseHeureToMinutes(h);
  }
  if (quest?.heureType === 'creneau' && quest?.creneau) {
    const c = CRENEAUX.find((x) => x.value === quest.creneau);
    return c ? parseHeureToMinutes(c.start) : 24 * 60;
  }
  return parseHeureToMinutes(quest?.heure);
}

/**
 * Texte d'affichage pour l'heure d'une quête :
 * - prière : heure calculée pour la date (ou message si pas de position)
 * - créneau : "Matin", "Soir", etc.
 * - précise avec durée : "14:00 – 14:30" (début + durée)
 * - précise sans durée / juste heure : "14:00"
 * @param {Object} quest
 * @param {string} [targetDateStr] - Date YYYY-MM-DD (pour quêtes prière)
 * @param {{ lat: number, lng: number }} [prayerLocation] - Position pour calcul prière
 */
export function getHeureDisplay(quest, targetDateStr, prayerLocation) {
  if (!quest) return '';
  if (quest.priere && targetDateStr && prayerLocation) {
    const h = getPrayerTimeForDate(targetDateStr, quest.priere, prayerLocation);
    if (h) return h;
    return '—';
  }
  if (quest.priere) return 'Config. position';
  if (quest.heureType === 'creneau' && quest.creneau) {
    const c = CRENEAUX.find((x) => x.value === quest.creneau);
    return c ? c.label : '';
  }
  const start = quest.heure?.trim();
  if (!start) return '';
  const duree = typeof quest.duree === 'number' && quest.duree > 0 ? quest.duree : 0;
  if (duree > 0) {
    const end = addMinutesToTime(start, duree);
    return `${start} – ${end}`;
  }
  return start;
}

/** Limites en minutes depuis minuit pour chaque créneau (début inclus, fin exclue). Nuit = 21h-6h. */
const CRENEAU_RANGES = [
  { value: 'matin', min: 6 * 60, max: 12 * 60 },       // 6h-11h59
  { value: 'midi', min: 12 * 60, max: 14 * 60 },       // 12h-13h59
  { value: 'apres-midi', min: 14 * 60, max: 18 * 60 },  // 14h-17h59
  { value: 'soir', min: 18 * 60, max: 21 * 60 },       // 18h-20h59
  { value: 'nuit', min: 21 * 60, max: 24 * 60 },       // 21h-23h59
  { value: 'nuit', min: 0, max: 6 * 60 },              // 0h-5h59
];

/**
 * Retourne le créneau (matin, midi, apres-midi, soir, nuit) pour des minutes depuis minuit.
 * 24*60 (pas d'heure) → 'sans-heure'.
 */
export function getCreneauFromMinutes(minutes) {
  if (minutes == null || minutes >= 24 * 60) return 'sans-heure';
  for (const r of CRENEAU_RANGES) {
    if (minutes >= r.min && minutes < r.max) return r.value;
  }
  return 'sans-heure';
}

/**
 * Retourne le créneau d'une quête (pour regroupement quand tri par heure).
 */
export function getCreneauForQuest(quest, targetDateStr, prayerLocation) {
  const min = getHeureSortMinutes(quest, targetDateStr, prayerLocation);
  return getCreneauFromMinutes(min);
}

/** Ordre des créneaux pour l'affichage (sections). */
export const CRENEAU_ORDER = ['matin', 'midi', 'apres-midi', 'soir', 'nuit', 'sans-heure'];
