export const getDateStr = (date) => {
  if (!date) return '';
  const dateObj = date instanceof Date ? date : new Date(date);
  if (isNaN(dateObj.getTime())) return '';
  
  const year = dateObj.getFullYear();
  const month = String(dateObj.getMonth() + 1).padStart(2, '0');
  const day = String(dateObj.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const getDayName = (date) => {
  if (!date) return '';
  const dateObj = date instanceof Date ? date : new Date(date);
  if (isNaN(dateObj.getTime())) return '';
  
  const days = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];
  return days[dateObj.getDay()];
};

export const formatDate = (date) => {
  // Vérifier si la date est valide
  if (!date) {
    return 'Date invalide';
  }
  
  // Convertir en objet Date si ce n'est pas déjà le cas
  const dateObj = date instanceof Date ? date : new Date(date);
  
  // Vérifier si la date est valide après conversion
  if (isNaN(dateObj.getTime())) {
    return 'Date invalide';
  }
  
  return dateObj.toLocaleDateString('fr-FR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

export const getWeekNumber = (date) => {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
};

export const getMonthName = (monthIndex) => {
  const months = [
    'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
  ];
  return months[monthIndex];
};

export const getDaysInMonth = (year, month) => {
  return new Date(year, month + 1, 0).getDate();
};

export const getFirstDayOfMonth = (year, month) => {
  return new Date(year, month, 1).getDay();
};

export const addDays = (date, days) => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};

export const subtractDays = (date, days) => {
  const result = new Date(date);
  result.setDate(result.getDate() - days);
  return result;
};

export const isSameDay = (date1, date2) => {
  return getDateStr(date1) === getDateStr(date2);
};

export const isToday = (date) => {
  return isSameDay(date, new Date());
};

export const daysBetween = (date1, date2) => {
  const diffTime = Math.abs(date2 - date1);
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

// Fonction pour calculer automatiquement la variante de semaine A/B
export const getAutoWeekVariant = (date = new Date()) => {
  const weekNumber = getWeekNumber(date);
  // Alternance basée sur le numéro de semaine : pair = A, impair = B
  return weekNumber % 2 === 0 ? 'A' : 'B';
};

/** Date civile locale YYYY-MM-DD (évite le décalage UTC de toISOString sur « aujourd’hui »). */
export const getLocalCalendarDateStr = (date = new Date()) => {
  const d = date instanceof Date ? date : new Date(date);
  if (isNaN(d.getTime())) return '';
  const y = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${month}-${day}`;
};

/** Parse YYYY-MM-DD en Date à minuit local (pas UTC). */
export const parseLocalCalendarDate = (dateStr) => {
  if (!dateStr || typeof dateStr !== 'string') return null;
  const parts = dateStr.split('-').map((x) => parseInt(x, 10));
  if (parts.length !== 3 || parts.some((n) => !Number.isFinite(n))) return null;
  const [y, m, d] = parts;
  return new Date(y, m - 1, d);
};

/** Ajoute `delta` jours à une date YYYY-MM-DD (calendrier local). */
export const addCalendarDays = (dateStr, delta) => {
  const d = parseLocalCalendarDate(dateStr);
  if (!d) return dateStr;
  d.setDate(d.getDate() + delta);
  return getLocalCalendarDateStr(d);
};