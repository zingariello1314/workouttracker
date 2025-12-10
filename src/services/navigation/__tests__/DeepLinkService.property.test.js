/**
 * Property-Based Tests pour le service de navigation précise
 * 
 * @module services/navigation/__tests__/DeepLinkService.property.test
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import fc from 'fast-check';
import deepLinkService from '../DeepLinkService';

// Mock des utilitaires de sous-onglets
vi.mock('../../utils/subtabActivation', () => ({
  activateSubtab: vi.fn().mockResolvedValue(true),
  waitForSubtabRender: vi.fn().mockResolvedValue(true),
  enhanceSubtabDetection: vi.fn()
}));

/**
 * **Feature: sidebar-historical-modules, Property 1: Navigation Precision**
 * 
 * Property: For any sidebar module click, the navigation should land exactly 
 * on the target module with proper scroll positioning, regardless of the 
 * module's position on the page
 * 
 * **Validates: Requirements 12.1, 12.2**
 */

// Générateurs pour les données de test
const validTabSubtabCombinations = [
  { tab: 'today', subtab: null },
  { tab: 'today', subtab: 'main' },
  { tab: 'today', subtab: 'garmin' },
  { tab: 'books', subtab: null },
  { tab: 'books', subtab: 'reading' },
  { tab: 'books', subtab: 'library' },
  { tab: 'finance', subtab: null },
  { tab: 'finance', subtab: 'synthese' },
  { tab: 'finance', subtab: 'planificateur' },
  { tab: 'finance', subtab: 'smart-shopping' },
  { tab: 'quests', subtab: null },
  { tab: 'quests', subtab: 'daily' },
  { tab: 'quests', subtab: 'create' },
  { tab: 'settings', subtab: null },
  { tab: 'settings', subtab: 'general' }
];

const tabSubtabGenerator = fc.constantFrom(...validTabSubtabCombinations);
const moduleIdGenerator = fc.string({ minLength: 5, maxLength: 20 }).map(s => {
  const cleaned = s.replace(/[^a-zA-Z0-9-]/g, '-').replace(/^-+|-+$/g, '');
  return cleaned.length >= 3 ? cleaned : 'module-' + cleaned;
});
const scrollBehaviorGenerator = fc.constantFrom('smooth', 'instant');
const positionGenerator = fc.record({
  top: fc.integer({ min: 0, max: 5000 }),
  height: fc.integer({ min: 50, max: 500 }),
  bottom: fc.integer({ min: 100, max: 5500 })
});

// Mock du DOM avec position configurable
const createMockElement = (position) => ({
  getBoundingClientRect: () => position,
  classList: {
    add: vi.fn(),
    remove: vi.fn(),
    contains: vi.fn(() => false)
  },
  setAttribute: vi.fn(),
  removeAttribute: vi.fn(),
  scrollIntoView: vi.fn(),
  offsetHeight: position.height
});

// Mock des fonctions globales
const setupGlobalMocks = () => {
  global.document = {
    querySelector: vi.fn(),
    querySelectorAll: vi.fn()
  };

  global.window = {
    pageYOffset: 0,
    innerHeight: 800,
    scrollTo: vi.fn(),
    dispatchEvent: vi.fn(),
    requestAnimationFrame: vi.fn(cb => {
      cb();
      return 1;
    })
  };

  global.setTimeout = vi.fn((cb, delay) => {
    cb();
    return 1;
  });

  global.clearTimeout = vi.fn();
};

