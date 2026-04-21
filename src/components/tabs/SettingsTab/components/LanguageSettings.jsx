/**
 * Composant LanguageSettings - Interface utilisateur pour les paramètres de langue
 *
 * @module components/tabs/SettingsTab/components/LanguageSettings
 */

import React from 'react';
import { Languages } from 'lucide-react';
import Card, { CardHeader, CardTitle, CardContent } from '../../../ui/Card';
import LanguageSelector from '../../../ui/LanguageSelector';
import { useTranslation } from '../../../../utils/translations';
import { settingsTheme as S } from '../settingsThemeClasses';

const LanguageSettings = () => {
  const t = useTranslation();

  return (
    <Card variant="settings">
      <CardHeader variant="settings">
        <CardTitle tone="settings" className="flex items-center normal-case tracking-normal">
          <Languages className="mr-2 text-red-400" size={20} />
          {t('settings.language')}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <p className={`${S.body}`}>
            {t('settings.language.description')}
          </p>
          <LanguageSelector variant="dropdown" position="bottom-left" />
        </div>
      </CardContent>
    </Card>
  );
};

export default LanguageSettings;
