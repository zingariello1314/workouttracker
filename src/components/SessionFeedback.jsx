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
import { useTranslation } from '../utils/translations';
import { useFormatters } from '../utils/translations/formatters-hook';

const SessionFeedback = ({ isOpen, onClose, onSave, sessionData }) => {
  const t = useTranslation();
  const { formatDate } = useFormatters();
  
  const environmentOptions = [
    { value: 'salle', label: t('sessionFeedback.step3.environment.gym'), icon: '🏋️' },
    { value: 'maison', label: t('sessionFeedback.step3.environment.home'), icon: '🏠' },
    { value: 'exterieur', label: t('sessionFeedback.step3.environment.outdoor'), icon: '🌳' },
    { value: 'parc', label: t('sessionFeedback.step3.environment.park'), icon: '🌲' }
  ];

  const weatherOptions = [
    { value: 'ensoleille', label: t('sessionFeedback.step3.weather.sunny'), icon: '☀️' },
    { value: 'nuageux', label: t('sessionFeedback.step3.weather.cloudy'), icon: '☁️' },
    { value: 'pluvieux', label: t('sessionFeedback.step3.weather.rainy'), icon: '🌧️' },
    { value: 'venteux', label: t('sessionFeedback.step3.weather.windy'), icon: '💨' },
    { value: 'froid', label: t('sessionFeedback.step3.weather.cold'), icon: '❄️' },
    { value: 'chaud', label: t('sessionFeedback.step3.weather.hot'), icon: '🔥' }
  ];
  
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
    // ✅ Utiliser la date de la session si disponible, sinon la date d'aujourd'hui
    const sessionDate = sessionData?.date 
      ? (typeof sessionData.date === 'string' ? sessionData.date : getDateStr(new Date(sessionData.date)))
      : getDateStr(new Date());
    
    const feedbackData = {
      ...feedback,
      date: sessionDate,
      timestamp: new Date().toISOString(),
      sessionPayloadVersion: 2,
      sessionId: sessionData?.id || Date.now(),
      sessionDuration: sessionData?.duration || 0,
      totalReps: sessionData?.exercises?.reduce((sum, ex) => sum + (parseInt(ex.reps) || 0), 0) || 0,
      totalExercises: sessionData?.exercises?.length || 0,
      exercisesSnapshot: Array.isArray(sessionData?.exercises)
        ? sessionData.exercises.map((ex) => ({
            id: ex.id,
            name: ex.name,
            reps: ex.reps,
            completed: ex.completed
          }))
        : []
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
          {value > 0 ? `${value}/10` : t('sessionFeedback.step1.notEvaluated')}
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
    const fieldMap = {
      ressenti: 'feeling',
      difficulte: 'difficulty',
      energieDebut: 'energyBefore',
      energieFin: 'energyAfter',
      motivation: 'motivation',
      douleur: 'pain',
      sommeil: 'sleep',
      hydratation: 'hydration',
      nutrition: 'nutrition'
    };
    const mappedField = fieldMap[field] || field;
    return t(`sessionFeedback.descriptions.${mappedField}.${value}`, '');
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
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 px-3 pb-6 pt-20 backdrop-blur-sm sm:items-center sm:p-4 sm:pb-6 sm:pt-4">
      <div className="w-full max-h-[min(88vh,720px)] max-w-4xl overflow-y-auto rounded-xl border-2 border-[#0F4C5C]/75 bg-black shadow-2xl shadow-black/50">
        {/* En-tête avec progression */}
        <div className="flex items-center justify-between border-b border-[#0F4C5C]/40 p-4 sm:p-6">
          <div className="flex flex-wrap items-center gap-3 sm:gap-4">
            <h2 className="flex items-center gap-2 text-xl font-bold text-white sm:text-2xl">
              <MessageSquare className="text-teal-400" />
              {t('sessionFeedback.title')}
            </h2>
            <div className="flex items-center gap-2">
              <span className="text-sm text-teal-600">{t('sessionFeedback.step', { current: currentStep, total: totalSteps })}</span>
              <div className="h-2 w-32 overflow-hidden rounded-full bg-black ring-1 ring-[#0F4C5C]/50">
                <div 
                  className={`h-full transition-all duration-300 ${getProgressColor()}`}
                  style={{ width: `${(currentStep / totalSteps) * 100}%` }}
                />
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg border border-[#0F4C5C]/50 bg-black p-2 transition-all hover:border-teal-500/50 hover:bg-[#0F4C5C]/20"
          >
            <X size={20} className="text-white" />
          </button>
        </div>

        <div className="p-4 sm:p-6">
          {/* Résumé de la séance */}
          {sessionData && (
            <div className="mb-6 rounded-lg border border-[#0F4C5C]/40 bg-black p-4">
              <h3 className="text-white font-medium mb-3 flex items-center gap-2">
                <Activity className="text-green-400" size={16} />
                {t('sessionFeedback.summary.title')}
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div className="text-center">
                  <div className="text-2xl font-bold text-white">
                    {sessionData.exercises?.reduce((sum, ex) => sum + (parseInt(ex.reps) || 0), 0) || 0}
                  </div>
                  <div className="text-teal-700">{t('sessionFeedback.summary.totalReps')}</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-white">
                    {sessionData.exercises?.length || 0}
                  </div>
                  <div className="text-teal-700">{t('sessionFeedback.summary.exercises')}</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-white">
                    {Math.round((sessionData.duration || 0) / 60) || 'N/A'}min
                  </div>
                  <div className="text-teal-700">{t('sessionFeedback.summary.estimatedDuration')}</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-white">
                    {formatDate(new Date(), { weekday: 'short' })}
                  </div>
                  <div className="text-teal-700">{t('sessionFeedback.summary.today')}</div>
                </div>
              </div>
            </div>
          )}

          {/* Étape 1: Ressenti général */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <Heart className="text-red-400" />
                {t('sessionFeedback.step1.title')}
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    {renderStarRating('ressenti', t('sessionFeedback.step1.questions.feeling'), feedback.ressenti, 'green')}
                    {getRessentiFace(feedback.ressenti)}
                  </div>
                </div>

                <div className="space-y-4">
                  {renderStarRating('difficulte', t('sessionFeedback.step1.questions.difficulty'), feedback.difficulte, 'red')}
                </div>

                <div className="space-y-4">
                  {renderStarRating('motivation', t('sessionFeedback.step1.questions.motivation'), feedback.motivation, 'purple')}
                </div>

                <div className="space-y-4">
                  {renderStarRating('douleur', t('sessionFeedback.step1.questions.pain'), feedback.douleur, 'orange', t('sessionFeedback.step1.questions.painHint'))}
                </div>
              </div>

              {/* Objectif atteint */}
              <div className="space-y-3">
                <label className="text-white font-medium flex items-center gap-2">
                  <Target className="text-blue-400" size={16} />
                  {t('sessionFeedback.step1.goal.title')}
                </label>
                <div className="flex gap-3">
                  {[
                    { value: true, label: t('sessionFeedback.step1.goal.yes'), color: 'bg-green-600' },
                    { value: false, label: t('sessionFeedback.step1.goal.no'), color: 'bg-red-600' },
                    { value: null, label: t('sessionFeedback.step1.goal.none'), color: 'bg-slate-600' }
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
                {t('sessionFeedback.step2.title')}
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  {renderStarRating('energieDebut', t('sessionFeedback.step2.questions.energyBefore'), feedback.energieDebut, 'blue')}
                </div>

                <div className="space-y-4">
                  {renderStarRating('energieFin', t('sessionFeedback.step2.questions.energyAfter'), feedback.energieFin, 'cyan')}
                </div>

                <div className="space-y-4">
                  {renderStarRating('sommeil', t('sessionFeedback.step2.questions.sleep'), feedback.sommeil, 'indigo')}
                </div>

                <div className="space-y-4">
                  {renderStarRating('hydratation', t('sessionFeedback.step2.questions.hydration'), feedback.hydratation, 'blue')}
                </div>

                <div className="space-y-4 md:col-span-2">
                  {renderStarRating('nutrition', t('sessionFeedback.step2.questions.nutrition'), feedback.nutrition, 'green')}
                </div>
              </div>

              {/* Analyse énergétique */}
              {(feedback.energieDebut > 0 && feedback.energieFin > 0) && (
                <div className="bg-slate-700/30 rounded-lg p-4">
                  <h4 className="text-white font-medium mb-2 flex items-center gap-2">
                    <TrendingUp size={16} className="text-green-400" />
                    {t('sessionFeedback.step2.analysis.title')}
                  </h4>
                  <div className="text-sm text-slate-300">
                    {feedback.energieFin > feedback.energieDebut && (
                      <div className="text-green-400">{t('sessionFeedback.step2.analysis.gained')}</div>
                    )}
                    {feedback.energieFin === feedback.energieDebut && (
                      <div className="text-blue-400">{t('sessionFeedback.step2.analysis.stable')}</div>
                    )}
                    {feedback.energieFin < feedback.energieDebut && feedback.energieFin >= 5 && (
                      <div className="text-yellow-400">{t('sessionFeedback.step2.analysis.slightDrop')}</div>
                    )}
                    {feedback.energieFin < feedback.energieDebut && feedback.energieFin < 5 && (
                      <div className="text-orange-400">{t('sessionFeedback.step2.analysis.bigDrop')}</div>
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
                {t('sessionFeedback.step3.title')}
              </h3>

              {/* Environnement */}
              <div className="space-y-3">
                <label className="text-white font-medium">{t('sessionFeedback.step3.environment.title')}</label>
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
                  <label className="text-white font-medium">{t('sessionFeedback.step3.weather.title')}</label>
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
                <label className="text-white font-medium">{t('sessionFeedback.step3.equipment.title')}</label>
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
                <label className="text-white font-medium">{t('sessionFeedback.step3.partner.title')}</label>
                <div className="flex gap-3">
                  <button
                    onClick={() => setFeedback(prev => ({ ...prev, partenaire: false }))}
                    className={`px-4 py-2 rounded-lg text-sm transition-all ${
                      !feedback.partenaire
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                    }`}
                  >
                    {t('sessionFeedback.step3.partner.alone')}
                  </button>
                  <button
                    onClick={() => setFeedback(prev => ({ ...prev, partenaire: true }))}
                    className={`px-4 py-2 rounded-lg text-sm transition-all ${
                      feedback.partenaire
                        ? 'bg-green-600 text-white'
                        : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                    }`}
                  >
                    {t('sessionFeedback.step3.partner.withSomeone')}
                  </button>
                </div>
              </div>

              {/* Temps de repos */}
              <div className="space-y-3">
                <label className="text-white font-medium">{t('sessionFeedback.step3.restTime.title')}</label>
                <input
                  type="text"
                  value={feedback.tempsRepos}
                  onChange={(e) => setFeedback(prev => ({ ...prev, tempsRepos: e.target.value }))}
                  placeholder={t('sessionFeedback.step3.restTime.placeholder')}
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
                {t('sessionFeedback.step4.title')}
              </h3>

              {/* Tags prédéfinis */}
              <div className="space-y-4">
                <label className="text-white font-medium">{t('sessionFeedback.step4.tags.title')}</label>
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
                  {t('sessionFeedback.step4.nextGoal.title')}
                </label>
                <input
                  type="text"
                  value={feedback.prochainObjectif}
                  onChange={(e) => setFeedback(prev => ({ ...prev, prochainObjectif: e.target.value }))}
                  placeholder={t('sessionFeedback.step4.nextGoal.placeholder')}
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              {/* Musiques */}
              <div className="space-y-3">
                <label className="text-white font-medium">{t('sessionFeedback.step4.music.title')}</label>
                <input
                  type="text"
                  value={feedback.musiquesEcoutees}
                  onChange={(e) => setFeedback(prev => ({ ...prev, musiquesEcoutees: e.target.value }))}
                  placeholder={t('sessionFeedback.step4.music.placeholder')}
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              {/* Notes libres */}
              <div className="space-y-4">
                <label className="text-white font-medium">{t('sessionFeedback.step4.notes.title')}</label>
                <textarea
                  value={feedback.notes}
                  onChange={(e) => setFeedback(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder={t('sessionFeedback.step4.notes.placeholder')}
                  className="w-full h-32 bg-slate-700 border border-slate-600 rounded-lg px-4 py-3 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                />
              </div>

              {/* Analyse finale */}
              {(feedback.ressenti > 0 || feedback.difficulte > 0) && (
                <div className="bg-gradient-to-r from-purple-600/20 to-blue-600/20 rounded-lg p-4 border border-purple-600/30">
                  <h4 className="text-white font-medium mb-3 flex items-center gap-2">
                    <TrendingUp size={16} className="text-green-400" />
                    {t('sessionFeedback.step4.analysis.title')}
                  </h4>
                  <div className="text-sm text-slate-300 space-y-2">
                    {feedback.ressenti >= 8 && feedback.difficulte <= 6 && (
                      <div className="text-green-400 flex items-center gap-2">
                        <span>✅</span>
                        <span>{t('sessionFeedback.step4.analysis.excellent')}</span>
                      </div>
                    )}
                    {feedback.ressenti <= 4 && feedback.difficulte >= 7 && (
                      <div className="text-orange-400 flex items-center gap-2">
                        <span>⚠️</span>
                        <span>{t('sessionFeedback.step4.analysis.difficult')}</span>
                      </div>
                    )}
                    {feedback.energieDebut <= 3 && feedback.ressenti >= 7 && (
                      <div className="text-blue-400 flex items-center gap-2">
                        <span>💪</span>
                        <span>{t('sessionFeedback.step4.analysis.transformed')}</span>
                      </div>
                    )}
                    {feedback.ressenti > 0 && feedback.difficulte > 0 && (
                      <div className="text-slate-300 flex items-center gap-2">
                        <span>📊</span>
                        <span>
                          {t('sessionFeedback.step4.analysis.ratio', {
                            ratio: Math.round((feedback.ressenti / feedback.difficulte) * 100),
                            comment: feedback.ressenti / feedback.difficulte > 1.2 
                              ? t('sessionFeedback.step4.analysis.ratioComments.veryEffective')
                              : feedback.ressenti / feedback.difficulte > 0.8 
                              ? t('sessionFeedback.step4.analysis.ratioComments.wellBalanced')
                              : t('sessionFeedback.step4.analysis.ratioComments.canOptimize')
                          })}
                        </span>
                      </div>
                    )}
                    {feedback.objectifAtteint === true && (
                      <div className="text-green-400 flex items-center gap-2">
                        <span>🎉</span>
                        <span>{t('sessionFeedback.step4.analysis.goalReached')}</span>
                      </div>
                    )}
                    {feedback.douleur >= 6 && (
                      <div className="text-red-400 flex items-center gap-2">
                        <span>🚨</span>
                        <span>{t('sessionFeedback.step4.analysis.highPain')}</span>
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
                type="button"
                onClick={prevStep}
                className="gradient-button-premium gradient-button-premium-md gradient-button-premium-variant rounded-lg"
              >
                {t('sessionFeedback.actions.previous')}
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="gradient-button-premium gradient-button-premium-md gradient-button-premium-variant rounded-lg"
            >
              {t('sessionFeedback.actions.skip')}
            </button>
          </div>
          
          <div className="flex gap-3">
            {currentStep < totalSteps ? (
              <button
                type="button"
                onClick={nextStep}
                className="gradient-button-premium gradient-button-premium-md rounded-lg"
              >
                {t('sessionFeedback.actions.next')}
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSave}
                disabled={feedback.ressenti === 0 && feedback.difficulte === 0}
                className="gradient-button-premium gradient-button-premium-md rounded-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <Save size={16} />
                {t('sessionFeedback.actions.save')}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SessionFeedback;