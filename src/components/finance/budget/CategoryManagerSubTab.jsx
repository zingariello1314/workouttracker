/**
 * Sous-onglet Gestion des Catégories - Architecte Catégories
 */

import React from 'react';
import { useTranslation } from '../../../utils/translations';
import { useBudget } from '../../../hooks/useBudget';
import CategoryManager from './CategoryManager';

const CategoryManagerSubTab = () => {
  const t = useTranslation();
  const { categories, loading } = useBudget();

  return (
    <div className="category-manager-sub-tab space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white mb-2">
          {t('budget.subTabs.categories')}
        </h2>
        <p className="text-slate-400">
          Gérez vos catégories de dépenses avec drag & drop
        </p>
      </div>

      <CategoryManager />
    </div>
  );
};

export default CategoryManagerSubTab;

