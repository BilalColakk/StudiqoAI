import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast, { Toaster } from 'react-hot-toast';
import { format, parseISO, isToday, isPast } from 'date-fns';
import { tr } from 'date-fns/locale';
import {
  CheckCircle, XCircle, Clock, BookOpen,
  Coffee, Zap, RefreshCw, Play, ChevronDown, ChevronUp, BarChart2
} from 'lucide-react';
import Navbar from '../components/Navbar';
import LoadingSkeleton from '../components/LoadingSkeleton';
import PageTransition from '../components/PageTransition';
import ProgressRing from '../components/ProgressRing';
import {
  getLatestPlan, getPlanProgress, generatePlan,
  regenerateAdaptive, completeEntry, skipEntry
} from '../api/endpoints';

const COURSE_COLORS = ['#6C63FF','#00D2FF','#F59E0B','#22C55E','#EF4444','#EC4899','#8B5CF6','#14B8A6'];
const colorMap = {};
let colorIndex = 0;
function getCourseColor(name) {
  if (!colorMap[name]) colorMap[name] = COURSE_COLORS[colorIndex++ % COURSE_COLORS.length];
  return colorMap[name];
}

function EntryBlock({ entry, onComplete, onSkip }) {
  const isStudy = entry.type === 'study';
  const color   = isStudy ? getCourseColor(entry.course_name) : '#4A5568';
  const statusCompleted = entry.status === 'completed';
  const statusSkipped   = entry.status === 'skipped';

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      style={{
        display: 'flex', gap: 12, alignItems: 'flex-start',
        padding: '12px 14px', borderRadius: 12,
        background: statusCompleted ? 'rgba(34,197,94,0.08)' :
                    statusSkipped   ? 'rgba(239,68,68,0.06)' :
                    isStudy         ? `${color}0F` : 'rgba(255,255,255,0.03)',
        border: `1px solid ${
          statusCompleted ? 'rgba(34,197,94,0.2)' :
          statusSkipped   ? 'rgba(239,68,68,0.15)' :
          isStudy         ? `${color}30` : 'rgba(255,255,255,0.06)'
        }`,
        opacity: statusSkipped ? 0.6 : 1,
        transition: 'all 0.3s',
      }}
    >
      {/* Color tag */}
      <div style={{
        width: 4, borderRadius: 4, flexShrink: 0, alignSelf: 'stretch',
        background: statusCompleted ? '#22C55E' : statusSkipped ? '#EF4444' : color,
        minHeight: 36,
      }} />

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
          {isStudy ? <BookOpen size={12} style={{ color }} /> : <Coffee size={12} color="#4A5568" />}
          <span style={{
            fontSize: 13, fontWeight: 700, color: '#F0F4FF',
            textDecoration: statusSkipped ? 'line-through' : 'none',
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          }}>
            {isStudy ? entry.course_name : 'Mola'}
          </span>
          {statusCompleted && <CheckCircle size={12} color="#22C55E" />}
          {statusSkipped   && <XCircle    size={12} color="#EF4444" />}
        </div>
        <div style={{ fontSize: 11, color: '#8892AA', display: 'flex', gap: 10 }}>
          <span><Clock size={10} style={{ verticalAlign: 'middle' }} /> {entry.start_time}–{entry.end_time}</span>
          <span>{entry.duration_minutes}dk</span>
          {isStudy && entry.exam_type && (
            <span style={{ color: entry.exam_type === 'final' ? '#EF4444' : '#F59E0B', fontWeight: 600, textTransform: 'uppercase', fontSize: 10 }}>
              {entry.exam_type}
            </span>
          )}
        </div>
      </div>

      {isStudy && entry.status === 'pending' && (
        <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
          <motion.button
            className="btn btn-success btn-sm"
            style={{ padding: '5px 10px', fontSize: 11 }}
            whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.94 }}
            onClick={() => onComplete(entry.id)}
            title="Tamamla"
          >
            <CheckCircle size={12} /> Tamam
          </motion.button>
          <motion.button
            className="btn btn-danger btn-sm"
            style={{ padding: '5px 10px', fontSize: 11 }}
            whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.94 }}
            onClick={() => onSkip(entry.id)}
            title="Atla"
          >
            <XCircle size={12} />
          </motion.button>
        </div>
      )}
    </motion.div>
  );
}

