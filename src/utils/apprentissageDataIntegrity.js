/**
 * Vérification de cohérence des données Apprentissage
 * Garantit l'intégrité des données avant sauvegarde
 */

/**
 * Vérifier la cohérence d'une progression de matière
 */
export const validateSubjectProgression = (progression, subjectName) => {
  const errors = [];

  // XP doit être ≥ 0
  if (progression.xp < 0) {
    errors.push(`XP négatif pour ${subjectName}`);
  }

  // Niveau doit être ≥ 1
  if (progression.level < 1) {
    errors.push(`Niveau invalide (< 1) pour ${subjectName}`);
  }

  // Sessions doit être ≥ 0
  if (progression.sessions < 0) {
    errors.push(`Nombre de sessions négatif pour ${subjectName}`);
  }

  // Temps total doit être ≥ 0
  if (progression.totalTime < 0) {
    errors.push(`Temps total négatif pour ${subjectName}`);
  }

  // Vérifier cohérence XP vs niveau
  const expectedMinXP = Math.pow(progression.level - 1, 1.8) * 150;
  if (progression.xp < expectedMinXP && progression.level > 1) {
    errors.push(`XP insuffisant pour le niveau ${progression.level} de ${subjectName}`);
  }

  return {
    valid: errors.length === 0,
    errors,
  };
};

/**
 * Vérifier la cohérence d'une session
 */
export const validateSessionIntegrity = (session, subjects) => {
  const errors = [];

  // Vérifier que la matière existe
  if (!subjects.find((s) => s.name === session.subject)) {
    errors.push(`Matière "${session.subject}" n'existe pas`);
  }

  // Vérifier dates cohérentes
  if (session.endTime && session.startTime > session.endTime) {
    errors.push('Date de fin antérieure à la date de début');
  }

  // Vérifier durée cohérente
  if (session.actualWorkTime < 0) {
    errors.push('Temps de travail négatif');
  }

  // Vérifier durée planifiée > 0
  if (session.plannedDuration <= 0) {
    errors.push('Durée planifiée doit être > 0');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
};

/**
 * Vérifier la cohérence de la progression globale
 */
export const validateGlobalProgressionIntegrity = (progression, subjects) => {
  const errors = [];

  // Vérifier niveau global ≥ 1
  if (progression.globalLevel < 1) {
    errors.push('Niveau global doit être ≥ 1');
  }

  // Vérifier XP global ≥ 0
  if (progression.globalXP < 0) {
    errors.push('XP global doit être ≥ 0');
  }

  // Vérifier temps total ≥ 0
  if (progression.totalStudyTime < 0) {
    errors.push('Temps total d\'étude doit être ≥ 0');
  }

  // Vérifier streak ≥ 0
  if (progression.dailyStreak < 0) {
    errors.push('Streak doit être ≥ 0');
  }

  // Vérifier que toutes les matières référencées existent
  if (progression.subjects) {
    for (const [subjectName, subjectProg] of Object.entries(progression.subjects)) {
      if (!subjects.find((s) => s.name === subjectName)) {
        errors.push(`Matière "${subjectName}" référencée dans progression n'existe pas`);
      }

      // Valider la progression de cette matière
      const subjectValidation = validateSubjectProgression(subjectProg, subjectName);
      if (!subjectValidation.valid) {
        errors.push(...subjectValidation.errors);
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
};

/**
 * Vérifier la cohérence complète des données Apprentissage
 */
export const validateApprentissageDataIntegrity = (data) => {
  const { subjects = [], progression = {}, sessionsHistory = [] } = data;
  const errors = [];

  // Vérifier progression globale
  if (progression) {
    const globalValidation = validateGlobalProgressionIntegrity(progression, subjects);
    if (!globalValidation.valid) {
      errors.push(...globalValidation.errors);
    }
  }

  // Vérifier toutes les sessions
  sessionsHistory.forEach((session, index) => {
    const sessionValidation = validateSessionIntegrity(session, subjects);
    if (!sessionValidation.valid) {
      errors.push(`Session ${index}: ${sessionValidation.errors.join(', ')}`);
    }
  });

  // Vérifier que toutes les matières ont une progression
  subjects.forEach((subject) => {
    if (progression.subjects && !progression.subjects[subject.name]) {
      // Pas d'erreur, juste un warning (progression peut être initialisée plus tard)
    }
  });

  return {
    valid: errors.length === 0,
    errors,
    warnings: [],
  };
};

/**
 * Corriger automatiquement les incohérences mineures
 */
export const autoFixDataIntegrity = (data) => {
  const fixed = { ...data };

  // Corriger XP négatifs
  if (fixed.progression?.globalXP < 0) {
    fixed.progression.globalXP = 0;
  }

  // Corriger niveaux < 1
  if (fixed.progression?.globalLevel < 1) {
    fixed.progression.globalLevel = 1;
  }

  // Corriger streak négatif
  if (fixed.progression?.dailyStreak < 0) {
    fixed.progression.dailyStreak = 0;
  }

  // Corriger progressions de matières
  if (fixed.progression?.subjects) {
    for (const [subjectName, subjectProg] of Object.entries(fixed.progression.subjects)) {
      if (subjectProg.xp < 0) subjectProg.xp = 0;
      if (subjectProg.level < 1) subjectProg.level = 1;
      if (subjectProg.sessions < 0) subjectProg.sessions = 0;
      if (subjectProg.totalTime < 0) subjectProg.totalTime = 0;
    }
  }

  return fixed;
};

export default {
  validateSubjectProgression,
  validateSessionIntegrity,
  validateGlobalProgressionIntegrity,
  validateApprentissageDataIntegrity,
  autoFixDataIntegrity,
};

