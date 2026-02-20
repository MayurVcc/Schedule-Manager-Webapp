import React, { useState, useEffect, useRef } from 'react';
import { Plus, Trash2, Clock, MapPin, BookOpen, Save, X, AlertCircle, Utensils, RotateCcw, GraduationCap, User, Share2, Link as LinkIcon, Loader2, Calendar as CalendarIcon, Moon, Sun, Map, DollarSign, Image as ImageIcon, HelpCircle, BookOpenCheck, Shield } from 'lucide-react';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, collection, doc, setDoc, getDoc } from 'firebase/firestore';
import { getAuth, signInAnonymously, onAuthStateChanged } from 'firebase/auth';

// --- FIREBASE SETUP ---
const firebaseConfig = {
  apiKey: "AIzaSyAKd-8Biiu7Nsvb6K7dkaJmpTxN27gJ93Y",
  authDomain: "schedule-app-7d3e8.firebaseapp.com",
  projectId: "schedule-app-7d3e8",
  storageBucket: "schedule-app-7d3e8.firebasestorage.app",
  messagingSenderId: "1052182257536",
  appId: "1:1052182257536:web:ae5561e1bcfa1808542b65"
};

const APP_COLLECTION_ID = 'schedule-app-main';

// --- ADSENSE CONFIGURATION ---
const ADSENSE_CLIENT_ID = "ca-pub-1235067087995096"; 
const ADSENSE_SLOT_ID = "2535997483"; 
const SHOW_TEST_ADS = false;   

// SAFE FIREBASE INITIALIZATION
let db, auth;
if (firebaseConfig && firebaseConfig.apiKey) {
  try {
    const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
    db = getFirestore(app);
    auth = getAuth(app);
  } catch (e) {
    console.error("Firebase Initialization Error:", e);
  }
}

// Simple Alert Component
const Alert = ({ children, className = "" }) => (
  <div className={`p-4 rounded-lg border ${className}`}>
    {children}
  </div>
);

const AlertDescription = ({ children }) => (
  <div className="text-sm opacity-90">{children}</div>
);

// --- AD COMPONENT ---
const GoogleAd = ({ isDarkMode, label = "Advertisement" }) => {
  useEffect(() => {
    if (ADSENSE_CLIENT_ID && !document.getElementById('adsense-script')) {
        const script = document.createElement('script');
        script.id = 'adsense-script';
        script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT_ID}`;
        script.async = true;
        script.crossOrigin = "anonymous";
        document.body.appendChild(script);
    }
    if (ADSENSE_CLIENT_ID && window.adsbygoogle) {
        try { (window.adsbygoogle = window.adsbygoogle || []).push({}); } catch (e) { console.error(e); }
    }
  }, []);

  if (!ADSENSE_CLIENT_ID && !SHOW_TEST_ADS) return null;

  return (
    <div className={`my-4 p-4 rounded-xl border-2 border-dashed flex flex-col items-center justify-center text-center print:hidden ${isDarkMode ? 'border-slate-800 bg-slate-900/50' : 'border-slate-200 bg-slate-50'}`}>
        {ADSENSE_CLIENT_ID && ADSENSE_SLOT_ID ? (
            <div style={{ width: '100%', overflow: 'hidden' }}>
                <ins className="adsbygoogle"
                     style={{ display: 'block' }}
                     data-ad-client={ADSENSE_CLIENT_ID}
                     data-ad-slot={ADSENSE_SLOT_ID} 
                     data-ad-format="auto"
                     data-full-width-responsive="true"></ins>
            </div>
        ) : (
            <div className="py-2">
                <div className={`flex items-center justify-center gap-2 mb-1 font-bold ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                    <DollarSign size={16} />
                    <span className="text-sm">{label} Space</span>
                </div>
                <p className={`text-[10px] max-w-xs mx-auto ${isDarkMode ? 'text-slate-600' : 'text-slate-500'}`}>
                    Add your Publisher ID to see real ads here.
                </p>
            </div>
        )}
    </div>
  );
};

