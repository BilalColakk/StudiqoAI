import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast, { Toaster } from 'react-hot-toast';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import {
  BookOpen, CalendarCheck, CheckCircle, Clock,
  Zap, ArrowRight, RefreshCw, TrendingUp, Play, Pause, Square, SkipForward
} from 'lucide-react';
import Navbar from '../components/Navbar';
import StatCard from '../components/StatCard';
import ProgressRing from '../components/ProgressRing';
import LoadingSkeleton from '../components/LoadingSkeleton';
import PageTransition from '../components/PageTransition';
import FocusOverlay from '../components/FocusOverlay';
import OnboardingWizard from '../components/OnboardingWizard';
import {
  getCourses, getExams, getLatestPlan,
  getPlanProgress, generatePlan, regenerateAdaptive, completeEntry, skipEntry,
  getProductivityStats
} from '../api/endpoints';
import { useTranslation } from '../i18n';

const COLORS = ['#6C63FF','#00D2FF','#F59E0B','#22C55E','#EF4444','#EC4899','#8B5CF6','#14B8A6'];
const ACTIVE_SESSION_KEY = 'activeStudySession';
const BEEP_URL = '/beep.mp3';

const CustomTooltip = ({ active, payload }) => {
  if (active && payload?.length) {
    return (
      <div style={{
        background: 'var(--bg-surface)', border: '1px solid var(--border)',
        borderRadius: 10, padding: '8px 14px', fontSize: 13,
      }}>
        <span style={{ color: payload[0].payload.fill }}>{payload[0].name}: </span>
        <strong style={{ color: 'var(--text-primary)' }}>{payload[0].value}h</strong>
      </div>
    );
  }
  return null;
};

