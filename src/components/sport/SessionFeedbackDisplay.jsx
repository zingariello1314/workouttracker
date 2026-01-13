import React from 'react';
import { 
  Star, 
  Heart, 
  Zap, 
  Target, 
  Smile, 
  Meh, 
  Frown,
  Calendar,
  MapPin,
  Users,
  Music,
  Clock,
  Award,
  TrendingUp,
  AlertCircle
} from 'lucide-react';
import { useTranslation } from '../../utils/translations';
import { typography } from '../../styles/typography';
import Card, { CardContent } from '../ui/Card';
import { Badge } from '../ui/Badge';

/**
 * Composant pour afficher les feedbacks d'une session d'entraînement
 * @param {Object} feedback - Données du feedback
 * @param {string} date - Date de la session (format YYYY-MM-DD)
 */
const SessionFeedbackDisplay = ({ feedback, date }) => {
  const t = useTranslation();

  if (!feedback) {
    return null;
  }

  // Fonction pour obtenir l'icône de ressenti
  const getRessentiIcon = (value) => {
    if (value >= 8) return <Smile className="text-green-400" size={20} />;
    if (value >= 5) return <Meh className="text-yellow-400" size={20} />;
    if (value > 0) return <Frown className="text-red-400" size={20} />;
    return null;
  };

  // Fonction pour obtenir la couleur selon la valeur
  const getValueColor = (value, max = 10) => {
    const percentage = (value / max) * 100;
    if (percentage >= 80) return 'text-green-400';
    if (percentage >= 60) return 'text-yellow-400';
    if (percentage >= 40) return 'text-orange-400';
    return 'text-red-400';
  };

  // Fonction pour afficher les étoiles
  const renderStars = (value, max = 10) => {
    const stars = [];
    const filledStars = Math.round(value);
    for (let i = 1; i <= max; i++) {
      stars.push(
        <Star
          key={i}
          size={12}
          className={i <= filledStars ? 'text-yellow-400 fill-yellow-400' : 'text-slate-600'}
        />
      );
    }
    return stars;
  };

  // Options d'environnement
  const environmentIcons = {
    salle: '🏋️',
    maison: '🏠',
    exterieur: '🌳',
    parc: '🌲'
  };

  // Options de météo
  const weatherIcons = {
    ensoleille: '☀️',
    nuageux: '☁️',
    pluvieux: '🌧️',
    venteux: '💨',
    froid: '❄️',
    chaud: '🔥'
  };

  return (
    <Card className="mt-4 border-purple-500/30 bg-gradient-to-br from-purple-900/20 to-blue-900/20">
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-4">
          <Award className="w-5 h-5 text-purple-400" />
          <h4 className={`${typography.presets.h5} text-white`}>
            {t('history.feedback.title', 'Feedback de Session')}
          </h4>
        </div>

        <div className="space-y-4">
          {/* Section 1: Ressenti général */}
          {(feedback.ressenti > 0 || feedback.difficulte > 0 || feedback.motivation > 0) && (
            <div className="space-y-3">
              <h5 className={`${typography.presets.label} text-slate-300 flex items-center gap-2`}>
                <Heart className="w-4 h-4 text-red-400" />
                {t('sessionFeedback.step1.title', 'Ressenti Général')}
              </h5>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {feedback.ressenti > 0 && (
                  <div className="bg-slate-800/50 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className={`${typography.presets.bodySmall} text-slate-300`}>
                        {t('sessionFeedback.step1.questions.feeling', 'Ressenti')}
                      </span>
                      {getRessentiIcon(feedback.ressenti)}
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex gap-0.5">
                        {renderStars(feedback.ressenti)}
                      </div>
                      <span className={`${typography.presets.caption} ${getValueColor(feedback.ressenti)}`}>
                        {feedback.ressenti}/10
                      </span>
                    </div>
                  </div>
                )}
                {feedback.difficulte > 0 && (
                  <div className="bg-slate-800/50 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className={`${typography.presets.bodySmall} text-slate-300`}>
                        {t('sessionFeedback.step1.questions.difficulty', 'Difficulté')}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex gap-0.5">
                        {renderStars(feedback.difficulte)}
                      </div>
                      <span className={`${typography.presets.caption} ${getValueColor(feedback.difficulte)}`}>
                        {feedback.difficulte}/10
                      </span>
                    </div>
                  </div>
                )}
                {feedback.motivation > 0 && (
                  <div className="bg-slate-800/50 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className={`${typography.presets.bodySmall} text-slate-300`}>
                        {t('sessionFeedback.step1.questions.motivation', 'Motivation')}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex gap-0.5">
                        {renderStars(feedback.motivation)}
                      </div>
                      <span className={`${typography.presets.caption} ${getValueColor(feedback.motivation)}`}>
                        {feedback.motivation}/10
                      </span>
                    </div>
                  </div>
                )}
              </div>
              {feedback.douleur > 0 && (
                <div className="bg-red-900/20 rounded-lg p-3 border border-red-500/30">
                  <div className="flex items-center justify-between">
                    <span className={`${typography.presets.bodySmall} text-slate-300 flex items-center gap-2`}>
                      <AlertCircle className="w-4 h-4 text-red-400" />
                      {t('sessionFeedback.step1.questions.pain', 'Douleur')}
                    </span>
                    <span className={`${typography.presets.caption} text-red-400`}>
                      {feedback.douleur}/10
                    </span>
                  </div>
                </div>
              )}
              {feedback.objectifAtteint !== null && feedback.objectifAtteint !== undefined && (
                <div className="flex items-center gap-2">
                  <Target className="w-4 h-4 text-blue-400" />
                  <span className={`${typography.presets.bodySmall} ${feedback.objectifAtteint ? 'text-green-400' : 'text-red-400'}`}>
                    {feedback.objectifAtteint 
                      ? t('sessionFeedback.step1.goal.yes', '✅ Objectif atteint')
                      : t('sessionFeedback.step1.goal.no', '❌ Objectif non atteint')
                    }
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Section 2: Énergie et condition */}
          {(feedback.energieDebut > 0 || feedback.energieFin > 0 || feedback.sommeil > 0 || feedback.hydratation > 0 || feedback.nutrition > 0) && (
            <div className="space-y-3">
              <h5 className={`${typography.presets.label} text-slate-300 flex items-center gap-2`}>
                <Zap className="w-4 h-4 text-yellow-400" />
                {t('sessionFeedback.step2.title', 'Énergie et Condition')}
              </h5>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                {feedback.energieDebut > 0 && (
                  <div className="bg-slate-800/50 rounded-lg p-2 text-center">
                    <div className={`${typography.presets.caption} text-slate-400 mb-1`}>
                      {t('sessionFeedback.step2.questions.energyBefore', 'Énergie début')}
                    </div>
                    <div className={`${typography.presets.h4} ${getValueColor(feedback.energieDebut)}`}>
                      {feedback.energieDebut}/10
                    </div>
                  </div>
                )}
                {feedback.energieFin > 0 && (
                  <div className="bg-slate-800/50 rounded-lg p-2 text-center">
                    <div className={`${typography.presets.caption} text-slate-400 mb-1`}>
                      {t('sessionFeedback.step2.questions.energyAfter', 'Énergie fin')}
                    </div>
                    <div className={`${typography.presets.h4} ${getValueColor(feedback.energieFin)}`}>
                      {feedback.energieFin}/10
                    </div>
                  </div>
                )}
                {feedback.sommeil > 0 && (
                  <div className="bg-slate-800/50 rounded-lg p-2 text-center">
                    <div className={`${typography.presets.caption} text-slate-400 mb-1`}>
                      {t('sessionFeedback.step2.questions.sleep', 'Sommeil')}
                    </div>
                    <div className={`${typography.presets.h4} ${getValueColor(feedback.sommeil)}`}>
                      {feedback.sommeil}/10
                    </div>
                  </div>
                )}
                {feedback.hydratation > 0 && (
                  <div className="bg-slate-800/50 rounded-lg p-2 text-center">
                    <div className={`${typography.presets.caption} text-slate-400 mb-1`}>
                      {t('sessionFeedback.step2.questions.hydration', 'Hydratation')}
                    </div>
                    <div className={`${typography.presets.h4} ${getValueColor(feedback.hydratation)}`}>
                      {feedback.hydratation}/10
                    </div>
                  </div>
                )}
                {feedback.nutrition > 0 && (
                  <div className="bg-slate-800/50 rounded-lg p-2 text-center">
                    <div className={`${typography.presets.caption} text-slate-400 mb-1`}>
                      {t('sessionFeedback.step2.questions.nutrition', 'Nutrition')}
                    </div>
                    <div className={`${typography.presets.h4} ${getValueColor(feedback.nutrition)}`}>
                      {feedback.nutrition}/10
                    </div>
                  </div>
                )}
              </div>
              {feedback.energieDebut > 0 && feedback.energieFin > 0 && (
                <div className="bg-slate-800/30 rounded-lg p-2 flex items-center gap-2">
                  <TrendingUp className={`w-4 h-4 ${feedback.energieFin > feedback.energieDebut ? 'text-green-400' : feedback.energieFin < feedback.energieDebut ? 'text-red-400' : 'text-blue-400'}`} />
                  <span className={`${typography.presets.bodySmall} text-slate-300`}>
                    {feedback.energieFin > feedback.energieDebut 
                      ? t('sessionFeedback.step2.analysis.gained', '⬆️ Gain d\'énergie')
                      : feedback.energieFin < feedback.energieDebut
                      ? t('sessionFeedback.step2.analysis.bigDrop', '⬇️ Perte d\'énergie')
                      : t('sessionFeedback.step2.analysis.stable', '➡️ Énergie stable')
                    }
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Section 3: Contexte et environnement */}
          {(feedback.environnement || feedback.meteo || feedback.partenaire !== undefined || feedback.equipementUtilise?.length > 0 || feedback.tempsRepos) && (
            <div className="space-y-3">
              <h5 className={`${typography.presets.label} text-slate-300 flex items-center gap-2`}>
                <MapPin className="w-4 h-4 text-purple-400" />
                {t('sessionFeedback.step3.title', 'Contexte')}
              </h5>
              <div className="flex flex-wrap gap-2">
                {feedback.environnement && (
                  <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/30 flex items-center gap-1">
                    <span>{environmentIcons[feedback.environnement] || '📍'}</span>
                    <span>{t(`sessionFeedback.step3.environment.${feedback.environnement}`, feedback.environnement)}</span>
                  </Badge>
                )}
                {feedback.meteo && (
                  <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/30 flex items-center gap-1">
                    <span>{weatherIcons[feedback.meteo] || '🌤️'}</span>
                    <span>{t(`sessionFeedback.step3.weather.${feedback.meteo}`, feedback.meteo)}</span>
                  </Badge>
                )}
                {feedback.partenaire !== undefined && (
                  <Badge className="bg-green-500/20 text-green-300 border-green-500/30 flex items-center gap-1">
                    <Users className="w-3 h-3" />
                    <span>
                      {feedback.partenaire 
                        ? t('sessionFeedback.step3.partner.withSomeone', 'Avec partenaire')
                        : t('sessionFeedback.step3.partner.alone', 'Seul')
                      }
                    </span>
                  </Badge>
                )}
                {feedback.tempsRepos && (
                  <Badge className="bg-orange-500/20 text-orange-300 border-orange-500/30 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    <span>{feedback.tempsRepos}</span>
                  </Badge>
                )}
              </div>
              {feedback.equipementUtilise && feedback.equipementUtilise.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {feedback.equipementUtilise.map((equipment, idx) => (
                    <Badge key={idx} className="bg-slate-700/50 text-slate-300 border-slate-600/50">
                      {equipment}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Section 4: Tags et notes */}
          {(feedback.tags?.length > 0 || feedback.notes || feedback.prochainObjectif || feedback.musiquesEcoutees) && (
            <div className="space-y-3">
              <h5 className={`${typography.presets.label} text-slate-300 flex items-center gap-2`}>
                <Award className="w-4 h-4 text-yellow-400" />
                {t('sessionFeedback.step4.title', 'Tags et Notes')}
              </h5>
              {feedback.tags && feedback.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {feedback.tags.map((tag, idx) => (
                    <Badge key={idx} className="bg-purple-500/20 text-purple-300 border-purple-500/30">
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}
              {feedback.prochainObjectif && (
                <div className="bg-slate-800/50 rounded-lg p-3">
                  <div className={`${typography.presets.label} text-slate-300 mb-1 flex items-center gap-2`}>
                    <Target className="w-4 h-4 text-green-400" />
                    {t('sessionFeedback.step4.nextGoal.title', 'Prochain objectif')}
                  </div>
                  <p className={`${typography.presets.bodySmall} text-white`}>
                    {feedback.prochainObjectif}
                  </p>
                </div>
              )}
              {feedback.musiquesEcoutees && (
                <div className="bg-slate-800/50 rounded-lg p-3">
                  <div className={`${typography.presets.label} text-slate-300 mb-1 flex items-center gap-2`}>
                    <Music className="w-4 h-4 text-pink-400" />
                    {t('sessionFeedback.step4.music.title', 'Musiques écoutées')}
                  </div>
                  <p className={`${typography.presets.bodySmall} text-white`}>
                    {feedback.musiquesEcoutees}
                  </p>
                </div>
              )}
              {feedback.notes && (
                <div className="bg-slate-800/50 rounded-lg p-3">
                  <div className={`${typography.presets.label} text-slate-300 mb-1`}>
                    {t('sessionFeedback.step4.notes.title', 'Notes')}
                  </div>
                  <p className={`${typography.presets.bodySmall} text-white whitespace-pre-wrap`}>
                    {feedback.notes}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default SessionFeedbackDisplay;