export default function ScheduleBuilder() {
  // --- AUTH STATE ---
  const [user, setUser] = useState(null);
  
  // Initialize Auth
  useEffect(() => {
    if (!auth) return;
    const initAuth = async () => {
        try { await signInAnonymously(auth); } catch (error) { console.error("Authentication Error:", error); }
    };
    initAuth();
    const unsubscribe = onAuthStateChanged(auth, (u) => { setUser(u); });
    return () => unsubscribe();
  }, []);

  // --- LOAD EXTERNAL SCRIPTS ---
  useEffect(() => {
    if (!document.getElementById('html2canvas-script')) {
        const script = document.createElement('script');
        script.id = 'html2canvas-script';
        script.src = "https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js";
        script.async = true;
        document.body.appendChild(script);
    }
  }, []);

  // Default Data
  const defaultEvents = [
    { id: 1, day: 'Monday', startTime: 9, duration: 1, title: 'Calculus I', teacher: 'Dr. Smith', type: 'Lecture', room: '101', color: 'blue' },
    { id: 2, day: 'Monday', startTime: 10, duration: 2, title: 'Physics Lab', teacher: 'Prof. Johnson', type: 'Lab', room: 'Lab 3B', color: 'purple' },
    { id: 3, day: 'Wednesday', startTime: 14, duration: 1, title: 'History', teacher: 'Mrs. Davis', type: 'Lecture', room: '204', color: 'emerald' },
    { id: 4, day: 'Tuesday', startTime: 12, duration: 1, title: 'Lunch Break', teacher: '', type: 'Lunch', room: 'Cafeteria', color: 'slate' },
  ];

  const defaultSubjects = [
    { id: 1, name: 'Calculus I', teacher: 'Dr. Smith', room: '101' },
    { id: 2, name: 'Physics Lab', teacher: 'Prof. Johnson', room: 'Lab 3B' },
    { id: 3, name: 'History', teacher: 'Mrs. Davis', room: '204' },
    { id: 4, name: 'English Lit', teacher: 'Mr. Wilson', room: 'Library' },
  ];

  const defaultLocations = [
    { id: 1, room: '101', building: 'ABB3 Building' },
    { id: 2, room: 'Lab 3B', building: 'Science Block' },
    { id: 3, room: '204', building: 'Humanities Wing' },
  ];

  // --- APP STATE (LAZY INITIALIZATION) ---
  const [events, setEvents] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('myScheduleEvents');
      return saved ? JSON.parse(saved) : defaultEvents;
    }
    return defaultEvents;
  });

  const [subjects, setSubjects] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('myScheduleSubjects');
      return saved ? JSON.parse(saved) : defaultSubjects;
    }
    return defaultSubjects;
  });

  const [locations, setLocations] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('myScheduleLocations');
      return saved ? JSON.parse(saved) : defaultLocations;
    }
    return defaultLocations;
  });

  const [isLoading, setIsLoading] = useState(false); 
  const [shareUrl, setShareUrl] = useState('');
  const [isSharing, setIsSharing] = useState(false);
  const [shareMessage, setShareMessage] = useState('');
  
  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubjectManagerOpen, setIsSubjectManagerOpen] = useState(false);
  const [isLocationManagerOpen, setIsLocationManagerOpen] = useState(false); 
  const [isPrivacyOpen, setIsPrivacyOpen] = useState(false); // NEW Privacy Modal

  // Refs for Screenshot
  const scheduleRef = useRef(null);

  // Dark Mode State
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      const savedMode = localStorage.getItem('scheduleAppDarkMode');
      return savedMode ? JSON.parse(savedMode) : false;
    }
    return false;
  });

  useEffect(() => {
    localStorage.setItem('scheduleAppDarkMode', JSON.stringify(isDarkMode));
    if (isDarkMode) { document.body.style.backgroundColor = '#0f172a'; } 
    else { document.body.style.backgroundColor = '#f8fafc'; }
  }, [isDarkMode]);

  // 1. Load Data
  useEffect(() => {
    const loadData = async () => {
      const currentUrl = typeof window !== 'undefined' ? window.location.search : '';
      const urlParams = new URLSearchParams(currentUrl);
      const sharedId = urlParams.get('id');

      if (sharedId && db) {
        setIsLoading(true); 
        try {
          if (auth && !auth.currentUser) {
             await new Promise(resolve => {
                const unsub = onAuthStateChanged(auth, (u) => { unsub(); resolve(u); });
                setTimeout(() => resolve(null), 2000);
             });
          }

          if (auth && auth.currentUser) {
            const docRef = doc(db, 'artifacts', APP_COLLECTION_ID, 'public', 'data', 'schedules', sharedId);
            const docSnap = await getDoc(docRef);

            if (docSnap.exists()) {
                const data = docSnap.data();
                setEvents(data.events || []);
                setSubjects(data.subjects || []);
                setLocations(data.locations || []); 
                if (typeof window !== 'undefined') setShareUrl(window.location.href);
            }
          }
        } catch (error) {
          console.error("Error loading shared schedule:", error);
        }
        setIsLoading(false);
      }
    };
    loadData();
  }, []);

  // 2. Save Data
  useEffect(() => {
    if (!isLoading && typeof window !== 'undefined') {
      localStorage.setItem('myScheduleEvents', JSON.stringify(events));
      localStorage.setItem('myScheduleSubjects', JSON.stringify(subjects));
      localStorage.setItem('myScheduleLocations', JSON.stringify(locations));
    }
  }, [events, subjects, locations, isLoading]);

  // --- HANDLERS ---
  const handleShare = async () => {
    if (!db || !auth) { alert("Database connection not available."); return; }
    if (!user) { alert("Initializing secure connection..."); return; }
    setIsSharing(true); setShareMessage('');
    try {
        const newDocRef = doc(collection(db, 'artifacts', APP_COLLECTION_ID, 'public', 'data', 'schedules'));
        await setDoc(newDocRef, { events, subjects, locations, createdAt: new Date().toISOString(), createdBy: user.uid });
        const newUrl = `${window.location.origin}${window.location.pathname}?id=${newDocRef.id}`;
        setShareUrl(newUrl); await navigator.clipboard.writeText(newUrl);
        setShareMessage('Link copied to clipboard!'); window.history.pushState({}, '', newUrl);
    } catch (error) { console.error("Error sharing:", error); setShareMessage('Error generating link.'); } finally { setIsSharing(false); }
  };

  const handleDownloadImage = async () => {
    if (scheduleRef.current && window.html2canvas) {
        try {
            const originalOverflow = scheduleRef.current.style.overflow;
            const originalWidth = scheduleRef.current.style.width;
            const originalHeight = scheduleRef.current.style.height;

            scheduleRef.current.style.overflow = "visible";
            scheduleRef.current.style.width = "fit-content";
            scheduleRef.current.style.height = "auto";
            scheduleRef.current.style.minWidth = "1024px"; 

            const canvas = await window.html2canvas(scheduleRef.current, {
                scale: 2, backgroundColor: isDarkMode ? '#0f172a' : '#f8fafc',
                useCORS: true,
                ignoreElements: (element) => element.getAttribute('data-html2canvas-ignore') === 'true',
                width: scheduleRef.current.scrollWidth,
                height: scheduleRef.current.scrollHeight,
                windowWidth: scheduleRef.current.scrollWidth + 100,
                windowHeight: scheduleRef.current.scrollHeight + 100,
                onclone: (clonedDoc) => {
                    const gridContainer = clonedDoc.querySelector('.overflow-x-auto');
                    if (gridContainer) {
                        gridContainer.style.overflow = 'visible';
                        gridContainer.style.width = '100%';
                    }
                }
            });

            scheduleRef.current.style.overflow = originalOverflow;
            scheduleRef.current.style.width = originalWidth;
            scheduleRef.current.style.height = originalHeight;
            scheduleRef.current.style.minWidth = "";

            const image = canvas.toDataURL("image/png");
            const link = document.createElement("a"); link.href = image; link.download = "my_schedule.png"; link.click();
        } catch (error) { console.error("Failed to capture image:", error); alert("Could not save image."); }
    } else { alert("Image tool loading... please wait a moment."); }
  };

  const [selectedSlot, setSelectedSlot] = useState(null); 
  const [editingEvent, setEditingEvent] = useState(null); 
  
  const [formData, setFormData] = useState({ title: '', teacher: '', type: 'Lecture', room: '', duration: 1, startTime: 8, color: 'blue' });
  const [newSubject, setNewSubject] = useState({ name: '', teacher: '', room: '' });
  const [newLocation, setNewLocation] = useState({ room: '', building: '' });

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const startHour = 8; const endHour = 18; 
  const timeSlots = Array.from({ length: endHour - startHour }, (_, i) => startHour + i);

  const colors = [
    { name: 'blue', light: 'bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-200', dark: 'bg-blue-900/40 text-blue-100 border-blue-800 hover:bg-blue-900/60' },
    { name: 'purple', light: 'bg-purple-100 text-purple-800 border-purple-200 hover:bg-purple-200', dark: 'bg-purple-900/40 text-purple-100 border-purple-800 hover:bg-purple-900/60' },
    { name: 'emerald', light: 'bg-emerald-100 text-emerald-800 border-emerald-200 hover:bg-emerald-200', dark: 'bg-emerald-900/40 text-emerald-100 border-emerald-800 hover:bg-emerald-900/60' },
    { name: 'orange', light: 'bg-orange-100 text-orange-800 border-orange-200 hover:bg-orange-200', dark: 'bg-orange-900/40 text-orange-100 border-orange-800 hover:bg-orange-900/60' },
    { name: 'rose', light: 'bg-rose-100 text-rose-800 border-rose-200 hover:bg-rose-200', dark: 'bg-rose-900/40 text-rose-100 border-rose-800 hover:bg-rose-900/60' },
    { name: 'slate', light: 'bg-slate-200 text-slate-700 border-slate-300 hover:bg-slate-300', dark: 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700' },
  ];

  const getColorClass = (colorName) => {
    const color = colors.find(c => c.name === colorName) || colors[0];
    return isDarkMode ? color.dark : color.light;
  };

  const formatTime = (hour) => {
    const h = hour > 12 ? hour - 12 : hour;
    const ampm = hour >= 12 ? 'PM' : 'AM';
    return `${h}:00 ${ampm}`;
  };

  const formatTimeRange = (startHour, duration) => {
    return `${formatTime(startHour)} - ${formatTime(startHour + duration)}`;
  };

  const getOccupyingEvent = (day, time) => {
    return events.find(event => event.day === day && time >= event.startTime && time < (event.startTime + event.duration));
  };

  const getStartingEvent = (day, time) => {
    return events.find(event => event.day === day && event.startTime === time);
  };

  // --- TIME DASHBOARD LOGIC ---
  const [now, setNow] = useState(new Date());
  useEffect(() => { const timer = setInterval(() => setNow(new Date()), 60000); return () => clearInterval(timer); }, []);
  const currentDayIndex = now.getDay(); 
  const todayName = currentDayIndex === 0 ? 'Sunday' : days[currentDayIndex - 1];
  const currentHour = now.getHours() + (now.getMinutes() / 60);
  const todaysClasses = events.filter(e => e.day === todayName).sort((a, b) => a.startTime - b.startTime);
  const completedCount = todaysClasses.filter(e => (e.startTime + e.duration) <= currentHour).length;
  const totalCount = todaysClasses.length;
  const activeClass = todaysClasses.find(e => e.startTime <= currentHour && (e.startTime + e.duration) > currentHour);
  const upcomingClass = todaysClasses.find(e => e.startTime > currentHour);

  // --- HANDLERS ---
  const handleSlotClick = (day, time) => {
    const existingEvent = getOccupyingEvent(day, time);
    if (existingEvent) {
      setEditingEvent(existingEvent);
      setFormData({ title: existingEvent.title, teacher: existingEvent.teacher || '', type: existingEvent.type, room: existingEvent.room, duration: existingEvent.duration, startTime: existingEvent.startTime, color: existingEvent.color });
    } else {
      setEditingEvent(null); setSelectedSlot({ day, time });
      setFormData({ title: '', teacher: '', type: 'Lecture', room: '', duration: 1, startTime: time, color: 'blue' });
    }
    setIsModalOpen(true);
  };

  const handleSave = () => {
    if (!formData.title) return;
    let newEvents = [...events];
    const start = parseInt(formData.startTime);
    const day = editingEvent ? editingEvent.day : selectedSlot.day;
    const id = editingEvent ? editingEvent.id : Date.now();
    if (editingEvent) { newEvents = newEvents.filter(e => e.id !== editingEvent.id); }
    const finalEvents = newEvents.filter(e => {
      if (e.day !== day) return true;
      const eventStart = e.startTime; const eventEnd = e.startTime + e.duration;
      const newStart = start; const newEnd = start + formData.duration;
      return !(eventStart < newEnd && eventEnd > newStart);
    });
    finalEvents.push({ id, day, startTime: start, duration: parseInt(formData.duration), title: formData.title, teacher: formData.teacher, type: formData.type, room: formData.room, color: formData.color });
    setEvents(finalEvents); setIsModalOpen(false);
  };

  const handleDelete = () => { if (editingEvent) { setEvents(events.filter(e => e.id !== editingEvent.id)); setIsModalOpen(false); } };
  const handleReset = () => { if (confirm("Are you sure? This will delete your custom schedule.")) { setEvents(defaultEvents); setSubjects(defaultSubjects); setLocations(defaultLocations); window.history.pushState({}, '', window.location.pathname); } };
  const handleAddSubject = () => { if (newSubject.name) { setSubjects([...subjects, { id: Date.now(), ...newSubject }]); setNewSubject({ name: '', teacher: '', room: '' }); } };
  const handleDeleteSubject = (id) => { setSubjects(subjects.filter(s => s.id !== id)); };
  const handleSelectSubject = (subjectId) => { const subj = subjects.find(s => s.id === Number(subjectId)); if (subj) { setFormData({ ...formData, title: subj.name, teacher: subj.teacher, room: subj.room || '' }); } };
  const handleAddLocation = () => { if (newLocation.room) { setLocations([...locations, { id: Date.now(), ...newLocation }]); setNewLocation({ room: '', building: '' }); } };
  const handleDeleteLocation = (id) => { setLocations(locations.filter(l => l.id !== id)); };

  if (isLoading) {
    return ( <div className={`min-h-screen flex items-center justify-center ${isDarkMode ? 'bg-slate-950 text-slate-400' : 'bg-slate-50 text-slate-400'}`}> <Loader2 className="animate-spin mr-2" /> Loading... </div> );
  }

  return (
    <div ref={scheduleRef} className={`min-h-screen p-4 md:p-8 font-sans transition-colors duration-300 ${isDarkMode ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-800'}`}>
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className={`text-3xl font-bold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Weekly Schedule</h1>
            <p className={`${isDarkMode ? 'text-slate-400' : 'text-slate-500'} mt-1`}>Manage your lectures and labs</p>
          </div>
          <div className="flex flex-col items-end gap-2" data-html2canvas-ignore="true">
            <div className="flex gap-2">
              <button onClick={() => setIsDarkMode(!isDarkMode)} className={`px-3 py-2 rounded-lg shadow-sm border flex items-center justify-center transition-colors print:hidden ${isDarkMode ? 'bg-slate-800 border-slate-700 text-yellow-400 hover:bg-slate-700' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}><Sun size={18} className={!isDarkMode ? "hidden" : ""} /><Moon size={18} className={isDarkMode ? "hidden" : ""} /></button>
              <button onClick={() => setIsLocationManagerOpen(true)} className={`px-3 py-2 rounded-lg shadow-sm border flex items-center justify-center transition-colors print:hidden ${isDarkMode ? 'bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}><MapPin size={18} /></button>
              <button onClick={() => setIsSubjectManagerOpen(true)} className={`px-4 py-2 rounded-lg shadow-sm border flex items-center gap-2 text-sm font-medium transition-colors print:hidden ${isDarkMode ? 'bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700' : 'bg-slate-800 text-white border-slate-700 hover:bg-slate-700'}`}><GraduationCap size={16} /> <span className="hidden sm:inline">Subjects</span></button>
              <button onClick={handleShare} disabled={isSharing} className={`px-4 py-2 rounded-lg shadow-sm border flex items-center gap-2 text-sm font-medium transition-colors print:hidden ${isDarkMode ? 'bg-indigo-600 border-indigo-500 text-white hover:bg-indigo-500' : 'bg-indigo-600 border-indigo-500 text-white hover:bg-indigo-700'} ${isSharing ? 'opacity-70 cursor-wait' : ''}`}>{isSharing ? <Loader2 size={16} className="animate-spin" /> : <Share2 size={16} />} <span className="hidden sm:inline">Share Link</span></button>
              <button onClick={handleDownloadImage} className={`px-4 py-2 rounded-lg shadow-sm border flex items-center gap-2 text-sm font-medium transition-colors print:hidden ${isDarkMode ? 'bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700' : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'}`}><ImageIcon size={16} /> <span className="hidden sm:inline">Photo</span></button>
            </div>
            {shareMessage && <div className="text-xs font-bold text-emerald-600 animate-in fade-in slide-in-from-top-1 print:hidden">{shareMessage}</div>}
            <span className={`text-xs font-medium print:hidden ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>Made by Mayur Raj</span>
          </div>
        </div>

        {/* --- TOP AD BANNER --- */}
        <div data-html2canvas-ignore="true">
            <GoogleAd isDarkMode={isDarkMode} label="Top Banner" />
        </div>

        {/* Status Dashboard */}
        <div className={`mb-6 p-4 border rounded-xl shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4 print:hidden ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
            <div>
              <h2 className={`text-lg font-bold flex items-center gap-2 ${isDarkMode ? 'text-white' : 'text-slate-800'}`}><CalendarIcon size={20} className="text-indigo-600" />{todayName === 'Sunday' ? 'Relax, it\'s Sunday!' : `Today: ${todayName}`}</h2>
              {todayName !== 'Sunday' && ( <p className={`text-sm mt-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}><span className={`font-semibold ${isDarkMode ? 'text-slate-200' : 'text-slate-700'}`}>{completedCount} of {totalCount}</span> classes completed</p> )}
            </div>
            {todayName !== 'Sunday' && (
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto">
                {activeClass && ( <div className={`flex-1 md:flex-initial border p-3 rounded-lg flex items-center gap-3 animate-in fade-in slide-in-from-right-4 ${isDarkMode ? 'bg-emerald-900/30 border-emerald-800' : 'bg-emerald-50 border-emerald-100'}`}> <div className={`p-2 rounded-full animate-pulse ${isDarkMode ? 'bg-emerald-900 text-emerald-400' : 'bg-emerald-100 text-emerald-600'}`}> <Clock size={18} /> </div> <div className="min-w-[120px]"> <div className="text-[10px] font-bold text-emerald-500 uppercase tracking-wider">Happening Now</div> <div className={`font-bold text-sm line-clamp-1 ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>{activeClass.title}</div> <div className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}> Until {formatTime(activeClass.startTime + activeClass.duration)} </div> </div> </div> )}
                {upcomingClass ? ( <div className={`flex-1 md:flex-initial border p-3 rounded-lg flex items-center gap-3 ${isDarkMode ? 'bg-indigo-900/30 border-indigo-800' : 'bg-indigo-50 border-indigo-100'}`}> <div className={`p-2 rounded-full ${isDarkMode ? 'bg-indigo-900 text-indigo-400' : 'bg-indigo-100 text-indigo-600'}`}> <Clock size={18} /> </div> <div className="min-w-[120px]"> <div className="text-[10px] font-bold text-indigo-500 uppercase tracking-wider">Up Next</div> <div className={`font-bold text-sm line-clamp-1 ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>{upcomingClass.title}</div> <div className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}> at {formatTime(upcomingClass.startTime)} </div> </div> </div> ) : ( !activeClass && totalCount > 0 && completedCount === totalCount && ( <div className={`p-3 rounded-lg text-sm font-medium flex items-center gap-2 ${isDarkMode ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-600'}`}> <span>🎉</span> All classes done for today! </div> ) )}
              </div>
            )}
        </div>

        {/* Calendar Grid */}
        <div className={`rounded-xl shadow-lg border overflow-hidden print:shadow-none print:border-0 ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
          <div className="overflow-x-auto">
            <div className="min-w-[800px] grid grid-cols-[80px_repeat(6,1fr)]">
              <div className={`p-4 text-center text-xs font-semibold uppercase tracking-wider border-r border-b sticky top-0 z-20 ${isDarkMode ? 'bg-slate-900 text-slate-500 border-slate-800' : 'bg-slate-50 text-slate-400 border-slate-200'}`}> Time </div>
              {days.map((day, index) => ( <div key={day} className={`p-4 text-center font-semibold border-b sticky top-0 z-20 ${index < days.length - 1 ? 'border-r' : ''} ${isDarkMode ? 'bg-slate-900 text-slate-300 border-slate-800' : 'bg-slate-50 text-slate-700 border-slate-200'}`}> {day} </div> ))}
              {timeSlots.map((time) => (
                <React.Fragment key={time}>
                  <div className={`p-3 text-xs font-medium text-center border-r border-b flex items-center justify-center min-h-[80px] ${isDarkMode ? 'bg-slate-900/50 text-slate-500 border-slate-800' : 'bg-slate-50/50 text-slate-400 border-slate-100'}`}> {formatTime(time)} </div>
                  {days.map((day, dayIndex) => {
                    const startingEvent = getStartingEvent(day, time);
                    const isOccupied = getOccupyingEvent(day, time);
                    if (isOccupied && !startingEvent) { return null; }
                    return (
                      <div key={`${day}-${time}`} className={`relative p-1 border-b transition-colors ${dayIndex < days.length - 1 ? 'border-r' : ''} ${isDarkMode ? 'border-slate-800' : 'border-slate-100'} ${!startingEvent ? (isDarkMode ? 'hover:bg-slate-800/50' : 'hover:bg-slate-50') + ' cursor-pointer' : 'z-10'}`} style={{ gridRow: startingEvent ? `span ${startingEvent.duration}` : 'span 1', height: 'auto' }} onClick={() => !startingEvent && handleSlotClick(day, time)}>
                        {startingEvent ? (
                          <button onClick={(e) => { e.stopPropagation(); handleSlotClick(day, time); }} className={`w-full h-full text-left p-1.5 md:p-2 rounded-lg border shadow-sm transition-all hover:shadow-md flex flex-col gap-0.5 md:gap-1 ${getColorClass(startingEvent.color)}`}>
                            <div className="flex items-center gap-1 text-[10px] opacity-80 font-bold mb-0.5"> <Clock size={10} /> <span className="truncate">{formatTimeRange(startingEvent.startTime, startingEvent.duration)}</span> </div>
                            <div className="flex justify-between items-start"> 
                              <span className="font-bold text-xs md:text-sm leading-tight">{startingEvent.title}</span> 
                            </div>
                            <div className="flex items-center gap-1 text-[10px] md:text-xs opacity-90 mt-1"> {startingEvent.type === 'Lunch' ? <Utensils size={10} /> : <div className={`w-1.5 h-1.5 rounded-full bg-current`}></div>} <span>{startingEvent.type}</span> </div>
                            {startingEvent.teacher && ( <div className="flex items-center gap-1 text-[10px] md:text-xs font-medium opacity-80"> <User size={10} /> <span>{startingEvent.teacher}</span> </div> )}
                            {startingEvent.room && ( <div className="mt-auto flex items-center gap-1 text-[10px] md:text-xs font-medium opacity-75"> <MapPin size={10} /> <span>{startingEvent.room}</span> </div> )}
                          </button>
                        ) : (
                          <div className="w-full h-full flex items-center justify-center opacity-0 hover:opacity-100"> <Plus className={`w-5 h-5 ${isDarkMode ? 'text-slate-700' : 'text-slate-300'}`} /> </div>
                        )}
                      </div>
                    );
                  })}
                </React.Fragment>
              ))}
            </div>
          </div>
        </div>

        {/* --- BOTTOM AD BANNER --- */}
        <div data-html2canvas-ignore="true">
            <GoogleAd isDarkMode={isDarkMode} label="Bottom Banner" />
        </div>

        {/* --- SEO / CONTENT SECTION --- */}
        <article className={`mt-8 p-8 rounded-2xl print:hidden ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'} border`}>
            <div className="max-w-4xl mx-auto space-y-8">
                <header className="text-center">
                    <h2 className={`text-3xl font-bold mb-3 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Master Your Semester with the Ultimate University Schedule Builder</h2>
                    <p className={`text-lg ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>The easiest way to organize classes, track labs, and manage your academic life.</p>
                </header>

                <div className="grid md:grid-cols-3 gap-6">
                    <div className="space-y-2">
                        <h3 className={`font-bold flex items-center gap-2 ${isDarkMode ? 'text-slate-200' : 'text-slate-800'}`}><BookOpenCheck size={20} className="text-blue-500"/> Organize Classes</h3>
                        <p className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Drag, drop, and customize your weekly timetable. Assign colors to lectures, labs, and tutorials for instant visual clarity.</p>
                    </div>
                    <div className="space-y-2">
                        <h3 className={`font-bold flex items-center gap-2 ${isDarkMode ? 'text-slate-200' : 'text-slate-800'}`}><Map size={20} className="text-emerald-500"/> Campus Navigation</h3>
                        <p className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Never get lost again. Map specific room codes (e.g., "Room 304") to physical buildings so you always know where to go.</p>
                    </div>
                    <div className="space-y-2">
                        <h3 className={`font-bold flex items-center gap-2 ${isDarkMode ? 'text-slate-200' : 'text-slate-800'}`}><Share2 size={20} className="text-purple-500"/> Share Instantly</h3>
                        <p className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Generate a unique link to share your schedule with friends, study groups, or save it across your devices.</p>
                    </div>
                </div>

                <div className={`p-6 rounded-xl ${isDarkMode ? 'bg-slate-800/50' : 'bg-slate-50'}`}>
                    <h3 className={`text-xl font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Why effective scheduling matters for students</h3>
                    <p className={`text-sm mb-4 leading-relaxed ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                        Balancing academic responsibilities with personal life is one of the biggest challenges for university students. 
                        A well-structured timetable reduces cognitive load, allowing you to focus on learning rather than logistics. 
                        By visualizing your week, you can identify pockets of free time for studying, socializing, or resting.
                    </p>
                    <div className="flex flex-wrap gap-2">
                        {["Time Management", "Academic Success", "Stress Reduction", "Productivity"].map(tag => (
                            <span key={tag} className={`px-3 py-1 rounded-full text-xs font-medium ${isDarkMode ? 'bg-slate-700 text-slate-300' : 'bg-white border border-slate-200 text-slate-600'}`}>
                                {tag}
                            </span>
                        ))}
                    </div>
                </div>
            </div>
        </article>
        
        {/* Footer */}
        <div className="mt-8 flex flex-col items-center gap-4 print:hidden" data-html2canvas-ignore="true">
          <button onClick={handleReset} className={`flex items-center gap-2 text-sm transition-colors ${isDarkMode ? 'text-slate-500 hover:text-slate-400' : 'text-slate-400 hover:text-slate-600'}`}> <RotateCcw size={14} /> Reset to Default </button>
          <button onClick={() => setIsPrivacyOpen(true)} className="text-xs text-slate-400 underline hover:text-slate-500">Privacy Policy</button>
        </div>
      </div>
      
      {/* MODALS */}
      {isModalOpen && <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className={`rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200 ${isDarkMode ? 'bg-slate-900' : 'bg-white'}`}>
            <div className={`px-6 py-4 border-b flex justify-between items-center ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-100'}`}>
              <h2 className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>
                {editingEvent ? 'Edit Class' : 'Add Class'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className={`${isDarkMode ? 'text-slate-400 hover:text-white' : 'text-slate-400 hover:text-slate-600'}`}>
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {subjects.length > 0 && (
                <div className={`p-3 border rounded-lg ${isDarkMode ? 'bg-blue-900/20 border-blue-900/50' : 'bg-blue-50 border-blue-100'}`}>
                  <label className="block text-xs font-bold text-blue-600 uppercase tracking-wider mb-1.5">Quick Load Subject</label>
                  <select 
                    onChange={(e) => handleSelectSubject(e.target.value)}
                    className={`w-full text-sm rounded px-2 py-1.5 focus:outline-none ${isDarkMode ? 'bg-slate-800 border-slate-700 text-slate-200' : 'bg-white border-blue-200 text-blue-800'}`}
                    defaultValue=""
                  >
                    <option value="" disabled>Select a subject to auto-fill...</option>
                    {subjects.map(s => (
                      <option key={s.id} value={s.id}>{s.name} ({s.teacher})</option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className={`block text-xs font-bold uppercase tracking-wider mb-1.5 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Class Name</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  placeholder="e.g. Adv. Physics Lab"
                  className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium ${isDarkMode ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-500' : 'bg-slate-50 border-slate-200 text-slate-900'}`}
                />
              </div>

              <div>
                <label className={`block text-xs font-bold uppercase tracking-wider mb-1.5 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Teacher / Professor</label>
                <div className="relative">
                  <User size={16} className={`absolute left-3 top-1/2 -translate-y-1/2 ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`} />
                  <input
                    type="text"
                    value={formData.teacher}
                    onChange={(e) => setFormData({...formData, teacher: e.target.value})}
                    placeholder="e.g. Dr. Smith"
                    className={`w-full pl-9 pr-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium ${isDarkMode ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-500' : 'bg-slate-50 border-slate-200 text-slate-900'}`}
                  />
                </div>
              </div>

              {/* Start Time and Duration Row */}
              <div className="grid grid-cols-2 gap-4">
                 <div>
                  <label className={`block text-xs font-bold uppercase tracking-wider mb-1.5 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Start Time</label>
                  <select
                    value={formData.startTime}
                    onChange={(e) => setFormData({...formData, startTime: Number(e.target.value)})}
                    className={`w-full px-3 py-2.5 border rounded-lg focus:outline-none font-medium ${isDarkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'}`}
                  >
                    {timeSlots.map(t => (
                        <option key={t} value={t}>{formatTime(t)}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={`block text-xs font-bold uppercase tracking-wider mb-1.5 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Duration</label>
                  <select
                    value={formData.duration}
                    onChange={(e) => setFormData({...formData, duration: Number(e.target.value)})}
                    className={`w-full px-3 py-2.5 border rounded-lg focus:outline-none font-medium ${isDarkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'}`}
                  >
                    <option value={1}>1h</option><option value={2}>2h</option><option value={3}>3h</option><option value={4}>4h</option>
                  </select>
                </div>
              </div>

              {/* End Time Preview */}
              <div className={`text-xs font-medium text-right -mt-2 ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                Ends at: <span className={`${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>{formatTime(Number(formData.startTime) + Number(formData.duration))}</span>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={`block text-xs font-bold uppercase tracking-wider mb-1.5 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Type</label>
                  <select
                    value={formData.type}
                    onChange={(e) => {
                      const newType = e.target.value;
                      setFormData({
                        ...formData, 
                        type: newType,
                        color: newType === 'Lunch' ? 'slate' : (formData.color === 'slate' ? 'blue' : formData.color)
                      });
                    }}
                    className={`w-full px-3 py-2.5 border rounded-lg focus:outline-none font-medium ${isDarkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'}`}
                  >
                    <option>Lecture</option> <option>Lab</option> <option>Tutorial</option> <option>Seminar</option> <option>Lunch</option>
                  </select>
                </div>
                 <div>
                  <label className={`block text-xs font-bold uppercase tracking-wider mb-1.5 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Location</label>
                  <input
                    type="text"
                    value={formData.room}
                    onChange={(e) => setFormData({...formData, room: e.target.value})}
                    placeholder="Room 304"
                    className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium ${isDarkMode ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-500' : 'bg-slate-50 border-slate-200 text-slate-900'}`}
                  />
                </div>
              </div>

              <div>
                <label className={`block text-xs font-bold uppercase tracking-wider mb-2 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Color</label>
                <div className="flex gap-3">
                  {colors.map(color => (
                    <button
                      key={color.name}
                      onClick={() => setFormData({...formData, color: color.name})}
                      className={`w-8 h-8 rounded-full border-2 transition-transform hover:scale-110 ${
                        color.name === 'blue' ? 'bg-blue-200 border-blue-400' :
                        color.name === 'purple' ? 'bg-purple-200 border-purple-400' :
                        color.name === 'emerald' ? 'bg-emerald-200 border-emerald-400' :
                        color.name === 'orange' ? 'bg-orange-200 border-orange-400' :
                        color.name === 'rose' ? 'bg-rose-200 border-rose-400' : 'bg-slate-200 border-slate-400'
                      } ${formData.color === color.name ? 'ring-2 ring-slate-400 scale-110' : 'opacity-70'}`}
                    />
                  ))}
                </div>
              </div>

              {formData.duration > 1 && (
                <Alert className={`${isDarkMode ? 'bg-amber-900/20 border-amber-800 text-amber-200' : 'bg-amber-50 border-amber-200 text-amber-800'} py-2 px-3`}>
                  <div className="flex gap-2 items-center">
                    <AlertCircle size={14} />
                    <span className="text-xs">Merges {formData.duration} slots. Overwrites overlaps.</span>
                  </div>
                </Alert>
              )}
            </div>

            <div className={`p-4 border-t flex justify-between ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-100'}`}>
              {editingEvent ? (
                <button onClick={handleDelete} className="px-4 py-2 text-rose-600 hover:bg-rose-500/10 rounded-lg font-medium flex items-center gap-2">
                  <Trash2 size={18} /> Delete
                </button>
              ) : <div></div>}
              <div className="flex gap-3">
                <button onClick={() => setIsModalOpen(false)} className={`px-4 py-2 rounded-lg font-medium ${isDarkMode ? 'text-slate-400 hover:bg-slate-700' : 'text-slate-600 hover:bg-slate-200'}`}>Cancel</button>
                <button onClick={handleSave} className="px-6 py-2 bg-slate-900 text-white hover:bg-slate-800 rounded-lg font-medium shadow-lg flex items-center gap-2 dark:bg-indigo-600 dark:hover:bg-indigo-500">
                  <Save size={18} /> Save
                </button>
              </div>
            </div>
          </div>
      </div>}

      {/* --- LOCATION MANAGER MODAL --- */}
      {isLocationManagerOpen && <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className={`rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200 flex flex-col max-h-[80vh] ${isDarkMode ? 'bg-slate-900' : 'bg-white'}`}>
            <div className={`px-6 py-4 border-b flex justify-between items-center ${isDarkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-800 border-slate-700 text-white'}`}>
              <h2 className="text-lg font-bold flex items-center gap-2">
                <MapPin size={20} /> Location Guide
              </h2>
              <button onClick={() => setIsLocationManagerOpen(false)} className="text-slate-400 hover:text-white">
                <X size={20} />
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1">
              <p className={`text-sm mb-4 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Map your room codes to actual building locations so you never get lost.</p>
              
              <div className={`flex gap-2 mb-6 items-end p-3 rounded-lg border ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-100'}`}>
                <div className="w-1/3">
                  <label className={`block text-xs font-bold uppercase mb-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-400'}`}>Room/Code</label>
                  <input
                    type="text"
                    value={newLocation.room}
                    onChange={(e) => setNewLocation({...newLocation, room: e.target.value})}
                    placeholder="101"
                    className={`w-full px-3 py-2 border rounded focus:border-blue-500 outline-none text-sm ${isDarkMode ? 'bg-slate-900 border-slate-700 text-white' : 'border-slate-300'}`}
                  />
                </div>
                <div className="flex-1">
                  <label className={`block text-xs font-bold uppercase mb-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-400'}`}>Building / Notes</label>
                  <input
                    type="text"
                    value={newLocation.building}
                    onChange={(e) => setNewLocation({...newLocation, building: e.target.value})}
                    placeholder="Science Block"
                    className={`w-full px-3 py-2 border rounded focus:border-blue-500 outline-none text-sm ${isDarkMode ? 'bg-slate-900 border-slate-700 text-white' : 'border-slate-300'}`}
                  />
                </div>
                <button 
                  onClick={handleAddLocation}
                  disabled={!newLocation.room}
                  className="bg-blue-600 text-white p-2 rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Plus size={20} />
                </button>
              </div>

              <div className="space-y-2">
                {locations.length === 0 && <div className={`text-center py-4 ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>No locations mapped yet.</div>}
                {locations.map(location => (
                  <div key={location.id} className={`flex items-center justify-between p-3 border rounded-lg shadow-sm hover:border-blue-300 transition-colors group ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
                    <div className="flex items-center gap-4">
                      <div className={`font-bold px-2 py-1 rounded text-sm ${isDarkMode ? 'bg-slate-700 text-white' : 'bg-slate-100 text-slate-700'}`}>{location.room}</div>
                      <div className={`text-sm ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>{location.building}</div>
                    </div>
                    <button 
                      onClick={() => handleDeleteLocation(location.id)}
                      className="text-slate-300 hover:text-rose-500 transition-colors p-2"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className={`p-4 border-t text-right ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-slate-50 border-slate-100'}`}>
              <button onClick={() => setIsLocationManagerOpen(false)} className={`px-4 py-2 rounded-lg font-medium ${isDarkMode ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' : 'bg-slate-200 text-slate-700 hover:bg-slate-300'}`}>
                Close
              </button>
            </div>
          </div>
      </div>}
      
      {/* --- SUBJECT MANAGER MODAL --- */}
      {isSubjectManagerOpen && <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className={`rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200 flex flex-col max-h-[80vh] ${isDarkMode ? 'bg-slate-900' : 'bg-white'}`}>
            <div className={`px-6 py-4 border-b flex justify-between items-center ${isDarkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-800 border-slate-700 text-white'}`}>
              <h2 className="text-lg font-bold flex items-center gap-2">
                <GraduationCap size={20} /> Teachers & Subjects
              </h2>
              <button onClick={() => setIsSubjectManagerOpen(false)} className="text-slate-400 hover:text-white">
                <X size={20} />
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1">
              <p className={`text-sm mb-4 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Add subjects here to quickly load them when building your schedule.</p>
              
              <div className={`flex flex-col gap-3 mb-6 p-3 rounded-lg border ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-100'}`}>
                <div className="flex gap-2">
                    <div className="flex-1">
                    <label className={`block text-xs font-bold uppercase mb-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-400'}`}>Subject Name</label>
                    <input
                        type="text"
                        value={newSubject.name}
                        onChange={(e) => setNewSubject({...newSubject, name: e.target.value})}
                        placeholder="Calculus"
                        className={`w-full px-3 py-2 border rounded focus:border-blue-500 outline-none text-sm ${isDarkMode ? 'bg-slate-900 border-slate-700 text-white' : 'border-slate-300'}`}
                    />
                    </div>
                    <div className="flex-1">
                    <label className={`block text-xs font-bold uppercase mb-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-400'}`}>Teacher</label>
                    <input
                        type="text"
                        value={newSubject.teacher}
                        onChange={(e) => setNewSubject({...newSubject, teacher: e.target.value})}
                        placeholder="Dr. Smith"
                        className={`w-full px-3 py-2 border rounded focus:border-blue-500 outline-none text-sm ${isDarkMode ? 'bg-slate-900 border-slate-700 text-white' : 'border-slate-300'}`}
                    />
                    </div>
                </div>
                <div className="flex gap-2 items-end">
                    <div className="flex-1">
                        <label className={`block text-xs font-bold uppercase mb-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-400'}`}>Default Location</label>
                        <input
                            type="text"
                            value={newSubject.room}
                            onChange={(e) => setNewSubject({...newSubject, room: e.target.value})}
                            placeholder="Room 101"
                            className={`w-full px-3 py-2 border rounded focus:border-blue-500 outline-none text-sm ${isDarkMode ? 'bg-slate-900 border-slate-700 text-white' : 'border-slate-300'}`}
                        />
                    </div>
                    <button 
                    onClick={handleAddSubject}
                    disabled={!newSubject.name}
                    className="bg-blue-600 text-white p-2 rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed h-[38px] w-[38px] flex items-center justify-center"
                    >
                    <Plus size={20} />
                    </button>
                </div>
              </div>

              <div className="space-y-2">
                {subjects.length === 0 && <div className={`text-center py-4 ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>No subjects added yet.</div>}
                {subjects.map(subject => (
                  <div key={subject.id} className={`flex items-center justify-between p-3 border rounded-lg shadow-sm hover:border-blue-300 transition-colors group ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
                    <div>
                      <div className={`font-bold ${isDarkMode ? 'text-slate-200' : 'text-slate-800'}`}>{subject.name}</div>
                      <div className={`text-xs flex items-center gap-3 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                        <span className="flex items-center gap-1"><User size={12} /> {subject.teacher || "No Teacher"}</span>
                        {subject.room && <span className="flex items-center gap-1"><MapPin size={12} /> {subject.room}</span>}
                      </div>
                    </div>
                    <button 
                      onClick={() => handleDeleteSubject(subject.id)}
                      className="text-slate-300 hover:text-rose-500 transition-colors p-2"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className={`p-4 border-t text-right ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-slate-50 border-slate-100'}`}>
              <button onClick={() => setIsSubjectManagerOpen(false)} className={`px-4 py-2 rounded-lg font-medium ${isDarkMode ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' : 'bg-slate-200 text-slate-700 hover:bg-slate-300'}`}>
                Close
              </button>
            </div>
          </div>
        </div>
      }

      {/* --- PRIVACY POLICY MODAL --- */}
      {isPrivacyOpen && <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className={`rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200 flex flex-col max-h-[80vh] ${isDarkMode ? 'bg-slate-900' : 'bg-white'}`}>
            <div className={`px-6 py-4 border-b flex justify-between items-center ${isDarkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-800 border-slate-700 text-white'}`}>
              <h2 className="text-lg font-bold flex items-center gap-2">
                <Shield size={20} /> Privacy Policy
              </h2>
              <button onClick={() => setIsPrivacyOpen(false)} className="text-slate-400 hover:text-white">
                <X size={20} />
              </button>
            </div>

            <div className={`p-6 overflow-y-auto flex-1 text-sm leading-relaxed ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                <h3 className={`font-bold text-base mb-2 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>1. Data Storage</h3>
                <p className="mb-4">This University Schedule Builder stores your schedule data locally on your device using your browser's LocalStorage. We do not transmit or sell your personal schedule data to third parties.</p>

                <h3 className={`font-bold text-base mb-2 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>2. Google AdSense</h3>
                <p className="mb-4">This website uses Google AdSense to display advertisements. Google uses cookies to serve ads based on your prior visits to this website or other websites.</p>
                <ul className="list-disc pl-5 mb-4 space-y-1">
                    <li>Google's use of advertising cookies enables it and its partners to serve ads to you based on your visit to this site and/or other sites on the Internet.</li>
                    <li>You may opt out of personalized advertising by visiting <a href="https://www.google.com/settings/ads" target="_blank" className="text-blue-500 hover:underline">Ads Settings</a>.</li>
                </ul>

                <h3 className={`font-bold text-base mb-2 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>3. Firebase</h3>
                <p className="mb-4">We use Google Firebase to facilitate the "Share Link" feature. When you choose to share a schedule, a copy of that specific timetable is uploaded to a secure database to generate a shareable link. No personal identifiable information (PII) is linked to this data.</p>
            </div>

            <div className={`p-4 border-t text-right ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-slate-50 border-slate-100'}`}>
              <button onClick={() => setIsPrivacyOpen(false)} className={`px-4 py-2 rounded-lg font-medium ${isDarkMode ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' : 'bg-slate-200 text-slate-700 hover:bg-slate-300'}`}>
                Close
              </button>
            </div>
          </div>
      </div>}

    </div>
  );
}