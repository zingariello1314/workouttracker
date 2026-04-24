import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Image as ImageIcon, Lightbulb, Link2, Paperclip, Plus, Send } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useGitHubDashboard } from '../../hooks/useGitHubDashboard';
import { flattenWeeksToDayMap } from '../../utils/githubContributions';
import {
  appendCodeJournalEntryAsync,
  loadCodeJournalEntriesAsync,
  initCodeJournalForUser,
  addJournalXpBonus,
  JOURNAL_XP_PER_SAVE,
} from '../../services/code/codeJournalIDB';
import JournalBoltBackdrop from './JournalBoltBackdrop';
import CodeJournalEntryPage from './CodeJournalEntryPage';
import {
  JOURNAL_MODES,
  normalizeJournalUrl,
  isValidJournalHttpUrl,
  cloneJournalLinks,
} from './codeJournalShared';

/** Même libellé que le module Bolt de référence (`moduleecrireporujournalgithub.md`). */
const BOLT_DEFAULT_PLACEHOLDER = 'What do you want to build?';
function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result || ''));
    r.onerror = reject;
    r.readAsDataURL(file);
  });
}
function todayUtcYmd() {
  const n = new Date();
  return `${n.getUTCFullYear()}-${String(n.getUTCMonth() + 1).padStart(2, '0')}-${String(n.getUTCDate()).padStart(2, '0')}`;
}
/** Date UTC `YYYY-MM-DD` à partir d’un ISO stocké. */
function utcYmdFromIso(iso) {
  if (!iso) return null;
  const s = String(iso);
  const d = s.slice(0, 10);
  if (/^\d{4}-\d{2}-\d{2}$/.test(d)) return d;
  try {
    const n = new Date(iso);
    if (Number.isNaN(n.getTime())) return null;
    return `${n.getUTCFullYear()}-${String(n.getUTCMonth() + 1).padStart(2, '0')}-${String(n.getUTCDate()).padStart(2, '0')}`;
  } catch {
    return null;
  }
}
/**
 * @param {object} entry
 * @param {Map<string, object>} dayMap
 * @returns {{ value: number | null; source: 'stored' | 'heatmap' | 'unknown' }}
 */
