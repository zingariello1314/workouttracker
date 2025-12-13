/**
 * Test basique pour vérifier que le ShoppingListModule fonctionne
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import ShoppingListModule from './src/components/sidebar/historical/ShoppingListModule.jsx';

// Test simple
const testProps = {
  moduleId: 'shopping-list-module',
  moduleType: 'historical',
  navigation: {
    setActiveTab: () => {}
  },
  data: {
    loading: false,
    error: null,
    shoppingLists: [
      {
        id: 'test-list',
        nom: 'Ma liste de test',
        statut: 'prete',
        scheduledTime: new Date().toISOString(),
        articles: [
          { nom: 'Pain', quantite: 1, prixEstime: 1.50 },
          { nom: 'Lait', quantite: 2, prixEstime: 2.40 }
        ]
      }
    ]
  }
};

console.log('Test du ShoppingListModule...');

try {
  const { container } = render(React.createElement(ShoppingListModule, testProps));
  console.log('✅ Module rendu avec succès');
  console.log('📋 HTML généré:', container.innerHTML);
} catch (error) {
  console.error('❌ Erreur lors du rendu:', error);
}