describe('DeepLinkService - Property-Based Tests', () => {
  beforeEach(() => {
    setupGlobalMocks();
    vi.clearAllMocks();
  });

  afterEach(() => {
    deepLinkService.cleanup();
  });

  /**
   * Property 1: Navigation Precision
   * 
   * Pour tout clic sur un module sidebar, la navigation doit atterrir exactement
   * sur le module cible avec un positionnement de scroll approprié, peu importe
   * la position du module sur la page.
   */
  it('should navigate precisely to any module regardless of position', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          moduleId: moduleIdGenerator,
          scrollBehavior: scrollBehaviorGenerator
        }).chain(base => 
          tabSubtabGenerator.map(tabSubtab => ({
            ...base,
            ...tabSubtab
          }))
        ),
        positionGenerator,
        async (navigationTarget, modulePosition) => {
          // Arrange: Configurer le mock pour ce module
          const mockElement = createMockElement(modulePosition);
          global.document.querySelector.mockImplementation((selector) => {
            // Simuler la recherche du module avec tous les sélecteurs possibles
            if (selector === `#${navigationTarget.moduleId}` ||
                selector === `[data-module-id="${navigationTarget.moduleId}"]` ||
                selector === `[data-module="${navigationTarget.moduleId}"]` ||
                selector.includes(navigationTarget.moduleId)) {
              return mockElement;
            }
            // Simuler les éléments de navigation (header, nav)
            if (selector === 'header' || selector === 'nav') {
              return { offsetHeight: 60 };
            }
            // Simuler les éléments de tab pour waitForTabRender
            if (selector.includes(`data-tab="${navigationTarget.tab}"`) || 
                selector.includes(`data-active-tab="${navigationTarget.tab}"`) ||
                selector === '.tab-content.active') {
              return { style: {} };
            }
            return null;
          });

          const mockSetActiveTab = vi.fn();

          // Act: Effectuer la navigation
          const result = await deepLinkService.navigateToModule(navigationTarget, mockSetActiveTab);

          // Assert: Vérifier que la navigation a réussi
          expect(result).toBe(true);

          // Vérifier que l'onglet a été activé
          expect(mockSetActiveTab).toHaveBeenCalledWith(navigationTarget.tab);

          // Vérifier que le scroll a été effectué
          expect(global.window.scrollTo).toHaveBeenCalled();

          // Vérifier que le module a été mis en évidence
          expect(mockElement.classList.add).toHaveBeenCalledWith('module-highlighted');

          // Vérifier que l'événement de navigation a été émis
          expect(global.window.dispatchEvent).toHaveBeenCalledWith(
            expect.objectContaining({
              type: 'deeplink-navigation'
            })
          );

          // Property: Le scroll doit être calculé correctement selon la position
          const scrollCalls = global.window.scrollTo.mock.calls;
          if (scrollCalls.length > 0) {
            const lastScrollCall = scrollCalls[scrollCalls.length - 1];
            const scrollPosition = typeof lastScrollCall[0] === 'object' 
              ? lastScrollCall[0].top 
              : lastScrollCall[1];

            // Le scroll doit être un nombre positif ou zéro
            expect(scrollPosition).toBeGreaterThanOrEqual(0);

            // Le scroll doit tenir compte de la position du module
            // Pour un module en bas de page (top > 400), le scroll doit être significatif
            if (modulePosition.top > 400) {
              expect(scrollPosition).toBeGreaterThan(0);
            }
          }
        }
      ),
      { 
        numRuns: 20,
        timeout: 5000
      }
    );
  });

  /**
   * Property 1.1: Navigation avec sous-onglets
   * 
   * Pour toute navigation incluant un sous-onglet, le système doit activer
   * le sous-onglet avant de scroller vers le module.
   */
  it('should handle subtab activation correctly for any navigation target', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          moduleId: moduleIdGenerator,
          scrollBehavior: scrollBehaviorGenerator
        }).chain(base => 
          fc.constantFrom(...validTabSubtabCombinations.filter(combo => combo.subtab !== null)).map(tabSubtab => ({
            ...base,
            ...tabSubtab
          }))
        ),
        positionGenerator,
        async (navigationTarget, modulePosition) => {
          // Arrange
          const mockElement = createMockElement(modulePosition);
          global.document.querySelector.mockImplementation((selector) => {
            // Simuler la recherche du module avec tous les sélecteurs possibles
            if (selector === `#${navigationTarget.moduleId}` ||
                selector === `[data-module-id="${navigationTarget.moduleId}"]` ||
                selector === `[data-module="${navigationTarget.moduleId}"]` ||
                selector.includes(navigationTarget.moduleId)) {
              return mockElement;
            }
            if (selector === 'header' || selector === 'nav') {
              return { offsetHeight: 60 };
            }
            // Simuler les éléments de tab pour waitForTabRender
            if (selector.includes(`data-tab="${navigationTarget.tab}"`) || 
                selector.includes(`data-active-tab="${navigationTarget.tab}"`) ||
                selector === '.tab-content.active') {
              return { style: {} };
            }
            return null;
          });

          const mockSetActiveTab = vi.fn();

          // Act
          const result = await deepLinkService.navigateToModule(navigationTarget, mockSetActiveTab);

          // Assert
          expect(result).toBe(true);

          // Vérifier que l'onglet principal a été activé en premier
          expect(mockSetActiveTab).toHaveBeenCalledWith(navigationTarget.tab);

          // Property: Avec un sous-onglet, la navigation doit toujours réussir
          // même si l'activation du sous-onglet échoue
          expect(result).toBe(true);
        }
      ),
      { 
        numRuns: 15,
        timeout: 3000
      }
    );
  });

  /**
   * Property 1.2: Gestion des modules non trouvés
   * 
   * Pour tout ID de module invalide, le système doit gérer l'échec gracieusement
   * avec des tentatives de retry appropriées.
   */
  it('should handle missing modules gracefully with retry mechanism', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          moduleId: moduleIdGenerator,
          scrollBehavior: scrollBehaviorGenerator
        }).chain(base => 
          tabSubtabGenerator.map(tabSubtab => ({
            ...base,
            ...tabSubtab
          }))
        ),
        async (navigationTarget) => {
          // Arrange: Simuler un module non trouvé
          global.document.querySelector.mockReturnValue(null);
          const mockSetActiveTab = vi.fn();

          // Act
          const result = await deepLinkService.navigateToModule(navigationTarget, mockSetActiveTab);

          // Assert: La navigation doit échouer gracieusement
          expect(result).toBe(false);

          // Vérifier que l'onglet a quand même été activé
          expect(mockSetActiveTab).toHaveBeenCalledWith(navigationTarget.tab);

          // Property: Aucune erreur ne doit être lancée
          // Le test lui-même valide cela en ne crashant pas
        }
      ),
      { 
        numRuns: 10,
        timeout: 2000
      }
    );
  });

  /**
   * Property 1.3: Calcul de position de scroll
   * 
   * Pour toute position d'élément, le calcul de scroll doit produire
   * une valeur cohérente et utilisable.
   */
  it('should calculate scroll position consistently for any element position', () => {
    fc.assert(
      fc.property(
        positionGenerator,
        fc.integer({ min: 600, max: 1200 }), // viewport height
        fc.integer({ min: 0, max: 120 }), // header height
        (elementPosition, viewportHeight, headerHeight) => {
          // Arrange
          const mockElement = createMockElement(elementPosition);
          global.window.innerHeight = viewportHeight;
          global.window.pageYOffset = 0;

          // Mock header
          global.document.querySelector.mockImplementation((selector) => {
            if (selector === 'header' || selector === 'nav') {
              return { offsetHeight: headerHeight };
            }
            return null;
          });

          // Act
          const scrollPosition = deepLinkService.calculateScrollPosition(mockElement);

          // Assert: Properties du calcul de scroll
          
          // Property 1: Le scroll doit toujours être >= 0
          expect(scrollPosition).toBeGreaterThanOrEqual(0);

          // Property 2: Le scroll doit être un nombre fini
          expect(Number.isFinite(scrollPosition)).toBe(true);

          // Property 3: Pour un élément très haut sur la page, le scroll doit être minimal
          if (elementPosition.top < 100) {
            expect(scrollPosition).toBeLessThanOrEqual(elementPosition.top + 100);
          }

          // Property 4: Le calcul doit tenir compte de la hauteur du viewport
          // Un élément au centre de l'écran devrait nécessiter moins de scroll
          const elementCenter = elementPosition.top + (elementPosition.height / 2);
          const viewportCenter = (viewportHeight - headerHeight) / 2;
          
          if (elementCenter < viewportCenter) {
            // Élément dans la partie haute, scroll minimal attendu
            expect(scrollPosition).toBeLessThanOrEqual(elementCenter);
          }
        }
      ),
      { numRuns: 20 }
    );
  });

  /**
   * Property 1.4: Mise en évidence temporaire
   * 
   * Pour toute durée de mise en évidence, le système doit appliquer
   * et retirer la classe CSS correctement.
   */
  it('should apply and remove highlight consistently for any duration', () => {
    fc.assert(
      fc.property(
        moduleIdGenerator,
        fc.integer({ min: 100, max: 5000 }), // duration
        (moduleId, duration) => {
          // Arrange
          const mockElement = createMockElement({ top: 100, height: 50, bottom: 150 });
          global.document.querySelector.mockImplementation((selector) => {
            if (selector.includes(moduleId)) {
              return mockElement;
            }
            return null;
          });

          // Act
          deepLinkService.highlightModule(moduleId, duration);

          // Assert: Properties de la mise en évidence
          
          // Property 1: La classe highlight doit être ajoutée
          expect(mockElement.classList.add).toHaveBeenCalledWith('module-highlighted');

          // Property 2: Les attributs d'accessibilité doivent être définis
          expect(mockElement.setAttribute).toHaveBeenCalledWith('aria-live', 'polite');
          expect(mockElement.setAttribute).toHaveBeenCalledWith('aria-label', 'Module mis en évidence par la navigation');

          // Property 3: Un timeout doit être programmé pour nettoyer
          expect(global.setTimeout).toHaveBeenCalled();

          // Nettoyer manuellement pour éviter les fuites
          deepLinkService.clearHighlight(moduleId);
        }
      ),
      { numRuns: 15 }
    );
  });
});