🎯 ANALYSE & CONCEPTION - SYSTÈME D'EXERCICES ADAPTATIFS
📊 COMPRÉHENSION DU BESOIN
Situation Actuelle
Vous avez un système rigide :

Programme fixe affiché chaque jour
Impossible de modifier ponctuellement sans casser le programme
Onglet "Saisie" montre TOUS les exercices de TOUTES les dates
Confusion visuelle : exercices exceptionnels noyés dans la masse

Besoin Exprimé
Système flexible et contextuel :

Supprimer des exercices prévus (uniquement pour aujourd'hui)
Ajouter des exercices exceptionnels (avec séries/reps OU durée)
Préserver le programme (semaine suivante = programme original intact)
Distinction visuelle claire dans l'historique (exercices du programme vs exceptionnels)


💎 SOLUTION ARCHITECTURALE PROFESSIONNELLE
Concept : Système de Variations Journalières
Programme de Base (immuable)
    ↓
Variations du Jour (éphémères)
    ├─ Suppressions contextuelles
    ├─ Ajouts exceptionnels
    └─ Modifications temporaires
    ↓
Vue Finale Utilisateur

🏗️ ARCHITECTURE DE DONNÉES
Structure Proposée
typescriptinterface DailyVariation {
  date: string; // "2024-11-04"
  
  // Exercices du programme supprimés pour ce jour uniquement
  suppressedExercises: number[]; // [101, 102] (IDs exercices)
  
  // Exercices exceptionnels ajoutés
  additionalExercises: AdditionalExercise[];
  
  // Métadonnées
  reason?: string; // "Salle au lieu de maison"
  createdAt: Date;
}

interface AdditionalExercise {
  id: string; // "temp_20241104_001" (ID temporaire)
  name: string;
  type: 'reps' | 'duration'; // Choix entre reps ou temps
  
  // Pour type 'reps'
  series?: number; // 4
  repsPerSeries?: number[]; // [12, 10, 10, 8] ou [12] si toutes pareilles
  
  // Pour type 'duration'
  duration?: number; // secondes
  
  // Métadonnées
  materiel?: string;
  notes?: string;
  isExceptional: true; // Flag important pour l'historique
  addedAt: Date;
}
Exemple Concret de Votre Cas
javascript// 4 novembre 2024 - Vous allez à la salle
const todayVariation = {
  date: "2024-11-04",
  reason: "Salle au lieu de maison",
  
  // Vous supprimez les pompes lestées (impossible sans gilet)
  suppressedExercises: [101], // ID pompes lestées
  
  // Vous ajoutez ce que vous avez fait à la salle
  additionalExercises: [
    {
      id: "temp_20241104_001",
      name: "Développé couché barre",
      type: "reps",
      series: 4,
      repsPerSeries: [12, 10, 10, 8],
      materiel: "Barre + banc",
      notes: "Bon ressenti",
      isExceptional: true,
      addedAt: new Date()
    },
    {
      id: "temp_20241104_002",
      name: "Pec deck",
      type: "reps",
      series: 3,
      repsPerSeries: [15, 12, 12],
      materiel: "Machine",
      isExceptional: true,
      addedAt: new Date()
    },
    {
      id: "temp_20241104_003",
      name: "Gainage planche",
      type: "duration",
      duration: 180, // 3 minutes
      notes: "3 x 60 secondes",
      isExceptional: true,
      addedAt: new Date()
    }
  ]
};

// Stockage dans IndexedDB
data.dailyVariations = {
  "2024-11-04": todayVariation,
  "2024-10-15": { ... } // Autres variations passées
};
```

---

## 🎨 INTERFACE UTILISATEUR - ONGLET "AUJOURD'HUI"

### **Wireframe Proposé**
```
┌─────────────────────────────────────────────────────┐
│  🔵 Mardi - Biceps/Pectoraux + Natation             │
│                                                      │
│  ⚙️ Mode: Maison  [Passer en mode Salle] ←─ Toggle │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│  📋 EXERCICES DU PROGRAMME                          │
├─────────────────────────────────────────────────────┤
│                                                      │
│  ✅ Pompes lestées              44 reps  ⚡ ❌      │
│     4×10-12 • gilet lesté                           │
│     ↳ Coché • Fait                                  │
│                                                      │
│  ⬜ Pompes inclinées sur support    Reps  ⚡ ❌     │
│     4×12 • support                                  │
│     ↳ [Supprimer pour aujourd'hui]  ←─ Nouveau     │
│                                                      │
│  ✅ Curl alterné                 30 reps  ⚡ ❌     │
│     3×10 par bras • haltère                         │
│                                                      │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│  ➕ EXERCICES EXCEPTIONNELS (aujourd'hui)   ←─ NEW │
├─────────────────────────────────────────────────────┤
│                                                      │
│  🏋️ Développé couché barre         48 reps  ⚡ 🗑️  │
│     4 séries : 12, 10, 10, 8 reps                   │
│     📌 Ajouté aujourd'hui (salle)                   │
│                                                      │
│  🏋️ Pec deck                       39 reps  ⚡ 🗑️  │
│     3 séries : 15, 12, 12 reps                      │
│     📌 Ajouté aujourd'hui (salle)                   │
│                                                      │
│  ⏱️ Gainage planche              3:00 min  ⚡ 🗑️  │
│     Durée totale                                    │
│     📌 Ajouté aujourd'hui                           │
│                                                      │
│  [+ Ajouter un exercice exceptionnel]   ←─ Button  │
│                                                      │
└─────────────────────────────────────────────────────┘
```

### **Modal d'Ajout d'Exercice Exceptionnel**
```
┌──────────────────────────────────────────────┐
│  ➕ Ajouter un exercice exceptionnel        │
├──────────────────────────────────────────────┤
│                                               │
│  Nom de l'exercice *                         │
│  [_________________________________]          │
│                                               │
│  Type d'exercice *                           │
│  ○ Répétitions    ● Durée (temps)           │
│                                               │
│  ┌─────────── Si Répétitions ──────────┐    │
│  │                                       │    │
│  │  Nombre de séries *                  │    │
│  │  [____]  (ex: 4)                     │    │
│  │                                       │    │
│  │  Répétitions par série               │    │
│  │  Série 1: [____] reps                │    │
│  │  Série 2: [____] reps                │    │
│  │  Série 3: [____] reps                │    │
│  │  Série 4: [____] reps                │    │
│  │                                       │    │
│  │  💡 Astuce: Si toutes les séries     │    │
│  │     ont le même nombre, remplissez   │    │
│  │     seulement la première            │    │
│  │                                       │    │
│  └───────────────────────────────────────┘    │
│                                               │
│  ┌──────────── Si Durée ────────────────┐    │
│  │                                       │    │
│  │  Durée totale                        │    │
│  │  [____] min [____] sec               │    │
│  │                                       │    │
│  │  ou                                   │    │
│  │                                       │    │
│  │  [____] secondes au total            │    │
│  │                                       │    │
│  └───────────────────────────────────────┘    │
│                                               │
│  Matériel (optionnel)                        │
│  [_________________________________]          │
│                                               │
│  Notes (optionnel)                           │
│  [_________________________________]          │
│  [_________________________________]          │
│                                               │
│  Raison de l'ajout (optionnel)              │
│  [_________________________________]          │
│                                               │
│  [Annuler]              [Ajouter] ✓          │
└──────────────────────────────────────────────┘

📊 ONGLET "SAISIE" - DISTINCTION VISUELLE
Problème Identifié
Actuellement, l'historique mélange :

Exercices du programme réguliers
Exercices exceptionnels ponctuels
→ Confusion totale

Solution : Indicateurs Visuels Clairs
typescript// Dans l'onglet Saisie/Historique
┌─────────────────────────────────────────────────────┐
│  📅 Mardi 28/10/2024                                │
├─────────────────────────────────────────────────────┤
│                                                      │
│  📘 Pompes lestées        [Principal]    48 reps    │
│     4×10-12 • Programme régulier                    │
│                                                      │
│  📘 Pompes inclinées      [Principal]    48 reps    │
│     4×12 • Programme régulier                       │
│                                                      │
│  📘 Curl alterné          [Principal]    30 reps    │
│     3×10 • Programme régulier                       │
│                                                      │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│  📅 Mardi 04/11/2024                                │
├─────────────────────────────────────────────────────┤
│                                                      │
│  📘 Pompes lestées        [Principal]    44 reps    │
│     4×10-12 • Programme régulier                    │
│                                                      │
│  ⚠️ Pompes inclinées      [Supprimé]     -- reps   │
│     Raison: Salle sans support                      │
│                                                      │
│  📘 Curl alterné          [Principal]    30 reps    │
│     3×10 • Programme régulier                       │
│                                                      │
│  ──────────────────────────────────────────────     │
│                                                      │
│  ⭐ Développé couché      [Exceptionnel] 48 reps    │
│     4 séries (12,10,10,8) • Ajouté à la salle      │
│                                                      │
│  ⭐ Pec deck              [Exceptionnel] 39 reps    │
│     3 séries (15,12,12) • Ajouté à la salle        │
│                                                      │
│  ⭐ Gainage planche       [Exceptionnel] 3:00 min   │
│     Durée • Ajouté à la salle                       │
│                                                      │
└─────────────────────────────────────────────────────┘
Légende Visuelle
BadgeCouleurSignification📘 PrincipalBleuExercice du programme régulier⭐ ExceptionnelOr/JauneAjouté ponctuellement ce jour⚠️ SuppriméRouge/GrisExercice prévu mais non fait🔄 RemplacéOrangeExercice substitué (future feature)

🔧 IMPLÉMENTATION TECHNIQUE
1. Logique de Rendu de la Liste d'Exercices
typescript// hooks/useTodayExercises.ts
import { useMemo } from 'react';

interface UseTodayExercisesResult {
  programExercises: Exercise[];
  additionalExercises: AdditionalExercise[];
  suppressedExerciseIds: number[];
}

export const useTodayExercises = (
  date: Date,
  isGymMode: boolean
): UseTodayExercisesResult => {
  
  const { data, getTodayWorkout } = useWorkout();
  const dateStr = getDateStr(date);
  
  // 1. Récupérer le programme de base
  const baseWorkout = getTodayWorkout(date, isGymMode);
  
  // 2. Récupérer les variations du jour
  const dailyVariation = data.dailyVariations?.[dateStr];
  
  return useMemo(() => {
    // 3. Filtrer les exercices supprimés
    const programExercises = baseWorkout.exercices.filter(
      ex => !dailyVariation?.suppressedExercises?.includes(ex.id)
    );
    
    // 4. Ajouter les exercices exceptionnels
    const additionalExercises = dailyVariation?.additionalExercises || [];
    
    return {
      programExercises,
      additionalExercises,
      suppressedExerciseIds: dailyVariation?.suppressedExercises || []
    };
  }, [baseWorkout, dailyVariation, dateStr]);
};
2. Composant de Liste d'Exercices
typescript// components/TodayExercisesList.tsx
const TodayExercisesList = () => {
  const { programExercises, additionalExercises } = useTodayExercises(
    new Date(),
    isGymMode
  );
  
  const [showAddModal, setShowAddModal] = useState(false);
  
  return (
    <>
      {/* Exercices du Programme */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="w-5 h-5" />
            Exercices du Programme
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {programExercises.map(exercise => (
            <ProgramExerciseItem
              key={exercise.id}
              exercise={exercise}
              onSuppressForToday={handleSuppressExercise}
            />
          ))}
        </CardContent>
      </Card>
      
      {/* Exercices Exceptionnels */}
      {(additionalExercises.length > 0 || showAddModal) && (
        <Card className="border-yellow-500/30 bg-yellow-500/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="w-5 h-5 text-yellow-500" />
              Exercices Exceptionnels (aujourd'hui uniquement)
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Ces exercices ne sont ajoutés que pour aujourd'hui et 
              n'affecteront pas votre programme régulier
            </p>
          </CardHeader>
          <CardContent className="space-y-3">
            {additionalExercises.map(exercise => (
              <AdditionalExerciseItem
                key={exercise.id}
                exercise={exercise}
                onRemove={handleRemoveAdditional}
              />
            ))}
            
            <Button
              variant="outline"
              className="w-full border-dashed"
              onClick={() => setShowAddModal(true)}
            >
              <Plus className="w-4 h-4 mr-2" />
              Ajouter un exercice exceptionnel
            </Button>
          </CardContent>
        </Card>
      )}
      
      {/* Modal d'ajout */}
      <AddExceptionalExerciseModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onAdd={handleAddExercise}
      />
    </>
  );
};
3. Item d'Exercice du Programme avec Suppression
typescript// components/ProgramExerciseItem.tsx
const ProgramExerciseItem = ({ exercise, onSuppressForToday }) => {
  const [showSuppressConfirm, setShowSuppressConfirm] = useState(false);
  
  return (
    <div className="p-4 border rounded-lg hover:bg-accent/50 transition">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          {/* Infos exercice standard */}
          <div className="flex items-center gap-2">
            <Checkbox id={`ex-${exercise.id}`} />
            <label htmlFor={`ex-${exercise.id}`} className="font-medium">
              {exercise.name}
            </label>
            <Badge variant="outline" className="text-xs">
              Principal
            </Badge>
          </div>
          
          <p className="text-sm text-muted-foreground mt-1">
            {exercise.series} • {exercise.materiel}
          </p>
          
          {/* Input reps */}
          <Input
            type="number"
            placeholder="Reps"
            className="mt-2 w-24"
          />
        </div>
        
        {/* Actions */}
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon">
            <Zap className="w-4 h-4" />
          </Button>
          
          {/* Bouton supprimer pour aujourd'hui */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                className="text-destructive"
                onClick={() => setShowSuppressConfirm(true)}
              >
                <XCircle className="w-4 h-4 mr-2" />
                Supprimer pour aujourd'hui
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      
      {/* Dialog de confirmation */}
      <AlertDialog 
        open={showSuppressConfirm} 
        onOpenChange={setShowSuppressConfirm}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Supprimer "{exercise.name}" aujourd'hui ?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Cet exercice sera masqué uniquement pour aujourd'hui.
              Il réapparaîtra normalement lors de votre prochaine
              séance {getDayName(new Date())}.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => onSuppressForToday(exercise.id)}
            >
              Confirmer la suppression
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
4. Modal d'Ajout d'Exercice Exceptionnel
typescript// components/AddExceptionalExerciseModal.tsx
const AddExceptionalExerciseModal = ({ isOpen, onClose, onAdd }) => {
  const [exerciseType, setExerciseType] = useState<'reps' | 'duration'>('reps');
  const [seriesCount, setSeriesCount] = useState(3);
  const [repsPerSeries, setRepsPerSeries] = useState<number[]>([]);
  
  const handleSeriesCountChange = (count: number) => {
    setSeriesCount(count);
    // Initialiser le tableau de reps
    setRepsPerSeries(new Array(count).fill(0));
  };
  
  const handleSubmit = () => {
    const exercise: AdditionalExercise = {
      id: `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: form.name,
      type: exerciseType,
      isExceptional: true,
      addedAt: new Date(),
      
      ...(exerciseType === 'reps' ? {
        series: seriesCount,
        repsPerSeries: repsPerSeries
      } : {
        duration: form.durationSeconds
      }),
      
      materiel: form.materiel,
      notes: form.notes
    };
    
    onAdd(exercise);
    onClose();
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Ajouter un exercice exceptionnel</DialogTitle>
          <DialogDescription>
            Cet exercice sera ajouté uniquement pour aujourd'hui
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          {/* Nom */}
          <div>
            <Label htmlFor="name">Nom de l'exercice *</Label>
            <Input
              id="name"
              placeholder="Ex: Développé couché barre"
              required
            />
          </div>
          
          {/* Type Toggle */}
          <div>
            <Label>Type d'exercice *</Label>
            <Tabs value={exerciseType} onValueChange={setExerciseType}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="reps">
                  <Hash className="w-4 h-4 mr-2" />
                  Répétitions
                </TabsTrigger>
                <TabsTrigger value="duration">
                  <Clock className="w-4 h-4 mr-2" />
                  Durée
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
          
          {/* Répétitions */}
          {exerciseType === 'reps' && (
            <>
              <div>
                <Label htmlFor="series">Nombre de séries *</Label>
                <Input
                  id="series"
                  type="number"
                  min={1}
                  max={10}
                  value={seriesCount}
                  onChange={(e) => handleSeriesCountChange(parseInt(e.target.value))}
                />
              </div>
              
              <div>
                <Label>Répétitions par série</Label>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {Array.from({ length: seriesCount }).map((_, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground w-16">
                        Série {idx + 1}:
                      </span>
                      <Input
                        type="number"
                        min={1}
                        placeholder="Reps"
                        value={repsPerSeries[idx] || ''}
                        onChange={(e) => {
                          const newReps = [...repsPerSeries];
                          newReps[idx] = parseInt(e.target.value) || 0;
                          setRepsPerSeries(newReps);
                        }}
                      />
                    </div>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  💡 Si toutes les séries ont le même nombre de reps, 
                  remplissez seulement la première
                </p>
              </div>
            </>
          )}
          
          {/* Durée */}
          {exerciseType === 'duration' && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="minutes">Minutes</Label>
                <Input
                  id="minutes"
                  type="number"
                  min={0}
                  placeholder="0"
                />
              </div>
              <div>
                <Label htmlFor="seconds">Secondes</Label>
                <Input
                  id="seconds"
                  type="number"
                  min={0}
                  max={59}
                  placeholder="0"
                />
              </div>
            </div>
          )}
          
          {/* Matériel */}
          <div>
            <Label htmlFor="materiel">Matériel (optionnel)</Label>
            <Input
              id="materiel"
              placeholder="Ex: Barre + banc"
            />
          </div>
          
          {/* Notes */}
          <div>
            <Label htmlFor="notes">Notes (optionnel)</Label>
            <Textarea
              id="notes"
              placeholder="Ressenti, observations..."
              rows={3}
            />
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Annuler
          </Button>
          <Button onClick={handleSubmit}>
            <Plus className="w-4 h-4 mr-2" />
            Ajouter
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

📊 MODIFICATIONS DE L'ONGLET "SAISIE"
Filtre et Légende
typescript// components/HistoryFilter.tsx
const HistoryFilter = () => {
  const [filter, setFilter] = useState<'all' | 'program' | 'exceptional' | 'suppressed'>('all');
  
  return (
    <div className="space-y-4">
      {/* Filtres */}
      <div className="flex items-center gap-2">
        <Label>Afficher :</Label>
        <ToggleGroup type="single" value={filter} onValueChange={setFilter}>
          <ToggleGroupItem value="all">
            Tous
          </ToggleGroupItem>
          <ToggleGroupItem value="program">
            <BookOpen className="w-4 h-4 mr-2" />
            Programme
          </ToggleGroupItem>
          <ToggleGroupItem value="exceptional">
            <Star className="w-4 h-4 mr-2" />
            Exceptionnels
          </ToggleGroupItem>
          <ToggleGroupItem value="suppressed">
            <XCircle className="w-4 h-4 mr-2" />
            Supprimés
          </ToggleGroupItem>
        </ToggleGroup>
      </div>
      
      {/* Légende */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Légende</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="bg-blue-500/10">
              Principal
            </Badge>
            <span className="text-muted-foreground">
              Exercice du programme régulier
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="bg-yellow-500/10">
              Exceptionnel
            </Badge>
            <span className="text-muted-foreground">
              Ajouté ponctuellement ce jour
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="bg-red-500/10">
              Supprimé
            </Badge>
            <span className="text-muted-foreground">
              Exercice prévu mais non effectué
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
Rendu de l'Historique avec Distinction
typescript// components/HistoryExerciseItem.tsx
const HistoryExerciseItem = ({ exercise, date }) => {
  const { data } = useWorkout();
  const dateStr = getDateStr(date);
  const variation = data.dailyVariations?.[dateStr];
  
  // Déterminer le type d'exercice
  const isExceptional = exercise.isExceptional === true;
  const isSuppressed = variation?.suppressedExercises?.includes(exercise.id);
  
  const getBadgeVariant = () => {
    if (isSuppressed) return { label: 'Supprimé', className: 'bg-red-500/10 text-red-500' };
    if (isExceptional) return { label: 'Exceptionnel', className: 'bg-yellow-500/10 text-yellow-500' };
    return { label: 'Principal', className: 'bg-blue-500/10 text-blue-500' };
  };
  
  const badge = getBadgeVariant();
  
  return (
    <div className={cn(
      "p-3 border rounded-lg",
      isSuppressed && "opacity-50 bg-red-500/5"
    )}>
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            {isExceptional && <Star className="w-4 h-4 text-yellow-500" />}
            {isSuppressed && <XCircle className="w-4 h-4 text-red-500" />}
              <span className={cn(
              "font-medium",
              isSuppressed && "line-through"
            )}>
              {exercise.name}
            </span>
            <Badge variant="outline" className={badge.className}>
              {badge.label}
            </Badge>
          </div>
          
          <div className="text-sm text-muted-foreground mt-1">
            {!isSuppressed ? (
              <>
                {exercise.type === 'duration' ? (
                  <span>{formatDuration(exercise.duration)}</span>
                ) : (
                  <span>
                    {exercise.series} séries • {getTotalReps(exercise)} reps
                    {exercise.repsPerSeries && 
                      ` (${exercise.repsPerSeries.join(', ')})`
                    }
                  </span>
                )}
                {exercise.materiel && ` • ${exercise.materiel}`}
              </>
            ) : (
              <span className="italic">
                Non effectué • {variation?.reason || 'Supprimé ce jour'}
              </span>
            )}
          </div>
          
          {/* Notes pour exercices exceptionnels */}
          {isExceptional && exercise.notes && (
            <p className="text-xs text-muted-foreground mt-2 italic">
              📝 {exercise.notes}
            </p>
          )}
        </div>
        
        {/* Statistiques rapides */}
        {!isSuppressed && (
          <div className="text-right">
            <div className="text-2xl font-bold">
              {exercise.type === 'duration' 
                ? formatDuration(exercise.duration)
                : getTotalReps(exercise)
              }
            </div>
            <div className="text-xs text-muted-foreground">
              {exercise.type === 'duration' ? 'durée' : 'reps'}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

🔄 LOGIQUE DE SAUVEGARDE ET SYNCHRONISATION
Actions du Context
typescript// context/WorkoutContext.tsx - Nouvelles actions

// 1. Supprimer un exercice pour aujourd'hui
const suppressExerciseForToday = async (exerciseId: number, reason?: string) => {
  const dateStr = getDateStr(new Date());
  
  const updatedVariations = {
    ...data.dailyVariations,
    [dateStr]: {
      ...data.dailyVariations?.[dateStr],
      date: dateStr,
      suppressedExercises: [
        ...(data.dailyVariations?.[dateStr]?.suppressedExercises || []),
        exerciseId
      ],
      reason: reason || data.dailyVariations?.[dateStr]?.reason,
      createdAt: data.dailyVariations?.[dateStr]?.createdAt || new Date()
    }
  };
  
  await updateData({ 
    dailyVariations: updatedVariations 
  });
  
  toast.success('Exercice supprimé pour aujourd\'hui', {
    description: 'Il réapparaîtra lors de votre prochaine séance'
  });
};

// 2. Restaurer un exercice supprimé
const restoreExerciseForToday = async (exerciseId: number) => {
  const dateStr = getDateStr(new Date());
  const currentVariation = data.dailyVariations?.[dateStr];
  
  if (!currentVariation) return;
  
  const updatedVariations = {
    ...data.dailyVariations,
    [dateStr]: {
      ...currentVariation,
      suppressedExercises: currentVariation.suppressedExercises.filter(
        id => id !== exerciseId
      )
    }
  };
  
  await updateData({ 
    dailyVariations: updatedVariations 
  });
  
  toast.success('Exercice restauré');
};

// 3. Ajouter un exercice exceptionnel
const addExceptionalExercise = async (exercise: Omit<AdditionalExercise, 'id' | 'isExceptional' | 'addedAt'>) => {
  const dateStr = getDateStr(new Date());
  
  const newExercise: AdditionalExercise = {
    ...exercise,
    id: `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    isExceptional: true,
    addedAt: new Date()
  };
  
  const updatedVariations = {
    ...data.dailyVariations,
    [dateStr]: {
      ...data.dailyVariations?.[dateStr],
      date: dateStr,
      suppressedExercises: data.dailyVariations?.[dateStr]?.suppressedExercises || [],
      additionalExercises: [
        ...(data.dailyVariations?.[dateStr]?.additionalExercises || []),
        newExercise
      ],
      createdAt: data.dailyVariations?.[dateStr]?.createdAt || new Date()
    }
  };
  
  await updateData({ 
    dailyVariations: updatedVariations 
  });
  
  toast.success('Exercice exceptionnel ajouté', {
    description: 'Visible uniquement pour aujourd\'hui'
  });
  
  return newExercise.id;
};

// 4. Supprimer un exercice exceptionnel
const removeExceptionalExercise = async (exerciseId: string) => {
  const dateStr = getDateStr(new Date());
  const currentVariation = data.dailyVariations?.[dateStr];
  
  if (!currentVariation) return;
  
  const updatedVariations = {
    ...data.dailyVariations,
    [dateStr]: {
      ...currentVariation,
      additionalExercises: currentVariation.additionalExercises.filter(
        ex => ex.id !== exerciseId
      )
    }
  };
  
  await updateData({ 
    dailyVariations: updatedVariations 
  });
  
  toast.success('Exercice exceptionnel supprimé');
};

// 5. Valider un exercice exceptionnel (cocher/reps)
const updateExceptionalExercise = async (
  exerciseId: string, 
  updates: { checked?: boolean; actualReps?: number[] }
) => {
  const dateStr = getDateStr(new Date());
  
  // Stocker dans la structure de tracking habituelle
  if (updates.checked !== undefined) {
    const key = `${dateStr}_${exerciseId}`;
    await updateData({
      checkedExercises: {
        ...data.checkedExercises,
        [key]: updates.checked
      }
    });
  }
  
  if (updates.actualReps) {
    const key = `${dateStr}_${exerciseId}`;
    const totalReps = updates.actualReps.reduce((sum, r) => sum + r, 0);
    await updateData({
      reps: {
        ...data.reps,
        [key]: totalReps.toString()
      }
    });
  }
};

📈 ANALYTICS & INSIGHTS
Statistiques Enrichies
Avec ce système, vous pouvez générer des insights puissants :
typescript// utils/workoutAnalytics.ts

// 1. Taux d'adaptations du programme
export const getAdaptationRate = (data: WorkoutData, period: 'week' | 'month') => {
  const variations = Object.values(data.dailyVariations || {});
  const daysWithVariations = variations.filter(v => 
    v.suppressedExercises.length > 0 || v.additionalExercises.length > 0
  ).length;
  
  return {
    adaptationRate: (daysWithVariations / variations.length) * 100,
    mostSuppressedExercises: getMostSuppressedExercises(data),
    mostAddedExercises: getMostAddedExercises(data)
  };
};

// 2. Exercices les plus substitués (insight business)
export const getMostSuppressedExercises = (data: WorkoutData) => {
  const suppressionCount: Record<number, number> = {};
  
  Object.values(data.dailyVariations || {}).forEach(variation => {
    variation.suppressedExercises.forEach(id => {
      suppressionCount[id] = (suppressionCount[id] || 0) + 1;
    });
  });
  
  return Object.entries(suppressionCount)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([id, count]) => ({
      exerciseId: parseInt(id),
      suppressionCount: count,
      // Récupérer les infos depuis workoutProgram
      exerciseName: getExerciseName(parseInt(id))
    }));
};

// 3. Raisons d'adaptation les plus courantes
export const getAdaptationReasons = (data: WorkoutData) => {
  const reasons: Record<string, number> = {};
  
  Object.values(data.dailyVariations || {}).forEach(variation => {
    if (variation.reason) {
      reasons[variation.reason] = (reasons[variation.reason] || 0) + 1;
    }
  });
  
  return Object.entries(reasons)
    .sort(([, a], [, b]) => b - a)
    .map(([reason, count]) => ({ reason, count }));
};

// 4. Widget Dashboard
const AdaptationInsights = () => {
  const { data } = useWorkout();
  const stats = getAdaptationRate(data, 'month');
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Flexibilité du Programme</CardTitle>
        <CardDescription>
          Analyse de vos adaptations ce mois-ci
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Taux d'adaptation</span>
              <span className="text-2xl font-bold">
                {stats.adaptationRate.toFixed(0)}%
              </span>
            </div>
            <Progress value={stats.adaptationRate} />
            <p className="text-xs text-muted-foreground mt-1">
              {stats.adaptationRate < 20 
                ? "Vous suivez très fidèlement votre programme"
                : stats.adaptationRate < 50
                ? "Vous adaptez occasionnellement votre programme"
                : "Vous personnalisez fréquemment vos séances"
              }
            </p>
          </div>
          
          {stats.mostSuppressedExercises.length > 0 && (
            <div>
              <h4 className="text-sm font-medium mb-2">
                Exercices les plus supprimés
              </h4>
              <div className="space-y-2">
                {stats.mostSuppressedExercises.map(({ exerciseName, suppressionCount }) => (
                  <div key={exerciseName} className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{exerciseName}</span>
                    <Badge variant="outline">{suppressionCount}×</Badge>
                  </div>
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                💡 Peut-être faudrait-il ajuster votre programme de base ?
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

🎯 FEATURES AVANCÉES (PHASE 2)
1. Templates d'Exercices Exceptionnels
typescript// Sauvegarder des "quick adds" fréquents
interface ExerciseTemplate {
  id: string;
  name: string;
  type: 'reps' | 'duration';
  defaultSeries?: number;
  defaultReps?: number;
  materiel?: string;
  usageCount: number; // Pour trier par popularité
}

// Exemple
const templates: ExerciseTemplate[] = [
  {
    id: 'tpl_dev_couche',
    name: 'Développé couché barre',
    type: 'reps',
    defaultSeries: 4,
    defaultReps: 10,
    materiel: 'Barre + banc',
    usageCount: 15
  },
  {
    id: 'tpl_pec_deck',
    name: 'Pec deck',
    type: 'reps',
    defaultSeries: 3,
    defaultReps: 12,
    materiel: 'Machine',
    usageCount: 8
  }
];

// Dans la modal d'ajout
<div>
  <Label>Modèles rapides</Label>
  <div className="grid grid-cols-2 gap-2 mt-2">
    {templates.sort((a, b) => b.usageCount - a.usageCount).map(template => (
      <Button
        key={template.id}
        variant="outline"
        size="sm"
        onClick={() => fillFromTemplate(template)}
      >
        {template.name}
      </Button>
    ))}
  </div>
</div>
2. Substitution Intelligente
typescript// Au lieu de supprimer + ajouter, proposer de substituer
interface ExerciseSubstitution {
  originalId: number;
  substituteExercise: AdditionalExercise;
  reason: string;
}

// UI
<Button 
  variant="ghost" 
  onClick={() => openSubstituteModal(exercise)}
>
  <Repeat className="w-4 h-4 mr-2" />
  Remplacer cet exercice
</Button>

// Modal intelligente qui suggère des alternatives
const SubstituteModal = ({ originalExercise }) => {
  // Suggestions basées sur le focus musculaire
  const suggestions = getSimilarExercises(originalExercise);
  
  return (
    <Dialog>
      <DialogHeader>
        <DialogTitle>
          Remplacer "{originalExercise.name}"
        </DialogTitle>
        <DialogDescription>
          Exercices similaires recommandés (même groupe musculaire)
        </DialogDescription>
      </DialogHeader>
      
      <div className="space-y-2">
        {suggestions.map(suggestion => (
          <Card 
            key={suggestion.id}
            className="cursor-pointer hover:bg-accent"
            onClick={() => handleSubstitute(suggestion)}
          >
            <CardContent className="p-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{suggestion.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {suggestion.series} • {suggestion.materiel}
                  </p>
                </div>
                <Badge variant="outline">
                  {suggestion.matchScore}% similaire
                </Badge>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      
      <div className="mt-4">
        <Label>Ou créer un substitut personnalisé</Label>
        <Input placeholder="Nom de l'exercice..." />
      </div>
    </Dialog>
  );
};
3. Mode "Programme Alternatif"
typescript// Pour les gens qui alternent régulièrement (ex: salle/maison)
interface AlternativeProgram {
  id: string;
  name: string; // "Programme Salle", "Programme Maison"
  icon: string;
  variations: Record<string, DailyVariation>; // Par jour de la semaine
}

// Toggle rapide
<ToggleGroup type="single" value={currentProgram}>
  <ToggleGroupItem value="default">
    <Home className="w-4 h-4 mr-2" />
    Maison
  </ToggleGroupItem>
  <ToggleGroupItem value="gym">
    <Dumbbell className="w-4 h-4 mr-2" />
    Salle
  </ToggleGroupItem>
  <ToggleGroupItem value="outdoor">
    <Trees className="w-4 h-4 mr-2" />
    Extérieur
  </ToggleGroupItem>
</ToggleGroup>

// Au lieu de variations ponctuelles, applique un preset complet
4. Export des Variations
typescript// Pour partager ou analyser
const exportVariations = () => {
  const variations = Object.entries(data.dailyVariations || {}).map(([date, variation]) => ({
    date,
    suppressedCount: variation.suppressedExercises.length,
    addedCount: variation.additionalExercises.length,
    reason: variation.reason,
    exercises: variation.additionalExercises.map(ex => ({
      name: ex.name,
      type: ex.type,
      ...(ex.type === 'reps' ? {
        totalReps: ex.repsPerSeries?.reduce((sum, r) => sum + r, 0)
      } : {
        duration: ex.duration
      })
    }))
  }));
  
  // CSV ou JSON
  downloadAsCSV(variations, 'variations-programme.csv');
};

🔍 GESTION DES EDGE CASES
Cas 1 : Exercice supprimé puis programme modifié
typescript// Que se passe-t-il si l'exercice n'existe plus dans le programme ?
const cleanupOrphanVariations = async () => {
  const allExerciseIds = getAllExerciseIdsFromProgram();
  
  Object.entries(data.dailyVariations || {}).forEach(([date, variation]) => {
    // Nettoyer les suppressions d'exercices qui n'existent plus
    const validSuppressed = variation.suppressedExercises.filter(
      id => allExerciseIds.includes(id)
    );
    
    if (validSuppressed.length !== variation.suppressedExercises.length) {
      // Mise à jour nécessaire
      updateDailyVariation(date, {
        ...variation,
        suppressedExercises: validSuppressed
      });
    }
  });
};
Cas 2 : Exercice exceptionnel répété plusieurs fois
typescript// Si user ajoute souvent le même exercice → suggérer de l'ajouter au programme
const detectFrequentExceptions = (data: WorkoutData) => {
  const exerciseCounts: Record<string, number> = {};
  
  Object.values(data.dailyVariations || {}).forEach(variation => {
    variation.additionalExercises.forEach(ex => {
      exerciseCounts[ex.name] = (exerciseCounts[ex.name] || 0) + 1;
    });
  });
  
  const frequent = Object.entries(exerciseCounts)
    .filter(([, count]) => count >= 4) // 4+ fois
    .map(([name, count]) => ({ name, count }));
  
  if (frequent.length > 0) {
    toast.info('💡 Suggestion', {
      description: `Vous ajoutez souvent "${frequent[0].name}". L'ajouter à votre programme de base ?`,
      action: {
        label: 'Ajouter au programme',
        onClick: () => addToPermanentProgram(frequent[0].name)
      }
    });
  }
};
Cas 3 : Conflit de synchronisation (multi-device)
typescript// Si user modifie depuis 2 appareils
const mergeVariations = (
  local: DailyVariation,
  remote: DailyVariation
): DailyVariation => {
  return {
    date: local.date,
    
    // Union des suppressions (si supprimé sur n'importe quel device)
    suppressedExercises: Array.from(new Set([
      ...local.suppressedExercises,
      ...remote.suppressedExercises
    ])),
    
    // Union des ajouts (garder les 2)
    additionalExercises: [
      ...local.additionalExercises,
      ...remote.additionalExercises.filter(
        remoteEx => !local.additionalExercises.some(
          localEx => localEx.name === remoteEx.name
        )
      )
    ],
    
    // Prendre la raison la plus récente
    reason: (local.createdAt > remote.createdAt) 
      ? local.reason 
      : remote.reason,
    
    createdAt: new Date(Math.max(
      local.createdAt.getTime(),
      remote.createdAt.getTime()
    ))
  };
};

📱 OPTIMISATION MOBILE
Gestures Intuitifs
typescript// Swipe pour supprimer/restaurer
import { useSwipeable } from 'react-swipeable';

const SwipeableExerciseItem = ({ exercise, onSuppress, onRestore }) => {
  const [swipeOffset, setSwipeOffset] = useState(0);
  
  const handlers = useSwipeable({
    onSwiping: (e) => {
      setSwipeOffset(e.deltaX);
    },
    onSwipedLeft: () => {
      if (Math.abs(swipeOffset) > 100) {
        onSuppress(exercise.id);
      }
      setSwipeOffset(0);
    },
    onSwipedRight: () => {
      if (Math.abs(swipeOffset) > 100 && exercise.isSuppressed) {
        onRestore(exercise.id);
      }
      setSwipeOffset(0);
    },
    trackMouse: true
  });
  
  return (
    <div
      {...handlers}
      style={{
        transform: `translateX(${swipeOffset}px)`,
        transition: swipeOffset === 0 ? 'transform 0.3s' : 'none'
      }}
      className="relative"
    >
      {/* Action révélée au swipe */}
      {Math.abs(swipeOffset) > 50 && (
        <div className={cn(
          "absolute inset-y-0 flex items-center px-4",
          swipeOffset < 0 ? "right-0 bg-red-500" : "left-0 bg-green-500"
        )}>
          {swipeOffset < 0 ? (
            <><XCircle className="w-5 h-5 mr-2" /> Supprimer</>
          ) : (
            <><CheckCircle className="w-5 h-5 mr-2" /> Restaurer</>
          )}
        </div>
      )}
      
      {/* Contenu de l'exercice */}
      <div className="bg-background">
        {/* ... */}
      </div>
    </div>
  );
};
Bouton d'Action Flottant (FAB)
typescript// Pour ajouter rapidement un exercice
const FloatingActionButton = () => {
  const [open, setOpen] = useState(false);
  
  return (
    <>
      <button
        className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center z-50 hover:scale-110 transition-transform"
        onClick={() => setOpen(true)}
      >
        <Plus className="w-6 h-6" />
      </button>
      
      <AddExceptionalExerciseModal
        isOpen={open}
        onClose={() => setOpen(false)}
      />
    </>
  );
};

🎨 POLISH & MICRO-INTERACTIONS
Animation de Suppression
typescriptimport { AnimatePresence, motion } from 'framer-motion';

const ExerciseList = ({ exercises, suppressedIds }) => {
  return (
    <AnimatePresence mode="popLayout">
      {exercises
        .filter(ex => !suppressedIds.includes(ex.id))
        .map(exercise => (
          <motion.div
            key={exercise.id}
            layout
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20, height: 0 }}
            transition={{ duration: 0.2 }}
          >
            <ExerciseItem exercise={exercise} />
          </motion.div>
        ))
      }
    </AnimatePresence>
  );
};
Badge avec Pulse pour Exercices Exceptionnels
typescriptconst ExceptionalBadge = () => (
  <Badge className="relative bg-yellow-500/10 text-yellow-500">
    <span className="absolute inset-0 animate-ping bg-yellow-500 opacity-20 rounded-full" />
    <Star className="w-3 h-3 mr-1" />
    Exceptionnel
  </Badge>
);
```

---

## 📊 RÉCAPITULATIF FINAL

### **Ce Que Ce Système Vous Apporte**

| Fonctionnalité | Avant | Après |
|----------------|-------|-------|
| **Flexibilité** | Programme rigide | Adaptation quotidienne |
| **Traçabilité** | Exercices perdus | Historique complet |
| **Clarté** | Confusion dans l'historique | Distinction visuelle claire |
| **UX** | Frustration | Fluidité et intuitivité |
| **Intelligence** | Aucune suggestion | Insights et recommandations |

### **Architecture de Données**
```
data: {
  // ✅ EXISTANT (préservé)
  checkedExercises: {...},
  reps: {...},
  checkedStretches: {...},
  enduranceData: {...},
  
  // 🆕 NOUVEAU
  dailyVariations: {
    "2024-11-04": {
      date: "2024-11-04",
      suppressedExercises: [101, 205],
      additionalExercises: [
        {
          id: "temp_...",
          name: "Développé couché",
          type: "reps",
          series: 4,
          repsPerSeries: [12, 10, 10, 8],
          isExceptional: true
        }
      ],
      reason: "Salle au lieu de maison",
      createdAt: Date
    }
  }
}
Complexité Ajoutée vs Valeur

Lignes de code : ~800 lignes nouvelles
Fichiers touchés : 5 fichiers
Breaking changes : 0 (rétro-compatible)
Valeur utilisateur : 🌟🌟🌟🌟🌟


🚀 PLAN D'IMPLÉMENTATION PROGRESSIF
Phase 1 - MVP (2-3 jours)

✅ Structure de données dailyVariations
✅ Actions Context (suppress, add, remove)
✅ UI basique (suppression + ajout simple)
✅ Distinction dans l'historique (badges)

Phase 2 - Polish (2 jours)

✅ Modal d'ajout complète (reps/durée)
✅ Animations et transitions
✅ Toast notifications
✅ Validation des inputs

Phase 3 - Advanced (3 jours)

✅ Templates d'exercices
✅ Analytics et insights
✅ Substitution intelligente
✅ Export des données


💬 CONCLUSION
Votre besoin est parfaitement légitime et reflète un usage réel d'une application de tracking. Le système que je vous propose :

✅ Résout votre problème : Adaptation sans casser le programme
✅ Est scalable : Extensible facilement
✅ Est professionnel : Architecture propre et maintenable
✅ Est intuitif : UX fluide et évidente
✅ Ajoute de la valeur : Insights et suggestions

C'est exactement le genre de feature qui différencie une app amateur d'une app professionnelle.