import { useCallback, useEffect, useRef, useState } from 'react';
import { ChevronLeft, Image as ImageIcon, Link2, Paperclip, Plus, Trash2 } from 'lucide-react';
import {
  updateCodeJournalEntryAsync,
  deleteCodeJournalEntryAsync,
  loadCodeJournalEntriesAsync,
} from '../../services/code/codeJournalIDB';
import {
  JOURNAL_MODES,
  normalizeJournalUrl,
  isValidJournalHttpUrl,
  cloneJournalLinks,
} from './codeJournalShared';

const BOLT_DEFAULT_PLACEHOLDER = 'What do you want to build?';

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result || ''));
    r.onerror = reject;
    r.readAsDataURL(file);
  });
}

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

function cloneAttachments(list) {
  return (list || []).map((x) => ({ id: x.id, name: x.name, kind: x.kind, dataUrl: x.dataUrl }));
}

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

/**
 * Page pleine (onglet Code → Journal) : détail / édition d’une entrée.
 */
export default function CodeJournalEntryPage({
  userId,
  initialEntry,
  connected,
  contributionDayMap,
  onBack,
  onEntriesChanged,
}) {
  const [baseEntry, setBaseEntry] = useState(initialEntry);
  const [text, setText] = useState(initialEntry.text || '');
  const [modeId, setModeId] = useState(initialEntry.mode || 'journal');
  const [attachments, setAttachments] = useState(() => cloneAttachments(initialEntry.attachments));
  const [links, setLinks] = useState(() => cloneJournalLinks(initialEntry.links));
  const [linkUrl, setLinkUrl] = useState('');
  const [linkTitle, setLinkTitle] = useState('');
  const [linkError, setLinkError] = useState('');
  const [saving, setSaving] = useState(false);
  const [showAttach, setShowAttach] = useState(false);
  const detailFileRef = useRef(null);
  const detailImgRef = useRef(null);
  const taRef = useRef(null);

  useEffect(() => {
    setBaseEntry(initialEntry);
    setText(initialEntry.text || '');
    setModeId(initialEntry.mode || 'journal');
    setAttachments(cloneAttachments(initialEntry.attachments));
    setLinks(cloneJournalLinks(initialEntry.links));
    setLinkUrl('');
    setLinkTitle('');
    setLinkError('');
  }, [initialEntry.id]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [initialEntry.id]);

  useEffect(() => {
    const el = taRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(420, Math.max(140, el.scrollHeight))}px`;
  }, [text]);

  const reloadEntry = useCallback(async () => {
    const rows = await loadCodeJournalEntriesAsync(userId);
    const nu = rows.find((x) => x.id === baseEntry.id);
    if (nu) {
      setBaseEntry(nu);
      setText(nu.text || '');
      setModeId(nu.mode || 'journal');
      setAttachments(cloneAttachments(nu.attachments));
      setLinks(cloneJournalLinks(nu.links));
    }
    onEntriesChanged?.();
  }, [userId, baseEntry.id, onEntriesChanged]);

  const onPickDetailFiles = async (e) => {
    const files = [...(e.target.files || [])];
    e.target.value = '';
    setShowAttach(false);
    for (const f of files.slice(0, 4)) {
      if (f.size > 1.5 * 1024 * 1024) continue;
      try {
        const dataUrl = await readFileAsDataUrl(f);
        setAttachments((a) =>
          [...a, { id: `${Date.now()}-${f.name}`, name: f.name, kind: f.type.startsWith('image/') ? 'image' : 'file', dataUrl }].slice(0, 6),
        );
      } catch {
        // ignore
      }
    }
  };

  const addDetailLink = () => {
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

  const save = async () => {
    const t = text.trim();
    if (!t && attachments.length === 0 && links.length === 0) return;
    setSaving(true);
    try {
      await updateCodeJournalEntryAsync(userId, {
        ...baseEntry,
        text: t,
        mode: modeId,
        attachments: attachments.map(({ id, name, kind, dataUrl }) => ({ id, name, kind, dataUrl })),
        links: cloneJournalLinks(links),
      });
      await reloadEntry();
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    if (!window.confirm('Supprimer définitivement cette entrée ?')) return;
    setSaving(true);
    try {
      await deleteCodeJournalEntryAsync(userId, baseEntry.id);
      onEntriesChanged?.();
      onBack();
    } finally {
      setSaving(false);
    }
  };

  const { value: ghCount } = contributionsForEntry(baseEntry, contributionDayMap);
  const day = baseEntry.githubDayUtc || utcYmdFromIso(baseEntry.createdAt);

  return (
    <div className="mx-auto max-w-3xl space-y-6 py-6">
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={onBack}
          disabled={saving}
          className="inline-flex items-center gap-2 rounded-lg border border-rose-500/45 bg-black/60 px-3 py-2 text-sm font-medium text-rose-100 transition hover:border-rose-400 hover:bg-rose-950/40 hover:text-white disabled:opacity-40"
        >
          <ChevronLeft className="size-4" />
          Retour au journal
        </button>
      </div>

      <header className="rounded-xl border border-rose-500/45 bg-black/55 px-4 py-4">
        <h1 className="text-xl font-bold text-white md:text-2xl">
          Entrée — {JOURNAL_MODES.find((m) => m.id === modeId)?.label || modeId}
        </h1>
        <p className="mt-1 text-sm text-rose-200/80">
          Créée le{' '}
          {baseEntry.createdAt
            ? new Date(baseEntry.createdAt).toLocaleString('fr-FR', { dateStyle: 'full', timeStyle: 'short' })
            : '—'}
        </p>
      </header>

      {connected ? (
        <div className="rounded-lg border border-rose-500/30 bg-rose-950/20 px-4 py-3 text-xs text-rose-100">
          <span className="font-medium text-rose-200">Jour (UTC) :</span> {day || '—'}
          <br />
          <span className="font-medium text-rose-200">Contributions GitHub ce jour-là :</span>{' '}
          {ghCount != null ? (
            <strong className="text-white">{ghCount}</strong>
          ) : (
            <span className="text-rose-300/80">non disponible dans la fenêtre du calendrier actuel</span>
          )}
        </div>
      ) : null}

      <div className="rounded-xl border border-rose-500/35 bg-black/50 px-4 py-4">
        <label className="mb-2 block text-xs font-medium text-rose-300/90">Mode</label>
        <select
          value={modeId}
          onChange={(e) => setModeId(e.target.value)}
          className="mb-4 w-full rounded-lg border border-rose-500/40 bg-black px-3 py-2 text-sm text-rose-50"
        >
          {JOURNAL_MODES.map((m) => (
            <option key={m.id} value={m.id}>
              {m.label}
            </option>
          ))}
        </select>

        <label className="mb-2 block text-xs font-medium text-rose-300/90">Texte</label>
        <textarea
          ref={taRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={8}
          className="mb-4 w-full resize-none rounded-lg border border-rose-500/35 bg-black/80 px-3 py-2 text-sm text-rose-50 placeholder:text-rose-300/40 focus:border-rose-400 focus:outline-none"
          placeholder={BOLT_DEFAULT_PLACEHOLDER}
        />

        <div className="mb-2 flex items-center gap-2 text-xs font-medium text-rose-300/90">
          <Link2 className="size-3.5 text-rose-400" aria-hidden />
          Liens (IndexedDB, comme le reste de l’entrée)
        </div>
        {links.length > 0 ? (
          <div className="mb-2 flex flex-wrap gap-2">
            {links.map((l) => (
              <span
                key={l.id}
                className="inline-flex max-w-full items-center gap-1 rounded-md border border-rose-500/40 bg-black/70 px-2 py-1 text-xs text-rose-100"
              >
                <a href={l.url} target="_blank" rel="noopener noreferrer" className="truncate text-rose-300 underline hover:text-rose-100">
                  {l.title || l.url}
                </a>
                <button
                  type="button"
                  className="shrink-0 text-rose-400 hover:text-rose-200"
                  onClick={() => setLinks((x) => x.filter((z) => z.id !== l.id))}
                  aria-label="Retirer le lien"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        ) : null}
        <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end">
          <input
            type="url"
            inputMode="url"
            value={linkUrl}
            onChange={(e) => {
              setLinkUrl(e.target.value);
              setLinkError('');
            }}
            placeholder="https://…"
            className="min-w-0 flex-1 rounded-lg border border-rose-500/35 bg-black/60 px-3 py-2 text-sm text-rose-50 placeholder:text-rose-400/50 focus:border-rose-400 focus:outline-none"
          />
          <input
            type="text"
            value={linkTitle}
            onChange={(e) => setLinkTitle(e.target.value)}
            placeholder="Titre (optionnel)"
            className="min-w-0 flex-1 rounded-lg border border-rose-500/35 bg-black/60 px-3 py-2 text-sm text-rose-50 placeholder:text-rose-400/50 focus:border-rose-400 focus:outline-none sm:max-w-[220px]"
          />
          <button
            type="button"
            onClick={addDetailLink}
            className="shrink-0 rounded-lg border border-rose-500/45 bg-rose-950/40 px-3 py-2 text-sm font-medium text-rose-100 hover:bg-rose-900/50"
          >
            Ajouter le lien
          </button>
        </div>
        {linkError ? <p className="mb-3 text-xs text-amber-300/90">{linkError}</p> : null}

        <div className="mb-2 text-xs font-medium text-rose-300/90">Pièces jointes</div>
        {attachments.length > 0 ? (
          <div className="mb-3 flex flex-wrap gap-2">
            {attachments.map((a) => (
              <div
                key={a.id}
                className="flex items-center gap-1 rounded-md border border-rose-500/35 bg-black/60 px-2 py-1 text-xs text-rose-100"
              >
                {a.kind === 'image' ? (
                  <img src={a.dataUrl} alt="" className="h-10 w-10 rounded object-cover" />
                ) : (
                  <Paperclip className="h-3.5 w-3.5 shrink-0 text-rose-300" />
                )}
                <span className="max-w-[10rem] truncate">{a.name}</span>
                <button
                  type="button"
                  className="ml-1 text-rose-400 hover:text-rose-200"
                  onClick={() => setAttachments((x) => x.filter((z) => z.id !== a.id))}
                  aria-label="Retirer"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p className="mb-3 text-xs text-rose-400/70">Aucune pièce jointe</p>
        )}

        <div className="relative flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowAttach((s) => !s)}
            className="flex size-9 items-center justify-center rounded-full border border-rose-500/40 bg-rose-950/40 text-rose-200"
            aria-label="Ajouter une pièce jointe"
          >
            <Plus className={`size-4 ${showAttach ? 'rotate-45' : ''}`} />
          </button>
          <input ref={detailFileRef} type="file" className="hidden" multiple onChange={(e) => void onPickDetailFiles(e)} />
          <input ref={detailImgRef} type="file" accept="image/*" className="hidden" multiple onChange={(e) => void onPickDetailFiles(e)} />
          {showAttach && (
            <>
              <button type="button" className="fixed inset-0 z-[5] cursor-default" aria-hidden onClick={() => setShowAttach(false)} />
              <div className="absolute left-0 top-full z-10 mt-1 min-w-[180px] overflow-hidden rounded-xl border border-rose-500/40 bg-black py-1 shadow-lg">
                <button
                  type="button"
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-rose-100 hover:bg-rose-950/50"
                  onClick={() => detailImgRef.current?.click()}
                >
                  <ImageIcon className="size-4" /> Image
                </button>
                <button
                  type="button"
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-rose-100 hover:bg-rose-950/50"
                  onClick={() => detailFileRef.current?.click()}
                >
                  <Paperclip className="size-4" /> Fichier
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          disabled={saving}
          onClick={() => void remove()}
          className="flex items-center gap-2 rounded-lg border border-red-500/50 px-4 py-2 text-sm text-red-200 transition hover:bg-red-950/40 disabled:opacity-40"
        >
          <Trash2 className="size-4" />
          Supprimer
        </button>
        <button
          type="button"
          disabled={saving || (!text.trim() && attachments.length === 0 && links.length === 0)}
          onClick={() => void save()}
          className="rounded-lg border border-rose-400/60 bg-gradient-to-r from-rose-700 to-fuchsia-700 px-5 py-2.5 text-sm font-medium text-white disabled:opacity-40"
        >
          {saving ? '…' : 'Enregistrer les modifications'}
        </button>
      </div>
    </div>
  );
}
