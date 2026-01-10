/**
 * Composant LanguageSettings - Interface utilisateur pour les paramètres de langue
 * 
 * ✅ PHASE 4 : Extraction de l'UI pour les paramètres de langue
 * 
 * @module components/tabs/SettingsTab/components/LanguageSettings
 */

import React from 'react';
import { Languages } from 'lucide-react';
import Card, { CardHeader, CardTitle, CardContent } from '../../../ui/Card';
import LanguageSelector from '../../../ui/LanguageSelector';
import { useTranslation } from '../../../../utils/translations';

/**
 * Composant pour gérer les paramètres de langue
 * 
 * @returns {JSX.Element}
 */
const LanguageSettings = () => {
  const t = useTranslation();

  return (
    <Card className="bg-slate-800/80 backdrop-blur-sm border-slate-700">
      <CardHeader>
        <CardTitle className="flex items-center text-white">
          <Languages className="mr-2" size={20} />
          {t('settings.language')}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <p className="text-gray-300 text-sm">
            {t('settings.language.description')}
          </p>
          <LanguageSelector variant="dropdown" position="bottom-left" />
        </div>
      </CardContent>
    </Card>
  );
};

export default LanguageSettings;
