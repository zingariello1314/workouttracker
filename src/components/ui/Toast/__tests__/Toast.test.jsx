/**
 * Tests pour Toast et ToastProvider (version ui/Toast)
 * 
 * Couvre :
 * - Accessibilité (aria-live, role)
 * - Fermeture automatique
 * - Fermeture manuelle
 * - Types de toast (success, error, warning, info)
 * - ToastProvider et useToast
 * - Détails optionnels (titre, suggestions)
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import Toast, { TOAST_TYPES } from '../Toast';
import { ToastProvider, useToast } from '../ToastProvider';

describe('Toast (ui/Toast)', () => {
  const defaultProps = {
    id: 'test-toast-1',
    message: 'Message de test',
    type: TOAST_TYPES.INFO,
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
      render(<Toast {...defaultProps} />);
      expect(screen.getByText('Message de test')).toBeInTheDocument();
    });

    it('affiche le bon type de toast (success)', () => {
      render(<Toast {...defaultProps} type={TOAST_TYPES.SUCCESS} />);
      const toast = screen.getByRole('alert');
      expect(toast).toHaveClass('bg-green-600/95');
      expect(toast).toHaveAttribute('aria-live', 'polite');
    });

    it('affiche le bon type de toast (error)', () => {
      render(<Toast {...defaultProps} type={TOAST_TYPES.ERROR} />);
      const toast = screen.getByRole('alert');
      expect(toast).toHaveClass('bg-red-600/95');
      expect(toast).toHaveAttribute('aria-live', 'assertive');
    });

    it('affiche le bon type de toast (warning)', () => {
      render(<Toast {...defaultProps} type={TOAST_TYPES.WARNING} />);
      const toast = screen.getByRole('alert');
      expect(toast).toHaveClass('bg-yellow-600/95');
      expect(toast).toHaveAttribute('aria-live', 'polite');
    });

    it('affiche le bon type de toast (info)', () => {
      render(<Toast {...defaultProps} type={TOAST_TYPES.INFO} />);
      const toast = screen.getByRole('alert');
      expect(toast).toHaveClass('bg-blue-600/95');
      expect(toast).toHaveAttribute('aria-live', 'polite');
    });

    it('a les attributs ARIA corrects', () => {
      render(<Toast {...defaultProps} />);
      const toast = screen.getByRole('alert');
      expect(toast).toHaveAttribute('aria-live');
      expect(toast).toHaveAttribute('aria-atomic', 'true');
    });

    it('affiche le bouton de fermeture avec aria-label', () => {
      render(<Toast {...defaultProps} />);
      
      const closeButton = screen.getByLabelText('Fermer la notification');
      expect(closeButton).toBeInTheDocument();
    });
  });

  describe('Détails optionnels', () => {
    it('affiche le titre si fourni dans details', () => {
      const details = {
        title: 'Titre du toast',
        message: 'Message détaillé'
      };
      
      render(<Toast {...defaultProps} details={details} />);
      
      expect(screen.getByText('Titre du toast')).toBeInTheDocument();
      expect(screen.getByText('Message détaillé')).toBeInTheDocument();
    });

    it('affiche les suggestions si fournies', async () => {
      const user = userEvent.setup({ delay: null });
      const details = {
        title: 'Erreur',
        message: 'Plusieurs problèmes détectés',
        suggestions: ['Suggestion 1', 'Suggestion 2', 'Suggestion 3']
      };
      
      render(<Toast {...defaultProps} details={details} />);
      
      const toggleButton = screen.getByText(/Voir les suggestions/i);
      expect(toggleButton).toBeInTheDocument();
      
      await user.click(toggleButton);
      
      await waitFor(() => {
        expect(screen.getByText('Suggestion 1')).toBeInTheDocument();
        expect(screen.getByText('Suggestion 2')).toBeInTheDocument();
        expect(screen.getByText('Suggestion 3')).toBeInTheDocument();
      });
    });

    it('masque les suggestions par défaut', () => {
      const details = {
        title: 'Erreur',
        suggestions: ['Suggestion 1']
      };
      
      render(<Toast {...defaultProps} details={details} />);
      
      expect(screen.queryByText('Suggestion 1')).not.toBeInTheDocument();
    });

    it('toggle les suggestions au clic', async () => {
      const user = userEvent.setup({ delay: null });
      const details = {
        title: 'Erreur',
        suggestions: ['Suggestion 1']
      };
      
      render(<Toast {...defaultProps} details={details} />);
      
      const toggleButton = screen.getByText(/Voir les suggestions/i);
      await user.click(toggleButton);
      
      await waitFor(() => {
        expect(screen.getByText('Suggestion 1')).toBeInTheDocument();
        expect(toggleButton).toHaveAttribute('aria-expanded', 'true');
      });
      
      await user.click(toggleButton);
      
      await waitFor(() => {
        expect(screen.queryByText('Suggestion 1')).not.toBeInTheDocument();
        expect(toggleButton).toHaveAttribute('aria-expanded', 'false');
      });
    });
  });

  describe('Fermeture automatique', () => {
    it('ferme automatiquement après la durée par défaut', async () => {
      const onClose = vi.fn();
      render(<Toast {...defaultProps} onClose={onClose} />);
      
      // Durée par défaut pour INFO : 3000ms
      vi.advanceTimersByTime(3000);
      
      await waitFor(() => {
        expect(onClose).toHaveBeenCalledWith(defaultProps.id);
      });
    });

    it('ferme automatiquement avec durée prolongée si details présents', async () => {
      const onClose = vi.fn();
      const details = { title: 'Titre' };
      
      render(<Toast {...defaultProps} onClose={onClose} details={details} />);
      
      // Durée prolongée : 3000 + 2000 = 5000ms
      vi.advanceTimersByTime(5000);
      
      await waitFor(() => {
        expect(onClose).toHaveBeenCalledWith(defaultProps.id);
      });
    });

    it('nettoie le timer lors du démontage', () => {
      const onClose = vi.fn();
      const { unmount } = render(<Toast {...defaultProps} onClose={onClose} />);
      
      unmount();
      
      vi.advanceTimersByTime(5000);
      
      expect(onClose).not.toHaveBeenCalled();
    });
  });

  describe('Fermeture manuelle', () => {
    it('ferme quand le bouton de fermeture est cliqué', async () => {
      const user = userEvent.setup({ delay: null });
      const onClose = vi.fn();
      
      render(<Toast {...defaultProps} onClose={onClose} />);
      
      const closeButton = screen.getByLabelText('Fermer la notification');
      await user.click(closeButton);
      
      expect(onClose).toHaveBeenCalledWith(defaultProps.id);
    });
  });
});

describe('ToastProvider et useToast', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it('retourne les fonctions de toast via useToast', () => {
    const TestComponent = () => {
      const { showToast, showSuccess, showError, showWarning, showInfo, removeToast } = useToast();
      
      return (
        <div>
          <button onClick={() => showToast('Test', TOAST_TYPES.INFO)}>Show</button>
        </div>
      );
    };
    
    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    );
    
    expect(screen.getByText('Show')).toBeInTheDocument();
  });

  it('affiche un toast via showToast', async () => {
    const user = userEvent.setup({ delay: null });
    
    const TestComponent = () => {
      const { showToast } = useToast();
      
      return (
        <button onClick={() => showToast('Message test', TOAST_TYPES.SUCCESS)}>
          Afficher
        </button>
      );
    };
    
    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    );
    
    await user.click(screen.getByText('Afficher'));
    
    await waitFor(() => {
      expect(screen.getByText('Message test')).toBeInTheDocument();
    });
  });

  it('affiche un toast via showSuccess', async () => {
    const user = userEvent.setup({ delay: null });
    
    const TestComponent = () => {
      const { showSuccess } = useToast();
      
      return (
        <button onClick={() => showSuccess('Succès !')}>
          Afficher succès
        </button>
      );
    };
    
    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    );
    
    await user.click(screen.getByText('Afficher succès'));
    
    await waitFor(() => {
      expect(screen.getByText('Succès !')).toBeInTheDocument();
    });
  });

  it('affiche un toast via showError avec détails', async () => {
    const user = userEvent.setup({ delay: null });
    
    const TestComponent = () => {
      const { showError } = useToast();
      
      return (
        <button
          onClick={() =>
            showError('Erreur', {
              title: 'Titre erreur',
              suggestions: ['Suggestion 1']
            })
          }
        >
          Afficher erreur
        </button>
      );
    };
    
    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    );
    
    await user.click(screen.getByText('Afficher erreur'));
    
    await waitFor(() => {
      expect(screen.getByText('Titre erreur')).toBeInTheDocument();
      expect(screen.getByText('Erreur')).toBeInTheDocument();
    });
  });

  it('limite le nombre de toasts affichés simultanément', async () => {
    const user = userEvent.setup({ delay: null });
    
    const TestComponent = () => {
      const { showToast } = useToast();
      
      return (
        <button
          onClick={() => {
            for (let i = 0; i < 5; i++) {
              showToast(`Toast ${i}`, TOAST_TYPES.INFO);
            }
          }}
        >
          Afficher 5 toasts
        </button>
      );
    };
    
    render(
      <ToastProvider maxToasts={3}>
        <TestComponent />
      </ToastProvider>
    );
    
    await user.click(screen.getByText('Afficher 5 toasts'));
    
    await waitFor(() => {
      // Seuls les 3 derniers toasts doivent être affichés
      expect(screen.getByText('Toast 2')).toBeInTheDocument();
      expect(screen.getByText('Toast 3')).toBeInTheDocument();
      expect(screen.getByText('Toast 4')).toBeInTheDocument();
      // Les premiers doivent être supprimés
      expect(screen.queryByText('Toast 0')).not.toBeInTheDocument();
      expect(screen.queryByText('Toast 1')).not.toBeInTheDocument();
    });
  });

  it('supprime un toast via removeToast', async () => {
    const user = userEvent.setup({ delay: null });
    
    const TestComponent = () => {
      const { showToast, removeToast } = useToast();
      const [toastId, setToastId] = React.useState(null);
      
      return (
        <div>
          <button
            onClick={() => {
              const id = showToast('Message', TOAST_TYPES.INFO);
              setToastId(id);
            }}
          >
            Afficher
          </button>
          <button onClick={() => removeToast(toastId)}>Supprimer</button>
        </div>
      );
    };
    
    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    );
    
    await user.click(screen.getByText('Afficher'));
    
    await waitFor(() => {
      expect(screen.getByText('Message')).toBeInTheDocument();
    });
    
    await user.click(screen.getByText('Supprimer'));
    
    await waitFor(() => {
      expect(screen.queryByText('Message')).not.toBeInTheDocument();
    });
  });

  it('ferme automatiquement les toasts après leur durée', async () => {
    const TestComponent = () => {
      const { showSuccess } = useToast();
      
      return (
        <button onClick={() => showSuccess('Message')}>Afficher</button>
      );
    };
    
    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    );
    
    const button = screen.getByText('Afficher');
    await userEvent.click(button);
    
    await waitFor(() => {
      expect(screen.getByText('Message')).toBeInTheDocument();
    });
    
    // Durée par défaut pour SUCCESS : 3000ms
    vi.advanceTimersByTime(3000);
    
    await waitFor(() => {
      expect(screen.queryByText('Message')).not.toBeInTheDocument();
    });
  });

  it('affiche le ToastContainer avec aria-live', () => {
    const TestComponent = () => {
      const { showToast } = useToast();
      
      return (
        <button onClick={() => showToast('Test', TOAST_TYPES.INFO)}>
          Afficher
        </button>
      );
    };
    
    const { container } = render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    );
    
    // Le ToastContainer doit avoir aria-live
    const toastContainer = container.querySelector('[aria-live="polite"]');
    expect(toastContainer).toBeInTheDocument();
  });
});



