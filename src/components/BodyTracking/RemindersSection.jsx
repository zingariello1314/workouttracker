import React, { useState, useEffect, useMemo } from 'react';
import { 
  Bell, 
  Clock, 
  Calendar, 
  Plus, 
  Trash2, 
  Edit3, 
  Save, 
  X,
  AlertCircle,
  CheckCircle,
  Settings,
  Smartphone,
  Mail,
  Volume2,
  VolumeX
} from 'lucide-react';
import { useWorkout } from '../../context/WorkoutContext';
import Card, { CardHeader, CardTitle, CardContent } from '../ui/Card';
import Button from '../ui/Button';
import { formatDate } from '../../utils/dateUtils';
import {
  isNotificationSupported,
  getNotificationPermission,
  requestNotificationPermission,
  scheduleNotifications,
  registerServiceWorker,
  calculateNextTriggerForReminder
} from './utils/notificationService';
import logger from '../../utils/logger';

const log = logger.component('RemindersSection');

const RemindersSection = () => {
  const { data, updateData } = useWorkout();
  
  // Fonction helper pour calculer nextTrigger avec format ISO
  const calculateNextTriggerDefault = (reminder) => {
    const now = new Date();
    const [hours, minutes] = reminder.time.split(':').map(Number);
    
    let nextDate = new Date();
    nextDate.setHours(hours, minutes, 0, 0);
    
    switch (reminder.frequency) {
      case 'daily':
        if (nextDate <= now) {
          nextDate.setDate(nextDate.getDate() + 1);
        }
        break;
      case 'weekly':
        const targetDay = reminder.dayOfWeek;
        const currentDay = nextDate.getDay();
        let daysUntilTarget = (targetDay - currentDay + 7) % 7;
        if (daysUntilTarget === 0 && nextDate <= now) {
          daysUntilTarget = 7;
        }
        nextDate.setDate(nextDate.getDate() + daysUntilTarget);
        break;
      case 'biweekly':
        const targetDayBi = reminder.dayOfWeek;
        const currentDayBi = nextDate.getDay();
        let daysUntilTargetBi = (targetDayBi - currentDayBi + 7) % 7;
        if (daysUntilTargetBi === 0 && nextDate <= now) {
          daysUntilTargetBi = 14;
        }
        nextDate.setDate(nextDate.getDate() + daysUntilTargetBi);
        break;
      case 'monthly':
        nextDate.setDate(reminder.dayOfMonth);
        if (nextDate <= now) {
          nextDate.setMonth(nextDate.getMonth() + 1);
        }
        break;
    }
    
    return nextDate;
  };
  
  // Reminders par défaut pour nouveaux utilisateurs (une seule fois)
  const defaultReminders = useMemo(() => [
    {
      id: Date.now() + 1,
      type: 'weight',
      title: 'Pesée hebdomadaire',
      description: 'Rappel pour se peser',
      frequency: 'weekly',
      dayOfWeek: 1, // Lundi
      time: '08:00',
      enabled: true,
      lastTriggered: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      nextTrigger: calculateNextTriggerDefault({
        frequency: 'weekly',
        dayOfWeek: 1,
        time: '08:00'
      }).toISOString(),
      methods: ['notification', 'sound']
    },
    {
      id: Date.now() + 2,
      type: 'measurements',
      title: 'Mensurations mensuelles',
      description: 'Prendre les mesures corporelles',
      frequency: 'monthly',
      dayOfMonth: 1,
      time: '09:00',
      enabled: true,
      lastTriggered: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
      nextTrigger: calculateNextTriggerDefault({
        frequency: 'monthly',
        dayOfMonth: 1,
        time: '09:00'
      }).toISOString(),
      methods: ['notification']
    }
  ], []);

  // Normaliser les reminders depuis IndexedDB (convertir strings ISO en Date objets pour affichage)
  const normalizeReminders = (remindersFromDB) => {
    if (!Array.isArray(remindersFromDB) || remindersFromDB.length === 0) {
      return [];
    }
    
    return remindersFromDB.map(reminder => ({
      ...reminder,
      // Convertir les dates ISO strings en Date objets si nécessaire
      lastTriggered: reminder.lastTriggered 
        ? (reminder.lastTriggered instanceof Date 
            ? reminder.lastTriggered 
            : new Date(reminder.lastTriggered))
        : null,
      nextTrigger: reminder.nextTrigger 
        ? (reminder.nextTrigger instanceof Date 
            ? reminder.nextTrigger 
            : new Date(reminder.nextTrigger))
        : new Date()
    }));
  };

  // Charger reminders depuis IndexedDB ou utiliser defaults si première fois
  const [reminders, setReminders] = useState(() => {
    const savedReminders = data?.bodyTrackingReminders;
    
    if (savedReminders && Array.isArray(savedReminders) && savedReminders.length > 0) {
      return normalizeReminders(savedReminders);
    }
    
    // Première fois : retourner defaults mais ne pas les sauvegarder automatiquement
    // L'utilisateur pourra les créer manuellement ou ils seront sauvegardés au premier ajout
    return [];
  });

  // Synchroniser avec IndexedDB quand data change
  useEffect(() => {
    const savedReminders = data?.bodyTrackingReminders;
    
    if (savedReminders && Array.isArray(savedReminders)) {
      if (savedReminders.length > 0) {
        // Normaliser et mettre à jour uniquement si différents (éviter boucles infinies)
        const normalized = normalizeReminders(savedReminders);
        setReminders(prev => {
          // Comparer par IDs pour éviter re-renders inutiles
          const prevIds = prev.map(r => r.id).sort().join(',');
          const newIds = normalized.map(r => r.id).sort().join(',');
          
          // Comparaison profonde pour détecter les changements réels
          const prevStr = JSON.stringify(prev.map(r => ({ ...r, lastTriggered: r.lastTriggered?.toISOString(), nextTrigger: r.nextTrigger?.toISOString() })));
          const newStr = JSON.stringify(normalized.map(r => ({ ...r, lastTriggered: r.lastTriggered?.toISOString(), nextTrigger: r.nextTrigger?.toISOString() })));
          
          if (prevIds !== newIds || prevStr !== newStr) {
            return normalized;
          }
          return prev;
        });
      }
      // Si IndexedDB est vide, on garde l'état local actuel
      // L'utilisateur peut créer ses propres reminders
    }
  }, [data?.bodyTrackingReminders]); // Dépendance uniquement sur bodyTrackingReminders

  // 🔔 ÉTAT GESTION NOTIFICATIONS
  const [notificationPermission, setNotificationPermission] = useState(() => getNotificationPermission());
  const [notificationSupported, setNotificationSupported] = useState(() => isNotificationSupported());
  const [serviceWorkerRegistered, setServiceWorkerRegistered] = useState(false);

  // Enregistrer Service Worker au montage
  useEffect(() => {
    if (notificationSupported) {
      registerServiceWorker()
        .then(registration => {
          if (registration) {
            setServiceWorkerRegistered(true);
            log.info('Service Worker enregistré pour notifications');
          } else {
            // Service Worker non disponible (404, etc.) mais notifications Browser API fonctionnent toujours
            log.debug('Notifications Browser API disponibles sans Service Worker');
          }
        })
        .catch(error => {
          // Erreur silencieuse - notifications Browser API fonctionnent toujours
          log.debug('Service Worker non disponible, utilisation notifications Browser API uniquement', error);
        });
    }
  }, [notificationSupported]);

  // Planifier notifications pour rappels actifs
  useEffect(() => {
    if (!notificationSupported || notificationPermission !== 'granted') {
      return;
    }

    const enabledReminders = reminders.filter(r => r.enabled);
    
    if (enabledReminders.length === 0) {
      return;
    }

    // Callback quand un rappel est déclenché
    const onReminderTriggered = (reminder) => {
      log.info('Rappel déclenché', { reminderId: reminder.id, title: reminder.title });
      
      // Mettre à jour lastTriggered et recalculer nextTrigger
      setReminders(prev => {
        const updated = prev.map(r => {
          if (r.id === reminder.id) {
            const newNextTrigger = calculateNextTriggerForReminder({
              ...r,
              lastTriggered: new Date()
            });
            
            return {
              ...r,
              lastTriggered: new Date(),
              nextTrigger: newNextTrigger || r.nextTrigger
            };
          }
          return r;
        });

        // Sauvegarder dans IndexedDB
        const remindersForDB = updated.map(r => ({
          ...r,
          lastTriggered: r.lastTriggered instanceof Date ? r.lastTriggered.toISOString() : r.lastTriggered,
          nextTrigger: r.nextTrigger instanceof Date ? r.nextTrigger.toISOString() : r.nextTrigger
        }));
        
        updateData({ ...data, bodyTrackingReminders: remindersForDB });

        return updated;
      });
    };

    // Planifier notifications
    const stopScheduling = scheduleNotifications(enabledReminders, onReminderTriggered);

    // Nettoyer à la destruction
    return () => {
      stopScheduling();
    };
  }, [reminders, notificationSupported, notificationPermission, data, updateData]);

  // Écouter événements personnalisés pour actions sur notifications
  useEffect(() => {
    const handleReminderClick = (event) => {
      const { reminderId } = event.detail;
      // Naviguer vers le rappel (ou ouvrir formulaire édition)
      const reminder = reminders.find(r => r.id === reminderId);
      if (reminder) {
        setEditingReminder(reminder);
        setFormData({
          type: reminder.type,
          title: reminder.title,
          description: reminder.description || '',
          frequency: reminder.frequency,
          dayOfWeek: reminder.dayOfWeek || 1,
          dayOfMonth: reminder.dayOfMonth || 1,
          time: reminder.time || '08:00',
          methods: reminder.methods || ['notification']
        });
        setShowForm(true);
        
        // Scroll vers le formulaire
        setTimeout(() => {
          document.querySelector('.border-yellow-500\\/30')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 100);
      }
    };

    const handleReminderSnooze = (event) => {
      const { reminderId, snoozeHours = 1 } = event.detail;
      setReminders(prev => {
        const updated = prev.map(r => {
          if (r.id === reminderId) {
            const newNextTrigger = new Date(r.nextTrigger);
            newNextTrigger.setHours(newNextTrigger.getHours() + snoozeHours);
            
            return {
              ...r,
              nextTrigger: newNextTrigger
            };
          }
          return r;
        });

        const remindersForDB = updated.map(r => ({
          ...r,
          lastTriggered: r.lastTriggered instanceof Date ? r.lastTriggered.toISOString() : r.lastTriggered,
          nextTrigger: r.nextTrigger instanceof Date ? r.nextTrigger.toISOString() : r.nextTrigger
        }));
        
        updateData({ ...data, bodyTrackingReminders: remindersForDB });

        return updated;
      });
    };

    const handleReminderComplete = (event) => {
      const { reminderId } = event.detail;
      setReminders(prev => {
        const updated = prev.map(r => {
          if (r.id === reminderId) {
            const newNextTrigger = calculateNextTriggerForReminder({
              ...r,
              lastTriggered: new Date()
            });
            
            return {
              ...r,
              lastTriggered: new Date(),
              nextTrigger: newNextTrigger || r.nextTrigger
            };
          }
          return r;
        });

        const remindersForDB = updated.map(r => ({
          ...r,
          lastTriggered: r.lastTriggered instanceof Date ? r.lastTriggered.toISOString() : r.lastTriggered,
          nextTrigger: r.nextTrigger instanceof Date ? r.nextTrigger.toISOString() : r.nextTrigger
        }));
        
        updateData({ ...data, bodyTrackingReminders: remindersForDB });

        return updated;
      });
    };

    window.addEventListener('bodyTracking:reminderClick', handleReminderClick);
    window.addEventListener('bodyTracking:reminderSnooze', handleReminderSnooze);
    window.addEventListener('bodyTracking:reminderComplete', handleReminderComplete);

    return () => {
      window.removeEventListener('bodyTracking:reminderClick', handleReminderClick);
      window.removeEventListener('bodyTracking:reminderSnooze', handleReminderSnooze);
      window.removeEventListener('bodyTracking:reminderComplete', handleReminderComplete);
    };
  }, [reminders, data, updateData]);

  // Fonction pour demander permission notifications
  const handleRequestNotificationPermission = async () => {
    const permission = await requestNotificationPermission();
    setNotificationPermission(permission);
    
    if (permission === 'granted') {
      log.info('Permission notifications accordée');
    } else {
      log.warn('Permission notifications refusée', { permission });
    }
  };

  const [showForm, setShowForm] = useState(false);
  const [editingReminder, setEditingReminder] = useState(null);
  const [formData, setFormData] = useState({
    type: 'weight',
    title: '',
    description: '',
    frequency: 'weekly',
    dayOfWeek: 1,
    dayOfMonth: 1,
    time: '08:00',
    methods: ['notification']
  });

  const reminderTypes = [
    { value: 'weight', label: 'Pesée', icon: '⚖️' },
    { value: 'measurements', label: 'Mensurations', icon: '📏' },
    { value: 'photos', label: 'Photos', icon: '📸' },
    { value: 'impedance', label: 'Impédancemétrie', icon: '⚡' },
    { value: 'custom', label: 'Personnalisé', icon: '🔔' }
  ];

  const frequencies = [
    { value: 'daily', label: 'Quotidien' },
    { value: 'weekly', label: 'Hebdomadaire' },
    { value: 'biweekly', label: 'Bi-hebdomadaire' },
    { value: 'monthly', label: 'Mensuel' },
    { value: 'custom', label: 'Personnalisé' }
  ];

  const daysOfWeek = [
    'Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'
  ];

  const notificationMethods = [
    { value: 'notification', label: 'Notification', icon: <Bell className="w-4 h-4" /> },
    { value: 'sound', label: 'Son', icon: <Volume2 className="w-4 h-4" /> },
    { value: 'email', label: 'Email', icon: <Mail className="w-4 h-4" /> },
    { value: 'sms', label: 'SMS', icon: <Smartphone className="w-4 h-4" /> }
  ];

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleMethodToggle = (method) => {
    setFormData(prev => ({
      ...prev,
      methods: prev.methods.includes(method)
        ? prev.methods.filter(m => m !== method)
        : [...prev.methods, method]
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const newReminder = {
      id: editingReminder ? editingReminder.id : Date.now(),
      ...formData,
      enabled: true,
      lastTriggered: null,
      nextTrigger: calculateNextTrigger(formData)
    };

    // Normaliser les dates pour IndexedDB (ISO strings)
    const normalizedReminder = {
      ...newReminder,
      lastTriggered: newReminder.lastTriggered 
        ? (newReminder.lastTriggered instanceof Date 
            ? newReminder.lastTriggered.toISOString() 
            : newReminder.lastTriggered)
        : null,
      nextTrigger: newReminder.nextTrigger 
        ? (newReminder.nextTrigger instanceof Date 
            ? newReminder.nextTrigger.toISOString() 
            : newReminder.nextTrigger)
        : new Date().toISOString()
    };

    if (editingReminder) {
      setReminders(prev => {
        const updatedReminders = prev.map(r => 
          r.id === editingReminder.id 
            ? normalizedReminder 
            : r
        );
        
        // Normaliser toutes les dates pour IndexedDB
        const remindersForDB = updatedReminders.map(r => ({
          ...r,
          lastTriggered: r.lastTriggered instanceof Date ? r.lastTriggered.toISOString() : r.lastTriggered,
          nextTrigger: r.nextTrigger instanceof Date ? r.nextTrigger.toISOString() : r.nextTrigger
        }));
        
        // Sauvegarder les rappels via IndexedDB
        updateData({ ...data, bodyTrackingReminders: remindersForDB });
        return updatedReminders;
      });
    } else {
      setReminders(prev => {
        const updatedReminders = [...prev, normalizedReminder];
        
        // Normaliser toutes les dates pour IndexedDB
        const remindersForDB = updatedReminders.map(r => ({
          ...r,
          lastTriggered: r.lastTriggered instanceof Date ? r.lastTriggered.toISOString() : r.lastTriggered,
          nextTrigger: r.nextTrigger instanceof Date ? r.nextTrigger.toISOString() : r.nextTrigger
        }));
        
        // Sauvegarder les rappels via IndexedDB
        updateData({ ...data, bodyTrackingReminders: remindersForDB });
        return updatedReminders;
      });
    }

    resetForm();
  };

  const calculateNextTrigger = (reminder) => {
    const now = new Date();
    const [hours, minutes] = reminder.time.split(':').map(Number);
    
    let nextDate = new Date();
    nextDate.setHours(hours, minutes, 0, 0);
    
    switch (reminder.frequency) {
      case 'daily':
        if (nextDate <= now) {
          nextDate.setDate(nextDate.getDate() + 1);
        }
        break;
      case 'weekly':
        const targetDay = reminder.dayOfWeek;
        const currentDay = nextDate.getDay();
        let daysUntilTarget = (targetDay - currentDay + 7) % 7;
        if (daysUntilTarget === 0 && nextDate <= now) {
          daysUntilTarget = 7;
        }
        nextDate.setDate(nextDate.getDate() + daysUntilTarget);
        break;
      case 'biweekly':
        // Logique similaire à weekly mais avec 14 jours
        const targetDayBi = reminder.dayOfWeek;
        const currentDayBi = nextDate.getDay();
        let daysUntilTargetBi = (targetDayBi - currentDayBi + 7) % 7;
        if (daysUntilTargetBi === 0 && nextDate <= now) {
          daysUntilTargetBi = 14;
        }
        nextDate.setDate(nextDate.getDate() + daysUntilTargetBi);
        break;
      case 'monthly':
        nextDate.setDate(reminder.dayOfMonth);
        if (nextDate <= now) {
          nextDate.setMonth(nextDate.getMonth() + 1);
        }
        break;
    }
    
    return nextDate;
  };

  const resetForm = () => {
    setFormData({
      type: 'weight',
      title: '',
      description: '',
      frequency: 'weekly',
      dayOfWeek: 1,
      dayOfMonth: 1,
      time: '08:00',
      methods: ['notification']
    });
    setEditingReminder(null);
    setShowForm(false);
  };

  const handleEdit = (reminder) => {
    setFormData({
      type: reminder.type,
      title: reminder.title,
      description: reminder.description,
      frequency: reminder.frequency,
      dayOfWeek: reminder.dayOfWeek || 1,
      dayOfMonth: reminder.dayOfMonth || 1,
      time: reminder.time,
      methods: reminder.methods
    });
    setEditingReminder(reminder);
    setShowForm(true);
  };

  const handleDelete = (id) => {
    setReminders(prev => {
      const updatedReminders = prev.filter(r => r.id !== id);
      
      // Normaliser toutes les dates pour IndexedDB
      const remindersForDB = updatedReminders.map(r => ({
        ...r,
        lastTriggered: r.lastTriggered instanceof Date ? r.lastTriggered.toISOString() : r.lastTriggered,
        nextTrigger: r.nextTrigger instanceof Date ? r.nextTrigger.toISOString() : r.nextTrigger
      }));
      
      // Sauvegarder les rappels via IndexedDB
      updateData({ ...data, bodyTrackingReminders: remindersForDB });
      return updatedReminders;
    });
  };

  const toggleReminder = (id) => {
    setReminders(prev => {
      const updatedReminders = prev.map(r => 
        r.id === id ? { ...r, enabled: !r.enabled } : r
      );
      
      // Normaliser toutes les dates pour IndexedDB
      const remindersForDB = updatedReminders.map(r => ({
        ...r,
        lastTriggered: r.lastTriggered instanceof Date ? r.lastTriggered.toISOString() : r.lastTriggered,
        nextTrigger: r.nextTrigger instanceof Date ? r.nextTrigger.toISOString() : r.nextTrigger
      }));
      
      // Sauvegarder les rappels via IndexedDB
      updateData({ ...data, bodyTrackingReminders: remindersForDB });
      return updatedReminders;
    });
  };

  const getStatusColor = (reminder) => {
    if (!reminder.enabled) return 'text-gray-400';
    
    const now = new Date();
    const timeDiff = reminder.nextTrigger - now;
    const hoursUntil = timeDiff / (1000 * 60 * 60);
    
    if (hoursUntil < 0) return 'text-red-400'; // En retard
    if (hoursUntil < 24) return 'text-yellow-400'; // Bientôt
    return 'text-green-400'; // OK
  };

  const getTimeUntilNext = (nextTrigger) => {
    const now = new Date();
    const diff = nextTrigger - now;
    
    if (diff < 0) return 'En retard';
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (days > 0) return `Dans ${days} jour${days > 1 ? 's' : ''}`;
    if (hours > 0) return `Dans ${hours}h`;
    return 'Bientôt';
  };

  return (
    <div className="space-y-6">
      {/* En-tête avec bouton d'ajout */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Bell className="w-5 h-5 text-yellow-400" />
              Rappels automatisés
              <span className="text-sm font-normal text-slate-400">
                ({reminders.filter(r => r.enabled).length} actifs)
              </span>
              {notificationSupported && (
                <span className={`text-xs px-2 py-1 rounded ${
                  notificationPermission === 'granted' 
                    ? 'bg-green-600/20 text-green-300 border border-green-500/50' 
                    : notificationPermission === 'denied'
                    ? 'bg-red-600/20 text-red-300 border border-red-500/50'
                    : 'bg-yellow-600/20 text-yellow-300 border border-yellow-500/50'
                }`}>
                  {notificationPermission === 'granted' 
                    ? '🔔 Notifications activées' 
                    : notificationPermission === 'denied'
                    ? '🔕 Notifications désactivées'
                    : '⚠️ Permission requise'}
                </span>
              )}
            </CardTitle>
            <div className="flex flex-wrap gap-2">
              {notificationSupported && notificationPermission !== 'granted' && (
                <Button
                  onClick={handleRequestNotificationPermission}
                  variant="ghost"
                  size="sm"
                  className="bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/50"
                >
                  <Bell className="w-4 h-4 mr-2" />
                  {notificationPermission === 'denied' ? 'Réactiver' : 'Activer'} notifications
                </Button>
              )}
              <Button
                onClick={() => setShowForm(true)}
                className="bg-yellow-600 hover:bg-yellow-700"
              >
                <Plus className="w-4 h-4 mr-2" />
                Nouveau rappel
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Formulaire d'ajout/édition */}
      {showForm && (
        <Card className="border-yellow-500/30 bg-yellow-600/10">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              {editingReminder ? 'Modifier le rappel' : 'Nouveau rappel'}
              <Button
                variant="ghost"
                size="sm"
                onClick={resetForm}
              >
                <X className="w-4 h-4" />
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Type */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Type de rappel
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) => handleInputChange('type', e.target.value)}
                    className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white"
                  >
                    {reminderTypes.map(type => (
                      <option key={type.value} value={type.value}>
                        {type.icon} {type.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Fréquence */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Fréquence
                  </label>
                  <select
                    value={formData.frequency}
                    onChange={(e) => handleInputChange('frequency', e.target.value)}
                    className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white"
                  >
                    {frequencies.map(freq => (
                      <option key={freq.value} value={freq.value}>
                        {freq.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Titre */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Titre du rappel
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white"
                  placeholder="Ex: Pesée hebdomadaire"
                  required
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Description (optionnel)
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white"
                  rows="2"
                  placeholder="Description du rappel..."
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Jour de la semaine (pour weekly/biweekly) */}
                {(formData.frequency === 'weekly' || formData.frequency === 'biweekly') && (
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Jour de la semaine
                    </label>
                    <select
                      value={formData.dayOfWeek}
                      onChange={(e) => handleInputChange('dayOfWeek', parseInt(e.target.value))}
                      className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white"
                    >
                      {daysOfWeek.map((day, index) => (
                        <option key={index} value={index}>
                          {day}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Jour du mois (pour monthly) */}
                {formData.frequency === 'monthly' && (
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Jour du mois
                    </label>
                    <select
                      value={formData.dayOfMonth}
                      onChange={(e) => handleInputChange('dayOfMonth', parseInt(e.target.value))}
                      className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white"
                    >
                      {Array.from({ length: 28 }, (_, i) => i + 1).map(day => (
                        <option key={day} value={day}>
                          {day}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Heure */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Heure
                  </label>
                  <input
                    type="time"
                    value={formData.time}
                    onChange={(e) => handleInputChange('time', e.target.value)}
                    className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white"
                  />
                </div>
              </div>

              {/* Méthodes de notification */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Méthodes de notification
                </label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {notificationMethods.map(method => (
                    <label
                      key={method.value}
                      className={`flex items-center gap-2 p-3 rounded-lg border cursor-pointer transition-all ${
                        formData.methods.includes(method.value)
                          ? 'border-yellow-500 bg-yellow-600/20'
                          : 'border-slate-600 bg-slate-700/50 hover:bg-slate-700'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={formData.methods.includes(method.value)}
                        onChange={() => handleMethodToggle(method.value)}
                        className="sr-only"
                      />
                      {method.icon}
                      <span className="text-sm text-white">{method.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex gap-2">
                <Button type="submit" className="bg-yellow-600 hover:bg-yellow-700">
                  <Save className="w-4 h-4 mr-2" />
                  {editingReminder ? 'Modifier' : 'Créer'} le rappel
                </Button>
                <Button type="button" variant="ghost" onClick={resetForm}>
                  Annuler
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Liste des rappels */}
      <div className="space-y-4">
        {reminders.map(reminder => (
          <Card key={reminder.id} className={`${reminder.enabled ? 'border-slate-600' : 'border-slate-700 opacity-60'}`}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">
                        {reminderTypes.find(t => t.value === reminder.type)?.icon}
                      </span>
                      <h3 className="font-semibold text-white">{reminder.title}</h3>
                      <span className={`px-2 py-1 rounded text-xs ${
                        reminder.enabled ? 'bg-green-600/20 text-green-300' : 'bg-gray-600/20 text-gray-400'
                      }`}>
                        {reminder.enabled ? 'Actif' : 'Inactif'}
                      </span>
                    </div>
                  </div>
                  
                  {reminder.description && (
                    <p className="text-sm text-slate-400 mb-2">{reminder.description}</p>
                  )}
                  
                  <div className="flex flex-wrap gap-4 text-sm text-slate-300">
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {frequencies.find(f => f.value === reminder.frequency)?.label} à {reminder.time}
                    </div>
                    
                    {reminder.frequency === 'weekly' || reminder.frequency === 'biweekly' ? (
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {daysOfWeek[reminder.dayOfWeek]}
                      </div>
                    ) : reminder.frequency === 'monthly' ? (
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        Le {reminder.dayOfMonth} du mois
                      </div>
                    ) : null}
                    
                    <div className={`flex items-center gap-1 ${getStatusColor(reminder)}`}>
                      {reminder.enabled ? (
                        <>
                          <Bell className="w-3 h-3" />
                          {getTimeUntilNext(reminder.nextTrigger)}
                        </>
                      ) : (
                        <>
                          <VolumeX className="w-3 h-3" />
                          Désactivé
                        </>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex gap-1 mt-2">
                    {reminder.methods.map(method => {
                      const methodInfo = notificationMethods.find(m => m.value === method);
                      return (
                        <span key={method} className="inline-flex items-center gap-1 px-2 py-1 bg-slate-700 rounded text-xs text-slate-300">
                          {methodInfo?.icon}
                          {methodInfo?.label}
                        </span>
                      );
                    })}
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleReminder(reminder.id)}
                    className={reminder.enabled ? 'text-yellow-400 hover:text-yellow-300' : 'text-green-400 hover:text-green-300'}
                  >
                    {reminder.enabled ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEdit(reminder)}
                  >
                    <Edit3 className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(reminder.id)}
                    className="text-red-400 hover:text-red-300"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {reminders.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <Bell className="w-16 h-16 mx-auto mb-4 text-slate-500" />
            <h4 className="text-xl font-semibold mb-2 text-white">Aucun rappel configuré</h4>
            <p className="text-slate-400 mb-4">
              Créez des rappels pour ne jamais oublier vos mesures et votre suivi corporel.
            </p>
            <Button onClick={() => setShowForm(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Créer le premier rappel
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Paramètres de notification */}
      <Card className="bg-blue-600/10 border-blue-500/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-blue-400" />
            Paramètres de notification
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-white">Notifications push</h4>
                <p className="text-sm text-slate-400">Recevoir des notifications sur cet appareil</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" defaultChecked />
                <div className="w-11 h-6 bg-slate-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-white">Son des notifications</h4>
                <p className="text-sm text-slate-400">Jouer un son lors des rappels</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" defaultChecked />
                <div className="w-11 h-6 bg-slate-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-white">Rappels par email</h4>
                <p className="text-sm text-slate-400">Envoyer des rappels par email</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" />
                <div className="w-11 h-6 bg-slate-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default RemindersSection;