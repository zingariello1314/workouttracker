/**
 * Composant d'export CSV du portfolio
 * 
 * ✅ PHASE 3 - Étape 3.20 : Gestion erreur export CSV
 * - Try/catch complet pour toutes erreurs possibles
 * - Toast notifications au lieu de alert()
 * - Validation données avant export
 * - Gestion erreurs spécifiques (Blob, URL, téléchargement)
 * 
 * @module components/finance/bourse/ExportCSV
 * @see docs/finance/ANALYSE_PROFONDE_SOUS_ONGLET_BOURSE.md - Solution 12
 */

import React, { useCallback } from 'react';
import { useFinance } from '../../../context/FinanceContext';
import { useToast } from '../../ui/Toast';

const ExportCSV = () => {
  const { portfolio } = useFinance();
  const { showToast } = useToast();

  // ✅ PHASE 3 - Étape 3.20 : Export CSV avec gestion erreur complète
  const exportToCSV = useCallback(() => {
    try {
      // ✅ PHASE 3.20 : Validation portfolio avant export
      if (!portfolio || portfolio.length === 0) {
        showToast('Aucune position à exporter', 'warning');
        return;
      }

      // ✅ PHASE 3.20 : Validation données portfolio (vérifier structure)
      const validPortfolio = portfolio.filter(pos => pos && pos.ticker);
      if (validPortfolio.length === 0) {
        showToast('Aucune position valide à exporter', 'error');
        return;
      }

      // ✅ PHASE 3.20 : Préparer headers CSV
      const headers = [
        'Ticker',
        'Entreprise',
        'Quantité',
        'Prix Entrée (€)',
        'Prix Actuel (€)',
        'Valeur Position (€)',
        'Plus-Value (€)',
        'Plus-Value (%)',
        'Poids Portfolio (%)',
        'Date Achat'
      ];

      // ✅ PHASE 3.20 : Préparer rows avec gestion erreurs formatage
      const rows = validPortfolio.map((pos, index) => {
        try {
          return [
            pos.ticker || '',
            pos.entreprise || '',
            pos.quantite ?? 0,
            pos.prixEntree ?? 0,
            pos.yahooData?.prixActuel ?? pos.prixEntree ?? 0,
            pos.calculs?.valeurPosition ?? 0,
            pos.calculs?.plusValueEuro ?? 0,
            pos.calculs?.plusValuePourcent ?? 0,
            pos.calculs?.poidsPortfolio ?? 0,
            pos.dateAchat || ''
          ];
        } catch (err) {
          // ✅ PHASE 3.20 : Gérer erreur formatage ligne individuelle
          console.warn(`[ExportCSV] Erreur formatage ligne ${index + 1}:`, err);
          return null; // Ignorer cette ligne
        }
      }).filter(row => row !== null); // Filtrer lignes invalides

      if (rows.length === 0) {
        showToast('Erreur lors de la préparation des données à exporter', 'error');
        return;
      }

      // ✅ PHASE 3.20 : Générer CSV avec gestion erreurs
      let csv;
      try {
        const csvRows = rows.map(row => 
          row.map(cell => {
            // ✅ PHASE 3.20 : Échapper caractères spéciaux CSV (guillemets, virgules, retours ligne)
            const cellStr = String(cell ?? '');
            // Remplacer guillemets doubles par double guillemets (standard CSV)
            const escaped = cellStr.replace(/"/g, '""');
            return `"${escaped}"`;
          }).join(',')
        );
        
        csv = [
          headers.join(','),
          ...csvRows
        ].join('\n');
      } catch (err) {
        console.error('[ExportCSV] Erreur génération CSV:', err);
        showToast('Erreur lors de la génération du fichier CSV', 'error');
        return;
      }

      // ✅ PHASE 3.20 : Créer Blob avec gestion erreurs
      let blob;
      try {
        blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        
        // ✅ PHASE 3.20 : Vérifier taille Blob (protection mémoire)
        if (blob.size === 0) {
          showToast('Le fichier CSV généré est vide', 'error');
          return;
        }
        
        // ✅ PHASE 3.20 : Avertir si fichier très volumineux (>10MB)
        const maxSize = 10 * 1024 * 1024; // 10MB
        if (blob.size > maxSize) {
          showToast('Le fichier CSV est très volumineux, le téléchargement peut prendre du temps', 'warning');
        }
      } catch (err) {
        console.error('[ExportCSV] Erreur création Blob:', err);
        showToast('Erreur lors de la création du fichier CSV (mémoire insuffisante ?)', 'error');
        return;
      }

      // ✅ PHASE 3.20 : Créer URL et télécharger avec gestion erreurs
      let url;
      let link;
      try {
        url = URL.createObjectURL(blob);
        if (!url) {
          throw new Error('Impossible de créer l\'URL du fichier');
        }

        link = document.createElement('a');
        link.href = url;
        link.download = `portfolio_${new Date().toISOString().split('T')[0]}.csv`;
        
        // ✅ PHASE 3.20 : Ajouter lien au DOM temporairement (nécessaire pour certains navigateurs)
        document.body.appendChild(link);
        link.click();
        
        // ✅ PHASE 3.20 : Nettoyer immédiatement
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
        // ✅ PHASE 3.20 : Succès
        showToast(`Portfolio exporté avec succès (${validPortfolio.length} position${validPortfolio.length > 1 ? 's' : ''})`, 'success');
      } catch (err) {
        console.error('[ExportCSV] Erreur téléchargement:', err);
        
        // ✅ PHASE 3.20 : Nettoyer en cas d'erreur
        if (link && link.parentNode) {
          document.body.removeChild(link);
        }
        if (url) {
          URL.revokeObjectURL(url);
        }
        
        // ✅ PHASE 3.20 : Message erreur spécifique selon type
        if (err.name === 'QuotaExceededError' || err.message.includes('quota')) {
          showToast('Espace de stockage insuffisant pour télécharger le fichier', 'error');
        } else if (err.message.includes('URL')) {
          showToast('Erreur lors de la création du lien de téléchargement', 'error');
        } else {
          showToast('Erreur lors du téléchargement du fichier CSV', 'error');
        }
      }
    } catch (err) {
      // ✅ PHASE 3.20 : Gestion erreur globale (catch-all)
      console.error('[ExportCSV] Erreur inattendue:', err);
      showToast('Une erreur inattendue s\'est produite lors de l\'export', 'error');
    }
  }, [portfolio, showToast]);

  if (portfolio.length === 0) return null;

  return (
    <button
      type="button"
      onClick={exportToCSV}
      className="gradient-button-premium gradient-button-premium-md rounded-lg flex items-center gap-2"
    >
      <span>📥</span>
      <span>Exporter CSV</span>
    </button>
  );
};

export default ExportCSV;



