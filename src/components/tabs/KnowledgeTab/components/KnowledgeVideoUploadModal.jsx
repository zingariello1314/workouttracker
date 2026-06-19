import React, { useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import { useTranslation } from '../../../../utils/translations';
import { createKnowledgeCategory } from '../../../../services/knowledge/knowledgeApi';

export default function KnowledgeVideoUploadModal({
  open,
  onClose,
  onSubmit,
  uploading,
  categories,
  onCategoryCreated
}) {
  const t = useTranslation();
  const [title, setTitle] = useState('');
  const [file, setFile] = useState(null);
  const [categoryIds, setCategoryIds] = useState([]);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) {
      setTitle('');
      setFile(null);
      setCategoryIds([]);
      setNewCategoryName('');
      setError('');
    }
  }, [open]);

  if (!open) return null;

  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) return;
    setError('');
    try {
      const cat = await createKnowledgeCategory(newCategoryName.trim());
      setCategoryIds((prev) => (prev.includes(cat.id) ? prev : [...prev, cat.id]));
      setNewCategoryName('');
      onCategoryCreated?.();
    } catch (e) {
      setError(e?.message || t('knowledge.uploadFailed'));
    }
  };

  const handleSubmit = async () => {
    if (!file || !title.trim()) return;
    setError('');
    try {
      let ids = [...categoryIds];
      if (newCategoryName.trim()) {
        const cat = await createKnowledgeCategory(newCategoryName.trim());
        if (!ids.includes(cat.id)) ids.push(cat.id);
        setNewCategoryName('');
        onCategoryCreated?.();
      }
      await onSubmit({ title: title.trim(), file, categoryIds: ids });
    } catch (e) {
      setError(e?.message || t('knowledge.uploadFailed'));
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl border border-violet-500/30 bg-[#0a0612] p-5 shadow-2xl shadow-violet-950/50">
        <h3 className="mb-1 text-lg font-semibold text-white">{t('knowledge.uploadVideo')}</h3>
        <p className="mb-4 text-xs text-slate-500">{t('knowledge.uploadHint')}</p>
        {error ? (
          <p className="mb-3 rounded-lg border border-rose-500/30 bg-rose-950/30 px-3 py-2 text-xs text-rose-300">
            {error}
          </p>
        ) : null}
        <div className="space-y-3">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={t('knowledge.videoTitle')}
            className="w-full rounded-xl border border-violet-500/25 bg-black/60 px-3 py-2.5 text-sm text-white"
          />
          <label className="flex cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-violet-500/30 bg-violet-950/10 px-4 py-6 text-center transition hover:border-violet-400/50">
            <span className="text-xs text-slate-400">
              {file ? file.name : t('knowledge.pickVideoFile')}
            </span>
            {file ? (
              <span className="mt-1 text-[10px] text-violet-300/80">
                {(file.size / (1024 * 1024)).toFixed(1)} Mo
              </span>
            ) : null}
            <input
              type="file"
              accept="video/mp4,video/webm,video/quicktime"
              className="hidden"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
            />
          </label>
          <div>
            <p className="mb-1 text-xs text-slate-500">{t('knowledge.pickCategories')}</p>
            <p className="mb-2 text-[10px] text-violet-400/70">{t('knowledge.pickCategoriesHint')}</p>
            <div className="flex flex-wrap gap-1">
              {categories.length === 0 ? (
                <span className="text-[10px] text-slate-500">{t('knowledge.noCategoriesYet')}</span>
              ) : (
                categories.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() =>
                      setCategoryIds((prev) =>
                        prev.includes(cat.id) ? prev.filter((id) => id !== cat.id) : [...prev, cat.id]
                      )
                    }
                    className={`rounded-full border px-2 py-0.5 text-[10px] ${
                      categoryIds.includes(cat.id)
                        ? 'border-violet-400 bg-violet-600/30 text-violet-100'
                        : 'border-slate-600 text-slate-500'
                    }`}
                  >
                    {cat.name}
                  </button>
                ))
              )}
            </div>
          </div>
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
        <div className="mt-5 flex justify-end gap-2">
          <button type="button" onClick={onClose} className="rounded-lg px-4 py-2 text-sm text-slate-400">
            {t('common.cancel')}
          </button>
          <button
            type="button"
            disabled={uploading || !file || !title.trim()}
            onClick={handleSubmit}
            className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-40"
          >
            {uploading ? t('knowledge.uploading') : t('knowledge.upload')}
          </button>
        </div>
      </div>
    </div>
  );
}
