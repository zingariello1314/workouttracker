# Fix: Input Component containerClassName Warning

## Problème

Lors de la navigation vers l'onglet Livres, une erreur React apparaissait dans la console:

```
Warning: React does not recognize the `containerClassName` prop on a DOM element. 
If you intentionally want it to appear in the DOM as a custom attribute, spell it as 
lowercase `containerclassname` instead. If you accidentally passed it from a parent 
component, remove it from the DOM element.
```

## Cause

Le composant `Input` (`src/components/ui/Input.jsx`) ne déclarait pas la prop `containerClassName` dans ses paramètres, ce qui causait React à essayer de la passer directement à l'élément DOM `<input>`, ce qui n'est pas valide.

Le composant `BooksTab` utilisait cette prop:
```jsx
<Input
  value={search}
  onChange={(e) => setSearch(e.target.value)}
  containerClassName="space-y-2"  // ❌ Prop non reconnue
/>
```

## Solution

Ajout du support de la prop `containerClassName` au composant Input:

### 1. Ajout du paramètre dans la signature de la fonction

```jsx
const Input = ({
  label,
  error,
  helperText,
  icon,
  iconPosition = 'left',
  variant = 'default',
  size = 'md',
  fullWidth = true,
  className = '',
  containerClassName = '',  // ✅ Nouveau paramètre
  ...props
}) => {
```

### 2. Application de la classe au conteneur

```jsx
return (
  <div className={`${fullWidth ? 'w-full' : ''} ${containerClassName}`}>
    {/* ... reste du composant */}
  </div>
);
```

## Résultat

✅ L'avertissement React a disparu  
✅ La prop `containerClassName` est maintenant correctement gérée  
✅ Le composant Input peut recevoir des classes CSS personnalisées pour son conteneur  
✅ Aucun impact sur les autres utilisations du composant Input  

## Fichiers Modifiés

- `src/components/ui/Input.jsx` - Ajout du support de `containerClassName`

## Test

Pour vérifier que le fix fonctionne:
1. Naviguer vers l'onglet Livres
2. Ouvrir la console du navigateur
3. Vérifier qu'aucun avertissement React n'apparaît
4. Vérifier que le champ de recherche fonctionne correctement

## Note

Cette prop `containerClassName` permet de personnaliser le style du conteneur externe du composant Input, ce qui est utile pour ajuster l'espacement et la disposition dans différents contextes d'utilisation.
