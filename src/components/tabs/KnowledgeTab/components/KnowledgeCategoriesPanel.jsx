import React, { useMemo, useState } from 'react';
import { Eye, EyeOff, Plus, Trash2 } from 'lucide-react';
import { useTranslation } from '../../../../utils/translations';
import {
  createKnowledgeCategory,
  deleteKnowledgeCategory,
  fetchKnowledgeLibraryGrouped
} from '../../../../services/knowledge/knowledgeApi';
import { KnowledgeEmptyState, KnowledgeLoading } from './KnowledgeUiBlocks';

export default function KnowledgeCategoriesPanel({
  isAdmin,
  categories,
  hiddenCategoryIds,
  onCatalogReload,
  toggleHiddenCategory,
  type = 'videos',
  contentRevision = 0
}) {
  const t = useTranslation();
  const [newName, setNewName] = useState('');
  const [counts, setCounts] = useState({});
  const [loadingCounts, setLoadingCounts] = useState(true);

  React.useEffect(() => {
    let active = true;
    setLoadingCounts(true);
    fetchKnowledgeLibraryGrouped(type, { hiddenCategoryIds: [] })
      .then((groups) => {
        if (!active) return;
        const map = {};
        groups.forEach((g) => {
          if (g.categoryId) map[g.categoryId] = g.items.length;
        });
        setCounts(map);
      })
      .finally(() => {
        if (active) setLoadingCounts(false);
      });
    return () => {
      active = false;
    };
  }, [type, categories.length, contentRevision]);

  const sorted = useMemo(
    () => [...categories].sort((a, b) => a.name.localeCompare(b.name, 'fr')),
    [categories]
  );

  const handleCreate = async () => {
    if (!newName.trim()) return;
    await createKnowledgeCategory(newName.trim());
    setNewName('');
    onCatalogReload?.();
  };

  const handleDelete = async (cat) => {
    if (!window.confirm(t('knowledge.confirmDeleteCategory', { name: cat.name }))) return;
    await deleteKnowledgeCategory(cat.id);
    onCatalogReload?.();
  };

  if (loadingCounts && sorted.length === 0) {
    return <KnowledgeLoading />;
  }

  if (sorted.length === 0) {
    return (
      <KnowledgeEmptyState
        title={t('knowledge.emptyCategories')}
        hint={isAdmin ? t('knowledge.emptyCategoriesHint') : undefined}
      />
    );
  }

  return (
    <div className="space-y-4">
      {isAdmin ? (
        <div className="flex gap-2 rounded-xl border border-violet-500/20 bg-violet-950/10 p-3">
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder={t('knowledge.newCategory')}
            className="min-w-0 flex-1 rounded-lg border border-violet-500/25 bg-black/60 px-3 py-2 text-sm text-white"
          />
          <button
            type="button"
            onClick={handleCreate}
            className="flex items-center gap-1 rounded-lg bg-violet-600 px-3 py-2 text-sm text-white"
          >
            <Plus size={16} />
            {t('knowledge.addCategory')}
          </button>
        </div>
      ) : null}

      <ul className="space-y-2">
        {sorted.map((cat) => {
          const hidden = hiddenCategoryIds.includes(cat.id);
          const count = counts[cat.id] || 0;
          return (
            <li
              key={cat.id}
              className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-violet-500/15 bg-black/50 px-4 py-3"
            >
              <div className="min-w-0">
                <p className="font-semibold text-slate-100">{cat.name}</p>
                <p className="text-xs text-slate-500">
                  {t('knowledge.categoryItemCount', { count })}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {!isAdmin ? (
                  <button
                    type="button"
                    onClick={() => toggleHiddenCategory?.(cat.id)}
                    className={`flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-xs ${
                      hidden
                        ? 'border-slate-600 text-slate-500'
                        : 'border-violet-500/30 text-violet-200'
                    }`}
                  >
                    {hidden ? <EyeOff size={14} /> : <Eye size={14} />}
                    {hidden ? t('knowledge.showCategory') : t('knowledge.hideCategory')}
                  </button>
                ) : null}
                {isAdmin ? (
                  <button
                    type="button"
                    onClick={() => handleDelete(cat)}
                    className="flex items-center gap-1 rounded-lg border border-rose-500/30 px-2.5 py-1.5 text-xs text-rose-400 hover:bg-rose-950/30"
                  >
                    <Trash2 size={14} />
                    {t('knowledge.delete')}
                  </button>
                ) : null}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
