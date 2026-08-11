import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Plus, Trash2, Upload } from 'lucide-react';
import { useTranslation } from '../../../../utils/translations';
import {
  createKnowledgeCategory,
  fetchKnowledgeUserPrefs,
  saveKnowledgeLastUploadCategoryIds
} from '../../../../services/knowledge/knowledgeApi';
import {
  mergeFilesIntoQueue,
  toggleCategoryOnQueueItems
} from '../utils/videoUploadHelpers';

export default function KnowledgeVideoUploadModal({
  open,
  onClose,
  onSubmit,
  onBatchComplete,
  categories,
  onCategoryCreated,
  userId = 'anonymous'
}) {
  const t = useTranslation();
  const fileInputRef = useRef(null);
  const [queue, setQueue] = useState([]);
  const [selectedIds, setSelectedIds] = useState(() => new Set());
  const [defaultCategoryIds, setDefaultCategoryIds] = useState([]);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(null);

  useEffect(() => {
    if (!open) {
      setQueue([]);
      setSelectedIds(new Set());
      setDefaultCategoryIds([]);
      setNewCategoryName('');
      setError('');
      setUploading(false);
      setUploadProgress(null);
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const prefs = await fetchKnowledgeUserPrefs(userId);
        if (cancelled) return;
        const valid = new Set((categories || []).map((c) => c.id));
        const restored = (prefs?.lastUploadCategoryIds || []).filter((id) => valid.has(id));
        if (restored.length > 0) setDefaultCategoryIds(restored);
      } catch {
        /* prefs optionnelles */
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [open, userId, categories]);

  const selectedCount = selectedIds.size;
  const allSelected = queue.length > 0 && selectedCount === queue.length;
  const someSelected = selectedCount > 0;

  const selectedItems = useMemo(
    () => queue.filter((item) => selectedIds.has(item.id)),
    [queue, selectedIds]
  );

  if (!open) return null;

  const handleFilesPicked = (fileList) => {
    const files = Array.from(fileList || []);
    if (files.length === 0) return;
    setQueue((prev) => mergeFilesIntoQueue(prev, files, defaultCategoryIds));
    setError('');
  };

  const removeItem = (id) => {
    setQueue((prev) => prev.filter((item) => item.id !== id));
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  };

  const toggleSelect = (id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(queue.map((item) => item.id)));
    }
  };

  const updateItemTitle = (id, title) => {
    setQueue((prev) => prev.map((item) => (item.id === id ? { ...item, title } : item)));
  };

  const applyCategoryToSelection = (categoryId) => {
    if (!someSelected) return;
    setQueue((prev) =>
      prev.map((item) => {
        if (!selectedIds.has(item.id)) return item;
        const [updated] = toggleCategoryOnQueueItems([item], categoryId);
        return updated;
      })
    );
  };

  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) return;
    setError('');
    try {
      const cat = await createKnowledgeCategory(newCategoryName.trim());
      setDefaultCategoryIds((prev) => (prev.includes(cat.id) ? prev : [...prev, cat.id]));
      if (someSelected) {
        setQueue((prev) =>
          prev.map((item) =>
            selectedIds.has(item.id) && !item.categoryIds.includes(cat.id)
              ? { ...item, categoryIds: [...item.categoryIds, cat.id] }
              : item
          )
        );
      }
      setNewCategoryName('');
      onCategoryCreated?.();
    } catch (e) {
      setError(e?.message || t('knowledge.uploadFailed'));
    }
  };

  const validQueue = queue.filter((item) => item.file && item.title.trim());

  const handleSubmit = async () => {
    if (validQueue.length === 0) return;
    setError('');
    setUploading(true);
    try {
      let idsToRemember = defaultCategoryIds;
      if (newCategoryName.trim()) {
        const cat = await createKnowledgeCategory(newCategoryName.trim());
        if (!idsToRemember.includes(cat.id)) idsToRemember = [...idsToRemember, cat.id];
        setNewCategoryName('');
        onCategoryCreated?.();
      }

      for (let i = 0; i < validQueue.length; i++) {
        const item = validQueue[i];
        setUploadProgress({ current: i + 1, total: validQueue.length });
        const ids = [...item.categoryIds];
        await onSubmit({
          title: item.title.trim(),
          file: item.file,
          categoryIds: ids
        });
        if (ids.length > 0) idsToRemember = ids;
      }

      if (idsToRemember.length > 0) {
        setDefaultCategoryIds(idsToRemember);
        await saveKnowledgeLastUploadCategoryIds(userId, idsToRemember).catch(() => {});
      }
      onBatchComplete?.();
    } catch (e) {
      setError(e?.message || t('knowledge.uploadFailed'));
    } finally {
      setUploading(false);
      setUploadProgress(null);
    }
  };

  const categoryChip = (cat, active, onClick) => (
    <button
      key={cat.id}
      type="button"
      onClick={onClick}
      className={`rounded-full border px-2 py-0.5 text-[10px] transition ${
        active
          ? 'border-violet-400 bg-violet-600/30 text-violet-100'
          : 'border-slate-600 text-slate-500 hover:border-slate-500'
      }`}
    >
      {cat.name}
    </button>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-sm">
      <div className="flex max-h-[90vh] w-full max-w-xl flex-col rounded-2xl border border-violet-500/30 bg-[#0a0612] p-5 shadow-2xl shadow-violet-950/50">
        <h3 className="mb-1 text-lg font-semibold text-white">{t('knowledge.uploadVideo')}</h3>
        <p className="mb-4 text-xs text-slate-500">{t('knowledge.uploadHint')}</p>
        {error ? (
          <p className="mb-3 rounded-lg border border-rose-500/30 bg-rose-950/30 px-3 py-2 text-xs text-rose-300">
            {error}
          </p>
        ) : null}

        <div className="min-h-0 flex-1 space-y-3 overflow-y-auto">
          <label className="flex cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-violet-500/30 bg-violet-950/10 px-4 py-5 text-center transition hover:border-violet-400/50">
            <Upload size={20} className="mb-2 text-violet-400/70" />
            <span className="text-xs text-slate-400">{t('knowledge.pickVideoFiles')}</span>
            <span className="mt-1 text-[10px] text-violet-300/60">{t('knowledge.pickVideoFilesHint')}</span>
            <input
              ref={fileInputRef}
              type="file"
              accept="video/mp4,video/webm,video/quicktime"
              multiple
              className="hidden"
              onChange={(e) => {
                handleFilesPicked(e.target.files);
                e.target.value = '';
              }}
            />
          </label>

          {queue.length > 0 ? (
            <div className="rounded-xl border border-violet-500/20 bg-black/40">
              <div className="flex items-center justify-between border-b border-violet-500/15 px-3 py-2">
                <span className="text-xs font-medium text-slate-300">
                  {t('knowledge.uploadQueueCount', { count: queue.length })}
                </span>
                <button
                  type="button"
                  onClick={toggleSelectAll}
                  className="text-[10px] text-violet-400 hover:text-violet-300"
                >
                  {allSelected ? t('knowledge.deselectAll') : t('knowledge.selectAll')}
                </button>
              </div>
              <ul className="max-h-52 divide-y divide-violet-500/10 overflow-y-auto">
                {queue.map((item) => {
                  const checked = selectedIds.has(item.id);
                  return (
                    <li key={item.id} className="flex items-start gap-2 px-3 py-2">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleSelect(item.id)}
                        className="mt-2.5 h-3.5 w-3.5 shrink-0 accent-violet-500"
                        aria-label={item.title || item.file.name}
                      />
                      <div className="min-w-0 flex-1 space-y-1">
                        <input
                          type="text"
                          value={item.title}
                          onChange={(e) => updateItemTitle(item.id, e.target.value)}
                          placeholder={t('knowledge.videoTitle')}
                          className="w-full rounded-lg border border-violet-500/20 bg-black/50 px-2 py-1.5 text-xs text-white"
                        />
                        <p className="truncate text-[10px] text-slate-500">
                          {item.file.name}
                          {item.file.size > 0 ? ` · ${(item.file.size / (1024 * 1024)).toFixed(1)} Mo` : ''}
                          {item.categoryIds.length > 0 ? (
                            <span className="ml-2 text-violet-400/70">
                              · {item.categoryIds.length} cat.
                            </span>
                          ) : null}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeItem(item.id)}
                        disabled={uploading}
                        className="mt-1 shrink-0 rounded-lg p-1.5 text-slate-500 hover:bg-rose-950/40 hover:text-rose-400 disabled:opacity-40"
                        title={t('knowledge.removeFromQueue')}
                      >
                        <Trash2 size={14} />
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          ) : (
            <p className="text-center text-[11px] text-slate-600">{t('knowledge.uploadQueueEmpty')}</p>
          )}

          {someSelected ? (
            <div className="rounded-xl border border-amber-500/25 bg-amber-950/15 p-3">
              <p className="mb-1 text-xs font-medium text-amber-200/90">
                {t('knowledge.uploadQueueSelected', { count: selectedCount })}
              </p>
              <p className="mb-2 text-[10px] text-amber-400/70">{t('knowledge.applyCategoriesHint')}</p>
              <div className="flex flex-wrap gap-1">
                {categories.length === 0 ? (
                  <span className="text-[10px] text-slate-500">{t('knowledge.noCategoriesYet')}</span>
                ) : (
                  categories.map((cat) => {
                    const allHave = selectedItems.every((item) => item.categoryIds.includes(cat.id));
                    return categoryChip(cat, allHave, () => applyCategoryToSelection(cat.id));
                  })
                )}
              </div>
            </div>
          ) : (
            <div>
              <p className="mb-1 text-xs text-slate-500">{t('knowledge.pickCategories')}</p>
              <p className="mb-2 text-[10px] text-violet-400/70">{t('knowledge.pickCategoriesDefaultHint')}</p>
              <div className="flex flex-wrap gap-1">
                {categories.length === 0 ? (
                  <span className="text-[10px] text-slate-500">{t('knowledge.noCategoriesYet')}</span>
                ) : (
                  categories.map((cat) =>
                    categoryChip(cat, defaultCategoryIds.includes(cat.id), () =>
                      setDefaultCategoryIds((prev) =>
                        prev.includes(cat.id) ? prev.filter((id) => id !== cat.id) : [...prev, cat.id]
                      )
                    )
                  )
                )}
              </div>
            </div>
          )}

          <div className="flex gap-2">
            <input
              type="text"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              placeholder={t('knowledge.newCategory')}
              className="min-w-0 flex-1 rounded-xl border border-violet-500/25 bg-black/60 px-3 py-2 text-sm text-white"
            />
            <button
              type="button"
              onClick={handleCreateCategory}
              className="rounded-xl border border-violet-500/40 px-3 text-violet-300"
              title={t('knowledge.addCategory')}
            >
              <Plus size={16} />
            </button>
          </div>
        </div>

        <div className="mt-5 flex justify-end gap-2 border-t border-violet-500/10 pt-4">
          <button
            type="button"
            onClick={onClose}
            disabled={uploading}
            className="rounded-lg px-4 py-2 text-sm text-slate-400 disabled:opacity-40"
          >
            {t('common.cancel')}
          </button>
          <button
            type="button"
            disabled={uploading || validQueue.length === 0}
            onClick={handleSubmit}
            className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-40"
          >
            {uploading && uploadProgress
              ? t('knowledge.uploadProgress', {
                  current: uploadProgress.current,
                  total: uploadProgress.total
                })
              : validQueue.length > 1
                ? t('knowledge.publishCount', { count: validQueue.length })
                : t('knowledge.upload')}
          </button>
        </div>
      </div>
    </div>
  );
}
