/**
 * ExportImportSection Component
 * Handles export/import of quotes to/from JSON
 */

import React, { useRef, useState } from 'react';
import { Download, Upload, CheckCircle, AlertTriangle } from 'lucide-react';
import { useExportImport } from '../../hooks/useExportImport';
import { settingsTheme as S } from '../tabs/SettingsTab/settingsThemeClasses';

export function ExportImportSection({ onImportComplete }) {
  const fileInputRef = useRef(null);
  const [status, setStatus] = useState(null); // 'success' | 'error' | 'loading' | null
  const [message, setMessage] = useState('');

  const { exportQuotes, importQuotes } = useExportImport();

  const handleExport = async () => {
    try {
      setStatus('loading');
      setMessage('Export en cours...');

      const result = await exportQuotes();

      if (result.success) {
        setStatus('success');
        setMessage(`${result.count} citations exportées avec succès`);
        setTimeout(() => {
          setStatus(null);
          setMessage('');
        }, 3000);
      } else {
        setStatus('error');
        setMessage(result.error || 'Erreur lors de l\'export');
        setTimeout(() => {
          setStatus(null);
          setMessage('');
        }, 5000);
      }
    } catch (error) {
      setStatus('error');
      setMessage('Erreur lors de l\'export');
      setTimeout(() => {
        setStatus(null);
        setMessage('');
      }, 5000);
    }
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setStatus('loading');
      setMessage('Import en cours...');

      const text = await file.text();
      const result = await importQuotes(text);

      if (result.success) {
        setStatus('success');
        setMessage(
          `Import réussi : ${result.imported} citations importées, ${result.skipped} ignorées`
        );

        if (onImportComplete) {
          onImportComplete(result);
        }

        setTimeout(() => {
          setStatus(null);
          setMessage('');
        }, 5000);
      } else {
        setStatus('error');
        setMessage(result.error || 'Erreur lors de l\'import');
        setTimeout(() => {
          setStatus(null);
          setMessage('');
        }, 5000);
      }
    } catch (error) {
      setStatus('error');
      setMessage('Erreur lors de la lecture du fichier');
      setTimeout(() => {
        setStatus(null);
        setMessage('');
      }, 5000);
    }

    e.target.value = '';
  };

  return (
    <div className="space-y-4 rounded-lg border border-red-900/45 bg-red-950/15 p-4">
      <h3 className={S.label}>Export / Import</h3>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={handleExport}
          disabled={status === 'loading'}
          className={`${S.btnPrimary} flex-1 disabled:cursor-not-allowed`}
        >
          <Download className="h-4 w-4" />
          Exporter JSON
        </button>

        <button
          type="button"
          onClick={handleImportClick}
          disabled={status === 'loading'}
          className={`${S.btnSecondary} flex-1 disabled:cursor-not-allowed`}
        >
          <Upload className="h-4 w-4" />
          Importer JSON
        </button>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        onChange={handleFileChange}
        className="hidden"
      />

      {status && message && (
        <div
          className={`flex items-start gap-2 rounded-lg border p-3 text-sm ${
            status === 'success'
              ? 'border-emerald-700/40 bg-emerald-950/25 text-emerald-300'
              : status === 'error'
                ? 'border-red-700/45 bg-red-950/30 text-red-300'
                : 'border-red-900/50 bg-red-950/20 text-red-200/90'
          }`}
        >
          {status === 'success' && <CheckCircle size={16} className="mt-0.5 flex-shrink-0" />}
          {status === 'error' && <AlertTriangle size={16} className="mt-0.5 flex-shrink-0" />}
          <span>{message}</span>
        </div>
      )}

      <div className={`space-y-1 text-xs ${S.muted}`}>
        <p>• Export : Télécharge toutes vos citations en JSON</p>
        <p>• Import : Fusionne avec vos citations existantes (évite les doublons)</p>
      </div>
    </div>
  );
}
