import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Bell,
  Clock,
  Calendar,
  Settings,
  Volume2,
  VolumeX,
  Moon,
  Sun,
  Mosque,
  Church,
  Synagogue,
  Star,
  Heart,
  Plus,
  X,
  Check,
  AlertCircle,
  Play,
  Pause,
  RotateCcw,
  ChevronDown,
  ChevronUp,
  Bookmark,
  BookmarkCheck,
  Globe,
  MapPin,
  Sunrise,
  Sunset
} from 'lucide-react';

// Types
interface PrayerTime {
  name: string;
  time: string;
  nextTime: string;
  hasPassed: boolean;
  isNext: boolean;
}

interface Reminder {
  id: string;
  title: string;
  description: string;
  time: string; // HH:MM format
  days: string[]; // Days of week
  isActive: boolean;
  category: 'general' | 'religious' | 'health' | 'work' | 'personal';
  religion?: 'islam' | 'christianity' | 'judaism' | 'hinduism' | 'buddhism' | 'other';
  soundEnabled: boolean;
  recurring: boolean;
  createdAt: string;
}

interface DhikrItem {
  id: string;
  text: string;
  translation: string;
  count: number;
  totalCount: number;
  category: string;
}

interface LocationSettings {
  latitude: number;
  longitude: number;
  city: string;
  country: string;
  timezone: string;
}

interface UserSettings {
  religion: 'islam' | 'christianity' | 'judaism' | 'hinduism' | 'buddhism' | 'none' | 'other';
  notificationsEnabled: boolean;
  soundEnabled: boolean;
  prayerNotifications: boolean;
  reminderNotifications: boolean;
  autoAdjustForTimezone: boolean;
  location: LocationSettings;
  customReminders: Reminder[];
  language: 'en' | 'ar' | 'he' | 'hi' | 'th' | 'es' | 'fr';
}

// Mock data - replace with real prayer time API
const MOCK_DHIKR_ITEMS: DhikrItem[] = [
  {
    id: '1',
    text: 'سُبْحَانَ اللَّهِ',
    translation: 'Subhanallah (Glory be to Allah)',
    count: 33,
    totalCount: 33,
    category: 'tasbih'
  },
  {
    id: '2',
    text: 'الْحَمْدُ لِلَّهِ',
    translation: 'Alhamdulillah (Praise be to Allah)',
    count: 33,
    totalCount: 33,
    category: 'hamd'
  },
  {
    id: '3',
    text: 'اللَّهُ أَكْبَرُ',
    translation: 'Allahu Akbar (Allah is the Greatest)',
    count: 33,
    totalCount: 33,
    category: 'takbir'
  },
  {
    id: '4',
    text: 'لَا إِلَٰهَ إِلَّا اللَّهُ',
    translation: 'La ilaha illallah (There is no god but Allah)',
    count: 1,
    totalCount: 1,
    category: 'tawhid'
  }
];

const MOCK_PRAYER_TIMES = {
  islam: {
    fajr: { name: 'Fajr', time: '05:30', icon: Sunrise },
    dhuhr: { name: 'Dhuhr', time: '12:30', icon: Sun },
    asr: { name: 'Asr', time: '15:45', icon: Sun },
    maghrib: { name: 'Maghrib', time: '18:15', icon: Sunset },
    isha: { name: 'Isha', time: '19:45', icon: Moon }
  },
  christianity: {
    morning: { name: 'Morning Prayer', time: '07:00', icon: Sunrise },
    noon: { name: 'Angelus', time: '12:00', icon: Sun },
    evening: { name: 'Evening Prayer', time: '18:00', icon: Sunset },
    night: { name: 'Night Prayer', time: '21:00', icon: Moon }
  },
  judaism: {
    shacharit: { name: 'Shacharit', time: '07:00', icon: Sunrise },
    mincha: { name: 'Mincha', time: '13:00', icon: Sun },
    maariv: { name: 'Maariv', time: '19:00', icon: Sunset }
  }
};

