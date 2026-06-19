import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ExternalLink, Plus, Trash2 } from 'lucide-react';
import { useTranslation } from '../../../../utils/translations';
import {
  KNOWLEDGE_NOTE_SECTION_LS,
  KNOWLEDGE_PAGE_SIZE,
  KNOWLEDGE_SECTION,
  KNOWLEDGE_TEXT_SECTIONS,
  readStoredSection
} from '../constants';
import {
  createKnowledgeNote,
  deleteKnowledgeNote,
  fetchKnowledgeLibraryGrouped,
  fetchKnowledgeNote,
  fetchKnowledgeNotes
} from '../../../../services/knowledge/knowledgeApi';
import {
  formatKnowledgeDate,
  KnowledgeCategoryChips,
  KnowledgeEmptyState,
  KnowledgeLoading,
  KnowledgeScrollSentinel,
  KnowledgeSearchBar,
  KnowledgeSectionTabs
} from '../components/KnowledgeUiBlocks';
import { useKnowledgeInfiniteScroll } from '../hooks/useKnowledgeInfiniteScroll';

function NoteReaderModal({ selected, isAdmin, onClose, onDelete, t }) {
  if (!selected) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-sm">
      <article className="max-h-[85vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-violet-500/30 bg-[#0a0612] p-6 shadow-2xl">
        <p className="text-[10px] uppercase tracking-wide text-violet-400/70">
          {formatKnowledgeDate(selected.createdAt)}
        </p>
        <h2 className="mt-1 text-xl font-bold text-white">{selected.title}</h2>
        {(selected.sourceUrls || []).length > 0 ? (
          <ul className="mt-2 space-y-1">
            {selected.sourceUrls.map((url) => (
              <li key={url}>
                <a
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-sm text-violet-300 hover:underline"
                >
                  <ExternalLink size={14} />
                  {url}
                </a>
              </li>
            ))}
          </ul>
        ) : null}
        <div className="prose prose-invert mt-4 max-w-none whitespace-pre-wrap text-sm leading-relaxed text-slate-300">
          {selected.body}
        </div>
        <div className="mt-6 flex justify-between">
          {isAdmin ? (
            <button type="button" onClick={() => onDelete(selected.id)} className="text-sm text-rose-400">
              <Trash2 size={14} className="inline" /> {t('knowledge.delete')}
            </button>
          ) : (
            <span />
          )}
          <button type="button" onClick={onClose} className="text-sm text-slate-400">
            {t('knowledge.close')}
          </button>
        </div>
      </article>
    </div>
  );
}

function NoteFeedCard({ note, onOpen, categoriesById }) {
  const cats = (note.categoryIds || [])
    .map((id) => categoriesById[id])
    .filter(Boolean)
    .slice(0, 3);

  return (
    <button
      type="button"
      onClick={() => onOpen(note.id)}
      className="w-full rounded-2xl border border-violet-500/20 bg-gradient-to-br from-violet-950/15 to-black/70 px-5 py-4 text-left transition hover:border-violet-400/35"
    >
      <p className="text-[10px] uppercase tracking-wide text-violet-400/70">
        {formatKnowledgeDate(note.createdAt)}
      </p>
      <h3 className="mt-1 text-base font-semibold text-white">{note.title}</h3>
      {note.excerpt ? <p className="mt-2 line-clamp-3 text-sm text-slate-400">{note.excerpt}</p> : null}
      {cats.length > 0 ? (
        <div className="mt-3 flex flex-wrap gap-1">
          {cats.map((c) => (
            <span
              key={c.id}
              className="rounded-full border border-violet-500/25 bg-violet-950/30 px-2 py-0.5 text-[10px] text-violet-200/90"
            >
              {c.name}
            </span>
          ))}
        </div>
      ) : null}
    </button>
  );
}

function NoteListItem({ note, onOpen }) {
  return (
    <button
      type="button"
      onClick={() => onOpen(note.id)}
      className="w-full rounded-xl border border-violet-500/15 bg-black/50 px-4 py-3 text-left transition hover:border-violet-400/35"
    >
      <h3 className="font-semibold text-slate-100">{note.title}</h3>
      {note.excerpt ? <p className="mt-1 line-clamp-2 text-xs text-slate-500">{note.excerpt}</p> : null}
    </button>
  );
}