function DayColumn({ dayData, onComplete, onSkip }) {
  const [expanded, setExpanded] = useState(true);
  const date     = parseISO(dayData.date);
  const isNow    = isToday(date);
  const wasPast  = isPast(date) && !isNow;
  const label    = format(date, 'EEEE', { locale: tr });
  const numLabel = format(date, 'd MMM',  { locale: tr });
  const studyCount   = dayData.entries.filter(e => e.type === 'study').length;
  const doneCount    = dayData.entries.filter(e => e.status === 'completed').length;

  return (
    <motion.div
      layout
      className="glass-card"
      style={{
        borderColor: isNow ? 'rgba(108,99,255,0.4)' : undefined,
        boxShadow:   isNow ? '0 0 24px rgba(108,99,255,0.12)' : undefined,
        opacity: wasPast ? 0.75 : 1,
      }}
    >
      {/* Day header */}
      <div
        style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: expanded ? 14 : 0, cursor: 'pointer' }}
        onClick={() => setExpanded(p => !p)}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {isNow && (
            <span style={{ fontSize: 10, fontWeight: 700, color: '#6C63FF', background: 'rgba(108,99,255,0.15)', border: '1px solid rgba(108,99,255,0.3)', borderRadius: 20, padding: '2px 8px', letterSpacing: '0.04em' }}>
              BUGÜN
            </span>
          )}
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#F0F4FF', textTransform: 'capitalize' }}>{label}</div>
            <div style={{ fontSize: 11, color: '#8892AA' }}>{numLabel}</div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 12, color: '#8892AA' }}>{doneCount}/{studyCount}</span>
          {expanded ? <ChevronUp size={14} color="#8892AA" /> : <ChevronDown size={14} color="#8892AA" />}
        </div>
      </div>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.2 }}
            style={{ overflow: 'hidden' }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {dayData.entries.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '16px 0', color: '#4A5568', fontSize: 13 }}>
                  Dinlenme günü 😴
                </div>
              ) : (
                dayData.entries.map(entry => (
                  <EntryBlock key={entry.id} entry={entry} onComplete={onComplete} onSkip={onSkip} />
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default function StudyPlan() {
  const [plan,     setPlan]     = useState(null);
  const [progress, setProgress] = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [genLoad,  setGenLoad]  = useState(false);
  const [blockH,   setBlockH]   = useState(2);
  const [studyDays, setStudyDays] = useState([0, 1, 2, 3, 4, 5, 6]); // All days by default

  const daysLabels = [
    { id: 0, label: 'Pzt' }, { id: 1, label: 'Sal' }, { id: 2, label: 'Çar' },
    { id: 3, label: 'Per' }, { id: 4, label: 'Cum' }, { id: 5, label: 'Cmt' }, { id: 6, label: 'Paz' }
  ];

  const toggleDay = (id) => {
    setStudyDays(prev => 
      prev.includes(id) ? prev.filter(d => d !== id) : [...prev, id]
    );
  };
 Kinder
  useEffect(() => { loadPlan(); }, []);

  const loadPlan = async () => {
    setLoading(true);
    try {
      const [pRes, prRes] = await Promise.allSettled([getLatestPlan(), getPlanProgress()]);
      if (pRes.status  === 'fulfilled') setPlan(pRes.value.data);
      if (prRes.status === 'fulfilled') setProgress(prRes.value.data);
    } finally { setLoading(false); }
  };

  const handleGenerate = async (adaptive = false) => {
    setGenLoad(true);
    try {
      const fn = adaptive ? regenerateAdaptive : generatePlan;
      if (studyDays.length === 0) {
        toast.error('En az bir gün seçmelisiniz!');
        setGenLoad(false);
        return;
      }
      await fn({ 
        preferred_block_hours: blockH,
        study_days: studyDays
      });
      toast.success(adaptive ? '🧠 Adaptif plan oluşturuldu!' : '✅ Plan oluşturuldu!');
      await loadPlan();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Plan oluşturulamadı');
    } finally { setGenLoad(false); }
  };

  const handleComplete = async (id) => {
    try {
      await completeEntry(id);
      toast.success('Oturum tamamlandı! 🎉');
      await loadPlan();
    } catch { toast.error('Güncellenemedi'); }
  };

  const handleSkip = async (id) => {
    try {
      await skipEntry(id);
      toast.success('Oturum atlandı');
      await loadPlan();
    } catch { toast.error('Güncellenemedi'); }
  };

  const pct = progress?.completion_rate_percent ?? 0;

  return (
    <>
      <Toaster position="top-right" toastOptions={{
        style: { background: '#0D1117', color: '#F0F4FF', border: '1px solid rgba(255,255,255,0.08)' }
      }} />
      <div className="glow-orb" style={{ width: 500, height: 500, background: '#6C63FF', top: -200, left: -100, opacity: 0.05 }} />

      <div className="app-layout">
        <Navbar />
        <main className="main-content">
          <PageTransition>
            {/* Header */}
            <div className="page-header">
              <h1 className="page-title">Çalışma Planım 📋</h1>
              <p className="page-subtitle">Haftalık çalışma programı · AI tarafından oluşturuldu</p>
            </div>

            {/* Control Bar */}
            <motion.div className="glass-card"
              initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
              style={{ marginBottom: 24 }}
            >
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 20, alignItems: 'center', justifyContent: 'space-between' }}>
                {/* Progress summary */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
                  <ProgressRing percent={pct} size={80} stroke={7} />
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#F0F4FF', marginBottom: 6 }}>
                      <BarChart2 size={14} style={{ verticalAlign: 'middle', marginRight: 6 }} />
                      Tamamlanma Oranı
                    </div>
                    {progress && (
                      <div style={{ display: 'flex', gap: 16, fontSize: 12, color: '#8892AA' }}>
                        <span style={{ color: '#22C55E' }}>✓ {progress.completed_entries} tamam</span>
                        <span style={{ color: '#EF4444' }}>✗ {progress.skipped_entries} atlandı</span>
                        <span style={{ color: '#6C63FF' }}>◎ {progress.pending_entries} bekliyor</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Block hours + buttons */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14, alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: 12, color: '#8892AA', marginBottom: 6 }}>
                      Blok Süresi: <strong style={{ color: '#F0F4FF' }}>{blockH} saat</strong>
                    </div>
                    <input type="range" className="slider" min={1} max={4}
                      value={blockH} onChange={e => setBlockH(Number(e.target.value))}
                      style={{ width: 120 }} />
                  </div>

                  <div>
                    <div style={{ fontSize: 12, color: '#8892AA', marginBottom: 6 }}>Çalışma Günleri:</div>
                    <div style={{ display: 'flex', gap: 4 }}>
                      {daysLabels.map(d => (
                        <button
                          key={d.id}
                          onClick={() => toggleDay(d.id)}
                          style={{
                            width: 32, height: 32, borderRadius: 8, fontSize: 10, fontWeight: 700,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            cursor: 'pointer', transition: 'all 0.2s',
                            background: studyDays.includes(d.id) ? 'var(--accent-1)' : 'var(--bg-card)',
                            color: studyDays.includes(d.id) ? '#fff' : 'var(--text-secondary)',
                            border: studyDays.includes(d.id) ? '1px solid var(--accent-1)' : '1px solid var(--border)',
                          }}
                        >
                          {d.label}
                        </button>
                      ))}
                    </div>
                  </div>
 Kinder
                  <motion.button className="btn btn-secondary btn-sm"
                    whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                    onClick={() => handleGenerate(false)} disabled={genLoad}>
                    <Play size={14} /> Yeni Plan
                  </motion.button>
                  <motion.button className="btn btn-primary btn-sm"
                    whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                    onClick={() => handleGenerate(true)} disabled={genLoad}>
                    {genLoad
                      ? <RefreshCw size={14} style={{ animation: 'spin 0.7s linear infinite' }} />
                      : <Zap size={14} />
                    }
                    Adaptif Plan
                  </motion.button>
                </div>
              </div>

              {/* Progress bar */}
              {pct > 0 && (
                <div style={{ marginTop: 20 }}>
                  <div className="progress-bar">
                    <div className="progress-fill" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              )}
            </motion.div>

            {/* Weekly grid */}
            {loading ? <LoadingSkeleton rows={3} height={200} /> : (
              !plan ? (
                <div className="empty-state">
                  <div className="empty-icon">📋</div>
                  <h3 style={{ fontSize: 16, fontWeight: 700, color: '#F0F4FF' }}>Henüz plan oluşturulmadı</h3>
                  <p style={{ color: '#8892AA', fontSize: 14, maxWidth: 320, textAlign: 'center' }}>
                    Derslerini ve müsaitliğini ayarla, sonra AI planını oluştur
                  </p>
                  <button className="btn btn-primary" onClick={() => handleGenerate(false)} disabled={genLoad}>
                    <Play size={16} /> Plan Oluştur
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <AnimatePresence>
                    {plan.weekly_plan.map((day, i) => (
                      <motion.div key={day.date}
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05 }}
                      >
                        <DayColumn dayData={day} onComplete={handleComplete} onSkip={handleSkip} />
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              )
            )}
          </PageTransition>
        </main>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </>
  );
}