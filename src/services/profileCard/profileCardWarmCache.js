/** Photo de sidebar déjà lue pendant le chargement du site, pour le premier affichage. */
let warm = null;

export function rememberProfileCardWarm(username, data) {
  if (!username || !data) {
    warm = null;
    return;
  }
  warm = {
    username: String(username),
    avatarUrl: data.avatarUrl || null,
    avatars: data.avatars || [],
    activeAvatarIndex: data.activeAvatarIndex ?? 0,
    handle: data.handle || String(username),
    cardIconUrl: data.cardIconUrl || null,
    cardIcons: data.cardIcons || [],
    activeCardIconIndex: data.activeCardIconIndex ?? 0,
    gradeArtId: data.gradeArtId || null,
    cardIconMode: data.cardIconMode || null
  };
}

export function readProfileCardWarm(username) {
  if (!warm || !username || warm.username !== String(username)) return null;
  return warm;
}
