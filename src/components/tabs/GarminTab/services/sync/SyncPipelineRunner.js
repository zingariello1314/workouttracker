/**
 * Pipeline Runner pour la synchronisation Garmin.
 * 
 * Encapsule toutes les étapes de `syncNow()` dans un pipeline modulaire et testable.
 * 
 * Architecture :
 * - Chaque étape est une classe indépendante et testable
 * - Le pipeline exécute les étapes dans l'ordre
 * - Chaque étape peut interrompre le pipeline (early return)
 * - Instrumentation complète à chaque étape
 * 
 * @module SyncPipelineRunner
 */

import logger from '../../../../../utils/logger';

const log = logger.module('SyncPipelineRunner');

/**
 * Classe de base pour une étape du pipeline.
 * 
 * Chaque étape doit étendre cette classe et implémenter `execute()`.
 */
export class SyncStep {
  /**
   * Nom de l'étape (pour logging/instrumentation)
   * @returns {string}
   */
  getName() {
    return this.constructor.name;
  }

  /**
   * Dépendances requises dans le contexte
   * @returns {string[]}
   */
  getRequiredDependencies() {
    return [];
  }

  /**
   * Exécute l'étape du pipeline
   * 
   * @param {Object} context - Contexte partagé (services, callbacks, données)
   * @param {Object} state - État actuel du pipeline
   * @returns {Promise<{state: Object, shouldContinue: boolean, earlyReturn?: any}>}
   */
  async execute(context, state) {
    throw new Error(`Step ${this.getName()} must implement execute()`);
  }

  /**
   * Valide que toutes les dépendances requises sont présentes
   * @param {Object} context - Contexte à valider
   * @throws {Error} Si une dépendance est manquante
   */
  validateDependencies(context) {
    const required = this.getRequiredDependencies();
    const missing = required.filter(dep => !(dep in context));
    
    if (missing.length > 0) {
      throw new Error(
        `Step ${this.getName()} requires missing dependencies: ${missing.join(', ')}`
      );
    }
  }
}

/**
 * Runner principal du pipeline de synchronisation.
 * 
 * Exécute les étapes dans l'ordre et gère les early returns.
 */
export class SyncPipelineRunner {
  /**
   * @param {Object} options
   * @param {boolean} options.enableInstrumentation - Activer l'instrumentation (défaut: true)
   * @param {Function} options.onStepStart - Callback appelé au début de chaque étape
   * @param {Function} options.onStepEnd - Callback appelé à la fin de chaque étape
   * @param {Function} options.onStepError - Callback appelé en cas d'erreur dans une étape
   */
  constructor(options = {}) {
    this.steps = [];
    this.enableInstrumentation = options.enableInstrumentation !== false;
    this.onStepStart = options.onStepStart || (() => {});
    this.onStepEnd = options.onStepEnd || (() => {});
    this.onStepError = options.onStepError || (() => {});
    this.instrumentation = {
      steps: [],
      totalDuration: 0,
      startTime: null
    };
  }

  /**
   * Ajoute une étape au pipeline
   * @param {SyncStep} step - Étape à ajouter
   * @returns {SyncPipelineRunner} Instance pour chaînage
   */
  addStep(step) {
    if (!(step instanceof SyncStep)) {
      throw new Error('Step must be an instance of SyncStep');
    }
    this.steps.push(step);
    return this;
  }

  /**
   * Ajoute plusieurs étapes au pipeline
   * @param {SyncStep[]} steps - Étapes à ajouter
   * @returns {SyncPipelineRunner} Instance pour chaînage
   */
  addSteps(steps) {
    steps.forEach(step => this.addStep(step));
    return this;
  }

