/** Section Paramètres → Profil → bloc quiz onboarding */
export const SETTINGS_PROFIL_QUIZ_SECTION_ID = 'settings-profil-quiz';

export const SETTINGS_PENDING_SCROLL_LS = 'settings.pendingScrollSection';

/**
 * Ouvre Paramètres et scroll vers le module quiz profil (sans lancer le modal quiz).
 * @param {(tab: string) => void} setActiveTab
 */
export function openSettingsQuizSection(setActiveTab) {
  try {
    localStorage.setItem(SETTINGS_PENDING_SCROLL_LS, SETTINGS_PROFIL_QUIZ_SECTION_ID);
  } catch {
    /* ignore */
  }
  if (typeof setActiveTab === 'function') {
    setActiveTab('settings');
  }
}

/**
 * Lit l’ancre en attente et la consomme (à appeler au montage de SettingsTab).
 * @returns {string|null}
 */
export function consumePendingSettingsScrollSection() {
  try {
    const id = localStorage.getItem(SETTINGS_PENDING_SCROLL_LS);
    if (id) {
      localStorage.removeItem(SETTINGS_PENDING_SCROLL_LS);
      return id;
    }
  } catch {
    /* ignore */
  }
  return null;
}
