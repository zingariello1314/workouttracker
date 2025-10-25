import React, { useState, useEffect } from 'react';
import { 
  Star, 
  MessageSquare, 
  Save, 
  X, 
  Smile, 
  Meh, 
  Frown, 
  Heart,
  Zap,
  Target,
  Clock,
  TrendingUp,
  Award,
  Calendar,
  Activity
} from 'lucide-react';
import { useWorkout } from '../context/WorkoutContext';
import { getDateStr } from '../utils/dateUtils';

const SessionFeedback = ({ isOpen, onClose, onSave, sessionData }) => {
  const [feedback, setFeedback] = useState({
    ressenti: 0, // 1-10
    difficulte: 0, // 1-10
    energieDebut: 0, // 1-10
    energieFin: 0, // 1-10
    motivation: 0, // 1-10
    douleur: 0, // 0-10 (0 = aucune douleur)
    sommeil: 0, // 1-10 (qualité du sommeil la nuit précédente)
    hydratation: 0, // 1-10
    nutrition: 0, // 1-10
    tags: [],
    notes: '',
    objectifAtteint: null, // true/false/null
    prochainObjectif: '',
    tempsRepos: '', // temps de repos entre les séries
    musiquesEcoutees: '',
    environnement: '', // salle, maison, extérieur
    partenaire: false, // seul ou avec quelqu'un
    meteo: '', // si extérieur
    equipementUtilise: []
  });

  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 4;

  const predefinedTags = [
    // Ressenti physique
    'Forme olympique', 'Bon jour', 'Fatigue', 'Courbatures', 'Douleur', 'Blessure',
    // Ressenti mental
    'Motivation haute', 'Stress élevé', 'Concentration parfaite', 'Distrait',
    // Conditions
    'Récupération ok', 'Insomnie', 'Maladie', 'Mauvais jour', 'Première fois',
    // Performance
    'Record personnel', 'Dépassement de soi', 'Technique améliorée', 'Endurance++',
    // Environnement
    'Musique motivante', 'Salle bondée', 'Équipement défaillant', 'Nouveau lieu'
  ];

  const equipmentOptions = [
    'Haltères', 'Barres', 'Machines', 'Poids du corps', 'Élastiques', 
    'Kettlebells', 'TRX', 'Médecine ball', 'Corde à sauter', 'Tapis de course'
  ];

  const environmentOptions = [
    { value: 'salle', label: '🏋️ Salle de sport', icon: '🏋️' },
    { value: 'maison', label: '🏠 À la maison', icon: '🏠' },
    { value: 'exterieur', label: '🌳 Extérieur', icon: '🌳' },
    { value: 'parc', label: '🌲 Parc', icon: '🌲' }
  ];

  const weatherOptions = [
    { value: 'ensoleille', label: '☀️ Ensoleillé', icon: '☀️' },
    { value: 'nuageux', label: '☁️ Nuageux', icon: '☁️' },
    { value: 'pluvieux', label: '🌧️ Pluvieux', icon: '🌧️' },
    { value: 'venteux', label: '💨 Venteux', icon: '💨' },
    { value: 'froid', label: '❄️ Froid', icon: '❄️' },
    { value: 'chaud', label: '🔥 Chaud', icon: '🔥' }
  ];

  useEffect(() => {
    if (isOpen) {
      setCurrentStep(1);
      setFeedback({
        ressenti: 0,
        difficulte: 0,
        energieDebut: 0,
        energieFin: 0,
        motivation: 0,
        douleur: 0,
        sommeil: 0,
        hydratation: 0,
        nutrition: 0,
        tags: [],
        notes: '',
        objectifAtteint: null,
        prochainObjectif: '',
        tempsRepos: '',
        musiquesEcoutees: '',
        environnement: '',
        partenaire: false,
        meteo: '',
        equipementUtilise: []
      });
    }
  }, [isOpen]);

  const handleStarClick = (field, value) => {
    setFeedback(prev => ({ ...prev, [field]: value }));
  };

  const handleTagToggle = (tag) => {
    setFeedback(prev => ({
      ...prev,
      tags: prev.tags.includes(tag)
        ? prev.tags.filter(t => t !== tag)
        : [...prev.tags, tag]
    }));
  };

  const handleEquipmentToggle = (equipment) => {
    setFeedback(prev => ({
      ...prev,
      equipementUtilise: prev.equipementUtilise.includes(equipment)
        ? prev.equipementUtilise.filter(e => e !== equipment)
        : [...prev.equipementUtilise, equipment]
    }));
  };

  const handleSave = () => {
    const feedbackData = {
      ...feedback,
      date: getDateStr(new Date()),
      timestamp: new Date().toISOString(),
      sessionId: sessionData?.id || Date.now(),
      sessionDuration: sessionData?.duration || 0,
      totalReps: sessionData?.exercises?.reduce((sum, ex) => sum + (parseInt(ex.reps) || 0), 0) || 0,
      totalExercises: sessionData?.exercises?.length || 0
    };
    onSave(feedbackData);
    onClose();
  };

  const nextStep = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const renderStarRating = (field, label, value, color = 'yellow', description = '') => (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-white font-medium">{label}</label>
        {description && (
          <span className="text-xs text-slate-400">{description}</span>
        )}
      </div>
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(star => (
          <button
            key={star}
            onClick={() => handleStarClick(field, star)}
            className={`transition-all duration-200 hover:scale-110 ${
              star <= value
                ? `text-${color}-400 hover:text-${color}-300`
                : 'text-slate-600 hover:text-slate-500'
            }`}
          >
            <Star size={18} fill={star <= value ? 'currentColor' : 'none'} />
          </button>
        ))}
        <span className="ml-2 text-slate-300 text-sm font-medium">
          {value > 0 ? `${value}/10` : 'Non évalué'}
        </span>
      </div>
      {value > 0 && (
        <div className="text-xs text-slate-400">
          {getValueDescription(field, value)}
        </div>
      )}
    </div>
  );

  const getValueDescription = (field, value) => {
    const descriptions = {
      ressenti: {
        1: '😞 Très mauvais', 2: '😔 Mauvais', 3: '😐 Pas terrible', 4: '😕 Moyen-',
        5: '😐 Moyen', 6: '🙂 Correct', 7: '😊 Bien', 8: '😄 Très bien',
        9: '🤩 Excellent', 10: '🚀 Parfait!'
      },
      difficulte: {
        1: '😴 Très facile', 2: '😌 Facile', 3: '🙂 Accessible', 4: '💪 Modéré-',
        5: '💪 Modéré', 6: '🔥 Challengeant', 7: '💥 Difficile', 8: '🚀 Très difficile',
        9: '🔥 Extrême', 10: '💀 Au maximum'
      },
      energieDebut: {
        1: '😴 Épuisé', 2: '😪 Très fatigué', 3: '😔 Fatigué', 4: '😐 Peu d\'énergie',
        5: '🙂 Énergie normale', 6: '😊 Bonne énergie', 7: '😄 Très énergique', 8: '🤩 Plein d\'énergie',
        9: '🚀 Débordant d\'énergie', 10: '⚡ Énergie maximale'
      },
      energieFin: {
        1: '😵 Complètement vidé', 2: '😪 Très épuisé', 3: '😔 Épuisé', 4: '😐 Fatigué',
        5: '🙂 Normalement fatigué', 6: '😊 Encore de l\'énergie', 7: '😄 Bien récupéré', 8: '🤩 Plein d\'énergie',
        9: '🚀 Prêt à continuer', 10: '⚡ Inépuisable'
      },
      motivation: {
        1: '😞 Aucune envie', 2: '😔 Très peu motivé', 3: '😐 Pas motivé', 4: '😕 Peu motivé',
        5: '🙂 Motivation normale', 6: '😊 Bien motivé', 7: '😄 Très motivé', 8: '🤩 Super motivé',
        9: '🚀 Hyper motivé', 10: '🔥 Motivation au max'
      },
      douleur: {
        0: '😊 Aucune douleur', 1: '🙂 Très légère', 2: '😐 Légère', 3: '😕 Modérée',
        4: '😔 Gênante', 5: '😣 Inconfortable', 6: '😖 Douloureuse', 7: '😫 Très douloureuse',
        8: '😰 Intense', 9: '😱 Très intense', 10: '🚨 Insupportable'
      },
      sommeil: {
        1: '😴 Très mauvais', 2: '😪 Mauvais', 3: '😔 Médiocre', 4: '😐 Pas terrible',
        5: '🙂 Correct', 6: '😊 Bon', 7: '😄 Très bon', 8: '🤩 Excellent',
        9: '🚀 Parfait', 10: '⭐ Réparateur'
      },
      hydratation: {
        1: '🏜️ Très déshydraté', 2: '😰 Déshydraté', 3: '😔 Mal hydraté', 4: '😐 Peu hydraté',
        5: '🙂 Hydratation normale', 6: '😊 Bien hydraté', 7: '😄 Très bien hydraté', 8: '🤩 Parfaitement hydraté',
        9: '💧 Hydratation optimale', 10: '🌊 Hydratation parfaite'
      },
      nutrition: {
        1: '🍔 Très mauvaise', 2: '😔 Mauvaise', 3: '😐 Médiocre', 4: '😕 Pas terrible',
        5: '🙂 Correcte', 6: '😊 Bonne', 7: '😄 Très bonne', 8: '🤩 Excellente',
        9: '🥗 Optimale', 10: '⭐ Parfaite'
      }
    };
    return descriptions[field]?.[value] || '';
  };

  const getRessentiFace = (value) => {
    if (value >= 8) return <Smile className="text-green-400" size={24} />;
    if (value >= 5) return <Meh className="text-yellow-400" size={24} />;
    if (value > 0) return <Frown className="text-red-400" size={24} />;
    return null;
  };

  const getProgressColor = () => {
    const progress = (currentStep / totalSteps) * 100;
    if (progress >= 75) return 'bg-green-500';
    if (progress >= 50) return 'bg-yellow-500';
    if (progress >= 25) return 'bg-orange-500';
    return 'bg-red-500';
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-800 rounded-xl border border-slate-700 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        {/* En-tête avec progression */}
        <div className="flex items-center justify-between p-6 border-b border-slate-700">
          <div className="flex items-center gap-4">
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              <MessageSquare className="text-purple-400" />
              Feedback de séance
            </h2>
            <div className="flex items-center gap-2">
              <span className="text-sm text-slate-400">Étape {currentStep}/{totalSteps}</span>
              <div className="w-32 h-2 bg-slate-700 rounded-full overflow-hidden">
                <div 
                  className={`h-full transition-all duration-300 ${getProgressColor()}`}
                  style={{ width: `${(currentStep / totalSteps) * 100}%` }}
                />
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition-all"
          >
            <X size={20} className="text-white" />
          </button>
        </div>

        <div className="p-6">
          {/* Résumé de la séance */}
          {sessionData && (
            <div className="bg-slate-700/50 rounded-lg p-4 mb-6">
              <h3 className="text-white font-medium mb-3 flex items-center gap-2">
                <Activity className="text-green-400" size={16} />
                Résumé de ta séance
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div className="text-center">
                  <div className="text-2xl font-bold text-white">
                    {sessionData.exercises?.reduce((sum, ex) => sum + (parseInt(ex.reps) || 0), 0) || 0}
                  </div>
                  <div className="text-slate-400">Total reps</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-white">
                    {sessionData.exercises?.length || 0}
                  </div>
                  <div className="text-slate-400">Exercices</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-white">
                    {Math.round((sessionData.duration || 0) / 60) || 'N/A'}min
                  </div>
                  <div className="text-slate-400">Durée estimée</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-white">
                    {new Date().toLocaleDateString('fr-FR', { weekday: 'short' })}
                  </div>
                  <div className="text-slate-400">Aujourd'hui</div>
                </div>
              </div>
            </div>
          )}

          {/* Étape 1: Ressenti général */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <Heart className="text-red-400" />
                1. Ressenti général
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    {renderStarRating('ressenti', 'Comment tu te sens globalement ?', feedback.ressenti, 'green')}
                    {getRessentiFace(feedback.ressenti)}
                  </div>
                </div>

                <div className="space-y-4">
                  {renderStarRating('difficulte', 'Quelle était la difficulté ?', feedback.difficulte, 'red')}
                </div>

                <div className="space-y-4">
                  {renderStarRating('motivation', 'Ton niveau de motivation ?', feedback.motivation, 'purple')}
                </div>

                <div className="space-y-4">
                  {renderStarRating('douleur', 'Niveau de douleur/gêne ?', feedback.douleur, 'orange', '0 = aucune douleur')}
                </div>
              </div>

              {/* Objectif atteint */}
              <div className="space-y-3">
                <label className="text-white font-medium flex items-center gap-2">
                  <Target className="text-blue-400" size={16} />
                  As-tu atteint ton objectif de séance ?
                </label>
                <div className="flex gap-3">
                  {[
                    { value: true, label: '✅ Oui, objectif atteint!', color: 'bg-green-600' },
                    { value: false, label: '❌ Non, pas cette fois', color: 'bg-red-600' },
                    { value: null, label: '🤷 Pas d\'objectif précis', color: 'bg-slate-600' }
                  ].map(option => (
                    <button
                      key={String(option.value)}
                      onClick={() => setFeedback(prev => ({ ...prev, objectifAtteint: option.value }))}
                      className={`px-4 py-2 rounded-lg text-sm transition-all ${
                        feedback.objectifAtteint === option.value
                          ? `${option.color} text-white`
                          : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Étape 2: Énergie et condition physique */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <Zap className="text-yellow-400" />
                2. Énergie et condition
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  {renderStarRating('energieDebut', 'Énergie avant la séance', feedback.energieDebut, 'blue')}
                </div>

                <div className="space-y-4">
                  {renderStarRating('energieFin', 'Énergie après la séance', feedback.energieFin, 'cyan')}
                </div>

                <div className="space-y-4">
                  {renderStarRating('sommeil', 'Qualité du sommeil (nuit précédente)', feedback.sommeil, 'indigo')}
                </div>

                <div className="space-y-4">
                  {renderStarRating('hydratation', 'Niveau d\'hydratation', feedback.hydratation, 'blue')}
                </div>

                <div className="space-y-4 md:col-span-2">
                  {renderStarRating('nutrition', 'Qualité de ta nutrition aujourd\'hui', feedback.nutrition, 'green')}
                </div>
              </div>

              {/* Analyse énergétique */}
              {(feedback.energieDebut > 0 && feedback.energieFin > 0) && (
                <div className="bg-slate-700/30 rounded-lg p-4">
                  <h4 className="text-white font-medium mb-2 flex items-center gap-2">
                    <TrendingUp size={16} className="text-green-400" />
                    📊 Analyse énergétique
                  </h4>
                  <div className="text-sm text-slate-300">
                    {feedback.energieFin > feedback.energieDebut && (
                      <div className="text-green-400">⬆️ Tu as gagné en énergie pendant la séance ! Excellent signe.</div>
                    )}
                    {feedback.energieFin === feedback.energieDebut && (
                      <div className="text-blue-400">➡️ Énergie stable. Bonne gestion de l'effort.</div>
                    )}
                    {feedback.energieFin < feedback.energieDebut && feedback.energieFin >= 5 && (
                      <div className="text-yellow-400">⬇️ Légère baisse d'énergie, mais tu restes dans le vert.</div>
                    )}
                    {feedback.energieFin < feedback.energieDebut && feedback.energieFin < 5 && (
                      <div className="text-orange-400">⬇️ Grosse dépense énergétique. Pense à bien récupérer !</div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Étape 3: Contexte et environnement */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <Calendar className="text-purple-400" />
                3. Contexte de la séance
              </h3>

              {/* Environnement */}
              <div className="space-y-3">
                <label className="text-white font-medium">Où as-tu fait ta séance ?</label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {environmentOptions.map(env => (
                    <button
                      key={env.value}
                      onClick={() => setFeedback(prev => ({ ...prev, environnement: env.value }))}
                      className={`p-3 rounded-lg text-sm transition-all flex flex-col items-center gap-2 ${
                        feedback.environnement === env.value
                          ? 'bg-purple-600 text-white'
                          : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                      }`}
                    >
                      <span className="text-2xl">{env.icon}</span>
                      <span>{env.label.split(' ')[1]}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Météo si extérieur */}
              {(feedback.environnement === 'exterieur' || feedback.environnement === 'parc') && (
                <div className="space-y-3">
                  <label className="text-white font-medium">Quel temps faisait-il ?</label>
                  <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
                    {weatherOptions.map(weather => (
                      <button
                        key={weather.value}
                        onClick={() => setFeedback(prev => ({ ...prev, meteo: weather.value }))}
                        className={`p-2 rounded-lg text-xs transition-all flex flex-col items-center gap-1 ${
                          feedback.meteo === weather.value
                            ? 'bg-blue-600 text-white'
                            : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                        }`}
                      >
                        <span className="text-lg">{weather.icon}</span>
                        <span>{weather.label.split(' ')[1]}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Équipement utilisé */}
              <div className="space-y-3">
                <label className="text-white font-medium">Quel équipement as-tu utilisé ?</label>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                  {equipmentOptions.map(equipment => (
                    <button
                      key={equipment}
                      onClick={() => handleEquipmentToggle(equipment)}
                      className={`px-3 py-2 rounded-lg text-sm transition-all ${
                        feedback.equipementUtilise.includes(equipment)
                          ? 'bg-green-600 text-white'
                          : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                      }`}
                    >
                      {equipment}
                    </button>
                  ))}
                </div>
              </div>

              {/* Partenaire */}
              <div className="space-y-3">
                <label className="text-white font-medium">As-tu fait ta séance seul(e) ?</label>
                <div className="flex gap-3">
                  <button
                    onClick={() => setFeedback(prev => ({ ...prev, partenaire: false }))}
                    className={`px-4 py-2 rounded-lg text-sm transition-all ${
                      !feedback.partenaire
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                    }`}
                  >
                    🧘 Seul(e)
                  </button>
                  <button
                    onClick={() => setFeedback(prev => ({ ...prev, partenaire: true }))}
                    className={`px-4 py-2 rounded-lg text-sm transition-all ${
                      feedback.partenaire
                        ? 'bg-green-600 text-white'
                        : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                    }`}
                  >
                    👥 Avec quelqu'un
                  </button>
                </div>
              </div>

              {/* Temps de repos */}
              <div className="space-y-3">
                <label className="text-white font-medium">Temps de repos entre les séries</label>
                <input
                  type="text"
                  value={feedback.tempsRepos}
                  onChange={(e) => setFeedback(prev => ({ ...prev, tempsRepos: e.target.value }))}
                  placeholder="ex: 1-2 min, 30-45 sec, variable..."
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
            </div>
          )}

          {/* Étape 4: Tags et notes */}
          {currentStep === 4 && (
            <div className="space-y-6">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <Award className="text-yellow-400" />
                4. Derniers détails
              </h3>

              {/* Tags prédéfinis */}
              <div className="space-y-4">
                <label className="text-white font-medium">Comment décrirais-tu cette séance ?</label>
                <div className="flex flex-wrap gap-2">
                  {predefinedTags.map(tag => (
                    <button
                      key={tag}
                      onClick={() => handleTagToggle(tag)}
                      className={`px-3 py-2 rounded-lg text-sm transition-all ${
                        feedback.tags.includes(tag)
                          ? 'bg-purple-600 text-white'
                          : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                      }`}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>

              {/* Prochain objectif */}
              <div className="space-y-3">
                <label className="text-white font-medium flex items-center gap-2">
                  <Target className="text-green-400" size={16} />
                  Quel est ton objectif pour la prochaine séance ?
                </label>
                <input
                  type="text"
                  value={feedback.prochainObjectif}
                  onChange={(e) => setFeedback(prev => ({ ...prev, prochainObjectif: e.target.value }))}
                  placeholder="ex: Augmenter les poids, améliorer la technique, faire plus de reps..."
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              {/* Musiques */}
              <div className="space-y-3">
                <label className="text-white font-medium">Musiques qui t'ont motivé(e) ?</label>
                <input
                  type="text"
                  value={feedback.musiquesEcoutees}
                  onChange={(e) => setFeedback(prev => ({ ...prev, musiquesEcoutees: e.target.value }))}
                  placeholder="ex: Rock, Hip-hop, Électro, ou titres spécifiques..."
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              {/* Notes libres */}
              <div className="space-y-4">
                <label className="text-white font-medium">Notes personnelles (optionnel)</label>
                <textarea
                  value={feedback.notes}
                  onChange={(e) => setFeedback(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Ajoute tes observations, sensations, points à améliorer, victoires du jour..."
                  className="w-full h-32 bg-slate-700 border border-slate-600 rounded-lg px-4 py-3 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                />
              </div>

              {/* Analyse finale */}
              {(feedback.ressenti > 0 || feedback.difficulte > 0) && (
                <div className="bg-gradient-to-r from-purple-600/20 to-blue-600/20 rounded-lg p-4 border border-purple-600/30">
                  <h4 className="text-white font-medium mb-3 flex items-center gap-2">
                    <TrendingUp size={16} className="text-green-400" />
                    🎯 Analyse de ta séance
                  </h4>
                  <div className="text-sm text-slate-300 space-y-2">
                    {feedback.ressenti >= 8 && feedback.difficulte <= 6 && (
                      <div className="text-green-400 flex items-center gap-2">
                        <span>✅</span>
                        <span>Excellente séance ! Tu peux peut-être augmenter l'intensité la prochaine fois.</span>
                      </div>
                    )}
                    {feedback.ressenti <= 4 && feedback.difficulte >= 7 && (
                      <div className="text-orange-400 flex items-center gap-2">
                        <span>⚠️</span>
                        <span>Séance difficile avec ressenti faible. Pense à bien récupérer et peut-être réduire l'intensité.</span>
                      </div>
                    )}
                    {feedback.energieDebut <= 3 && feedback.ressenti >= 7 && (
                      <div className="text-blue-400 flex items-center gap-2">
                        <span>💪</span>
                        <span>Bravo ! Tu as su transformer une faible énergie en excellente séance.</span>
                      </div>
                    )}
                    {feedback.ressenti > 0 && feedback.difficulte > 0 && (
                      <div className="text-slate-300 flex items-center gap-2">
                        <span>📊</span>
                        <span>
                          Ratio efficacité: {Math.round((feedback.ressenti / feedback.difficulte) * 100)}% 
                          {feedback.ressenti / feedback.difficulte > 1.2 ? ' (Très efficace ⭐)' : 
                           feedback.ressenti / feedback.difficulte > 0.8 ? ' (Bien équilibré 👍)' : ' (Peut être optimisé 🎯)'}
                        </span>
                      </div>
                    )}
                    {feedback.objectifAtteint === true && (
                      <div className="text-green-400 flex items-center gap-2">
                        <span>🎉</span>
                        <span>Objectif atteint ! Continue sur cette lancée.</span>
                      </div>
                    )}
                    {feedback.douleur >= 6 && (
                      <div className="text-red-400 flex items-center gap-2">
                        <span>🚨</span>
                        <span>Attention au niveau de douleur élevé. Pense à consulter si ça persiste.</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Actions avec navigation */}
        <div className="flex items-center justify-between p-6 border-t border-slate-700">
          <div className="flex gap-3">
            {currentStep > 1 && (
              <button
                onClick={prevStep}
                className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-all"
              >
                ← Précédent
              </button>
            )}
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-all"
            >
              Passer
            </button>
          </div>
          
          <div className="flex gap-3">
            {currentStep < totalSteps ? (
              <button
                onClick={nextStep}
                className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-all"
              >
                Suivant →
              </button>
            ) : (
              <button
                onClick={handleSave}
                disabled={feedback.ressenti === 0 && feedback.difficulte === 0}
                className="px-6 py-2 bg-green-600 hover:bg-green-700 disabled:bg-slate-600 disabled:cursor-not-allowed text-white rounded-lg transition-all flex items-center gap-2"
              >
                <Save size={16} />
                Enregistrer le feedback
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SessionFeedback;