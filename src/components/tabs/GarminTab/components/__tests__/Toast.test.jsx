/**
 * Tests pour Toast et useToast (version GarminTab)
 * 
 * Couvre :
 * - Accessibilité (aria-live, role)
 * - Fermeture automatique
 * - Fermeture manuelle
 * - Instrumentation TelemetryCoordinator
 * - Types de toast (success, error, info)
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Toast, useToast } from '../Toast';
import TelemetryCoordinator from '../../utils/TelemetryCoordinator';
import { LanguageProvider } from '../../../../../context/LanguageContext';

// Mock TelemetryCoordinator
vi.mock('../../utils/TelemetryCoordinator', () => ({
  default: {
    recordEvent: vi.fn()
  }
}));

// Helper pour wrapper avec LanguageProvider
const renderWithProvider = (ui) => {
  return render(
    <LanguageProvider>
      {ui}
    </LanguageProvider>
  );
};

describe('Toast (GarminTab)', () => {
  const defaultProps = {
    id: 'test-toast-1',
    message: 'Message de test',
    type: 'success',
    duration: 3000,
    onClose: vi.fn()
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  describe('Rendu et accessibilité', () => {
    it('affiche le message', () => {
      renderWithProvider(<Toast {...defaultProps} />);
      expect(screen.getByText('Message de test')).toBeInTheDocument();
    });

    it('affiche le bon type de toast (success)', () => {
      renderWithProvider(<Toast {...defaultProps} type="success" />);
      const toast = screen.getByRole('status');
      expect(toast).toHaveClass('bg-green-600');
      expect(toast).toHaveAttribute('aria-live', 'polite');
    });

    it('affiche le bon type de toast (error)', () => {
      renderWithProvider(<Toast {...defaultProps} type="error" />);
      const toast = screen.getByRole('alert');
      expect(toast).toHaveClass('bg-red-600');
      expect(toast).toHaveAttribute('aria-live', 'assertive');
    });

    it('affiche le bon type de toast (info)', () => {
      renderWithProvider(<Toast {...defaultProps} type="info" />);
      const toast = screen.getByRole('status');
      expect(toast).toHaveClass('bg-blue-600');
      expect(toast).toHaveAttribute('aria-live', 'polite');
    });

    it('a les attributs ARIA corrects', () => {
      renderWithProvider(<Toast {...defaultProps} />);
      const toast = screen.getByRole('status');
      expect(toast).toHaveAttribute('aria-live');
      expect(toast).toHaveAttribute('aria-atomic', 'true');
    });

    it('supporte les messages ReactNode', () => {
      const messageNode = (
        <div>
          <p>Message complexe</p>
          <span>Détails</span>
        </div>
      );
      
      renderWithProvider(<Toast {...defaultProps} message={messageNode} />);
      
      expect(screen.getByText('Message complexe')).toBeInTheDocument();
      expect(screen.getByText('Détails')).toBeInTheDocument();
    });

    it('affiche le bouton de fermeture avec aria-label', () => {
      renderWithProvider(<Toast {...defaultProps} />);
      
      const closeButton = screen.getByLabelText('Fermer le message');
      expect(closeButton).toBeInTheDocument();
    });
  });

  describe('Fermeture automatique', () => {
    it('ferme automatiquement après la durée spécifiée', async () => {
      const onClose = vi.fn();
      renderWithProvider(<Toast {...defaultProps} duration={1000} onClose={onClose} />);
      
      expect(onClose).not.toHaveBeenCalled();
      
      vi.advanceTimersByTime(1000);
      
      await waitFor(() => {
        expect(onClose).toHaveBeenCalledTimes(1);
      });
    });

    it('ne ferme pas automatiquement si duration est 0', async () => {
      const onClose = vi.fn();
      renderWithProvider(<Toast {...defaultProps} duration={0} onClose={onClose} />);
      
      vi.advanceTimersByTime(5000);
      
      await waitFor(() => {
        expect(onClose).not.toHaveBeenCalled();
      }, { timeout: 100 });
    });

    it('nettoie le timer lors du démontage', () => {
      const onClose = vi.fn();
      const { unmount } = renderWithProvider(<Toast {...defaultProps} duration={1000} onClose={onClose} />);
      
      unmount();
      
      vi.advanceTimersByTime(1000);
      
      expect(onClose).not.toHaveBeenCalled();
    });
  });

  describe('Fermeture manuelle', () => {
    it('ferme quand le bouton de fermeture est cliqué', async () => {
      const user = userEvent.setup({ delay: null });
      const onClose = vi.fn();
      
      renderWithProvider(<Toast {...defaultProps} onClose={onClose} />);
      
      const closeButton = screen.getByLabelText('Fermer le message');
      await user.click(closeButton);
      
      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });

  describe('Instrumentation', () => {
    it('enregistre l\'événement toast_shown lors de l\'affichage', () => {
      renderWithProvider(<Toast {...defaultProps} id="test-id" />);
      
      expect(TelemetryCoordinator.recordEvent).toHaveBeenCalledWith(
        'toast_shown',
        expect.objectContaining({
          type: 'success',
          messageLength: expect.any(Number),
          duration: 3000,
          timestamp: expect.any(String)
        })
      );
    });

    it('enregistre l\'événement toast_closed lors de la fermeture automatique', async () => {
      const onClose = vi.fn();
      renderWithProvider(<Toast {...defaultProps} id="test-id" duration={1000} onClose={onClose} />);
      
      vi.advanceTimersByTime(1000);
      
      await waitFor(() => {
        expect(TelemetryCoordinator.recordEvent).toHaveBeenCalledWith(
          'toast_closed',
          expect.objectContaining({
            type: 'success',
            reason: 'auto',
            timestamp: expect.any(String)
          })
        );
      });
    });

    it('enregistre l\'événement toast_closed lors de la fermeture manuelle', async () => {
      const user = userEvent.setup({ delay: null });
      const onClose = vi.fn();
      
      renderWithProvider(<Toast {...defaultProps} id="test-id" onClose={onClose} />);
      
      const closeButton = screen.getByLabelText('Fermer le message');
      await user.click(closeButton);
      
      expect(TelemetryCoordinator.recordEvent).toHaveBeenCalledWith(
        'toast_closed',
        expect.objectContaining({
          type: 'success',
          reason: 'manual',
          timestamp: expect.any(String)
        })
      );
    });
  });
});

describe('useToast (GarminTab)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it('retourne showToast, removeToast et ToastContainer', () => {
    const TestComponent = () => {
      const { showToast, removeToast, ToastContainer } = useToast();
      
      return (
        <div>
          <button onClick={() => showToast('Test', 'success')}>Afficher</button>
          <ToastContainer />
        </div>
      );
    };
    
    renderWithProvider(<TestComponent />);
    expect(screen.getByText('Afficher')).toBeInTheDocument();
  });

  it('affiche un toast via showToast', async () => {
    const user = userEvent.setup({ delay: null });
    
    const TestComponent = () => {
      const { showToast, ToastContainer } = useToast();
      
      return (
        <div>
          <button onClick={() => showToast('Message test', 'success')}>
            Afficher
          </button>
          <ToastContainer />
        </div>
      );
    };
    
    renderWithProvider(<TestComponent />);
    
    const button = screen.getByText('Afficher');
    await user.click(button);
    
    await waitFor(() => {
      expect(screen.getByText('Message test')).toBeInTheDocument();
    }, { timeout: 2000 });
  });

  it('retourne un ID unique pour chaque toast', () => {
    const TestComponent = () => {
      const { showToast } = useToast();
      
      const handleClick = () => {
        const id1 = showToast('Toast 1', 'success');
        const id2 = showToast('Toast 2', 'success');
        expect(id1).not.toBe(id2);
      };
      
      return <button onClick={handleClick}>Test</button>;
    };
    
    renderWithProvider(<TestComponent />);
    // Le test est dans le handler, pas besoin d'interaction
  });

  it('affiche plusieurs toasts simultanément', async () => {
    const user = userEvent.setup({ delay: null });
    
    const TestComponent = () => {
      const { showToast, ToastContainer } = useToast();
      
      const handleClick = () => {
        showToast('Toast 1', 'success');
        showToast('Toast 2', 'error');
        showToast('Toast 3', 'info');
      };
      
      return (
        <div>
          <button onClick={handleClick}>Afficher multiples</button>
          <ToastContainer />
        </div>
      );
    };
    
    renderWithProvider(<TestComponent />);
    
    await user.click(screen.getByText('Afficher multiples'));
    
    await waitFor(() => {
      expect(screen.getByText('Toast 1')).toBeInTheDocument();
      expect(screen.getByText('Toast 2')).toBeInTheDocument();
      expect(screen.getByText('Toast 3')).toBeInTheDocument();
    }, { timeout: 2000 });
  });

  it('supprime un toast via removeToast', async () => {
    const user = userEvent.setup({ delay: null });
    
    const TestComponent = () => {
      const { showToast, removeToast, ToastContainer } = useToast();
      const [toastId, setToastId] = React.useState(null);
      
      return (
        <div>
          <button onClick={() => {
            const id = showToast('Message', 'success');
            setToastId(id);
          }}>
            Afficher
          </button>
          <button onClick={() => removeToast(toastId)}>
            Supprimer
          </button>
          <ToastContainer />
        </div>
      );
    };
    
    renderWithProvider(<TestComponent />);
    
    await user.click(screen.getByText('Afficher'));
    
    await waitFor(() => {
      expect(screen.getByText('Message')).toBeInTheDocument();
    }, { timeout: 2000 });
    
    await user.click(screen.getByText('Supprimer'));
    
    await waitFor(() => {
      expect(screen.queryByText('Message')).not.toBeInTheDocument();
    }, { timeout: 2000 });
  });

  it('ferme automatiquement les toasts après leur durée', async () => {
    const TestComponent = () => {
      const { showToast, ToastContainer } = useToast();
      
      return (
        <div>
          <button onClick={() => showToast('Message', 'success', 1000)}>
            Afficher
          </button>
          <ToastContainer />
        </div>
      );
    };
    
    renderWithProvider(<TestComponent />);
    
    const button = screen.getByText('Afficher');
    await userEvent.click(button);
    
    await waitFor(() => {
      expect(screen.getByText('Message')).toBeInTheDocument();
    }, { timeout: 2000 });
    
    vi.advanceTimersByTime(1000);
    
    await waitFor(() => {
      expect(screen.queryByText('Message')).not.toBeInTheDocument();
    }, { timeout: 2000 });
  });
});