  /**
   * Exécute le pipeline avec le contexte et l'état initial
   * 
   * @param {Object} context - Contexte partagé (services, callbacks, données)
   * @param {Object} initialState - État initial du pipeline
   * @returns {Promise<{state: Object, result?: any, error?: Error, instrumentation: Object}>}
   */
  async execute(context, initialState = {}) {
    if (this.steps.length === 0) {
      throw new Error('Pipeline has no steps');
    }

    // Valider les dépendances de toutes les étapes
    this.steps.forEach(step => {
      try {
        step.validateDependencies(context);
      } catch (error) {
        log.error(`[execute] Validation failed for step ${step.getName()}:`, error);
        throw error;
      }
    });

    let state = { ...initialState };
    this.instrumentation.startTime = Date.now();
    this.instrumentation.steps = [];

    log.debug('[execute] Pipeline started', {
      stepCount: this.steps.length,
      stepNames: this.steps.map(s => s.getName())
    });

    try {
      for (let i = 0; i < this.steps.length; i++) {
        const step = this.steps[i];
        const stepName = step.getName();
        const stepStartTime = Date.now();

        // Instrumentation : début de l'étape
        if (this.enableInstrumentation) {
          this.onStepStart(stepName, i, state);
        }

        let stepResult;
        try {
          // Exécuter l'étape
          stepResult = await step.execute(context, state);

          // Valider le résultat
          if (!stepResult || typeof stepResult !== 'object') {
            throw new Error(`Step ${stepName} must return an object with {state, shouldContinue}`);
          }

          if (!('state' in stepResult) || !('shouldContinue' in stepResult)) {
            throw new Error(
              `Step ${stepName} must return {state, shouldContinue, earlyReturn?}`
            );
          }

          // Mettre à jour l'état
          state = { ...state, ...stepResult.state };

          const stepDuration = Date.now() - stepStartTime;

          // Instrumentation : fin de l'étape
          if (this.enableInstrumentation) {
            const stepInstrumentation = {
              name: stepName,
              index: i,
              duration: stepDuration,
              success: true,
              shouldContinue: stepResult.shouldContinue,
              hasEarlyReturn: !!stepResult.earlyReturn
            };
            this.instrumentation.steps.push(stepInstrumentation);
            this.onStepEnd(stepName, i, stepDuration, true, stepResult);
          }

          log.debug(`[execute] Step ${stepName} completed`, {
            duration: stepDuration,
            shouldContinue: stepResult.shouldContinue,
            hasEarlyReturn: !!stepResult.earlyReturn
          });

          // Early return si l'étape le demande
          if (!stepResult.shouldContinue) {
            log.debug(`[execute] Pipeline stopped by step ${stepName}`, {
              earlyReturn: stepResult.earlyReturn
            });
            this.instrumentation.totalDuration = Date.now() - this.instrumentation.startTime;
            return {
              state,
              result: stepResult.earlyReturn,
              instrumentation: this.instrumentation
            };
          }
        } catch (error) {
          const stepDuration = Date.now() - stepStartTime;

          // Instrumentation : erreur dans l'étape
          if (this.enableInstrumentation) {
            const stepInstrumentation = {
              name: stepName,
              index: i,
              duration: stepDuration,
              success: false,
              error: error.message
            };
            this.instrumentation.steps.push(stepInstrumentation);
            this.onStepError(stepName, i, error, stepDuration);
          }

          log.error(`[execute] Step ${stepName} failed:`, error);
          throw error;
        }
      }

      // Pipeline terminé avec succès
      this.instrumentation.totalDuration = Date.now() - this.instrumentation.startTime;
      log.debug('[execute] Pipeline completed successfully', {
        totalDuration: this.instrumentation.totalDuration,
        stepCount: this.steps.length
      });

      return {
        state,
        instrumentation: this.instrumentation
      };
    } catch (error) {
      this.instrumentation.totalDuration = Date.now() - this.instrumentation.startTime;
      log.error('[execute] Pipeline failed:', error);
      
      return {
        state,
        error,
        instrumentation: this.instrumentation
      };
    }
  }

  /**
   * Réinitialise le pipeline (supprime toutes les étapes)
   * @returns {SyncPipelineRunner} Instance pour chaînage
   */
  reset() {
    this.steps = [];
    this.instrumentation = {
      steps: [],
      totalDuration: 0,
      startTime: null
    };
    return this;
  }

  /**
   * Retourne le nombre d'étapes dans le pipeline
   * @returns {number}
   */
  getStepCount() {
    return this.steps.length;
  }

  /**
   * Retourne les noms des étapes dans l'ordre
   * @returns {string[]}
   */
  getStepNames() {
    return this.steps.map(step => step.getName());
  }
}

