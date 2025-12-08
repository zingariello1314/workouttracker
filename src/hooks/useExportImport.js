/**
 * React Hook for Export/Import
 * Handles JSON export and import operations
 */

import { useState, useCallback } from 'react';
import exportService from '../services/quotes/exportService';
import logger from '../utils/logger';

const log = logger.component('useExportImport');

export function useExportImport() {
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importPreview, setImportPreview] = useState(null);
  const [error, setError] = useState(null);

  // Export quotes
  const exportQuotes = useCallback(async () => {
    try {
      setExporting(true);
      setError(null);

      const jsonString = await exportService.exportToJSON();
      exportService.downloadJSON(jsonString);

      log.info('Quotes exported successfully');
      return { success: true };
    } catch (err) {
      log.error('Failed to export quotes', err);
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setExporting(false);
    }
  }, []);

  // Preview import
  const previewImport = useCallback(async (file) => {
    try {
      setError(null);

      const text = await file.text();
      const preview = await exportService.getImportPreview(text);

      if (!preview.valid) {
        setError(preview.errors.join(', '));
        setImportPreview(null);
        return { success: false, errors: preview.errors };
      }

      setImportPreview(preview.preview);
      return { success: true, preview: preview.preview };
    } catch (err) {
      log.error('Failed to preview import', err);
      setError(err.message);
      return { success: false, error: err.message };
    }
  }, []);

  // Import quotes
  const importQuotes = useCallback(async (file) => {
    try {
      setImporting(true);
      setError(null);

      const text = await file.text();
      const result = await exportService.importFromJSON(text);

      if (!result.success) {
        setError(result.errors.join(', '));
        return result;
      }

      log.info(`Import complete: ${result.imported} imported, ${result.skipped} skipped`);
      setImportPreview(null);
      return result;
    } catch (err) {
      log.error('Failed to import quotes', err);
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setImporting(false);
    }
  }, []);

  // Clear preview
  const clearPreview = useCallback(() => {
    setImportPreview(null);
    setError(null);
  }, []);

  return {
    exporting,
    importing,
    importPreview,
    error,
    exportQuotes,
    previewImport,
    importQuotes,
    clearPreview,
  };
}
