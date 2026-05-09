/**
 * Banque d'aliments de référence (valeurs nutritionnelles indicativement alignées sur tables type CIQUAL, arrondies).
 * - `referenceUnit` g ou ml : valeurs dans `per100` sont toujours pour 100 g ou 100 ml.
 * - `piece` optionnel : équivalent pour un aliment à la portion (œuf, tranche de pain, etc.), les macros affichées peuvent être dérivées.
 */

/** @typedef {{ kcal: number, protein: number, carbs: number, fat: number, fiber: number }} Per100 */

/** @typedef {{ vitaminA?: number, vitaminC?: number, vitaminD?: number, vitaminE?: number, vitaminK?: number, vitaminB6?: number, vitaminB12?: number, folate?: number, calcium?: number, iron?: number, magnesium?: number, potassium?: number, sodium?: number, zinc?: number }} Micronutrients */
/** @typedef {{ id: string, key: string, name: string, category: string, description: string, referenceAmount: number, referenceUnit: 'g'|'ml', per100: Per100, microPer100: Micronutrients, piece?: { label: string, grams: number } }} NutritionBankFood */

/**
 * Lignes compactes : nom, catégorie, kcal, prot, gluc, lip, fibres (pour 100g ou 100ml), unité ('g'|'ml'),
 * optionnel : poids pièce (g), libellé pièce
 */