function contributionsForEntry(entry, dayMap) {
  const day = entry.githubDayUtc || utcYmdFromIso(entry.createdAt);
  if (entry.githubContributionsUtc != null && entry.githubContributionsUtc !== '') {
    const v = Number(entry.githubContributionsUtc);
    if (!Number.isNaN(v)) return { value: v, source: 'stored' };
  }
  if (day && dayMap?.has(day)) {
    return { value: Number(dayMap.get(day)?.contributionCount) || 0, source: 'heatmap' };
  }
  return { value: null, source: 'unknown' };
}
export default function CodeJournalDirectivesSubTab() {
  const { currentUser, isAuthenticated } = useAuth();
  const userId = currentUser?.id || 'main';
  const token = currentUser?.github?.accessToken;
  const login = currentUser?.github?.login;
  const connected = !!(isAuthenticated && token && login);
  const gh = useGitHubDashboard(token, connected);
  const [message, setMessage] = useState('');
  const [modeIndex, setModeIndex] = useState(0);
  const [attachments, setAttachments] = useState([]);
  const [links, setLinks] = useState([]);
  const [linkUrl, setLinkUrl] = useState('');
  const [linkTitle, setLinkTitle] = useState('');
  const [linkError, setLinkError] = useState('');
  const [showAttach, setShowAttach] = useState(false);
  const [entries, setEntries] = useState([]);
  const [journalReady, setJournalReady] = useState(false);
  const fileRef = useRef(null);
  const imgRef = useRef(null);
  const taRef = useRef(null);
  const [filterMode, setFilterMode] = useState('all');
  const [onlyWithAttachments, setOnlyWithAttachments] = useState(false);
  const [sortOrder, setSortOrder] = useState('desc');
  const [pageEntry, setPageEntry] = useState(null);
  const mode = JOURNAL_MODES[modeIndex];
  const contributionDayMap = useMemo(() => flattenWeeksToDayMap(gh.yearWeeks), [gh.yearWeeks]);
  const refreshEntries = useCallback(async () => {
    const rows = await loadCodeJournalEntriesAsync(userId);
    setEntries(rows);
  }, [userId]);
  useEffect(() => {
    let cancelled = false;
    (async () => {
      await initCodeJournalForUser(userId);
      const rows = await loadCodeJournalEntriesAsync(userId);
      if (!cancelled) {
        setEntries(rows);
        setJournalReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [userId]);
  useEffect(() => {
    const el = taRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(220, Math.max(88, el.scrollHeight))}px`;
  }, [message]);
  const todayCount = useMemo(() => {
    const map = flattenWeeksToDayMap(gh.yearWeeks);
    return Number(map.get(todayUtcYmd())?.contributionCount) || 0;
  }, [gh.yearWeeks]);
  const displayedEntries = useMemo(() => {
    let list = [...entries];
    if (filterMode !== 'all') list = list.filter((e) => e.mode === filterMode);
    if (onlyWithAttachments) {
      list = list.filter(
        (e) =>
          (Array.isArray(e.attachments) && e.attachments.length > 0) || (Array.isArray(e.links) && e.links.length > 0),
      );
    }
    list.sort((a, b) => {
      const ca = String(a.createdAt || '');
      const cb = String(b.createdAt || '');
      return sortOrder === 'desc' ? cb.localeCompare(ca) : ca.localeCompare(cb);
    });
    return list.slice(0, 500);
  }, [entries, filterMode, onlyWithAttachments, sortOrder]);
  const cycleMode = useCallback(() => {
    setModeIndex((i) => (i + 1) % JOURNAL_MODES.length);
  }, []);
  const onPickFiles = async (e, setter) => {
    const files = [...(e.target.files || [])];
    e.target.value = '';
    setShowAttach(false);
    for (const f of files.slice(0, 4)) {
      if (f.size > 1.5 * 1024 * 1024) continue;
      try {
        const dataUrl = await readFileAsDataUrl(f);
        setter((a) =>
          [...a, { id: `${Date.now()}-${f.name}`, name: f.name, kind: f.type.startsWith('image/') ? 'image' : 'file', dataUrl }].slice(0, 6),
        );
      } catch {
        // ignore
      }
    }
  };
  const addComposerLink = () => {
    setLinkError('');
    const normalized = normalizeJournalUrl(linkUrl);
    if (!normalized || !isValidJournalHttpUrl(normalized)) {
      setLinkError('URL invalide (https://…)');
      return;
    }
    setLinks((prev) =>
      [...prev, { id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, url: normalized, title: linkTitle.trim() }].slice(
        0,
        24,
      ),
    );
    setLinkUrl('');
    setLinkTitle('');
  };

  const handleSend = async () => {
    const text = message.trim();
    if (!text && attachments.length === 0 && links.length === 0) return;
    const createdAt = new Date().toISOString();
    const githubDayUtc = utcYmdFromIso(createdAt);
    const payload = {
      mode: mode.id,
      text,
      attachments: attachments.map(({ id, name, kind, dataUrl }) => ({ id, name, kind, dataUrl })),
      links: cloneJournalLinks(links),
      createdAt,
      githubDayUtc,
    };
    if (githubDayUtc && contributionDayMap.has(githubDayUtc)) {
      payload.githubContributionsUtc = Number(contributionDayMap.get(githubDayUtc)?.contributionCount) || 0;
    }
    await appendCodeJournalEntryAsync(userId, payload);
    if (isAuthenticated) {
      try {
        await addJournalXpBonus(userId, JOURNAL_XP_PER_SAVE);
      } catch {
        // bonus secondaire : ne pas bloquer la sauvegarde
      }
    }
    setMessage('');
    setAttachments([]);
    setLinks([]);
    setLinkUrl('');
    setLinkTitle('');
    setLinkError('');
    await refreshEntries();
  };
  const onKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      void handleSend();
    }
  };
  if (pageEntry) {
    return (
      <CodeJournalEntryPage
        userId={userId}
        initialEntry={pageEntry}
        connected={connected}
        contributionDayMap={contributionDayMap}
        onBack={() => setPageEntry(null)}
        onEntriesChanged={refreshEntries}
      />
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6 py-6">
      <header className="text-center">
        <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl">
          What will you <span className="bg-gradient-to-b from-rose-300 via-fuchsia-300 to-white bg-clip-text italic text-transparent">build</span> today?
        </h1>
      </header>
      {connected && todayCount > 0 ? (
        <div className="rounded-lg border border-rose-400/50 bg-rose-950/25 px-4 py-3 text-sm text-rose-100">
          Tu as <strong className="text-white">{todayCount}</strong> contribution{todayCount > 1 ? 's' : ''} GitHub
          aujourd’hui (UTC) sur la période affichée du calendrier — un bon moment pour écrire ton journal du jour.
        </div>
      ) : null}
      <div className="relative mx-auto w-full max-w-[760px] overflow-hidden rounded-2xl border border-rose-500/45 shadow-[0_0_0_1px_rgba(225,29,72,0.12),0_8px_32px_rgba(0,0,0,0.55)]">
        <JournalBoltBackdrop />
        <div className="pointer-events-none absolute inset-x-0 top-0 z-[1] h-px bg-gradient-to-r from-transparent via-rose-300/40 to-transparent" />
        <div className="relative z-10 rounded-2xl bg-[#1a1118]/88 backdrop-blur-xl">
          <textarea
            ref={taRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder={BOLT_DEFAULT_PLACEHOLDER}
            rows={3}
            disabled={!journalReady}
            className="min-h-[88px] w-full resize-none border-0 bg-transparent px-5 pb-2 pt-5 text-[15px] text-rose-50 placeholder:text-rose-200/35 focus:outline-none focus:ring-0 disabled:opacity-50"
          />
          <div className="relative z-10 border-t border-rose-500/20 px-5 py-3">
            <div className="mb-2 flex items-center gap-2 text-xs font-medium text-rose-200/95">
              <Link2 className="size-3.5 shrink-0 text-rose-300" aria-hidden />
              Liens (ils apparaîtront dans « Entrées récentes » après enregistrement)
            </div>
            {links.length > 0 ? (
              <div className="mb-2 flex items-center gap-3 text-xs text-rose-200/90">
                <p>{links.length} lien(s) prêt(s) à enregistrer.</p>
                <button
                  type="button"
                  className="rounded border border-rose-500/40 px-2 py-0.5 text-rose-100 hover:bg-rose-900/35"
                  onClick={() => setLinks([])}
                >
                  Vider
                </button>
              </div>
            ) : null}
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
              <input
                type="url"
                inputMode="url"
                value={linkUrl}
                onChange={(e) => {
                  setLinkUrl(e.target.value);
                  setLinkError('');
                }}
                placeholder="https://exemple.com"
                className="min-w-0 flex-1 rounded-lg border border-rose-500/35 bg-[#120c12] px-3 py-2 text-sm text-rose-50 placeholder:text-rose-300/45 focus:border-rose-400/70 focus:outline-none"
              />
              <input
                type="text"
                value={linkTitle}
                onChange={(e) => setLinkTitle(e.target.value)}
                placeholder="Titre (optionnel)"
                className="min-w-0 flex-1 rounded-lg border border-rose-500/35 bg-[#120c12] px-3 py-2 text-sm text-rose-50 placeholder:text-rose-300/45 focus:border-rose-400/70 focus:outline-none sm:max-w-[220px]"
              />
              <button
                type="button"
                onClick={addComposerLink}
                className="shrink-0 rounded-lg border border-rose-500/45 bg-rose-950/40 px-3 py-2 text-sm font-medium text-rose-100 hover:bg-rose-900/50"
              >
                Ajouter le lien
              </button>
            </div>
            {linkError ? <p className="mt-1.5 text-xs text-amber-300/90">{linkError}</p> : null}
          </div>
          {attachments.length > 0 ? (
            <div className="relative z-10 flex flex-wrap gap-2 border-t border-rose-500/20 px-5 py-2">
              {attachments.map((a) => (
                <div
                  key={a.id}
                  className="flex items-center gap-1 rounded-md border border-rose-500/35 bg-black/55 px-2 py-1 text-xs text-rose-100"
                >
                  {a.kind === 'image' ? (
                    <img src={a.dataUrl} alt="" className="h-8 w-8 rounded object-cover" />
                  ) : (
                    <Paperclip className="h-3.5 w-3.5 shrink-0 text-rose-300" />
                  )}
                  <span className="max-w-[10rem] truncate">{a.name}</span>
                  <button
                    type="button"
                    className="ml-1 text-rose-300 hover:text-rose-100"
                    onClick={() => setAttachments((x) => x.filter((z) => z.id !== a.id))}
                    aria-label="Retirer la pièce jointe"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          ) : null}
          <div className="relative z-10 flex items-center justify-between gap-2 border-t border-rose-500/20 px-3 pb-3 pt-2">
            <div className="relative flex items-center gap-1">
              <button
                type="button"
                onClick={() => setShowAttach((s) => !s)}
                className="flex size-9 items-center justify-center rounded-full border border-rose-500/40 bg-rose-950/35 text-rose-100 transition hover:bg-rose-900/50 hover:text-white"
                aria-label="Ajouter un fichier ou une image"
              >
                <Plus className={`size-4 transition-transform ${showAttach ? 'rotate-45' : ''}`} />
              </button>
              <input ref={fileRef} type="file" className="hidden" multiple onChange={(e) => void onPickFiles(e, setAttachments)} />
              <input ref={imgRef} type="file" accept="image/*" className="hidden" multiple onChange={(e) => void onPickFiles(e, setAttachments)} />
              {showAttach && (
                <>
                  <button type="button" className="fixed inset-0 z-40 cursor-default bg-transparent" aria-hidden onClick={() => setShowAttach(false)} />
                  <div className="absolute bottom-full left-0 z-50 mb-2 min-w-[200px] overflow-hidden rounded-xl border border-rose-500/40 bg-[#140f14]/95 py-1 shadow-xl shadow-black/60 backdrop-blur-md">
                    <button
                      type="button"
                      className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-rose-100/90 hover:bg-rose-950/50"
                      onClick={() => {
                        imgRef.current?.click();
                      }}
                    >
                      <ImageIcon className="size-4 shrink-0" />
                      Ajouter une image
                    </button>
                    <button
                      type="button"
                      className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-rose-100/90 hover:bg-rose-950/50"
                      onClick={() => {
                        fileRef.current?.click();
                      }}
                    >
                      <Paperclip className="size-4 shrink-0" />
                      Joindre un fichier
                    </button>
                  </div>
                </>
              )}
            </div>
            <div className="flex flex-1 justify-end gap-2">
              <button
                type="button"
                onClick={cycleMode}
                className="flex items-center gap-1.5 rounded-full border border-rose-500/35 px-3 py-2 text-xs font-medium text-rose-100/90 transition hover:border-rose-400/60 hover:bg-rose-950/40 hover:text-white"
              >
                <Lightbulb className="size-4 shrink-0" />
                <span className="hidden sm:inline">{mode.label}</span>
                <span className="sm:hidden">Mode</span>
              </button>
              <button
                type="button"
                onClick={() => void handleSend()}
                disabled={(!message.trim() && attachments.length === 0 && links.length === 0) || !journalReady}
                className="flex items-center gap-2 rounded-full border border-rose-400/60 bg-gradient-to-r from-rose-700 to-fuchsia-700 px-4 py-2 text-sm font-medium text-white shadow-[0_0_18px_rgba(225,29,72,0.35)] transition hover:from-rose-600 hover:to-fuchsia-600 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <Send className="size-4" />
                Build now
              </button>
            </div>
          </div>
        </div>
      </div>
      <section className="rounded-xl border border-rose-500/35 bg-black/40 px-4 py-4">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-rose-300/90">Entrées récentes</h2>
          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
            <label className="flex flex-col gap-1 text-xs text-rose-200/80">
              <span>Type</span>
              <select
                value={filterMode}
                onChange={(e) => setFilterMode(e.target.value)}
                className="rounded-lg border border-rose-500/40 bg-black px-2 py-1.5 text-sm text-rose-50 focus:border-rose-400 focus:outline-none"
              >
                <option value="all">Tous</option>
                {JOURNAL_MODES.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1 text-xs text-rose-200/80">
              Tri
              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value)}
                className="rounded-lg border border-rose-500/40 bg-black px-2 py-1.5 text-sm text-rose-50 focus:border-rose-400 focus:outline-none"
              >
                <option value="desc">Plus récent → plus ancien</option>
                <option value="asc">Plus ancien → plus récent</option>
              </select>
            </label>
            <label className="flex cursor-pointer items-center gap-2 text-xs text-rose-200/90">
              <input
                type="checkbox"
                checked={onlyWithAttachments}
                onChange={(e) => setOnlyWithAttachments(e.target.checked)}
                className="rounded border-rose-500/50 bg-black text-rose-600 focus:ring-rose-500"
              />
              Fichiers / images ou liens uniquement
            </label>
          </div>
        </div>
        {entries.length === 0 ? (
          <p className="text-sm text-rose-200/60">Aucune entrée pour l’instant.</p>
        ) : displayedEntries.length === 0 ? (
          <p className="text-sm text-rose-200/60">Aucune entrée ne correspond aux filtres.</p>
        ) : (
          <ul className="space-y-3 text-sm text-rose-100/90">
            {displayedEntries.map((e) => {
              const { value: ghCount, source } = contributionsForEntry(e, contributionDayMap);
              const ghLabel =
                ghCount != null
                  ? `${ghCount} contribution${ghCount !== 1 ? 's' : ''} GitHub (jour de la saisie, UTC)`
                  : source === 'unknown'
                    ? 'Contributions ce jour-là : non disponible (hors fenêtre du calendrier ou ancienne entrée)'
                    : 'Contributions ce jour-là : —';
              return (
                <li key={e.id}>
                  <div
                    role="button"
                    tabIndex={0}
                    onClick={() => setPageEntry(e)}
                    onKeyDown={(ev) => {
                      if (ev.key === 'Enter' || ev.key === ' ') {
                        ev.preventDefault();
                        setPageEntry(e);
                      }
                    }}
                    className="w-full cursor-pointer rounded-lg border border-rose-500/25 bg-black/50 p-3 text-left transition hover:border-rose-400/50 hover:bg-black/70 focus:outline-none focus:ring-2 focus:ring-rose-500/50"
                  >
                    <div className="mb-1 flex flex-wrap items-center gap-2 text-xs text-rose-300/80">
                      <span className="rounded-full border border-rose-500/40 px-2 py-0.5 font-medium text-rose-100">
                        {JOURNAL_MODES.find((m) => m.id === e.mode)?.label || e.mode}
                      </span>
                      <time dateTime={e.createdAt}>
                        {e.createdAt
                          ? new Date(e.createdAt).toLocaleString('fr-FR', {
                              dateStyle: 'medium',
                              timeStyle: 'short',
                            })
                          : ''}
                      </time>
                      {connected ? (
                        <span className="text-rose-400/90" title={ghLabel}>
                          · {ghCount != null ? `${ghCount} contrib.` : 'contrib. ?'}
                        </span>
                      ) : null}
                    </div>
                    {e.text ? (
                      <p className="line-clamp-3 whitespace-pre-wrap text-rose-50/95">{e.text}</p>
                    ) : (
                      <p className="text-rose-300/70">
                        {Array.isArray(e.attachments) && e.attachments.length > 0
                          ? '(Pièces jointes)'
                          : Array.isArray(e.links) && e.links.length > 0
                            ? '(Liens)'
                            : '(Sans texte)'}
                      </p>
                    )}
                    {Array.isArray(e.links) && e.links.length > 0 ? (
                      <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                        <Link2 className="size-3.5 shrink-0 text-rose-400" aria-hidden />
                        {e.links.slice(0, 4).map((l) => (
                          <a
                            key={l.id || l.url}
                            href={l.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="max-w-[12rem] truncate rounded border border-rose-500/35 bg-black/50 px-2 py-0.5 text-rose-300 underline hover:text-rose-100"
                            onClick={(ev) => ev.stopPropagation()}
                          >
                            {l.title || l.url}
                          </a>
                        ))}
                        {e.links.length > 4 ? <span className="text-rose-400/80">+{e.links.length - 4}</span> : null}
                      </div>
                    ) : null}
                    {Array.isArray(e.attachments) && e.attachments.length > 0 ? (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {e.attachments.map((a) =>
                          a.kind === 'image' ? (
                            <img
                              key={a.id || a.name}
                              src={a.dataUrl}
                              alt={a.name}
                              className="max-h-24 rounded border border-rose-500/30"
                            />
                          ) : (
                            <span key={a.id || a.name} className="text-xs text-rose-400">
                              {a.name}
                            </span>
                          ),
                        )}
                      </div>
                    ) : null}
                    <p className="mt-2 text-[11px] text-rose-500/80">Cliquer pour ouvrir la page détail (édition & suppression)</p>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
