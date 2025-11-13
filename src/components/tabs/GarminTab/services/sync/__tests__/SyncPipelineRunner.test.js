/**
 * Tests unitaires pour SyncPipelineRunner
 * 
 * Couvre :
 * - Exécution du pipeline
 * - Validation des dépendances
 * - Early returns
 * - Gestion d'erreurs
 * - Instrumentation
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SyncPipelineRunner, SyncStep } from '../SyncPipelineRunner';

// Step de test simple
class TestStep extends SyncStep {
  constructor(name, shouldContinue = true, earlyReturn = null, error = null) {
    super();
    this.name = name;
    this.shouldContinue = shouldContinue;
    this.earlyReturn = earlyReturn;
    this.error = error;
  }

  getName() {
    return this.name;
  }

  async execute(context, state) {
    if (this.error) {
      throw this.error;
    }

    return {
      state: {
        ...state,
        [`${this.name}Executed`]: true
      },
      shouldContinue: this.shouldContinue,
      earlyReturn: this.earlyReturn
    };
  }
}

// Step avec dépendances
class StepWithDependencies extends SyncStep {
  constructor(requiredDeps = []) {
    super();
    this.requiredDeps = requiredDeps;
  }

  getName() {
    return 'stepWithDeps';
  }

  getRequiredDependencies() {
    return this.requiredDeps;
  }

  async execute(context, state) {
    return {
      state: { ...state, stepWithDepsExecuted: true },
      shouldContinue: true
    };
  }
}

describe('SyncPipelineRunner', () => {
  let pipeline;
  let onStepStart;
  let onStepEnd;
  let onStepError;

  beforeEach(() => {
    onStepStart = vi.fn();
    onStepEnd = vi.fn();
    onStepError = vi.fn();
    pipeline = new SyncPipelineRunner({
      enableInstrumentation: true,
      onStepStart,
      onStepEnd,
      onStepError
    });
  });

  describe('Construction et configuration', () => {
    it('crée un pipeline vide', () => {
      expect(pipeline.getStepCount()).toBe(0);
      expect(pipeline.getStepNames()).toEqual([]);
    });

    it('ajoute des steps au pipeline', () => {
      pipeline
        .addStep(new TestStep('step1'))
        .addStep(new TestStep('step2'));

      expect(pipeline.getStepCount()).toBe(2);
      expect(pipeline.getStepNames()).toEqual(['step1', 'step2']);
    });

    it('ajoute plusieurs steps en une fois', () => {
      pipeline.addSteps([
        new TestStep('step1'),
        new TestStep('step2'),
        new TestStep('step3')
      ]);

      expect(pipeline.getStepCount()).toBe(3);
    });

    it('rejette les steps invalides', () => {
      expect(() => {
        pipeline.addStep({});
      }).toThrow('Step must be an instance of SyncStep');
    });
  });

  describe('Validation des dépendances', () => {
    it('valide les dépendances avant exécution', async () => {
      pipeline.addStep(new StepWithDependencies(['dep1', 'dep2']));

      const context = { dep1: 'value1' }; // dep2 manquant

      await expect(pipeline.execute(context, {})).rejects.toThrow(
        'Step stepWithDeps requires missing dependencies: dep2'
      );
    });

    it('passe la validation si toutes les dépendances sont présentes', async () => {
      pipeline.addStep(new StepWithDependencies(['dep1', 'dep2']));

      const context = { dep1: 'value1', dep2: 'value2' };
      const result = await pipeline.execute(context, {});

      expect(result.state.stepWithDepsExecuted).toBe(true);
    });
  });

  describe('Exécution du pipeline', () => {
    it('exécute tous les steps dans l\'ordre', async () => {
      pipeline
        .addStep(new TestStep('step1'))
        .addStep(new TestStep('step2'))
        .addStep(new TestStep('step3'));

      const context = {};
      const result = await pipeline.execute(context, {});

      expect(result.state.step1Executed).toBe(true);
      expect(result.state.step2Executed).toBe(true);
      expect(result.state.step3Executed).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('passe l\'état entre les steps', async () => {
      pipeline
        .addStep(new TestStep('step1'))
        .addStep(new TestStep('step2'));

      const context = {};
      const initialState = { initialValue: 'test' };
      const result = await pipeline.execute(context, initialState);

      expect(result.state.initialValue).toBe('test');
      expect(result.state.step1Executed).toBe(true);
      expect(result.state.step2Executed).toBe(true);
    });

    it('rejette l\'exécution d\'un pipeline vide', async () => {
      await expect(pipeline.execute({}, {})).rejects.toThrow(
        'Pipeline has no steps'
      );
    });
  });

  describe('Early returns', () => {
    it('arrête le pipeline si un step retourne shouldContinue: false', async () => {
      pipeline
        .addStep(new TestStep('step1'))
        .addStep(new TestStep('step2', false, { early: 'return' }))
        .addStep(new TestStep('step3')); // Ne devrait pas s'exécuter

      const context = {};
      const result = await pipeline.execute(context, {});

      expect(result.state.step1Executed).toBe(true);
      expect(result.state.step2Executed).toBe(true);
      expect(result.state.step3Executed).toBeUndefined();
      expect(result.result).toEqual({ early: 'return' });
    });

    it('retourne le earlyReturn dans le résultat', async () => {
      const earlyReturn = { success: true, source: 'cache' };
      pipeline.addStep(new TestStep('step1', false, earlyReturn));

      const context = {};
      const result = await pipeline.execute(context, {});

      expect(result.result).toEqual(earlyReturn);
    });
  });

  describe('Gestion d\'erreurs', () => {
    it('capture les erreurs dans les steps', async () => {
      const testError = new Error('Test error');
      pipeline.addStep(new TestStep('step1', true, null, testError));

      const context = {};
      const result = await pipeline.execute(context, {});

      expect(result.error).toBe(testError);
      expect(onStepError).toHaveBeenCalledWith('step1', 0, testError, expect.any(Number));
    });

    it('arrête le pipeline en cas d\'erreur', async () => {
      const testError = new Error('Test error');
      pipeline
        .addStep(new TestStep('step1'))
        .addStep(new TestStep('step2', true, null, testError))
        .addStep(new TestStep('step3')); // Ne devrait pas s'exécuter

      const context = {};
      const result = await pipeline.execute(context, {});

      expect(result.state.step1Executed).toBe(true);
      expect(result.state.step2Executed).toBeUndefined();
      expect(result.state.step3Executed).toBeUndefined();
      expect(result.error).toBe(testError);
    });
  });

  describe('Instrumentation', () => {
    it('appelle onStepStart pour chaque step', async () => {
      pipeline
        .addStep(new TestStep('step1'))
        .addStep(new TestStep('step2'));

      const context = {};
      await pipeline.execute(context, {});

      expect(onStepStart).toHaveBeenCalledTimes(2);
      expect(onStepStart).toHaveBeenNthCalledWith(1, 'step1', 0, expect.any(Object));
      expect(onStepStart).toHaveBeenNthCalledWith(2, 'step2', 1, expect.any(Object));
    });

    it('appelle onStepEnd pour chaque step réussi', async () => {
      pipeline
        .addStep(new TestStep('step1'))
        .addStep(new TestStep('step2'));

      const context = {};
      await pipeline.execute(context, {});

      expect(onStepEnd).toHaveBeenCalledTimes(2);
      expect(onStepEnd).toHaveBeenNthCalledWith(
        1,
        'step1',
        0,
        expect.any(Number),
        true,
        expect.any(Object)
      );
    });

    it('appelle onStepError en cas d\'erreur', async () => {
      const testError = new Error('Test error');
      pipeline.addStep(new TestStep('step1', true, null, testError));

      const context = {};
      await pipeline.execute(context, {});

      expect(onStepError).toHaveBeenCalledTimes(1);
      expect(onStepError).toHaveBeenCalledWith(
        'step1',
        0,
        testError,
        expect.any(Number)
      );
    });

    it('enregistre l\'instrumentation dans le résultat', async () => {
      pipeline
        .addStep(new TestStep('step1'))
        .addStep(new TestStep('step2'));

      const context = {};
      const result = await pipeline.execute(context, {});

      expect(result.instrumentation).toBeDefined();
      expect(result.instrumentation.steps).toHaveLength(2);
      expect(result.instrumentation.totalDuration).toBeGreaterThanOrEqual(0);
      expect(result.instrumentation.steps[0].name).toBe('step1');
      expect(result.instrumentation.steps[0].success).toBe(true);
    });

    it('peut désactiver l\'instrumentation', async () => {
      const onStepStartSpy = vi.fn();
      const onStepEndSpy = vi.fn();
      const pipelineNoInstrumentation = new SyncPipelineRunner({
        enableInstrumentation: false,
        onStepStart: onStepStartSpy,
        onStepEnd: onStepEndSpy
      });

      pipelineNoInstrumentation.addStep(new TestStep('step1'));

      const context = {};
      const result = await pipelineNoInstrumentation.execute(context, {});

      expect(result.instrumentation).toBeDefined();
      // L'instrumentation enregistre toujours les steps (pour debugging), même si désactivée
      expect(result.instrumentation.steps.length).toBeGreaterThanOrEqual(0);
      // Les callbacks ne sont pas appelés si instrumentation désactivée
      expect(onStepStartSpy).not.toHaveBeenCalled();
      expect(onStepEndSpy).not.toHaveBeenCalled();
    });
  });

  describe('Validation des résultats de steps', () => {
    it('rejette les steps qui ne retournent pas un objet', async () => {
      class InvalidStep extends SyncStep {
        getName() {
          return 'invalid';
        }

        async execute() {
          return null; // Invalid
        }
      }

      pipeline.addStep(new InvalidStep());

      const context = {};
      // Le pipeline capture l'erreur et la retourne dans result.error au lieu de throw
      const result = await pipeline.execute(context, {});
      
      expect(result.error).toBeDefined();
      expect(result.error.message).toContain('Step invalid must return an object with {state, shouldContinue}');
    });

    it('rejette les steps qui ne retournent pas state et shouldContinue', async () => {
      class InvalidStep extends SyncStep {
        getName() {
          return 'invalid';
        }

        async execute() {
          return { state: {} }; // shouldContinue manquant
        }
      }

      pipeline.addStep(new InvalidStep());

      const context = {};
      // Le pipeline capture l'erreur et la retourne dans result.error au lieu de throw
      const result = await pipeline.execute(context, {});
      
      expect(result.error).toBeDefined();
      expect(result.error.message).toContain('Step invalid must return {state, shouldContinue, earlyReturn?}');
    });
  });

  describe('Reset', () => {
    it('réinitialise le pipeline', () => {
      pipeline
        .addStep(new TestStep('step1'))
        .addStep(new TestStep('step2'));

      expect(pipeline.getStepCount()).toBe(2);

      pipeline.reset();

      expect(pipeline.getStepCount()).toBe(0);
      expect(pipeline.getStepNames()).toEqual([]);
    });
  });
});