function formatSeconds(totalSeconds) {
  const safe = Math.max(0, totalSeconds);
  const hours = Math.floor(safe / 3600);
  const minutes = Math.floor((safe % 3600) / 60);
  const seconds = safe % 60;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

function calculateRemainingSeconds(session) {
  if (!session) return 0;

  if (!session.isRunning) {
    return Math.max(0, session.remainingSeconds ?? 0);
  }

  const elapsed = Math.floor((Date.now() - session.startedAt) / 1000);
  return Math.max(0, session.durationSeconds - elapsed);
}

function persistSession(session) {
  if (!session) {
    localStorage.removeItem(ACTIVE_SESSION_KEY);
    return;
  }
  localStorage.setItem(ACTIVE_SESSION_KEY, JSON.stringify(session));
}

async function ensureNotificationPermission() {
  if (!('Notification' in window)) return false;
  if (Notification.permission === 'granted') return true;
  if (Notification.permission === 'denied') return false;

  const result = await Notification.requestPermission();
  return result === 'granted';
}

function sendSessionFinishedNotification(courseName) {
  if ('Notification' in window && Notification.permission === 'granted') {
    new Notification('Çalışma bloğu bitti', {
      body: `${courseName} oturumu tamamlandı. İstersen mola ver.`,
    });
  }
  const audio = new Audio(BEEP_URL);
  audio.play().catch(() => {});
}

export default function Dashboard() {
  const navigate  = useNavigate();
  const { t }     = useTranslation();
  const email     = localStorage.getItem('userEmail') || '';
  const [courses,  setCourses]  = useState([]);
  const [exams,    setExams]    = useState([]);
  const [plan,     setPlan]     = useState(null);
  const [progress, setProgress] = useState(null);
  const [stats,    setStats]    = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [genLoad,  setGenLoad]  = useState(false);
  const [activeSession, setActiveSession] = useState(null);
  const [sessionFinished, setSessionFinished] = useState(false);
  const [showFocusOverlay, setShowFocusOverlay] = useState(false);
  
  const [reviewEntryId, setReviewEntryId] = useState(null);
  const [sessionNotes, setSessionNotes] = useState('');

  // preferred_block_hours — localStorage'dan oku, StudyPlan ile senkron
  const blockH = parseInt(localStorage.getItem('preferredBlockHours') || '2', 10);

  useEffect(() => { loadAll(); }, []);

  useEffect(() => {
    const raw = localStorage.getItem(ACTIVE_SESSION_KEY);
    if (!raw) return;

    try {
      const parsed = JSON.parse(raw);
      const remaining = calculateRemainingSeconds(parsed);

      if (remaining <= 0) {
        localStorage.removeItem(ACTIVE_SESSION_KEY);
        return;
      }

      if (parsed.isRunning) {
        setActiveSession({ ...parsed, remainingSeconds: remaining });
      } else {
        setActiveSession(parsed);
      }
    } catch {
      localStorage.removeItem(ACTIVE_SESSION_KEY);
    }
  }, []);

  useEffect(() => {
    if (!activeSession) return;
    if (!activeSession.isRunning) return;

    const interval = setInterval(() => {
      setActiveSession(prev => {
        if (!prev) return null;

        const remaining = calculateRemainingSeconds(prev);

        if (remaining <= 0) {
          const finishedSession = {
            ...prev,
            remainingSeconds: 0,
            isRunning: false,
          };

          persistSession(finishedSession);
          setSessionFinished(true);
          toast.success(`⏰ ${prev.courseName} oturumu bitti!`);
          sendSessionFinishedNotification(prev.courseName);

          return finishedSession;
        }

        const updated = { ...prev, remainingSeconds: remaining };
        persistSession(updated);
        return updated;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [activeSession?.isRunning]);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [cRes, eRes, prRes, stRes] = await Promise.allSettled([
        getCourses(), getExams(), getPlanProgress(), getProductivityStats()
      ]);
      if (cRes.status === 'fulfilled') setCourses(cRes.value.data.courses || []);
      if (eRes.status === 'fulfilled') setExams(eRes.value.data.exams  || []);
      if (prRes.status === 'fulfilled') setProgress(prRes.value.data);
      if (stRes.status === 'fulfilled') setStats(stRes.value.data);

      try {
        const pRes = await getLatestPlan();
        setPlan(pRes.data);
      } catch {
        setPlan(null);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = async (adaptive = false) => {
    setGenLoad(true);
    try {
      const fn = adaptive ? regenerateAdaptive : generatePlan;
      await fn({ preferred_block_hours: blockH });
      toast.success(adaptive ? t('PLAN_ADAPTIVE_OK') : t('PLAN_SUCCESS'));
      await loadAll();
    } catch (err) {
      toast.error(err.response?.data?.detail || t('PLAN_ERR'));
    } finally {
      setGenLoad(false);
    }
  };

  const today = new Date().toISOString().split('T')[0];
  const todayEntriesRaw = plan?.weekly_plan?.find(d => d.date === today)?.entries;
  const todayEntries = Array.isArray(todayEntriesRaw) ? todayEntriesRaw : [];
  const studyEntries = todayEntries.filter(e => e.type === 'study');

  const courseHours = {};
  (plan?.weekly_plan || []).forEach(day => {
    const entries = Array.isArray(day.entries) ? day.entries : [];
    entries.forEach(e => {
      if (e.type === 'study' && e.course_name) {
        courseHours[e.course_name] = (courseHours[e.course_name] || 0) + (e.study_hours || 0);
      }
    });
  });

  const chartData = Object.entries(courseHours).map(([name, hours], i) => ({
    name,
    value: parseFloat(hours.toFixed(1)),
    fill: COLORS[i % COLORS.length],
  }));

  const upcomingExams = exams
    .filter(e => e.exam_date && new Date(e.exam_date) >= new Date())
    .sort((a, b) => new Date(a.exam_date) - new Date(b.exam_date))
    .slice(0, 3);

  const veryCloseExams = upcomingExams.filter(e => {
    const diffTime = Math.abs(new Date(e.exam_date) - new Date());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 3;
  });

  const activeEntryId = activeSession?.entryId ?? null;

  const activeEntry = useMemo(() => {
    if (!activeEntryId) return null;
    return studyEntries.find(e => e.id === activeEntryId) || null;
  }, [studyEntries, activeEntryId]);

  const startSession = async (entry) => {
    if (!entry || entry.status !== 'pending') return;

    if (activeSession && activeSession.entryId !== entry.id && activeSession.remainingSeconds > 0) {
      toast.error(t('SESSION_ACTIVE'));
      return;
    }

    await ensureNotificationPermission();

    const durationSeconds = (entry.duration_minutes || 0) * 60;

    const session = {
      entryId: entry.id,
      courseName: entry.course_name,
      durationSeconds,
      remainingSeconds: durationSeconds,
      startedAt: Date.now(),
      isRunning: true,
      pauseCount: 0,
    };

    setSessionFinished(false);
    setActiveSession(session);
    persistSession(session);
    setShowFocusOverlay(true);
    toast.success(`${entry.course_name} ${t('SESSION_STARTED')}`);
  };

  const pauseSession = () => {
    setActiveSession(prev => {
      if (!prev) return null;
      const remaining = calculateRemainingSeconds(prev);
      const paused = {
        ...prev,
        remainingSeconds: remaining,
        isRunning: false,
        pauseCount: (prev.pauseCount || 0) + 1,
      };
      persistSession(paused);
      return paused;
    });
  };

  const resumeSession = () => {
    setActiveSession(prev => {
      if (!prev) return null;
      if (prev.remainingSeconds <= 0) return prev;

      const resumed = {
        ...prev,
        durationSeconds: prev.remainingSeconds,
        startedAt: Date.now(),
        isRunning: true,
      };
      persistSession(resumed);
      return resumed;
    });
  };

  const stopSession = () => {
    setActiveSession(null);
    setSessionFinished(false);
    persistSession(null);
    toast(t('SESSION_RESET'));
  };

  const markSessionCompleted = () => {
    if (!activeSession?.entryId) return;
    setReviewEntryId(activeSession.entryId);
    setSessionNotes('');
    setShowFocusOverlay(false);
  };

  const handleDirectComplete = (id) => {
    setReviewEntryId(id);
    setSessionNotes('');
  };

  const submitSessionReview = async () => {
    if (!reviewEntryId) return;

    let focusScore = 100;
    if (activeSession && activeSession.entryId === reviewEntryId) {
      focusScore = Math.max(0, 100 - ((activeSession.pauseCount || 0) * 5));
    }

    try {
      const res = await completeEntry(reviewEntryId, { focus_score: focusScore, notes: sessionNotes });
      toast.success(t('BTN_COMPLETE') + '!');
      
      if (res.data.new_badges?.length > 0) {
        toast.success(`🎉 ${t('BADGE_TITLE').replace('🏆 ', '')}: ${res.data.new_badges.join(', ')}`, { duration: 5000 });
      }

      if (activeSession?.entryId === reviewEntryId) {
        setActiveSession(null);
        setSessionFinished(false);
        persistSession(null);
      }

      setReviewEntryId(null);
      await loadAll();
    } catch {
      toast.error('Oturum tamamlanamadı');
    }
  };

  const handleDirectSkip = async (id) => {
    try {
      await skipEntry(id);
      toast('Görev atlandı', { icon: '⏭️' });
      await loadAll();
    } catch {
      toast.error(t('ERROR_GENERIC'));
    }
  };

  return (
    <>
      <Toaster position="top-right" toastOptions={{
        style: { background: '#0D1117', color: '#F0F4FF', border: '1px solid rgba(255,255,255,0.08)' }
      }} />

      <div className="glow-orb" style={{ width: 500, height: 500, background: '#6C63FF', top: -200, right: -100, opacity: 0.06 }} />
      <div className="glow-orb" style={{ width: 400, height: 400, background: '#00D2FF', bottom: 100, left: -100, opacity: 0.04 }} />

      <div className="app-layout">
        <Navbar />
        <FocusOverlay 
          isOpen={showFocusOverlay}
          onClose={() => setShowFocusOverlay(false)}
          courseName={activeSession?.courseName}
          remainingTime={formatSeconds(activeSession?.remainingSeconds || 0)}
          totalSeconds={activeSession?.durationSeconds || 0}
          remainingSeconds={activeSession?.remainingSeconds || 0}
          isRunning={activeSession?.isRunning}
          onPause={pauseSession}
          onResume={resumeSession}
          onReset={stopSession}
          onComplete={markSessionCompleted}
          isFinished={sessionFinished}
        />
        <main className="main-content">
          <PageTransition>
            <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
              <div>
                <h1 className="page-title">{t('DASH_GREETING')}, {email.split('@')[0]} 👋</h1>
                <p className="page-subtitle">{t('DASH_SUB')}</p>
              </div>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                <motion.button
                  className="btn btn-secondary btn-sm"
                  whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                  onClick={() => handleGenerate(false)}
                  disabled={genLoad}
                >
                  <Play size={14} /> Yeni Plan
                </motion.button>
                <motion.button
                  className="btn btn-primary btn-sm"
                  whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                  onClick={() => handleGenerate(true)}
                  disabled={genLoad}
                >
                  {genLoad
                    ? <RefreshCw size={14} style={{ animation: 'spin 0.7s linear infinite' }} />
                    : <Zap size={14} />
                  }
                  Adaptif Plan
                </motion.button>
              </div>
            </div>

            {loading ? <LoadingSkeleton rows={4} height={100} /> : courses.length === 0 ? (
              <OnboardingWizard onComplete={loadAll} />
            ) : (
              <>
                {/* Sınav Hatırlatıcısı (Task 24) */}
                {veryCloseExams.length > 0 && (
                  <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
                    style={{ 
                      background: 'rgba(236,72,153,0.1)', border: '1px solid rgba(236,72,153,0.3)', 
                      borderRadius: 14, padding: '14px 20px', marginBottom: 24, 
                      display: 'flex', alignItems: 'center', gap: 14, color: 'var(--text-primary)'
                    }}>
                    <div style={{ color: '#EC4899', flexShrink: 0 }}><CalendarCheck size={28} /></div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 14, color: '#EC4899' }}>Sınavlar Yaklaşıyor! 🚨</div>
                      <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                        {veryCloseExams.map(ex => {
                          const courseName = courses.find(c => c.id === ex.course_id)?.course_name || '?';
                          return `${courseName} ${t('EXAM_ALERT').replace(' 🚨','')}`;
                        }).join(" • ")}
                      </div>
                    </div>
                  </motion.div>
                )}

                <div className="grid-4" style={{ marginBottom: 28 }}>
                  <StatCard icon={<BookOpen size={20} />} label={t('STAT_COURSES')} value={courses.length} color="#6C63FF" delay={0} sub="aktif" />
                  <StatCard icon={<CalendarCheck size={20} />} label={t('STAT_EXAM')} value={upcomingExams.length} color="#F59E0B" delay={0.08} sub="bu dönem" />
                  <StatCard icon={<CheckCircle size={20} />} label={t('STAT_COMPLETION')} value={`${progress?.completion_rate_percent ?? 0}%`} color="#22C55E" delay={0.16} sub={`${progress?.completed_entries ?? 0} ${t('SESSIONS_UNIT')}`} />
                  
                  {/* Streak Görselleştirmesi 7 Kutu (Task 30) */}
                  <motion.div className="glass-card" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.24 }}
                    style={{ padding: 20, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                      <div style={{ color: 'var(--text-secondary)', fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Zap size={16} style={{ color: '#F59E0B' }}/> Seri (Streak)
                      </div>
                      <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--text-primary)' }}>{stats?.streak || 0} 🔥</div>
                    </div>
                    <div style={{ display: 'flex', gap: 6 }}>
                      {Array.from({ length: 7 }).map((_, i) => {
                        const d = new Date();
                        d.setDate(d.getDate() - (6 - i));
                        const dStr = d.toISOString().split('T')[0];
                        const count = stats?.heatmap?.[dStr] || 0;
                        return (
                          <div key={i} title={`${dStr}: ${count} seans`} style={{
                            flex: 1, height: 28, borderRadius: 6,
                            background: count > 0 ? (count > 2 ? '#F59E0B' : 'rgba(245,158,11,0.6)') : 'rgba(255,255,255,0.05)',
                            border: count > 0 ? '1px solid rgba(245,158,11,0.8)' : '1px solid var(--border)',
                          }} />
                        )
                      })}
                    </div>
                  </motion.div>
                </div>

                {activeSession && (
                  <motion.div
                    className="glass-card"
                    initial={{ opacity: 0, y: 14 }}
                    animate={{ opacity: 1, y: 0 }}
                    style={{ marginBottom: 28 }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
                      <div>
                        <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 6 }}>
                          Aktif Oturum
                        </div>
                        <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 6 }}>
                          {activeSession.courseName}
                        </div>
                        <div style={{ fontSize: 34, fontWeight: 800, color: sessionFinished ? '#22C55E' : '#6C63FF', fontFamily: "'Space Grotesk', sans-serif" }}>
                          {formatSeconds(activeSession.remainingSeconds)}
                        </div>
                        <div style={{ fontSize: 12, color: '#8892AA', marginTop: 6 }}>
                          {sessionFinished ? 'Süre doldu' : activeSession.isRunning ? 'Sayaç çalışıyor' : 'Duraklatıldı'}
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                        {!sessionFinished && activeSession.isRunning && (
                          <button className="btn btn-secondary btn-sm" onClick={pauseSession}>
                            <Pause size={14} /> Duraklat
                          </button>
                        )}

                        {!sessionFinished && !activeSession.isRunning && activeSession.remainingSeconds > 0 && (
                          <button className="btn btn-primary btn-sm" onClick={resumeSession}>
                            <Play size={14} /> Devam Et
                          </button>
                        )}

                        {(sessionFinished || activeSession.remainingSeconds === 0) && (
                          <button className="btn btn-success btn-sm" onClick={markSessionCompleted}>
                            <CheckCircle size={14} /> Tamamla
                          </button>
                        )}

                        <button className="btn btn-danger btn-sm" onClick={stopSession}>
                          <Square size={14} /> Sıfırla
                        </button>
                      </div>
                    </div>

                    {activeEntry && (
                      <div style={{ marginTop: 16, fontSize: 12, color: '#8892AA' }}>
                        Planlanan saat: {activeEntry.start_time} – {activeEntry.end_time}
                      </div>
                    )}
                  </motion.div>
                )}

                <div className="grid-2" style={{ marginBottom: 28 }}>
                  <motion.div className="glass-card"
                    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                      <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>📅 Bugünkü Program</h3>
                      <button className="btn btn-sm btn-secondary" onClick={() => navigate('/study-plan')}>
                        Tümü <ArrowRight size={12} />
                      </button>
                    </div>

                    {studyEntries.length === 0 ? (
                      <div className="empty-state" style={{ padding: '30px 0' }}>
                        <div style={{ fontSize: 36 }}>☀️</div>
                        <p style={{ color: 'var(--text-secondary)', fontSize: 13 }}>
                          {plan ? 'Bugün için çalışma yok' : 'Henüz plan oluşturulmadı'}
                        </p>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        {studyEntries.slice(0, 6).map((e, i) => {
                          const isThisActive = activeSession?.entryId === e.id;
                          const isPending = e.status === 'pending';

                          return (
                            <motion.div key={e.id}
                              initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: 0.35 + i * 0.07 }}
                              style={{
                                display: 'flex', alignItems: 'center', gap: 12,
                                padding: '10px 14px', borderRadius: 10,
                                background:
                                  e.status === 'completed' ? 'rgba(34,197,94,0.08)' :
                                  e.status === 'skipped' ? 'rgba(239,68,68,0.08)' :
                                  isThisActive ? 'rgba(108,99,255,0.10)' :
                                  'rgba(255,255,255,0.04)',
                                border:
                                  e.status === 'completed' ? '1px solid rgba(34,197,94,0.2)' :
                                  e.status === 'skipped' ? '1px solid rgba(239,68,68,0.2)' :
                                  isThisActive ? '1px solid rgba(108,99,255,0.25)' :
                                  '1px solid rgba(255,255,255,0.06)',
                              }}
                            >
                              <div style={{
                                width: 8, height: 8, borderRadius: '50%', flexShrink: 0,
                                background: e.status === 'completed' ? '#22C55E' : e.status === 'skipped' ? '#EF4444' : '#6C63FF',
                                boxShadow: `0 0 6px ${e.status === 'completed' ? '#22C55E' : e.status === 'skipped' ? '#EF4444' : '#6C63FF'}`,
                              }} />

                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                  {e.course_name}
                                </div>
                                <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
                                  {e.start_time} – {e.end_time}
                                </div>
                              </div>

                              <span style={{ fontSize: 11, color: 'var(--text-secondary)', flexShrink: 0 }}>
                                {isThisActive ? formatSeconds(activeSession.remainingSeconds) : `${e.duration_minutes}${t('MIN_UNIT')}`}
                              </span>

                              {isPending && !isThisActive && (
                                <div style={{ display: 'flex', gap: 6 }}>
                                  <button
                                    className="btn btn-primary btn-sm"
                                    onClick={() => startSession(e)}
                                    disabled={!!activeSession && activeSession.entryId !== e.id && activeSession.remainingSeconds > 0}
                                    title="Sayacı Başlat"
                                  >
                                    <Play size={12} /> {t('BTN_START')}
                                  </button>
                                  <button
                                    className="btn btn-success btn-sm"
                                    style={{ padding: '0 8px' }}
                                    onClick={() => handleDirectComplete(e.id)}
                                    disabled={!!activeSession && activeSession.entryId !== e.id && activeSession.remainingSeconds > 0}
                                    title="Sayacı başlatmadan tamamla"
                                  >
                                    <CheckCircle size={12} />
                                  </button>
                                  <button
                                    className="btn btn-danger btn-sm"
                                    style={{ padding: '0 8px' }}
                                    onClick={() => handleDirectSkip(e.id)}
                                    disabled={!!activeSession && activeSession.entryId !== e.id && activeSession.remainingSeconds > 0}
                                    title="Bu görevi atla"
                                  >
                                    <SkipForward size={12} />
                                  </button>
                                </div>
                              )}

                              {isThisActive && (
                                <span
                                  style={{
                                    fontSize: 11,
                                    fontWeight: 700,
                                    color: '#6C63FF',
                                    background: 'rgba(108,99,255,0.12)',
                                    border: '1px solid rgba(108,99,255,0.25)',
                                    borderRadius: 20,
                                    padding: '4px 10px',
                                    flexShrink: 0,
                                  }}
                                >
                                  {t('ACTIVE_LABEL')}
                                </span>
                              )}
                            </motion.div>
                          );
                        })}
                      </div>
                    )}
                  </motion.div>

                  <motion.div className="glass-card"
                    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.35 }}
                  >
                    <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 20 }}>📊 Genel İlerleme</h3>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 24, marginBottom: 24 }}>
                      <ProgressRing percent={progress?.completion_rate_percent ?? 0} />
                      <div>
                        <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 12 }}>Bu haftanın istatistikleri</div>
                        {[
                          { label: 'Tamamlandı', val: progress?.completed_entries ?? 0, color: '#22C55E' },
                          { label: 'Atlandı', val: progress?.skipped_entries ?? 0, color: '#EF4444' },
                          { label: 'Bekliyor', val: progress?.pending_entries ?? 0, color: '#6C63FF' },
                        ].map(s => (
                          <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                            <div style={{ width: 8, height: 8, borderRadius: '50%', background: s.color, boxShadow: `0 0 6px ${s.color}` }} />
                            <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{s.label}</span>
                            <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)', marginLeft: 'auto' }}>{s.val}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {chartData.length > 0 && (
                      <>
                        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 12 }}>
                          <TrendingUp size={14} style={{ marginRight: 6, verticalAlign: 'middle' }} />
                          {t('COURSE_HOURS')}
                        </div>
                        <ResponsiveContainer width="100%" height={160}>
                          <PieChart>
                            <Pie data={chartData} cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={4} dataKey="value">
                              {chartData.map((item, i) => (
                                <Cell key={i} fill={item.fill} />
                              ))}
                            </Pie>
                            <Tooltip content={<CustomTooltip />} />
                          </PieChart>
                        </ResponsiveContainer>
                      </>
                    )}
                  </motion.div>
                </div>

                {upcomingExams.length > 0 && (
                  <motion.div className="glass-card"
                    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.45 }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                      <h3 style={{ fontSize: 15, fontWeight: 700, color: '#F0F4FF' }}>🎯 Yaklaşan Sınavlar</h3>
                      <button className="btn btn-sm btn-secondary" onClick={() => navigate('/exams')}>
                        Tümünü gör <ArrowRight size={12} />
                      </button>
                    </div>
                    <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
                      {upcomingExams.map((ex, i) => {
                        const days = Math.ceil((new Date(ex.exam_date) - new Date()) / 86400000);
                        const typeColor = { quiz: '#3B82F6', midterm: '#F59E0B', final: '#EF4444', other: '#8892AA' };
                        return (
                          <motion.div key={ex.exam_id}
                            initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.5 + i * 0.08 }}
                            style={{
                              flex: 1, minWidth: 140,
                              padding: '14px 18px', borderRadius: 12,
                              background: 'rgba(255,255,255,0.04)',
                              border: '1px solid rgba(255,255,255,0.08)',
                            }}
                          >
                            <div style={{ fontSize: 11, color: typeColor[ex.exam_type] || '#8892AA', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>
                              {ex.exam_type}
                            </div>
                            <div style={{ fontSize: 14, fontWeight: 700, color: '#F0F4FF', marginBottom: 4 }}>
                              {ex.course_name}
                            </div>
                            <div style={{ fontSize: 12, color: days <= 3 ? '#EF4444' : days <= 7 ? '#F59E0B' : '#8892AA', fontWeight: 600 }}>
                              {days === 0 ? 'Bugün!' : days === 1 ? 'Yarın!' : `${days} gün kaldı`}
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  </motion.div>
                )}
              </>
            )}
          </PageTransition>
        </main>
      </div>

      {/* Session Review Modal (Task 23) */}
      {reviewEntryId && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            style={{ background: 'var(--bg-card)', padding: 24, borderRadius: 16, width: '100%', maxWidth: 400, border: '1px solid var(--border)' }}>
            <h3 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8 }}>{t('MODAL_REVIEW_TITLE')}</h3>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 20 }}>
              {t('MODAL_REVIEW_DESC')}
            </p>
            <textarea
              autoFocus
              className="input"
              style={{ minHeight: 100, marginBottom: 20, resize: 'none' }}
              placeholder={t('MODAL_REVIEW_PH')}
              value={sessionNotes}
              onChange={e => setSessionNotes(e.target.value)}
            />
            <div style={{ display: 'flex', gap: 12 }}>
              <button 
                className="btn btn-secondary" 
                style={{ flex: 1 }} 
                onClick={() => setReviewEntryId(null)}
              >
                {t('BTN_CANCEL')}
              </button>
              <button 
                className="btn btn-primary" 
                style={{ flex: 1 }}
                onClick={submitSessionReview}
              >
                {t('BTN_SAVE')}
              </button>
            </div>
          </motion.div>
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </>
  );
}