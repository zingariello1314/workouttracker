import moduleAlternationService, { LEGACY_MODULES, HISTORICAL_MODULES } from '../moduleAlternationService';

describe('ModuleAlternationService', () => {
  beforeEach(() => {
    // Réinitialiser complètement le service avant chaque test
    moduleAlternationService.legacyModules = LEGACY_MODULES.map(m => ({ ...m }));
    moduleAlternationService.historicalModules = HISTORICAL_MODULES.map(m => ({ ...m }));
    moduleAlternationService.alternationPattern = moduleAlternationService.generateAlternationPattern();
  });

  describe('generateAlternationPattern', () => {
    it('should create alternation pattern with correct order', () => {
      const pattern = moduleAlternationService.getAlternatedModules();
      
      // Vérifier que les modules sont triés par position
      for (let i = 0; i < pattern.length - 1; i++) {
        expect(pattern[i].position).toBeLessThan(pattern[i + 1].position);
      }
    });

    it('should include historical modules (legacy optionnel dans la sidebar)', () => {
      const pattern = moduleAlternationService.getAlternatedModules();
      const legacyCount = pattern.filter(m => m.type === 'legacy').length;
      const historicalCount = pattern.filter(m => m.type === 'historical').length;
      
      expect(legacyCount).toBeGreaterThanOrEqual(0);
      expect(historicalCount).toBeGreaterThan(0);
    });

    it('should maintain alternation sequence', () => {
      const pattern = moduleAlternationService.getAlternatedModules();
      
      // Position 0 : slot historique optionnel en tête (Course Garmin)
      // Positions 1–3 : bloc sport + calendrier + quêtes (historique)
      // À partir de 4 : pairs = legacy, impairs = historique
      pattern.forEach((module) => {
        if (module.position === 0) {
          expect(module.type).toBe('historical');
          return;
        }
        if (module.position >= 1 && module.position <= 3) {
          expect(module.type).toBe('historical');
          return;
        }
        if (module.position % 2 === 1) {
          expect(module.type).toBe('historical');
        } else {
          expect(module.type).toBe('legacy');
        }
      });
    });
  });

  describe('getModuleById', () => {
    it('should return correct module by id', () => {
      const module = moduleAlternationService.getModuleById('sidebar-sport-planning');
      expect(module).toBeDefined();
      expect(module.id).toBe('sidebar-sport-planning');
      expect(module.type).toBe('historical');
    });

    it('should return undefined for non-existent module', () => {
      const module = moduleAlternationService.getModuleById('non-existent');
      expect(module).toBeUndefined();
    });
  });

  describe('getModulesByType', () => {
    it('should return only legacy modules', () => {
      const legacyModules = moduleAlternationService.getModulesByType('legacy');
      expect(legacyModules.every(m => m.type === 'legacy')).toBe(true);
      expect(legacyModules.length).toBeGreaterThanOrEqual(0);
    });

    it('should return only historical modules', () => {
      const historicalModules = moduleAlternationService.getModulesByType('historical');
      expect(historicalModules.every(m => m.type === 'historical')).toBe(true);
      expect(historicalModules.length).toBeGreaterThan(0);
    });
  });

  describe('insertNewModule', () => {
    it('should insert new module at correct position', () => {
      const newModule = {
        id: 'test-module',
        component: 'TestModule',
        position: 23,
        type: 'historical'
      };

      const inserted = moduleAlternationService.insertNewModule(newModule);
      expect(inserted.id).toBe('test-module');
      
      const pattern = moduleAlternationService.getAlternatedModules();
      const insertedInPattern = pattern.find(m => m.id === 'test-module');
      expect(insertedInPattern).toBeDefined();
      expect(insertedInPattern.position).toBe(23);
    });

    it('should shift modules when inserting at existing position', () => {
      const originalPattern = moduleAlternationService.getAlternatedModules();
      const existingPosition = originalPattern[0].position;
      
      const newModule = {
        id: 'test-module',
        component: 'TestModule',
        position: existingPosition,
        type: 'historical'
      };

      moduleAlternationService.insertNewModule(newModule);
      const newPattern = moduleAlternationService.getAlternatedModules();
      
      // Vérifier que les modules ont été décalés
      expect(newPattern.length).toBe(originalPattern.length + 1);
    });

    it('should throw error for invalid module config', () => {
      expect(() => {
        moduleAlternationService.insertNewModule({});
      }).toThrow('Configuration de module invalide');
    });
  });

  describe('removeModule', () => {
    it('should remove existing module', () => {
      const success = moduleAlternationService.removeModule('sidebar-sport-planning');
      expect(success).toBe(true);
      
      const module = moduleAlternationService.getModuleById('sidebar-sport-planning');
      expect(module).toBeUndefined();
    });

    it('should return false for non-existent module', () => {
      const success = moduleAlternationService.removeModule('non-existent');
      expect(success).toBe(false);
    });
  });

  describe('toggleModuleVisibility', () => {
    it('should toggle module visibility', () => {
      const moduleId = 'sidebar-sport-planning';
      const originalModule = moduleAlternationService.getModuleById(moduleId);
      const originalVisibility = originalModule.isVisible;
      
      const success = moduleAlternationService.toggleModuleVisibility(moduleId);
      expect(success).toBe(true);
      
      const updatedModule = moduleAlternationService.getModuleById(moduleId);
      expect(updatedModule.isVisible).toBe(!originalVisibility);
    });

    it('should return false for non-existent module', () => {
      const success = moduleAlternationService.toggleModuleVisibility('non-existent');
      expect(success).toBe(false);
    });
  });

  describe('validateAlternationPattern', () => {
    it('should validate correct pattern', () => {
      const pattern = moduleAlternationService.getAlternatedModules();
      expect(pattern.length).toBeGreaterThan(0);
      
      const validation = moduleAlternationService.validateAlternationPattern();
      
      // Si la validation échoue, afficher les erreurs pour debug
      if (!validation.isValid) {
        console.log('Validation errors:', validation.errors);
        console.log('Pattern:', pattern.map(m => ({ id: m.id, position: m.position, type: m.type })));
      }
      
      expect(validation.isValid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });

    it('should detect alternation violations', () => {
      // Créer un module avec un type incorrect pour sa position
      const invalidModule = {
        id: 'invalid-module',
        component: 'InvalidModule',
        position: 22, // Position paire mais type historical
        type: 'historical'
      };
      
      moduleAlternationService.insertNewModule(invalidModule);
      
      const validation = moduleAlternationService.validateAlternationPattern();
      expect(validation.isValid).toBe(false);
      expect(validation.errors.some(error => error.includes('devrait être de type legacy'))).toBe(true);
    });
  });

  describe('getAlternationStats', () => {
    it('should return correct statistics', () => {
      const stats = moduleAlternationService.getAlternationStats();
      
      expect(stats.totalModules).toBeGreaterThan(0);
      expect(stats.legacyModules).toBeGreaterThanOrEqual(0);
      expect(stats.historicalModules).toBeGreaterThan(0);
      expect(stats.totalModules).toBe(stats.legacyModules + stats.historicalModules);
      expect(stats.pattern).toBeInstanceOf(Array);
      expect(stats.alternationRatio === null || stats.alternationRatio > 0).toBe(true);
    });

    it('should include pattern information', () => {
      const stats = moduleAlternationService.getAlternationStats();
      
      stats.pattern.forEach(item => {
        expect(item).toHaveProperty('position');
        expect(item).toHaveProperty('type');
        expect(item).toHaveProperty('id');
        expect(['legacy', 'historical']).toContain(item.type);
      });
    });
  });
});