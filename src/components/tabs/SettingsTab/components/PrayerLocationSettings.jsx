/**
 * Localisation + méthode + ajustements horaires de prière (quêtes).
 */

import React, { useState, useEffect } from 'react';
import { MapPin } from 'lucide-react';
import Card, { CardHeader, CardTitle, CardContent } from '../../../ui/Card';
import { loadFromStorage, saveToStorage, STORAGE_KEYS } from '../../../../hooks/useQuietQuestEngine';
import { PRAYER_METHODS } from '../../../../utils/prayerTimes';
import { settingsTheme as S } from '../settingsThemeClasses';

const ADJUSTMENT_KEYS = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'];
const ADJUSTMENT_LABELS = { fajr: 'Fajr', dhuhr: 'Dhuhr', asr: 'Asr', maghrib: 'Maghrib', isha: 'Isha' };

export default function PrayerLocationSettings() {
  const [lat, setLat] = useState('');
  const [lng, setLng] = useState('');
  const [method, setMethod] = useState('MoonsightingCommittee');
  const [adjustments, setAdjustments] = useState({ fajr: 0, dhuhr: 0, asr: 0, maghrib: 0, isha: 0 });
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const appState = loadFromStorage(STORAGE_KEYS.appState, {});
    const loc = appState.prayerLocation;
    if (loc && typeof loc.lat === 'number' && typeof loc.lng === 'number') {
      setLat(String(loc.lat));
      setLng(String(loc.lng));
      if (loc.method) setMethod(loc.method);
      if (loc.adjustments && typeof loc.adjustments === 'object') {
        setAdjustments((prev) => ({ ...prev, ...loc.adjustments }));
      }
    }
  }, []);

  const handleSave = () => {
    const latNum = parseFloat(lat.replace(',', '.'));
    const lngNum = parseFloat(lng.replace(',', '.'));
    if (Number.isNaN(latNum) || Number.isNaN(lngNum) || latNum < -90 || latNum > 90 || lngNum < -180 || lngNum > 180) {
      return;
    }
    const appState = loadFromStorage(STORAGE_KEYS.appState, {});
    const adj = {};
    ADJUSTMENT_KEYS.forEach((k) => { adj[k] = Number(adjustments[k]) || 0; });
    const newLocation = { lat: latNum, lng: lngNum, method, adjustments: adj };
    saveToStorage(STORAGE_KEYS.appState, { ...appState, prayerLocation: newLocation });
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('prayerLocationUpdated'));
    }
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const latNum = parseFloat(lat.replace(',', '.'));
  const lngNum = parseFloat(lng.replace(',', '.'));
  const isValid = !Number.isNaN(latNum) && !Number.isNaN(lngNum) && latNum >= -90 && latNum <= 90 && lngNum >= -180 && lngNum <= 180;

  return (
    <Card variant="settings">
      <CardHeader variant="settings">
        <CardTitle tone="settings" className="flex items-center normal-case tracking-normal">
          <MapPin className="mr-2 text-red-400" size={20} />
          Horaires de prière (quêtes)
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <p className={`${S.body}`}>
            Position et méthode de calcul pour que les quêtes &quot;Prière&quot; affichent les bons horaires. Si ton appli ou ta mosquée utilise une autre méthode, choisis-la ci-dessous ou ajoute un décalage en minutes.
          </p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={`mb-1 block ${S.labelXs}`}>Latitude</label>
              <input
                type="text"
                value={lat}
                onChange={(e) => setLat(e.target.value)}
                placeholder="ex. 48.86"
                className={S.input}
              />
            </div>
            <div>
              <label className={`mb-1 block ${S.labelXs}`}>Longitude</label>
              <input
                type="text"
                value={lng}
                onChange={(e) => setLng(e.target.value)}
                placeholder="ex. 2.35"
                className={S.input}
              />
            </div>
          </div>
          <div>
            <label className={`mb-1 block ${S.labelXs}`}>Méthode de calcul</label>
            <select
              value={method}
              onChange={(e) => setMethod(e.target.value)}
              className={S.input}
            >
              {PRAYER_METHODS.map((m) => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </select>
            <p className={`mt-0.5 ${S.mutedXs}`}>Choisis la même que ton appli ou ta mosquée pour limiter l’écart.</p>
          </div>
          <div>
            <label className={`mb-1 block ${S.labelXs}`}>Décalage (minutes)</label>
            <p className={`mb-1.5 ${S.mutedXs}`}>Pour coller à ta mosquée : ex. Fajr +5 si l’app affiche 5 min plus tard.</p>
            <div className="flex flex-wrap gap-2">
              {ADJUSTMENT_KEYS.map((k) => (
                <div key={k} className="flex items-center gap-1">
                  <span className={`w-14 text-xs ${S.muted}`}>{ADJUSTMENT_LABELS[k]}</span>
                  <input
                    type="number"
                    value={adjustments[k]}
                    onChange={(e) => setAdjustments((prev) => ({ ...prev, [k]: parseInt(e.target.value, 10) || 0 }))}
                    className="w-14 rounded border border-red-900/55 bg-black px-2 py-1 text-sm text-red-100"
                    placeholder="0"
                    min="-60"
                    max="60"
                  />
                </div>
              ))}
            </div>
          </div>
          <p className={S.mutedXs}>
            Coordonnées : Google Maps → clic droit sur un point → coordonnées.
          </p>
          <button
            type="button"
            onClick={handleSave}
            disabled={!isValid}
            className={`${S.btnSm} disabled:opacity-50`}
          >
            {saved ? 'Enregistré ✓' : 'Enregistrer'}
          </button>
        </div>
      </CardContent>
    </Card>
  );
}
