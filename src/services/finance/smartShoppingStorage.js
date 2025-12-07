/**
 * Smart Shopping Storage - IndexedDB + Cache optimisé
 * Gestion listes, inventaire, prix, profil marques avec Zod validation
 */

import { z } from 'zod';

// ============================================================================
// SCHEMAS VALIDATION ZOD
// ============================================================================

const articleSchema = z.object({
  id: z.string().uuid(),
  nom: z.string().min(1).max(100),
  quantite: z.number().positive().max(100),
  prixEstime: z.number().nonnegative().max(1000),
  prixReel: z.number().nonnegative().max(1000).nullable(),
  statut: z.enum(['a-acheter', 'achete', 'pas-trouve', 'remplace']),
  marque: z.object({
    nom: z.string(),
    type: z.enum(['exclusif', 'flexible', 'sous-marque-only']),
    confiance: z.number().min(0).max(100)
  }).optional(),
  categorie: z.string(),
  magasinOptimal: z.enum(['Action', 'Grand Frais', 'Auchan', 'Carrefour', 'Leclerc']).optional()
});

const listeSchema = z.object({
  id: z.string().uuid(),
  nom: z.string().min(1).max(100),
  type: z.enum(['power-shopping', 'quick-run', 'mission-speciale', 'promo-hunter']),
  budget: z.number().nonnegative().max(10000),
  statut: z.enum(['prete', 'en-cours', 'completee']),
  articles: z.array(articleSchema),
  dateCreation: z.number(),
  dateModification: z.number(),
  dateCompletion: z.number().nullable()
});

const inventaireItemSchema = z.object({
  id: z.string().uuid(),
  nom: z.string().min(1).max(100),
  quantite: z.number().nonnegative().max(1000),
  seuilAlerte: z.number().nonnegative().max(100),
  dureeVie: z.number().positive().max(365), // jours
  consommationMoyenne: z.number().positive().max(365), // jours par unité
  categorie: z.enum(['Frigo', 'Placard', 'Congel', 'Autre']),
  dateExpiration: z.string().nullable()
});

const budgetSchema = z.object({
  mensuel: z.number().nonnegative().max(10000),
  depenseCeMois: z.number().nonnegative(),
  restant: z.number()
});

// ============================================================================
// STORAGE CLASS
// ============================================================================

class SmartShoppingStorage {
  constructor() {
    this.STORAGE_KEY = 'smartShopping';
    this.cache = null;
    this.cacheTimestamp = null;
    this.CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
  }

  // ==========================================================================
  // CACHE MANAGEMENT
  // ==========================================================================

  isCacheValid() {
    return this.cache && this.cacheTimestamp && 
           (Date.now() - this.cacheTimestamp) < this.CACHE_DURATION;
  }

  invalidateCache() {
    this.cache = null;
    this.cacheTimestamp = null;
  }

  // ==========================================================================
  // DATA LOADING
  // ==========================================================================

