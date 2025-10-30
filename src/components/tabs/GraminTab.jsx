import React from 'react';
import { useGarminData } from '../../hooks/useGarminData';
import { useWorkout } from '../../context/WorkoutContext';

const BASES = ['http://localhost:3031', 'http://localhost:3001'];

const GraminTab = () => {
  const [status, setStatus] = React.useState(null);
  const [loading, setLoading] = React.useState(false);
  const [baseUrl, setBaseUrl] = React.useState(null);
  const [garminData, setGarminData] = React.useState(null); // données renvoyées par /sync
  const [showRaw, setShowRaw] = React.useState(false);
  const [startDate, setStartDate] = React.useState('');
  const [endDate, setEndDate] = React.useState('');
  const [selectedDate, setSelectedDate] = React.useState(null);
  const { saveActivities, saveDailyMetrics, loadAllData, dbReady } = useGarminData();
  const { data: workoutData, updateData } = useWorkout();

  // Import automatique vers enduranceData.sessions
  const importToEndurance = React.useCallback(async (garminDataForImport) => {
    if (!garminDataForImport?.activities) return;
    
    const currentEndurance = workoutData?.enduranceData || {};
    const currentSessions = currentEndurance.sessions || {};
    const newSessions = { ...currentSessions };
    
    // Natation
    if (garminDataForImport.activities.swimming && Array.isArray(garminDataForImport.activities.swimming)) {
      const existingSwimming = newSessions.swimming || [];
      const existingIds = new Set(existingSwimming.map(s => s.id || `${s.date}_${s.time}`).filter(Boolean));
      
      garminDataForImport.activities.swimming.forEach(gAct => {
        const key = gAct.id || `${gAct.date}_${gAct.time}`;
        if (!existingIds.has(key) && gAct.source === 'garmin') {
          const session = {
            id: gAct.id || Date.now() + Math.random(),
            date: gAct.date,
            time: gAct.time || '',
            duration: gAct.duration || 0,
            distance: gAct.distance || 0,
            laps: gAct.laps || 0,
            avgHR: gAct.avgHR || 0,
            maxHR: gAct.maxHR || 0,
            calories: gAct.calories || 0,
            avgPace: gAct.avgPace || 0,
            source: 'garmin',
            notes: `Importé depuis Garmin`
          };
          existingSwimming.push(session);
        }
      });
      newSessions.swimming = existingSwimming;
    }
    
    // Corde à sauter
    if (garminDataForImport.activities.jumpRope && Array.isArray(garminDataForImport.activities.jumpRope)) {
      const existingJumpRope = newSessions.jumprope || [];
      const existingIds = new Set(existingJumpRope.map(s => s.id || `${s.date}_${s.time}`).filter(Boolean));
      
      garminDataForImport.activities.jumpRope.forEach(gAct => {
        const key = gAct.id || `${gAct.date}_${gAct.time}`;
        if (!existingIds.has(key) && gAct.source === 'garmin') {
          const session = {
            id: gAct.id || Date.now() + Math.random(),
            date: gAct.date,
            time: gAct.time || '',
            duration: gAct.duration || 0,
            jumps: gAct.jumps || 0,
            avgHR: gAct.avgHR || 0,
            maxHR: gAct.maxHR || 0,
            calories: gAct.calories || 0,
            source: 'garmin',
            notes: `Importé depuis Garmin`
          };
          existingJumpRope.push(session);
        }
      });
      newSessions.jumprope = existingJumpRope;
    }
    
    // Cardio (peut contenir JumpJump Pro ou autres activités)
    if (garminDataForImport.activities.cardio && Array.isArray(garminDataForImport.activities.cardio)) {
      const existingJumpRope = newSessions.jumprope || [];
      const existingIds = new Set(existingJumpRope.map(s => s.id || `${s.date}_${s.time}`).filter(Boolean));
      
      garminDataForImport.activities.cardio.forEach(gAct => {
        const key = gAct.id || `${gAct.date}_${gAct.time}`;
        if (!existingIds.has(key) && gAct.source === 'garmin') {
          // Si c'est une activité avec sauts (JumpJump Pro), importer comme jumprope
          if (gAct.jumps && gAct.jumps > 0) {
            const session = {
              id: gAct.id || Date.now() + Math.random(),
              date: gAct.date,
              time: gAct.time || '',
              duration: gAct.duration || 0,
              jumps: gAct.jumps || 0,
              avgHR: gAct.avgHR || 0,
              maxHR: gAct.maxHR || 0,
              calories: gAct.calories?.total || gAct.calories || 0,
              connectIQ: gAct.connectIQ || null,
              source: 'garmin',
              notes: `Importé depuis Garmin (Cardio/JumpJump Pro)`
            };
            existingJumpRope.push(session);
          }
          // Pour autres activités cardio, on pourrait les ajouter dans un type 'cardio' si nécessaire
        }
      });
      newSessions.jumprope = existingJumpRope;
    }
    
    // Mettre à jour enduranceData
    await updateData({
      ...workoutData,
      enduranceData: {
        ...currentEndurance,
        sessions: newSessions,
        lastUpdated: new Date().toISOString()
      }
    });
  }, [workoutData, updateData]);

  const tryFetch = async (path, options) => {
    let lastErr;
    for (const b of BASES) {
      try {
        const res = await fetch(`${b}${path}`, options);
        if (!res.ok) throw new Error(`${res.status}`);
        setBaseUrl(b); // mémoriser le bon port
        return await res.json();
      } catch (e) {
        lastErr = e;
        continue;
      }
    }
    throw lastErr || new Error('fetch failed');
  };

  const fetchStatus = async () => {
    try {
      const json = await tryFetch('/api/garmin/status');
      setStatus(json);
    } catch (e) {
      setStatus({ ok: false, message: "Serveur indisponible", error: e.message });
    }
  };

  const syncNow = async () => {
    try {
      setLoading(true);
      const json = await tryFetch('/api/garmin/sync', { method: 'POST' });
      setStatus({ lastSync: json.lastSync, ok: json.ok, message: json.ok ? 'Sync OK' : 'Erreur sync', error: json.error });
      if (json.data && json.ok) {
        setGarminData(json.data);
        // Sauvegarder dans IndexedDB
        if (dbReady) {
          await saveActivities(json.data.activities || {});
          await saveDailyMetrics(json.data.dailyMetrics || {});
        }
        // Import automatique vers Endurance
        if (json.data.activities && (json.data.activities.swimming?.length > 0 || json.data.activities.jumpRope?.length > 0)) {
          await importToEndurance(json.data);
        }
      }
    } catch (e) {
      try {
        const json = await tryFetch('/api/garmin/sync');
        setStatus({ lastSync: json.lastSync, ok: json.ok !== false, message: 'Sync (GET) OK' });
        if (json.data && json.ok) {
          setGarminData(json.data);
          if (dbReady) {
            await saveActivities(json.data.activities || {});
            await saveDailyMetrics(json.data.dailyMetrics || {});
          }
          if (json.data.activities && (json.data.activities.swimming?.length > 0 || json.data.activities.jumpRope?.length > 0)) {
            await importToEndurance(json.data);
          }
        }
      } catch (e2) {
        setStatus({ ok: false, message: 'Erreur sync', error: e2.message });
      }
    } finally {
      setLoading(false);
    }
  };

  const backfill = async () => {
    if (!startDate || !endDate) return;
    try {
      setLoading(true);
      const query = `?start=${encodeURIComponent(startDate)}&end=${encodeURIComponent(endDate)}`;
      const json = await tryFetch(`/api/garmin/sync${query}`, { method: 'POST' });
      setStatus({ lastSync: json.lastSync, ok: json.ok, message: json.ok ? 'Backfill OK' : 'Backfill erreur', error: json.error });
      if (json.data && json.ok) {
        setGarminData(json.data);
        // Sélectionner la date la plus récente par défaut
        const dates = Object.keys(json.data.dailyMetrics || {}).sort();
        if (dates.length > 0) setSelectedDate(dates[dates.length - 1]);
        // Sauvegarder dans IndexedDB
        if (dbReady) {
          await saveActivities(json.data.activities || {});
          await saveDailyMetrics(json.data.dailyMetrics || {});
        }
        // Import automatique vers Endurance
        if (json.data.activities && (json.data.activities.swimming?.length > 0 || json.data.activities.jumpRope?.length > 0)) {
          await importToEndurance(json.data);
        }
      }
    } catch (e) {
      setStatus({ ok: false, message: 'Backfill erreur', error: e.message });
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchStatus();
    // Charger les données depuis IndexedDB au montage
    if (dbReady) {
      loadAllData().then((loaded) => {
        if (loaded && (Object.keys(loaded.dailyMetrics || {}).length > 0 || loaded.activities?.swimming?.length > 0 || loaded.activities?.jumpRope?.length > 0)) {
          setGarminData({ activities: loaded.activities, dailyMetrics: loaded.dailyMetrics });
          const dates = Object.keys(loaded.dailyMetrics || {}).sort();
          if (dates.length > 0) setSelectedDate(dates[dates.length - 1]);
        }
      });
    }
  }, [dbReady, loadAllData]);

  const renderActivitiesTable = (title, rows, columns) => {
    return (
      <div className="mt-6">
        <h3 className="text-white font-semibold mb-2">{title}</h3>
        {rows && rows.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm text-slate-300 border border-slate-700">
              <thead className="bg-slate-800">
                <tr>
                  {columns.map((c) => (
                    <th key={c.key} className="px-3 py-2 text-left border-b border-slate-700">{c.label}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr key={i} className="odd:bg-slate-800/40">
                    {columns.map((c) => {
                      const value = r[c.key];
                      if (value && typeof value === 'object') {
                        return <td key={c.key} className="px-3 py-2 border-b border-slate-700">{JSON.stringify(value)}</td>;
                      }
                      return <td key={c.key} className="px-3 py-2 border-b border-slate-700">{value ?? ''}</td>;
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-slate-400 text-sm bg-slate-800/40 rounded border border-slate-700 p-3">Aucune activité pour la date synchronisée.</div>
        )}
      </div>
    );
  };

  const renderSwimmingActivity = (activity) => {
    const cal = activity.calories || {};
    const swimming = activity.swimmingMetrics || {};
    const time = activity.timeMetrics || {};
    const intensity = activity.intensityMinutes || {};
    
    return (
      <div className="bg-slate-800/60 border border-slate-700 rounded-lg p-4 mb-4">
        <div className="flex justify-between items-start mb-3">
          <div>
            <h4 className="text-white font-semibold">🏊 Natation - {activity.date} {activity.time}</h4>
          </div>
          <div className="text-slate-400 text-xs">ID: {activity.id}</div>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
          <div><span className="text-slate-400">Distance:</span> <span className="text-white">{activity.distance || 0} km</span></div>
          <div><span className="text-slate-400">Durée:</span> <span className="text-white">{Math.floor((activity.duration || 0) / 60)}min {activity.duration % 60}s</span></div>
          <div><span className="text-slate-400">Longueurs:</span> <span className="text-white">{activity.laps || 0}</span></div>
          
          <div><span className="text-slate-400">FC moyenne:</span> <span className="text-white">{activity.avgHR || 0} bpm</span></div>
          <div><span className="text-slate-400">FC max:</span> <span className="text-white">{activity.maxHR || 0} bpm</span></div>
          <div><span className="text-slate-400">Calories totales:</span> <span className="text-white">{cal.total || 0} kcal</span></div>
          
          {cal.resting && <div><span className="text-slate-400">Cal. repos:</span> <span className="text-white">{cal.resting} kcal</span></div>}
          {cal.active && <div><span className="text-slate-400">Cal. actives:</span> <span className="text-white">{cal.active} kcal</span></div>}
          {activity.sweatLoss && <div><span className="text-slate-400">Transpiration:</span> <span className="text-white">{activity.sweatLoss} ml</span></div>}
          
          {intensity.total && (
            <>
              <div><span className="text-slate-400">Intensité modérée:</span> <span className="text-white">{intensity.moderate || 0} min</span></div>
              <div><span className="text-slate-400">Intensité soutenue:</span> <span className="text-white">{intensity.vigorous || 0} min</span></div>
              <div><span className="text-slate-400">Total intensif:</span> <span className="text-white">{intensity.total} min</span></div>
            </>
          )}
        </div>
        
        {swimming && Object.keys(swimming).length > 0 && (
          <div className="mt-4 pt-4 border-t border-slate-700">
            <h5 className="text-slate-300 font-medium mb-2">Métriques de nage:</h5>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
              {swimming.strokeCount && <div><span className="text-slate-400">Mouvements:</span> <span className="text-white">{swimming.strokeCount}</span></div>}
              {swimming.avgStrokeRate && <div><span className="text-slate-400">Fréq. moyenne:</span> <span className="text-white">{swimming.avgStrokeRate} strokes/min</span></div>}
              {swimming.avgMovementsPerLap && <div><span className="text-slate-400">Mouv./longueur:</span> <span className="text-white">{swimming.avgMovementsPerLap}</span></div>}
              {swimming.avgSwolf && <div><span className="text-slate-400">SWOLF moyen:</span> <span className="text-white">{swimming.avgSwolf}</span></div>}
              {swimming.avgPace && <div><span className="text-slate-400">Allure moy.:</span> <span className="text-white">{Math.floor(swimming.avgPace / 60)}:{String(swimming.avgPace % 60).padStart(2, '0')}/100m</span></div>}
              {swimming.avgPaceMovement && <div><span className="text-slate-400">Allure moy. déplacement:</span> <span className="text-white">{Math.floor(swimming.avgPaceMovement / 60)}:{String(swimming.avgPaceMovement % 60).padStart(2, '0')}/100m</span></div>}
              {swimming.bestPace && <div><span className="text-slate-400">Meilleure allure:</span> <span className="text-white">{Math.floor(swimming.bestPace / 60)}:{String(swimming.bestPace % 60).padStart(2, '0')}/100m</span></div>}
              {swimming.avgSpeed && <div><span className="text-slate-400">Vitesse moy.:</span> <span className="text-white">{swimming.avgSpeed} km/h</span></div>}
              {swimming.avgSpeedMovement && <div><span className="text-slate-400">Vitesse moy. déplacement:</span> <span className="text-white">{swimming.avgSpeedMovement} km/h</span></div>}
              {swimming.maxSpeed && <div><span className="text-slate-400">Vitesse max:</span> <span className="text-white">{swimming.maxSpeed} km/h</span></div>}
            </div>
          </div>
        )}
        
        {time && (time.activeTime || time.elapsedTime) && (
          <div className="mt-2 text-xs text-slate-400">
            {time.totalTime && <span>Temps total: {Math.floor(time.totalTime / 60)}min {time.totalTime % 60}s</span>}
            {time.activeTime && <span className="ml-3">Temps actif: {Math.floor(time.activeTime / 60)}min {time.activeTime % 60}s</span>}
            {time.elapsedTime && <span className="ml-3">Temps écoulé: {Math.floor(time.elapsedTime / 60)}min {time.elapsedTime % 60}s</span>}
          </div>
        )}
      </div>
    );
  };

  const renderJumpropeActivity = (activity) => {
    const cal = activity.calories || {};
    const connectIQ = activity.connectIQ || {};
    const intensity = activity.intensityMinutes || {};
    
    return (
      <div className="bg-slate-800/60 border border-slate-700 rounded-lg p-4 mb-4">
        <div className="flex justify-between items-start mb-3">
          <div>
            <h4 className="text-white font-semibold">🪢 Corde à sauter - {activity.date} {activity.time}</h4>
          </div>
          <div className="text-slate-400 text-xs">ID: {activity.id}</div>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
          <div><span className="text-slate-400">Durée:</span> <span className="text-white">{Math.floor((activity.duration || 0) / 60)}min {activity.duration % 60}s</span></div>
          <div><span className="text-slate-400">Sauts:</span> <span className="text-white">{activity.jumps || 0}</span></div>
          <div><span className="text-slate-400">FC moyenne:</span> <span className="text-white">{activity.avgHR || 0} bpm</span></div>
          
          <div><span className="text-slate-400">FC max:</span> <span className="text-white">{activity.maxHR || 0} bpm</span></div>
          <div><span className="text-slate-400">Calories totales:</span> <span className="text-white">{cal.total || 0} kcal</span></div>
          {cal.resting && <div><span className="text-slate-400">Cal. repos:</span> <span className="text-white">{cal.resting} kcal</span></div>}
          
          {cal.active && <div><span className="text-slate-400">Cal. actives:</span> <span className="text-white">{cal.active} kcal</span></div>}
          {activity.sweatLoss && <div><span className="text-slate-400">Transpiration:</span> <span className="text-white">{activity.sweatLoss} ml</span></div>}
          {intensity.total && <div><span className="text-slate-400">Intensité total:</span> <span className="text-white">{intensity.total} min</span></div>}
          
          {intensity.moderate && <div><span className="text-slate-400">Modérée:</span> <span className="text-white">{intensity.moderate} min</span></div>}
          {intensity.vigorous && <div><span className="text-slate-400">Soutenue:</span> <span className="text-white">{intensity.vigorous} min (x2)</span></div>}
        </div>
        
        {connectIQ && Object.keys(connectIQ).length > 0 && (
          <div className="mt-4 pt-4 border-t border-slate-700">
            <h5 className="text-slate-300 font-medium mb-2">Connect IQ (JumpJump Pro):</h5>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
              {connectIQ.jumps && <div><span className="text-slate-400">Sauts:</span> <span className="text-white">{connectIQ.jumps}</span></div>}
              {connectIQ.duration && <div><span className="text-slate-400">Durée:</span> <span className="text-white">{connectIQ.duration}</span></div>}
              {connectIQ.speed && <div><span className="text-slate-400">Vitesse:</span> <span className="text-white">{connectIQ.speed} sauts/min</span></div>}
              {connectIQ.interruptions !== undefined && <div><span className="text-slate-400">Interruptions:</span> <span className="text-white">{connectIQ.interruptions}</span></div>}
              {connectIQ.maxContinuousJumps && <div><span className="text-slate-400">Max continu:</span> <span className="text-white">{connectIQ.maxContinuousJumps} sauts</span></div>}
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderCardioActivity = (activity) => {
    const cal = activity.calories || {};
    const intensity = activity.intensityMinutes || {};
    
    return (
      <div className="bg-slate-800/60 border border-slate-700 rounded-lg p-4 mb-4">
        <div className="flex justify-between items-start mb-3">
          <div>
            <h4 className="text-white font-semibold">💪 Cardio - {activity.date} {activity.time}</h4>
          </div>
          <div className="text-slate-400 text-xs">ID: {activity.id}</div>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
          <div><span className="text-slate-400">Durée:</span> <span className="text-white">{Math.floor((activity.duration || 0) / 60)}min {activity.duration % 60}s</span></div>
          <div><span className="text-slate-400">FC moyenne:</span> <span className="text-white">{activity.avgHR || 0} bpm</span></div>
          <div><span className="text-slate-400">FC max:</span> <span className="text-white">{activity.maxHR || 0} bpm</span></div>
          
          <div><span className="text-slate-400">Calories totales:</span> <span className="text-white">{cal.total || 0} kcal</span></div>
          {cal.resting && <div><span className="text-slate-400">Cal. repos:</span> <span className="text-white">{cal.resting} kcal</span></div>}
          {cal.active && <div><span className="text-slate-400">Cal. actives:</span> <span className="text-white">{cal.active} kcal</span></div>}
          
          {activity.sweatLoss && <div><span className="text-slate-400">Transpiration:</span> <span className="text-white">{activity.sweatLoss} ml</span></div>}
          {intensity.total && <div><span className="text-slate-400">Intensité total:</span> <span className="text-white">{intensity.total} min</span></div>}
          
          {intensity.moderate && <div><span className="text-slate-400">Modérée:</span> <span className="text-white">{intensity.moderate} min</span></div>}
          {intensity.vigorous && <div><span className="text-slate-400">Soutenue:</span> <span className="text-white">{intensity.vigorous} min (x2)</span></div>}
        </div>
      </div>
    );
  };

  const renderDailyMetrics = (dailyMetrics) => {
    if (!dailyMetrics) return null;
    const dateKeys = Object.keys(dailyMetrics).sort();
    if (dateKeys.length === 0) return null;
    
    const displayDate = selectedDate || dateKeys[dateKeys.length - 1];
    const d = dailyMetrics[displayDate] || {};
    const calories = d.calories || {};
    const hr = d.heartRate || {};
    
    return (
      <div className="mt-6">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-white font-semibold">Métriques quotidiennes</h3>
          {dateKeys.length > 1 && (
            <select
              value={displayDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-slate-900 border border-slate-700 rounded px-2 py-1 text-slate-200 text-sm"
            >
              {dateKeys.map((dk) => (
                <option key={dk} value={dk}>{dk}</option>
              ))}
            </select>
          )}
        </div>
        
        {/* Tableau historique (toutes les dates) */}
        {dateKeys.length > 1 && (
          <div className="mb-4 overflow-x-auto">
            <table className="min-w-full text-xs text-slate-300 border border-slate-700">
              <thead className="bg-slate-800">
                <tr>
                  <th className="px-2 py-1 text-left border-b border-slate-700">Date</th>
                  <th className="px-2 py-1 text-left border-b border-slate-700">Pas</th>
                  <th className="px-2 py-1 text-left border-b border-slate-700">Distance (km)</th>
                  <th className="px-2 py-1 text-left border-b border-slate-700">Calories</th>
                  <th className="px-2 py-1 text-left border-b border-slate-700">FC repos</th>
                  <th className="px-2 py-1 text-left border-b border-slate-700">FC max</th>
                  <th className="px-2 py-1 text-left border-b border-slate-700">Sommeil</th>
                  <th className="px-2 py-1 text-left border-b border-slate-700">Intensité</th>
                </tr>
              </thead>
              <tbody>
                {dateKeys.map((dk) => {
                  const dm = dailyMetrics[dk] || {};
                  const cal = dm.calories || {};
                  const hr = dm.heartRate || {};
                  const sleep = dm.sleep;
                  const sleepStr = sleep && sleep.duration ? `${Math.floor(sleep.duration)}h${Math.round((sleep.duration % 1) * 60)}m` : '—';
                  const intensityStr = dm.intensityMinutes ? `${dm.intensityMinutes.total || 0} min` : '—';
                  return (
                    <tr
                      key={dk}
                      className={`odd:bg-slate-800/40 cursor-pointer ${dk === displayDate ? 'bg-blue-900/30' : ''}`}
                      onClick={() => setSelectedDate(dk)}
                    >
                      <td className="px-2 py-1 border-b border-slate-700">{dk}</td>
                      <td className="px-2 py-1 border-b border-slate-700">{dm.steps ?? 0}</td>
                      <td className="px-2 py-1 border-b border-slate-700">{dm.distance ?? 0}</td>
                      <td className="px-2 py-1 border-b border-slate-700">{cal.total ?? 0}</td>
                      <td className="px-2 py-1 border-b border-slate-700">{hr.resting ?? 0} bpm</td>
                      <td className="px-2 py-1 border-b border-slate-700">{hr.max ?? 0} bpm</td>
                      <td className="px-2 py-1 border-b border-slate-700">{sleepStr}</td>
                      <td className="px-2 py-1 border-b border-slate-700">{intensityStr}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        
        {/* Détails de la date sélectionnée */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-slate-800/60 border border-slate-700 rounded p-3">
            <div className="text-slate-400 text-xs">Pas</div>
            <div className="text-white text-lg">{d.steps ?? 0}</div>
          </div>
          <div className="bg-slate-800/60 border border-slate-700 rounded p-3">
            <div className="text-slate-400 text-xs">Distance (km)</div>
            <div className="text-white text-lg">{d.distance ?? 0}</div>
          </div>
          <div className="bg-slate-800/60 border border-slate-700 rounded p-3">
            <div className="text-slate-400 text-xs">Étages</div>
            <div className="text-white text-lg">{d.floors ?? 0}</div>
          </div>
          <div className="bg-slate-800/60 border border-slate-700 rounded p-3">
            <div className="text-slate-400 text-xs">Calories totales</div>
            <div className="text-white text-lg">{calories.total ?? 0}</div>
            <div className="text-slate-400 text-xs mt-1">Actives: {calories.active ?? 0} • Repos: {calories.resting ?? 0}</div>
          </div>
          <div className="bg-slate-800/60 border border-slate-700 rounded p-3">
            <div className="text-slate-400 text-xs">FC repos</div>
            <div className="text-white text-lg">{hr.resting ?? 0} bpm</div>
          </div>
          <div className="bg-slate-800/60 border border-slate-700 rounded p-3">
            <div className="text-slate-400 text-xs">FC max</div>
            <div className="text-white text-lg">{hr.max ?? 0} bpm</div>
          </div>
          {(hr.avg || hr.avg === 0) && (
            <div className="bg-slate-800/60 border border-slate-700 rounded p-3">
              <div className="text-slate-400 text-xs">FC moyenne</div>
              <div className="text-white text-lg">{hr.avg ?? 0} bpm</div>
            </div>
          )}
          {d.sleep && (
            <div className="bg-slate-800/60 border border-slate-700 rounded p-3 md:col-span-2">
              <div className="text-slate-400 text-xs">Sommeil</div>
              <div className="text-white text-lg">
                {d.sleep.duration ? `${Math.floor(d.sleep.duration)}h ${Math.round((d.sleep.duration % 1) * 60)}m` : '—'}
              </div>
              {d.sleep.quality > 0 && (
                <div className="text-slate-400 text-xs mt-1">Qualité: {d.sleep.quality}/100</div>
              )}
              {(d.sleep.deepSleep || d.sleep.lightSleep || d.sleep.remSleep) && (
                <div className="text-slate-400 text-xs mt-1">
                  {d.sleep.deepSleep && <span>Profond: {Math.floor(d.sleep.deepSleep)}h{Math.round((d.sleep.deepSleep % 1) * 60)}m</span>}
                  {d.sleep.lightSleep && <span className="ml-2">Léger: {Math.floor(d.sleep.lightSleep)}h{Math.round((d.sleep.lightSleep % 1) * 60)}m</span>}
                  {d.sleep.remSleep && <span className="ml-2">REM: {Math.floor(d.sleep.remSleep)}h{Math.round((d.sleep.remSleep % 1) * 60)}m</span>}
                </div>
              )}
              {(d.sleep.bedTime || d.sleep.wakeTime) && (
                <div className="text-slate-400 text-xs mt-1">
                  {d.sleep.bedTime && <span>Coucher: {d.sleep.bedTime}</span>}
                  {d.sleep.wakeTime && <span className="ml-2">Lever: {d.sleep.wakeTime}</span>}
                </div>
              )}
            </div>
          )}
          {d.respiration && (
            <div className="bg-slate-800/60 border border-slate-700 rounded p-3 md:col-span-2">
              <div className="text-slate-400 text-xs mb-3 font-semibold">Respiration (resp/min)</div>
              <div className="space-y-3">
                {d.respiration.awake && (d.respiration.awake.min || d.respiration.awake.max || d.respiration.awake.avg) && (
                  <div>
                    <div className="text-slate-300 text-xs mb-2 font-medium">Éveillé</div>
                    <div className="flex gap-3 flex-wrap">
                      {d.respiration.awake.min && (
                        <div className="bg-slate-900/60 border border-slate-600 rounded px-2 py-1">
                          <span className="text-slate-400 text-xs">Min</span>
                          <div className="text-white text-sm font-semibold">{d.respiration.awake.min}</div>
                        </div>
                      )}
                      {d.respiration.awake.avg && (
                        <div className="bg-slate-900/60 border border-slate-600 rounded px-2 py-1">
                          <span className="text-slate-400 text-xs">Moy</span>
                          <div className="text-white text-sm font-semibold">{d.respiration.awake.avg}</div>
                        </div>
                      )}
                      {d.respiration.awake.max && (
                        <div className="bg-slate-900/60 border border-slate-600 rounded px-2 py-1">
                          <span className="text-slate-400 text-xs">Max</span>
                          <div className="text-white text-sm font-semibold">{d.respiration.awake.max}</div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
                {d.respiration.sleep && (d.respiration.sleep.min || d.respiration.sleep.max || d.respiration.sleep.avg) && (
                  <div>
                    <div className="text-slate-300 text-xs mb-2 font-medium">Sommeil</div>
                    <div className="flex gap-3 flex-wrap">
                      {d.respiration.sleep.min && (
                        <div className="bg-slate-900/60 border border-slate-600 rounded px-2 py-1">
                          <span className="text-slate-400 text-xs">Min</span>
                          <div className="text-white text-sm font-semibold">{d.respiration.sleep.min}</div>
                        </div>
                      )}
                      {d.respiration.sleep.avg && (
                        <div className="bg-slate-900/60 border border-slate-600 rounded px-2 py-1">
                          <span className="text-slate-400 text-xs">Moy</span>
                          <div className="text-white text-sm font-semibold">{d.respiration.sleep.avg}</div>
                        </div>
                      )}
                      {d.respiration.sleep.max && (
                        <div className="bg-slate-900/60 border border-slate-600 rounded px-2 py-1">
                          <span className="text-slate-400 text-xs">Max</span>
                          <div className="text-white text-sm font-semibold">{d.respiration.sleep.max}</div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
          {d.intensityMinutes && (
            <div className="bg-slate-800/60 border border-slate-700 rounded p-3">
              <div className="text-slate-400 text-xs">Minutes intensives</div>
              <div className="text-white text-lg">{d.intensityMinutes.total ?? 0} min</div>
              <div className="text-slate-400 text-xs mt-1">
                Modérée: {d.intensityMinutes.moderate ?? 0} • Soutenue: {d.intensityMinutes.vigorous ?? 0} (x2)
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-5xl mx-auto">
      <div className="bg-slate-800/80 backdrop-blur-sm rounded-xl border border-slate-700 p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-white">Garmin</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowRaw((v) => !v)}
              className="px-3 py-2 rounded-md bg-slate-700 hover:bg-slate-600 text-slate-200"
            >
              {showRaw ? 'Masquer JSON' : 'Voir JSON'}
            </button>
            <button
              onClick={syncNow}
              disabled={loading}
              className={`px-4 py-2 rounded-md ${loading ? 'bg-slate-600' : 'bg-blue-600 hover:bg-blue-700'} text-white`}
            >
              {loading ? 'Synchronisation...' : 'Synchroniser'}
            </button>
          </div>
        </div>

        {/* Backfill */}
        <div className="mt-4 flex flex-wrap items-end gap-3">
          <div>
            <div className="text-slate-400 text-xs mb-1">Début</div>
            <input type="date" value={startDate} onChange={(e)=>setStartDate(e.target.value)} className="bg-slate-900 border border-slate-700 rounded px-2 py-1 text-slate-200" />
          </div>
          <div>
            <div className="text-slate-400 text-xs mb-1">Fin</div>
            <input type="date" value={endDate} onChange={(e)=>setEndDate(e.target.value)} className="bg-slate-900 border border-slate-700 rounded px-2 py-1 text-slate-200" />
          </div>
          <button onClick={backfill} disabled={loading || !startDate || !endDate} className="px-4 py-2 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white">Backfill</button>
        </div>

        <div className="mt-4 text-left text-slate-300">
          <div>Statut: {status?.ok ? 'OK' : 'Indisponible'}</div>
          <div>Dernière synchronisation: {status?.lastSync || '—'}</div>
          {status?.message && <div>Message: {status.message}</div>}
          {baseUrl && <div>Serveur: {baseUrl}</div>}
          {status?.error && <div className="text-rose-400">Erreur: {status.error}</div>}
        </div>

        {garminData && (
          <div className="mt-8">
            {/* Natation - Détails complets */}
            {(garminData.activities?.swimming?.length > 0) && (
              <div className="mt-6">
                <h3 className="text-white font-semibold mb-4">🏊 Activités de Natation</h3>
                {(garminData.activities.swimming || []).map((activity, idx) => (
                  <React.Fragment key={activity.id || idx}>
                    {renderSwimmingActivity(activity)}
                  </React.Fragment>
                ))}
              </div>
            )}

            {/* Corde à sauter - Détails complets */}
            {(garminData.activities?.jumpRope?.length > 0) && (
              <div className="mt-6">
                <h3 className="text-white font-semibold mb-4">🪢 Activités Corde à sauter</h3>
                {(garminData.activities.jumpRope || []).map((activity, idx) => (
                  <React.Fragment key={activity.id || idx}>
                    {renderJumpropeActivity(activity)}
                  </React.Fragment>
                ))}
              </div>
            )}

            {/* Cardio - Détails complets */}
            {(garminData.activities?.cardio?.length > 0) && (
              <div className="mt-6">
                <h3 className="text-white font-semibold mb-4">💪 Activités Cardio</h3>
                <div className="text-slate-400 text-sm mb-2">Nombre d'activités: {(garminData.activities.cardio || []).length}</div>
                {(garminData.activities.cardio || []).map((activity, idx) => (
                  <React.Fragment key={activity.id || idx}>
                    {renderCardioActivity(activity)}
                  </React.Fragment>
                ))}
              </div>
            )}

            {renderDailyMetrics(garminData.dailyMetrics)}

            {showRaw && (
              <pre className="mt-6 bg-slate-900 text-slate-200 text-xs p-3 rounded border border-slate-700 overflow-x-auto">
                {JSON.stringify(garminData, null, 2)}
              </pre>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default GraminTab;


