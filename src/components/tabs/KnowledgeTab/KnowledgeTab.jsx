import React, { useMemo } from 'react';
import { Loader2 } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { isAdminUser } from '../../../utils/accessControl';
import { useTranslation } from '../../../utils/translations';
import { useKnowledgeCatalog } from '../../../hooks/useKnowledgeCatalog';
import KnowledgeShellLayout from './shell/KnowledgeShellLayout';
import KnowledgeVideosView from './views/KnowledgeVideosView';

export default function KnowledgeTab() {
  const t = useTranslation();
  const { currentUser, isAuthenticated } = useAuth();
  const isAdmin = isAdminUser(currentUser);
  const userId = currentUser?.id ? String(currentUser.id) : 'anonymous';
  const { categories, hiddenCategoryIds, storageReady, stats, loading, error, reload, toggleHiddenCategory } =
    useKnowledgeCatalog({ enabled: isAuthenticated, userId });

  const viewContent = useMemo(() => {
    return (
      <KnowledgeVideosView
        isAdmin={isAdmin}
        categories={categories}
        hiddenCategoryIds={hiddenCategoryIds}
        onCatalogReload={reload}
        userId={userId}
        toggleHiddenCategory={toggleHiddenCategory}
        catalogRevision={stats?.videoCount ?? 0}
      />
    );
  }, [isAdmin, categories, hiddenCategoryIds, reload, userId, toggleHiddenCategory, stats?.videoCount]);

  if (!isAuthenticated) {
    return (
      <div className="mx-auto max-w-lg p-8 text-center text-slate-200">
        <p className="text-lg font-semibold">{t('knowledge.authRequiredTitle')}</p>
        <p className="mt-2 text-sm text-slate-400">{t('knowledge.authRequiredHint')}</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center text-violet-300">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (error && !storageReady) {
    return (
      <div className="mx-auto max-w-lg p-8 text-center text-slate-200">
        <p>{t('knowledge.storageUnavailable')}</p>
      </div>
    );
  }

  return (
    <KnowledgeShellLayout isAdmin={isAdmin} stats={stats}>
      {viewContent}
    </KnowledgeShellLayout>
  );
}