export default function KnowledgeNotesView({ isAdmin, categories, hiddenCategoryIds, onCatalogReload }) {
  const t = useTranslation();
  const [section, setSection] = useState(() =>
    readStoredSection(KNOWLEDGE_NOTE_SECTION_LS, KNOWLEDGE_TEXT_SECTIONS, KNOWLEDGE_SECTION.FEED)
  );
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [libraryGroups, setLibraryGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [selected, setSelected] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: '', body: '', sourceUrls: '', categoryIds: [] });

  const categoriesById = useMemo(() => {
    const m = {};
    categories.forEach((c) => {
      m[c.id] = c;
    });
    return m;
  }, [categories]);

  useEffect(() => {
    try {
      localStorage.setItem(KNOWLEDGE_NOTE_SECTION_LS, section);
    } catch {
      /* ignore */
    }
  }, [section]);

  useEffect(() => {
    const id = window.setTimeout(() => setDebouncedSearch(search.trim()), 300);
    return () => window.clearTimeout(id);
  }, [search]);

  const loadFeed = useCallback(
    async (offset = 0, replace = true) => {
      const res = await fetchKnowledgeNotes({
        categoryId: categoryId || undefined,
        search: debouncedSearch || undefined,
        offset,
        limit: KNOWLEDGE_PAGE_SIZE,
        hiddenCategoryIds
      });
      const next = res.items || [];
      setTotal(res.total || 0);
      setItems((prev) => (replace ? next : [...prev, ...next]));
    },
    [categoryId, debouncedSearch, hiddenCategoryIds]
  );

  const loadLibrary = useCallback(async () => {
    let groups = await fetchKnowledgeLibraryGrouped('notes', {
      search: debouncedSearch || undefined,
      hiddenCategoryIds
    });
    if (categoryId) {
      groups = groups.filter((g) => g.categoryId === categoryId);
    }
    setLibraryGroups(groups);
  }, [categoryId, debouncedSearch, hiddenCategoryIds]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    const run = section === KNOWLEDGE_SECTION.LIBRARY ? loadLibrary : () => loadFeed(0, true);
    run()
      .catch(() => {
        if (!cancelled) {
          setItems([]);
          setLibraryGroups([]);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [section, loadFeed, loadLibrary]);

  const hasMore = section === KNOWLEDGE_SECTION.FEED && items.length < total;

  const loadMoreFeed = useCallback(() => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    loadFeed(items.length, false)
      .catch(() => {})
      .finally(() => setLoadingMore(false));
  }, [loadingMore, hasMore, loadFeed, items.length]);

  const sentinelRef = useKnowledgeInfiniteScroll({
    enabled: section === KNOWLEDGE_SECTION.FEED,
    hasMore,
    loading,
    loadingMore,
    onLoadMore: loadMoreFeed
  });

  const openNote = async (id) => {
    const full = await fetchKnowledgeNote(id);
    setSelected(full);
  };

  const handleCreate = async () => {
    if (!form.title.trim()) return;
    const urls = form.sourceUrls
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean);
    await createKnowledgeNote({
      title: form.title.trim(),
      body: form.body,
      sourceUrls: urls,
      categoryIds: form.categoryIds
    });
    setShowForm(false);
    setForm({ title: '', body: '', sourceUrls: '', categoryIds: [] });
    if (section === KNOWLEDGE_SECTION.LIBRARY) await loadLibrary();
    else await loadFeed(0, true);
    onCatalogReload?.();
  };

  const handleDelete = async (id) => {
    if (!window.confirm(t('knowledge.confirmDelete'))) return;
    await deleteKnowledgeNote(id);
    setSelected(null);
    if (section === KNOWLEDGE_SECTION.LIBRARY) await loadLibrary();
    else await loadFeed(0, true);
    onCatalogReload?.();
  };

  const addButton = isAdmin ? (
    <button
      type="button"
      onClick={() => setShowForm(true)}
      className="flex items-center gap-1.5 rounded-xl bg-violet-600 px-3 py-2.5 text-sm text-white"
    >
      <Plus size={16} />
      {t('knowledge.newNote')}
    </button>
  ) : null;

  return (
    <div className="space-y-4">
      <KnowledgeSectionTabs modes={KNOWLEDGE_TEXT_SECTIONS} active={section} onChange={setSection} />

      <KnowledgeSearchBar
        value={search}
        onChange={setSearch}
        placeholder={t('knowledge.searchNotes')}
        action={addButton}
      />

      <KnowledgeCategoryChips
        categories={categories}
        activeId={categoryId}
        onSelect={setCategoryId}
        hiddenIds={hiddenCategoryIds}
      />

      {loading ? (
        <KnowledgeLoading className="py-12" />
      ) : section === KNOWLEDGE_SECTION.FEED ? (
        items.length === 0 ? (
          <KnowledgeEmptyState title={t('knowledge.emptyNotes')} hint={t('knowledge.emptyNotesHint')} />
        ) : (
          <div className="space-y-3">
            {items.map((note) => (
              <NoteFeedCard key={note.id} note={note} onOpen={openNote} categoriesById={categoriesById} />
            ))}
            <KnowledgeScrollSentinel sentinelRef={sentinelRef} loadingMore={loadingMore} />
          </div>
        )
      ) : libraryGroups.length === 0 ? (
        <KnowledgeEmptyState title={t('knowledge.emptyLibrary')} />
      ) : (
        <div className="space-y-8">
          {libraryGroups.map((group) => (
            <section key={group.categoryId ?? '__none'}>
              <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-violet-200">
                <span className="h-px flex-1 bg-violet-500/20" />
                <span>{group.categoryName || t('knowledge.uncategorized')}</span>
                <span className="h-px flex-1 bg-violet-500/20" />
              </h2>
              <ul className="space-y-2">
                {group.items.map((note) => (
                  <li key={note.id}>
                    <NoteListItem note={note} onOpen={openNote} />
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}

      <NoteReaderModal
        selected={selected}
        isAdmin={isAdmin}
        onClose={() => setSelected(null)}
        onDelete={handleDelete}
        t={t}
      />

      {showForm && isAdmin ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl border border-violet-500/30 bg-[#0a0612] p-5 shadow-xl">
            <h3 className="mb-3 font-semibold text-white">{t('knowledge.newNote')}</h3>
            <div className="space-y-2">
              <input
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                placeholder={t('knowledge.noteTitle')}
                className="w-full rounded-xl border border-violet-500/25 bg-black/60 px-3 py-2 text-sm text-white"
              />
              <textarea
                value={form.sourceUrls}
                onChange={(e) => setForm((f) => ({ ...f, sourceUrls: e.target.value }))}
                rows={2}
                placeholder={t('knowledge.noteSources')}
                className="w-full rounded-xl border border-violet-500/25 bg-black/60 px-3 py-2 text-sm text-white"
              />
              <textarea
                value={form.body}
                onChange={(e) => setForm((f) => ({ ...f, body: e.target.value }))}
                rows={8}
                placeholder={t('knowledge.noteBody')}
                className="w-full rounded-xl border border-violet-500/25 bg-black/60 px-3 py-2 text-sm text-white"
              />
              <div className="flex flex-wrap gap-1">
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() =>
                      setForm((f) => ({
                        ...f,
                        categoryIds: f.categoryIds.includes(cat.id)
                          ? f.categoryIds.filter((id) => id !== cat.id)
                          : [...f.categoryIds, cat.id]
                      }))
                    }
                    className={`rounded-full border px-2 py-0.5 text-[10px] ${
                      form.categoryIds.includes(cat.id)
                        ? 'border-violet-400 text-violet-200'
                        : 'border-slate-600 text-slate-500'
                    }`}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <button type="button" onClick={() => setShowForm(false)} className="text-sm text-slate-400">
                {t('knowledge.close')}
              </button>
              <button type="button" onClick={handleCreate} className="rounded-lg bg-violet-600 px-4 py-2 text-sm text-white">
                {t('knowledge.save')}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
