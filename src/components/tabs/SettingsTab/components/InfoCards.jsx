/**
 * Composant InfoCards - Cartes d'information et attributions
 * 
 * ✅ PHASE 4 : Extraction de l'UI pour les cartes d'information
 * 
 * @module components/tabs/SettingsTab/components/InfoCards
 */

import React from 'react';
import { Database, FileText } from 'lucide-react';
import Card, { CardHeader, CardTitle, CardContent } from '../../../ui/Card';

/**
 * Composant pour afficher les cartes d'information
 * 
 * @returns {JSX.Element}
 */
const InfoCards = () => {
  return (
    <>
      {/* Section Informations */}
      <Card className="bg-slate-800/80 backdrop-blur-sm border-slate-700">
        <CardHeader>
          <CardTitle className="flex items-center text-white">
            <Database className="mr-2" size={20} />
            Informations de sauvegarde
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm text-gray-300">
            <div className="flex justify-between">
              <span>Sauvegarde automatique :</span>
              <span className="text-green-400">✅ Activée (IndexedDB + localStorage)</span>
            </div>
            <div className="flex justify-between">
              <span>Fréquence de sauvegarde :</span>
              <span>Automatique (1 seconde après modification)</span>
            </div>
            <div className="flex justify-between">
              <span>Sauvegarde de secours :</span>
              <span className="text-blue-400">localStorage (en cas d'échec IndexedDB)</span>
            </div>
            <div className="flex justify-between">
              <span>Mécanisme de récupération :</span>
              <span>3 tentatives avec fallback automatique</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Section Attributions */}
      <Card className="bg-slate-800/80 backdrop-blur-sm border-slate-700">
        <CardHeader>
          <CardTitle className="flex items-center text-white">
            <FileText className="mr-2" size={20} />
            Attributions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm text-gray-300">
            <div className="flex items-center justify-between">
              <span>Prix de l'or :</span>
              <a 
                href="https://goldpricez.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-400 hover:text-blue-300 underline transition-colors"
              >
                Source: GoldPriceZ.com
              </a>
            </div>
            <p className="text-xs text-slate-400 mt-2">
              Les données de prix de l'or sont fournies par GoldPriceZ.com via leur API gratuite.
            </p>
          </div>
        </CardContent>
      </Card>
    </>
  );
};

export default InfoCards;
