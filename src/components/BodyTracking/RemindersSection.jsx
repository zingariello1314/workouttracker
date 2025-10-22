import React, { useState } from 'react';
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

const RemindersSection = () => {
  const { data, updateData } = useWorkout();
  const [reminders, setReminders] = useState([
    {
      id: 1,
      type: 'weight',
      title: 'Pesée hebdomadaire',
      description: 'Rappel pour se peser',
      frequency: 'weekly',
      dayOfWeek: 1, // Lundi
      time: '08:00',
      enabled: true,
      lastTriggered: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      nextTrigger: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
      methods: ['notification', 'sound']
    },
    {
      id: 2,
      type: 'measurements',
      title: 'Mensurations mensuelles',
      description: 'Prendre les mesures corporelles',
      frequency: 'monthly',
      dayOfMonth: 1,
      time: '09:00',
      enabled: true,
      lastTriggered: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
      nextTrigger: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
      methods: ['notification']
    },
    {
      id: 3,
      type: 'photos',
      title: 'Photos de progression',
      description: 'Prendre des photos de suivi',
      frequency: 'biweekly',
      dayOfWeek: 0, // Dimanche
      time: '10:00',
      enabled: false,
      lastTriggered: null,
      nextTrigger: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
      methods: ['notification']
    },
    {
      id: 4,
      type: 'impedance',
      title: 'Analyse corporelle complète',
      description: 'Mesures d\'impédancemétrie',
      frequency: 'monthly',
      dayOfMonth: 15,
      time: '08:30',
      enabled: true,
      lastTriggered: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
      nextTrigger: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000),
      methods: ['notification', 'email']
    }
  ]);

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

    if (editingReminder) {
      setReminders(prev => {
        const updatedReminders = prev.map(r => r.id === editingReminder.id ? newReminder : r);
        // Sauvegarder les rappels via IndexedDB
        updateData({ ...data, bodyTrackingReminders: updatedReminders });
        return updatedReminders;
      });
    } else {
      setReminders(prev => {
        const updatedReminders = [...prev, newReminder];
        // Sauvegarder les rappels via IndexedDB
        updateData({ ...data, bodyTrackingReminders: updatedReminders });
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
      // Sauvegarder les rappels via IndexedDB
      updateData({ ...data, bodyTrackingReminders: updatedReminders });
      return updatedReminders;
    });
  };

  const toggleReminder = (id) => {
    setReminders(prev => {
      const updatedReminders = prev.map(r => 
        r.id === id ? { ...r, enabled: !r.enabled } : r
      );
      // Sauvegarder les rappels via IndexedDB
      updateData({ ...data, bodyTrackingReminders: updatedReminders });
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
            </CardTitle>
            <Button
              onClick={() => setShowForm(true)}
              className="bg-yellow-600 hover:bg-yellow-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Nouveau rappel
            </Button>
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