  loadData() {
    if (this.isCacheValid()) {
      return this.cache;
    }

    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      const data = stored ? JSON.parse(stored) : this.getDefaultData();
      
      this.cache = data;
      this.cacheTimestamp = Date.now();
      
      return data;
    } catch (error) {
      console.error('Error loading smart shopping data:', error);
      return this.getDefaultData();
    }
  }

  saveData(data) {
    try {
      // Validation
      const validated = this.validateData(data);
      if (!validated.success) {
        console.error('Validation errors:', validated.errors);
        return false;
      }

      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
      this.cache = data;
      this.cacheTimestamp = Date.now();
      
      return true;
    } catch (error) {
      console.error('Error saving smart shopping data:', error);
      return false;
    }
  }

  getDefaultData() {
    return {
      budget: {
        mensuel: 400,
        depenseCeMois: 0,
        restant: 400
      },
      listes: [],
      inventaire: {
        articles: []
      },
      promos: {
        sures: [],
        potentielles: [],
        nonCiblees: []
      },
      profilMarques: {},
      historiquePrix: {}
    };
  }

  // ==========================================================================
  // VALIDATION
  // ==========================================================================

  validateData(data) {
    try {
      // Validate budget
      budgetSchema.parse(data.budget);
      
      // Validate listes
      data.listes.forEach(liste => listeSchema.parse(liste));
      
      // Validate inventaire
      data.inventaire.articles.forEach(item => inventaireItemSchema.parse(item));
      
      return { success: true };
    } catch (error) {
      return { success: false, errors: error.errors };
    }
  }

  // ==========================================================================
  // BUDGET OPERATIONS
  // ==========================================================================

  getBudget() {
    const data = this.loadData();
    return data.budget;
  }

  updateBudget(budget) {
    const data = this.loadData();
    data.budget = {
      ...data.budget,
      ...budget,
      restant: budget.mensuel - (budget.depenseCeMois || data.budget.depenseCeMois)
    };
    this.saveData(data);
    return data.budget;
  }

  // ==========================================================================
  // LISTE OPERATIONS
  // ==========================================================================

  getListes() {
    const data = this.loadData();
    return data.listes;
  }

  getListe(id) {
    const data = this.loadData();
    return data.listes.find(l => l.id === id);
  }

  createListe(liste) {
    const data = this.loadData();
    const newListe = {
      ...liste,
      id: crypto.randomUUID(),
      dateCreation: Date.now(),
      dateModification: Date.now(),
      dateCompletion: null,
      statut: 'prete',
      articles: liste.articles || []
    };
    
    data.listes.push(newListe);
    this.saveData(data);
    return newListe;
  }

  updateListe(id, updates) {
    const data = this.loadData();
    const index = data.listes.findIndex(l => l.id === id);
    
    if (index === -1) return null;
    
    data.listes[index] = {
      ...data.listes[index],
      ...updates,
      dateModification: Date.now()
    };
    
    this.saveData(data);
    return data.listes[index];
  }

  deleteListe(id) {
    const data = this.loadData();
    data.listes = data.listes.filter(l => l.id !== id);
    this.saveData(data);
    return true;
  }

  // ==========================================================================
  // ARTICLE OPERATIONS
  // ==========================================================================

  addArticle(listeId, article) {
    const data = this.loadData();
    const liste = data.listes.find(l => l.id === listeId);
    
    if (!liste) return null;
    
    const newArticle = {
      ...article,
      id: crypto.randomUUID(),
      statut: 'a-acheter',
      prixReel: null
    };
    
    liste.articles.push(newArticle);
    liste.dateModification = Date.now();
    
    this.saveData(data);
    return newArticle;
  }

  updateArticle(listeId, articleId, updates) {
    const data = this.loadData();
    const liste = data.listes.find(l => l.id === listeId);
    
    if (!liste) return null;
    
    const index = liste.articles.findIndex(a => a.id === articleId);
    if (index === -1) return null;
    
    liste.articles[index] = {
      ...liste.articles[index],
      ...updates
    };
    
    liste.dateModification = Date.now();
    this.saveData(data);
    
    return liste.articles[index];
  }

  deleteArticle(listeId, articleId) {
    const data = this.loadData();
    const liste = data.listes.find(l => l.id === listeId);
    
    if (!liste) return false;
    
    liste.articles = liste.articles.filter(a => a.id !== articleId);
    liste.dateModification = Date.now();
    
    this.saveData(data);
    return true;
  }

  // ==========================================================================
  // INVENTAIRE OPERATIONS
  // ==========================================================================

  getInventaire() {
    const data = this.loadData();
    return data.inventaire.articles;
  }

  addInventaireItem(item) {
    const data = this.loadData();
    const newItem = {
      ...item,
      id: crypto.randomUUID()
    };
    
    data.inventaire.articles.push(newItem);
    this.saveData(data);
    return newItem;
  }

  updateInventaireItem(id, updates) {
    const data = this.loadData();
    const index = data.inventaire.articles.findIndex(i => i.id === id);
    
    if (index === -1) return null;
    
    data.inventaire.articles[index] = {
      ...data.inventaire.articles[index],
      ...updates
    };
    
    this.saveData(data);
    return data.inventaire.articles[index];
  }

  deleteInventaireItem(id) {
    const data = this.loadData();
    data.inventaire.articles = data.inventaire.articles.filter(i => i.id !== id);
    this.saveData(data);
    return true;
  }

  // ==========================================================================
  // PROFIL MARQUES
  // ==========================================================================

  getProfilMarques() {
    const data = this.loadData();
    return data.profilMarques;
  }

  updateProfilMarque(nom, profil) {
    const data = this.loadData();
    data.profilMarques[nom] = {
      ...data.profilMarques[nom],
      ...profil,
      dateModification: Date.now()
    };
    this.saveData(data);
    return data.profilMarques[nom];
  }

  // ==========================================================================
  // ANALYTICS
  // ==========================================================================

  getMetrics() {
    const data = this.loadData();
    const listes = data.listes;
    
    const completees = listes.filter(l => l.statut === 'completee');
    const totalDepense = completees.reduce((sum, l) => {
      return sum + l.articles.reduce((s, a) => s + (a.prixReel || 0), 0);
    }, 0);
    
    const panierMoyen = completees.length > 0 ? totalDepense / completees.length : 0;
    
    return {
      totalListes: listes.length,
      listesCompletees: completees.length,
      listesEnCours: listes.filter(l => l.statut === 'en-cours').length,
      totalDepense,
      panierMoyen,
      budgetUtilise: (data.budget.depenseCeMois / data.budget.mensuel) * 100
    };
  }
}

export const smartShoppingStorage = new SmartShoppingStorage();
