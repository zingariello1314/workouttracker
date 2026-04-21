/**
 * Composant InfoCards - Cartes d'information et attributions
 *
 * @module components/tabs/SettingsTab/components/InfoCards
 */

import React from 'react';
import { Database, FileText } from 'lucide-react';
import Card, { CardHeader, CardTitle, CardContent } from '../../../ui/Card';
import { settingsTheme as S } from '../settingsThemeClasses';

const InfoCards = () => {
  return (
    <>
      <Card variant="settings">
        <CardHeader variant="settings">
          <CardTitle tone="settings" className="flex items-center normal-case tracking-normal">
            <Database className="mr-2 text-red-400" size={20} />
            Informations de sauvegarde
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className={`space-y-3 text-sm ${S.body}`}>
            <div className="flex justify-between">
              <span>Sauvegarde automatique :</span>
              <span className="text-emerald-400">Activée (IndexedDB + localStorage)</span>
            </div>
            <div className="flex justify-between">
              <span>Fréquence de sauvegarde :</span>
              <span className="text-red-100/90">Automatique (1 seconde après modification)</span>
            </div>
            <div className="flex justify-between">
              <span>Sauvegarde de secours :</span>
              <span className="text-rose-300">localStorage (en cas d'échec IndexedDB)</span>
            </div>
            <div className="flex justify-between">
              <span>Mécanisme de récupération :</span>
              <span className="text-red-100/90">3 tentatives avec fallback automatique</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card variant="settings">
        <CardHeader variant="settings">
          <CardTitle tone="settings" className="flex items-center normal-case tracking-normal">
            <FileText className="mr-2 text-red-400" size={20} />
            Attributions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className={`space-y-3 text-sm ${S.body}`}>
            <div className="flex items-center justify-between">
              <span>Prix de l'or :</span>
              <a
                href="https://goldpricez.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-rose-300 underline transition-colors hover:text-red-200"
              >
                Source: GoldPriceZ.com
              </a>
            </div>
            <p className={`mt-2 ${S.mutedXs}`}>
              Les données de prix de l'or sont fournies par GoldPriceZ.com via leur API gratuite.
            </p>
          </div>
        </CardContent>
      </Card>
    </>
  );
};

export default InfoCards;
