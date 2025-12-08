/**
 * ExportImportSection Component
 * Handles export/import of quotes to/from JSON
 */

import React, { useRef, useState } from 'react';
import { Download, Upload, CheckCircle, AlertTriangle } from 'lucide-react';
import Button from '../ui/Button';
import { useExportImport } from '../../hooks/useExportImport';

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
        
        // Notify parent
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

    // Reset file input
    e.target.value = '';
  };

  return (
    <div className="space-y-4 bg-slate-700/30 rounded-lg p-4">
      <h3 className="text-sm font-medium text-slate-300">Export / Import</h3>

      <div className="flex gap-2">
        <Button
          onClick={handleExport}
          icon={Download}
          disabled={status === 'loading'}
          className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-green-800"
        >
          Exporter JSON
        </Button>

        <Button
          onClick={handleImportClick}
          icon={Upload}
          disabled={status === 'loading'}
          className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800"
        >
          Importer JSON
        </Button>
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Status Message */}
      {status && message && (
        <div
          className={`flex items-start gap-2 text-sm p-3 rounded-lg ${
            status === 'success'
              ? 'bg-green-500/10 border border-green-500/30 text-green-400'
              : status === 'error'
              ? 'bg-red-500/10 border border-red-500/30 text-red-400'
              : 'bg-blue-500/10 border border-blue-500/30 text-blue-400'
          }`}
        >
          {status === 'success' && <CheckCircle size={16} className="mt-0.5 flex-shrink-0" />}
          {status === 'error' && <AlertTriangle size={16} className="mt-0.5 flex-shrink-0" />}
          <span>{message}</span>
        </div>
      )}

      {/* Info */}
      <div className="text-xs text-slate-400 space-y-1">
        <p>• Export : Télécharge toutes vos citations en JSON</p>
        <p>• Import : Fusionne avec vos citations existantes (évite les doublons)</p>
      </div>
    </div>
  );
}
