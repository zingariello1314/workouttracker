import React, { useMemo } from 'react';
import { Calendar, CheckCircle2, Clock, Sparkles, Target, Zap } from 'lucide-react';
import CalendarHeatmap from '../CalendarHeatmap';
import Card, { CardContent, CardHeader, CardTitle } from '../ui/Card';
import { getDateStr } from '../../utils/dateUtils';
import { useTranslation } from '../../utils/translations';

/**
 * Calendrier des quêtes : même structure que l’onglet Sport (compteur + heatmap),
 * métriques et panneau jour adaptés aux validations QuietQuest.
 */
const QuestsCalendarView = ({
  allQuests,
  validations,
  validationsByDate,
  getQuestsForDate,
  prayerLocation,
}) => {
  const t = useTranslation();

  const questCalendarContext = useMemo(
    () => ({
      validationsByDate,
      validations: validations || [],
      allQuests,
      getQuestsForDate,
      prayerLocation,
    }),
    [validationsByDate, validations, allQuests, getQuestsForDate, prayerLocation]
  );

  const counterStats = useMemo(() => {
    const today = new Date();
    const last7 = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      last7.push(getDateStr(d));
    }

    let validationsThisWeek = 0;
    let xpThisWeek = 0;
    const daysWithQuest = new Set();

    for (const v of validations || []) {
      if (!v?.date) continue;
      if (last7.includes(v.date)) {
        validationsThisWeek += 1;
        xpThisWeek += Number(v.xpGagne) || 0;
      }
      daysWithQuest.add(v.date);
    }

    const totalValidations = (validations || []).length;
    let minutesTotal = 0;
    const questById = new Map((allQuests || []).map((q) => [q.id, q]));
    for (const v of validations || []) {
      const q = questById.get(v.queteId);
      if (q) {
        const raw = q.duree;
        const n =
          typeof raw === 'number' && Number.isFinite(raw)
            ? raw
            : parseInt(String(raw ?? '').trim(), 10);
        if (Number.isFinite(n) && n >= 1) minutesTotal += Math.round(n);
      }
    }

    return {
      totalValidations,
      distinctDays: daysWithQuest.size,
      validationsThisWeek,
      xpThisWeek,
      minutesTotal,
    };
  }, [validations, allQuests]);

  return (
    <div className="space-y-6">
      <Card className="bg-black border border-amber-600/45 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <Sparkles className="text-amber-400" size={24} />
            {t('quests.calendar.counterTitle', 'Résumé quêtes')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-black rounded-lg p-4 text-center border border-slate-600">
              <div className="flex items-center justify-center mb-2">
                <CheckCircle2 className="text-amber-400 mr-2" size={20} />
                <span className="text-slate-300 text-sm">
                  {t('quests.calendar.totalChecks', 'Validations')}
                </span>
              </div>
              <div className="text-2xl font-bold text-white">{counterStats.totalValidations}</div>
              <div className="text-xs text-slate-400">
                {t('quests.calendar.totalChecksHint', 'Toutes dates confondues')}
              </div>
            </div>
            <div className="bg-black rounded-lg p-4 text-center border border-slate-600">
              <div className="flex items-center justify-center mb-2">
                <Calendar className="text-amber-300 mr-2" size={20} />
                <span className="text-slate-300 text-sm">
                  {t('quests.calendar.activeDays', 'Jours avec quête')}
                </span>
              </div>
              <div className="text-2xl font-bold text-white">{counterStats.distinctDays}</div>
              <div className="text-xs text-slate-400">
                {t('quests.calendar.activeDaysHint', 'Au moins une validation')}
              </div>
            </div>
            <div className="bg-black rounded-lg p-4 text-center border border-slate-600">
              <div className="flex items-center justify-center mb-2">
                <Zap className="text-amber-400 mr-2" size={20} />
                <span className="text-slate-300 text-sm">
                  {t('quests.calendar.weekXp', 'XP (7 jours)')}
                </span>
              </div>
              <div className="text-2xl font-bold text-white">{counterStats.xpThisWeek}</div>
              <div className="text-xs text-slate-400">
                {t('quests.calendar.weekValidations', '{{n}} validations', {
                  n: counterStats.validationsThisWeek,
                })}
              </div>
            </div>
            <div className="bg-black rounded-lg p-4 text-center border border-slate-600">
              <div className="flex items-center justify-center mb-2">
                <Clock className="text-amber-300 mr-2" size={20} />
                <span className="text-slate-300 text-sm">
                  {t('quests.calendar.timeBank', 'Temps quêtes cumulé')}
                </span>
              </div>
              <div className="text-2xl font-bold text-white">{counterStats.minutesTotal} min</div>
              <div className="text-xs text-slate-400">
                {t('quests.calendar.timeBankHint', 'Durée paramétrée × validations')}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div className="bg-black rounded-lg p-4 flex items-center gap-3 border border-slate-600">
              <Target className="text-amber-400 shrink-0" size={22} />
              <div>
                <div className="text-white font-medium text-sm">
                  {t('quests.calendar.hintTitle', 'Lecture du calendrier')}
                </div>
                <div className="text-slate-400 text-xs mt-1">
                  {t(
                    'quests.calendar.hintBody',
                    'La couleur des cases suit la même échelle que le sport (complétion, XP, temps). Cliquez un jour pour le détail.'
                  )}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <CalendarHeatmap
        variant="quests"
        questCalendarContext={questCalendarContext}
        initialViewMode="year"
        garminData={null}
        workoutHistory={[]}
      />
    </div>
  );
};

export default QuestsCalendarView;
