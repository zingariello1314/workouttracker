/**
 * Schéma IndexedDB Planificateur (PlanificateurDB).
 *
 * @module services/finance/planificateurDbGateway
 */

export const PLANIFICATEUR_DB_NAME = 'PlanificateurDB';
export const PLANIFICATEUR_DB_VERSION = 1;

export const PLANIFICATEUR_STORES = {
  SALAIRE: 'salaire',
  REPARTITION: 'repartition',
  ACHATS_LOISIRS: 'achatsLoisirs',
  OBJECTIFS: 'objectifs',
  CHARGES_FIXES: 'chargesFixes',
  HISTORIQUE: 'historique',
};

/**
 * @param {IDBDatabase} db
 * @param {number} oldVersion
 * @param {number} newVersion
 * @param {{ debug?: (...args: unknown[]) => void, warn?: (...args: unknown[]) => void }} [log]
 */
export function applyPlanificateurSchemaUpgrade(db, oldVersion, newVersion, log = console) {
  const dbg = log.debug ?? (() => {});
  const wrn = log.warn ?? (() => {});

  dbg(`Upgrading PlanificateurDB from version ${oldVersion} to ${newVersion}`);

  const S = PLANIFICATEUR_STORES;

  if (!db.objectStoreNames.contains(S.SALAIRE)) {
    const salaireStore = db.createObjectStore(S.SALAIRE, { keyPath: 'id' });
    salaireStore.createIndex('updatedAt', 'updatedAt', { unique: false });
    dbg(`Created store: ${S.SALAIRE}`);
  }

  if (!db.objectStoreNames.contains(S.REPARTITION)) {
    const repartitionStore = db.createObjectStore(S.REPARTITION, { keyPath: 'id' });
    repartitionStore.createIndex('updatedAt', 'updatedAt', { unique: false });
    dbg(`Created store: ${S.REPARTITION}`);
  }

  if (!db.objectStoreNames.contains(S.ACHATS_LOISIRS)) {
    const achatsStore = db.createObjectStore(S.ACHATS_LOISIRS, {
      keyPath: 'id',
      autoIncrement: true,
    });
    achatsStore.createIndex('moisCible', 'moisCible', { unique: false });
    achatsStore.createIndex('statut', 'statut', { unique: false });
    achatsStore.createIndex('priorite', 'priorite', { unique: false });
    achatsStore.createIndex('date', 'date', { unique: false });
    dbg(`Created store: ${S.ACHATS_LOISIRS}`);
  }

  if (!db.objectStoreNames.contains(S.OBJECTIFS)) {
    const objectifsStore = db.createObjectStore(S.OBJECTIFS, {
      keyPath: 'id',
      autoIncrement: true,
    });
    objectifsStore.createIndex('moisCible', 'moisCible', { unique: false });
    objectifsStore.createIndex('date', 'date', { unique: false });
    dbg(`Created store: ${S.OBJECTIFS}`);
  }

  if (!db.objectStoreNames.contains(S.CHARGES_FIXES)) {
    const chargesStore = db.createObjectStore(S.CHARGES_FIXES, { keyPath: 'id' });
    chargesStore.createIndex('type', 'type', { unique: false });
    dbg(`Created store: ${S.CHARGES_FIXES}`);
  }

  if (!db.objectStoreNames.contains(S.HISTORIQUE)) {
    const historiqueStore = db.createObjectStore(S.HISTORIQUE, {
      keyPath: 'id',
      autoIncrement: true,
    });
    historiqueStore.createIndex('date', 'date', { unique: false });
    historiqueStore.createIndex('type', 'type', { unique: false });
    dbg(`Created store: ${S.HISTORIQUE}`);
  }

  const missingStores = Object.values(S).filter((name) => !db.objectStoreNames.contains(name));
  if (missingStores.length > 0) {
    wrn(`Missing stores after upgrade: ${missingStores.join(', ')}`);
  }
}
