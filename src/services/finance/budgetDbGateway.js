/**
 * Schéma IndexedDB Budget (BudgetDB).
 *
 * @module services/finance/budgetDbGateway
 */

export const BUDGET_DB_NAME = 'BudgetDB';
export const BUDGET_DB_VERSION = 2;

export const BUDGET_STORES = {
  BUDGET: 'budget',
  CATEGORIES: 'categories',
  DEPENSES: 'depenses',
  DEPENSES_PLANIFIEES: 'depensesPlanifiees',
  HISTORIQUE: 'historique',
  CHARGES_FIXES: 'chargesFixes',
};

/**
 * @param {IDBDatabase} db
 * @param {number} oldVersion
 * @param {number} newVersion
 * @param {{ debug?: (...args: unknown[]) => void, warn?: (...args: unknown[]) => void }} [log]
 */
export function applyBudgetSchemaUpgrade(db, oldVersion, newVersion, log = console) {
  const dbg = log.debug ?? (() => {});
  const wrn = log.warn ?? (() => {});

  dbg(`Upgrading BudgetDB from version ${oldVersion} to ${newVersion}`);

  const S = BUDGET_STORES;

  if (!db.objectStoreNames.contains(S.BUDGET)) {
    db.createObjectStore(S.BUDGET, { keyPath: 'id' });
    dbg(`Created store: ${S.BUDGET}`);
  }

  if (!db.objectStoreNames.contains(S.CATEGORIES)) {
    const catStore = db.createObjectStore(S.CATEGORIES, { keyPath: 'id' });
    catStore.createIndex('nom', 'nom', { unique: false });
    catStore.createIndex('ordre', 'ordre', { unique: false });
    dbg(`Created store: ${S.CATEGORIES}`);
  }

  if (!db.objectStoreNames.contains(S.DEPENSES)) {
    const depStore = db.createObjectStore(S.DEPENSES, { keyPath: 'id' });
    depStore.createIndex('date', 'date', { unique: false });
    depStore.createIndex('categorie', 'categorie', { unique: false });
    depStore.createIndex('statut', 'statut', { unique: false });
    dbg(`Created store: ${S.DEPENSES}`);
  }

  if (!db.objectStoreNames.contains(S.DEPENSES_PLANIFIEES)) {
    const planStore = db.createObjectStore(S.DEPENSES_PLANIFIEES, { keyPath: 'id' });
    planStore.createIndex('date', 'date', { unique: false });
    planStore.createIndex('statut', 'statut', { unique: false });
    planStore.createIndex('categorie', 'categorie', { unique: false });
    dbg(`Created store: ${S.DEPENSES_PLANIFIEES}`);
  }

  if (!db.objectStoreNames.contains(S.CHARGES_FIXES)) {
    const chargesStore = db.createObjectStore(S.CHARGES_FIXES, { keyPath: 'id' });
    chargesStore.createIndex('type', 'type', { unique: false });
    chargesStore.createIndex('frequence', 'frequence', { unique: false });
    dbg(`Created store: ${S.CHARGES_FIXES}`);
  }

  if (!db.objectStoreNames.contains(S.HISTORIQUE)) {
    const histStore = db.createObjectStore(S.HISTORIQUE, {
      keyPath: 'id',
      autoIncrement: true,
    });
    histStore.createIndex('timestamp', 'timestamp', { unique: false });
    histStore.createIndex('action', 'action', { unique: false });
    dbg(`Created store: ${S.HISTORIQUE}`);
  }

  const missingStores = Object.values(S).filter((name) => !db.objectStoreNames.contains(name));
  if (missingStores.length > 0) {
    wrn(`Missing stores after upgrade: ${missingStores.join(', ')}`);
  }
}
