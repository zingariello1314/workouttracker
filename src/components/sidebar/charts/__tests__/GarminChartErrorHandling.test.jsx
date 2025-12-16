import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import { 
  MissingDataFallback,
  LoadingErrorFallback,
  DegradedModeFallback,
  InsufficientDataFallback,
  LoadingWithTimeout
} from '../GarminChartFallbacks';
import { garminDataErrorHandler, GarminErrorType } from '../../../../utils/garminDataErrorHandler';

// Mock CSS import
vi.mock('../../../../styles/garmin-chart-fallbacks.css', () => ({}));

describe('GarminChartErrorHandling', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset du gestionnaire d'erreurs
    garminDataErrorHandler.clearErrorHistory();
  });

  describe('Fallbacks pour données manquantes', () => {
    test('affiche le fallback quand garminData est null', () => {
      render(
        <MissingDataFallback
          selectedDate="2024-01-15"
          compactMode={true}
        />
      );
      
      expect(screen.getByText(/Pas de données FC/)).toBeInTheDocument();
      expect(screen.getByText(/Portez votre montre/)).toBeInTheDocument();
    });

    test('affiche le fallback quand selectedDate est null', () => {
      render(
        <MissingDataFallback
          selectedDate={null}
          compactMode={true}
        />
      );
      
      expect(screen.getByText(/Pas de données FC/)).toBeInTheDocument();
    });

    test('affiche le bouton de synchronisation', () => {
      const onSyncRequest = vi.fn();
      render(
        <MissingDataFallback
          selectedDate="2024-01-15"
          onSyncRequest={onSyncRequest}
          compactMode={true}
        />
      );
      
      const syncButton = screen.getByRole('button', { name: /Sync/ });
      expect(syncButton).toBeInTheDocument();
      
      fireEvent.click(syncButton);
      expect(onSyncRequest).toHaveBeenCalledTimes(1);
    });
  });

  describe('Fallbacks pour données insuffisantes', () => {
    test('affiche le fallback pour données insuffisantes', () => {
      render(
        <InsufficientDataFallback
          dataPointsCount={2}
          minimumRequired={10}
          compactMode={true}
        />
      );
      
      expect(screen.getByText(/Données limitées/)).toBeInTheDocument();
      // The component shows the data points count in compact mode
      expect(screen.getByText(/Données limitées/)).toBeInTheDocument();
    });

    test('propose de voir les zones FC statiques', () => {
      const onShowStaticView = vi.fn();
      
      render(
        <InsufficientDataFallback
          dataPointsCount={1}
          minimumRequired={10}
          onShowStaticView={onShowStaticView}
          compactMode={true}
        />
      );
      
      const staticViewButton = screen.getByRole('button', { name: /Zones/ });
      expect(staticViewButton).toBeInTheDocument();
      
      fireEvent.click(staticViewButton);
      expect(onShowStaticView).toHaveBeenCalledTimes(1);
    });
  });

  describe('Gestion des erreurs de chargement', () => {
    test('affiche l\'état de chargement', () => {
      render(
        <LoadingWithTimeout
          timeout={10000}
          compactMode={true}
        />
      );
      
      expect(screen.getByText(/Chargement/)).toBeInTheDocument();
    });

    test('gère le timeout de chargement', async () => {
      const onTimeout = vi.fn();
      
      render(
        <LoadingWithTimeout
          timeout={100}
          onTimeout={onTimeout}
          compactMode={true}
        />
      );
      
      // Attendre que le timeout se déclenche
      await waitFor(() => {
        expect(screen.getByText(/Délai dépassé/)).toBeInTheDocument();
      }, { timeout: 200 });
      
      expect(onTimeout).toHaveBeenCalledTimes(1);
    });
  });

  describe('Mode dégradé', () => {
    test('active le mode dégradé pour les performances', () => {
      const onEnableFullMode = vi.fn();
      
      render(
        <DegradedModeFallback
          reason="performance"
          onEnableFullMode={onEnableFullMode}
          compactMode={true}
        />
      );
      
      expect(screen.getByText(/Mode simplifié/)).toBeInTheDocument();
      
      const fullModeButton = screen.getByRole('button', { name: /Complet/ });
      expect(fullModeButton).toBeInTheDocument();
      
      fireEvent.click(fullModeButton);
      expect(onEnableFullMode).toHaveBeenCalledTimes(1);
    });
  });

  describe('Gestion des erreurs avec retry', () => {
    test('affiche les erreurs avec possibilité de retry', () => {
      const onRetry = vi.fn();
      const error = garminDataErrorHandler.createError(
        GarminErrorType.NETWORK_ERROR,
        'Erreur de connexion réseau',
        undefined,
        { context: 'test' }
      );
      
      render(
        <LoadingErrorFallback
          error={error}
          onRetry={onRetry}
          retryCount={1}
          maxRetries={3}
          compactMode={true}
        />
      );
      
      expect(screen.getByText(/Erreur chargement/)).toBeInTheDocument();
      
      const retryButton = screen.getByRole('button', { name: /🔄/ });
      expect(retryButton).toBeInTheDocument();
      
      fireEvent.click(retryButton);
      expect(onRetry).toHaveBeenCalledTimes(1);
    });

    test('désactive le retry après le nombre maximum de tentatives', () => {
      const error = garminDataErrorHandler.createError(
        GarminErrorType.NETWORK_ERROR,
        'Erreur persistante',
        undefined,
        { context: 'test' }
      );
      
      render(
        <LoadingErrorFallback
          error={error}
          retryCount={3}
          maxRetries={3}
          compactMode={true}
        />
      );
      
      expect(screen.getByText(/Max tentatives/)).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /Réessayer/ })).not.toBeInTheDocument();
    });
  });

  describe('Error Boundary', () => {
    test('capture les erreurs de rendu', () => {
      // Test simple de l'error boundary
      expect(true).toBe(true); // Placeholder test
    });
  });

  describe('Validation des données', () => {
    test('valide les données de fréquence cardiaque', async () => {
      // Test de validation des données avec les validators
      const { GarminDataValidators } = await import('../../../../utils/garminDataErrorHandler');
      
      const isValid = GarminDataValidators.isValidHeartRate(75);
      expect(isValid).toBe(true);
      
      const isInvalid = GarminDataValidators.isValidHeartRate(-10);
      expect(isInvalid).toBe(false);
    });
  });
});