const RAW = [
  ['Blanc de poulet cuit', 'Viandes', 165, 31, 0, 3.6, 0],
  ['Escalope de dinde', 'Viandes', 189, 29, 1, 7, 0],
  ['Bœuf haché 5% MG cuit', 'Viandes', 180, 26, 0, 8, 0],
  ['Bœuf haché 15% MG cuit', 'Viandes', 250, 26, 0, 15, 0],
  ['Steak de bœuf maigre grillé', 'Viandes', 200, 29, 0, 9, 0],
  ['Paleron de bœuf braisé', 'Viandes', 250, 29, 2, 13, 0],
  ['Porc filet mignon', 'Viandes', 180, 29, 1, 7, 0],
  ['Agneau gigot maigre', 'Viandes', 210, 29, 0, 10, 0],
  ['Lapin', 'Viandes', 173, 26, 0, 7, 0],
  ['Merguez', 'Viandes', 320, 13, 3, 29, 0],
  ['Saumon atlantique cru', 'Poissons', 185, 19, 0.5, 11, 0],
  ['Saumon fumé', 'Poissons', 125, 21, 1, 4, 0],
  ['Cabillaud cru', 'Poissons', 78, 17, 1, 1, 0],
  ['Colin pané (vendu congelé)', 'Poissons', 200, 12, 22, 9, 2],
  ['Thon au naturel égoutté', 'Poissons', 120, 26, 0, 1, 0],
  ['Maquereau au naturel', 'Poissons', 180, 21, 1, 11, 0],
  ['Sardines à l’huile', 'Poissons', 220, 24, 1, 13, 0],
  ['Truite', 'Poissons', 148, 21, 3, 7, 0],
  ['Crevettes cuites', 'Poissons', 90, 21, 2, 1, 0],
  ['Moules cuites', 'Poissons', 86, 12, 3, 3, 0],
  ['Huître', 'Poissons', 74, 10, 6, 3, 0],
  ['Surimi bâtonnets', 'Poissons', 120, 15, 13, 5, 3],
  ['Œuf entier cru', 'Œufs', 155, 13, 1.1, 11, 0, 'g', 55, '1 œuf moyen'],
  ['Blanc d’œuf', 'Œufs', 54, 11, 2, 1, 0],
  ['Jaune d’œuf', 'Œufs', 345, 17, 6, 31, 0],
  ['Lait écrémé', 'Produits laitiers', 35, 3.4, 5, 1, 0, 'ml'],
  ['Lait demi-écrémé', 'Produits laitiers', 46, 3.3, 4.8, 1.5, 0, 'ml'],
  ['Lait entier', 'Produits laitiers', 64, 3.2, 5, 4, 0, 'ml'],
  ['Yaourt nature 0%', 'Produits laitiers', 50, 6, 7, 1, 0, 'g', 125, '1 pot type 125 g'],
  ['Yaourt nature entier', 'Produits laitiers', 90, 6, 8, 6, 0, 'g', 125, '1 pot type 125 g'],
  ['Fromage blanc 0%', 'Produits laitiers', 45, 7, 7, 1, 0],
  ['Cottage cheese maigre', 'Produits laitiers', 90, 17, 2, 2, 0],
  ['Mozzarella', 'Produits laitiers', 280, 22, 2, 20, 0],
  ['Emmental rapé', 'Produits laitiers', 380, 30, 0, 31, 0],
  ['Parmesan', 'Produits laitiers', 420, 32, 0, 30, 0],
  ['Feta', 'Produits laitiers', 263, 15, 2, 20, 0],
  ['Ricotta', 'Produits laitiers', 150, 8, 4, 12, 0],
  ['Beurre', 'Mat. grasses', 720, 1, 0, 82, 0, 'g', 10, '1 noix (10 g)'],
  ['Margarine tartinable', 'Mat. grasses', 720, 1, 0, 82, 0],
  ['Huile d’olive vierge extra', 'Mat. grasses', 900, 0, 0, 100, 0, 'ml'],
  ['Huile de colza', 'Mat. grasses', 900, 0, 0, 100, 0, 'ml'],
  ['Avocat', 'Végétaux', 157, 2, 3, 15, 4],
  ['Amandes grillées', 'Fruits à coque', 610, 24, 6, 53, 8],
  ['Noix de cajou', 'Fruits à coque', 560, 18, 28, 44, 3],
  ['Noix', 'Fruits à coque', 650, 15, 8, 65, 7],
  ['Beurre de cacahuète', 'Fruits à coque', 625, 25, 12, 50, 6],
  ['Pois chiches cuits', 'Légumineuses', 130, 8, 16, 2, 5],
  ['Lentilles vertes cuites', 'Légumineuses', 110, 9, 15, 1, 4],
  ['Haricots rouges cuits', 'Légumineuses', 120, 7, 20, 0.5, 5],
  ['Edamame surgelé cuisson vapeur', 'Légumineuses', 120, 13, 5, 5, 4],
  ['Tofu nature', 'Protéines végétales', 116, 10, 2, 9, 0],
  ['Tempeh', 'Protéines végétales', 190, 20, 6, 10, 1],
  ['Seitan', 'Protéines végétales', 120, 20, 4, 1, 0],
  ['Whey protéine (poudre indicative)', 'Compléments', 380, 75, 8, 4, 0],
  ['Riz blanc cuit', 'Féculents', 130, 2.5, 28, 0.3, 0.8],
  ['Riz basmati cuit', 'Féculents', 125, 2.8, 28, 0.4, 0.5],
  ['Pâtes cuites nature', 'Féculents', 140, 4.9, 28, 0.8, 1.9],
  ['Semoule cuite couscous', 'Féculents', 133, 3.7, 25, 0.4, 1.9],
  ['Pomme de terre vapeur', 'Féculents', 73, 1.9, 16, 0.1, 1.9],
  ['Patate douce cuite', 'Féculents', 90, 1.5, 20, 0.2, 3],
  ['Flocons d’avoine secs', 'Féculents', 380, 13, 60, 7, 8],
  ['Pain complet (100 g)', 'Féculents', 250, 8, 45, 5, 6, 'g', 40, '1 tranche ~40 g'],
  ['Pain de mie blanc', 'Féculents', 273, 8, 50, 3, 2, 'g', 30, '1 tranche fine'],
  ['Tortillas de blé (25 cm)', 'Féculents', 320, 7, 60, 4, 2, 'g', 45, '1 tortilla ~45 g'],
  ['Cornflakes enrichis fer', 'Féculents', 380, 7, 86, 0.5, 3],
  ['Granola chocolat portions', 'Féculents', 480, 7, 60, 21, 5],
  ['Quinoa cuit', 'Féculents', 132, 4.4, 23, 2, 2],
  ['Polenta cuite', 'Féculents', 85, 2, 19, 0.5, 1],
  ['Brocoli cuits vapeur', 'Légumes', 35, 2.5, 3, 0.5, 3],
  ['Haricots verts cuits', 'Légumes', 26, 1.9, 3, 0.2, 3],
  ['Épinards cuits à la poêle', 'Légumes', 56, 2.7, 2, 2, 2],
  ['Tomate crue', 'Légumes', 18, 0.9, 3.8, 0.2, 1],
  ['Carotte râpée', 'Légumes', 35, 0.9, 6, 0.3, 3],
  ['Courgette poêlée', 'Légumes', 32, 1.9, 2, 0.4, 1],
  ['Poivron grillé huile léger', 'Légumes', 70, 1.5, 5, 4, 1.8],
  ['Salade iceberg', 'Légumes', 12, 0.8, 1.5, 0.5, 0.9],
  ['Concombre', 'Légumes', 13, 0.6, 2, 0.1, 0.9],
  ['Oignon cuit sauté', 'Légumes', 45, 1.2, 7, 0.5, 1.8],
  ['Aubergines au four', 'Légumes', 45, 1.4, 4, 2, 2],
  ['Champignons poêles', 'Légumes', 45, 2.5, 2, 2, 1.5],
  ['Poire cru', 'Fruits', 57, 0.6, 12, 0.1, 2],
  ['Pomme Golden', 'Fruits', 52, 0.6, 12, 0.2, 2],
  ['Banane mûre', 'Fruits', 95, 1.1, 21, 0.3, 2.3, 'g', 120, '1 banane'],
  ['Myrtilles', 'Fruits', 57, 0.7, 14, 0.3, 2.4],
  ['Fraise', 'Fruits', 40, 0.7, 5, 0.4, 2],
  ['Raisin', 'Fruits', 75, 0.6, 18, 0.2, 1],
  ['Orange', 'Fruits', 47, 0.9, 10, 0.1, 2.4, 'g', 150, '1 orange'],
  ['Kiwi', 'Fruits', 55, 1, 12, 0.5, 3],
  ['Mangue', 'Fruits', 55, 0.5, 13, 0.3, 1.5],
  ['Dattes séchées', 'Fruits', 280, 2, 68, 0.4, 7, 'g', 8, '1 datte ~8 g'],
  ['Pêche', 'Fruits', 39, 0.9, 9, 0.3, 1.5],
  ['Jus d’orange pur jus', 'Boissons', 45, 0.7, 10, 0.2, 0, 'ml'],
  ['Eau minérale', 'Boissons', 0, 0, 0, 0, 0, 'ml'],
  ['Café noir', 'Boissons', 2, 0.2, 0, 0, 0, 'ml'],
  ['Thé infusé', 'Boissons', 1, 0, 0, 0, 0, 'ml'],
  ['Miel', 'Sucres', 320, 0.3, 80, 0, 0],
  ['Confiture allégée', 'Sucres', 180, 0.5, 45, 0, 1],
  ['Chocolat noir 70%', 'Sucres', 530, 7, 45, 40, 8, 'g', 10, '2 carrés ~10 g'],
  ['Muesli fruits noix', 'Petit-déj', 420, 9, 65, 15, 7],
  ['Barre protéinée type 50 g', 'Snacks', 400, 20, 35, 18, 3, 'g', 50, '1 barre'],
  ['Chips pomme de terre', 'Snacks', 540, 6, 50, 35, 4],
  ['Pop-corn micro-ondes sucré', 'Snacks', 480, 5, 60, 24, 7],
  ['Sauce tomate cuisinée', 'Assaisonnements', 40, 1.3, 6, 1, 1.5, 'ml'],
  ['Ketchup', 'Assaisonnements', 110, 1, 25, 0.3, 0.4, 'ml'],
  ['Mayonnaise', 'Assaisonnements', 750, 1, 1, 83, 0, 'ml'],
  ['Pesto vert', 'Assaisonnements', 450, 9, 5, 45, 2, 'ml'],
  ['Moutarde de Dijon', 'Assaisonnements', 110, 7, 5, 7, 4, 'ml'],
  ['Vinaigre balsamique', 'Assaisonnements', 150, 0.5, 25, 0, 0, 'ml'],
  ['Tofu soyeux dessert', 'Desserts', 90, 4, 8, 5, 0],
  ['Glace vanille', 'Desserts', 190, 3, 24, 9, 0.5, 'g', 50, '1 boule ~50 g'],
  ['Compote pomme sans sucre', 'Desserts', 70, 0.3, 15, 0.2, 1.5, 'g', 100, '1 gourde 100 g'],
  ['Poudre de cacao non sucré', 'Pâtisserie', 400, 20, 12, 22, 33],
  ['Levure nutritionnelle en flocons', 'Végétal', 350, 50, 30, 5, 20],
  ['Chia sec', 'Graines', 490, 17, 7, 31, 34, 'g', 10, '1 c. à soupe ~10 g'],
  ['Graines de lin moulues', 'Graines', 530, 18, 4, 42, 27],
  ['Crème liquide 30% MG', 'Produits laitiers', 290, 2.5, 3, 30, 0, 'ml'],
  ['Crème fraîche épaisse légère', 'Produits laitiers', 200, 3, 4, 19, 0],
  ['Jambon blanc dégraissé', 'Charcuterie', 110, 20, 1, 3, 0, 'g', 30, '1 tranche'],
  ['Lardons fumés', 'Charcuterie', 350, 15, 1, 32, 0],
  ['Chorizo', 'Charcuterie', 450, 20, 2, 40, 0],
  ['Thon frais grillé', 'Poissons', 180, 30, 0, 6, 0],
  ['Filet de lieu pané four', 'Poissons', 210, 15, 18, 9, 1],
  ['Protein drink végétal soja', 'Boissons', 40, 3, 2, 2, 0, 'ml'],
  ['Miso pâte', 'Assaisonnements', 200, 12, 13, 6, 2],
  ['Nouilles de riz sèches', 'Féculents', 360, 7, 80, 1, 2],
  ['Nouilles udon cuites', 'Féculents', 130, 3, 28, 0.5, 1],
  ['Nouilles soba sèches', 'Féculents', 350, 14, 70, 2, 4],
  ['Taboulé au boulgour (préparé)', 'Plats', 180, 4, 24, 8, 2],
  ['Curry de pois chiches (préparé)', 'Plats', 120, 4, 15, 5, 3],
  ['Piadine', 'Féculents', 320, 8, 56, 7, 2, 'g', 70, '1 piadina'],
  ['Galettes de sarrasin', 'Féculents', 120, 4, 20, 2, 2, 'g', 40, '1 petite galette'],
  ['Blé concassé (boulgour) cuit', 'Féculents', 98, 3.5, 19, 0.4, 2.5],
  ['Orge perlé cuit', 'Féculents', 120, 2.5, 22, 0.5, 2],
  ['Chou-fleur rôti', 'Légumes', 60, 2, 4, 4, 2],
  ['Chou kale cru', 'Légumes', 35, 2.9, 2, 1, 3.5],
  ['Asperges vertes vapeur', 'Légumes', 25, 2.2, 2, 0.2, 2],
  ['Macédoine légumes surgelés', 'Légumes', 55, 2, 8, 1, 3],
  ['Ananas frais', 'Fruits', 50, 0.6, 11, 0.1, 1.5],
  ['Melon', 'Fruits', 35, 0.7, 8, 0.2, 0.9],
  ['Poireaux fondus', 'Légumes', 28, 0.9, 3, 0.4, 2.2],
  ['Saucisse de volaille', 'Viandes', 220, 15, 2, 18, 0],
  ['Bœuf séché biltong', 'Viandes', 250, 50, 3, 5, 0],
  ['Shake lait protéines type', 'Compléments', 90, 15, 8, 1, 0, 'ml', 250, '250 ml prêt à boire'],
  ['Skyr nature', 'Produits laitiers', 62, 11, 4, 0.2, 0, 'g', 150, '1 pot ~150 g'],
  ['Kefir nature', 'Produits laitiers', 52, 3.5, 4.8, 1.8, 0, 'ml'],
  ['Yaourt grec 2%', 'Produits laitiers', 80, 9, 4, 2.5, 0],
  ['Lait d’amande sans sucre', 'Boissons', 15, 0.5, 0.3, 1.1, 0.2, 'ml'],
  ['Lait de soja sans sucre', 'Boissons', 40, 3.4, 0.7, 2.1, 0.6, 'ml'],
  ['Lait d’avoine sans sucre', 'Boissons', 45, 1, 7, 1.5, 0.7, 'ml'],
  ['Boisson isotonique', 'Boissons', 24, 0, 6, 0, 0, 'ml'],
  ['Eau de coco', 'Boissons', 18, 0.7, 3.7, 0.2, 0.3, 'ml'],
  ['Kombucha nature', 'Boissons', 20, 0.2, 4, 0, 0, 'ml'],
  ['Jus de betterave', 'Boissons', 40, 1.5, 8.8, 0.1, 0.6, 'ml'],
  ['Smoothie fruits rouges sans sucre ajouté', 'Boissons', 48, 0.8, 10, 0.3, 1.6, 'ml'],
  ['Cacao boisson allégée', 'Boissons', 65, 4, 8, 1.6, 1.2, 'ml'],
  ['Whey isolate', 'Compléments', 365, 84, 3, 2, 0],
  ['Caséine micellaire', 'Compléments', 360, 78, 8, 2, 0],
  ['Protéine de pois', 'Compléments', 390, 80, 4, 7, 1],
  ['Protéine de riz', 'Compléments', 380, 78, 7, 4, 1],
  ['Gainer standard', 'Compléments', 390, 25, 60, 3, 2],
  ['Maltodextrine', 'Compléments', 380, 0, 95, 0, 0],
  ['Dextrose', 'Compléments', 400, 0, 100, 0, 0],
  ['Farine d’avoine instantanée', 'Compléments', 370, 13, 62, 7, 9],
  ['Électrolytes sans sucre', 'Compléments', 0, 0, 0, 0, 0],
  ['Créatine monohydrate', 'Compléments', 0, 0, 0, 0, 0],
  ['BCAA 2:1:1', 'Compléments', 370, 90, 0, 0, 0],
  ['EAA', 'Compléments', 380, 95, 0, 0, 0],
  ['Collagène hydrolysé', 'Compléments', 360, 90, 0, 0, 0],
  ['Oméga-3 huile de poisson', 'Compléments', 900, 0, 0, 100, 0, 'ml', 5, '1 c. à café ~5 ml'],
  ['MCT oil', 'Compléments', 900, 0, 0, 100, 0, 'ml'],
  ['Barre énergétique céréales', 'Snacks', 420, 8, 65, 14, 4, 'g', 40, '1 barre ~40 g'],
  ['Banane chips', 'Snacks', 520, 2, 58, 32, 7],
  ['Galettes de riz', 'Snacks', 385, 8, 80, 3, 3, 'g', 9, '1 galette ~9 g'],
  ['Bretzels', 'Snacks', 380, 11, 74, 3, 3],
  ['Crackers complets', 'Snacks', 430, 11, 62, 14, 7],
  ['Houmous', 'Snacks', 240, 8, 14, 16, 5],
  ['Guacamole', 'Snacks', 170, 2, 6, 15, 4],
  ['Rillettes de thon allégées', 'Snacks', 160, 18, 2, 8, 0],
  ['Salami', 'Charcuterie', 410, 23, 1, 35, 0],
  ['Pancetta', 'Charcuterie', 450, 15, 0, 43, 0],
  ['Blanc de poulet fumé', 'Charcuterie', 110, 21, 1, 2, 0],
  ['Filet de dinde fumé', 'Charcuterie', 105, 22, 1, 1, 0],
  ['Tofu fumé', 'Protéines végétales', 150, 16, 2, 9, 1],
  ['Steak végétal soja', 'Protéines végétales', 180, 18, 10, 8, 4],
  ['Protéine de soja texturée sèche', 'Protéines végétales', 330, 52, 30, 1, 13],
  ['Falafels cuits', 'Légumineuses', 260, 12, 20, 15, 6],
  ['Pois cassés cuits', 'Légumineuses', 116, 8, 16, 1, 8],
  ['Lentilles corail cuites', 'Légumineuses', 110, 9, 16, 0.6, 5],
  ['Riz complet cuit', 'Féculents', 111, 2.6, 23, 0.9, 1.8],
  ['Pâtes complètes cuites', 'Féculents', 150, 5.5, 29, 1.2, 3.8],
  ['Boulgour cuit', 'Féculents', 83, 3.1, 18, 0.2, 4.5],
  ['Sarrasin cuit', 'Féculents', 110, 4.2, 20, 1, 2.7],
  ['Pain au levain', 'Féculents', 245, 8, 46, 2, 3, 'g', 45, '1 tranche ~45 g'],
  ['Bagel nature', 'Féculents', 270, 10, 53, 1.5, 2, 'g', 95, '1 bagel ~95 g'],
  ['Wrap complet', 'Féculents', 290, 9, 48, 6, 5, 'g', 60, '1 wrap ~60 g'],
  ['Gnocchis cuits', 'Féculents', 155, 3.7, 31, 0.4, 1.7],
  ['Polenta sèche', 'Féculents', 360, 8, 77, 1.5, 2.8],
  ['Farine complète', 'Féculents', 340, 12, 63, 2, 10],
  ['Pomme de terre grenaille rôtie', 'Féculents', 115, 2.5, 20, 2.5, 2],
  ['Betterave cuite', 'Légumes', 44, 1.7, 8, 0.2, 2.8],
  ['Artichaut cuit', 'Légumes', 47, 3.3, 5, 0.2, 5.4],
  ['Petits pois cuits', 'Légumes', 80, 5.4, 9, 0.4, 5],
  ['Maïs doux', 'Légumes', 96, 3.4, 18, 1.5, 2.7],
  ['Fenouil cru', 'Légumes', 31, 1.2, 4.2, 0.2, 3.1],
  ['Radis', 'Légumes', 16, 0.7, 2.4, 0.1, 1.6],
  ['Chou rouge', 'Légumes', 31, 1.4, 5.2, 0.2, 2.1],
  ['Poivron jaune', 'Légumes', 30, 1, 5.4, 0.2, 1.5],
  ['Roquette', 'Légumes', 25, 2.6, 1.8, 0.7, 1.6],
  ['Mâche', 'Légumes', 21, 2, 1.5, 0.4, 1.2],
  ['Framboise', 'Fruits', 52, 1.2, 5.4, 0.7, 6.5],
  ['Mûre', 'Fruits', 43, 1.4, 5, 0.5, 5.3],
  ['Pastèque', 'Fruits', 30, 0.6, 7, 0.2, 0.4],
  ['Papaye', 'Fruits', 43, 0.5, 9.7, 0.3, 1.7],
  ['Abricot', 'Fruits', 48, 1.4, 9, 0.4, 2],
  ['Prune', 'Fruits', 46, 0.7, 10, 0.3, 1.4],
  ['Nectarine', 'Fruits', 44, 1, 8.9, 0.3, 1.7],
  ['Figue fraîche', 'Fruits', 74, 0.8, 16, 0.3, 2.9],
  ['Cranberries séchées', 'Fruits', 330, 0.1, 82, 1, 5],
  ['Compote poire sans sucre', 'Desserts', 68, 0.3, 15, 0.2, 1.6],
  ['Flan vanille', 'Desserts', 110, 3.2, 18, 3, 0],
  ['Riz au lait', 'Desserts', 120, 3.5, 18, 4, 0.3],
  ['Mousse chocolat', 'Desserts', 280, 4, 24, 18, 2],
  ['Pudding chia maison', 'Desserts', 170, 4, 12, 11, 8],
  ['Sirop d’érable', 'Sucres', 260, 0, 67, 0, 0],
  ['Sucre de coco', 'Sucres', 380, 0, 95, 0, 0],
  ['Confiture classique', 'Sucres', 250, 0.4, 60, 0.1, 1],
  ['Boisson cola sucrée', 'Boissons', 42, 0, 10.6, 0, 0, 'ml'],
  ['Limonade sucrée', 'Boissons', 40, 0, 9.8, 0, 0, 'ml'],
  ['Boisson energy standard', 'Boissons', 45, 0, 11, 0, 0, 'ml'],
  ['Bière blonde 5%', 'Boissons', 43, 0.5, 3.5, 0, 0, 'ml'],
  ['Vin rouge 12%', 'Boissons', 84, 0.1, 2.5, 0, 0, 'ml'],
  ['Cidre brut', 'Boissons', 48, 0, 5, 0, 0, 'ml'],
  ['Soupe de légumes maison', 'Boissons', 35, 1.5, 5, 1, 1.6, 'ml'],
  ['Bouillon de volaille', 'Boissons', 8, 1.1, 0.3, 0.3, 0, 'ml'],
  ['Gazpacho', 'Boissons', 40, 1.2, 5.8, 1.3, 1.2, 'ml'],
  ['Kefir d’eau', 'Boissons', 18, 0, 4, 0, 0, 'ml'],
  ['Miel liquide en stick', 'Sucres', 320, 0.3, 80, 0, 0, 'g', 15, '1 stick ~15 g'],
  ['Gel énergétique endurance', 'Compléments', 280, 0, 70, 0, 0, 'g', 32, '1 gel ~32 g'],
  ['Boisson de récupération', 'Compléments', 360, 35, 45, 3, 0],
  ['Pack protéines clear whey', 'Compléments', 350, 85, 3, 1, 0],
  ['Farine de patate douce', 'Compléments', 350, 6, 78, 1, 8],
  ['Spiruline poudre', 'Compléments', 290, 57, 24, 8, 3],
  ['Levure de bière', 'Compléments', 310, 45, 35, 5, 20],
  ['Açai surgelé non sucré', 'Fruits', 70, 1.2, 4, 5, 3.5],
  ['Purée d’amandes complètes', 'Fruits à coque', 620, 21, 8, 55, 10],
  ['Purée de noisettes', 'Fruits à coque', 650, 15, 7, 62, 9],
  ['Noix de pécan', 'Fruits à coque', 690, 9, 4, 72, 9],
  ['Pistaches', 'Fruits à coque', 560, 20, 19, 45, 10],
  ['Avoine instant', 'Féculents', 375, 13, 61, 7, 9],
  ['Lait chocolaté protéiné', 'Boissons', 62, 4.8, 7, 1.5, 0, 'ml'],
  ['Jus de pomme sans sucre ajouté', 'Boissons', 46, 0.1, 11, 0.1, 0.2, 'ml'],
  ['Nectar mangue', 'Boissons', 52, 0.2, 12, 0.1, 0.3, 'ml'],
  ['Skyr vanille', 'Produits laitiers', 72, 10, 7, 0.3, 0],
  ['Fromage blanc 3%', 'Produits laitiers', 76, 8, 5, 3, 0],
  ['Petit suisse nature', 'Produits laitiers', 98, 7, 4, 6, 0],
  ['Lassi mangue', 'Boissons', 75, 2.7, 12, 2, 0, 'ml'],
  ['Pois mange-tout', 'Légumes', 42, 2.8, 5, 0.2, 2.6],
  ['Navet cuit', 'Légumes', 28, 0.9, 5, 0.1, 2],
  ['Céleri branche', 'Légumes', 16, 0.7, 2.5, 0.2, 1.6],
  ['Haricots beurre cuits', 'Légumes', 33, 1.8, 4.5, 0.2, 2.7],
  ['Pois gourmands cuits', 'Légumes', 40, 3, 4, 0.3, 3.4],
  ['Mangue séchée', 'Fruits', 320, 2.5, 78, 1.2, 2.6],
  ['Abricots secs', 'Fruits', 240, 3.4, 53, 0.5, 7],
  ['Pruneaux', 'Fruits', 240, 2.2, 57, 0.4, 7.1],
  ['Gaufre protéinée', 'Snacks', 390, 28, 34, 15, 5, 'g', 50, '1 gaufre ~50 g'],
  ['Cookie protéiné', 'Snacks', 420, 26, 35, 19, 6, 'g', 60, '1 cookie ~60 g'],
  ['Biscottes complètes', 'Féculents', 390, 12, 71, 5, 8, 'g', 9, '1 biscotte ~9 g'],
  ['Muesli sans sucre', 'Petit-déj', 370, 12, 58, 8, 9],
  ['Céréales soufflées riz', 'Petit-déj', 380, 7, 83, 1, 2],
  ['Wrap maïs', 'Féculents', 310, 6, 57, 6, 4, 'g', 60, '1 wrap ~60 g'],
  ['Vermicelles cuits', 'Féculents', 135, 4, 27, 0.4, 1.2],
  ['Pâtes riz complètes cuites', 'Féculents', 150, 3, 31, 1.3, 2.1],
  ['Tofu lacto-fermenté', 'Protéines végétales', 170, 18, 2, 10, 1],
  ['Lupin graines cuites', 'Légumineuses', 116, 16, 3, 2.9, 3],
  ['Pois chiches grillés', 'Snacks', 400, 20, 45, 14, 12],
  ['Tahini', 'Assaisonnements', 595, 17, 12, 53, 10],
  ['Sauce soja réduite en sel', 'Assaisonnements', 60, 9, 3, 0, 0, 'ml'],
  ['Tomates cerises', 'Légumes', 21, 0.9, 3.5, 0.2, 1.3, 'g', 12, '1 tomate cerise ~12 g'],
  ['Poivron rouge cru', 'Légumes', 31, 1, 4.5, 0.3, 2.1],
  ['Poivron vert cru', 'Légumes', 20, 0.9, 3.6, 0.2, 1.7],
  ['Tomate pelée en conserve', 'Légumes', 24, 1.2, 3.9, 0.2, 1.2],
  ['Purée de tomate', 'Légumes', 38, 1.7, 6.5, 0.3, 1.8],
  ['Courge butternut cuite', 'Légumes', 45, 1, 8.8, 0.1, 2],
  ['Potiron cuit', 'Légumes', 27, 1, 4.9, 0.1, 1.1],
  ['Chou de Bruxelles cuit', 'Légumes', 43, 3.4, 5.4, 0.3, 3.8],
  ['Pak choï', 'Légumes', 13, 1.5, 1.2, 0.2, 1],
  ['Bette (blette) cuite', 'Légumes', 20, 1.9, 2.8, 0.1, 1.6],
  ['Échalote', 'Légumes', 72, 2.5, 16, 0.1, 3.2],
  ['Ail', 'Légumes', 149, 6.4, 28, 0.5, 2.1, 'g', 5, '1 gousse ~5 g'],
  ['Endive', 'Légumes', 17, 0.9, 1.6, 0.2, 1.3],
  ['Chou blanc cru', 'Légumes', 25, 1.3, 3.4, 0.1, 2.5],
  ['Pomme de terre douce violette cuite', 'Féculents', 92, 1.8, 21, 0.2, 3.3],
  ['Topinambour cuit', 'Légumes', 73, 2, 12, 0.1, 2.4],
  ['Manioc cuit', 'Féculents', 160, 1.4, 38, 0.3, 1.8],
  ['Igname cuite', 'Féculents', 118, 1.5, 27, 0.2, 3.9],
  ['Frites au four', 'Féculents', 170, 2.9, 27, 5.5, 3.1],
  ['Riz sauvage cuit', 'Féculents', 100, 4, 21, 0.3, 1.8],
  ['Semoule complète cuite', 'Féculents', 124, 4.2, 23, 0.8, 3.7],
  ['Millet cuit', 'Féculents', 119, 3.5, 24, 1, 1.3],
  ['Oranges sanguines', 'Fruits', 47, 0.9, 10, 0.1, 2.4, 'g', 160, '1 orange ~160 g'],
  ['Pamplemousse rose', 'Fruits', 39, 0.8, 8.4, 0.1, 1.4, 'g', 230, '1/2 pamplemousse ~230 g'],
  ['Mandarine', 'Fruits', 53, 0.8, 11, 0.3, 1.8, 'g', 90, '1 mandarine ~90 g'],
  ['Clémentine', 'Fruits', 47, 0.8, 10, 0.2, 1.7, 'g', 80, '1 clémentine ~80 g'],
  ['Grenade', 'Fruits', 83, 1.7, 14, 1.2, 4],
  ['Litchi', 'Fruits', 66, 0.8, 15, 0.4, 1.3],
  ['Fruit de la passion', 'Fruits', 97, 2.2, 18, 0.7, 10.4, 'g', 18, '1 fruit ~18 g'],
  ['Goyave', 'Fruits', 68, 2.6, 9, 1, 5.4],
  ['Fruits rouges surgelés', 'Fruits', 47, 1, 8, 0.4, 4.5],
  ['Ananas en tranches au jus', 'Fruits', 60, 0.5, 14, 0.2, 1.4],
  ['Poire en conserve au jus', 'Fruits', 65, 0.3, 15, 0.1, 1.7],
  ['Compote multifruits sans sucre', 'Desserts', 71, 0.4, 16, 0.1, 1.5, 'g', 100, '1 gourde 100 g'],
  ['Pistaches décortiquées grillées salées', 'Fruits à coque', 570, 20, 18, 46, 10],
  ['Noisettes', 'Fruits à coque', 628, 15, 7, 61, 10],
  ['Graines de courge', 'Graines', 560, 30, 10, 49, 6, 'g', 10, '1 c. à soupe ~10 g'],
  ['Graines de tournesol', 'Graines', 584, 21, 20, 51, 8, 'g', 10, '1 c. à soupe ~10 g'],
  ['Huile de lin', 'Mat. grasses', 900, 0, 0, 100, 0, 'ml', 5, '1 c. à café ~5 ml'],
  ['Vinaigrette allégée', 'Assaisonnements', 210, 0.7, 6, 19, 0, 'ml', 15, '1 c. à soupe ~15 ml'],
  ['Sauce yaourt citron', 'Assaisonnements', 90, 3, 6, 6, 0, 'ml', 15, '1 c. à soupe ~15 ml'],
  ['Concentré de bouillon légumes', 'Assaisonnements', 140, 6, 20, 2, 1, 'g', 5, '1 c. à café ~5 g']
];

