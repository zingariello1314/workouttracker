/**
 * Export/Import Service for Quotes
 * Handles JSON export/import with validation
 */

import quotesStorage from './quotesStorage';
import logger from '../../utils/logger';

const log = logger.component('ExportService');

const EXPORT_VERSION = '1.0';

class ExportService {
  constructor(storage) {
    this.storage = storage;
  }

  /**
   * Export all quotes to JSON
   */
  async exportToJSON() {
    try {
      const quotes = await this.storage.getAllQuotes();
      const settings = await this.storage.getSettings();

      const exportData = {
        version: EXPORT_VERSION,
        exportDate: new Date().toISOString(),
        quotes,
        settings,
      };

      return JSON.stringify(exportData, null, 2);
    } catch (error) {
      log.error('Failed to export quotes', error);
      throw new Error('EXPORT_FAILED');
    }
  }

  /**
   * Download JSON file
   */
  downloadJSON(jsonString, filename = null) {
    try {
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');

      const defaultFilename = `momentum-quotes-${new Date().toISOString().split('T')[0]}.json`;
      link.href = url;
      link.download = filename || defaultFilename;

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      URL.revokeObjectURL(url);
      log.info('JSON downloaded successfully');
    } catch (error) {
      log.error('Failed to download JSON', error);
      throw new Error('DOWNLOAD_FAILED');
    }
  }

  /**
   * Validate JSON structure
   */
  validateJSON(jsonString) {
    const errors = [];

    try {
      const data = JSON.parse(jsonString);

      // Check version
      if (!data.version) {
        errors.push('Missing version field');
      }

      // Check quotes array
      if (!Array.isArray(data.quotes)) {
        errors.push('Quotes must be an array');
      } else {
        // Validate each quote
        data.quotes.forEach((quote, index) => {
          const requiredFields = [
            'id',
            'line1Fr',
            'line2Fr',
            'line3Fr',
            'line1En',
            'line2En',
            'line3En',
            'isPinned',
            'order',
            'createdAt',
            'updatedAt',
          ];

          requiredFields.forEach((field) => {
            if (quote[field] === undefined) {
              errors.push(`Quote ${index}: missing field ${field}`);
            }
          });
        });
      }

      // Check settings
      if (!data.settings) {
        errors.push('Missing settings object');
      } else {
        if (!['random', 'fixed'].includes(data.settings.mode)) {
          errors.push('Invalid settings mode');
        }
      }

      return {
        valid: errors.length === 0,
        errors,
        data: errors.length === 0 ? data : null,
      };
    } catch (error) {
      return {
        valid: false,
        errors: ['Invalid JSON format'],
        data: null,
      };
    }
  }

  /**
   * Import quotes from JSON
   */
  async importFromJSON(jsonString) {
    try {
      // Validate JSON
      const validation = this.validateJSON(jsonString);

      if (!validation.valid) {
        return {
          success: false,
          imported: 0,
          skipped: 0,
          errors: validation.errors,
        };
      }

      const { quotes, settings } = validation.data;

      // Get existing quotes
      const existing = await this.storage.getAllQuotes();
      const existingIds = new Set(existing.map((q) => q.id));

      // Merge strategy: skip duplicates
      const toImport = quotes.filter((q) => !existingIds.has(q.id));

      // Bulk add new quotes
      const results = await this.storage.bulkAddQuotes(toImport);

      const imported = results.filter((r) => r.success).length;
      const failed = results.filter((r) => !r.success);

      // Update settings if provided
      if (settings && settings.mode) {
        await this.storage.updateSettings(settings);
      }

      log.info(`Import complete: ${imported} imported, ${quotes.length - toImport.length} skipped`);

      return {
        success: true,
        imported,
        skipped: quotes.length - toImport.length,
        errors: failed.map((f) => `Failed to import quote ${f.id}`),
      };
    } catch (error) {
      log.error('Failed to import quotes', error);
      return {
        success: false,
        imported: 0,
        skipped: 0,
        errors: [error.message],
      };
    }
  }

  /**
   * Get import preview
   */
  async getImportPreview(jsonString) {
    try {
      const validation = this.validateJSON(jsonString);

      if (!validation.valid) {
        return {
          valid: false,
          errors: validation.errors,
          preview: null,
        };
      }

      const { quotes } = validation.data;
      const existing = await this.storage.getAllQuotes();
      const existingIds = new Set(existing.map((q) => q.id));

      const newQuotes = quotes.filter((q) => !existingIds.has(q.id));
      const duplicates = quotes.filter((q) => existingIds.has(q.id));

      return {
        valid: true,
        errors: [],
        preview: {
          total: quotes.length,
          new: newQuotes.length,
          duplicates: duplicates.length,
          newQuotes: newQuotes.slice(0, 5), // Preview first 5
          duplicateQuotes: duplicates.slice(0, 5),
        },
      };
    } catch (error) {
      log.error('Failed to generate preview', error);
      return {
        valid: false,
        errors: [error.message],
        preview: null,
      };
    }
  }
}

// Singleton instance
const exportService = new ExportService(quotesStorage);

export default exportService;
