/**
 * Archive locale contrôlée des résultats d’évaluation P6.
 * Node (vitest) → artifacts/ + miroir public/ pour fetch navigateur.
 * Navigateur → localStorage (pas d’accès arbitraire au disque).
 */

import { analysisEditionKey } from '../analysisEdition';
import { analyticalJsonStringify } from '../analysisExportDownload';

export const EVAL_ARCHIVE_SCHEMA = 'momentum.analysisEvalArchive.v1';
export const EVAL_STORAGE_KEY = 'momentum.analysisEvalArchive.v1';

/** Chemins stables (Node). Documentés dans artifacts/analysis-eval/README.md */
export const EVAL_ARCHIVE_DIRS = Object.freeze({
  root: 'artifacts/analysis-eval',
  replays: 'artifacts/analysis-eval/replays',
  games: 'artifacts/analysis-eval/games',
  summaries: 'artifacts/analysis-eval/summaries',
  publicMirror: 'public/analysis-eval'
});

export function emptyEvalArchive() {
  return {
    schema: EVAL_ARCHIVE_SCHEMA,
    updatedAt: null,
    edition: null,
    fingerprint: null,
    replay: null,
    games: { A: null, B: null, C: null, bundle: null },
    summary: null
  };
}

export function loadEvalArchiveFromStorage() {
  if (typeof window === 'undefined' || !window.localStorage) return emptyEvalArchive();
  try {
    const raw = window.localStorage.getItem(EVAL_STORAGE_KEY);
    if (!raw) return emptyEvalArchive();
    return { ...emptyEvalArchive(), ...JSON.parse(raw) };
  } catch {
    return emptyEvalArchive();
  }
}

export function saveEvalArchiveToStorage(archive) {
  if (typeof window === 'undefined' || !window.localStorage) return false;
  const next = {
    ...emptyEvalArchive(),
    ...archive,
    updatedAt: new Date().toISOString(),
    edition: archive?.edition || analysisEditionKey()
  };
  window.localStorage.setItem(EVAL_STORAGE_KEY, analyticalJsonStringify(next, 0));
  return true;
}

export function upsertEvalArchiveSlice(partial) {
  const prev = loadEvalArchiveFromStorage();
  const next = {
    ...prev,
    ...partial,
    games: { ...prev.games, ...(partial.games || {}) },
    updatedAt: new Date().toISOString(),
    edition: partial.edition || prev.edition || analysisEditionKey()
  };
  saveEvalArchiveToStorage(next);
  return next;
}

/**
 * Fetch contrôlé des derniers artefacts publiés sous /analysis-eval/.
 * Ne lit pas le disque hors de cette origine.
 */
export async function fetchPublicEvalArtifacts(base = '/analysis-eval') {
  // Miroir public volontairement limité (pas de PII : pas de rejeu ni jeux bruts).
  const files = [
    { key: 'summary', path: `${base}/evaluation-summary-latest.md`, asText: true },
    { key: 'manifest', path: `${base}/manifest-latest.json` }
  ];
  const out = {
    available: {},
    missing: [
      {
        key: 'replay',
        path: `${EVAL_ARCHIVE_DIRS.replays}/p6-replay-latest.json`,
        reason: 'private_artifact_not_public'
      },
      {
        key: 'games',
        path: `${EVAL_ARCHIVE_DIRS.games}/games-bundle-latest.json`,
        reason: 'private_artifact_not_public'
      }
    ],
    fetchedAt: new Date().toISOString()
  };
  await Promise.all(
    files.map(async (file) => {
      try {
        const res = await fetch(file.path, { cache: 'no-store' });
        if (!res.ok) {
          out.missing.push({ key: file.key, path: file.path, reason: `http_${res.status}` });
          return;
        }
        out.available[file.key] = file.asText ? await res.text() : await res.json();
      } catch (error) {
        out.missing.push({ key: file.key, path: file.path, reason: String(error?.message || error) });
      }
    })
  );
  return out;
}

/**
 * Écriture Node uniquement (vitest / scripts).
 * Les rejeux et jeux contenant des données personnelles restent sous artifacts/
 * (hors public/). Seul un manifeste sans PII peut être mirroiré pour le fetch contrôlé.
 */
export function writeEvalArtifactFiles(fs, path, payload) {
  const root = path.resolve(process.cwd(), EVAL_ARCHIVE_DIRS.root);
  const publicMirror = path.resolve(process.cwd(), EVAL_ARCHIVE_DIRS.publicMirror);
  const stamp = String(payload.executedAt || new Date().toISOString()).replace(/[:.]/g, '-');
  const ensure = (dir) => {
    fs.mkdirSync(dir, { recursive: true });
  };
  ensure(path.join(root, 'replays'));
  ensure(path.join(root, 'games'));
  ensure(path.join(root, 'summaries'));
  ensure(path.join(root, 'baselines'));
  ensure(publicMirror);

  const written = [];
  const write = (rel, data, { mirror = false } = {}) => {
    const abs = path.join(root, rel);
    const text = typeof data === 'string' ? data : analyticalJsonStringify(data, 2);
    fs.writeFileSync(abs, text, 'utf8');
    written.push(abs);
    if (!mirror) return;
    // Miroir public : manifeste / résumé synthétique seulement (pas de rejeu ni jeux bruts).
    let mirrorName = null;
    if (rel.includes('evaluation-summary')) mirrorName = 'evaluation-summary-latest.md';
    else if (rel.includes('manifest')) mirrorName = 'manifest-latest.json';
    if (!mirrorName) return;
    const mirrorAbs = path.join(publicMirror, mirrorName);
    fs.writeFileSync(mirrorAbs, text, 'utf8');
    written.push(mirrorAbs);
  };

  if (payload.replay) {
    write(`replays/p6-replay-${stamp}.json`, payload.replay);
    write(`replays/p6-replay-latest.json`, payload.replay);
  }
  if (payload.gamesBundle) {
    write(`games/games-bundle-${stamp}.json`, payload.gamesBundle);
    write(`games/games-bundle-latest.json`, payload.gamesBundle);
  }
  if (payload.gameA) write(`games/game-A-${stamp}.json`, payload.gameA);
  if (payload.gameB) write(`games/game-B-${stamp}.json`, payload.gameB);
  if (payload.gameC) write(`games/game-C-${stamp}.json`, payload.gameC);
  if (payload.summaryMd) {
    write(`summaries/evaluation-summary-${stamp}.md`, payload.summaryMd);
    write(`summaries/evaluation-summary-latest.md`, payload.summaryMd, { mirror: true });
  }
  const manifest = {
    schema: 'momentum.analysisEvalManifest.v1',
    executedAt: payload.executedAt || new Date().toISOString(),
    edition: payload.edition || analysisEditionKey(),
    fingerprint: payload.fingerprint || null,
    snapshotRef: payload.snapshotRef
      ? { label: payload.snapshotRef.label || null, endDate: payload.snapshotRef.endDate || null }
      : null,
    hasReplay: Boolean(payload.replay),
    hasGames: Boolean(payload.gamesBundle || payload.gameA),
    privateArtifactsRoot: EVAL_ARCHIVE_DIRS.root,
    publicMirrorNote: 'Le miroir public n’expose ni rejeu ni jeux bruts (données personnelles).',
    files: written.map((abs) => path.relative(process.cwd(), abs).replace(/\\/g, '/')),
    notes: payload.notes || []
  };
  write(`manifest-${stamp}.json`, manifest);
  write('manifest-latest.json', manifest, { mirror: true });
  return { written, manifest };
}
