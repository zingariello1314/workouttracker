/**
 * Système audio pour l'onglet Apprentissage
 * Génère des sons pour les événements timer
 */

let audioContext = null;

// Créer contexte audio
export const createAudioContext = () => {
  if (!audioContext) {
    try {
      audioContext = new (window.AudioContext || window.webkitAudioContext)();
    } catch (error) {
      console.error('[Apprentissage Audio] Erreur création contexte audio:', error);
      return null;
    }
  }
  return audioContext;
};

// Jouer une note
const playNote = (frequency, duration, startTime = 0, type = 'sine') => {
  const ctx = createAudioContext();
  if (!ctx) return;

  try {
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    oscillator.frequency.value = frequency;
    oscillator.type = type;

    gainNode.gain.setValueAtTime(0.3, ctx.currentTime + startTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + startTime + duration);

    oscillator.start(ctx.currentTime + startTime);
    oscillator.stop(ctx.currentTime + startTime + duration);
  } catch (error) {
    console.error('[Apprentissage Audio] Erreur lecture note:', error);
  }
};

// Sons disponibles
export const sounds = {
  // Double bip harmonieux (Do, Mi) - Fin session
  sessionEnd: () => {
    playNote(523.25, 0.2, 0); // Do
    playNote(659.25, 0.2, 0.15); // Mi
  },

  // Triple bip urgent (La, Do#, Mi) - Fin pause
  breakEnd: () => {
    playNote(440, 0.15, 0); // La
    playNote(554.37, 0.15, 0.1); // Do#
    playNote(659.25, 0.15, 0.2); // Mi
  },

  // Bip simple (Fa) - Avertissement
  warning: () => {
    playNote(349.23, 0.3); // Fa
  },
};

export default sounds;