/** Nombre de références actives dans l’assistant programme (liste complète peut rester dans RAW). */
export const NUTRITION_FOOD_BANK_ACTIVE_COUNT = RAW.length;

function normalizeFoodKey(value) {
  return String(value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

function descriptionForFood(name, category, unit, per100, micro) {
  const u = unit === 'ml' ? '100 ml' : '100 g';
  const map = {
    Viandes: 'Source protéique animale utile pour construire/maintenir la masse musculaire.',
    Poissons: 'Apport en protéines et souvent en acides gras utiles à la récupération.',
    'Produits laitiers': 'Protéines et calcium, pratique en collation et petit-déjeuner.',
    Légumes: 'Densité calorique faible, fibres et micronutriments pour le volume des repas.',
    Fruits: 'Glucides naturels, fibres et vitamines pour énergie et récupération.',
    Féculents: 'Source principale de glucides complexes pour l’entraînement et l’endurance.',
    Compléments: 'Produit de soutien nutritionnel, utile selon le contexte du programme.',
    Assaisonnements: 'Ajuste goût et densité calorique ; surveiller les quantités.',
    Boissons: 'Hydratation ou apport énergétique liquide selon le produit.',
    'Fruits à coque': 'Denses en énergie, riches en lipides, minéraux et satiété.'
  };
  const base = map[category] || 'Aliment de référence pour composer des repas cohérents au quotidien.';
  const p = Number(per100?.protein || 0);
  const c = Number(per100?.carbs || 0);
  const f = Number(per100?.fat || 0);
  const fib = Number(per100?.fiber || 0);
  const kcal = Number(per100?.kcal || 0);
  const macroLead =
    p >= c && p >= f ? 'profil plutôt protéiné' : c >= p && c >= f ? 'profil plutôt glucidique' : 'profil plutôt lipidique';
  const fiberHint = fib >= 5 ? 'apport intéressant en fibres' : 'fibres modérées';
  const vitaminC = Number(micro?.vitaminC || 0);
  const vitaminD = Number(micro?.vitaminD || 0);
  const iron = Number(micro?.iron || 0);
  const potassium = Number(micro?.potassium || 0);
  const microHints = [];
  if (vitaminC > 0) microHints.push(`vitamine C (${vitaminC} mg)`);
  if (vitaminD > 0) microHints.push(`vitamine D (${vitaminD} µg)`);
  if (iron > 0) microHints.push(`fer (${iron} mg)`);
  if (potassium > 0) microHints.push(`potassium (${potassium} mg)`);
  const microPart = microHints.length ? `Micros clés : ${microHints.join(', ')}.` : 'Micros non significatifs sur cette référence.';
  return `${name} : ${base} Par ${u}, ${kcal} kcal, ${macroLead}, ${fiberHint}. ${microPart}`;
}

function microTemplateByCategory(category) {
  const common = { calcium: 30, iron: 1, magnesium: 20, potassium: 180, sodium: 35, zinc: 0.7 };
  const cat = {
    Légumes: { vitaminA: 120, vitaminC: 28, vitaminK: 80, folate: 65, ...common, potassium: 260 },
    Fruits: { vitaminA: 35, vitaminC: 24, vitaminE: 0.5, folate: 30, ...common, potassium: 190 },
    Poissons: { vitaminD: 3.5, vitaminB12: 2.4, vitaminB6: 0.5, ...common, sodium: 80, zinc: 1.1 },
    Viandes: { vitaminB12: 1.3, vitaminB6: 0.45, iron: 2, zinc: 2.6, magnesium: 24, potassium: 310, sodium: 70, calcium: 18 },
    'Produits laitiers': { calcium: 120, vitaminB12: 0.5, vitaminA: 45, potassium: 160, sodium: 55, magnesium: 11, iron: 0.1, zinc: 0.5 },
    Féculents: { vitaminB6: 0.15, folate: 24, magnesium: 34, potassium: 130, sodium: 10, calcium: 22, iron: 0.8, zinc: 0.6 },
    'Fruits à coque': { vitaminE: 6, magnesium: 140, potassium: 430, calcium: 90, iron: 2.2, zinc: 2, sodium: 8, folate: 45 },
    Graines: { vitaminE: 4, magnesium: 180, potassium: 420, calcium: 100, iron: 4, zinc: 3, sodium: 8, folate: 55 },
    Boissons: { vitaminC: 6, potassium: 95, sodium: 15, calcium: 20, iron: 0.1, magnesium: 8, zinc: 0.1 },
    Compléments: { vitaminB6: 0.4, vitaminB12: 0.8, magnesium: 40, potassium: 180, calcium: 60, sodium: 55, iron: 1, zinc: 1.2 }
  };
  return cat[category] || common;
}

function unitHintsForFood(category, referenceUnit, piece) {
  const out = [referenceUnit];
  if (piece) out.push('piece');
  if (
    category === 'Assaisonnements' ||
    category === 'Mat. grasses' ||
    category === 'Compléments' ||
    category === 'Graines' ||
    category === 'Sucres'
  ) {
    out.push('tbsp', 'tsp');
  }
  return [...new Set(out)];
}

function buildItems() {
  /** @type {NutritionBankFood[]} */
  const out = [];
  const limit = Math.min(RAW.length, NUTRITION_FOOD_BANK_ACTIVE_COUNT);
  for (let i = 0; i < limit; i++) {
    const row = RAW[i];
    const [
      name,
      category,
      kcal,
      p,
      c,
      f,
      fib,
      unit = 'g',
      pieceG,
      pieceLabel
    ] = row;
    const id = `nb_${String(i + 1).padStart(3, '0')}`;
    const item = {
      id,
      key: normalizeFoodKey(`${category}_${name}`),
      name,
      category,
      referenceAmount: 100,
      referenceUnit: unit,
      per100: {
        kcal: Math.round(kcal),
        protein: Math.round(p * 10) / 10,
        carbs: Math.round(c * 10) / 10,
        fat: Math.round(f * 10) / 10,
        fiber: Math.round(fib * 10) / 10
      },
      microPer100: microTemplateByCategory(category)
    };
    item.description = descriptionForFood(name, category, unit, item.per100, item.microPer100);
    if (pieceG && pieceLabel) {
      item.piece = { label: pieceLabel, grams: Number(pieceG) };
    }
    out.push(item);
  }
  return out;
}

export const NUTRITION_FOOD_BANK_VERSION = 4;
export const NUTRITION_FOOD_BANK_ITEMS = buildItems();

/** Catégories uniques pour filtres UI */
export const NUTRITION_FOOD_BANK_CATEGORIES = [...new Set(NUTRITION_FOOD_BANK_ITEMS.map((x) => x.category))].sort(
  (a, b) => a.localeCompare(b, 'fr')
);

export function findBankFoodById(id) {
  return NUTRITION_FOOD_BANK_ITEMS.find((f) => f.id === id) || null;
}

export function mergeFoodBankWithOverrides(items, overrides) {
  const map = overrides && typeof overrides === 'object' ? overrides : {};
  return (items || []).map((food) => {
    const ov = map[food.id];
    if (!ov || typeof ov !== 'object') return food;
    return {
      ...food,
      description: typeof ov.description === 'string' ? ov.description : food.description,
      per100: {
        ...food.per100,
        ...(ov.per100 || {})
      },
      microPer100: {
        ...(food.microPer100 || {}),
        ...(ov.microPer100 || {})
      }
    };
  });
}

export function findBankFoodByIdWithOverrides(id, overrides) {
  const base = findBankFoodById(id);
  if (!base) return null;
  const ov = overrides && typeof overrides === 'object' ? overrides[id] : null;
  if (!ov || typeof ov !== 'object') return base;
  return {
    ...base,
    description: typeof ov.description === 'string' ? ov.description : base.description,
    per100: {
      ...base.per100,
      ...(ov.per100 || {})
    },
    microPer100: {
      ...(base.microPer100 || {}),
      ...(ov.microPer100 || {})
    }
  };
}

export function getFoodUnitHints(foodOrId) {
  const food = typeof foodOrId === 'string' ? findBankFoodById(foodOrId) : foodOrId;
  if (!food) return ['g'];
  return unitHintsForFood(food.category, food.referenceUnit || 'g', food.piece);
}

export function nutrientTotalsForGrams(per100, grams) {
  const r = grams / 100;
  return {
    kcal: Math.round(per100.kcal * r),
    protein: Math.round(per100.protein * r * 10) / 10,
    carbs: Math.round(per100.carbs * r * 10) / 10,
    fat: Math.round(per100.fat * r * 10) / 10,
    fiber: Math.round(per100.fiber * r * 10) / 10
  };
}
