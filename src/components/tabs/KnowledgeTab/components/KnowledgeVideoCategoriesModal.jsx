import React, { useEffect, useState } from 'react';
import { useTranslation } from '../../../../utils/translations';

export default function KnowledgeVideoCategoriesModal({
  open,
  video,
  categories,
  onClose,
  onSave,
  saving = false
}) {
  const t = useTranslation();
  const [categoryIds, setCategoryIds] = useState([]);

  useEffect(() => {
    if (!open || !video) {
      setCategoryIds([]);
      return;
    }
    setCategoryIds([...(video.categoryIds || [])]);
  }, [open, video]);

  if (!open || !video) return null;

  const toggleCategory = (catId) => {
    setCategoryIds((prev) =>
      prev.includes(catId) ? prev.filter((id) => id !== catId) : [...prev, catId]
    );
  };

  const handleSave = () => {
    onSave?.(video, categoryIds);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl border border-violet-500/30 bg-[#0a0612] p-5 shadow-2xl shadow-violet-950/50">
        <h3 className="mb-1 text-lg font-semibold text-white">{t('knowledge.editCategories')}</h3>
        <p className="mb-4 line-clamp-2 text-xs text-slate-400">{video.title}</p>
        <p className="mb-2 text-xs text-slate-500">{t('knowledge.pickCategories')}</p>
        <p className="mb-3 text-[10px] text-violet-400/70">{t('knowledge.pickCategoriesHint')}</p>
        <div className="flex flex-wrap gap-1.5">
          {categories.length === 0 ? (
            <span className="text-[11px] text-slate-500">{t('knowledge.noCategoriesYet')}</span>
          ) : (
            categories.map((cat) => (
              <button
                key={cat.id}
                type="button"
                disabled={saving}
                onClick={() => toggleCategory(cat.id)}
                className={`rounded-full border px-2.5 py-1 text-[11px] transition disabled:opacity-40 ${
                  categoryIds.includes(cat.id)
                    ? 'border-violet-400 bg-violet-600/30 text-violet-100'
                    : 'border-slate-600 text-slate-500 hover:border-slate-500'
                }`}
              >
                {cat.name}
              </button>
            ))
          )}
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="rounded-lg px-4 py-2 text-sm text-slate-400 disabled:opacity-40"
          >
            {t('common.cancel')}
          </button>
          <button
            type="button"
            disabled={saving}
            onClick={handleSave}
            className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-40"
          >
            {saving ? t('knowledge.savingCategories') : t('knowledge.save')}
          </button>
        </div>
      </div>
    </div>
  );
}
