/**
 * Tests pour ConfirmDialog et useConfirmDialog
 * 
 * Couvre :
 * - Accessibilité (ARIA, focus trap, navigation clavier)
 * - Callbacks (onConfirm, onCancel)
 * - Variants (warning, danger, info)
 * - Raccourcis clavier (Enter, Escape)
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ConfirmDialog, { useConfirmDialog } from '../ConfirmDialog';

describe('ConfirmDialog', () => {
  const defaultProps = {
    isOpen: true,
    title: 'Confirmation',
    message: 'Êtes-vous sûr ?',
    onConfirm: vi.fn(),
    onCancel: vi.fn()
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Rendu et accessibilité', () => {
    it('ne rend rien quand isOpen est false', () => {
      const { container } = render(
        <ConfirmDialog {...defaultProps} isOpen={false} />
      );
      expect(container.firstChild).toBeNull();
    });

    it('affiche le dialogue avec les attributs ARIA corrects', () => {
      render(<ConfirmDialog {...defaultProps} />);
      
      const dialog = screen.getByRole('dialog');
      expect(dialog).toBeInTheDocument();
      expect(dialog).toHaveAttribute('aria-modal', 'true');
      expect(dialog).toHaveAttribute('aria-labelledby');
      expect(dialog).toHaveAttribute('aria-describedby');
    });

    it('affiche le titre et le message', () => {
      render(<ConfirmDialog {...defaultProps} />);
      
      expect(screen.getByText('Confirmation')).toBeInTheDocument();
      expect(screen.getByText('Êtes-vous sûr ?')).toBeInTheDocument();
    });

    it('affiche les labels de boutons personnalisés', () => {
      render(
        <ConfirmDialog
          {...defaultProps}
          confirmLabel="Oui"
          cancelLabel="Non"
        />
      );
      
      expect(screen.getByRole('button', { name: 'Oui' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Non' })).toBeInTheDocument();
    });

    it('supporte les messages ReactNode', () => {
      const messageNode = (
        <div>
          <p>Message complexe</p>
          <ul>
            <li>Point 1</li>
            <li>Point 2</li>
          </ul>
        </div>
      );
      
      render(<ConfirmDialog {...defaultProps} message={messageNode} />);
      
      expect(screen.getByText('Message complexe')).toBeInTheDocument();
      expect(screen.getByText('Point 1')).toBeInTheDocument();
      expect(screen.getByText('Point 2')).toBeInTheDocument();
    });
  });

  describe('Variants', () => {
    it('affiche le variant warning par défaut', () => {
      render(<ConfirmDialog {...defaultProps} />);
      
      const dialog = screen.getByRole('dialog');
      expect(dialog.querySelector('.border-yellow-600\\/50')).toBeInTheDocument();
    });

    it('affiche le variant danger', () => {
      render(<ConfirmDialog {...defaultProps} variant="danger" />);
      
      const dialog = screen.getByRole('dialog');
      expect(dialog.querySelector('.border-red-600\\/50')).toBeInTheDocument();
    });

    it('affiche le variant info', () => {
      render(<ConfirmDialog {...defaultProps} variant="info" />);
      
      const dialog = screen.getByRole('dialog');
      expect(dialog.querySelector('.border-blue-600\\/50')).toBeInTheDocument();
    });
  });

  describe('Callbacks', () => {
    it('appelle onConfirm quand le bouton de confirmation est cliqué', async () => {
      const user = userEvent.setup();
      const onConfirm = vi.fn();
      
      render(<ConfirmDialog {...defaultProps} onConfirm={onConfirm} />);
      
      const confirmButton = screen.getByRole('button', { name: 'Confirmer' });
      await user.click(confirmButton);
      
      expect(onConfirm).toHaveBeenCalledTimes(1);
    });

    it('appelle onCancel quand le bouton d\'annulation est cliqué', async () => {
      const user = userEvent.setup();
      const onCancel = vi.fn();
      
      render(<ConfirmDialog {...defaultProps} onCancel={onCancel} />);
      
      const cancelButton = screen.getByRole('button', { name: 'Annuler' });
      await user.click(cancelButton);
      
      expect(onCancel).toHaveBeenCalledTimes(1);
    });
  });

  describe('Navigation clavier', () => {
    it('ferme le dialogue avec Escape', async () => {
      const user = userEvent.setup();
      const onCancel = vi.fn();
      
      render(<ConfirmDialog {...defaultProps} onCancel={onCancel} />);
      
      await user.keyboard('{Escape}');
      
      expect(onCancel).toHaveBeenCalledTimes(1);
    });

    it('confirme avec Enter pour variant danger', async () => {
      const user = userEvent.setup();
      const onConfirm = vi.fn();
      
      render(
        <ConfirmDialog
          {...defaultProps}
          variant="danger"
          onConfirm={onConfirm}
        />
      );
      
      // Le focus doit être sur le bouton de confirmation pour danger
      const confirmButton = screen.getByRole('button', { name: 'Confirmer' });
      confirmButton.focus();
      
      await user.keyboard('{Enter}');
      
      expect(onConfirm).toHaveBeenCalledTimes(1);
    });

    it('annule avec Enter pour variant warning', async () => {
      const user = userEvent.setup();
      const onCancel = vi.fn();
      
      render(
        <ConfirmDialog
          {...defaultProps}
          variant="warning"
          onCancel={onCancel}
        />
      );
      
      // Le focus doit être sur le bouton d'annulation pour warning
      const cancelButton = screen.getByRole('button', { name: 'Annuler' });
      cancelButton.focus();
      
      await user.keyboard('{Enter}');
      
      expect(onCancel).toHaveBeenCalledTimes(1);
    });

    it('ne déclenche pas Enter avec Shift/Ctrl/Meta', async () => {
      const user = userEvent.setup();
      const onConfirm = vi.fn();
      const onCancel = vi.fn();
      
      render(<ConfirmDialog {...defaultProps} variant="warning" onConfirm={onConfirm} onCancel={onCancel} />);
      
      const cancelButton = screen.getByRole('button', { name: 'Annuler' });
      cancelButton.focus();
      
      // Vérifier que le handler vérifie les modificateurs
      // Le code dans ConfirmDialog vérifie !event.shiftKey && !event.ctrlKey && !event.metaKey
      // Donc avec modificateurs, l'événement ne doit pas être traité
      
      // Simuler Shift+Enter - ne doit pas déclencher car shiftKey est true
      const shiftEnterEvent = new KeyboardEvent('keydown', {
        key: 'Enter',
        shiftKey: true,
        bubbles: true,
        cancelable: true
      });
      cancelButton.dispatchEvent(shiftEnterEvent);
      
      // Attendre un peu pour s'assurer que le handler ne s'exécute pas
      await new Promise(resolve => setTimeout(resolve, 50));
      expect(onCancel).not.toHaveBeenCalled();
      
      // Simuler Ctrl+Enter - ne doit pas déclencher car ctrlKey est true
      const ctrlEnterEvent = new KeyboardEvent('keydown', {
        key: 'Enter',
        ctrlKey: true,
        bubbles: true,
        cancelable: true
      });
      cancelButton.dispatchEvent(ctrlEnterEvent);
      
      await new Promise(resolve => setTimeout(resolve, 50));
      expect(onCancel).not.toHaveBeenCalled();
    });
  });

  describe('Focus trap', () => {
    it('place le focus initial sur le bouton d\'annulation pour warning', () => {
      render(<ConfirmDialog {...defaultProps} variant="warning" />);
      
      const cancelButton = screen.getByRole('button', { name: 'Annuler' });
      expect(cancelButton).toHaveFocus();
    });

    it('place le focus initial sur le bouton de confirmation pour danger', () => {
      render(<ConfirmDialog {...defaultProps} variant="danger" />);
      
      const confirmButton = screen.getByRole('button', { name: 'Confirmer' });
      expect(confirmButton).toHaveFocus();
    });

    it('gère la navigation Tab dans le dialogue', async () => {
      const user = userEvent.setup();
      
      render(<ConfirmDialog {...defaultProps} />);
      
      const cancelButton = screen.getByRole('button', { name: 'Annuler' });
      const confirmButton = screen.getByRole('button', { name: 'Confirmer' });
      
      // Tab depuis cancel vers confirm
      cancelButton.focus();
      await user.tab();
      expect(confirmButton).toHaveFocus();
      
      // Tab depuis confirm revient à cancel (boucle)
      await user.tab();
      expect(cancelButton).toHaveFocus();
      
      // Shift+Tab depuis cancel va à confirm (boucle inverse)
      await user.tab({ shift: true });
      expect(confirmButton).toHaveFocus();
    });
  });
});

describe('useConfirmDialog', () => {
  it('retourne showConfirm et ConfirmDialogComponent', () => {
    const TestComponent = () => {
      const { showConfirm, ConfirmDialogComponent } = useConfirmDialog();
      
      return (
        <div>
          <button onClick={() => showConfirm({ title: 'Test', message: 'Message' })}>
            Ouvrir
          </button>
          <ConfirmDialogComponent />
        </div>
      );
    };
    
    render(<TestComponent />);
    expect(screen.getByText('Ouvrir')).toBeInTheDocument();
  });

  it('affiche le dialogue via showConfirm', async () => {
    const user = userEvent.setup();
    
    const TestComponent = () => {
      const { showConfirm, ConfirmDialogComponent } = useConfirmDialog();
      
      const handleOpen = async () => {
        const result = await showConfirm({
          title: 'Test',
          message: 'Message test'
        });
        console.log('Result:', result);
      };
      
      return (
        <div>
          <button onClick={handleOpen}>Ouvrir</button>
          <ConfirmDialogComponent />
        </div>
      );
    };
    
    render(<TestComponent />);
    
    const openButton = screen.getByText('Ouvrir');
    await user.click(openButton);
    
    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });
    
    expect(screen.getByText('Test')).toBeInTheDocument();
    expect(screen.getByText('Message test')).toBeInTheDocument();
  });

  it('résout la Promise avec true lors de la confirmation', async () => {
    const user = userEvent.setup();
    const onResult = vi.fn();
    
    const TestComponent = () => {
      const { showConfirm, ConfirmDialogComponent } = useConfirmDialog();
      
      const handleOpen = async () => {
        const result = await showConfirm({
          title: 'Test',
          message: 'Message'
        });
        onResult(result);
      };
      
      return (
        <div>
          <button onClick={handleOpen}>Ouvrir</button>
          <ConfirmDialogComponent />
        </div>
      );
    };
    
    render(<TestComponent />);
    
    await user.click(screen.getByText('Ouvrir'));
    
    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });
    
    const confirmButton = screen.getByRole('button', { name: 'Confirmer' });
    await user.click(confirmButton);
    
    await waitFor(() => {
      expect(onResult).toHaveBeenCalledWith(true);
    });
  });

  it('résout la Promise avec false lors de l\'annulation', async () => {
    const user = userEvent.setup();
    const onResult = vi.fn();
    
    const TestComponent = () => {
      const { showConfirm, ConfirmDialogComponent } = useConfirmDialog();
      
      const handleOpen = async () => {
        const result = await showConfirm({
          title: 'Test',
          message: 'Message'
        });
        onResult(result);
      };
      
      return (
        <div>
          <button onClick={handleOpen}>Ouvrir</button>
          <ConfirmDialogComponent />
        </div>
      );
    };
    
    render(<TestComponent />);
    
    await user.click(screen.getByText('Ouvrir'));
    
    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });
    
    const cancelButton = screen.getByRole('button', { name: 'Annuler' });
    await user.click(cancelButton);
    
    await waitFor(() => {
      expect(onResult).toHaveBeenCalledWith(false);
    });
  });

  it('ferme le dialogue après confirmation ou annulation', async () => {
    const user = userEvent.setup();
    
    const TestComponent = () => {
      const { showConfirm, ConfirmDialogComponent } = useConfirmDialog();
      
      const handleOpen = async () => {
        await showConfirm({
          title: 'Test',
          message: 'Message'
        });
      };
      
      return (
        <div>
          <button onClick={handleOpen}>Ouvrir</button>
          <ConfirmDialogComponent />
        </div>
      );
    };
    
    render(<TestComponent />);
    
    await user.click(screen.getByText('Ouvrir'));
    
    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });
    
    const confirmButton = screen.getByRole('button', { name: 'Confirmer' });
    await user.click(confirmButton);
    
    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });
});


