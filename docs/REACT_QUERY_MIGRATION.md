# 🔄 Migration vers React Query

**Date :** 2025-01-09  
**Objectif :** Documenter la migration du système de cache actuel vers React Query

---

## 📊 ÉTAT ACTUEL

### Système de cache actuel
- ✅ `src/utils/cache.js` - Cache simple avec TTL
- ✅ Hook `useCache` pour utilisation React
- ✅ Nettoyage automatique des entrées expirées

### Limitations
- ⚠️ Pas de cache partagé entre composants
- ⚠️ Pas de synchronisation automatique
- ⚠️ Pas de retry automatique
- ⚠️ Pas de background refetching

---

## 🎯 AVANTAGES DE REACT QUERY

### Performance
- ✅ Cache partagé entre composants
- ✅ Déduplication automatique des requêtes
- ✅ Background refetching
- ✅ Stale-while-revalidate

### Robustesse
- ✅ Retry automatique avec exponential backoff
- ✅ Gestion d'erreurs avancée
- ✅ Optimistic updates
- ✅ Invalidation intelligente

### Développeur
- ✅ DevTools intégrées
- ✅ TypeScript support
- ✅ Documentation complète
- ✅ Communauté active

---

## 📦 INSTALLATION

```bash
npm install @tanstack/react-query
```

---

## 🔄 MIGRATION

### Étape 1 : Configuration du QueryClient

**Fichier :** `src/App.jsx`

```javascript
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
      retry: 3,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      {/* ... reste de l'app */}
    </QueryClientProvider>
  );
}
```

### Étape 2 : Remplacer useCache par useQuery

**Avant :**
```javascript
import { useCache } from '../../utils/cache';

const { data, isLoading, error, refetch } = useCache(
  'portfolio-data',
  () => fetchPortfolio(),
  { ttl: 5 * 60 * 1000 }
);
```

**Après :**
```javascript
import { useQuery } from '@tanstack/react-query';

const { data, isLoading, error, refetch } = useQuery({
  queryKey: ['portfolio'],
  queryFn: () => fetchPortfolio(),
  staleTime: 5 * 60 * 1000,
});
```

### Étape 3 : Utiliser useMutation pour les mutations

**Avant :**
```javascript
const handleSave = async (data) => {
  await saveData(data);
  invalidateCache('portfolio-data');
};
```

**Après :**
```javascript
import { useMutation, useQueryClient } from '@tanstack/react-query';

const queryClient = useQueryClient();

const mutation = useMutation({
  mutationFn: saveData,
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['portfolio'] });
  },
});
```

---

## 🎯 PRIORITÉS DE MIGRATION

### Priorité 1 : Appels API externes
- ✅ Finance (Yahoo Finance API)
- ✅ Garmin (si API externe)
- ✅ Nutrition (si API externe)

### Priorité 2 : Données IndexedDB lourdes
- ✅ Liste des livres
- ✅ Liste des quêtes
- ✅ Historique Garmin

### Priorité 3 : Données calculées
- ✅ Statistiques
- ✅ Graphiques
- ✅ Recommandations

---

## 📝 EXEMPLE COMPLET

### Avant (cache actuel)
```javascript
import { useCache } from '../../utils/cache';

function PortfolioTable() {
  const { data: portfolio, isLoading } = useCache(
    'portfolio',
    () => loadPortfolio(),
    { ttl: 5 * 60 * 1000 }
  );

  if (isLoading) return <Loading />;
  return <Table data={portfolio} />;
}
```

### Après (React Query)
```javascript
import { useQuery } from '@tanstack/react-query';

function PortfolioTable() {
  const { data: portfolio, isLoading } = useQuery({
    queryKey: ['portfolio'],
    queryFn: () => loadPortfolio(),
    staleTime: 5 * 60 * 1000,
  });

  if (isLoading) return <Loading />;
  return <Table data={portfolio} />;
}
```

---

## ✅ CHECKLIST DE MIGRATION

- [ ] Installer @tanstack/react-query
- [ ] Configurer QueryClientProvider dans App.jsx
- [ ] Migrer les appels API externes
- [ ] Migrer les données IndexedDB lourdes
- [ ] Migrer les mutations (useMutation)
- [ ] Tester les performances
- [ ] Supprimer l'ancien système de cache (optionnel)

---

**Note :** Le système de cache actuel peut coexister avec React Query pendant la migration.
