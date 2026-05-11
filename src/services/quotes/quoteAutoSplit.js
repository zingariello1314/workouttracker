/**
 * Découpe automatique d'une phrase en lignes
 * Cible ~28 caractères par ligne, découpe aux espaces uniquement.
 * @param {string} text - Phrase à découper
 * @param {Object} options
 * @param {number} options.targetCharsPerLine - Caractères cibles par ligne (défaut 28)
 * @param {number} options.minLines - Nombre minimum de lignes (défaut 2)
 * @param {number} options.maxLines - Nombre maximum de lignes (défaut 10)
 * @param {number|null} options.balancedLineGoal - Si défini (2–12), découpure ~équilibrée sur ce nombre de lignes (prioritaire sur targetChars/maxLines fixes)
 * @returns {string[]} Tableau de lignes
 */
export function autoSplitText(text, options = {}) {
  let targetCharsPerLine = options.targetCharsPerLine ?? 28;
  let minLines = options.minLines ?? 2;
  let maxLines = options.maxLines ?? 10;
  const balancedLineGoal = options.balancedLineGoal ?? null;

  const trimmed = (text || '').trim();
  if (!trimmed) return [];

  /** Mode Paramètres : viser exactement N lignes visuellement (longues phrases « problématiques »). */
  if (
    balancedLineGoal != null &&
    Number.isFinite(balancedLineGoal) &&
    balancedLineGoal >= 2 &&
    balancedLineGoal <= 12 &&
    !trimmed.includes('\n')
  ) {
    const g = Math.min(12, Math.max(2, Math.floor(balancedLineGoal)));
    targetCharsPerLine = Math.max(16, Math.ceil(trimmed.length / g));
    maxLines = g;
    minLines = Math.min(Math.max(1, minLines), g);
  }


  const words = trimmed.split(/\s+/).filter(Boolean);
  if (words.length === 0) return [trimmed];

  const lines = [];
  let currentLine = '';

  for (let i = 0; i < words.length; i++) {
    const word = words[i];
    const wouldBe = currentLine ? `${currentLine} ${word}` : word;

    if (currentLine && wouldBe.length > targetCharsPerLine) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = wouldBe;
    }
  }

  if (currentLine) {
    lines.push(currentLine);
  }

  // Respecter minLines : si une seule ligne et minLines >= 2, on coupe en deux
  if (lines.length === 1 && minLines >= 2) {
    const mid = Math.floor(lines[0].length / 2);
    const spaceIndex = lines[0].indexOf(' ', mid);
    const splitAt = spaceIndex !== -1 ? spaceIndex : mid;
    return [
      lines[0].slice(0, splitAt).trim(),
      lines[0].slice(splitAt).trim(),
    ];
  }

  // Limiter à maxLines (fusionner les dernières lignes si besoin)
  if (lines.length > maxLines) {
    const kept = lines.slice(0, maxLines - 1);
    const rest = lines.slice(maxLines - 1).join(' ');
    kept.push(rest);
    return kept;
  }

  return lines;
}