const DEFAULT_SETTINGS: UserSettings = {
  religion: 'islam',
  notificationsEnabled: true,
  soundEnabled: true,
  prayerNotifications: true,
  reminderNotifications: true,
  autoAdjustForTimezone: true,
  location: {
    latitude: 40.7128,
    longitude: -74.0060,
    city: 'New York',
    country: 'USA',
    timezone: 'America/New_York'
  },
  customReminders: [],
  language: 'en'
};

// Main Component
export const ReminderAndPrayerWidget: React.FC = () => {
  const [settings, setSettings] = useState<UserSettings>(DEFAULT_SETTINGS);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [prayerTimes, setPrayerTimes] = useState<PrayerTime[]>([]);
  const [nextPrayer, setNextPrayer] = useState<PrayerTime | null>(null);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [showSettings, setShowSettings] = useState(false);
  const [showAddReminder, setShowAddReminder] = useState(false);
  const [showDhikr, setShowDhikr] = useState(false);
  const [dhikrCounts, setDhikrCounts] = useState<{ [key: string]: number }>({});
  const [isCountingDhikr, setIsCountingDhikr] = useState<string | null>(null);
  
  const timeIntervalRef = useRef<NodeJS.Timeout>();
  const notificationRef = useRef<NodeJS.Timeout>();

  // Prayer times calculation (simplified - replace with real API)
  const calculatePrayerTimes = useCallback((location: LocationSettings, date: Date) => {
    const prayerSchedule = MOCK_PRAYER_TIMES[settings.religion] || MOCK_PRAYER_TIMES.islam;
    const times: PrayerTime[] = [];
    
    Object.entries(prayerSchedule).forEach(([key, prayer]) => {
      const [hours, minutes] = prayer.time.split(':').map(Number);
      const prayerTime = new Date(date);
      prayerTime.setHours(hours, minutes, 0, 0);
      
      const hasPassed = prayerTime < date;
      
      times.push({
        name: prayer.name,
        time: prayer.time,
        nextTime: prayer.time,
        hasPassed,
        isNext: false
      });
    });

    // Find next prayer
    const nowHours = date.getHours();
    const nowMinutes = date.getMinutes();
    const currentTimeInMinutes = nowHours * 60 + nowMinutes;

    times.forEach((prayer, index) => {
      const [hours, minutes] = prayer.time.split(':').map(Number);
      const prayerTimeInMinutes = hours * 60 + minutes;
      
      if (!prayer.hasPassed && (!nextPrayer || prayerTimeInMinutes < currentTimeInMinutes)) {
        prayer.isNext = true;
        setNextPrayer(prayer);
      }
    });

    return times;
  }, [settings.religion]);

  // Get time until next prayer
  const getTimeUntilPrayer = useCallback((prayerTime: string) => {
    const [hours, minutes] = prayerTime.split(':').map(Number);
    const now = currentTime;
    const prayerDate = new Date(now);
    prayerDate.setHours(hours, minutes, 0, 0);
    
    if (prayerDate <= now) {
      prayerDate.setDate(prayerDate.getDate() + 1);
    }
    
    const diff = prayerDate.getTime() - now.getTime();
    const diffHours = Math.floor(diff / (1000 * 60 * 60));
    const diffMinutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    return `${diffHours}h ${diffMinutes}m`;
  }, [currentTime]);

  // Check and trigger notifications
  const checkNotifications = useCallback(() => {
    if (!settings.notificationsEnabled) return;

    const now = currentTime;
    const currentHours = now.getHours();
    const currentMinutes = now.getMinutes();
    const currentTimeStr = `${currentHours.toString().padStart(2, '0')}:${currentMinutes.toString().padStart(2, '0')}`;

    // Check prayer times
    if (settings.prayerNotifications) {
      prayerTimes.forEach(prayer => {
        if (prayer.time === currentTimeStr && !prayer.hasPassed) {
          // Trigger prayer notification
          if (settings.soundEnabled) {
            playNotificationSound('prayer');
          }
          showNotification(`${prayer.name} Time`, `It's time for ${prayer.name} prayer`);
        }
      });
    }

    // Check reminders
    if (settings.reminderNotifications) {
      reminders.forEach(reminder => {
        if (reminder.isActive && reminder.time === currentTimeStr) {
          const today = now.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
          const dayMap: { [key: string]: string } = {
            'monday': 'mon', 'tuesday': 'tue', 'wednesday': 'wed',
            'thursday': 'thu', 'friday': 'fri', 'saturday': 'sat', 'sunday': 'sun'
          };
          
          if (reminder.days.includes(dayMap[today]) || reminder.days.includes('all')) {
            if (settings.soundEnabled) {
              playNotificationSound('reminder');
            }
            showNotification(reminder.title, reminder.description);
          }
        }
      });
    }
  }, [currentTime, settings, prayerTimes, reminders]);

  // Play notification sound (mock implementation)
  const playNotificationSound = useCallback((type: 'prayer' | 'reminder') => {
    const audio = new Audio();
    audio.volume = settings.soundEnabled ? 0.5 : 0;
    
    // Mock sound files - replace with actual audio files
    if (type === 'prayer') {
      audio.src = '/sounds/adhan.mp3';
    } else {
      audio.src = '/sounds/reminder.mp3';
    }
    
    audio.play().catch(console.error);
  }, [settings.soundEnabled]);

  // Show browser notification
  const showNotification = useCallback((title: string, body: string) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(title, {
        body,
        icon: '/icons/prayer-icon.png',
        badge: '/icons/badge.png'
      });
    }
  }, []);

  // Dhikr counter functions
  const incrementDhikrCount = useCallback((dhikrId: string) => {
    setDhikrCounts(prev => {
      const current = prev[dhikrId] || 0;
      const dhikr = MOCK_DHIKR_ITEMS.find(item => item.id === dhikrId);
      
      if (dhikr && current < dhikr.totalCount) {
        return { ...prev, [dhikrId]: current + 1 };
      }
      
      return prev;
    });
  }, []);

  const resetDhikrCount = useCallback((dhikrId: string) => {
    setDhikrCounts(prev => ({ ...prev, [dhikrId]: 0 }));
  }, []);

  const startDhikrCounting = useCallback((dhikrId: string) => {
    setIsCountingDhikr(dhikrId);
  }, []);

  const stopDhikrCounting = useCallback(() => {
    setIsCountingDhikr(null);
  }, []);

  // Add new reminder
  const addReminder = useCallback((reminder: Omit<Reminder, 'id' | 'createdAt'>) => {
    const newReminder: Reminder = {
      ...reminder,
      id: `reminder-${Date.now()}`,
      createdAt: new Date().toISOString()
    };
    
    setReminders(prev => [...prev, newReminder]);
    setShowAddReminder(false);
  }, []);

  // Toggle reminder
  const toggleReminder = useCallback((reminderId: string) => {
    setReminders(prev => prev.map(reminder =>
      reminder.id === reminderId 
        ? { ...reminder, isActive: !reminder.isActive }
        : reminder
    ));
  }, []);

  // Delete reminder
  const deleteReminder = useCallback((reminderId: string) => {
    setReminders(prev => prev.filter(reminder => reminder.id !== reminderId));
  }, []);

  // Request notification permission
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  // Update current time
  useEffect(() => {
    timeIntervalRef.current = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => {
      if (timeIntervalRef.current) {
        clearInterval(timeIntervalRef.current);
      }
    };
  }, []);

  // Update prayer times
  useEffect(() => {
    const times = calculatePrayerTimes(settings.location, currentTime);
    setPrayerTimes(times);
  }, [currentTime, settings.location, calculatePrayerTimes]);

  // Check notifications
  useEffect(() => {
    notificationRef.current = setInterval(() => {
      checkNotifications();
    }, 60000); // Check every minute

    return () => {
      if (notificationRef.current) {
        clearInterval(notificationRef.current);
      }
    };
  }, [checkNotifications]);

  // Initialize dhikr counts
  useEffect(() => {
    const initialCounts: { [key: string]: number } = {};
    MOCK_DHIKR_ITEMS.forEach(item => {
      initialCounts[item.id] = 0;
    });
    setDhikrCounts(initialCounts);
  }, []);

  // Get religion icon
  const getReligionIcon = useCallback((religion: string) => {
    switch (religion) {
      case 'islam': return Mosque;
      case 'christianity': return Church;
      case 'judaism': return Synagogue;
      default: return Star;
    }
  }, []);

  const ReligionIcon = getReligionIcon(settings.religion);

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <div className="border-b border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2">
              <ReligionIcon className="w-5 h-5 text-blue-500" />
              <h3 className="text-lg font-semibold text-gray-900">
                {settings.religion === 'islam' ? 'Prayer Times' : 
                 settings.religion === 'christianity' ? 'Prayer Schedule' :
                 settings.religion === 'judaism' ? 'Prayer Times' : 'Reminders'}
              </h3>
            </div>
            <div className="text-sm text-gray-600">
              {currentTime.toLocaleTimeString()}
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setSettings(prev => ({ 
                ...prev, 
                soundEnabled: !prev.soundEnabled 
              }))}
              className={`p-2 rounded-lg ${settings.soundEnabled ? 'text-blue-600 bg-blue-100' : 'text-gray-500 bg-gray-100'}`}
              title="Toggle sound"
            >
              {settings.soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>
            <button
              onClick={() => setShowDhikr(!showDhikr)}
              className={`p-2 rounded-lg ${showDhikr ? 'text-blue-600 bg-blue-100' : 'text-gray-500 bg-gray-100'}`}
              title="Dhikr counter"
            >
              <Heart className="w-4 h-4" />
            </button>
            <button
              onClick={() => setShowAddReminder(!showAddReminder)}
              className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg"
              title="Add reminder"
            >
              <Plus className="w-4 h-4" />
            </button>
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg"
              title="Settings"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Add Reminder Form */}
      {showAddReminder && (
        <div className="border-b border-gray-200 p-4 bg-blue-50">
          <h4 className="font-medium text-gray-900 mb-3">Add New Reminder</h4>
          <AddReminderForm onSave={addReminder} onCancel={() => setShowAddReminder(false)} />
        </div>
      )}

      {/* Dhikr Counter */}
      {showDhikr && (
        <div className="border-b border-gray-200 p-4 bg-green-50">
          <h4 className="font-medium text-gray-900 mb-3">Daily Dhikr</h4>
          <div className="space-y-3">
            {MOCK_DHIKR_ITEMS.map((dhikr) => {
              const count = dhikrCounts[dhikr.id] || 0;
              const isActive = isCountingDhikr === dhikr.id;
              const isComplete = count >= dhikr.totalCount;
              
              return (
                <div key={dhikr.id} className="flex items-center justify-between p-3 bg-white rounded-lg">
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">{dhikr.text}</div>
                    <div className="text-sm text-gray-600">{dhikr.translation}</div>
                    <div className="flex items-center space-x-2 mt-1">
                      <div className="text-sm text-gray-500">
                        Progress: {count}/{dhikr.totalCount}
                      </div>
                      <div className="flex-1 bg-gray-200 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full transition-all ${
                            isComplete ? 'bg-green-500' : 'bg-blue-500'
                          }`}
                          style={{ width: `${(count / dhikr.totalCount) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    {isActive ? (
                      <button
                        onClick={stopDhikrCounting}
                        className="p-2 text-red-600 hover:bg-red-100 rounded-lg"
                        title="Stop counting"
                      >
                        <Pause className="w-4 h-4" />
                      </button>
                    ) : (
                      <button
                        onClick={() => startDhikrCounting(dhikr.id)}
                        disabled={isComplete}
                        className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg disabled:opacity-50"
                        title="Start counting"
                      >
                        <Play className="w-4 h-4" />
                      </button>
                    )}
                    
                    {isActive && (
                      <button
                        onClick={() => incrementDhikrCount(dhikr.id)}
                        disabled={count >= dhikr.totalCount}
                        className="px-4 py-2 bg-blue-500 text-white rounded-lg disabled:opacity-50"
                      >
                        Count
                      </button>
                    )}
                    
                    <button
                      onClick={() => resetDhikrCount(dhikr.id)}
                      className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg"
                      title="Reset"
                    >
                      <RotateCcw className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto">
        {/* Prayer Times */}
        <div className="p-4">
          <h4 className="font-medium text-gray-900 mb-3">Today's Prayer Times</h4>
          <div className="space-y-2">
            {prayerTimes.map((prayer, index) => {
              const IconComponent = (MOCK_PRAYER_TIMES[settings.religion]?.[Object.keys(MOCK_PRAYER_TIMES[settings.religion] || {})[index] as keyof typeof MOCK_PRAYER_TIMES.islam]?.icon) || Clock;
              
              return (
                <div
                  key={index}
                  className={`flex items-center justify-between p-3 rounded-lg ${
                    prayer.isNext ? 'bg-blue-100 border border-blue-200' : 'bg-gray-50'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <IconComponent className={`w-5 h-5 ${prayer.isNext ? 'text-blue-600' : 'text-gray-500'}`} />
                    <div>
                      <div className={`font-medium ${prayer.isNext ? 'text-blue-900' : 'text-gray-900'}`}>
                        {prayer.name}
                      </div>
                      {prayer.isNext && (
                        <div className="text-sm text-blue-700">
                          In {getTimeUntilPrayer(prayer.time)}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className={`font-medium ${prayer.isNext ? 'text-blue-900' : 'text-gray-900'}`}>
                      {prayer.time}
                    </div>
                    <div className={`text-xs ${prayer.hasPassed ? 'text-gray-500' : 'text-green-600'}`}>
                      {prayer.hasPassed ? 'Passed' : 'Upcoming'}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Custom Reminders */}
        <div className="p-4 border-t border-gray-200">
          <h4 className="font-medium text-gray-900 mb-3">Custom Reminders</h4>
          {reminders.length === 0 ? (
            <div className="text-center py-8">
              <Bell className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-600">No custom reminders set</p>
              <p className="text-sm text-gray-500 mt-1">Click the + button to add one</p>
            </div>
          ) : (
            <div className="space-y-2">
              {reminders.map((reminder) => (
                <div
                  key={reminder.id}
                  className={`flex items-center justify-between p-3 rounded-lg ${
                    reminder.isActive ? 'bg-white border border-gray-200' : 'bg-gray-50 opacity-60'
                  }`}
                >
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">{reminder.title}</div>
                    <div className="text-sm text-gray-600">{reminder.description}</div>
                    <div className="flex items-center space-x-4 mt-1 text-xs text-gray-500">
                      <span className="flex items-center space-x-1">
                        <Clock className="w-3 h-3" />
                        <span>{reminder.time}</span>
                      </span>
                      <span className="flex items-center space-x-1">
                        <Calendar className="w-3 h-3" />
                        <span>{reminder.days.join(', ')}</span>
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => toggleReminder(reminder.id)}
                      className={`p-2 rounded-lg ${
                        reminder.isActive 
                          ? 'text-green-600 bg-green-100' 
                          : 'text-gray-500 bg-gray-100'
                      }`}
                      title={reminder.isActive ? 'Disable' : 'Enable'}
                    >
                      {reminder.isActive ? <Check className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
                    </button>
                    <button
                      onClick={() => deleteReminder(reminder.id)}
                      className="p-2 text-red-600 hover:bg-red-100 rounded-lg"
                      title="Delete"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-gray-200 p-3 bg-gray-50">
        <div className="flex items-center justify-between text-xs text-gray-600">
          <div className="flex items-center space-x-2">
            <MapPin className="w-3 h-3" />
            <span>{settings.location.city}, {settings.location.country}</span>
          </div>
          <div className="flex items-center space-x-2">
            {settings.notificationsEnabled ? (
              <>
                <Bell className="w-3 h-3 text-green-500" />
                <span>Notifications active</span>
              </>
            ) : (
              <>
                <VolumeX className="w-3 h-3 text-gray-400" />
                <span>Notifications disabled</span>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Add Reminder Form Component
const AddReminderForm: React.FC<{
  onSave: (reminder: Omit<Reminder, 'id' | 'createdAt'>) => void;
  onCancel: () => void;
}> = ({ onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    time: '12:00',
    days: ['mon', 'tue', 'wed', 'thu', 'fri'],
    category: 'general' as const,
    religion: 'islam' as const,
    soundEnabled: true,
    recurring: true
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  const toggleDay = (day: string) => {
    setFormData(prev => ({
      ...prev,
      days: prev.days.includes(day) 
        ? prev.days.filter(d => d !== day)
        : [...prev.days, day]
    }));
  };

  const days = [
    { value: 'mon', label: 'Mon' },
    { value: 'tue', label: 'Tue' },
    { value: 'wed', label: 'Wed' },
    { value: 'thu', label: 'Thu' },
    { value: 'fri', label: 'Fri' },
    { value: 'sat', label: 'Sat' },
    { value: 'sun', label: 'Sun' }
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Title
          </label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Time
          </label>
          <input
            type="time"
            value={formData.time}
            onChange={(e) => setFormData(prev => ({ ...prev, time: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            required
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Description
        </label>
        <input
          type="text"
          value={formData.description}
          onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Days
        </label>
        <div className="flex space-x-2">
          {days.map(day => (
            <button
              key={day.value}
              type="button"
              onClick={() => toggleDay(day.value)}
              className={`px-3 py-1 text-xs rounded-lg ${
                formData.days.includes(day.value)
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-gray-100 text-gray-700'
              }`}
            >
              {day.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Category
          </label>
          <select
            value={formData.category}
            onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value as any }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
          >
            <option value="general">General</option>
            <option value="religious">Religious</option>
            <option value="health">Health</option>
            <option value="work">Work</option>
            <option value="personal">Personal</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Religion
          </label>
          <select
            value={formData.religion}
            onChange={(e) => setFormData(prev => ({ ...prev, religion: e.target.value as any }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
          >
            <option value="islam">Islam</option>
            <option value="christianity">Christianity</option>
            <option value="judaism">Judaism</option>
            <option value="hinduism">Hinduism</option>
            <option value="buddhism">Buddhism</option>
            <option value="other">Other</option>
          </select>
        </div>
      </div>

      <div className="flex items-center space-x-4">
        <label className="flex items-center space-x-2">
          <input
            type="checkbox"
            checked={formData.soundEnabled}
            onChange={(e) => setFormData(prev => ({ ...prev, soundEnabled: e.target.checked }))}
            className="rounded"
          />
          <span className="text-sm text-gray-700">Sound enabled</span>
        </label>
        <label className="flex items-center space-x-2">
          <input
            type="checkbox"
            checked={formData.recurring}
            onChange={(e) => setFormData(prev => ({ ...prev, recurring: e.target.checked }))}
            className="rounded"
          />
          <span className="text-sm text-gray-700">Recurring</span>
        </label>
      </div>

      <div className="flex space-x-2">
        <button
          type="submit"
          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
        >
          Save Reminder
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
        >
          Cancel
        </button>
      </div>
    </form>
  );
};

export default ReminderAndPrayerWidget;